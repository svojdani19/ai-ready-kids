import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FOUNDATIONS } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";

const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const byId = (id: string) => FOUNDATIONS.find((m) => m.id === id)!;

/** Every child-facing string in a session: narration, prompts, choices, feedback, wrap-up. */
function childCopy(id: string): string {
  const m = byId(id);
  const out: string[] = [];
  for (const scene of m.scenes) {
    out.push(...(scene.narration ?? []));
    if (scene.prompt) out.push(scene.prompt);
    if (scene.wrapUp) out.push(...scene.wrapUp);
    for (const c of scene.choices ?? []) {
      out.push(c.label, c.feedback.headline, c.feedback.body);
    }
  }
  return out.join(" ");
}

/** Everything an adult reads about a session. */
function adultCopy(id: string): string {
  const m = byId(id);
  return [
    m.bigIdea,
    m.summary,
    ...m.learningGoals,
    m.guide.setup,
    ...m.guide.lookFor,
    ...m.guide.questions,
    ...m.guide.misconceptions.flatMap((x) => [x.student, x.response]),
    m.guide.extension,
    m.family.summary,
    ...m.family.questions,
    m.family.tryAtHome,
    m.family.familyRule,
  ].join(" ");
}

/**
 * A definition a seven year old hears once becomes the category rule.
 *
 * Session one used to say "AI is a computer program that fills in what usually
 * comes next" in its big idea, learning goal, narration, wrap-up, family
 * summary and family rule — and session two then correctly called a
 * recommendation and a face match AI. To a child that is a contradiction, and
 * what survives is "AI = autocomplete", which no later mission can build on.
 *
 * The fix separates the category from the example. These tests hold that line:
 * the broad idea is patterns from many examples producing a guess, and the next
 * word is one instance of it.
 */
const CATEGORICAL = [
  /AI is a computer program that fills in what usually comes next/i,
  /AI fills in what usually comes next/i,
  /An AI tool produces what usually follows(?!\s+the words)/i,
  /AI is a program which produces what usually comes next/i,
];

describe("First Look teaches a category, not one example of it", () => {
  it.each(FOUNDATIONS.map((m) => [m.id, m.title] as const))(
    "%s carries no categorical fills-in-what-comes-next definition",
    (id) => {
      const all = `${childCopy(id)} ${adultCopy(id)}`;
      for (const pattern of CATEGORICAL) expect(all).not.toMatch(pattern);
    },
  );

  it("states the broad idea in the first session's own words", () => {
    const first = byId("f-early-1");
    // Patterns, from many examples, producing a guess.
    expect(first.bigIdea).toMatch(/patterns/i);
    expect(first.bigIdea).toMatch(/lots and lots of examples/i);
    expect(first.bigIdea).toMatch(/guess/i);
    // And this session's example, marked as one instance.
    expect(first.bigIdea).toMatch(/This one guesses a word/i);
    expect(first.learningGoals[0]).toMatch(/patterns from lots of examples to make a guess/i);
  });

  it("keeps the word example teaching patterns, limits and likelihood", () => {
    const first = byId("f-early-1");
    const all = `${childCopy("f-early-1")} ${adultCopy("f-early-1")}`;
    // Learned from many examples.
    expect(all).toMatch(/millions of sentences|lots and lots of examples|enormous number of examples/i);
    // Likely, not true.
    expect(all).toMatch(/likely is not the same as sure|likely next word is not the same as a true one/i);
    // No personal knowledge.
    expect(all).toMatch(/never met you|has not met us|never met them/i);
    // The concrete example survives.
    expect(childCopy("f-early-1")).toMatch(/cat sat on the/i);
    const wrap = first.scenes.at(-1)!.wrapUp!.join(" ");
    expect(wrap).toMatch(/patterns/i);
    expect(wrap).toMatch(/the word that is likely to come next/i);
  });

  it("makes session two an expansion to other kinds of guess", () => {
    const second = byId("f-early-2");
    expect(second.bigIdea).toMatch(/guesses more than just words/i);
    const child = childCopy("f-early-2");
    // Word, recommendation, and face match — named as different guesses.
    expect(child).toMatch(/One guesses a word/i);
    expect(child).toMatch(/guesses what you will like/i);
    expect(child).toMatch(/guesses where your face is/i);
    // The callback to session one presents it as one kind, not the definition.
    expect(child).toMatch(/Guessing words is one kind of guess/i);
    expect(child).not.toMatch(/the same trick from last time/i);
  });

  it("does not let session two imply every automated thing is AI", () => {
    const adult = adultCopy("f-early-2");
    expect(adult).toMatch(/everything on a screen is AI/i);
    expect(adult).toMatch(/calculator is not guessing/i);
    expect(adult).toMatch(/Fast is not the test/i);
    // The distractor asks for a guess rather than a fill-in.
    expect(childCopy("f-early-2")).toMatch(/A hook does not guess anything/i);
  });

  it("scopes the upper track's phrase to the writing tool it describes", () => {
    const upper = byId("f-upper-1");
    // The category comes first, the tool second.
    expect(upper.bigIdea).toMatch(/AI tool works from patterns in a huge number of examples/i);
    expect(upper.bigIdea).toMatch(/A writing tool uses them to produce what usually follows/i);
    expect(upper.learningGoals[0]).toMatch(/AI tools work from patterns in examples/i);
    const wrap = upper.scenes.find((s) => s.wrapUp)!.wrapUp!.join(" ");
    expect(wrap).toMatch(/AI tools work from patterns/i);
    expect(upper.family.summary).toMatch(/a writing tool uses those patterns/i);
  });
});

describe("the adult-facing surfaces say the same thing", () => {
  it("the foundations overview describes the category, not the example", () => {
    const overview = src("src/content/foundations/index.ts");
    expect(overview).toMatch(/works from patterns in many examples to make a guess/i);
    expect(overview).toMatch(/producing a likely next word is one kind/i);
    expect(overview).not.toMatch(/AI is a program which produces what usually comes next/i);
  });

  it("the educator orientation describes the category, and names other guesses", () => {
    const orientation = CERTIFICATION_MODULES.find((m) => m.id === "cert-1")!;
    const body = orientation.body.join(" ");
    expect(body).not.toMatch(/AI is a program which produces what usually comes next/i);
    expect(body).toMatch(/patterns from a great many examples/i);
    expect(body).toMatch(/likely next word being one kind of guess/i);
    // The other kinds session two actually teaches.
    expect(body).toMatch(/matching a face/i);
    expect(body).toMatch(/choosing what plays next/i);
  });
});
