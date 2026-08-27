import type { Metadata } from "next";
import { CERTIFICATION_MINUTES, CERTIFICATION_MODULES } from "@/content/certification";
import { PageHero, Section, CardGrid } from "@/components/marketing/Page";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Practice before exposure: why grades 2 to 4 rehearse AI decisions in authored story missions rather than being warned about them.",
};

export default function ApproachPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        tone="grape"
        title="The first request for a home address should not be the first time a child has thought about it."
        lede="Elementary students already meet these systems, in a sibling's phone, a smart speaker, a game, a search box that now answers in sentences. Schools cannot control that exposure. What a school can do is make sure the decision has been rehearsed first."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/curriculum">Read the curriculum</ButtonLink>
          <ButtonLink href="/demo" variant="secondary">
            See the demo
          </ButtonLink>
        </div>
      </PageHero>

      <Section tone="surface">
        <CardGrid
          cards={[
            {
              title: "What this is",
              tone: "pine",
              body: "Short interactive story missions where a child faces a situation, chooses, and gets an answer written for their age. Progress, badges, evidence of specific skills.",
            },
            {
              title: "What this is not",
              tone: "berry",
              body: "Not an AI tutor. Not a chatbot. Not a coding course. Not detection or surveillance software, and not a system that scores your students for risk.",
            },
            {
              title: "What you can claim",
              tone: "grape",
              body: "That your students have practised specific decisions and can name them. Measured in the fall, measured again in the spring, on scenarios no mission uses.",
            },
          ]}
        />
      </Section>

      <Section
        tone="paper"
        title="Why it is authored, not generated"
        lede="Every branch, every piece of feedback and every character line ships with the build. Nothing is produced at run time."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [
              "A child cannot be surprised by it",
              "A finite graph of hand-written scenes can be read end to end by a teacher before a class ever sees it. A model's output cannot.",
            ],
            [
              "A child cannot type into it",
              "Every input in the student experience is a tap on an authored choice. There is no text box, so there is nothing a child could disclose.",
            ],
            [
              "It can be tested mechanically",
              "Automated tests check that every scene is reachable, every path terminates, every choice has feedback, and no unsafe branch is a dead end.",
            ],
            [
              "It does not expire",
              "The transferable lessons are phrases, not interfaces: sounding sure is not the same as being right; good help leaves the thinking with you.",
            ],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border-2 border-ink bg-surface p-5">
              <h3 className="font-display text-lg leading-snug text-ink">{t}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        tone="pine"
        title="Teachers are prepared too"
        lede={`A ${CERTIFICATION_MODULES.length}-module micro-certification, about ${CERTIFICATION_MINUTES} minutes in total, designed for two prep periods rather than a summer institute.`}
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {CERTIFICATION_MODULES.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border-2 border-pine bg-surface px-4 py-3 text-[0.95rem] font-semibold text-ink"
            >
              {m.order}. {m.title}
              <span className="ml-2 text-sm font-normal text-ink-soft">{m.minutes} min</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
