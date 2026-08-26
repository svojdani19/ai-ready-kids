import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS } from "./helpers";
import { getMission, MISSIONS } from "@/content/missions";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { createStudent, getClassByJoinCode, listStudents, normaliseJoinCode } from "@/lib/repo/classroom";
import {
  completeAttempt,
  completeBenchmark,
  getAttempt,
  getBenchmark,
  listAttemptsForStudent,
  listBenchmarksForStudent,
  recordDecision,
  resetAttempt,
  saveBenchmarkResponse,
  startAttempt,
} from "@/lib/repo/progress";
import { summariseStudent } from "@/lib/domain/evidence";
import { nextBenchmarkFor, scoreForm } from "@/lib/domain/benchmark";
import { findScene, nextSceneAfter, resumeSceneId } from "@/lib/domain/missionPath";

let db: Db;
let cleanup: () => void;

beforeAll(() => {
  ({ db, cleanup } = createTestDb());
});
afterAll(() => cleanup());

describe("student joins a class", () => {
  it("matches a join code regardless of case, spaces or dashes", () => {
    for (const typed of ["MAPLE-317", "maple-317", "maple 317", " Maple317 ", "MAPLE—317"]) {
      const found = getClassByJoinCode(db, typed);
      expect(found?.id, typed).toBe(DEMO_CLASS);
    }
  });

  it("returns nothing for an unknown or empty code", () => {
    expect(getClassByJoinCode(db, "ZZZZ-999")).toBeUndefined();
    expect(getClassByJoinCode(db, "")).toBeUndefined();
    expect(getClassByJoinCode(db, "   ")).toBeUndefined();
  });

  it("normalises consistently", () => {
    expect(normaliseJoinCode("maple-317")).toBe("MAPLE317");
  });

  it("lists a roster of display names only", () => {
    const roster = listStudents(db, DEMO_CLASS);
    expect(roster.length).toBeGreaterThan(15);
    for (const student of roster) {
      // First name plus a single last initial. Never a full surname.
      expect(student.display_name).toMatch(/^[A-Z][a-z]+ [A-Z]\.$/);
      expect(Object.keys(student)).toEqual([
        "id",
        "class_id",
        "display_name",
        "avatar_key",
        "created_at",
      ]);
    }
  });
});

describe("student plays a mission end to end", () => {
  const mission = getMission("sprocket-wants-to-know")!;
  let studentId: string;

  beforeAll(() => {
    studentId = createStudent(db, { classId: DEMO_CLASS, displayName: "Testy M." }).id;
  });

  it("starts with no attempt and an opening scene", () => {
    expect(getAttempt(db, studentId, mission.id)).toBeUndefined();
    const attempt = startAttempt(db, studentId, mission.id);
    expect(attempt.completed_at).toBeNull();
    expect(resumeSceneId(mission, attempt.path)).toBe(mission.openingSceneId);
  });

  it("is idempotent when a student reopens the mission", () => {
    const first = startAttempt(db, studentId, mission.id);
    const second = startAttempt(db, studentId, mission.id);
    expect(second.id).toBe(first.id);
    expect(listAttemptsForStudent(db, studentId)).toHaveLength(1);
  });

  it("walks the safest path, recording a decision at each choice scene", () => {
    let sceneId = mission.openingSceneId;
    let guard = 0;

    while (guard++ < 40) {
      const scene = findScene(mission, sceneId)!;
      if (scene.kind === "ending") break;
      if (!scene.choices?.length) {
        sceneId = scene.next!;
        continue;
      }
      const choice = scene.choices.find((c) => c.feedback.tone === "strong")!;
      recordDecision(db, {
        studentId,
        missionId: mission.id,
        sceneId: scene.id,
        choiceId: choice.id,
        evidence: choice.evidence,
      });
      sceneId = nextSceneAfter(scene, choice);
    }

    expect(findScene(mission, sceneId)!.kind).toBe("ending");
    const attempt = getAttempt(db, studentId, mission.id)!;
    expect(attempt.path.length).toBeGreaterThanOrEqual(4);
    expect(Object.values(attempt.evidence)).toContain("demonstrated");
  });

  it("awards the badge and the evidence only once completed", () => {
    const before = summariseStudent(listAttemptsForStudent(db, studentId));
    expect(before.badgeIds).toHaveLength(0);
    expect(before.skillsDemonstrated).toBe(0);

    completeAttempt(db, studentId, mission.id);

    const after = summariseStudent(listAttemptsForStudent(db, studentId));
    expect(after.badgeIds).toEqual([mission.badge.id]);
    expect(after.completedMissionIds).toEqual([mission.id]);
    expect(after.skillsDemonstrated).toBeGreaterThan(0);
  });

  it("does not move the completion timestamp when finished twice", () => {
    const first = getAttempt(db, studentId, mission.id)!.completed_at;
    completeAttempt(db, studentId, mission.id);
    expect(getAttempt(db, studentId, mission.id)!.completed_at).toBe(first);
  });

  it("resumes a part-finished mission at the next decision, not the start", () => {
    const other = getMission("four-doors")!;
    startAttempt(db, studentId, other.id);
    const scene = other.scenes.find((s) => s.choices?.length)!;
    const choice = scene.choices!.find((c) => c.feedback.tone === "strong")!;
    recordDecision(db, {
      studentId,
      missionId: other.id,
      sceneId: scene.id,
      choiceId: choice.id,
      evidence: choice.evidence,
    });

    const resumed = resumeSceneId(other, getAttempt(db, studentId, other.id)!.path);
    expect(resumed).not.toBe(other.openingSceneId);
    expect(findScene(other, resumed)).toBeDefined();
  });

  it("keeps demonstrated evidence sticky against a later weaker answer", () => {
    const target = "privacy.identity";
    recordDecision(db, {
      studentId,
      missionId: mission.id,
      sceneId: "s2",
      choiceId: "c3",
      evidence: { skillId: target, result: "developing" },
    });
    expect(getAttempt(db, studentId, mission.id)!.evidence[target]).toBe("demonstrated");
  });

  it("lets a student replay from scratch", () => {
    resetAttempt(db, studentId, mission.id);
    expect(getAttempt(db, studentId, mission.id)).toBeUndefined();
    expect(summariseStudent(listAttemptsForStudent(db, studentId)).badgeIds).toHaveLength(0);
  });
});

