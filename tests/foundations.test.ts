import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS, playToEnd } from "./helpers";
import {
  ALL_SESSIONS,
  FOUNDATIONS,
  FOUNDATIONS_BY_TRACK,
  MISSIONS,
  MISSION_BY_SLUG,
  foundationsForGrade,
  trackForGrade,
} from "@/content/missions";
import { ALL_SKILLS, COMPETENCY_IDS } from "@/content/competencies";
import { validateMission } from "@/lib/domain/missionPath";
import { missionsOfferingSkill, summarizeStudent } from "@/lib/domain/evidence";
import { createStudent } from "@/lib/repo/classroom";
import { listAttemptsForStudent } from "@/lib/repo/progress";
import type { Mission } from "@/content/types";

/**
 * First Look — the introductory segment.
 *
 * Two claims are being defended here and they pull in opposite directions.
 *
 * The first is that these sessions are held to exactly the same structural
 * safety standard as the twenty-seven core missions: no dead ends, no
 * unauthored content, every choice explained, every unsafe branch looping back.
 * Nothing about being an introduction relaxes that.
 *
 * The second is that they report nothing. A six year old answering a
 * comprehension question on the board has not demonstrated a safety skill in
 * the sense the nine skills mean, and if a First Look answer could reach the
 * roster then "demonstrated" would mean two different things in the same
 * column. So the evidence rule inverts for this segment: instead of requiring
 * a strong choice to record, it forbids any choice from recording — checked in
 * the content, in the validator, and through the real repository at the end of
 * this file.
 */

/**
 * Sentence splitting that survives the cast list. A naive split on terminal
 * punctuation cuts "Ms. Okafor holds up a card" in half at the title, which
 * makes every reading-level cap quietly more lenient than it reads and makes a
 * sentences-per-paragraph count wrong outright.
 */
const TITLE = /(?:^|\s)(?:Mr|Mrs|Ms|Dr|St)\.$/;

function sentences(text: string): string[] {
  const out: string[] = [];
  for (const part of text.split(/(?<=[.?!])\s+/)) {
    if (out.length > 0 && TITLE.test(out[out.length - 1])) out[out.length - 1] += ` ${part}`;
    else out.push(part);
  }
  return out.filter(Boolean);
}

const studentCopy = (mission: Mission) =>
  mission.scenes
    .flatMap((scene) => [
      ...scene.narration,
      scene.prompt ?? "",
      ...(scene.wrapUp ?? []),
      ...(scene.choices ?? []).flatMap((choice) => [
        choice.label,
        choice.feedback.headline,
        choice.feedback.body,
      ]),
    ])
    .filter(Boolean);

describe("First Look is built to the same structural standard as the core missions", () => {
  it("ships six sessions in two grade tiers", () => {
    expect(FOUNDATIONS).toHaveLength(6);
    expect(FOUNDATIONS_BY_TRACK.early).toHaveLength(3);
    expect(FOUNDATIONS_BY_TRACK.upper).toHaveLength(3);
    expect(FOUNDATIONS.every((m) => m.segment === "foundation")).toBe(true);
  });

  it.each(FOUNDATIONS.map((m) => [m.slug, m] as const))(
    "%s is structurally valid",
    (_slug, mission) => {
      expect(validateMission(mission)).toEqual([]);
    },
  );

  it("gives every choice feedback and every unsafe choice another go", () => {
    for (const mission of FOUNDATIONS) {
      for (const scene of mission.scenes) {
        for (const choice of scene.choices ?? []) {
          expect(choice.feedback.headline.length).toBeGreaterThan(0);
          expect(choice.feedback.body.length).toBeGreaterThan(0);
          if (choice.feedback.tone === "rethink") expect(choice.retry).toBe(true);
        }
      }
    }
  });

  it("gives every session a discussion guide and a family take-home", () => {
    for (const mission of FOUNDATIONS) {
      expect(mission.guide.questions.length).toBeGreaterThanOrEqual(3);
      expect(mission.guide.misconceptions.length).toBeGreaterThanOrEqual(3);
      expect(mission.guide.lookFor.length).toBeGreaterThanOrEqual(3);
      expect(mission.family.questions).toHaveLength(3);
      expect(mission.family.familyRule.length).toBeGreaterThan(0);
      expect(mission.bigIdea?.length).toBeGreaterThan(0);
    }
  });
});

