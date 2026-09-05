import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { classroomAllowance, licenseStatus, planLabel } from "@/lib/repo/entitlement";
import { getSchool } from "@/lib/repo/school";
import { buildSchoolReport } from "@/lib/repo/report";
import { listBenchmarksForSchool } from "@/lib/repo/progress";
import { summarizeCohortBenchmark } from "@/lib/domain/benchmark";
import { daysBetween, formatDate } from "@/lib/domain/retention";
import { MISSIONS } from "@/content/missions";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { Disclosure } from "@/components/ui/Disclosure";
import { ButtonLink } from "@/components/ui/Button";
import { Note, Stat, Tag } from "@/components/ui/Bits";
import { SchoolForm } from "./SchoolForm";
import { PlanForm } from "./PlanForm";
import { WindowForm } from "./WindowForm";
import { RolloverForm } from "./RolloverForm";
import { AcademicDatesForm } from "./AcademicDatesForm";
import { previewRollover } from "@/lib/domain/rollover";
import { subscriptionState } from "@/lib/domain/subscription";
import {
  ACADEMIC_NEEDS_CONFIGURATION,
  academicSettingsState,
  hasVerifiableAcademicDates,
  isAcademicYearLabel,
  isCalendarDate,
} from "@/lib/domain/calendar";
import { listClasses } from "@/lib/repo/classroom";

export const metadata: Metadata = { title: "Program and plan" };

