import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_SESSIONS, FOUNDATION_TRACKS, FOUNDATIONS_BY_TRACK, getMission, MISSIONS } from "@/content/missions";
import { COMPETENCY_BY_ID } from "@/content/competencies";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mission = getMission(slug);
  return { title: mission ? `${mission.title} at home` : "Family page" };
}

export function generateStaticParams() {
  return ALL_SESSIONS.map((m) => ({ slug: m.slug }));
}

/**
 * Family take-home. Public by design: no account, no login, nothing to
 * collect. A caregiver who gets this as a paper sheet or a link sees the
 * same thing either way.
 */
export default async function FamilyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();
  const competency = COMPETENCY_BY_ID[mission.competency];

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="ark-no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" aria-label="AI Ready Kids home">
            <Logo />
          </Link>
          <PrintButton label="Print this sheet" />
        </div>

        <main id="main">
          <article className="rounded-xl border-2 border-sand-deep bg-surface p-8 ark-print-plain">
            <header className="border-b-2 border-sand pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                A page for home ·{" "}
                {mission.segment === "foundation" ? "First Look" : competency.formalName}
              </p>
              <h1 className="mt-1.5 font-display text-3xl leading-tight text-ink">
                {mission.title}
              </h1>
            </header>

            <section className="mt-6">
              <h2 className="font-display text-xl text-ink">What we did at school</h2>
              <p className="mt-2 text-[1.05rem] leading-relaxed text-ink-soft">
                {mission.family.summary}
              </p>
            </section>

            <section className="mt-7 rounded-lg border-2 border-marigold bg-marigold-wash p-5">
              <h2 className="font-display text-xl text-ink">Three questions to ask</h2>
              <ol className="mt-3 space-y-3.5">
                {mission.family.questions.map((q, i) => (
                  <li key={q} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-marigold-deep bg-surface font-display text-sm font-bold text-marigold-deep"
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[1.05rem] leading-relaxed text-ink">{q}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-7">
              <h2 className="font-display text-xl text-ink">One thing to try this week</h2>
              <p className="mt-2 text-[1.05rem] leading-relaxed text-ink-soft">
                {mission.family.tryAtHome}
              </p>
            </section>

            <section className="mt-7 rounded-lg border-2 border-pine bg-pine-wash p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine-deep">
                The one sentence worth keeping
              </p>
              <p className="mt-2 font-display text-2xl leading-snug text-ink">
                {mission.family.familyRule}
              </p>
            </section>

            <footer className="mt-8 border-t border-sand pt-4 text-sm leading-relaxed text-ink-faint">
              You do not need an account to use this page, and there is nothing here to sign
              up for. Your child&rsquo;s school runs AI Ready Kids; we collect no information
              about families, and your child never types anything into an AI system in this
              program.
            </footer>
          </article>

          <nav
            aria-label="Other missions"
            className="ark-no-print mt-8 rounded-xl border border-sand-deep bg-surface p-5"
          >
            <h2 className="font-display text-lg text-ink">Take-home pages for every mission</h2>
            {[
              // First Look is split by track, because both tracks number their
              // sessions 1 to 3 and one flat list would show two of each.
              ...FOUNDATION_TRACKS.map((track) => ({
                label: `${track.name} · ${track.grades}`,
                items: FOUNDATIONS_BY_TRACK[track.id],
              })),
              { label: "Missions", items: MISSIONS },
            ].map((group) => (
              <div key={group.label} className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  {group.label}
                </p>
                <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  {group.items.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/family/${m.slug}`}
                        className={`text-sm underline-offset-2 hover:underline ${
                          m.id === mission.id ? "font-semibold text-ink" : "text-ink-soft"
                        }`}
                      >
                        {m.order}. {m.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </main>
      </div>
    </div>
  );
}
