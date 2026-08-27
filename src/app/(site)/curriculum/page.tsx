import type { Metadata } from "next";
import { COMPETENCIES } from "@/content/competencies";
import { MISSIONS } from "@/content/missions";
import { PageHero, Section } from "@/components/marketing/Page";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Bits";

export const metadata: Metadata = {
  title: "Curriculum",
  description:
    "Nine authored story missions across three competencies: privacy, verification and learning ownership, for grades 2 to 4.",
};

const LANE: Record<string, { wrap: string; text: string; chip: "pine" | "marigold" | "denim" }> = {
  pine: { wrap: "border-pine bg-pine-wash", text: "text-pine-deep", chip: "pine" },
  marigold: { wrap: "border-marigold bg-marigold-wash", text: "text-marigold-deep", chip: "marigold" },
  denim: { wrap: "border-denim bg-denim-wash", text: "text-denim-deep", chip: "denim" },
};

export default function CurriculumPage() {
  return (
    <>
      <PageHero
        eyebrow="Curriculum"
        tone="marigold"
        title="Three competencies. Nine missions. Nothing improvised."
        lede="Each competency has three named skills and three missions. A mission takes seven to nine minutes, ends with a printable family take-home, and shares a cast and a setting with the other eight so a class builds continuity across the year."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/demo">Play one in the demo</ButtonLink>
          <ButtonLink href="/benchmark" variant="secondary">
            How it is measured
          </ButtonLink>
        </div>
      </PageHero>

      {COMPETENCIES.map((competency, index) => {
        const lane = LANE[competency.accent];
        const missions = MISSIONS.filter((m) => m.competency === competency.id);
        return (
          <Section key={competency.id} tone={index % 2 === 0 ? "surface" : "paper"}>
            <div className={`rounded-3xl border-4 p-5 sm:p-7 ${lane.wrap}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className={`font-display text-3xl ${lane.text}`}>
                  {competency.formalName}
                </h2>
                <Tag tone={lane.chip}>Students call it “{competency.name}”</Tag>
              </div>
              <p className="mt-3 max-w-3xl text-[1.05rem] leading-relaxed text-ink">
                {competency.educatorBlurb}
              </p>

              <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                The three skills
              </h3>
              <ul className="mt-2 grid gap-2 md:grid-cols-3">
                {competency.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="rounded-xl border-2 border-ink bg-surface px-3.5 py-2.5 text-sm font-semibold leading-snug text-ink"
                  >
                    {skill.educatorLabel}
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                The three missions
              </h3>
              <ul className="mt-2 grid gap-3 md:grid-cols-3">
                {missions.map((m) => (
                  <li key={m.id} className="rounded-2xl border-2 border-ink bg-surface p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-faint">
                      Mission {m.order} · {m.estimatedMinutes} min
                    </p>
                    <h4 className="mt-1.5 font-display text-lg leading-snug text-ink">
                      {m.title}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{m.teaser}</p>
                    <p className="mt-3 text-xs font-semibold text-ink-faint">
                      Badge: {m.badge.name}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        );
      })}

      <Section
        tone="grape"
        title="How a mission is built"
        lede="A mission is a finite graph of authored scenes. The runtime only walks it."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Every choice has authored feedback", "Written for the age, in the second person, with no shaming language."],
            ["Unsafe choices loop back", "A child is never locked into an unsafe path and never punished for exploring one."],
            ["Evidence attaches to named skills", "Not a score. Which of nine specific things a child has shown they can do."],
            ["Coach notes stay with the teacher", "Each choice can carry a note that a student never sees."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border-2 border-grape bg-surface p-5">
              <h3 className="font-display text-lg leading-snug text-ink">{t}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