export default async function AdminProgram() {
  const { user } = await requireAdmin();
  const db = getDb();
  const school = getSchool(db, user.school_id)!;
  const now = new Date();
  const report = buildSchoolReport(db, user.school_id, now);
  const bench = summarizeCohortBenchmark(listBenchmarksForSchool(db, user.school_id));
  // Only computed for a term that can be read. `new Date("soon")` is Invalid
  // Date, and the difference of two of those is NaN — which is how this page
  // rendered "Invalid Date" and "in NaN days".
  const term = subscriptionState(school, now);
  const renewalIn = term.kind === "needs-configuration"
    ? null
    : daysBetween(now, new Date(school.term_renews_on));

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
      // Core only. No school runs both First Look grade tracks, so a check
      // over the whole catalog could never be completed.
      label: "Every core mission in use",
      done: report.missions.every((m) => m.segment !== "core" || m.assignedTo > 0),
      detail: `${
        report.missions.filter((m) => m.segment === "core" && m.assignedTo > 0).length
      } of ${MISSIONS.length} assigned somewhere`,
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
  const license = licenseStatus(db, school.id);
  // Shown so an administrator on the classroom plan learns the limit before
  // filling in the create form, not after.
  const rooms = classroomAllowance(db, school.id);
  // One question for the whole calendar: label, both dates, their order and
  // whether they fall inside the years named.
  const academicOk = hasVerifiableAcademicDates(school);
  // Not a ternary ending in "Classroom": that labeled every unrecognized
  // value as the cheapest plan while the lookup granted the most expensive
  // behavior. `planLabel` says so instead.
  const label = planLabel(school.plan);

  return (
    <div>
      <PageHeader
        eyebrow="Administrator"
        title="Program status and plan"
        description={
          academicOk
            ? `Where ${school.name} is in the ${school.academic_year} program year, and what happens at renewal.`
            // "before retention can work" was too broad: cohorts with a valid
            // recorded year-end keep their own schedules regardless.
            : `${school.name}. The program year needs configuring below before rollover and this year's retention date can be worked out.`
        }
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
          tone={rooms.recognized ? "neutral" : "berry"}
          hint={rooms.recognized ? undefined : "Ask your account contact to correct it"}
        />
        <Stat
          label="Active classrooms"
          value={
            !rooms.recognized
              ? String(rooms.active)
              : rooms.limit === null
                ? String(rooms.active)
                : `${rooms.active} of ${rooms.limit}`
          }
          hint={
            !rooms.recognized
              ? "No new classrooms can be activated"
              : rooms.limit === null
                ? "No limit on this plan"
                : rooms.active >= rooms.limit
                  ? "Archive one to add another"
                  : "Archived classes do not count"
          }
          tone={
            !rooms.recognized || (rooms.limit !== null && rooms.active >= rooms.limit)
              ? "berry"
              : "neutral"
          }
        />
        <Stat
          label="Student places"
          // A stored value the product would not sell is never presented as a
          // purchased entitlement. "90 of -5" and "5001 licensed" both read as
          // contract facts, and neither was one.
          value={license.recognized ? `${license.used} of ${license.licensed}` : String(license.used)}
          hint={
            !license.recognized
              ? "Seat license needs configuration — no new students can be enrolled"
              : license.remaining === 0
                ? "No places left"
                : `${license.remaining} left`
          }
          tone={!license.recognized || license.remaining === 0 ? "berry" : "neutral"}
        />
        <Stat
          label="Term started"
          value={term.kind === "needs-configuration" ? "Needs configuration" : formatDate(school.term_starts_on)}
          tone={term.kind === "needs-configuration" ? "berry" : "neutral"}
        />
        <Stat
          label={
            term.kind === "needs-configuration"
              ? "Subscription dates"
              : renewalIn !== null && renewalIn < 0
                ? "Renewal overdue"
                : "Renews"
          }
          // Never the raw stored text, and never an invented renewal status:
          // an unreadable term has not ended and is not overdue.
          value={
            term.kind === "needs-configuration"
              ? "Need configuration"
              : formatDate(school.term_renews_on)
          }
          hint={
            term.kind === "needs-configuration"
              ? "Classroom changes are paused"
              : renewalIn !== null && renewalIn < 0
                ? `${Math.abs(renewalIn)} days ago`
                : `in ${renewalIn} days`
          }
          tone={
            term.kind === "needs-configuration" || (renewalIn !== null && renewalIn < 0)
              ? "berry"
              : "neutral"
          }
        />
      </div>

      <div className="mt-6">
        <Disclosure summary="Academic year, seat licence and renewal are three different things">
          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              [
                "The academic year",
                "When the children arrive and go home. It moves only when you roll it over, and it is what deletion dates are counted from.",
              ],
              [
                "The seat licence",
                "How many students the plan covers. Enrolment stops at that number; nothing expires when it is reached.",
              ],
              [
                "The renewal date",
                "When the subscription is next paid for. It has no effect on the school year, on rosters or on any record.",
              ],
            ].map(([term, meaning]) => (
              <div key={term} className="rounded-lg border border-sand-deep bg-paper p-3.5">
                <dt className="text-sm font-semibold text-ink">{term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{meaning}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3">
            Rolling the year over does not renew anything, and renewing does not roll the
            year over. Each is done here, separately, and each writes its own audit entry.
          </p>
        </Disclosure>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Annual program checklist">
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
            academicOk
              ? `Currently ${school.academic_year}, ending ${formatDate(school.year_ends_on)}.`
              // Never echoes the stored value back: a malformed label is not a
              // fact about the school year, and this panel is the recovery
              // surface, so it has to stay readable and say what to do.
              : `${ACADEMIC_NEEDS_CONFIGURATION}. Rollover and this year's retention date cannot be worked out until the year and both dates are set below. Classes with a valid recorded year-end keep their own deletion dates.`
          }
        >
          <PanelBody className="space-y-6">
            {/* Never prefilled with a value the product would reject — sprint
                56's precedent: offering it back invites a resubmit that
                launders it into a record. */}
            <AcademicDatesForm
              academicYear={isAcademicYearLabel(school.academic_year) ? school.academic_year : null}
              startsOn={isCalendarDate(school.year_starts_on) ? school.year_starts_on : null}
              endsOn={isCalendarDate(school.year_ends_on) ? school.year_ends_on : null}
              // From the stored values, not from whether the prefills are null:
              // an absent legacy column and a corrupted record both prefill as
              // nothing, and only one of them is a migration.
              settingsState={academicSettingsState(school)}
            />
            {academicOk && (
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
              seats={license.recognized ? license.licensed : null}
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
          accepting changes. Lapsing does not itself delete or hide anything, and your
          reports, exports, retention settings and staff administration all keep working,
          because the school owns its records whatever the invoice says. What it does not do
          is suspend retention: the schedule you configured carries on, so a class past its
          deletion date stays due, and it is deleted the next time your deployment runs the
          purge job. Pausing neither brings that forward nor holds it back, and nothing in
          this build runs the job on a timer, so due is not yet deleted. Renewing lifts the
          pause and every class carries on where it stopped.
        </Note>
        <Note tone="neutral" title="Program contact">
          {school.contact_name} · {school.contact_email}. Quotes, purchase orders and
          invoices go through this person.{" "}
          <Tag className="mt-2">No payment data is stored in this product</Tag>
        </Note>
      </div>
    </div>
  );
}
