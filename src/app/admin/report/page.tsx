import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { buildSchoolReport, MIN_REPORTABLE_GROUP } from "@/lib/repo/report";
import { COMPETENCY_BY_ID } from "@/content/competencies";
import { formatDate } from "@/lib/domain/retention";
import { LogoMark } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { PageHeader } from "@/components/ui/Panel";

export const metadata: Metadata = { title: "Annual school report" };

function pct(v: number | null) {
  return v === null ? "too few to report" : `${Math.round(v * 100)}%`;
}

export default async function AdminReport() {
  const { user } = await requireAdmin();
  const report = buildSchoolReport(getDb(), user.school_id);

  return (
    <div>
      <div className="ark-no-print">
        <PageHeader
          eyebrow="Administrator"
          title="Annual school report"
          description="Aggregate only, with small groups suppressed. Suitable for a district office, a board packet or a family newsletter."
          actions={
            <div className="flex flex-wrap gap-2">
              <PrintButton label="Print or save as PDF" />
              <a
                href="/admin/report/export?format=csv"
                className="inline-flex items-center rounded-xl border-2 border-sand-deep bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-deep"
              >
                Download CSV
              </a>
              <a
                href="/admin/report/export?format=json"
                className="inline-flex items-center rounded-xl border-2 border-sand-deep bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-deep"
              >
                Download JSON
              </a>
            </div>
          }
        />
      </div>

      <article className="rounded-xl border border-sand-deep bg-surface p-8 ark-print-plain">
        <header className="flex items-start justify-between gap-6 border-b-2 border-sand pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
              AI Ready Kids · Annual programme report
            </p>
            <h1 className="mt-1.5 font-display text-3xl leading-tight text-ink">
              {report.school.name}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {report.school.district} · {report.school.city}, {report.school.state}
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">
              School year {report.school.schoolYear} · Generated{" "}
              {formatDate(report.generatedAt)}
            </p>
          </div>
          <LogoMark size={44} />
        </header>

        <section className="mt-6">
          <h2 className="font-display text-xl text-ink">Participation</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Students", report.totals.students],
              ["Classes", report.totals.classes],
              ["Teachers", report.totals.teachers],
              ["Missions completed", report.totals.missionsCompleted],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-sand-deep bg-paper px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  {label}
                </dt>
                <dd className="ark-tabular mt-1 font-display text-2xl text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
            Students completed {Math.round(report.totals.completionRate * 100)} percent of the
            missions their teachers assigned, across {report.totals.assignmentsMade}{" "}
            class-level assignments. {report.certification.completed} of{" "}
            {report.certification.total} teachers finished the{" "}
            {report.certification.modules}-module educator foundation programme.
          </p>
        </section>

        <section className="mt-7">
          <h2 className="font-display text-xl text-ink">Competencies demonstrated</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Share of all possible skill demonstrations achieved. Each competency has three
            named skills, and a skill counts once a student has demonstrated it in a mission.
          </p>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand text-left">
                <th scope="col" className="py-2 font-semibold text-ink-soft">Competency</th>
                <th scope="col" className="py-2 font-semibold text-ink-soft">Demonstrated</th>
                <th scope="col" className="py-2 font-semibold text-ink-soft">Of possible</th>
                <th scope="col" className="py-2 font-semibold text-ink-soft">Rate</th>
              </tr>
            </thead>
            <tbody>
              {report.competencies.map((c) => (
                <tr key={c.competency} className="border-b border-sand last:border-0">
                  <th scope="row" className="py-2 text-left font-medium text-ink">
                    {c.label}
                  </th>
                  <td className="ark-tabular py-2 text-ink-soft">{c.demonstrated}</td>
                  <td className="ark-tabular py-2 text-ink-soft">{c.possible}</td>
                  <td className="ark-tabular py-2 font-semibold text-ink">
                    {pct(c.demonstratedRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-7 break-inside-avoid">
          <h2 className="font-display text-xl text-ink">Annual benchmark</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Nine transfer items in the fall and nine different ones in the spring, set in
            situations none of the missions use. Growth is calculated only across students
            who completed both windows.
          </p>
          <table className="mt-3 w-full border-collapse text-sm">
            <tbody>
              {[
                ["Fall check-ins completed", report.benchmark.preCompleted],
                ["Fall correct rate", pct(report.benchmark.preRate)],
                ["Spring check-ins completed", report.benchmark.postCompleted],
                ["Spring correct rate", pct(report.benchmark.postRate)],
                ["Matched students", report.benchmark.matched],
                [
                  "Matched growth",
                  report.benchmark.growthPoints === null
                    ? "not available"
                    : `${report.benchmark.growthPoints > 0 ? "+" : ""}${Math.round(report.benchmark.growthPoints)} percentage points`,
                ],
              ].map(([label, value]) => (
                <tr key={String(label)} className="border-b border-sand last:border-0">
                  <th scope="row" className="py-2 text-left font-medium text-ink">{label}</th>
                  <td className="ark-tabular py-2 text-right text-ink-soft">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-3 space-y-1.5">
            {report.benchmark.byCompetency.map((c) => (
              <li key={c.competency} className="text-sm text-ink-soft">
                {COMPETENCY_BY_ID[c.competency].formalName}:{" "}
                {c.growthPoints === null
                  ? "awaiting the spring window"
                  : `${c.growthPoints > 0 ? "+" : ""}${Math.round(c.growthPoints)} points`}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7 break-inside-avoid">
          <h2 className="font-display text-xl text-ink">By class</h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand text-left">
                <th scope="col" className="py-2 font-semibold text-ink-soft">Class</th>
                <th scope="col" className="py-2 font-semibold text-ink-soft">Grade</th>
                <th scope="col" className="py-2 font-semibold text-ink-soft">Students</th>
                <th scope="col" className="py-2 font-semibold text-ink-soft">Assigned</th>
                <th scope="col" className="py-2 font-semibold text-ink-soft">Completed</th>
              </tr>
            </thead>
            <tbody>
              {report.byClass.map((c) => (
                <tr key={c.classId} className="border-b border-sand last:border-0">
                  <th scope="row" className="py-2 text-left font-medium text-ink">
                    {c.className}
                  </th>
                  <td className="ark-tabular py-2 text-ink-soft">{c.grade}</td>
                  <td className="ark-tabular py-2 text-ink-soft">{c.students}</td>
                  <td className="ark-tabular py-2 text-ink-soft">{c.assignedMissions}</td>
                  <td className="ark-tabular py-2 font-semibold text-ink">
                    {pct(c.completionRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-7 break-inside-avoid">
          <h2 className="font-display text-xl text-ink">Mission uptake</h2>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {report.missions.map((m) => (
              <li key={m.missionId} className="flex justify-between gap-3 text-sm">
                <span className="text-ink">{m.title}</span>
                <span className="ark-tabular shrink-0 text-ink-soft">
                  {m.completed} completions · {m.assignedTo}/{report.totals.classes} classes
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7 break-inside-avoid rounded-lg border-2 border-pine bg-pine-wash p-5">
          <h2 className="font-display text-xl text-ink">What is and is not in this report</h2>
          <ul className="mt-2.5 space-y-2">
            {report.privacy.map((line) => (
              <li key={line} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-ink">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            Suppression threshold: {MIN_REPORTABLE_GROUP} students. Data retention is set to{" "}
            {report.school.retentionMonths} months after the school year ends.
          </p>
        </section>

        <footer className="mt-8 border-t border-sand pt-4 text-xs leading-relaxed text-ink-faint">
          AI Ready Kids annual programme report · {report.school.name} ·{" "}
          {report.school.schoolYear}. This document describes demonstrated competencies from
          an authored curriculum. It is not a behavioural assessment of any child and it is
          not a legal compliance certification.
        </footer>
      </article>
    </div>
  );
}
