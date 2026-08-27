import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import {
  createTestDb,
  DEMO_ADMIN,
  DEMO_CLASS,
  DEMO_SCHOOL,
  DEMO_TEACHER,
  playToEnd,
} from "./helpers";
import {
  archiveClass,
  createClass,
  createStudent,
  deleteClass,
  listClasses,
  listStudents,
  assignMission,
} from "@/lib/repo/classroom";
import {
  createUser,
  deleteUser,
  getPrimarySchool,
  getUserByEmail,
  listAudit,
  listUsers,
  recordAudit,
  setRetentionMonths,
} from "@/lib/repo/school";
import {
  completeBenchmark,
  listAttemptsForSchool,
  listBenchmarksForSchool,
  listBenchmarksForClass,
  saveBenchmarkResponse,
} from "@/lib/repo/progress";
import { buildSchoolReport, MIN_REPORTABLE_GROUP, reportToCsv } from "@/lib/repo/report";
import { MISSIONS } from "@/content/missions";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { MIN_BENCHMARK_GROUP, summariseCohortBenchmark } from "@/lib/domain/benchmark";
import { addMonths, formatDate, purgeDateFor, retentionRows } from "@/lib/domain/retention";
import { runScheduledPurge } from "@/lib/domain/purge";
import { canTeachClass } from "@/lib/auth/access";
import { classesOwnedBy } from "@/lib/repo/school";
import { getClass, reassignClass } from "@/lib/repo/classroom";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let db: Db;
let cleanup: () => void;

beforeAll(() => {
  ({ db, cleanup } = createTestDb());
});
afterAll(() => cleanup());

describe("school overview", () => {
  it("builds an aggregate report over the seeded year", () => {
    const report = buildSchoolReport(db, DEMO_SCHOOL);
    expect(report.totals.classes).toBe(4);
    expect(report.totals.students).toBe(90);
    expect(report.totals.teachers).toBe(4);
    expect(report.totals.completionRate).toBeGreaterThan(0);
    expect(report.totals.completionRate).toBeLessThanOrEqual(1);
    expect(report.competencies).toHaveLength(3);
    expect(report.missions).toHaveLength(MISSIONS.length);
    expect(report.byGrade.map((g) => g.grade)).toEqual([2, 3, 4]);
  });

  it("reports the fall-to-spring difference from matched students only", () => {
    const bench = summariseCohortBenchmark(listBenchmarksForSchool(db, DEMO_SCHOOL));
    expect(bench.preCompleted).toBe(90);
    expect(bench.postCompleted).toBeGreaterThan(0);
    expect(bench.matched).toBe(bench.postCompleted);
    expect(bench.pointsDifference).not.toBeNull();
    // The seed models instruction working, so spring should beat fall.
    expect(bench.pointsDifference!).toBeGreaterThan(0);
  });

  it("returns null, not a fake zero, before the spring window runs", () => {
    const room4 = listClasses(db, DEMO_SCHOOL).find((c) => c.name === "Room 4")!;
    const bench = summariseCohortBenchmark(listBenchmarksForClass(db, room4.id));
    expect(bench.postCompleted).toBe(0);
    expect(bench.pointsDifference).toBeNull();
    expect(bench.postRate).toBeNull();
    expect(bench.preRate).not.toBeNull();
  });
});

