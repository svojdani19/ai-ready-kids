import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/marketing/Page";
import { DemoEntry } from "@/components/DemoEntry";

export const metadata: Metadata = {
  title: "Open the demo",
  description:
    "Sit in the student, teacher or administrator seat at a fictional school with a full year of fictional data.",
};

/** Reads the seeded database for the demo card copy, so it never goes stale. */
export const dynamic = "force-dynamic";

const HIGHLIGHTS: { href: string; label: string; blurb: string }[] = [
  {
    href: "/teacher/classroom/sprocket-wants-to-know",
    label: "Classroom Mode",
    blurb: "The projector experience. Nothing is recorded.",
  },
  {
    href: "/teacher/missions/the-penguin-on-the-playground",
    label: "Every branch, before you assign it",
    blurb: "A whole mission on one page, coach notes and all.",
  },
  {
    href: "/admin/report",
    label: "The annual school report",
    blurb: "Aggregate only, small groups suppressed. Board-packet ready.",
  },
  {
    href: "/admin/data",
    label: "Data and retention",
    blurb: "Everything collected, everything refused, and when it goes.",
  },
  {
    href: "/family/four-doors",
    label: "A family take-home",
    blurb: "One page, plain language, no account.",
  },
  {
    href: "/join",
    label: "The real student route",
    blurb: "A class code, then tap a name. How a child actually gets in.",
  },
];

export default function DemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Demo"
        tone="marigold"
        title="Sit in any seat and look around."
        lede="Brightwood Elementary is a fictional school with a full year of fictional data: four classes, 90 students, a curriculum of 27 missions and both check-in windows. No real school, staff member or child appears anywhere in this product."
      />

      <Section tone="surface" title="Pick a seat">
        <DemoEntry />
        <p className="mt-5 text-[0.95rem] text-ink-soft">
          Prefer the route a child actually takes?{" "}
          <Link href="/join" className="font-bold text-grape-deep underline underline-offset-4">
            Join with class code MAPLE-HERON-317
          </Link>
          . Other codes: ACORN-BADGER-208 (Grade 2), HERON-TULIP-455 (Grade 4), CEDAR-ROBIN-361 (Grade 3).
        </p>
      </Section>

      <Section
        tone="paper"
        title="Worth a look"
        lede="Teacher and administrator screens, once you are signed in."
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {HIGHLIGHTS.map((h) => (
            <li key={h.href}>
              <Link
                href={h.href}
                className="ark-sticker block h-full rounded-2xl border-4 border-ink bg-surface p-5 transition-colors hover:bg-grape-wash"
              >
                <h3 className="font-display text-lg leading-snug text-ink">{h.label}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{h.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
