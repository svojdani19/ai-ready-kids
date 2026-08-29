import type { Metadata } from "next";
import { CERTIFICATION_MINUTES, CERTIFICATION_MODULES } from "@/content/certification";
import { ALL_SESSIONS } from "@/content/missions";
import { PageHero, Section } from "@/components/marketing/Page";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "For your school",
  description:
    "What students, teachers, administrators and families each get from AI Ready Kids.",
};

const ROLES = [
  {
    id: "students",
    title: "Students",
    tone: "marigold" as const,
    lede: "Grades 2 to 4, on a Chromebook or a tablet, for seven to nine minutes at a time.",
    points: [
      "Join with a class code, then tap their own name. No password, no account, nothing to reset.",
      "A competency map, not a score. Nobody is ever shown a number or a risk label.",
      "Badges with no streaks, no points and no timers. All nine are equal and nothing expires.",
      "Read-aloud on every dense screen, using the browser's own voice. No microphone is requested.",
      "Keyboard operable, reduced-motion aware, and legible at 200% zoom.",
    ],
  },
  {
    id: "teachers",
    title: "Teachers",
    tone: "pine" as const,
    lede: "Preview everything before a class sees it, then teach it on the board or assign it.",
    points: [
      "Every branch of every mission written out in one page, including coach notes students never see.",
      "Classroom Mode for the projector: teacher-paced, any branch revealable, hands-up tally, nothing recorded.",
      "Completion and demonstrated-skill evidence per student, framed as next teaching steps.",
      "A printable discussion guide and a family take-home for every mission.",
      `A ${CERTIFICATION_MODULES.length}-module educator orientation, about ${CERTIFICATION_MINUTES} minutes, with a printable certificate of completion.`,
    ],
  },
  {
    id: "administrators",
    title: "Administrators",
    tone: "denim" as const,
    lede: "School-level trends, an annual report, and real control over what is kept.",
    points: [
      "Aggregate figures only. There is no route in the product that shows you a named student's answers.",
      "The fall-to-spring difference between two authored check-ins, on matched students.",
      "Groups smaller than five are reported as too few to report, in the product and in every export.",
      "A retention window you set, with the resulting due date shown per class before anything is clicked, and a purge job that acts on it. You can delete any class, and its records, sooner without waiting for the date.",
      "An annual report to print, plus CSV and JSON export, and an audit log of every configuration change.",
    ],
  },
  {
    id: "families",
    title: "Families",
    tone: "grape" as const,
    lede: "One page per mission, in plain language, with nothing to sign up for.",
    points: [
      `A printable take-home for each of the ${ALL_SESSIONS.length} sessions and missions: what was practised, three questions, one thing to try.`,
      "No parent account, because creating one would mean collecting a parent.",
      "Public links with nothing behind them to log into and nothing on them to submit.",
      "One sentence per mission worth keeping, like “Sounding sure is not the same as being right.”",
    ],
  },
];

const WRAP: Record<string, string> = {
  marigold: "border-marigold bg-marigold-wash",
  pine: "border-pine bg-pine-wash",
  denim: "border-denim bg-denim-wash",
  grape: "border-grape bg-grape-wash",
};

export default function ForSchoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="For your school"
        tone="grape"
        title="Four people have to get something out of this."
        lede="A product that only works for the child does not survive a term. Here is what each person actually gets, and what each one deliberately cannot see."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/demo">Sit in any seat</ButtonLink>
          <ButtonLink href="/plans" variant="secondary">
            See plans
          </ButtonLink>
        </div>
      </PageHero>

      {ROLES.map((role, index) => (
        <Section key={role.id} id={role.id} tone={index % 2 === 0 ? "surface" : "paper"}>
          <div className={`rounded-3xl border-4 p-5 sm:p-7 ${WRAP[role.tone]}`}>
            <h2 className="font-display text-3xl text-ink">{role.title}</h2>
            <p className="mt-2 max-w-2xl text-[1.05rem] leading-relaxed text-ink-soft">
              {role.lede}
            </p>
            <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
              {role.points.map((p) => (
                <li
                  key={p}
                  className="flex gap-2.5 rounded-xl border-2 border-ink bg-surface px-4 py-3 text-[0.95rem] leading-relaxed text-ink"
                >
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-grape" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ))}
    </>
  );
}
