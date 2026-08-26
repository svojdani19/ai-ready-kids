import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { listClasses, listStudents } from "@/lib/repo/classroom";
import { listBenchmarksForClass, listBenchmarksForSchool } from "@/lib/repo/progress";
import { summariseCohortBenchmark } from "@/lib/domain/benchmark";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { COMPETENCY_BY_ID } from "@/content/competencies";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { Meter } from "@/components/ui/Meter";
import { Note, Stat, Tag } from "@/components/ui/Bits";

export const metadata: Metadata = { title: "Benchmarks" };

const ACCENT: Record<string, "pine" | "marigold" | "denim"> = {
  privacy: "pine",
  verification: "marigold",
  ownership: "denim",
};

function pct(v: number | null) {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}

export default async function AdminBenchmarks() {
  const { user } = await requireAdmin();
  const db = getDb();
  const classes = listClasses(db, user.school_id);
  const school = summariseCohortBenchmark(listBenchmarksForSchool(db, user.school_id));

  const perClass = classes.map((c) => ({
    classroom: c,
    students: listStudents(db, c.id).length,
    bench: summariseCohortBenchmark(listBenchmarksForClass(db, c.id)),
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Administrator"
        title="Annual benchmark"
        description="Two windows a year, nine items each, set in contexts no mission uses. This measures whether students transfer the decisions, not whether they remember the stories."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Fall completed" value={school.preCompleted} />
        <Stat label="Spring completed" value={school.postCompleted} />
        <Stat label="Matched pairs" value={school.matched} hint="Finished both windows" />
        <Stat
          label="Matched growth"
          value={
            school.growthPoints === null
              ? "—"
              : `${school.growthPoints > 0 ? "+" : ""}${Math.round(school.growthPoints)} pts`
          }
          tone="pine"
        />
      </div>

      <div className="mt-6">
        <Panel
          title="Growth by competency"
          description="Matched students only. Percentage points, fall to spring."
        >
          <PanelBody className="space-y-5">
            {school.byCompetency.map((c) => (
              <div key={c.competency} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Meter
                    size="sm"
                    label={`${COMPETENCY_BY_ID[c.competency].formalName} · fall`}
                    value={c.preRate ?? 0}
                    accent="ink"
                    valueLabel={pct(c.preRate)}
                  />
                  <Meter
                    size="sm"
                    label={`${COMPETENCY_BY_ID[c.competency].formalName} · spring`}
                    value={c.postRate ?? 0}
                    accent={ACCENT[c.competency]}
                    valueLabel={pct(c.postRate)}
                  />
                </div>
                <div className="flex items-center">
                  <Tag tone={c.growthPoints && c.growthPoints > 0 ? "pine" : "neutral"}>
                    {c.growthPoints === null
                      ? "Awaiting spring"
                      : `${c.growthPoints > 0 ? "+" : ""}${Math.round(c.growthPoints)} points`}
                  </Tag>
                </div>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="By class">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <caption className="sr-only">Benchmark completion and growth by class</caption>
              <thead>
                <tr className="border-b border-sand text-left">
                  <th scope="col" className="px-5 py-2.5 font-semibold text-ink-soft">Class</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Students</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Fall done</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Spring done</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Fall rate</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Spring rate</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Growth</th>
                </tr>
              </thead>
              <tbody>
                {perClass.map(({ classroom, students, bench }) => (
                  <tr key={classroom.id} className="border-b border-sand last:border-0">
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {classroom.name}
                      <span className="block text-xs font-normal text-ink-soft">
                        Grade {classroom.grade}
                      </span>
                    </th>
                    <td className="ark-tabular px-3 py-2.5 text-ink-soft">{students}</td>
                    <td className="ark-tabular px-3 py-2.5 text-ink-soft">{bench.preCompleted}</td>
                    <td className="ark-tabular px-3 py-2.5 text-ink-soft">
                      {bench.postCompleted === 0 ? (
                        <span className="text-ink-faint">Not run</span>
                      ) : (
                        bench.postCompleted
                      )}
                    </td>
                    <td className="ark-tabular px-3 py-2.5 text-ink-soft">{pct(bench.preRate)}</td>
                    <td className="ark-tabular px-3 py-2.5 text-ink-soft">{pct(bench.postRate)}</td>
                    <td className="ark-tabular px-3 py-2.5 font-semibold text-ink">
                      {bench.growthPoints === null
                        ? "—"
                        : `${bench.growthPoints > 0 ? "+" : ""}${Math.round(bench.growthPoints)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {(["pre", "post"] as const).map((form) => (
          <Panel
            key={form}
            title={BENCHMARK_FORMS[form].title}
            description={`${BENCHMARK_FORMS[form].items.length} items · ${form === "pre" ? "Form A" : "Form B"}`}
          >
            <PanelBody>
              <ul className="space-y-2.5">
                {BENCHMARK_FORMS[form].items.map((item) => (
                  <li key={item.id} className="rounded-lg border border-sand bg-paper px-3.5 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
                      {COMPETENCY_BY_ID[item.competency].formalName}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.scenario}</p>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
        ))}
      </div>

      <div className="mt-6">
        <Note tone="neutral" title="How to read this honestly">
          These items are multiple choice and a child can pick a good answer without acting
          on it. What this measures is whether students can identify the safer move in an
          unfamiliar situation, which is a real and useful thing to know, and it is not the
          same as measuring behaviour. Nobody in this product sees an individual
          child&rsquo;s check-in answers, including you.
        </Note>
      </div>
    </div>
  );
}
