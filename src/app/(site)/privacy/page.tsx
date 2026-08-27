import type { Metadata } from "next";
import Link from "next/link";
import { MISSIONS } from "@/content/missions";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { MIN_REPORTABLE_GROUP } from "@/lib/repo/report";
import { ButtonLink } from "@/components/ui/Button";
import { Note } from "@/components/ui/Bits";

export const metadata: Metadata = {
  title: "Privacy and data model",
  description:
    "Exactly what AI Ready Kids collects about a student, what it refuses to collect, and how a school deletes it.",
};

const SECTIONS = [
  {
    id: "collected",
    title: "Everything we hold about a student",
    body: [
      "A display name, which is a first name and a last initial, entered by the teacher.",
      "An animal avatar, assigned automatically from a set of ten. Never uploaded, never a photo.",
      "The class they belong to.",
      "Which authored choices they tapped in each mission, stored as content identifiers.",
      "Which option they selected for each check-in item.",
      "The timestamps at which a mission was opened and finished.",
    ],
    footnote:
      "That is the complete list. There is no free-text field anywhere in the student experience, so there is nothing a child could type that we would then be storing.",
  },
  {
    id: "refused",
    title: "What has no column in the database",
    body: [
      "Surnames, dates of birth, home addresses, phone numbers or student email addresses.",
      "Photographs, audio or video. The product requests no camera or microphone permission at any point.",
      "Location of any kind, including IP-derived approximations.",
      "Time on task, idle timers, keystroke timing, mouse movement or any other behavioural telemetry.",
      "Risk scores, readiness bands, personality profiles or predictions about how a child will behave.",
      "Advertising identifiers, third-party analytics, session recording or any tracker.",
    ],
    footnote:
      "These are absent from the schema rather than merely hidden from the interface. A column that exists eventually gets filled in, so the ones we do not want do not exist.",
  },
  {
    id: "children",
    title: "Why children have no accounts",
    body: [
      "A student joins by typing a class code their teacher shows the room, then tapping their own name.",
      "There is no password to reset, no email address to verify and no recovery flow to attack.",
      "A class code protects a child's own progress list. That is the entire value of what sits behind it, and the security is proportionate to that.",
      "In a district deployment this is replaced by your roster sync and single sign-on, at which point the class code disappears.",
    ],
  },
  {
    id: "ai",
    title: "The AI question, answered plainly",
    body: [
      "No generative model runs in this product. Not in the student experience, not in the teacher tools, not in report generation.",
      "Every sentence a child can read was written by a person and shipped with the build, which is what makes the content reviewable in structure.",
      "The fictional AI characters a child meets in the missions are authored scripts. They are the subject matter, not a live system.",
      "Nothing a student does is sent to a third-party model, because nothing a student does leaves the school's own deployment.",
    ],
  },
  {
    id: "reporting",
    title: "What adults can and cannot see",
    body: [
      "A teacher sees their own roster with which skills each student has demonstrated. They need it to teach.",
      "An administrator sees aggregate figures only. There is no route in the product that shows an administrator a named student's answers.",
      `A figure is shown as "too few to report" unless at least ${MIN_REPORTABLE_GROUP} distinct students contributed to that particular figure, in the product and in every export. Contributing means having actually done the thing being measured, which is usually fewer students than are enrolled: a competency rate counts the children who completed a mission offering the skill, and check-in growth counts the children who completed both windows.`,
      "Individual check-in answers are never displayed to anyone. The check-in produces a cohort measurement, not a record about a child.",
      "Nothing in the product produces a label, a band or an inference about a child's character or judgement.",
    ],
  },
  {
    id: "retention",
    title: "Deletion is a date, not a policy paragraph",
    body: [
      "An administrator sets a retention window and the product shows the resulting deletion date for every class before anything is clicked.",
      "Deleting a class removes its roster, every mission attempt and both check-ins in the same operation. Rows are removed, not flagged.",
      "Every configuration change and every deletion writes an audit entry naming who did it and when.",
      "A school can delete everything at any time without contacting us, because the data is theirs.",
    ],
  },
  {
    id: "families",
    title: "Families",
    body: [
      "There is no parent account, because creating one would mean collecting a parent.",
      "Every mission ships with a one-page take-home in plain language: what was practised, three questions to ask, one thing to try.",
      "Those pages are public links with nothing behind them to sign into and nothing on them to submit.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-grape-wash">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">
            Privacy and data model
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
            The best protection we can offer is not collecting it.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            This page is the whole story, not a summary of a longer document kept
            elsewhere. It describes {MISSIONS.length} missions,{" "}
            {BENCHMARK_FORMS.pre.items.length * 2} benchmark items and every record the
            product creates about a seven year old.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-12">
        <nav aria-label="On this page" className="mt-8 rounded-xl border border-sand-deep bg-surface p-5">
          <ol className="grid gap-1.5 sm:grid-cols-2">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                >
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="font-display text-2xl text-ink">{section.title}</h2>
              <ul className="mt-3.5 space-y-2.5">
                {section.body.map((line) => (
                  <li key={line} className="flex gap-3 text-[1.05rem] leading-relaxed text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold-deep"
                    />
                    {line}
                  </li>
                ))}
              </ul>
              {section.footnote && (
                <p className="mt-4 border-l-4 border-sand-deep pl-4 text-[0.95rem] leading-relaxed text-ink-soft">
                  {section.footnote}
                </p>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 space-y-4">
          <Note tone="denim" title="On FERPA and COPPA">
            Mission and check-in records are education records under FERPA. The school holds
            them, controls them and deletes them on its own schedule. Because the product
            collects no personal information beyond a display name a teacher chose, and gives
            a child no way to disclose any, the COPPA surface is deliberately small. This is
            an accurate description of how the software is built. It is not a legal opinion,
            and AI Ready Kids does not claim any compliance certification.
          </Note>
          <Note tone="neutral" title="What this build is">
            A local demonstration. Every school, staff member and student in it is fictional.
            Sign-in is by email with no password and the session cookie is signed with a key
            generated on first run. None of that is production authentication, and the README
            says so in the same words.
          </Note>
        </div>
      </div>
    </>
  );
}
