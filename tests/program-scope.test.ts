import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
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

/**
 * Every surface a buyer reads before deciding, **enumerated from disk**.
 *
 * This was a hand-written list of seven files, and it was already wrong by four:
 * it covered `approach`, `curriculum`, `plans` and `for-schools` while the
 * marketing home page, `demo`, `benchmark` and `privacy` were guarded by
 * nothing. That is the defect that let the curriculum hero keep offering a
 * grade 1 or grade 5 class through three consecutive corrections — each sweep
 * covered the surfaces its own finding named, and the list never grew.
 *
 * So the route group is walked instead. A page added tomorrow is checked the day
 * it exists, without anybody remembering to add it here. The three files outside
 * the route group are named because they cannot be enumerated from it, and they
 * are asserted to exist so a rename cannot silently drop one.
 */
function marketingPages(dir: string, base: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(process.cwd(), dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(process.cwd(), rel)).isDirectory()) {
      out.push(...marketingPages(rel, base));
    } else if (entry === "page.tsx" || entry === "layout.tsx") {
      out.push(rel);
    }
  }
  return out;
}

/** Buyer-facing copy that does not live under the marketing route group. */
const NON_ROUTE_SURFACES = [
  "README.md",
  "src/app/layout.tsx",
  "src/components/SiteHeader.tsx",
  "src/components/SiteFooter.tsx",
  "src/components/marketing/Page.tsx",
] as const;

const BUYER_SURFACES: readonly string[] = [
  ...NON_ROUTE_SURFACES,
  ...marketingPages("src/app/(site)", "src/app/(site)").sort(),
];

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
 * Not a ban on the phrase. "Grades 1 and 2" and "grades 3 to 5" are the names of
 * two authored **reading levels** for First Look, and they stay. What is
 * forbidden is the range attached to what is sold or assessed — which is what a
 * buyer prices — and, since sprint 85's final acceptance correction, any claim
 * that a Grade 1 or Grade 5 **class** exists: classes are created in grades 2 to
 * 4 only, so a track's reading level and a creatable class grade are two
 * different things and the copy has to keep them apart.
 */
const UNQUALIFIED_ANNUAL_RANGE =
  /(annual|subscription|program|platform|missions|assessed|check-ins?)[^.]{0,80}\bgrades? 1[\s–-]+(to\s+)?5\b|\bgrades? 1[\s–-]+(to\s+)?5\b[^.]{0,80}(annual|subscription|assessed|twenty-seven|27 )/i;

