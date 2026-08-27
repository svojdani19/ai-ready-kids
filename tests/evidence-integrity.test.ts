import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS, playTo, playToEnd } from "./helpers";
import { MISSIONS } from "@/content/missions";
import { COMPETENCY_IDS } from "@/content/competencies";
import { findScene, nextSceneAfter } from "@/lib/domain/missionPath";
import { createStudent } from "@/lib/repo/classroom";
import {
  completeAttempt,
  completeBenchmark,
  getAttempt,
  getBenchmark,
  recordDecision,
  saveBenchmarkResponse,
  startAttempt,
} from "@/lib/repo/progress";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import type { Choice, Mission } from "@/content/types";
import type { EvidenceMap } from "@/lib/types";

/**
 * Evidence integrity.
 *
 * The claim these tests defend is the one the teacher dashboard and the school
 * report both make: that a demonstrated skill means the child chose it, not
 * that they were walked to it. Every mission is checked, through the real
 * repository function, so the rule cannot drift for one mission at a time.
 */

let db: Db;
let cleanup: () => void;

beforeAll(() => {
  ({ db, cleanup } = createTestDb());
});
afterAll(() => cleanup());

let seq = 0;
function freshStudent(): string {
  seq += 1;
  return createStudent(db, { classId: DEMO_CLASS, displayName: `Walker ${seq}.` }).id;
}

type Pick = (scene: NonNullable<Mission["scenes"][number]>) => Choice;

/** Walk a mission through recordDecision, choosing with the given strategy. */
function walk(mission: Mission, choose: Pick): { studentId: string; evidence: EvidenceMap } {
  const studentId = freshStudent();
  let sceneId: string | undefined = mission.openingSceneId;
  let guard = 0;

  while (sceneId && guard++ < 80) {
    const scene = findScene(mission, sceneId);
    if (!scene || scene.kind === "ending") break;
    if (!scene.choices?.length) {
      sceneId = scene.next;
      continue;
    }
    const choice = choose(scene);
    recordDecision(db, {
      studentId,
      missionId: mission.id,
      sceneId: scene.id,
      choiceId: choice.id,
      evidence: choice.evidence,
    });
    sceneId = nextSceneAfter(scene, choice);
  }

  return { studentId, evidence: getAttempt(db, studentId, mission.id)?.evidence ?? {} };
}

/** Always take a wrong turn first where one exists, then the safe answer. */
function retryFirst(): Pick {
  const coached = new Set<string>();
  return (scene) => {
    const rethink = scene.choices!.find((c) => c.retry);
    if (rethink && !coached.has(scene.id)) {
      coached.add(scene.id);
      return rethink;
    }
    return (
      scene.choices!.find((c) => c.feedback.tone === "strong") ??
      scene.choices!.find((c) => !c.retry)!
    );
  };
}

/** Choose the safe answer immediately, every time. */
const firstTry: Pick = (scene) =>
  scene.choices!.find((c) => c.feedback.tone === "strong") ??
  scene.choices!.find((c) => !c.retry)!;

describe.each(MISSIONS.map((m) => [m.slug, m] as const))(
  "%s",
  (_slug, mission) => {
    it("only reports demonstrated where the child chose it unaided", () => {
      const { studentId } = walk(mission, retryFirst());
      const attempt = getAttempt(db, studentId, mission.id)!;

      // Rebuild, from the stored path alone, which skills could honestly have
      // been demonstrated: a strong choice on a scene not already answered.
      const seen = new Set<string>();
      const earnedUnaided = new Set<string>();
      for (const step of attempt.path) {
        const scene = findScene(mission, step.sceneId)!;
        const choice = scene.choices!.find((c) => c.id === step.choiceId)!;
        if (!seen.has(step.sceneId) && choice.evidence?.result === "demonstrated") {
          earnedUnaided.add(choice.evidence.skillId);
        }
        seen.add(step.sceneId);
      }

      for (const [skillId, result] of Object.entries(attempt.evidence)) {
        if (result === "demonstrated") {
          expect(
            earnedUnaided.has(skillId),
            `${mission.slug} reported ${skillId} as demonstrated after coaching`,
          ).toBe(true);
        }
      }
    });

    it("still reports demonstrated when the child gets it first try", () => {
      const { evidence } = walk(mission, firstTry);
      expect(evidence[mission.primarySkillId]).toBe("demonstrated");
    });
  },
);

