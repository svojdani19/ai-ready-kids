import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NOT_THIS, WHAT_IS_RECORDED } from "@/content/session-guide";
import { ALL_SESSIONS, MISSIONS } from "@/content/missions";

/**
 * Where each kind of evidence lives, held to where it can actually live.
 *
 * The session guide told teachers that a core mission's authored choices and
 * its demonstrated-or-developing judgment were "on your roster **and in the
 * family take-home**". `/family/[slug]` is one statically generated page per
 * mission: prerendered at build time, no session, no child id, no record
 * lookup, four authored fields, the same four for every family in the class.
 * It could not carry an individual result if it wanted to.
 *
 * That mattered because a teacher repeats what the guide says. A caregiver told
 * to look for their child's result finds generic curriculum; a child told their
 * family will see how they did is wrong; and a buyer reading the product's own
 * explanation of its data finds it promising child evidence on a page that
 * cannot technically contain it.
 *
 * These tests couple the claim to the route. The take-home may be described as
 * much as anyone likes, but not as somewhere a child's individual result
 * appears — and the route it describes has to stay the generic public page that
 * makes that true. Break either half and this file objects.
 */

const familySource = readFileSync(
  join(process.cwd(), "src/app/family/[slug]/page.tsx"),
  "utf8",
);

const guideSource = readFileSync(join(process.cwd(), "src/content/session-guide.ts"), "utf8");

/** Anything that would name an individual child's result. */
const INDIVIDUALIZED =
  /\b(choices?|demonstrated|developing|per-skill|per-child|their (own )?(result|score|evidence|progress)|how (they|their child) did|skill evidence|judgment)\b/i;

/** Sentences that are about the take-home, wherever a teacher reads them. */
function takeHomeClaims(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const row of WHAT_IS_RECORDED) {
    for (const sentence of `${row.shape}. ${row.recorded}`.split(/(?<=\.)\s+/)) {
      if (/take-home|family (page|sheet)/i.test(sentence)) {
        out.push({ where: `WHAT_IS_RECORDED[${row.shape}]`, text: sentence });
      }
    }
  }
  for (const line of NOT_THIS) {
    for (const sentence of line.split(/(?<=\.)\s+/)) {
      if (/take-home|family (page|sheet)/i.test(sentence)) {
        out.push({ where: "NOT_THIS", text: sentence });
      }
    }
  }
  return out;
}

describe("the teacher guide says where evidence actually lives", () => {
  it("separates what a core mission stores from what a teacher can see", () => {
    // Two rows, deliberately. The first fix put both facts in one sentence —
    // "that evidence lives in one place: your roster and dashboard" — which
    // traded the family error for a smaller one in the same shape: a teacher
    // goes looking for the choices on a page that renders only the judgment.
    const stored = WHAT_IS_RECORDED.find((r) => /core mission.*stored/i.test(r.shape));
    const shown = WHAT_IS_RECORDED.find((r) => /core mission.*(see|shown)/i.test(r.shape));
    expect(stored, "the guide should say what a core mission stores").toBeDefined();
    expect(shown, "the guide should say what a teacher can see").toBeDefined();

    // Storage names both, and says what the choice path is actually for.
    expect(stored!.recorded).toMatch(/choices/i);
    expect(stored!.recorded).toMatch(/demonstrated or developing/i);
    expect(stored!.recorded).toMatch(/resume|reached a real ending/i);

    // Display names the judgment and denies the choice history outright.
    expect(shown!.recorded).toMatch(/roster and dashboard/i);
    expect(shown!.recorded).toMatch(/demonstrated or developing/i);
    expect(shown!.recorded).toMatch(/no screen anywhere in the product/i);
    expect(shown!.recorded).toMatch(/nothing in any export/i);

    // The collapsed claims are gone from the guide entirely.
    const all = WHAT_IS_RECORDED.map((r) => r.recorded).join(" ");
    expect(all).not.toMatch(/lives in one place/i);
    expect(all).not.toMatch(/it is not sent anywhere/i);
    expect(all).not.toMatch(/\bin the family (take-home|page|sheet)\b/i);
  });

  it("gives the take-home its own row, saying it holds nothing about a child", () => {
    const sheet = WHAT_IS_RECORDED.find((r) => /take-home/i.test(r.shape));
    expect(sheet, "the guide should say outright what the take-home records").toBeDefined();
    expect(sheet!.recorded).toMatch(/nothing about any child/i);
    // Neither the stored run nor the shown judgment.
    expect(sheet!.recorded).toMatch(/neither/i);
    // Same page for everyone is the fact that makes the rest true.
    expect(sheet!.recorded).toMatch(/same .*page for every family|every family in the class/i);
  });

  it("never describes the take-home as carrying an individual result", () => {
    const claims = takeHomeClaims();
    // A sanity check on the extractor: if this ever finds nothing, every
    // assertion below passes vacuously.
    expect(claims.length).toBeGreaterThanOrEqual(2);
    for (const claim of claims) {
      // A sentence may deny an individual result; it may not promise one.
      const denies = /\bno\b|\bnothing\b|\bnot\b|holds no|comes from you/i.test(claim.text);
      if (denies) continue;
      expect(claim.text, `${claim.where}: "${claim.text}"`).not.toMatch(INDIVIDUALIZED);
    }
  });

  it("tells a teacher not to point a family at the sheet for a result", () => {
    expect(NOT_THIS.join(" ")).toMatch(/take-home/i);
    expect(NOT_THIS.join(" ")).toMatch(/same page for the whole class|holds no individual result/i);
  });

  it("no longer says a child's evidence is for their family", () => {
    // The old line implied the family receives the judgment. Nothing in the
    // product sends it to them, and this guide is where that belief started.
    expect(guideSource).not.toMatch(/evidence is for you and their family/i);
  });
});

