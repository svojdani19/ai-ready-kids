import type { Metadata } from "next";
import { licenceStatus } from "@/lib/repo/entitlement";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { buildSchoolReport } from "@/lib/repo/report";
import { COMPETENCY_BY_ID } from "@/content/competencies";
import { daysBetween, formatDate } from "@/lib/domain/retention";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { ButtonLink } from "@/components/ui/Button";
import { Note, Stat, Tag } from "@/components/ui/Bits";
import { Meter } from "@/components/ui/Meter";

export const metadata: Metadata = { title: "School overview" };

const ACCENT: Record<string, "pine" | "marigold" | "denim"> = {
  privacy: "pine",
  verification: "marigold",
  ownership: "denim",
};

function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

export default async function AdminOverview() {
  const { user } = await requireAdmin();
  const db = getDb();
  const now = new Date();
  const report = buildSchoolReport(db, user.school_id, now);
  const licence = licenceStatus(db, user.school_id);
  const renewalInDays = daysBetween(now, new Date(report.school.termRenewsOn));

  return (
    <div>
      <PageHeader
        eyebrow={report.school.district}
        title={report.school.name}
        description={`School year ${report.school.schoolYear}. Everything on this page is aggregate: administrators do not see individual students, and there is no per-child view to open.`}
        actions={
          <ButtonLink href="/admin/report" variant="secondary">
            Annual report
          </ButtonLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Students enrolled"
          value={report.totals.students}
          // The count of children is always real; what they are licensed
          // against may not be, and an unrecognised value is not shown as one.
          hint={
            licence.recognised
              ? `${licence.licensed} licensed`
              : "Seat licence needs configuration — no new students can be enrolled"
          }
          tone={licence.recognised ? "neutral" : "berry"}
        />
        <Stat label="Classes" value={report.totals.classes} hint={`${report.totals.teachers} teachers`} />
        <Stat
          label="Assigned work completed"
          value={pct(report.totals.completionRate)}
          hint={`${report.totals.missionsCompleted} missions finished`}
        />
        <Stat
          label="Educator orientation"
          value={`${report.certification.completed} of ${report.certification.total}`}
          hint={`${report.certification.modules} modules read and answered. Not a competence check.`}
        />
      </div>

      {renewalInDays <= 60 && (
        <div className="mt-5">
          <Note
            tone={renewalInDays < 0 ? "berry" : "marigold"}
            title={
              renewalInDays < 0
                ? `Subscription lapsed ${Math.abs(renewalInDays)} days ago`
                : `Renewal due in ${renewalInDays} days`
            }
          >
            The {report.school.schoolYear} subscription renews {formatDate(report.school.termRenewsOn)}.
            Your annual report for the year is ready to export for the district office.{" "}
            <Link href="/admin/program" className="font-semibold underline underline-offset-2">
              Review the program status
            </Link>
            .
          </Note>
        </div>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Competency trends"
          description="Share of all possible skill demonstrations achieved across the school."
        >
          <PanelBody className="space-y-4">
            {report.competencies.map((c) => (
              <div key={c.competency}>
                <Meter
                  label={c.label}
                  value={c.demonstratedRate ?? 0}
                  accent={ACCENT[c.competency]}
                  valueLabel={pct(c.demonstratedRate)}
                />
                <p className="mt-1 text-xs text-ink-faint">
                  {COMPETENCY_BY_ID[c.competency].educatorBlurb}
                </p>
              </div>
            ))}
          </PanelBody>
        </Panel>

        <Panel
          title="Annual benchmark"
          description="Fall and spring check-ins, on scenarios no mission uses."
          actions={<ButtonLink href="/admin/benchmarks" size="sm" variant="secondary">Detail</ButtonLink>}
        >
          <PanelBody>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-sand-deep bg-paper px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Fall</p>
                <p className="ark-tabular mt-1 font-display text-2xl text-ink">
                  {pct(report.benchmark.preRate)}
                </p>
                <p className="text-xs text-ink-soft">{report.benchmark.preCompleted} students</p>
              </div>
              <div className="rounded-lg border border-sand-deep bg-paper px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Spring</p>
                <p className="ark-tabular mt-1 font-display text-2xl text-ink">
                  {pct(report.benchmark.postRate)}
                </p>
                <p className="text-xs text-ink-soft">{report.benchmark.postCompleted} students</p>
              </div>
              <div className="rounded-lg border-2 border-pine bg-pine-wash px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-pine-deep">
                  Change
                </p>
                <p className="ark-tabular mt-1 font-display text-2xl text-ink">
                  {report.benchmark.pointsDifference === null
                    ? "—"
                    : `${report.benchmark.pointsDifference > 0 ? "+" : ""}${Math.round(report.benchmark.pointsDifference)}`}
                </p>
                <p className="text-xs text-ink-soft">{report.benchmark.matched} matched</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">
              The change uses only students who finished both windows, which is the only fair
              denominator. Percentage points, not a grade.
            </p>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="By class"
          description="Groups smaller than five students are shown as too few to report."
          actions={<ButtonLink href="/admin/classes" size="sm" variant="secondary">Manage</ButtonLink>}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <caption className="sr-only">Completion and competency rates by class</caption>
              <thead>
                <tr className="border-b border-sand text-left">
                  <th scope="col" className="px-5 py-2.5 font-semibold text-ink-soft">Class</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Grade</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Teacher</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Students</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Assigned</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Completed</th>
                  {report.competencies.map((c) => (
                    <th key={c.competency} scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">
                      {COMPETENCY_BY_ID[c.competency].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.byClass.map((c) => (
                  <tr key={c.classId} className="border-b border-sand last:border-0">
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {c.className}
                    </th>
                    <td className="px-3 py-2.5 text-ink-soft">{c.grade}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{c.teacherName}</td>
                    <td className="ark-tabular px-3 py-2.5 text-ink-soft">{c.students}</td>
                    <td className="ark-tabular px-3 py-2.5 text-ink-soft">{c.assignedMissions}</td>
                    <td className="ark-tabular px-3 py-2.5 font-semibold text-ink">
                      {pct(c.completionRate)}
                    </td>
                    {c.competencies.map((x) => (
                      <td key={x.competency} className="ark-tabular px-3 py-2.5 text-ink-soft">
                        {pct(x.demonstratedRate)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="By grade">
          <PanelBody className="space-y-3">
            {report.byGrade.map((g) => (
              <Meter
                key={g.grade}
                label={`Grade ${g.grade} · ${g.students} students`}
                value={g.completionRate ?? 0}
                accent="denim"
                valueLabel={pct(g.completionRate)}
              />
            ))}
          </PanelBody>
        </Panel>

        <Panel title="Mission uptake" description="How many classes have each mission open.">
          <PanelBody>
            <ul className="space-y-1.5">
              {report.missions.map((m) => (
                <li key={m.missionId} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink">{m.title}</span>
                  <span className="shrink-0">
                    <Tag tone={m.assignedTo === 0 ? "neutral" : "pine"}>
                      {m.assignedTo} of {report.totals.classes} classes
                    </Tag>
                  </span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6">
        <Note tone="neutral" title="What administrators cannot see here, by design">
          There is no route in this product that shows an administrator an individual
          student&rsquo;s name alongside their answers, and no export that contains one.
          Teachers see their own roster because they need it to teach; nobody above them
          does.
        </Note>
      </div>
    </div>
  );
}
