import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { classroomAllowance, licenceStatus, planLabel } from "@/lib/repo/entitlement";
import { getSchool } from "@/lib/repo/school";
import { buildSchoolReport } from "@/lib/repo/report";
import { listBenchmarksForSchool } from "@/lib/repo/progress";
import { summariseCohortBenchmark } from "@/lib/domain/benchmark";
import { daysBetween, formatDate } from "@/lib/domain/retention";
import { MISSIONS } from "@/content/missions";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { ButtonLink } from "@/components/ui/Button";
import { Note, Stat, Tag } from "@/components/ui/Bits";
import { SchoolForm } from "./SchoolForm";
import { PlanForm } from "./PlanForm";
import { WindowForm } from "./WindowForm";
import { RolloverForm } from "./RolloverForm";
import { AcademicDatesForm } from "./AcademicDatesForm";
import { previewRollover } from "@/lib/domain/rollover";
import { listClasses } from "@/lib/repo/classroom";

export const metadata: Metadata = { title: "Program and plan" };

export default async function AdminProgram() {
  const { user } = await requireAdmin();
  const db = getDb();
  const school = getSchool(db, user.school_id)!;
  const now = new Date();
  const report = buildSchoolReport(db, user.school_id, now);
  const bench = summariseCohortBenchmark(listBenchmarksForSchool(db, user.school_id));
  const renewalIn = daysBetween(now, new Date(school.term_renews_on));

  const checklist = [
    {
      label: "Classes set up",
      done: report.totals.classes > 0,
      detail: `${report.totals.classes} classes, ${report.totals.students} students`,
    },
    {
      label: "Educator orientation completed",
      done: report.certification.completed === report.certification.total && report.certification.total > 0,
      detail: `${report.certification.completed} of ${report.certification.total} teachers`,
    },
    {
      label: "Fall check-in window",
      done: bench.preCompleted > 0,
      detail: `${bench.preCompleted} students completed`,
    },
    {
      label: "Every mission in use",
      done: report.missions.every((m) => m.assignedTo > 0),
      detail: `${report.missions.filter((m) => m.assignedTo > 0).length} of ${MISSIONS.length} assigned somewhere`,
    },
    {
      label: "Spring check-in window",
      done: bench.postCompleted > 0,
      detail:
        bench.postCompleted > 0
          ? `${bench.postCompleted} students completed`
          : "Not run yet",
    },
    {
      label: "Annual report exported",
      done: false,
      detail: "Available now for the district office",
    },
  ];

  // Read-only entitlement, computed rather than displayed from a field the
  // school can edit. Seats in use are children on active rosters; archived
  // cohorts kept for retention do not consume a new year's places.
  const licence = licenceStatus(db, school.id);
  // Shown so an administrator on the classroom plan learns the limit before
  // filling in the create form, not after.
  const rooms = classroomAllowance(db, school.id);
  // Not a ternary ending in "Classroom": that labelled every unrecognised
  // value as the cheapest plan while the lookup granted the most expensive
  // behaviour. `planLabel` says so instead.
  const label = planLabel(school.plan);

  return (
    <div>
      <PageHeader
        eyebrow="Administrator"
        title="Program status and plan"
        description={`Where ${school.name} is in the ${report.school.schoolYear} programme year, and what happens at renewal.`}
        actions={
          <ButtonLink href="/admin/report" variant="secondary">
            Open the annual report
          </ButtonLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat
          label="Plan"
          value={label}
          tone={rooms.recognised ? "neutral" : "berry"}
          hint={rooms.recognised ? undefined : "Ask your account contact to correct it"}
        />
        <Stat
          label="Active classrooms"
          value={
            !rooms.recognised
              ? String(rooms.active)
              : rooms.limit === null
                ? String(rooms.active)
                : `${rooms.active} of ${rooms.limit}`
          }
          hint={
            !rooms.recognised
              ? "No new classrooms can be activated"
              : rooms.limit === null
                ? "No limit on this plan"
                : rooms.active >= rooms.limit
                  ? "Archive one to add another"
                  : "Archived classes do not count"
          }
          tone={
            !rooms.recognised || (rooms.limit !== null && rooms.active >= rooms.limit)
              ? "berry"
              : "neutral"
          }
        />
        <Stat
          label="Student places"
          // A stored value the product would not sell is never presented as a
          // purchased entitlement. "90 of -5" and "5001 licensed" both read as
          // contract facts, and neither was one.
          value={licence.recognised ? `${licence.used} of ${licence.licensed}` : String(licence.used)}
          hint={
            !licence.recognised
              ? "Seat licence needs configuration — no new students can be enrolled"
              : licence.remaining === 0
                ? "No places left"
                : `${licence.remaining} left`
          }
          tone={!licence.recognised || licence.remaining === 0 ? "berry" : "neutral"}
        />
        <Stat label="Term started" value={formatDate(school.term_starts_on)} />
        <Stat
          label={renewalIn < 0 ? "Renewal overdue" : "Renews"}
          value={formatDate(school.term_renews_on)}
          hint={renewalIn < 0 ? `${Math.abs(renewalIn)} days ago` : `in ${renewalIn} days`}
          tone={renewalIn < 0 ? "berry" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Annual programme checklist">
          <PanelBody>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[0.7rem] font-bold ${
                      item.done
                        ? "border-pine bg-pine text-white"
                        : "border-sand-deep bg-surface text-ink-faint"
                    }`}
                  >
                    {item.done ? "✓" : ""}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {item.label}
                      <span className="sr-only">{item.done ? ": done" : ": not done"}</span>
                    </span>
                    <span className="block text-sm text-ink-soft">{item.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>

        <Panel
          title="Academic year"
          description={
            school.year_ends_on
              ? `Currently ${school.academic_year}, ending ${formatDate(school.year_ends_on)}.`
              : "No dates recorded yet. Retention is blocked until they are."
          }
        >
          <PanelBody className="space-y-6">
            <AcademicDatesForm
              academicYear={school.academic_year}
              startsOn={school.year_starts_on}
              endsOn={school.year_ends_on}
            />
            {school.year_ends_on && (
              <RolloverForm preview={previewRollover(school, listClasses(db, school.id, true))} />
            )}
          </PanelBody>
        </Panel>

        <Panel
          title="Check-in windows"
          description="Which annual check-in, if any, students can take right now."
        >
          <PanelBody>
            <WindowForm current={school.benchmark_window} />
          </PanelBody>
        </Panel>

        <Panel
          title="Subscription"
          description="Your entitlement is shown read-only. Requesting a quote does not change it."
        >
          <PanelBody>
            <PlanForm
              plan={school.plan}
              seats={licence.recognised ? licence.licensed : null}
              planLabel={label}
            />
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="School details and branding"
          description="Shown to your staff in the product and printed on the annual report."
        >
          <PanelBody>
            <SchoolForm school={school} />
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Note tone="denim" title="What renewal actually changes">
          The day after the renewal date, classroom changes pause: nobody can start or
          record new work, and rosters, assignments, class codes and check-in windows stop
          accepting changes. Nothing is deleted and nothing is hidden. Your records,
          reports, exports, retention settings and staff administration all keep working,
          because the school owns its records whatever the invoice says. Renewing lifts the
          pause and every class carries on where it stopped.
        </Note>
        <Note tone="neutral" title="Programme contact">
          {school.contact_name} · {school.contact_email}. Quotes, purchase orders and
          invoices go through this person.{" "}
          <Tag className="mt-2">No payment data is stored in this product</Tag>
        </Note>
      </div>
    </div>
  );
}
