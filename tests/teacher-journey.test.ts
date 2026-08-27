import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_ADMIN, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import { MISSIONS, getMission } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";
import {
  assignMission,
  createClass,
  createStudent,
  deleteStudent,
  generateJoinCode,
  listAssignments,
  listClassesForTeacher,
  listStudents,
  unassignMission,
} from "@/lib/repo/classroom";
import {
  completeAttempt,
  completeCertification,
  getCertification,
  listAttemptsForClass,
  recordDecision,
  saveCertificationAnswer,
  startAttempt,
} from "@/lib/repo/progress";
import { nextTeachingFocus, summariseCohort } from "@/lib/domain/evidence";

let db: Db;
let cleanup: () => void;

beforeAll(() => {
  ({ db, cleanup } = createTestDb());
});
afterAll(() => cleanup());

describe("teacher manages a class", () => {
  let classId: string;

  it("creates a class with a unique, readable join code", () => {
    const created = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Room 9",
      grade: 2,
      schoolYear: "2025-2026",
    });
    classId = created.id;
    expect(created.join_code).toMatch(/^[A-Z]+-\d{3}$/);
    expect(listClassesForTeacher(db, DEMO_TEACHER).some((c) => c.id === classId)).toBe(true);
  });

  it("never issues a duplicate join code", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 40; i += 1) codes.add(generateJoinCode(db));
    expect(codes.size).toBeGreaterThan(1);
    const existing = new Set(
      listClassesForTeacher(db, DEMO_TEACHER).map((c) => c.join_code),
    );
    for (const code of codes) expect(existing.has(code)).toBe(false);
  });

  it("adds and removes students, taking their records with them", () => {
    const student = createStudent(db, { classId, displayName: "Robin P." });
    expect(listStudents(db, classId)).toHaveLength(1);

    const mission = MISSIONS[0];
    startAttempt(db, student.id, mission.id);
    completeAttempt(db, student.id, mission.id);
    expect(listAttemptsForClass(db, classId)).toHaveLength(1);

    deleteStudent(db, student.id);
    expect(listStudents(db, classId)).toHaveLength(0);
    // Cascade: no orphaned attempt is left behind.
    expect(listAttemptsForClass(db, classId)).toHaveLength(0);
  });

  it("assigns and unassigns missions without duplicating rows", () => {
    const mission = MISSIONS[0];
    assignMission(db, { classId, missionId: mission.id, assignedBy: DEMO_TEACHER });
    assignMission(db, {
      classId,
      missionId: mission.id,
      assignedBy: DEMO_TEACHER,
      note: "Do this on the rug.",
    });

    const assignments = listAssignments(db, classId);
    expect(assignments).toHaveLength(1);
    expect(assignments[0].note).toBe("Do this on the rug.");

    unassignMission(db, classId, mission.id);
    expect(listAssignments(db, classId)).toHaveLength(0);
  });
});

