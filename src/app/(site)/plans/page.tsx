import type { Metadata } from "next";
import { PageHero, Section } from "@/components/marketing/Page";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Bits";
import { Disclosure } from "@/components/ui/Disclosure";
import {
  CORE_GRADE_LABEL,
  CORE_MISSION_COUNT,
  FIRST_LOOK_SESSIONS_PER_CLASS,
  FIRST_LOOK_TOTAL_SESSIONS,
  FIRST_LOOK_TRACK_LABELS,
} from "@/content/scope";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "Annual subscription plans for classrooms, schools and districts. Quote, purchase order, invoice — no card details anywhere.",
};

/**
 * What a school is actually buying, per year.
 *
 * Family take-homes were on the Single classroom list until this sprint's
 * acceptance correction and are not any more. Sprint 81 gated the authored
 * curriculum behind the term and deliberately left `/family/[slug]` public:
 * 33 statically generated pages, no
 * session, nothing to sign into and nothing to submit, so a caregiver reaches
 * one from a paper sheet without an account existing anywhere. That is worth
 * keeping — it is the reason no parent is ever collected — but it meant the
 * plans page was selling by the year something the product hands out for free
 * to anyone with the link.
 *
 * The gap was closed on the copy rather than on the page, because privatizing
 * the caregiver pages to justify the bullet would have made the product worse
 * to protect a sentence. Exported so `tests/instruction-entitlement.test.ts`
 * can assert on this list rather than on rendered prose: the public-route
 * decision and the commercial claim are one fact, and must move together.
 */
export const PLANS = [
  {
    name: "Single classroom",
    price: "$390",
    unit: "per classroom, per year",
    seats: "Up to 30 students",
    features: [
      `All ${CORE_MISSION_COUNT} core missions and both check-in forms, written for ${CORE_GRADE_LABEL}`,
      `First Look: ${FIRST_LOOK_TOTAL_SESSIONS} authored introductory sessions, of which a class runs the three written for its grade — a ${FIRST_LOOK_TRACK_LABELS[0]} track, or a ${FIRST_LOOK_TRACK_LABELS[1]} track`,
      "Teacher dashboard and discussion guides",
      "Classroom Mode for projector lessons",
      "Educator orientation, five modules",
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
      "Fall and spring benchmark windows",
      "Data retention controls and audit log",
      "Named onboarding contact",
    ],
  },
  {
    name: "District",
    price: "Talk to us",
    unit: "annual agreement",
    seats: "Multiple schools",
    features: ["Everything in Whole school", "Purchase order and invoicing"],
    // Not built. This demonstration runs one school, on a file-backed
    // database, with email-only sign-in and manually entered rosters. Listing
    // these beside the working features let an evaluator conclude a district
    // subscription includes integrations that do not exist, so they are
    // labeled rather than sold.
    planned: [
      "Roster sync via Clever or ClassLink",
      "District-level rollup reporting",
      "Single sign-on",
    ],
  },
];

