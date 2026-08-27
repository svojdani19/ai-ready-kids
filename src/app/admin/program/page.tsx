import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
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
        <Stat label="Plan" value={school.plan === "school" ? "Whole school" : school.plan === "district" ? "District" : "Classroom"} />
        <Stat label="Licensed students" value={school.licensed_students} hint={`${report.totals.students} enrolled`} />
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

        <Panel title="Subscription">
          <PanelBody>
            <PlanForm plan={school.plan} seats={school.licensed_students} />
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
          Nothing switches off automatically in this build. In a real deployment a lapsed
          subscription makes classes read-only rather than deleting anything, because the
          school still owns its records and may need to export them.
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