describe("student check-in", () => {
  let studentId: string;

  beforeAll(() => {
    studentId = createStudent(db, { classId: DEMO_CLASS, displayName: "Bench N." }).id;
  });

  it("offers the fall check-in first", () => {
    expect(nextBenchmarkFor(listBenchmarksForStudent(db, studentId))).toEqual({
      form: "pre",
      resuming: false,
    });
  });

  it("saves each answer as it is chosen and can be resumed", () => {
    const form = BENCHMARK_FORMS.pre;
    saveBenchmarkResponse(db, {
      studentId,
      form: "pre",
      itemId: form.items[0].id,
      optionId: form.items[0].options[0].id,
    });
    expect(nextBenchmarkFor(listBenchmarksForStudent(db, studentId))).toEqual({
      form: "pre",
      resuming: true,
    });

    for (const item of form.items.slice(1)) {
      saveBenchmarkResponse(db, {
        studentId,
        form: "pre",
        itemId: item.id,
        optionId: item.options.find((o) => o.correct)!.id,
      });
    }
    completeBenchmark(db, studentId, "pre");
  });

  it("moves on to the spring form once the fall one is finished", () => {
    expect(nextBenchmarkFor(listBenchmarksForStudent(db, studentId))).toEqual({
      form: "post",
      resuming: false,
    });
  });

  it("scores per competency without exposing anything to the student", () => {
    const record = listBenchmarksForStudent(db, studentId).find((r) => r.form === "pre")!;
    const score = scoreForm("pre", record.responses);
    expect(score.total).toBe(9);
    expect(score.correct).toBe(8); // first item was deliberately answered wrong
    expect(score.byCompetency.privacy.total).toBe(3);
  });

  it("treats an unanswered item as incorrect rather than throwing", () => {
    expect(scoreForm("pre", {}).correct).toBe(0);
    expect(scoreForm("post", { "post-1": "nonsense" }).correct).toBe(0);
  });

  it("stamps a completion time once and keeps it across repeated retries", () => {
    // The client retries finalisation after a failure, so completing twice
    // must not move the marker or create a second one.
    const first = getBenchmark(db, studentId, "pre")!.completed_at;
    expect(first).not.toBeNull();
    completeBenchmark(db, studentId, "pre");
    completeBenchmark(db, studentId, "pre");
    expect(getBenchmark(db, studentId, "pre")!.completed_at).toBe(first);
    expect(listBenchmarksForStudent(db, studentId).filter((r) => r.form === "pre")).toHaveLength(1);
  });

  it("keeps every saved answer when a completion retry happens", () => {
    const before = getBenchmark(db, studentId, "pre")!.responses;
    completeBenchmark(db, studentId, "pre");
    expect(getBenchmark(db, studentId, "pre")!.responses).toEqual(before);
    expect(Object.keys(before)).toHaveLength(9);
  });

  it("reports nothing left once both windows are done", () => {
    for (const item of BENCHMARK_FORMS.post.items) {
      saveBenchmarkResponse(db, {
        studentId,
        form: "post",
        itemId: item.id,
        optionId: item.options.find((o) => o.correct)!.id,
      });
    }
    completeBenchmark(db, studentId, "post");
    expect(nextBenchmarkFor(listBenchmarksForStudent(db, studentId))).toBeNull();
  });
});

describe("student-facing reporting", () => {
  it("never produces an overall score for a child", () => {
    const summary = summariseStudent(listAttemptsForStudent(db, "stu_room12_02"));
    expect(Object.keys(summary)).not.toContain("score");
    expect(Object.keys(summary)).not.toContain("risk");
    expect(summary.skillsTotal).toBe(9);
  });

  it("counts a badge for every mission a student has completed", () => {
    const attempts = listAttemptsForStudent(db, "stu_room12_02");
    const summary = summariseStudent(attempts);
    expect(summary.badgeIds).toHaveLength(summary.completedMissionIds.length);
    expect(summary.badgeIds.every((b) => MISSIONS.some((m) => m.badge.id === b))).toBe(true);
  });
});