describe("teacher sees completion and competency evidence", () => {
  it("summarises the seeded demo class", () => {
    const students = listStudents(db, DEMO_CLASS);
    const assignments = listAssignments(db, DEMO_CLASS);
    const cohort = summariseCohort({
      studentIds: students.map((s) => s.id),
      attempts: listAttemptsForClass(db, DEMO_CLASS),
      assignedMissionIds: assignments.map((a) => a.mission_id),
    });

    expect(cohort.studentCount).toBe(students.length);
    expect(cohort.assignedMissionIds).toHaveLength(assignments.length);
    expect(cohort.completionRate).toBeGreaterThan(0.5);
    expect(cohort.completionRate).toBeLessThanOrEqual(1);
    expect(cohort.skills).toHaveLength(9);
    for (const skill of cohort.skills) {
      expect(skill.demonstrated + skill.developing + skill.notYet).toBe(students.length);
      expect(skill.demonstratedRate).toBeGreaterThanOrEqual(0);
      expect(skill.demonstratedRate).toBeLessThanOrEqual(1);
    }
  });

  it("suggests the least demonstrated skill as the next teaching focus", () => {
    const students = listStudents(db, DEMO_CLASS);
    const cohort = summariseCohort({
      studentIds: students.map((s) => s.id),
      attempts: listAttemptsForClass(db, DEMO_CLASS),
      assignedMissionIds: listAssignments(db, DEMO_CLASS).map((a) => a.mission_id),
    });
    const focus = nextTeachingFocus(cohort)!;
    const rates = cohort.skills
      .filter((s) => s.demonstrated + s.developing > 0)
      .map((s) => s.demonstratedRate);
    expect(focus.rate).toBe(Math.min(...rates));
    expect(focus.label.length).toBeGreaterThan(0);
  });

  it("reports zero rather than dividing by zero for an empty class", () => {
    const empty = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Room 0",
      grade: 4,
      schoolYear: "2025-2026",
    });
    const cohort = summariseCohort({ studentIds: [], attempts: [], assignedMissionIds: [] });
    expect(cohort.completionRate).toBe(0);
    expect(cohort.competencies.every((c) => c.demonstratedRate === 0)).toBe(true);
    expect(listStudents(db, empty.id)).toEqual([]);
  });

  it("counts a mission only once it is finished, not when it is opened", () => {
    const classroom = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Room 5",
      grade: 3,
      schoolYear: "2025-2026",
    });
    const mission = getMission("the-very-sure-answer")!;
    assignMission(db, { classId: classroom.id, missionId: mission.id, assignedBy: DEMO_TEACHER });
    const student = createStudent(db, { classId: classroom.id, displayName: "Ada L." });

    const scene = mission.scenes.find((s) => s.choices?.length)!;
    const choice = scene.choices!.find((c) => c.feedback.tone === "strong")!;
    recordDecision(db, {
      studentId: student.id,
      missionId: mission.id,
      sceneId: scene.id,
      choiceId: choice.id,
      evidence: choice.evidence,
    });

    const partial = summariseCohort({
      studentIds: [student.id],
      attempts: listAttemptsForClass(db, classroom.id),
      assignedMissionIds: [mission.id],
    });
    expect(partial.completionRate).toBe(0);
    expect(partial.startedCount).toBe(1);
    expect(partial.skills.every((s) => s.demonstrated === 0)).toBe(true);

    completeAttempt(db, student.id, mission.id);
    const done = summariseCohort({
      studentIds: [student.id],
      attempts: listAttemptsForClass(db, classroom.id),
      assignedMissionIds: [mission.id],
    });
    expect(done.completionRate).toBe(1);
    expect(done.skills.some((s) => s.demonstrated === 1)).toBe(true);
  });
});

describe("educator micro-certification", () => {
  it("records answers module by module and completes only at the end", () => {
    const userId = DEMO_ADMIN;
    expect(getCertification(db, userId)).toBeUndefined();

    for (const mod of CERTIFICATION_MODULES.slice(0, 3)) {
      saveCertificationAnswer(db, userId, mod.id, mod.check.options[0].id);
    }
    const partial = getCertification(db, userId)!;
    expect(Object.keys(partial.answers)).toHaveLength(3);
    expect(partial.completed_at).toBeNull();

    for (const mod of CERTIFICATION_MODULES.slice(3)) {
      saveCertificationAnswer(db, userId, mod.id, mod.check.options[0].id);
    }
    completeCertification(db, userId);

    const done = getCertification(db, userId)!;
    expect(Object.keys(done.answers)).toHaveLength(CERTIFICATION_MODULES.length);
    expect(done.completed_at).not.toBeNull();
  });

  it("keeps the original completion date if completed twice", () => {
    const first = getCertification(db, DEMO_ADMIN)!.completed_at;
    completeCertification(db, DEMO_ADMIN);
    expect(getCertification(db, DEMO_ADMIN)!.completed_at).toBe(first);
  });

  it("overwrites an answer rather than appending a second one", () => {
    const mod = CERTIFICATION_MODULES[0];
    saveCertificationAnswer(db, DEMO_TEACHER, mod.id, mod.check.options[0].id);
    saveCertificationAnswer(db, DEMO_TEACHER, mod.id, mod.check.options[1].id);
    expect(getCertification(db, DEMO_TEACHER)!.answers[mod.id]).toBe(mod.check.options[1].id);
  });
});
