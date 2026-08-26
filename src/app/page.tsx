import Link from "next/link";
import { COMPETENCIES } from "@/content/competencies";
import { MISSIONS } from "@/content/missions";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { CERTIFICATION_MINUTES, CERTIFICATION_MODULES } from "@/content/certification";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoEntry } from "@/components/DemoEntry";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Bits";
import { SceneArt } from "@/components/art/SceneArt";

const ACCENT_BORDER: Record<string, string> = {
  pine: "border-pine bg-pine-wash",
  marigold: "border-marigold bg-marigold-wash",
  denim: "border-denim bg-denim-wash",
};

const ACCENT_TEXT: Record<string, string> = {
  pine: "text-pine-deep",
  marigold: "text-marigold-deep",
  denim: "text-denim-deep",
};

const PLANS = [
  {
    name: "Single classroom",
    price: "$390",
    unit: "per classroom, per year",
    seats: "Up to 30 students",
    features: [
      "All nine missions and both check-in forms",
      "Teacher dashboard and discussion guides",
      "Educator micro-certification",
      "Printable family take-homes",
    ],
  },
  {
    name: "Whole school",
    price: "$2,400",
    unit: "per school, per year",
    seats: "Up to 400 students",
    featured: true,
    features: [
      "Everything in Single classroom",
      "Administrator dashboard and school report",
      "Pre and post benchmark windows",
      "Data retention controls and audit log",
      "Named onboarding contact",
    ],
  },
  {
    name: "District",
    price: "Talk to us",
    unit: "annual agreement",
    seats: "Multiple schools",
    features: [
      "Everything in Whole school",
      "Roster sync via Clever or ClassLink",
      "District-level rollup reporting",
      "Single sign-on",
      "Purchase order and invoicing",
    ],
  },
];