describe("First Look records nothing", () => {
  it("has no choice anywhere that carries evidence", () => {
    for (const mission of FOUNDATIONS) {
      for (const scene of mission.scenes) {
        for (const choice of scene.choices ?? []) {
          expect(choice.evidence, `${mission.slug}/${scene.id}/${choice.id}`).toBeUndefined();
        }
      }
    }
  });

  it("is caught by the validator if a choice ever starts recording", () => {
    // The rule has to live in validateMission rather than only in this file,
    // or a session added next year is checked by nothing.
    const [session] = FOUNDATIONS;
    const scene = session.scenes.find((s) => s.choices?.length)!;
    const tampered: Mission = {
      ...session,
      scenes: session.scenes.map((s) =>
        s.id === scene.id
          ? {
              ...s,
              choices: s.choices!.map((c, i) =>
                i === 0
                  ? { ...c, evidence: { skillId: "privacy.identity", result: "demonstrated" as const } }
                  : c,
              ),
            }
          : s,
      ),
    };
    expect(validateMission(tampered).map((issue) => issue.problem)).toContainEqual(
      expect.stringContaining("records evidence"),
    );
  });

  it("stays out of the assessed spine", () => {
    for (const mission of FOUNDATIONS) {
      expect(MISSIONS).not.toContain(mission);
    }
    expect(MISSIONS.every((m) => m.segment === "core")).toBe(true);
    // But it is playable, so the slug map and the catalog both carry it.
    expect(ALL_SESSIONS).toHaveLength(FOUNDATIONS.length + MISSIONS.length);
    for (const mission of FOUNDATIONS) {
      expect(MISSION_BY_SLUG[mission.slug]).toBe(mission);
    }
  });

  it("does not appear in the missions that offer each of the nine skills", () => {
    // `offeredBy` is the denominator a teacher reads as "chances to show this".
    // A First Look session counted here would inflate it and make a class look
    // as though it had missed opportunities it was never given.
    const foundationIds = new Set(FOUNDATIONS.map((m) => m.id));
    for (const skill of ALL_SKILLS) {
      const offering = missionsOfferingSkill(skill.id);
      expect(offering.length, skill.id).toBeGreaterThan(0);
      for (const id of offering) expect(foundationIds.has(id), `${skill.id}: ${id}`).toBe(false);
    }
  });
});

