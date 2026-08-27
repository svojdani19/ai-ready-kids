import type { Metadata } from "next";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { COMPETENCY_BY_ID } from "@/content/competencies";
import { PageHero, Section } from "@/components/marketing/Page";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Annual check-ins",
  description:
    "Fall and spring benchmarking on transfer scenarios no mission uses, reported as cohort growth and never as a score for a child.",
};

export default function BenchmarkPage() {
  const pre = BENCHMARK_FORMS.pre;
  const post = BENCHMARK_FORMS.post;

  return (
    <>
      <PageHero
        eyebrow="Annual check-ins"
        tone="pine"
        title="Measured twice a year, on situations the missions never used."
        lede="A recall quiz would tell you students remember your lessons. That is not the claim worth making. Both check-in forms are set somewhere the curriculum never goes: a grandparent's kitchen speaker, a museum kiosk, a summer camp app, a voice message from a coach."
      >
        <ButtonLink href="/demo">See the reports in the demo</ButtonLink>
      </PageHero>

      <Section tone="surface">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Nine items per form", "Three per competency, balanced across the same nine skills in both windows."],
            ["No shared scenarios", "Forms A and B have no setting in common, so spring measures transfer rather than memory."],
            ["No score for a child", "Students see no feedback and no result. Adults see cohort growth on matched students."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border-2 border-pine bg-pine-wash p-5">
              <h3 className="font-display text-lg leading-snug text-ink">{t}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        tone="paper"
        title="A sample item from each window"
        lede="Nothing here rewards remembering a mission. Every item is a situation a child has not practised."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {[pre, post].map((form) => {
            const item = form.items[4];
            return (
              <div key={form.form} className="rounded-2xl border-2 border-ink bg-surface p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">
                  {form.title} · {COMPETENCY_BY_ID[item.competency].formalName}
                </p>
                <p className="mt-3 font-display text-lg leading-snug text-ink">{item.scenario}</p>
                <p className="mt-3 text-sm font-bold text-ink">{item.question}</p>
                <ul className="mt-3 space-y-2">
                  {item.options.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-xl border-2 border-sand-deep bg-paper px-3.5 py-2.5 text-sm text-ink-soft"
                    >
                      {o.label}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section tone="denim" title="How to read the result honestly">
        <p className="max-w-3xl text-[1.05rem] leading-relaxed text-ink">
          These items are multiple choice, and a child can pick a good answer without
          acting on it. What this measures is whether students can identify the safer move
          in an unfamiliar situation. That is a real and useful thing to know, and it is
          not the same as measuring behaviour. Growth is calculated only across students
          who completed both windows, which is the only fair denominator.
        </p>
      </Section>
    </>
  );
}
