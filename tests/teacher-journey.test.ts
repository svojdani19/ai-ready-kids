import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_ADMIN, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER, playToEnd } from "./helpers";
import { MISSIONS, getMission } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";
import { createUser } from "@/lib/repo/school";
import {
  assignMission,
  createClass,
  createStudent,
  deleteStudentFromClass,
  generateJoinCode,
  listAssignments,
  listClassesForTeacher,
  listStudents,
  unassignMission,
} from "@/lib/repo/classroom";
import {
  completeCertification,
  getCertification,
  listAttemptsForClass,
  recordDecision,
  saveCertificationAnswer,
} from "@/lib/repo/progress";
import {
  missionsOfferingSkill,
  nextTeachingFocus,
  summariseCohort,
  summariseStudent,
} from "@/lib/domain/evidence";

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
    expect(listClassesForTeacher(db, DEMO_TEACHER, DEMO_SCHOOL).some((c) => c.id === classId)).toBe(true);
  });

  it("never issues a duplicate join code", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 40; i += 1) codes.add(generateJoinCode(db));
    expect(codes.size).toBeGreaterThan(1);
    const existing = new Set(
      listClassesForTeacher(db, DEMO_TEACHER, DEMO_SCHOOL).map((c) => c.join_code),
    );
    for (const code of codes) expect(existing.has(code)).toBe(false);
  });

  it("adds and removes students, taking their records with them", () => {
    const student = createStudent(db, { classId, displayName: "Robin P." });
    expect(listStudents(db, classId)).toHaveLength(1);

    const mission = MISSIONS[0];
    playToEnd(db, student.id, mission);
    expect(listAttemptsForClass(db, classId)).toHaveLength(1);

    expect(deleteStudentFromClass(db, student.id, classId)).toBe(true);
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
    expect(focus.label.length).toBeGreaterThan(0);

    if (focus.kind === "reteach") {
      // Only skills enough of the class has actually met may be ranked, and the
      // rate is over those students rather than over the whole roster.
      const threshold = Math.max(5, Math.ceil(cohort.studentCount / 2));
      const comparable = cohort.skills.filter((s) => s.withOpportunity >= threshold);
      expect(comparable.length).toBeGreaterThan(0);
      expect(focus.rate).toBe(Math.min(...comparable.map((s) => s.independentRate)));
      expect(focus.rate).toBeCloseTo(focus.independentOpportunities / focus.opportunities, 10);
    } else {
      // Coverage, not competence: nothing had comparable opportunity.
      const threshold = Math.max(5, Math.ceil(cohort.studentCount / 2));
      expect(cohort.skills.every((s) => s.withOpportunity < threshold)).toBe(true);
    }
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

    // Finishing has to be earned by the path now, so play the rest of it.
    playToEnd(db, student.id, mission);
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

describe("evidence roll-ups separate lifetime from opportunity", () => {
  /**
   * Both problems this covers were live at once. Evidence merges as a lifetime
   * maximum, so one demonstrated result hid every later coached one; and the
   * cohort rate divided by the whole roster, so a skill one student of thirty
   * had met and shown read as 3% rather than 100% of those who practised it.
   * The second fed the teaching recommendation, which therefore ranked the
   * least-assigned skill as the class's biggest gap.
   */
  function attempt(
    studentId: string,
    missionId: string,
    evidence: Record<string, "demonstrated" | "developing">,
    completedAt: string,
  ) {
    return {
      id: `att_${studentId}_${missionId}`,
      student_id: studentId,
      mission_id: missionId,
      started_at: completedAt,
      completed_at: completedAt,
      path: [],
      evidence,
    } as unknown as Parameters<typeof summariseCohort>[0]["attempts"][number];
  }

  const SKILL = "privacy.identity";
  const [first, second] = missionsOfferingSkill(SKILL);

  it("keeps a later coached result visible after an earlier success", () => {
    const summary = summariseStudent([
      attempt("s1", first, { [SKILL]: "demonstrated" }, "2026-01-10"),
      attempt("s1", second, { [SKILL]: "developing" }, "2026-02-10"),
    ]);
    const state = summary.skills.find((x) => x.skillId === SKILL)!;

    // The lifetime claim is unchanged and still honest: shown at least once.
    expect(state.result).toBe("demonstrated");
    // And the transfer picture is no longer erased by it.
    expect(state.opportunities).toEqual(["demonstrated", "developing"]);
    expect(state.demonstratedCount).toBe(1);
    expect(state.developingCount).toBe(1);
    expect(state.latest).toBe("developing");
  });

  it("tells shown-every-time apart from shown-once-then-coached", () => {
    const always = summariseStudent([
      attempt("a", first, { [SKILL]: "demonstrated" }, "2026-01-10"),
      attempt("a", second, { [SKILL]: "demonstrated" }, "2026-02-10"),
    ]).skills.find((x) => x.skillId === SKILL)!;
    const once = summariseStudent([
      attempt("b", first, { [SKILL]: "demonstrated" }, "2026-01-10"),
      attempt("b", second, { [SKILL]: "developing" }, "2026-02-10"),
    ]).skills.find((x) => x.skillId === SKILL)!;

    // Identical under the lifetime view, which is exactly the problem.
    expect(always.result).toBe(once.result);
    // Distinguishable under the opportunity view.
    expect(always.demonstratedCount).not.toBe(once.demonstratedCount);
    expect(always.latest).not.toBe(once.latest);
  });

  it("orders opportunities oldest first, whatever order the rows arrive in", () => {
    const summary = summariseStudent([
      attempt("s1", second, { [SKILL]: "developing" }, "2026-02-10"),
      attempt("s1", first, { [SKILL]: "demonstrated" }, "2026-01-10"),
    ]);
    const state = summary.skills.find((x) => x.skillId === SKILL)!;
    expect(state.opportunities).toEqual(["demonstrated", "developing"]);
    expect(state.latest).toBe("developing");
  });

  it("rates a skill over the students who met it, not over the roster", () => {
    const studentIds = Array.from({ length: 30 }, (_, i) => `st${i}`);
    const cohort = summariseCohort({
      studentIds,
      // One student of thirty has met the skill, and showed it unaided.
      attempts: [attempt("st0", first, { [SKILL]: "demonstrated" }, "2026-01-10")],
      assignedMissionIds: [first],
    });
    const stat = cohort.skills.find((x) => x.skillId === SKILL)!;

    expect(stat.withOpportunity).toBe(1);
    expect(stat.demonstrated).toBe(1);
    expect(stat.demonstratedRate).toBe(1);
    // The roster count is still available, and still means "no evidence yet".
    expect(stat.notYet).toBe(29);
  });

  it("does not recommend reteaching a skill nobody has reached", () => {
    const studentIds = Array.from({ length: 30 }, (_, i) => `st${i}`);
    const cohort = summariseCohort({
      studentIds,
      attempts: [attempt("st0", first, { [SKILL]: "demonstrated" }, "2026-01-10")],
      assignedMissionIds: [first],
    });
    const focus = nextTeachingFocus(cohort)!;

    // One student is not a comparable signal, so the card must not make an
    // instructional claim at all.
    expect(focus.kind).toBe("not-practised");
    // And it must not be the skill that one student happened to demonstrate.
    expect(focus.skillId).not.toBe(SKILL);
    if (focus.kind === "not-practised") expect(focus.withOpportunity).toBe(0);
  });

  it("makes an instructional claim once enough students have had a go", () => {
    const studentIds = Array.from({ length: 10 }, (_, i) => `st${i}`);
    // Everybody meets the skill; six show it unaided, four needed coaching.
    const attempts = studentIds.map((id, i) =>
      attempt(id, first, { [SKILL]: i < 6 ? "demonstrated" : "developing" }, "2026-01-10"),
    );
    const cohort = summariseCohort({ studentIds, attempts, assignedMissionIds: [first] });
    const focus = nextTeachingFocus(cohort)!;

    expect(focus.kind).toBe("reteach");
    expect(focus.skillId).toBe(SKILL);
    if (focus.kind === "reteach") {
      expect(focus.withOpportunity).toBe(10);
      expect(focus.opportunities).toBe(10);
      expect(focus.independentOpportunities).toBe(6);
      expect(focus.rate).toBeCloseTo(0.6, 10);
    }
  });

  it("keeps the suggestion off a saturated sticky rate", () => {
    // Three authored encounters per skill means the lifetime figure saturates:
    // nearly every child eventually has one good result. A suggestion built on
    // it recommends whatever is nearest to 100%, which is nothing useful.
    const studentIds = Array.from({ length: 10 }, (_, i) => `st${i}`);
    const [m1, m2] = missionsOfferingSkill(SKILL);
    const attempts = studentIds.flatMap((id) => [
      attempt(id, m1, { [SKILL]: "demonstrated" }, "2026-01-10"),
      attempt(id, m2, { [SKILL]: "developing" }, "2026-02-10"),
    ]);
    const cohort = summariseCohort({ studentIds, attempts, assignedMissionIds: [m1, m2] });
    const stat = cohort.skills.find((x) => x.skillId === SKILL)!;

    // Everybody has shown it at least once, so the lifetime view is maxed out.
    expect(stat.demonstratedRate).toBe(1);
    // And half of the encounters needed coaching, which is the teachable fact.
    expect(stat.independentRate).toBeCloseTo(0.5, 10);

    const focus = nextTeachingFocus(cohort)!;
    expect(focus.kind).toBe("reteach");
    if (focus.kind === "reteach") {
      // It must rank on the signal that can move, not the one pinned at 100%.
      expect(focus.rate).toBeLessThan(1);
    }
  });

  it("counts every opportunity for the class, not one per student", () => {
    const studentIds = ["a", "b"];
    const cohort = summariseCohort({
      studentIds,
      attempts: [
        attempt("a", first, { [SKILL]: "demonstrated" }, "2026-01-10"),
        attempt("a", second, { [SKILL]: "developing" }, "2026-02-10"),
        attempt("b", first, { [SKILL]: "developing" }, "2026-01-10"),
      ],
      assignedMissionIds: [first, second],
    });
    const stat = cohort.skills.find((x) => x.skillId === SKILL)!;

    expect(stat.withOpportunity).toBe(2);
    expect(stat.opportunities).toBe(3);
    expect(stat.independentOpportunities).toBe(1);
    // The transfer rate can fall, which the sticky lifetime figure cannot.
    expect(stat.independentRate).toBeCloseTo(1 / 3, 10);
    expect(stat.demonstratedRate).toBeCloseTo(1 / 2, 10);
    // Student a is demonstrated for life despite the later coached result.
    expect(stat.demonstrated).toBe(1);
    expect(stat.developing).toBe(1);
  });
});

describe("the orientation reports completion, not competence", () => {
  /**
   * `completeCertificationAction` checks only that every module has *some*
   * saved answer, so all five can be wrong and the artefact still unlocks.
   * That is the intended design — adult professional learning here is not
   * gated — and it is exactly why the school-facing word had to change. This
   * asserts the two halves stay consistent: as long as completion does not
   * validate correctness, nothing may report it as certification.
   */
  it("lets a teacher finish with every check answered wrongly", () => {
    const teacher = createUser(db, {
      schoolId: DEMO_SCHOOL,
      name: "Wrong Every Time",
      title: "Grade 3 Teacher",
      email: "wrong.everytime@brightwood.demo",
      role: "teacher",
    });
    for (const mod of CERTIFICATION_MODULES) {
      const wrong = mod.check.options.find((o) => !o.correct)!;
      saveCertificationAnswer(db, teacher.id, mod.id, wrong.id);
    }
    completeCertification(db, teacher.id);

    const record = getCertification(db, teacher.id)!;
    expect(record.completed_at).toBeTruthy();
    // Nothing anywhere derives correctness from this record, so nothing may
    // present it as evidence of understanding.
    expect(Object.keys(record.answers)).toHaveLength(CERTIFICATION_MODULES.length);
    for (const mod of CERTIFICATION_MODULES) {
      const chosen = mod.check.options.find((o) => o.id === record.answers[mod.id])!;
      expect(chosen.correct).toBe(false);
    }
  });

  it("keeps the completion record free of any correctness field", () => {
    // If a scoring field ever appears here, the naming decision has to be
    // revisited rather than the word quietly changing back.
    const record = getCertification(db, DEMO_TEACHER);
    for (const key of ["score", "passed", "correct", "grade", "result"]) {
      expect(Object.keys(record ?? {})).not.toContain(key);
    }
  });
});
