import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MISSIONS, ALL_SESSIONS } from "@/content/missions";
import { FOUNDATIONS, FOUNDATIONS_BY_TRACK, FOUNDATION_TRACKS } from "@/content/foundations";
import {
  CORE_GRADE_BAND,
  CORE_GRADE_LABEL,
  CORE_MISSION_COUNT,
  FIRST_LOOK_SESSIONS_PER_CLASS,
  FIRST_LOOK_TOTAL_SESSIONS,
  FIRST_LOOK_TRACK_LABELS,
  PROGRAM_SCOPE_SENTENCE,
} from "@/content/scope";
import { PLANS } from "@/app/(site)/plans/page";

/**
 * One commercial scope, held to the content model that produces it.
 *
 * The repository sold two different products. Every core mission is
 * `gradeBand: "2-4"`, and the check-ins, nine-skill evidence, badges and school
 * report all key off those missions — while the README's opening, the root
 * metadata, the site footer, the Approach and Curriculum descriptions and the
 * Plans feature list all promised an annual grades 1 to 5 program. A grade 1 or
 * grade 5 buyer could read the subscription as a full year of assessed practice
 * for their students, and then find every library card saying grades 2 to 4 and
 * their own track recording no evidence at all.
 *
 * `content/scope.ts` derives the scope from the content rather than restating
 * it, so these tests are about the derivation and about the copy agreeing with
 * it. A phrase denylist alone would go stale the first time somebody rephrased;
 * the label the copy has to contain is computed from `MISSIONS`.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/** Every surface a buyer reads before deciding, plus the README. */
const BUYER_SURFACES = [
  "README.md",
  "src/app/layout.tsx",
  "src/components/SiteFooter.tsx",
  "src/app/(site)/approach/page.tsx",
  "src/app/(site)/curriculum/page.tsx",
  "src/app/(site)/plans/page.tsx",
  "src/app/(site)/for-schools/page.tsx",
] as const;

describe("the scope is derived from the content, not asserted beside it", () => {
  it("every core mission is in one grade band, and that band is the label", () => {
    expect(MISSIONS).toHaveLength(CORE_MISSION_COUNT);
    expect(CORE_MISSION_COUNT).toBe(27);
    for (const mission of MISSIONS) {
      expect(mission.gradeBand, `${mission.slug} is outside the core band`).toBe(
        CORE_GRADE_BAND,
      );
    }
    expect(CORE_GRADE_BAND).toBe("2-4");
    expect(CORE_GRADE_LABEL).toBe("grades 2 to 4");
  });

  it("keeps First Look as two tracks, and a class runs one of them", () => {
    expect(FOUNDATION_TRACKS).toHaveLength(2);
    expect(FIRST_LOOK_TOTAL_SESSIONS).toBe(FOUNDATIONS.length);
    expect(FIRST_LOOK_TOTAL_SESSIONS).toBe(6);
    // The distinction the copy turns on: six exist, a class receives three.
    expect(FIRST_LOOK_SESSIONS_PER_CLASS).toBe(3);
    expect(FIRST_LOOK_SESSIONS_PER_CLASS).toBeLessThan(FIRST_LOOK_TOTAL_SESSIONS);
    for (const track of FOUNDATION_TRACKS) {
      expect(FOUNDATIONS_BY_TRACK[track.id]).toHaveLength(FIRST_LOOK_SESSIONS_PER_CLASS);
    }
    expect(FIRST_LOOK_TRACK_LABELS).toEqual(["grades 1 and 2", "grades 3 to 5"]);
  });

  it("keeps First Look outside the assessed band", () => {
    // The reason grades 1 and 5 are not the assessed program: their sessions
    // are not in the core band, and they carry no skill evidence.
    for (const session of FOUNDATIONS) {
      expect(session.gradeBand).not.toBe(CORE_GRADE_BAND);
      expect(session.segment).toBe("foundation");
    }
    expect(ALL_SESSIONS).toHaveLength(CORE_MISSION_COUNT + FIRST_LOOK_TOTAL_SESSIONS);
  });

  it("says all of that in one sentence a surface can use", () => {
    expect(PROGRAM_SCOPE_SENTENCE).toContain(CORE_GRADE_LABEL);
    expect(PROGRAM_SCOPE_SENTENCE).toContain(String(CORE_MISSION_COUNT));
    expect(PROGRAM_SCOPE_SENTENCE).toContain(String(FIRST_LOOK_SESSIONS_PER_CLASS));
    expect(PROGRAM_SCOPE_SENTENCE).toContain("per class");
  });
});

/**
 * The claim that was actually being made, and must not come back: an annual
 * program *for* grades 1 to 5.
 *
 * Not a ban on the phrase — grade 1 and grade 5 are real, supported, and named
 * accurately in several places. What is forbidden is the range attached to what
 * is sold or assessed, which is what a buyer prices.
 */
