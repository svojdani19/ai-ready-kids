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
    features: [
      "Everything in Whole school",
      "Roster sync via Clever or ClassLink",
      "District-level rollup reporting",
      "Single sign-on",
      "Purchase order and invoicing",
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
              <ul className="mt-5 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[0.95rem] leading-relaxed text-ink-soft">
                    <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pine" />
                    {f}
                  </li>
                ))}
              </ul>
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
          and there is no card field anywhere in the product.
        </p>
      </Section>
    </>
  );
}