describe("the buyer surfaces are enumerated, not listed", () => {
  it("walks the marketing route group rather than trusting a list", () => {
    // The four this list used to miss, named so a regression is legible.
    for (const page of [
      "src/app/(site)/page.tsx",
      "src/app/(site)/demo/page.tsx",
      "src/app/(site)/benchmark/page.tsx",
      "src/app/(site)/privacy/page.tsx",
    ]) {
      expect(BUYER_SURFACES, `${page} is not being checked`).toContain(page);
    }
    // And the four it did cover.
    for (const page of ["approach", "curriculum", "plans", "for-schools"]) {
      expect(BUYER_SURFACES).toContain(`src/app/(site)/${page}/page.tsx`);
    }
  });

  it("finds every marketing page on disk", () => {
    const onDisk = marketingPages("src/app/(site)", "src/app/(site)");
    expect(onDisk.length).toBeGreaterThanOrEqual(8);
    for (const file of onDisk) expect(BUYER_SURFACES).toContain(file);
  });

  it("still covers the surfaces outside the route group", () => {
    // These cannot be walked from `(site)`, so they are named — and asserted to
    // exist, because a rename would otherwise drop one silently.
    for (const file of NON_ROUTE_SURFACES) {
      expect(BUYER_SURFACES).toContain(file);
      expect(() => read(file), `${file} is named but missing`).not.toThrow();
    }
  });
});

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

  /**
   * A class in a grade this build cannot create.
   *
   * Sprint 85's first pass ended the curriculum hero with "…which is also what a
   * grade 1 or grade 5 class is offered", written before the boundary was
   * settled and left behind when it was. A buyer reading the curriculum page
   * could still take it as permission to buy for those grades, and their
   * administrator would then fail at setup — the exact contradiction the sprint
   * existed to close, surviving on the one buyer page nobody re-read.
   *
   * Track names are untouched: "grades 1 and 2" and "grades 3 to 5" name two
   * authored reading levels and are true. What this forbids is a **class** in
   * grade 1 or grade 5 being offered, created or supported.
   */
  const UNCREATABLE_CLASS_CLAIM =
    /\bgrades? (1|5)( or (grade )?5)? (class|classes|room|cohort)|\b(a|any) grade (1|5) (class|classes)|(class|classes) (in|for) grades? (1|5)\b/i;

  it.each(BUYER_SURFACES.map((f) => [f] as const))(
    "%s never offers a class in a grade this build cannot create",
    (file) => {
      const prose = read(file).replace(/\s+/g, " ");
      const match = prose.match(UNCREATABLE_CLASS_CLAIM);
      expect(
        match?.[0],
        `${file} refers to a class in an uncreatable grade: "${match?.[0]}"`,
      ).toBeUndefined();
    },
  );

  it("the curriculum hero explains the tracks inside the creatable band", () => {
    // FAILING-BEFORE: the lede ended "…which is also what a grade 1 or grade 5
    // class is offered." It now maps each creatable grade to the track it runs.
    //
    // The wording has moved once since. "A Grade 2 class runs the early one
    // while Grades 3 and 4 run the upper one" asked a reader to carry "the
    // early one" back to a track named in the previous clause; it is a direct
    // mapping now. The claim is identical and it is still asserted here rather
    // than trusted to survive the next rewrite.
    //
    // Scoped to the lede, like the test below: reading the whole file let the
    // metadata description satisfy this while the hero said nothing.
    const lede = read("src/app/(site)/curriculum/page.tsx").match(/lede="([^"]*)"/)?.[1] ?? "";
    expect(lede, "no hero lede found to assert on").not.toBe("");
    expect(lede).not.toMatch(/which is also what a grade 1 or grade 5 class is offered/i);
    expect(lede).toMatch(/two reading levels/i);
    expect(lede).toMatch(/Grade 2 runs the grades 1 and 2 track/i);
    expect(lede).toMatch(/Grades 3 and 4 run the grades 3 to 5 track/i);
  });

  it("keeps the track names in the hero, because they are reading levels", () => {
    // The correction must not overshoot into deleting accurate content names.
    // Scoped to the lede: asserting on the whole file passed even with the
    // names removed from the hero, because the metadata description also
    // carries them — a test that could not see the change it was guarding.
    const curriculum = read("src/app/(site)/curriculum/page.tsx");
    const lede = curriculum.match(/lede="([^"]*)"/)?.[1] ?? "";
    expect(lede, "no hero lede found to assert on").toMatch(/First Look/);
    for (const label of FIRST_LOOK_TRACK_LABELS) {
      expect(lede.toLowerCase(), `the hero dropped the ${label} track name`).toContain(label);
    }
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
  /** JSX wraps prose across lines, so sentence assertions read it unwrapped. */
  const plansProse = plansSource.replace(/\s+/g, " ");
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
    expect(plansProse).toMatch(/What a subscription is for, and which grades/);
    expect(plansProse).toMatch(/First Look is included and is not part of that/);
    expect(plansProse).toMatch(/records no skill evidence/);
    // The enforcement, stated where a buyer reads the promise.
    expect(plansProse).toMatch(/cannot be assigned, listed for a child, opened or resumed/);
    expect(plansProse).toMatch(/Every mission card shows its grade band/);
    // The grade a buyer would be surprised by, said out loud — and stated as
    // what the build does, not as a capability it lacks. Sprint 85's acceptance
    // correction found that grade 1 and 5 classes cannot be created at all.

    expect(plansProse).toMatch(/Classes are created in \{CORE_GRADE_LABEL\}/);
    // No claim, in either direction, about grades the build does not create.
    expect(plansProse).not.toMatch(/grade 1 or grade 5 class/i);
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

  it("the class creation form offers only the assessed band", () => {
    // Was "still explains why grades 1 and 5 exist". They did not exist: the
    // schema refused them and the action threw. Sprint 85's final acceptance
    // correction removed the options and the hint that promised them.
    const form = read("src/app/admin/classes/CreateClassForm.tsx");
    expect(form).not.toMatch(/Grades 1 and 5 get the First Look sessions written for them/);
    expect(form).not.toMatch(/<option value="[15]">/);
    expect(form).toMatch(/Grade 2 runs the early First Look track/);
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