describe("First Look is written for the grade it claims", () => {
  const CAP = { "1-2": 14, "3-5": 24 } as const;

  it("bands each session to its track", () => {
    for (const mission of FOUNDATIONS) {
      expect(mission.gradeBand).toBe(mission.track === "early" ? "1-2" : "3-5");
    }
  });

  it("keeps sentences inside the cap for the band", () => {
    for (const mission of FOUNDATIONS) {
      const cap = CAP[mission.gradeBand as keyof typeof CAP];
      for (const text of studentCopy(mission)) {
        for (const sentence of sentences(text)) {
          expect(
            sentence.split(/\s+/).length,
            `${mission.slug}: "${sentence}"`,
          ).toBeLessThanOrEqual(cap);
        }
      }
    }
  });

  it("keeps an early-track narration paragraph to two sentences a teacher can read out", () => {
    for (const mission of FOUNDATIONS_BY_TRACK.early) {
      for (const scene of mission.scenes) {
        for (const paragraph of scene.narration) {
          expect(
            sentences(paragraph).length,
            `${mission.slug}/${scene.id}: "${paragraph}"`,
          ).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("numbers each track 1 to 3, because a class is only offered one of them", () => {
    // A grade 5 class sees three sessions. Numbering them 4, 5 and 6 across the
    // whole segment would send a teacher looking for the first three.
    for (const track of ["early", "upper"] as const) {
      expect(FOUNDATIONS_BY_TRACK[track].map((m) => m.order)).toEqual([1, 2, 3]);
    }
  });

  it("routes a class to the track written for it", () => {
    expect(trackForGrade(1)).toBe("early");
    expect(trackForGrade(2)).toBe("early");
    expect(trackForGrade(3)).toBe("upper");
    expect(trackForGrade(5)).toBe("upper");
    expect(foundationsForGrade(1)).toEqual(FOUNDATIONS_BY_TRACK.early);
    expect(foundationsForGrade(4)).toEqual(FOUNDATIONS_BY_TRACK.upper);
  });

  it("teaches the same three ideas in both tracks", () => {
    // The competency a session leads into is how the two tracks are held to
    // the same coverage: what AI is, where it already is, and who decides.
    for (const track of ["early", "upper"] as const) {
      expect(new Set(FOUNDATIONS_BY_TRACK[track].map((m) => m.competency)).size).toBe(
        COMPETENCY_IDS.length,
      );
    }
  });
});

describe("First Look does not teach a hazard while teaching the lesson", () => {
  it("constrains every unplugged activity rather than leaving sourcing to the teacher", () => {
    // The core curriculum learned this the hard way in sprint 37: an activity
    // about what a picture gives away asked teachers to project photographs of
    // their own classrooms. Every First Look extension has to carry its own
    // limit in the text.
    for (const mission of FOUNDATIONS) {
      expect(mission.guide.extension.toLowerCase(), mission.slug).toMatch(
        /\b(do not|use only)\b/,
      );
    }
  });

  it("never asks a child for a fact about their own home, family or devices", () => {
    for (const mission of FOUNDATIONS) {
      const copy = [...studentCopy(mission), mission.guide.extension].join(" ").toLowerCase();
      expect(copy, mission.slug).not.toMatch(
        /type your (full name|address|birthday)|what is your (address|surname|last name)/,
      );
    }
  });

  it("does not teach blanket distrust, which is the other way to fail", () => {
    for (const mission of FOUNDATIONS) {
      const copy = studentCopy(mission).join(" ").toLowerCase();
      for (const overclaim of [
        "never trust",
        "you cannot trust",
        "it is always wrong",
        "it is never right",
        "do not use any",
      ]) {
        expect(copy, `${mission.slug}: ${overclaim}`).not.toContain(overclaim);
      }
    }
  });

  it("avoids the brittle absolutes the core curriculum already bans", () => {
    const copy = FOUNDATIONS.flatMap(studentCopy).join(" ").toLowerCase();
    for (const overclaim of [
      "ai tools always sound sure",
      "tells you nothing at all",
      "nobody can fake",
      "single most reliable",
      "real work leaves a trail",
    ]) {
      expect(copy).not.toContain(overclaim);
    }
    expect(copy).not.toMatch(/\bmismatch\b|\bflipped\b|\bcropped\b/);
  });

  it("never gives the tool wants, knowledge or a decision in a wrap-up", () => {
    // The wrap-up lines are the durable takeaway, the part a teacher writes on
    // the board and a family page repeats. A child who leaves believing the
    // program wants things has learned the wrong thing about all three ideas.
    for (const mission of FOUNDATIONS) {
      const wrapUp = mission.scenes.flatMap((s) => s.wrapUp ?? []);
      expect(wrapUp.length, mission.slug).toBeGreaterThanOrEqual(3);
      expect(wrapUp.join(" ").toLowerCase(), mission.slug).not.toMatch(
        /\bit (wants|knows|decides|thinks|feels|understands|believes)\b/,
      );
    }
  });
});

describe("a finished First Look session reaches the roster as a badge and nothing else", () => {
  let db: Db;
  let cleanup: () => void;

  beforeAll(() => {
    ({ db, cleanup } = createTestDb());
  });
  afterAll(() => cleanup());

  it.each(FOUNDATIONS.map((m) => [m.slug, m] as const))(
    "%s records a completion and no evidence",
    (_slug, mission) => {
      const student = createStudent(db, {
        classId: DEMO_CLASS,
        displayName: `First Look ${mission.order}.`,
      });

      playToEnd(db, student.id, mission);
      const summary = summarizeStudent(listAttemptsForStudent(db, student.id));

      expect(summary.completedMissionIds).toContain(mission.id);
      expect(summary.badgeIds).toContain(mission.badge.id);
      expect(Object.keys(summary.evidence)).toHaveLength(0);
      expect(summary.skillsDemonstrated).toBe(0);
    },
  );
});