/**
 * Rendered per request: both the demo cards and the staff list are read from
 * the database, and a build-time snapshot would go stale the moment an
 * administrator added a teacher.
 */
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-sand-deep bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <Link href="/" aria-label="AI Ready Kids home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-ink-soft lg:flex">
            <a href="#approach" className="hover:text-ink">The approach</a>
            <a href="#curriculum" className="hover:text-ink">Curriculum</a>
            <a href="#roles" className="hover:text-ink">For your school</a>
            <a href="#privacy" className="hover:text-ink">Privacy</a>
            <a href="#plans" className="hover:text-ink">Plans</a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/join" variant="secondary" size="sm">
              I have a class code
            </ButtonLink>
            <ButtonLink href="/signin" size="sm">
              Educator sign in
            </ButtonLink>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="border-b border-sand-deep bg-paper">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div>
              <Tag tone="pine">Grades 2 to 4 · Annual school subscription</Tag>
              <h1 className="mt-4 font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
                Children meet AI before anyone teaches them about it.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                AI Ready Kids gives seven to ten year olds rehearsed practice at the three
                decisions that actually come up: what to keep private, how to check
                whether something is true, and how to keep the learning their own. Nine
                story missions, every branch written and reviewed by a person.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ButtonLink href="#demo" size="lg">
                  See the whole product
                </ButtonLink>
                <ButtonLink href="#curriculum" variant="secondary" size="lg">
                  Read the curriculum
                </ButtonLink>
              </div>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink">No chatbot, ever.</strong>{" "}
                Students never type into a generative model and never see one respond.
                Every word a child reads here was authored in advance.
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border-4 border-ink bg-surface shadow-sticker-deep">
                <div className="h-52 sm:h-64">
                  <SceneArt art="tablet" />
                </div>
                <div className="border-t-4 border-ink p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
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
                      Leave it blank and tap Start
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Approach */}
        <section id="approach" className="scroll-mt-16 border-b border-sand-deep bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <div className="max-w-3xl">
              <h2 className="font-display text-3xl text-ink">
                The first request for a home address should not be the first time a child
                has thought about it.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                Elementary students already meet these systems, in a sibling&rsquo;s phone,
                a smart speaker, a game, a search box that now answers in sentences.
                Schools cannot control that exposure. What a school can do is make sure the
                decision has been rehearsed first.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "What this is",
                  body: "Short interactive story missions where a child faces a situation, chooses, and gets an answer written for their age. Progress, badges, evidence of specific skills.",
                },
                {
                  title: "What this is not",
                  body: "Not an AI tutor. Not a chatbot. Not a coding course. Not detection or surveillance software, and not a system that scores your students for risk.",
                },
                {
                  title: "What you can claim",
                  body: "That your students have practised specific decisions and can name them. Measured in the fall, measured again in the spring, on scenarios no mission uses.",
                },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border border-sand-deep bg-paper p-5">
                  <h3 className="font-display text-lg text-ink">{c.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section id="curriculum" className="scroll-mt-16 border-b border-sand-deep bg-paper">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="font-display text-3xl text-ink">
              Three competencies. Nine missions. Nothing improvised.
            </h2>
            <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-ink-soft">
              Each competency has three named skills and three missions. A mission takes
              seven to nine minutes and ends with a printable family take-home.
            </p>

            <div className="mt-9 space-y-8">
              {COMPETENCIES.map((competency) => {
                const missions = MISSIONS.filter((m) => m.competency === competency.id);
                return (
                  <div
                    key={competency.id}
                    className={`rounded-2xl border-2 p-5 sm:p-6 ${ACCENT_BORDER[competency.accent]}`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className={`font-display text-2xl ${ACCENT_TEXT[competency.accent]}`}>
                        {competency.formalName}
                      </h3>
                      <p className="text-sm font-semibold text-ink-soft">
                        Student-facing name: “{competency.name}”
                      </p>
                    </div>
                    <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft">
                      {competency.educatorBlurb}
                    </p>
                    <ul className="mt-5 grid gap-3 md:grid-cols-3">
                      {missions.map((m) => (
                        <li
                          key={m.id}
                          className="rounded-xl border border-sand-deep bg-surface p-4"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                            Mission {m.order} · {m.estimatedMinutes} min
                          </p>
                          <h4 className="mt-1.5 font-display text-lg leading-snug text-ink">
                            {m.title}
                          </h4>
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                            {m.teaser}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-16 border-b border-sand-deep bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="font-display text-3xl text-ink">What each person gets</h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-4">
              {[
                {
                  who: "Students",
                  points: [
                    "Join with a class code, then tap their own name",
                    "A competency map, not a score",
                    "Badges with no streaks, points or timers",
                    "Keyboard navigation and read-aloud ready text",
                  ],
                },
                {
                  who: "Teachers",
                  points: [
                    "Preview every branch before assigning",
                    "Completion and demonstrated-skill evidence",
                    "A printable discussion guide per mission",
                    `${CERTIFICATION_MODULES.length}-module certification, about ${CERTIFICATION_MINUTES} minutes`,
                  ],
                },
                {
                  who: "Administrators",
                  points: [
                    "School-level trends, never individual student rows",
                    "Fall and spring benchmark growth",
                    "Retention window and one-click deletion",
                    "An exportable annual report",
                  ],
                },
                {
                  who: "Families",
                  points: [
                    "A one-page take-home for every mission",
                    "Three questions and one thing to try",
                    "No parent account to create",
                    "No child data leaves the school",
                  ],
                },
              ].map((r) => (
                <div key={r.who} className="rounded-xl border border-sand-deep bg-paper p-5">
                  <h3 className="font-display text-xl text-ink">{r.who}</h3>
                  <ul className="mt-3 space-y-2">
                    {r.points.map((p) => (
                      <li key={p} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold-deep" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benchmark */}
        <section className="border-b border-sand-deep bg-pine-wash">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[1fr_1fr]">
            <div>
              <Tag tone="pine">Annual benchmarking</Tag>
              <h2 className="mt-4 font-display text-3xl text-ink">
                Measured twice a year, on situations the missions never used.
              </h2>
              <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-soft">
                A recall quiz would tell you students remember your lessons. That is not
                the claim worth making. Both check-in forms are set somewhere the
                curriculum never goes: a grandparent&rsquo;s kitchen speaker, a museum
                kiosk, a summer camp app, a voice message from a coach.
              </p>
              <ul className="mt-5 space-y-2 text-[0.95rem] leading-relaxed text-ink-soft">
                <li>Nine items per form, three per competency.</li>
                <li>Forms A and B share no scenario, so spring measures transfer.</li>
                <li>Students see no score and no feedback. Adults see cohort growth.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-pine bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Sample item · {BENCHMARK_FORMS.pre.title}
              </p>
              <p className="mt-3 font-display text-lg leading-snug text-ink">
                {BENCHMARK_FORMS.pre.items[0].scenario}
              </p>
              <p className="mt-3 text-sm font-semibold text-ink">
                {BENCHMARK_FORMS.pre.items[0].question}
              </p>
              <ul className="mt-3 space-y-2">
                {BENCHMARK_FORMS.pre.items[0].options.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-lg border border-sand-deep bg-paper px-3.5 py-2.5 text-sm text-ink-soft"
                  >
                    {o.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-16 border-b border-sand-deep bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="font-display text-3xl text-ink">
              Built so there is very little to protect.
            </h2>
            <p className="mt-3 max-w-3xl text-[1.05rem] leading-relaxed text-ink-soft">
              The strongest data protection available to a product like this one is to not
              collect the data. There is no column anywhere in this system for a
              student&rsquo;s surname, birthday, email address or photograph, because a
              column that exists eventually gets filled in.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["No accounts for children", "A class code and a first name with a last initial. Nothing to reset, nothing to steal."],
                ["No open text from students", "Every input is a tap on an authored choice. Children cannot type anything we would then be storing."],
                ["No behavioural tracking", "No time-on-task, no idle timers, no keystroke capture, no risk scoring, no psychological inference."],
                ["No camera, mic or ads", "The product asks for no device permissions at all, and there is no third-party advertising or analytics."],
              ].map(([t, b]) => (
                <div key={t} className="rounded-xl border border-sand-deep bg-paper p-5">
                  <h3 className="font-display text-lg leading-snug text-ink">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <ButtonLink href="/privacy" variant="secondary">
                Read the full privacy and data model
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="scroll-mt-16 border-b border-sand-deep bg-paper">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="font-display text-3xl text-ink">Annual plans</h2>
            <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-ink-soft">
              One subscription per school year, purchased the way schools actually
              purchase: quote, purchase order, invoice.
            </p>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={`flex flex-col rounded-xl border-2 bg-surface p-6 ${
                    p.featured ? "border-pine" : "border-sand-deep"
                  }`}
                >
                  {p.featured && <Tag tone="pine" className="mb-3 self-start">Most schools</Tag>}
                  <h3 className="font-display text-xl text-ink">{p.name}</h3>
                  <p className="mt-3 font-display text-3xl text-ink">{p.price}</p>
                  <p className="text-sm text-ink-soft">{p.unit}</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">{p.seats}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    href="#demo"
                    variant={p.featured ? "primary" : "secondary"}
                    className="mt-6"
                  >
                    Try it first
                  </ButtonLink>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-ink-faint">
              This build takes no payment details and stores no billing information. Plan
              selection in the administrator area is a placeholder that records an intent
              to change, nothing more.
            </p>
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="scroll-mt-16 bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="font-display text-3xl text-ink">Open the demo</h2>
            <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-ink-soft">
              Brightwood Elementary is a fictional school with a full year of fictional
              data: four classes, 90 students, nine missions and both benchmark windows.
              Pick a seat.
            </p>
            <div className="mt-8">
              <DemoEntry />
            </div>
            <p className="mt-5 text-sm text-ink-soft">
              Prefer the real student route?{" "}
              <Link href="/join" className="font-semibold text-pine-deep underline underline-offset-2">
                Join with class code MAPLE-317
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