/**
 * The other half of the same fact. The claims above are only true while the
 * route stays what it is, so the route is asserted here rather than assumed.
 */
describe("the route the guide describes is generic, public and static", () => {
  it("renders four authored fields and looks up no record", () => {
    // Everything the page reads comes off the mission's authored `family`
    // block. A child, an attempt or an evidence lookup appearing here would
    // make the guide's new wording false.
    expect(familySource).toMatch(/mission\.family\.summary/);
    expect(familySource).toMatch(/mission\.family\.questions/);
    expect(familySource).toMatch(/mission\.family\.tryAtHome/);
    expect(familySource).toMatch(/mission\.family\.familyRule/);
    for (const forbidden of [
      "getStudent",
      "getAttempt",
      "listStudents",
      "evidence",
      "competency_",
      "studentId",
    ]) {
      expect(familySource, `the family page must not reach for ${forbidden}`).not.toContain(
        forbidden,
      );
    }
  });

  it("takes no session and stays statically generated", () => {
    expect(familySource).not.toMatch(/require(Staff|Teacher|Admin|OpenCurriculum|Student)\(/);
    expect(familySource).not.toMatch(/\bcookies\(/);
    expect(familySource).toContain("export function generateStaticParams");
    expect(familySource).not.toMatch(/force-dynamic|revalidate\s*=\s*0/);
  });

  it("is the same page for every family, because it is the same page per mission", () => {
    // One route parameter, the mission slug. Nothing narrows it to a child, so
    // two families in one class necessarily read identical pages.
    expect(familySource).toMatch(/params:\s*Promise<\{\s*slug:\s*string\s*\}>/);
    expect(familySource).not.toMatch(/\bstudent\b/i);
  });

  it("holds an authored take-home for every session, none of it per-child", () => {
    // The guide says "the same printed page for every family in the class". That
    // is only a complete answer if every session actually has one.
    for (const session of ALL_SESSIONS) {
      expect(session.family.summary, `${session.slug} has no family summary`).toBeTruthy();
      expect(session.family.familyRule, `${session.slug} has no family rule`).toBeTruthy();
      expect(session.family.questions.length).toBeGreaterThan(0);
    }
    // And none of that authored copy promises a result either.
    for (const mission of MISSIONS) {
      const copy = [
        mission.family.summary,
        mission.family.tryAtHome,
        mission.family.familyRule,
        ...mission.family.questions,
      ].join(" ");
      expect(copy, `${mission.slug}'s take-home promises an individual result`).not.toMatch(
        /\b(demonstrated|developing|per-skill|their score|how they did on)\b/i,
      );
    }
  });
});

/**
 * The third half of the same fact: what the teacher's own pages render.
 *
 * The guide now claims the roster shows a demonstrated-or-developing judgment
 * and no child-by-child choice history. That is a claim about
 * `/teacher/class/[classId]`, so it is asserted there rather than believed.
 */
describe("the roster shows the judgment and not the run", () => {
  const classPage = readFileSync(
    join(process.cwd(), "src/app/teacher/class/[classId]/page.tsx"),
    "utf8",
  );

  it("summarizes attempts into per-skill states", () => {
    expect(classPage).toMatch(/summarizeStudent/);
    expect(classPage).toMatch(/summarizeCohort/);
    // The two states the guide names are the two the page renders.
    expect(classPage).toMatch(/demonstrated/);
    expect(classPage).toMatch(/developing/);
  });

  it("never renders a choice history", () => {
    // FAILING-BEFORE would be meaningless here — this has always been true. The
    // point is that the guide's new wording depends on it staying true.
    for (const forbidden of [".path", "path_json", "choiceId", "sceneId"]) {
      expect(classPage, `the class page must not reach for ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("derives the judgment from recorded evidence, not from the choice path", () => {
    const evidence = readFileSync(join(process.cwd(), "src/lib/domain/evidence.ts"), "utf8");
    expect(evidence).toMatch(/a\.evidence/);
    // If summarizing ever started reading the path, "what is stored" and "what
    // you can see" would no longer be the separate facts the guide describes.
    expect(evidence).not.toMatch(/\.path\b/);
  });

  it("keeps the choice path to the two non-staff uses the guide names", () => {
    // `resume it if they stop` and `check the run reached a real ending`.
    const progress = readFileSync(join(process.cwd(), "src/lib/repo/progress.ts"), "utf8");
    expect(progress).toMatch(/attempt\.path/);
    expect(progress).toMatch(/hasReachedEnding/);

    const player = readFileSync(
      join(process.cwd(), "src/app/student/play/[slug]/page.tsx"),
      "utf8",
    );
    expect(player).toMatch(/resumeSceneId\(mission, attempt\.path\)/);
  });
});
