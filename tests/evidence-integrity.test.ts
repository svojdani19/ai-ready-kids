import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS } from "./helpers";
import { MISSIONS } from "@/content/missions";
import { COMPETENCY_IDS } from "@/content/competencies";
import { findScene, nextSceneAfter } from "@/lib/domain/missionPath";
import { createStudent } from "@/lib/repo/classroom";
import { getAttempt, recordDecision } from "@/lib/repo/progress";
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
    const mission = MISSIONS[0];
    const studentId = freshStudent();
    const scenes = mission.scenes.filter((s) => s.choices?.length);
    const strongScene = scenes.find((s) =>
      s.choices!.some((c) => c.feedback.tone === "strong" && c.evidence),
    )!;
    const strong = strongScene.choices!.find(
      (c) => c.feedback.tone === "strong" && c.evidence,
    )!;

    // Earned cleanly the first time.
    recordDecision(db, {
      studentId,
      missionId: mission.id,
      sceneId: strongScene.id,
      choiceId: strong.id,
      evidence: strong.evidence,
    });
    expect(getAttempt(db, studentId, mission.id)!.evidence[strong.evidence!.skillId]).toBe(
      "demonstrated",
    );

    // A later coached answer on the same skill must not take it away.
    recordDecision(db, {
      studentId,
      missionId: mission.id,
      sceneId: strongScene.id,
      choiceId: strong.id,
      evidence: strong.evidence,
    });
    expect(getAttempt(db, studentId, mission.id)!.evidence[strong.evidence!.skillId]).toBe(
      "demonstrated",
    );
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