describe("the rule holds across the whole curriculum", () => {
  it("downgrades a coached answer to developing rather than dropping it", () => {
    const mission = MISSIONS.find((m) =>
      m.scenes.some((s) => s.choices?.some((c) => c.retry)),
    )!;
    const { evidence } = walk(mission, retryFirst());
    // Coaching costs the child demonstrated, never the whole record.
    expect(Object.keys(evidence).length).toBeGreaterThan(0);
    expect(Object.values(evidence)).toContain("developing");
  });

  it("keeps demonstrated sticky once earned unaided elsewhere", () => {
    // Two scenes in one mission that record the same skill: earn it cleanly at
    // the first, need coaching at the second, and the record must not fall.
    let found: { mission: (typeof MISSIONS)[number]; skillId: string; second: string } | undefined;
    for (const mission of MISSIONS) {
      const bySkill = new Map<string, string[]>();
      for (const scene of mission.scenes) {
        for (const choice of scene.choices ?? []) {
          if (!choice.evidence) continue;
          const list = bySkill.get(choice.evidence.skillId) ?? [];
          if (!list.includes(scene.id)) list.push(scene.id);
          bySkill.set(choice.evidence.skillId, list);
        }
      }
      for (const [skillId, sceneIds] of bySkill) {
        const second = sceneIds[1];
        const scene = mission.scenes.find((s) => s.id === second);
        if (second && scene?.choices?.some((c) => c.retry)) {
          found = { mission, skillId, second };
          break;
        }
      }
      if (found) break;
    }
    expect(found, "no mission records one skill at two scenes").toBeDefined();
    const { mission, skillId, second } = found!;
    const studentId = freshStudent();

    playTo(db, studentId, mission, second);
    expect(getAttempt(db, studentId, mission.id)!.evidence[skillId]).toBe("demonstrated");

    // Now be coached at the second scene: retry, then the safe answer.
    const scene = mission.scenes.find((s) => s.id === second)!;
    const retry = scene.choices!.find((c) => c.retry)!;
    const exit = scene.choices!.find((c) => !c.retry && c.evidence?.skillId === skillId)!;
    for (const choice of [retry, exit]) {
      recordDecision(db, {
        studentId,
        missionId: mission.id,
        sceneId: second,
        choiceId: choice.id,
        evidence: choice.evidence,
      });
    }
    expect(getAttempt(db, studentId, mission.id)!.evidence[skillId]).toBe("demonstrated");
  });
});

describe("assignment order is interleaved, not blocked", () => {
  it("covers every competency within the first three missions", () => {
    const first = MISSIONS.slice(0, 3);
    expect(new Set(first.map((m) => m.competency)).size).toBe(COMPETENCY_IDS.length);
  });

  it("covers all nine skills within the first nine missions", () => {
    const first = MISSIONS.slice(0, 9);
    expect(new Set(first.map((m) => m.primarySkillId)).size).toBe(9);
  });

  it("spaces the three encounters with a skill nine missions apart", () => {
    for (const skillId of new Set(MISSIONS.map((m) => m.primarySkillId))) {
      const orders = MISSIONS.filter((m) => m.primarySkillId === skillId)
        .map((m) => m.order)
        .sort((a, b) => a - b);
      expect(orders).toHaveLength(3);
      expect(orders[1] - orders[0]).toBe(9);
      expect(orders[2] - orders[1]).toBe(9);
    }
  });

  it("keeps every prefix a teacher might assign balanced across competencies", () => {
    for (const n of [3, 6, 9, 12, 15, 18, 21, 24, 27]) {
      const slice = MISSIONS.slice(0, n);
      expect(new Set(slice.map((m) => m.competency)).size, `first ${n}`).toBe(3);
    }
  });
});

