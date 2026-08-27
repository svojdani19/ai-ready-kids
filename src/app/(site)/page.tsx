import Link from "next/link";
import { COMPETENCIES } from "@/content/competencies";
import { MISSIONS } from "@/content/missions";
import { ButtonLink } from "@/components/ui/Button";
import { SceneArt } from "@/components/art/SceneArt";

/**
 * The landing page.
 *
 * It has one job: say what this is, show what a child actually sees, and hand
 * off. Everything that used to live here as a scrolling section now has its
 * own page behind the header menus, because a school evaluator arrives looking
 * for one specific thing and should not have to scroll past four other things
 * to find it.
 */

const LANE: Record<string, { border: string; wash: string; text: string }> = {
  pine: { border: "border-pine", wash: "bg-pine-wash", text: "text-pine-deep" },
  marigold: { border: "border-marigold", wash: "bg-marigold-wash", text: "text-marigold-deep" },
  denim: { border: "border-denim", wash: "bg-denim-wash", text: "text-denim-deep" },
};

export default function LandingPage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <h1 className="font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
              Walk before you run.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              AI Ready Kids helps students understand the nuances of safety in using
              artificial intelligence before they are thrust into prompts and language
              models. Through teacher-guided scenarios, students build privacy,
              verification and independent learning — specific situations written to
              instruct and to engage.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href="/demo" size="lg">
                See the demo
              </ButtonLink>
              <ButtonLink href="/curriculum" variant="secondary" size="lg">
                Read the curriculum
              </ButtonLink>
            </div>
            <p className="mt-6 max-w-lg rounded-xl border-2 border-grape bg-grape-wash px-4 py-3 text-sm leading-relaxed text-ink">
              <strong className="font-bold text-grape-deep">No chatbot, ever.</strong>{" "}
              Students never type into a generative model and never see one respond. Every
              word a child reads here was authored in advance.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border-4 border-ink bg-surface shadow-sticker-deep">
            <div className="h-52 border-b-4 border-ink sm:h-60">
              <SceneArt art="tablet" />
            </div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">
                Mission 1 · Keep It Private
              </p>
              <p className="mt-2 font-display text-xl leading-snug text-ink">
                “Hi there! Before we start, what is your full name?”
              </p>
              <div className="mt-4 space-y-2">
                <div className="rounded-xl border-2 border-sand-deep bg-paper px-3.5 py-2.5 text-sm text-ink-soft">
                  Type your first and last name so it can help you better
                </div>
                <div className="rounded-xl border-2 border-pine bg-pine-wash px-3.5 py-2.5 text-sm font-semibold text-pine-deep">
                  Leave it blank and tap Start ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three competencies, as a signpost rather than a chapter. */}
      <section className="border-b-2 border-ink bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl text-ink">Three things, practised nine ways</h2>
            <Link
              href="/curriculum"
              className="text-[0.95rem] font-bold text-grape-deep underline underline-offset-4"
            >
              See all 27 missions →
            </Link>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {COMPETENCIES.map((competency) => {
              const lane = LANE[competency.accent];
              const count = MISSIONS.filter((m) => m.competency === competency.id).length;
              return (
                <Link
                  key={competency.id}
                  href="/curriculum"
                  className={`ark-sticker rounded-2xl border-4 border-ink p-5 transition-colors ${lane.wash} hover:bg-surface`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">
                    {count} missions
                  </p>
                  <h3 className={`mt-1.5 font-display text-2xl ${lane.text}`}>
                    {competency.name}
                  </h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">
                    {competency.kidBlurb}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-ink bg-marigold-wash">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl text-ink">
                What your school can show
              </h2>
              <p className="mt-3 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
                That your students have practised specific decisions and can name them.
                That they were measured in the fall and again in the spring, on situations
                the lessons never used. That is a claim you can take to a board meeting
                with a report behind it.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/approach" variant="secondary">
                  How it works
                </ButtonLink>
                <ButtonLink href="/benchmark" variant="secondary">
                  Annual check-ins
                </ButtonLink>
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                [
                  "A class code is all they need",
                  "A first name and a last initial is the entire student record. Nothing to reset, nothing worth stealing.",
                ],
                [
                  "Evidence, not surveillance",
                  "You see which of nine named skills a child has shown. Never a timer, a keystroke or a risk score.",
                ],
                [
                  "It never asks for a permission",
                  "No camera, no microphone, no location, no ads and no trackers, anywhere in the product.",
                ],
              ].map(([t, b]) => (
                <li key={t} className="rounded-2xl border-2 border-ink bg-surface px-4 py-3">
                  <p className="font-display text-lg leading-snug text-ink">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{b}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-14 text-center">
          <h2 className="font-display text-3xl text-ink">Sit in any seat and look around</h2>
          <p className="mx-auto mt-3 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
            Brightwood Elementary is a fictional school with a full year of fictional data:
            four classes, 90 students, 27 missions and both check-in windows.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/demo" size="lg">
              Open the demo
            </ButtonLink>
            <ButtonLink href="/plans" variant="secondary" size="lg">
              See plans
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