describe("privacy-conscious export", () => {
  it("contains no student names or identifiers anywhere", () => {
    const report = buildSchoolReport(db, DEMO_SCHOOL);
    const serialised = JSON.stringify(report);
    for (const student of listStudents(db, DEMO_CLASS)) {
      expect(serialised).not.toContain(student.display_name);
      expect(serialised).not.toContain(student.id);
    }
    expect(serialised).not.toContain("avatar");
  });

  it("carries no per-student rows at all", () => {
    const report = buildSchoolReport(db, DEMO_SCHOOL);
    for (const row of report.byClass) {
      expect(Object.keys(row)).not.toContain("students_list");
      expect(typeof row.students).toBe("number");
    }
  });

  it("suppresses any group below the minimum reportable size", () => {
    const tiny = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: "usr_okafor",
      name: "Room 1",
      grade: 4,
      schoolYear: "2025-2026",
    });
    for (let i = 0; i < MIN_REPORTABLE_GROUP - 2; i += 1) {
      createStudent(db, { classId: tiny.id, displayName: `Kid ${String.fromCharCode(65 + i)}.` });
    }

    const report = buildSchoolReport(db, DEMO_SCHOOL);
    const row = report.byClass.find((c) => c.classId === tiny.id)!;
    expect(row.students).toBeLessThan(MIN_REPORTABLE_GROUP);
    expect(row.suppressed).toBe(true);
    expect(row.completionRate).toBeNull();
    expect(row.competencies.every((c) => c.demonstratedRate === null)).toBe(true);

    const csv = reportToCsv(report);
    expect(csv).toContain("too few to report");

    deleteClass(db, tiny.id);
  });

  it("renders CSV with escaped commas and quotes", () => {
    const report = buildSchoolReport(db, DEMO_SCHOOL);
    const csv = reportToCsv(report);
    expect(csv.split("\n")[0]).toBe("AI Ready Kids school report");
    expect(csv).toContain(report.school.name);
    // Privacy notes contain commas, so they must be quoted.
    expect(csv).toMatch(/"[^"]*no student names[^"]*"/);
    for (const line of csv.split("\n")) {
      const quotes = (line.match(/"/g) ?? []).length;
      expect(quotes % 2, line).toBe(0);
    }
  });

  it("states its own limits in the report body", () => {
    const report = buildSchoolReport(db, DEMO_SCHOOL);
    expect(report.privacy.join(" ")).toContain("not risk scores");
    expect(report.privacy.join(" ")).toContain("too few to report");
  });
});

describe("retention and deletion", () => {
  it("computes a purge date from the configured window", () => {
    const school = getPrimarySchool(db);
    setRetentionMonths(db, school.id, 12);
    const updated = getPrimarySchool(db);
    expect(updated.retention_months).toBe(12);
    expect(purgeDateFor(updated).getUTCFullYear()).toBe(
      new Date(updated.term_renews_on).getUTCFullYear() + 1,
    );
  });

  it("handles month arithmetic at the end of a month", () => {
    expect(formatDate(addMonths("2026-01-31T00:00:00.000Z", 1))).toBe("February 28, 2026");
    expect(formatDate(addMonths("2026-08-26T00:00:00.000Z", 12))).toBe("August 26, 2027");
  });

  it("does not let archiving move a class's deletion date in either direction", () => {
    const school = getPrimarySchool(db);
    const classroom = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: "usr_okafor",
      name: "Room 3",
      grade: 3,
      schoolYear: "2025-2026",
    });
    archiveClass(db, classroom.id);

    const classes = listClasses(db, DEMO_SCHOOL, true).map((c) => ({
      ...c,
      studentCount: listStudents(db, c.id).length,
    }));
    const rows = retentionRows(school, classes, new Date("2026-08-26T00:00:00.000Z"));
    const archived = rows.find((r) => r.classId === classroom.id)!;
    const active = rows.find((r) => r.classId === DEMO_CLASS)!;

    expect(archived.archived).toBe(true);
    // Archiving mid-year must not delete records early, and archiving late
    // must not extend them past the policy the administrator set.
    expect(archived.purgeOn.getTime()).toBe(active.purgeOn.getTime());
    expect(archived.purgeOn.getTime()).toBe(purgeDateFor(school).getTime());
    deleteClass(db, classroom.id);
  });

  it("marks a class eligible once its purge date has passed", () => {
    const school = { ...getPrimarySchool(db), retention_months: 3 };
    const classes = listClasses(db, DEMO_SCHOOL).map((c) => ({ ...c, studentCount: 0 }));
    const far = retentionRows(school, classes, new Date("2030-01-01T00:00:00.000Z"));
    expect(far.every((r) => r.eligibleNow)).toBe(true);
    const near = retentionRows(school, classes, new Date("2026-01-01T00:00:00.000Z"));
    expect(near.every((r) => r.eligibleNow)).toBe(false);
  });

  it("deletes a class together with every record that belongs to it", () => {
    const classroom = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: "usr_okafor",
      name: "Room 8",
      grade: 2,
      schoolYear: "2025-2026",
    });
    createStudent(db, { classId: classroom.id, displayName: "Gone S." });

    const beforeStudents = listStudents(db, classroom.id).length;
    const beforeAttempts = listAttemptsForSchool(db, DEMO_SCHOOL).length;
    expect(beforeStudents).toBe(1);

    deleteClass(db, classroom.id);

    expect(listClasses(db, DEMO_SCHOOL, true).some((c) => c.id === classroom.id)).toBe(false);
    expect(listStudents(db, classroom.id)).toEqual([]);
    expect(listAttemptsForSchool(db, DEMO_SCHOOL).length).toBe(beforeAttempts);
  });

  it("writes an audit entry for every administrative action", () => {
    const before = listAudit(db, DEMO_SCHOOL).length;
    recordAudit(db, {
      schoolId: DEMO_SCHOOL,
      actorLabel: "Rosa Delgado",
      action: "data.deleted",
      detail: "Room 8 permanently deleted.",
    });
    const after = listAudit(db, DEMO_SCHOOL);
    expect(after.length).toBe(before + 1);
    expect(after[0].action).toBe("data.deleted");
    expect(after[0].detail).toContain("Room 8");
  });
});