describe("the legacy forced-award scenes", () => {
  /**
   * Eight scenes in the original nine missions had exactly one way out and
   * still recorded evidence. Every child who finished them took that choice,
   * so the record said only that they had completed the scene. Two things had
   * to be true to fix it: the scene needs a second plausible exit, and a child
   * who reaches the right answer only after a correction must still come out
   * at developing. The first is enforced by validateMission; this checks the
   * second on the scenes that used to be forced.
   */
  const FORMERLY_FORCED: Array<[string, string, string]> = [
    ["sprocket-wants-to-know", "s6", "privacy.identity"],
    ["the-very-sure-answer", "s3", "verify.confidence"],
    ["the-very-sure-answer", "s7", "verify.confidence"],
    ["the-homework-that-did-itself", "s6", "own.effort"],
    ["four-doors", "s2", "own.toolchoice"],
    ["four-doors", "s6", "own.toolchoice"],
    ["the-question-at-bedtime", "s4", "privacy.escalate"],
    ["the-spelling-test-surprise", "s3", "own.honesty"],
  ];

  it.each(FORMERLY_FORCED)("%s/%s offers a real choice", (slug, sceneId) => {
    const mission = MISSIONS.find((m) => m.slug === slug)!;
    const scene = mission.scenes.find((s) => s.id === sceneId)!;
    const exits = scene.choices!.filter((c) => !c.retry);
    expect(exits.length).toBeGreaterThanOrEqual(2);
    // And there is still something to get wrong, or it is not a decision.
    expect(scene.choices!.some((c) => c.retry)).toBe(true);
  });

  /**
   * Scoped to the scene rather than the mission. A skill demonstrated
   * independently somewhere else in the same mission stays demonstrated, by
   * design — that is the stickiness rule from sprint 10 — so a mission-wide
   * assertion here would be testing the wrong thing.
   */
  it.each(FORMERLY_FORCED)("%s/%s records developing after a correction", (slug, sceneId, skillId) => {
    const mission = MISSIONS.find((m) => m.slug === slug)!;
    const scene = mission.scenes.find((s) => s.id === sceneId)!;
    const retry = scene.choices!.find((c) => c.retry)!;
    const exit = scene.choices!.find((c) => !c.retry && c.evidence?.skillId === skillId)!;
    const studentId = freshStudent();

    // Walk there first. The server will not accept a decision against a scene
    // the stored path does not lead to, which is the whole of sprint 28.
    playTo(db, studentId, mission, sceneId);
    const before = getAttempt(db, studentId, mission.id)?.evidence[skillId];

    for (const choice of [retry, exit]) {
      recordDecision(db, {
        studentId,
        missionId: mission.id,
        sceneId,
        choiceId: choice.id,
        evidence: choice.evidence,
      });
    }
    const after = getAttempt(db, studentId, mission.id)?.evidence[skillId];

    // Walking here may already have demonstrated the skill at an earlier
    // scene, and that stays — stickiness is deliberate. What must never happen
    // is a coached answer at this scene *raising* the record.
    expect(after).toBe(before === "demonstrated" ? "demonstrated" : "developing");
  });

  it.each(FORMERLY_FORCED)("%s/%s records demonstrated when chosen first", (slug, sceneId, skillId) => {
    const mission = MISSIONS.find((m) => m.slug === slug)!;
    const scene = mission.scenes.find((s) => s.id === sceneId)!;
    const exit = scene.choices!.find((c) => !c.retry && c.evidence?.skillId === skillId)!;
    const studentId = freshStudent();

    playTo(db, studentId, mission, sceneId);
    recordDecision(db, {
      studentId,
      missionId: mission.id,
      sceneId,
      choiceId: exit.id,
      evidence: exit.evidence,
    });
    expect(getAttempt(db, studentId, mission.id)?.evidence[skillId]).toBe("demonstrated");
  });
});

