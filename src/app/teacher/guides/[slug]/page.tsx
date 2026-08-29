import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FOUNDATIONS_BY_TRACK, getMission, MISSIONS } from "@/content/missions";
import { SESSION_SHAPES } from "@/content/session-guide";
import { COMPETENCY_BY_ID, SKILL_BY_ID } from "@/content/competencies";
import { PrintButton } from "@/components/PrintButton";
import { LogoMark } from "@/components/Logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mission = getMission(slug);
  return { title: mission ? `${mission.title} discussion guide` : "Discussion guide" };
}

export default async function PrintableGuide({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();
  const shape = SESSION_SHAPES.find((sh) =>
    mission.segment === "foundation" ? sh.id === "first-look" : sh.id === "core-mission",
  )!;
  const competency = COMPETENCY_BY_ID[mission.competency];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="ark-no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/teacher/missions/${mission.slug}`}
          className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          ← Back to the mission
        </Link>
        <span className="flex flex-wrap items-center gap-3">
          <Link
            href={`/teacher/classroom/${mission.slug}`}
            className="text-sm font-semibold text-pine-deep underline underline-offset-2"
          >
            Teach it on the board
          </Link>
          <PrintButton label="Print the guide" />
        </span>
      </div>

      <article className="rounded-xl border border-sand-deep bg-surface p-8 ark-print-plain">
        <header className="flex items-start justify-between gap-4 border-b border-sand pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Discussion guide ·{" "}
              {mission.segment === "foundation" ? "First Look" : competency.formalName}
            </p>
            <h1 className="mt-1.5 font-display text-3xl leading-tight text-ink">
              {mission.title}
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              {mission.segment === "foundation" ? "Session" : "Mission"} {mission.order} ·
              Grades {mission.gradeBand} · {mission.estimatedMinutes} minutes independent, 15
              minutes debrief
            </p>
          </div>
          <LogoMark size={40} />
        </header>

        {/* The run sheet, so the printed guide explains the shape its own
            header has always asserted. Same authored source as the on-screen
            guidance, with this session's real independent minutes. */}
        <section className="mt-6">
          <h2 className="font-display text-lg text-ink">How the time goes</h2>
          <ol className="mt-2 space-y-1.5">
            {shape.steps.map((step, i) => (
              <li key={step.label} className="leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink">
                  {i === 1 && shape.id === "core-mission"
                    ? mission.estimatedMinutes
                    : step.minutes}{" "}
                  min · {step.label}.
                </strong>{" "}
                {step.teacher}
              </li>
            ))}
          </ol>
          <p className="mt-2 leading-relaxed text-ink-soft">{shape.keyPoint}</p>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg text-ink">Before you start</h2>
          <p className="mt-2 leading-relaxed text-ink-soft">{mission.guide.setup}</p>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg text-ink">Learning goals</h2>
          <ul className="mt-2 space-y-1.5">
            {mission.learningGoals.map((g) => (
              <li key={g} className="leading-relaxed text-ink-soft">
                · {g}
              </li>
            ))}
          </ul>
          {/* The sheet a teacher prints and keeps must not say a First Look
              session records a skill. It records nothing, and this line is
              where that claim would survive longest once it is on paper. */}
          <p className="mt-3 text-sm text-ink-faint">
            {mission.segment === "foundation"
              ? `Records nothing. Leads into: ${SKILL_BY_ID[mission.primarySkillId].educatorLabel}`
              : `Primary skill recorded: ${SKILL_BY_ID[mission.primarySkillId].educatorLabel}`}
          </p>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg text-ink">While they play, watch for</h2>
          <ul className="mt-2 space-y-1.5">
            {mission.guide.lookFor.map((l) => (
              <li key={l} className="leading-relaxed text-ink-soft">
                · {l}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 break-inside-avoid">
          <h2 className="font-display text-lg text-ink">Whole-class debrief</h2>
          <ol className="mt-2 space-y-2.5">
            {mission.guide.questions.map((q, i) => (
              <li key={q} className="flex gap-3 leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">{i + 1}.</span>
                <span>
                  {q}
                  <span className="mt-2 block h-px bg-sand" />
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 break-inside-avoid">
          <h2 className="font-display text-lg text-ink">If a student says…</h2>
          <dl className="mt-2 space-y-3">
            {mission.guide.misconceptions.map((m) => (
              <div key={m.student} className="rounded border border-sand p-3">
                <dt className="font-semibold italic text-ink">“{m.student}”</dt>
                <dd className="mt-1 leading-relaxed text-ink-soft">{m.response}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-6 break-inside-avoid">
          <h2 className="font-display text-lg text-ink">Ten-minute unplugged extension</h2>
          <p className="mt-2 leading-relaxed text-ink-soft">{mission.guide.extension}</p>
          {/* Authored material, so nothing has to be sourced. Prints with the
              guide and reads aloud without a screen. */}
          {mission.guide.extensionCards && (
            <ol className="mt-3 space-y-3">
              {mission.guide.extensionCards.map((card) => (
                <li key={card.label} className="rounded border border-sand p-3">
                  <p className="font-semibold text-ink">{card.label}</p>
                  <p className="mt-1 leading-relaxed text-ink">{card.description}</p>
                  <dl className="mt-2 space-y-1 text-sm leading-relaxed text-ink-soft">
                    <div>
                      <dt className="inline font-semibold text-ink">Suggests: </dt>
                      <dd className="inline">{card.suggests}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-ink">Proves: </dt>
                      <dd className="inline">{card.proves}</dd>
                    </div>
                    {card.consent && (
                      <div>
                        <dt className="inline font-semibold text-ink">Everyone in it: </dt>
                        <dd className="inline">{card.consent}</dd>
                      </div>
                    )}
                    {card.control && (
                      <div>
                        <dt className="inline font-semibold text-ink">The next moment: </dt>
                        <dd className="inline">{card.control}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="inline font-semibold text-ink">Ready for a big audience? </dt>
                      <dd className="inline">{card.audience}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-6 break-inside-avoid rounded-lg border border-sand-deep bg-paper p-4">
          <h2 className="font-display text-lg text-ink">Send home</h2>
          <p className="mt-1.5 leading-relaxed text-ink-soft">
            The take-home sheet for this mission carries the family rule:{" "}
            <strong className="font-semibold text-ink">{mission.family.familyRule}</strong>
          </p>
          <p className="ark-no-print mt-2 text-sm">
            <Link
              href={`/family/${mission.slug}`}
              className="font-semibold text-pine-deep underline underline-offset-2"
            >
              Open the printable family page
            </Link>
          </p>
        </section>

        <footer className="mt-8 border-t border-sand pt-4 text-xs text-ink-faint">
          AI Ready Kids ·{" "}
          {mission.segment === "foundation"
            ? `First Look · Session ${mission.order} of ${
                FOUNDATIONS_BY_TRACK[mission.track ?? "early"].length
              }, grades ${mission.gradeBand}`
            : `${competency.formalName} · Mission ${mission.order} of ${MISSIONS.length}`}
          . Reproduce freely within your school.
        </footer>
      </article>
    </div>
  );
}