export default function PlansPage() {
  return (
    <>
      <PageHero
        eyebrow="Plans"
        tone="pine"
        title="One subscription per school year."
        lede="Bought the way schools actually buy: a quote, a purchase order, an invoice. Prices shown are illustrative for this demonstration build."
      />

      <Section tone="paper">
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-3xl border-4 bg-surface p-6 ${
                p.featured ? "border-pine shadow-sticker-deep" : "border-ink"
              }`}
            >
              {p.featured && (
                <Tag tone="pine" className="mb-3 self-start">
                  Most schools
                </Tag>
              )}
              <h2 className="font-display text-2xl text-ink">{p.name}</h2>
              <p className="mt-3 font-display text-4xl text-ink">{p.price}</p>
              <p className="text-sm text-ink-soft">{p.unit}</p>
              <p className="mt-1 text-sm font-bold text-ink-soft">{p.seats}</p>
              <ul className="mt-5 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[0.95rem] leading-relaxed text-ink-soft">
                    <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pine" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex-1">
                {p.planned && (
                  <div className="mt-5 rounded-xl border-2 border-dashed border-sand-deep p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                      Not in this build
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {p.planned.map((f) => (
                        <li key={f} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                          <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-sand-deep" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                      Production requirements for a district deployment, not features you
                      can use today.
                    </p>
                  </div>
                )}
              </div>
              <ButtonLink
                href="/demo"
                variant={p.featured ? "primary" : "secondary"}
                className="mt-6"
              >
                Try it first
              </ButtonLink>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="denim" title="What a subscription is for, and which grades">
        <p className="max-w-3xl text-[1.05rem] leading-relaxed text-ink">
          The assessed program is <strong>{CORE_GRADE_LABEL}</strong>: all{" "}
          {CORE_MISSION_COUNT} core missions, both check-ins, the nine-skill evidence, the
          badges and the school report. <strong>First Look is included and is not part of
          that</strong> — it introduces the idea to a class that has not been told what AI
          is, and records no skill evidence.
        </p>

        <div className="mt-6 grid max-w-3xl gap-3">
          <Disclosure summary="Which grades a class can be created in">
            <p>
              <strong>Classes are created in {CORE_GRADE_LABEL}.</strong> First Look ships{" "}
              {FIRST_LOOK_TOTAL_SESSIONS} sessions in two tracks because those are the two
              reading levels the sessions are written for, and a class runs the{" "}
              {FIRST_LOOK_SESSIONS_PER_CLASS} matching its grade: a Grade 2 class runs the{" "}
              {FIRST_LOOK_TRACK_LABELS[0]} track, Grades 3 and 4 the{" "}
              {FIRST_LOOK_TRACK_LABELS[1]} one. This is a {CORE_GRADE_LABEL} program, built
              to be exactly that rather than to stretch.
            </p>
          </Disclosure>

          <Disclosure summary="How the grade boundary is enforced">
            <p>
              Enforced, not advertised: a class is offered only the First Look track
              written for its grade, the core missions only if its grade is inside the
              band, and a mission outside it cannot be assigned, listed for a child, opened
              or resumed. Every mission card shows its grade band.
            </p>
          </Disclosure>

          <Disclosure summary="Family take-homes are free, with or without a subscription">
            <p>
              The one-page family take-home for every session and mission is a{" "}
              <strong>free public resource</strong> and is not part of any plan. The pages
              need no subscription, no account and no sign-in: they are ordinary links a
              school can print, photocopy or send home, and they stay readable whether or
              not the school has a current subscription. Nothing on them collects anything
              from a family, which is the reason they work this way.
            </p>
            <p className="mt-3">
              What a subscription buys is the classroom side: the missions and their
              branches, the printable discussion guides, Classroom Mode and the educator
              orientation. Those are licensed for the term. A school&rsquo;s own records —
              rosters, class history, reports, exports, retention and deletion — are the
              school&rsquo;s and stay reachable either way.
            </p>
            <p className="mt-3">
              <ButtonLink href="/family/four-doors" variant="secondary">
                Read a family take-home
              </ButtonLink>
            </p>
          </Disclosure>

          <Disclosure summary="What this demonstration build does not do">
            <p>
              It takes no payment details and stores no billing information. The plan
              control in the administrator area records an intent to change and writes an
              audit entry — nothing more. There is no payment processor behind it and no
              card field anywhere in the product, and selecting a plan there does not
              switch anything on.
            </p>
            <p className="mt-3">
              It also runs a single school. Roster sync through Clever or ClassLink, single
              sign-on, and reporting that rolls several schools into a district view are
              deliberately deferred — named on the District card as production
              requirements rather than listed as features, because an evaluator reading a
              feature list is entitled to assume the features are there. Teachers enter
              rosters by hand, staff sign in by email address with no password, and every
              figure in the product is scoped to one school.
            </p>
          </Disclosure>
        </div>
      </Section>

    </>
  );
}
