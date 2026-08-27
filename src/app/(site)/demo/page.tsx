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
    blurb:
      "The projector experience. Arrow keys drive it, 1/2/3 reveal what any branch does, Esc goes back to the choices. Nothing is recorded.",
  },
  {
    href: "/teacher/missions/the-penguin-on-the-playground",
    label: "Every branch, before you assign it",
    blurb:
      "The complete content of one mission in a single page, including the coach notes a student never sees.",
  },
  {
    href: "/admin/report",
    label: "The annual school report",
    blurb:
      "Aggregate only, small groups suppressed, with CSV and JSON export. Suitable for a board packet.",
  },
  {
    href: "/admin/data",
    label: "Data and retention",
    blurb:
      "Everything collected, everything refused, and the date each class is deleted — before you click anything.",
  },
  {
    href: "/family/four-doors",
    label: "A family take-home",
    blurb: "One page, plain language, no account. This is what goes home in a bag.",
  },
  {
    href: "/join",
    label: "The real student route",
    blurb: "Class code MAPLE-317, then tap a name. This is how a child actually gets in.",
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
            Join with class code MAPLE-317
          </Link>
          . Other codes: ACORN-208 (Grade 2), HERON-455 (Grade 4), CEDAR-361 (Grade 3).
        </p>
      </Section>

      <Section
        tone="paper"
        title="Worth looking at specifically"
        lede="Once you are signed in as a teacher or administrator, these are the screens that show what the product is really for."
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