describe("staff management", () => {
  it("adds a teacher who can then be found by email, case-insensitively", () => {
    const created = createUser(db, {
      schoolId: DEMO_SCHOOL,
      role: "teacher",
      name: "Jordan Ellis",
      email: "J.Ellis@brightwood.demo",
      title: "Grade 2 Teacher, Room 6",
    });
    expect(created.email).toBe("j.ellis@brightwood.demo");
    expect(getUserByEmail(db, "J.ELLIS@brightwood.demo")?.id).toBe(created.id);
    deleteUser(db, created.id);
    expect(getUserByEmail(db, "j.ellis@brightwood.demo")).toBeUndefined();
  });

  it("keeps administrators and teachers separable", () => {
    expect(listUsers(db, DEMO_SCHOOL, "admin").length).toBeGreaterThanOrEqual(1);
    expect(listUsers(db, DEMO_SCHOOL, "teacher").length).toBeGreaterThanOrEqual(1);
    expect(listUsers(db, DEMO_SCHOOL).find((u) => u.id === DEMO_ADMIN)?.role).toBe("admin");
  });
});

describe("suppression counts the students who actually contributed", () => {
  /**
   * The promise in the export is that nothing below five students is reported.
   * It was being checked against roster size, so a school of thirty where one
   * child had completed the only relevant mission exported that child's result
   * as a competency percentage. In a grade 2-4 school somebody can usually work
   * out who the one participant was, which makes "aggregate" no protection at
   * all. These tests hold the promise to what it says.
   */
  let school: string;
  let db2: Db;
  let cleanup2: () => void;

  beforeAll(() => {
    ({ db: db2, cleanup: cleanup2 } = createTestDb());
    school = DEMO_SCHOOL;
  });
  afterAll(() => cleanup2());

  /** A fresh class with `size` students and no attempts at all. */
  function emptyClass(name: string, size: number): { classId: string; studentIds: string[] } {
    const classId = createClass(db2, {
      schoolId: school,
      teacherId: DEMO_TEACHER,
      name,
      grade: 3,
      schoolYear: "2025-2026",
    }).id;
    const studentIds = Array.from({ length: size }, (_, i) =>
      createStudent(db2, { classId, displayName: `Child ${name}${i}.` }).id,
    );
    return { classId, studentIds };
  }

  /** Complete one mission for a student so they contribute to a competency. */
  function contribute(classId: string, studentId: string, missionId: string) {
    assignMission(db2, { classId, missionId, assignedBy: DEMO_TEACHER });
    const mission = MISSIONS.find((m) => m.id === missionId)!;
    // Played to the end rather than fabricated, because the server no longer
    // accepts an attempt that could not have happened.
    playToEnd(db2, studentId, mission);
  }

  it("suppresses a competency one student of thirty contributed to", () => {
    const { classId, studentIds } = emptyClass("Thirty", 30);
    const mission = MISSIONS.find((m) => m.competency === "privacy")!;
    contribute(classId, studentIds[0], mission.id);

    const report = buildSchoolReport(db2, school);
    const row = report.byClass.find((c) => c.classId === classId)!;
    const cell = row.competencies.find((c) => c.competency === "privacy")!;

    // One contributor, thirty enrolled. The old check saw thirty.
    expect(cell.contributors).toBe(1);
    expect(cell.demonstratedRate).toBeNull();
    // The class itself is not suppressed — it has thirty children on the roster.
    expect(row.suppressed).toBe(false);
  });

  it("suppresses the raw counts alongside the rate", () => {
    const report = buildSchoolReport(db2, school);
    for (const c of report.competencies) {
      if (c.demonstratedRate !== null) continue;
      // "1 of 1" discloses exactly what the percentage would have.
      expect(c.demonstrated).toBeNull();
      expect(c.possible).toBeNull();
    }
  });

  it("holds the boundary at five distinct contributors", () => {
    const mission = MISSIONS.find((m) => m.competency === "verification")!;
    const four = emptyClass("Four", 20);
    for (let i = 0; i < MIN_REPORTABLE_GROUP - 1; i += 1) {
      contribute(four.classId, four.studentIds[i], mission.id);
    }
    let cell = buildSchoolReport(db2, school)
      .byClass.find((c) => c.classId === four.classId)!
      .competencies.find((c) => c.competency === "verification")!;
    expect(cell.contributors).toBe(MIN_REPORTABLE_GROUP - 1);
    expect(cell.demonstratedRate).toBeNull();

    // One more child, and the same cell becomes reportable.
    contribute(four.classId, four.studentIds[MIN_REPORTABLE_GROUP - 1], mission.id);
    cell = buildSchoolReport(db2, school)
      .byClass.find((c) => c.classId === four.classId)!
      .competencies.find((c) => c.competency === "verification")!;
    expect(cell.contributors).toBe(MIN_REPORTABLE_GROUP);
    expect(cell.demonstratedRate).not.toBeNull();
  });

  it("deduplicates contributors across classes at school level", () => {
    const mission = MISSIONS.find((m) => m.competency === "ownership")!;
    const a = emptyClass("OwnA", 10);
    const b = emptyClass("OwnB", 10);
    for (let i = 0; i < 3; i += 1) contribute(a.classId, a.studentIds[i], mission.id);
    for (let i = 0; i < 2; i += 1) contribute(b.classId, b.studentIds[i], mission.id);

    const report = buildSchoolReport(db2, school);
    // Neither class reaches five on its own.
    for (const classId of [a.classId, b.classId]) {
      const cell = report.byClass
        .find((c) => c.classId === classId)!
        .competencies.find((c) => c.competency === "ownership")!;
      expect(cell.contributors).toBeLessThan(MIN_REPORTABLE_GROUP);
      expect(cell.demonstratedRate).toBeNull();
    }
    // Together they do, counted as distinct children rather than as cells.
    const schoolCell = report.competencies.find((c) => c.competency === "ownership")!;
    expect(schoolCell.contributors).toBeGreaterThanOrEqual(MIN_REPORTABLE_GROUP);
    expect(schoolCell.demonstratedRate).not.toBeNull();
  });
});

