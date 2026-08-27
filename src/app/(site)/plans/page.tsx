import type { Metadata } from "next";
import { PageHero, Section } from "@/components/marketing/Page";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Bits";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "Annual subscription plans for classrooms, schools and districts. Quote, purchase order, invoice — no card details anywhere.",
};

const PLANS = [
  {
    name: "Single classroom",
    price: "$390",
    unit: "per classroom, per year",
    seats: "Up to 30 students",
    features: [
      "All 27 missions and both check-in forms",
      "Teacher dashboard and discussion guides",
      "Classroom Mode for projector lessons",
      "Educator orientation, five modules",
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
    // labelled rather than sold.
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

      <Section tone="grape" title="What this build does not do">
        <p className="max-w-3xl text-[1.05rem] leading-relaxed text-ink">
          This demonstration takes no payment details and stores no billing information.
          The plan control in the administrator area records an intent to change and
          writes an audit entry — nothing more. There is no payment processor behind it,
          and there is no card field anywhere in the product. Selecting a plan there does
          not switch anything on.
        </p>
        <p className="mt-4 max-w-3xl text-[1.05rem] leading-relaxed text-ink">
          It also runs a single school. Roster sync through Clever or ClassLink, single
          sign-on, and reporting that rolls several schools into a district view are all
          deliberately deferred — they are named on the District card as production
          requirements rather than listed as features, because an evaluator reading a
          feature list is entitled to assume the features are there. Teachers enter
          rosters by hand, staff sign in by email address with no password, and every
          figure in the product is scoped to one school.
        </p>
      </Section>
    </>
  );
}
