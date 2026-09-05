import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { MISSIONS, ALL_SESSIONS } from "@/content/missions";
import { FOUNDATIONS, FOUNDATION_TRACKS, FOUNDATIONS_BY_TRACK } from "@/content/foundations";
import { HERO_PANELS } from "@/content/hero";
import { CORE_GRADE_LABEL, FIRST_LOOK_SESSIONS_PER_CLASS } from "@/content/scope";

/**
 * The editorial baseline: decisions that were made deliberately and must not be
 * undone by the next person tidying up — including me.
 *
 * Every assertion here corresponds to copy that was **removed on purpose** or a
 * claim that was **narrowed on purpose**. A rewrite that reinstates any of it is
 * not a matter of taste; it is a regression against a decision somebody already
 * made, and the diff that does it will otherwise look like an improvement.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const prose = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1")
    .replace(/\s+/g, " ");

const HOME = "src/app/(site)/page.tsx";
const CURRICULUM = "src/app/(site)/curriculum/page.tsx";

describe("the homepage says only what is true about sharing", () => {
  const home = prose(HOME);

  it("promises no third-party sharing, and names what that means", () => {
    // FAILING-BEFORE: "No information sharing, ever", which a school could read
    // as "nobody else can see this" — untrue, since anyone holding a class code
    // can open a listed student's progress.
    expect(home).toContain("No third-party sharing");
    expect(home).toMatch(/analytics/i);
    expect(home).toMatch(/advertis/i);
    expect(home).toMatch(/generative model|outside provider/i);
    expect(home).toMatch(/never sold|not sold/i);
  });

  it("does not claim information is never shared or never seen", () => {
    expect(home).not.toContain("No information sharing");
    for (const overclaim of [
      /nothing (a child does )?leaves this product/i,
      /never shared with anyone/i,
      /no one else can see/i,
      /nobody else can see/i,
    ]) {
      expect(home, `the homepage overclaims: ${overclaim}`).not.toMatch(overclaim);
    }
  });

  it("keeps three promises and does not restore the class-code card", () => {
    // The card was removed deliberately; the disclosure lives on the privacy
    // and admin pages, which `data-inventory.test.ts` holds to the full text.
    expect(home).not.toMatch(/A class code, not a child's password/);
    expect(home).not.toMatch(/Evidence, not surveillance/);
    // Counted by heading, not by any string starting "No" — one of the
    // bodies begins "No camera, no microphone…" and made this read four.
    const headings = home.match(/"No [^"]*, ever"|"No third-party sharing[^"]*"/g) ?? [];
    expect(headings).toHaveLength(3);
  });
});

describe("the homepage hero still rotates real missions", () => {
  it("renders the rotating panel rather than a hard-coded decision", () => {
    const home = prose(HOME);
    expect(home).toContain("HeroScenes");
    expect(home).toContain("HERO_PANELS");
    expect(home).not.toContain("SceneArt");
  });

  it("keeps three panels, one per competency, each a different scene", () => {
    expect(HERO_PANELS).toHaveLength(3);
    expect(new Set(HERO_PANELS.map((p) => p.competency)).size).toBe(3);
    expect(new Set(HERO_PANELS.map((p) => p.art)).size).toBe(3);
  });

  it("keeps the pause control and the reduced-motion exit", () => {
    const component = read("src/components/marketing/HeroScenes.tsx");
    expect(component).toContain("prefers-reduced-motion");
    expect(component).toMatch(/Pause/);
  });
});

describe("the trimmed pages stay trimmed", () => {
  it("the curriculum catalogue is a number and a title", () => {
    // FAILING-BEFORE: each card also carried a teaser, a badge and a duration.
    const curriculum = prose(CURRICULUM);
    expect(curriculum).not.toContain("m.teaser");
    expect(curriculum).not.toContain("m.badge.name");
    expect(curriculum).not.toContain("m.bigIdea");
    expect(curriculum).not.toContain("estimatedMinutes");
  });

  it("the footer carries no marketing paragraph under the logo", () => {
    const footer = prose("src/components/SiteFooter.tsx");
    expect(footer).not.toContain("Practice before exposure. An annual subscription");
    // The assessed band survived the cut, in the fine print — rendered from
    // the derived constant, so match either spelling.
    expect(footer.includes(CORE_GRADE_LABEL) || footer.includes("CORE_GRADE_LABEL")).toBe(true);
  });

  it("the demo highlights stay short", () => {
    const demo = prose("src/app/(site)/demo/page.tsx");
    expect(demo).not.toMatch(/Arrow keys drive it/);
    expect(demo).not.toMatch(/CSV and JSON export/);
    expect(demo).toContain("Worth a look");
  });

  it("How it works keeps its compact hero", () => {
    const approach = prose("src/app/(site)/approach/page.tsx");
    expect(approach).toContain("The first time it asks should not be the first time they think.");
    expect(approach).not.toMatch(/Every branch, every piece of feedback and every character line/);
  });
});

describe("hero descriptions stay short enough to read at a glance", () => {
  /** Every `lede=` and `description=` a marketing hero renders. */
  function heroLedes(dir: string): { file: string; text: string }[] {
    const out: { file: string; text: string }[] = [];
    for (const entry of readdirSync(join(process.cwd(), dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(process.cwd(), rel)).isDirectory()) out.push(...heroLedes(rel));
      else if (entry === "page.tsx") {
        const lede = read(rel).match(/lede="([^"]*)"/)?.[1];
        if (lede) out.push({ file: rel, text: lede });
      }
    }
    return out;
  }

  const LEDES = heroLedes("src/app/(site)");

  it("finds a hero lede on the pages that have one", () => {
    expect(LEDES.length).toBeGreaterThanOrEqual(4);
  });

  it.each(LEDES.map((l) => [l.file, l.text] as const))("%s", (_file, text) => {
    // The editorial standard is under 45 words for a newly edited hero. 55 is
    // the line this holds, so an existing longer one is not a failing build
    // while a new essay is.
    const words = text.split(/\s+/).filter(Boolean).length;
    expect(words).toBeLessThanOrEqual(55);
  });
});

describe("site-wide terminology means one thing", () => {
  it("the assessed product is 27 core missions for grades 2 to 4", () => {
    expect(MISSIONS).toHaveLength(27);
    expect(CORE_GRADE_LABEL).toBe("grades 2 to 4");
    for (const mission of MISSIONS) expect(mission.gradeBand).toBe("2-4");
  });

  it("First Look is six sessions in two tracks, three to a class", () => {
    expect(FOUNDATIONS).toHaveLength(6);
    expect(FOUNDATION_TRACKS).toHaveLength(2);
    expect(FIRST_LOOK_SESSIONS_PER_CLASS).toBe(3);
    for (const track of FOUNDATION_TRACKS) {
      expect(FOUNDATIONS_BY_TRACK[track.id]).toHaveLength(3);
    }
  });

  it("First Look records completion but no skill evidence", () => {
    for (const session of FOUNDATIONS) {
      const evidence = session.scenes.flatMap((s) => s.choices ?? []).filter((c) => c.evidence);
      expect(evidence, `${session.slug} records skill evidence`).toEqual([]);
    }
  });

  it("everything a child can open is First Look plus the core missions", () => {
    expect(ALL_SESSIONS).toHaveLength(FOUNDATIONS.length + MISSIONS.length);
  });
});