describe("benchmark suppression happens on the object, not in one view", () => {
  let db3: Db;
  let cleanup3: () => void;
  beforeAll(() => {
    ({ db: db3, cleanup: cleanup3 } = createTestDb());
  });
  afterAll(() => cleanup3());

  function record(studentId: string, form: "pre" | "post") {
    for (const item of BENCHMARK_FORMS[form].items) {
      saveBenchmarkResponse(db3, {
        studentId,
        form,
        itemId: item.id,
        optionId: item.options.find((o) => o.correct)!.id,
      });
    }
    completeBenchmark(db3, studentId, form);
  }

  it("withholds every rate and change cell for a single matched student", () => {
    const classId = createClass(db3, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Bench One",
      grade: 3,
      schoolYear: "2025-2026",
    }).id;
    const only = createStudent(db3, { classId, displayName: "Solo B." }).id;
    // Pad the roster so the school is plainly larger than the reporting floor.
    for (let i = 0; i < 20; i += 1) {
      createStudent(db3, { classId, displayName: `Other ${i}.` });
    }
    record(only, "pre");
    record(only, "post");

    const bench = summariseCohortBenchmark(listBenchmarksForClass(db3, classId));
    expect(bench.matched).toBe(1);
    expect(bench.preRate).toBeNull();
    expect(bench.postRate).toBeNull();
    expect(bench.pointsDifference).toBeNull();
    for (const c of bench.byCompetency) {
      expect(c.preRate).toBeNull();
      expect(c.postRate).toBeNull();
      expect(c.pointsDifference).toBeNull();
    }

    // And it must be withheld in the export, not merely hidden in a page. The
    // seeded school has plenty of matched students of its own, so this checks
    // the export path against a report whose benchmark is the suppressed one.
    const report = { ...buildSchoolReport(db3, DEMO_SCHOOL), benchmark: bench };
    const csv = reportToCsv(report);
    const changeRow = csv.split("\n").find((r) => r.startsWith("Change between check-ins"))!;
    expect(changeRow).toContain("too few to report");
    expect(changeRow).not.toMatch(/-?\d+(\.\d+)?"?$/);
    // The participation count is not itself a result and stays visible.
    expect(csv.split("\n").find((r) => r.startsWith("Matched students"))).toContain("1");
  });

  it("reports once the matched group reaches the threshold", () => {
    const classId = createClass(db3, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Bench Many",
      grade: 4,
      schoolYear: "2025-2026",
    }).id;
    const ids = Array.from(
      { length: MIN_BENCHMARK_GROUP },
      (_, i) => createStudent(db3, { classId, displayName: `Many ${i}.` }).id,
    );
    for (const id of ids) {
      record(id, "pre");
      record(id, "post");
    }
    const bench = summariseCohortBenchmark(listBenchmarksForClass(db3, classId));
    expect(bench.matched).toBe(MIN_BENCHMARK_GROUP);
    expect(bench.preRate).not.toBeNull();
    expect(bench.pointsDifference).not.toBeNull();
  });
});