describe("the server owns progression, not the player component", () => {
  /**
   * The authored graph is this product's central claim, and until sprint 28 it
   * was enforced by the React component that drew the buttons. `submitDecision`
   * checked that a scene and a choice existed *somewhere* in the mission, and
   * `recordDecision` appended whatever it was handed. `completeAttempt` took
   * the caller's word that a mission was finished.
   *
   * So a direct caller could post the strongest option from every decision
   * scene in any order, skip every story beat and every authored correction,
   * come out with a full set of `demonstrated` evidence, mark the mission
   * complete and collect the badge. Teacher evidence and the annual report
   * would then describe a mission nobody played.
   */
  const mission = MISSIONS.find((m) => m.scenes.filter((s) => s.choices?.length).length >= 3)!;
  const decisions = mission.scenes.filter((s) => s.choices?.length);

  it("refuses a decision at a scene the path has not reached", () => {
    const studentId = freshStudent();
    startAttempt(db, studentId, mission.id);
    const later = decisions[2];
    const choice = later.choices!.find((c) => !c.retry)!;

    expect(() =>
      recordDecision(db, {
        studentId,
        missionId: mission.id,
        sceneId: later.id,
        choiceId: choice.id,
        evidence: choice.evidence,
      }),
    ).toThrow(/not the decision this attempt is on/i);
    expect(getAttempt(db, studentId, mission.id)!.path).toEqual([]);
  });

  it("refuses a decision at a scene the path has already left", () => {
    const studentId = freshStudent();
    playTo(db, studentId, mission, decisions[1].id);
    const earlier = decisions[0];
    const choice = earlier.choices!.find((c) => !c.retry)!;

    expect(() =>
      recordDecision(db, {
        studentId,
        missionId: mission.id,
        sceneId: earlier.id,
        choiceId: choice.id,
        evidence: choice.evidence,
      }),
    ).toThrow(/not the decision this attempt is on/i);
  });

  it("cannot be walked by posting every strong choice out of order", () => {
    // The exact attack: take the best option at every decision, in reverse.
    const studentId = freshStudent();
    startAttempt(db, studentId, mission.id);
    let accepted = 0;
    for (const scene of [...decisions].reverse()) {
      const strong = scene.choices!.find((c) => c.feedback.tone === "strong");
      if (!strong) continue;
      try {
        recordDecision(db, {
          studentId,
          missionId: mission.id,
          sceneId: scene.id,
          choiceId: strong.id,
          evidence: strong.evidence,
        });
        accepted += 1;
      } catch {
        // expected for every scene but the one the path is actually on
      }
    }
    // At most the genuine first decision can have been recorded.
    expect(accepted).toBeLessThanOrEqual(1);
    expect(() => completeAttempt(db, studentId, mission.id)).toThrow(/played to the end/i);
    expect(getAttempt(db, studentId, mission.id)!.completed_at).toBeNull();
  });

  it("refuses to finish a mission sitting at its opening scene", () => {
    const studentId = freshStudent();
    startAttempt(db, studentId, mission.id);
    expect(() => completeAttempt(db, studentId, mission.id)).toThrow(/played to the end/i);
    // And no badge, because the attempt is not complete.
    expect(getAttempt(db, studentId, mission.id)!.completed_at).toBeNull();
  });

  it("finishes a mission that was actually played to an ending", () => {
    const studentId = freshStudent();
    playToEnd(db, studentId, mission);
    expect(getAttempt(db, studentId, mission.id)!.completed_at).toBeTruthy();
  });
});

describe("a check-in is finished when it is answered", () => {
  it("refuses to complete an empty form", () => {
    const studentId = freshStudent();
    // Nothing saved at all: there is no record, so there is nothing to finish.
    expect(completeBenchmark(db, studentId, "pre")).toBeUndefined();
  });

  it("refuses to complete a partly answered form", () => {
    const studentId = freshStudent();
    const form = BENCHMARK_FORMS.pre;
    for (const item of form.items.slice(0, 4)) {
      saveBenchmarkResponse(db, {
        studentId,
        form: "pre",
        itemId: item.id,
        optionId: item.options[0].id,
      });
    }
    expect(() => completeBenchmark(db, studentId, "pre")).toThrow(/every question/i);
    expect(getBenchmark(db, studentId, "pre")!.completed_at).toBeNull();
  });

  it("completes once every item has a valid answer, and then locks", () => {
    const studentId = freshStudent();
    const form = BENCHMARK_FORMS.pre;
    for (const item of form.items) {
      saveBenchmarkResponse(db, {
        studentId,
        form: "pre",
        itemId: item.id,
        optionId: item.options[0].id,
      });
    }
    expect(completeBenchmark(db, studentId, "pre")!.completed_at).toBeTruthy();

    // An answer counted into a cohort figure cannot be revised afterwards.
    expect(() =>
      saveBenchmarkResponse(db, {
        studentId,
        form: "pre",
        itemId: form.items[0].id,
        optionId: form.items[0].options[1].id,
      }),
    ).toThrow(/already finished/i);
  });
});