const UNQUALIFIED_ANNUAL_RANGE =
  /(annual|subscription|program|platform|missions|assessed|check-ins?)[^.]{0,80}\bgrades? 1[\s–-]+(to\s+)?5\b|\bgrades? 1[\s–-]+(to\s+)?5\b[^.]{0,80}(annual|subscription|assessed|twenty-seven|27 )/i;

describe("no buyer-facing surface sells an annual grades 1 to 5 program", () => {
  it.each(BUYER_SURFACES.map((f) => [f] as const))("%s", (file) => {
    const source = read(file);
    const match = source.match(UNQUALIFIED_ANNUAL_RANGE);
    expect(
      match?.[0],
      `${file} attaches grades 1 to 5 to what is sold: "${match?.[0]}"`,
    ).toBeUndefined();
  });

  it("shows no grades 1 to 5 scope claim on a rendered buyer page", () => {
    // Found in the browser, not by the source sweep: the educator orientation's
    // first module was titled "What grades 1 to 5 actually need", and that title
    // renders in the module list on `/approach` beside the plan copy.
    const cert = read("src/content/certification/index.ts");
    expect(cert).not.toMatch(/title: "[^"]*grades 1 to 5[^"]*"/);
  });

  it("names the assessed band where the product is described", () => {
    // Each of these described the program without ever saying which grades the
    // assessed part is for. The label is the derived one, so renaming the band
    // in the content model breaks this rather than leaving copy behind.
    // Either typography: prose uses "grades 2–4", components use the derived
    // "grades 2 to 4" constant. Both are the same claim.
    const spellings = [CORE_GRADE_LABEL, CORE_GRADE_LABEL.replace(" to ", "–"), "CORE_GRADE_LABEL"];
    for (const file of ["README.md", "src/app/layout.tsx", "src/components/SiteFooter.tsx"]) {
      const source = read(file);
      expect(
        spellings.some((s) => source.includes(s)),
        `${file} never names the assessed band`,
      ).toBe(true);
    }
  });
});

describe("the plans page says what is purchased", () => {
  const plansSource = read("src/app/(site)/plans/page.tsx");
  const features = PLANS.flatMap((p) => p.features);

  it("qualifies the core missions and the check-ins by grade", () => {
    const core = features.find((f) => /27 core missions/i.test(f));
    expect(core, "no plan feature names the core missions").toBeDefined();
    expect(core).toContain(CORE_GRADE_LABEL);
    expect(core).toMatch(/check-in/i);
    // FAILING-BEFORE: this read "All 27 missions and both check-in forms".
    expect(features).not.toContain("All 27 missions and both check-in forms");
  });

  it("includes First Look without implying a class plays all six", () => {
    const firstLook = features.find((f) => /First Look/i.test(f));
    expect(firstLook, "no plan feature names First Look").toBeDefined();
    expect(firstLook).toMatch(new RegExp(`${FIRST_LOOK_TOTAL_SESSIONS}\\b`));
    // The distinction: six exist, a class runs three.
    expect(firstLook).toMatch(/a class runs the three written for its grade/i);
    expect(firstLook).toContain(FIRST_LOOK_TRACK_LABELS[0]);
    expect(firstLook).toContain(FIRST_LOOK_TRACK_LABELS[1]);
  });

  it("states the scope in prose as well as in a bullet", () => {
    expect(plansSource).toMatch(/What a subscription is for, and which grades/);
    expect(plansSource).toMatch(/First Look is included and is not part of that/);
    expect(plansSource).toMatch(/records no skill evidence/);
    // The grade a buyer would be surprised by, said out loud.
    expect(plansSource).toMatch(/grade 1 or grade 5 class/);
  });

  it("builds those claims from the derived values, not from typed numbers", () => {
    // If the content model changes, the page changes with it.
    expect(plansSource).toContain("CORE_GRADE_LABEL");
    expect(plansSource).toContain("FIRST_LOOK_SESSIONS_PER_CLASS");
    expect(plansSource).toContain("FIRST_LOOK_TOTAL_SESSIONS");
  });
});

describe("the surfaces that were already accurate are left alone", () => {
  it("For your school still says the assessed band", () => {
    expect(read("src/app/(site)/for-schools/page.tsx")).toContain("Grades 2 to 4");
  });

  it("the class creation form still explains why grades 1 and 5 exist", () => {
    const form = read("src/app/admin/classes/CreateClassForm.tsx");
    expect(form).toMatch(/Grades 1 and 5 get the First Look sessions written for them/);
  });

  it("the session guide still separates the two", () => {
    const guide = read("src/content/session-guide.ts");
    expect(guide).toMatch(/All 27 core missions, grades 2–4/);
    expect(guide).toMatch(/grades 1–2 tier and a grades 3–5 tier/);
  });

  it("the curriculum page still carries the evidence footnote", () => {
    const curriculum = read("src/app/(site)/curriculum/page.tsx");
    expect(curriculum).toMatch(/First Look records no skill evidence/);
    expect(curriculum).toMatch(/reading-levelled for\s+grades 2 to 4/);
  });
});