describe("the export never contradicts its own privacy note", () => {
  it("leaks no number where the object says the cell is suppressed", () => {
    const report = buildSchoolReport(db, DEMO_SCHOOL);
    const csv = reportToCsv(report);
    const lines = csv.split("\n");

    for (const c of report.competencies) {
      const row = lines.find((r) => r.startsWith(c.label))!;
      if (c.demonstratedRate === null) {
        expect(row, `${c.label} row`).toContain("too few to report");
        expect(row).not.toMatch(/\d+%/);
      }
    }
    for (const c of report.byClass) {
      if (c.completionRate !== null) continue;
      const row = lines.find((r) => r.startsWith(c.className))!;
      expect(row).toContain("too few to report");
    }
  });

  it("says what the threshold is actually counted over", () => {
    const notes = buildSchoolReport(db, DEMO_SCHOOL).privacy.join(" ");
    // The old note said "any group smaller than five", which was not true of
    // the cells it was describing.
    expect(notes).toContain("distinct students contributed to that particular figure");
    expect(notes).toMatch(/usually fewer students than are enrolled/);
    // Completion rate is the documented exception rather than a quiet one.
    expect(notes).toMatch(/Completion rates are the one figure calculated over everybody assigned/);
  });
});

describe("the retention date has a job behind it", () => {
  /**
   * The page said "Scheduled purge" and "Deletes on", the privacy page said
   * "deletion is a date", and the only thing that ever deleted anything was an
   * administrator clicking a button. `eligibleNow` changed a label. Records
   * could sit indefinitely past the date families had been shown.
   */
  let db5: Db;
  let cleanup5: () => void;
  beforeAll(() => {
    ({ db: db5, cleanup: cleanup5 } = createTestDb());
  });
  afterAll(() => cleanup5());

  const school = () => getPrimarySchool(db5);

  it("deletes nothing before the date", () => {
    const due = purgeDateFor(school());
    const dayBefore = new Date(due.getTime() - 24 * 60 * 60 * 1000);
    const before = listClasses(db5, DEMO_SCHOOL, true).length;

    const result = runScheduledPurge(db5, dayBefore);
    expect(result.classesDeleted).toBe(0);
    expect(listClasses(db5, DEMO_SCHOOL, true)).toHaveLength(before);
  });

  it("deletes on the day itself, whatever hour the job runs", () => {
    const due = purgeDateFor(school());
    // Eligibility is a day in UTC, not an instant, so the small hours count.
    const earlyOnTheDay = new Date(
      Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate(), 0, 1),
    );
    const classes = listClasses(db5, DEMO_SCHOOL, true);
    expect(classes.length).toBeGreaterThan(0);

    const result = runScheduledPurge(db5, earlyOnTheDay);
    expect(result.classesDeleted).toBe(classes.length);
    expect(result.studentsDeleted).toBeGreaterThan(0);
    expect(listClasses(db5, DEMO_SCHOOL, true)).toHaveLength(0);
  });

  it("takes the roster, the attempts and the check-ins with it", () => {
    expect(listAttemptsForSchool(db5, DEMO_SCHOOL)).toHaveLength(0);
    expect(listBenchmarksForSchool(db5, DEMO_SCHOOL)).toHaveLength(0);
  });

  it("writes an audit entry naming what went", () => {
    const entry = listAudit(db5, DEMO_SCHOOL).find((a) => a.action === "retention.purged");
    expect(entry).toBeDefined();
    expect(entry!.actor_label).toBe("Retention job");
    expect(entry!.detail).toMatch(/roster, attempt and check-in/);
  });

  it("is idempotent: a second run deletes nothing and adds no audit noise", () => {
    const audits = listAudit(db5, DEMO_SCHOOL).filter((a) => a.action === "retention.purged").length;
    const result = runScheduledPurge(db5, new Date("2030-01-01T00:00:00.000Z"));
    expect(result.classesDeleted).toBe(0);
    expect(
      listAudit(db5, DEMO_SCHOOL).filter((a) => a.action === "retention.purged"),
    ).toHaveLength(audits);
  });

  it("says due rather than claiming an automatic deletion", () => {
    const page = readFileSync(join(process.cwd(), "src/app/admin/data/page.tsx"), "utf8");
    // The build ships the job without a timer in front of it, and says so.
    expect(page).toContain("Deletion due");
    expect(page).not.toContain("Scheduled purge");
    expect(page).not.toContain("when it disappears");
    expect(page).toContain("npm run purge");
    expect(page).toContain("Nothing in this build");
  });
});

describe("a departing teacher can be offboarded without deleting a child's records", () => {
  /**
   * `removeStaffAction` refused while a teacher owned any class and told the
   * administrator to "reassign or archive it first". No reassignment existed,
   * and the count included archived classes so archiving changed nothing. The
   * only ways through were to permanently delete every class they had ever
   * owned — rosters, attempts and check-ins — or leave the account live, which
   * in a build where staff sign in with a known email and no password preserves
   * their roster access. A teacher leaving in June is not an edge case.
   */
  let db6: Db;
  let cleanup6: () => void;
  beforeAll(() => {
    ({ db: db6, cleanup: cleanup6 } = createTestDb());
  });
  afterAll(() => cleanup6());

  function teacher(name: string, email: string) {
    return createUser(db6, {
      schoolId: DEMO_SCHOOL,
      name,
      title: "Grade 3 Teacher",
      email,
      role: "teacher",
    });
  }

  it("moves a class and keeps everything about it", () => {
    const leaving = teacher("Leaving Teacher", "leaving@brightwood.demo");
    const staying = teacher("Staying Teacher", "staying@brightwood.demo");
    const classId = createClass(db6, {
      schoolId: DEMO_SCHOOL,
      teacherId: leaving.id,
      name: "Room 30",
      grade: 3,
      schoolYear: "2025-2026",
    }).id;
    const before = getClass(db6, classId)!;
    createStudent(db6, { classId, displayName: "Kept K." });

    expect(reassignClass(db6, classId, staying.id)).toBe(true);
    const after = getClass(db6, classId)!;

    expect(after.teacher_id).toBe(staying.id);
    // Roster, join code and identity all survive: this changes who is
    // responsible and nothing else.
    expect(after.join_code).toBe(before.join_code);
    expect(after.name).toBe(before.name);
    expect(listStudents(db6, classId)).toHaveLength(1);
    // And the old owner can no longer reach it.
    expect(canTeachClass({ ...leaving }, after)).toBe(false);
    expect(canTeachClass({ ...staying }, after)).toBe(true);
  });

  it("moves an archived class too, because archiving never changed ownership", () => {
    const leaving = teacher("Archived Owner", "archived.owner@brightwood.demo");
    const staying = teacher("New Owner", "new.owner@brightwood.demo");
    const classId = createClass(db6, {
      schoolId: DEMO_SCHOOL,
      teacherId: leaving.id,
      name: "Room 31",
      grade: 4,
      schoolYear: "2025-2026",
    }).id;
    archiveClass(db6, classId);

    expect(classesOwnedBy(db6, leaving.id).some((c) => c.archived)).toBe(true);
    expect(reassignClass(db6, classId, staying.id)).toBe(true);
    expect(classesOwnedBy(db6, leaving.id)).toHaveLength(0);
    expect(classesOwnedBy(db6, staying.id).some((c) => c.id === classId)).toBe(true);
  });

  it("refuses an administrator, a non-teacher and somebody from another school", () => {
    const owner = teacher("Owner Two", "owner.two@brightwood.demo");
    const classId = createClass(db6, {
      schoolId: DEMO_SCHOOL,
      teacherId: owner.id,
      name: "Room 32",
      grade: 2,
      schoolYear: "2025-2026",
    }).id;

    // No class may become ownerless or cross-school by being moved.
    expect(reassignClass(db6, classId, DEMO_ADMIN)).toBe(false);
    expect(reassignClass(db6, classId, "usr_nobody")).toBe(false);
    expect(getClass(db6, classId)!.teacher_id).toBe(owner.id);
  });

  it("refuses to move a class that does not exist", () => {
    expect(reassignClass(db6, "cls_nope", DEMO_TEACHER)).toBe(false);
  });

  it("names what is blocking removal rather than counting it", () => {
    const src = readFileSync(join(process.cwd(), "src/app/actions/admin.ts"), "utf8");
    const start = src.indexOf("export async function removeStaffAction");
    const body = src.slice(start, src.indexOf("export async function", start + 10) + 1 || undefined);
    expect(body).toContain("classesOwnedBy");
    expect(body).not.toContain("countClassesForTeacher");
    // The old advice was wrong: archiving does not change ownership.
    expect(body).not.toContain("Reassign or archive it first");
    expect(body).toContain("archiving does not change who owns a class");
    // Last-administrator protection stays.
    expect(body).toContain("must keep at least one administrator");
  });

  it("leaves a teacher removable once their classes have moved", () => {
    const leaving = teacher("Clear Teacher", "clear.teacher@brightwood.demo");
    const staying = teacher("Receiving Teacher", "receiving@brightwood.demo");
    const classId = createClass(db6, {
      schoolId: DEMO_SCHOOL,
      teacherId: leaving.id,
      name: "Room 33",
      grade: 3,
      schoolYear: "2025-2026",
    }).id;
    createStudent(db6, { classId, displayName: "Safe S." });

    expect(classesOwnedBy(db6, leaving.id)).toHaveLength(1);
    reassignClass(db6, classId, staying.id);
    expect(classesOwnedBy(db6, leaving.id)).toHaveLength(0);
    // The point of the whole exercise: the child's records are still there.
    expect(listStudents(db6, classId)).toHaveLength(1);
  });
});
