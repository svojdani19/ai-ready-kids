import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import {
  createTestDb,
  DEMO_ADMIN,
  DEMO_CLASS,
  DEMO_SCHOOL,
  DEMO_TEACHER,
  playToEnd,
  setLicensedSeats,
} from "./helpers";
import {
  ACTIVE_CLASS_LIMIT,
  ClassroomLimitError,
  classroomAllowance,
  classroomLimitRefusal,
  countActiveClasses,
  countActiveRosterStudents,
  LicenceExceededError,
  licenceStatus,
  RestoreExceedsLicenceError,
} from "@/lib/repo/entitlement";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  archiveClass,
  createClass,
  createStudent,
  deleteClass,
  listClasses,
  listStudents,
  restoreClass,
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
import {
  addMonths,
  formatDate,
  purgeDateFor,
  purgeDateForClass,
  retentionRows,
} from "@/lib/domain/retention";
import { addYear, nextYearLabel, previewRollover } from "@/lib/domain/rollover";
import { runScheduledPurge } from "@/lib/domain/purge";
import { canTeachClass } from "@/lib/auth/access";
import { classesOwnedBy, setAcademicYear, setBenchmarkWindow } from "@/lib/repo/school";
import { getClass, reassignClass } from "@/lib/repo/classroom";

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
      yearEndsOn: "2026-06-12",
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
    // Counted from the school year end, not the renewal — sprint 32.
    expect(purgeDateFor(updated)!.getUTCFullYear()).toBe(
      new Date(updated.year_ends_on).getUTCFullYear() + 1,
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
      yearEndsOn: "2026-06-12",
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
    expect(archived.purgeOn!.getTime()).toBe(active.purgeOn!.getTime());
    expect(archived.purgeOn!.getTime()).toBe(purgeDateFor(school)!.getTime());
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
      yearEndsOn: "2026-06-12",
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
      yearEndsOn: "2026-06-12",
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
      yearEndsOn: "2026-06-12",
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
      yearEndsOn: "2026-06-12",
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
    const due = purgeDateFor(school())!;
    const dayBefore = new Date(due.getTime() - 24 * 60 * 60 * 1000);
    const before = listClasses(db5, DEMO_SCHOOL, true).length;

    const result = runScheduledPurge(db5, dayBefore);
    expect(result.classesDeleted).toBe(0);
    expect(listClasses(db5, DEMO_SCHOOL, true)).toHaveLength(before);
  });

  it("deletes on the day itself, whatever hour the job runs", () => {
    const due = purgeDateFor(school())!;
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
    expect(page).toContain("This year due");
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
      yearEndsOn: "2026-06-12",
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
      yearEndsOn: "2026-06-12",
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
      yearEndsOn: "2026-06-12",
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
      yearEndsOn: "2026-06-12",
    }).id;
    createStudent(db6, { classId, displayName: "Safe S." });

    expect(classesOwnedBy(db6, leaving.id)).toHaveLength(1);
    reassignClass(db6, classId, staying.id);
    expect(classesOwnedBy(db6, leaving.id)).toHaveLength(0);
    // The point of the whole exercise: the child's records are still there.
    expect(listStudents(db6, classId)).toHaveLength(1);
  });
});

describe("the academic year is not the subscription term", () => {
  /**
   * They were the same field. Retention used `term_renews_on` — the renewal
   * date — for every class, while the interface said "months after the school
   * year ends". In the seed those are 1 September and 12 June, three months
   * apart. And there was no rollover at all: the classes page took the year
   * from whichever class sorted first with a hard-coded "2025-2026" fallback,
   * and the create action had the same literal as its default, so on 27 August
   * 2026 every new class was still landing in the previous year.
   */
  let db7: Db;
  let cleanup7: () => void;
  beforeAll(() => {
    ({ db: db7, cleanup: cleanup7 } = createTestDb());
  });
  afterAll(() => cleanup7());

  it("keeps the two sets of dates apart in the seed", () => {
    const s = getPrimarySchool(db7);
    // A seed where they coincided would hide the defect.
    expect(s.year_ends_on).not.toBe(s.term_renews_on);
    expect(s.academic_year).toBe("2025-2026");
  });

  it("counts retention from the school year, not the renewal", () => {
    const s = getPrimarySchool(db7);
    expect(purgeDateFor(s)!).toEqual(addMonths(s.year_ends_on, s.retention_months));
    expect(purgeDateFor(s)!).not.toEqual(addMonths(s.term_renews_on, s.retention_months));
  });

  it("gives each cohort its own due date from its own year end", () => {
    const old = createClass(db7, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Old Cohort",
      grade: 3,
      schoolYear: "2024-2025",
      yearEndsOn: "2025-06-13",
    });
    const current = createClass(db7, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Current Cohort",
      grade: 3,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-12",
    });
    const s = getPrimarySchool(db7);
    expect(purgeDateForClass(old, s.retention_months)!).toEqual(addMonths("2025-06-13", 12));
    expect(purgeDateForClass(current, s.retention_months)!).toEqual(addMonths("2026-06-12", 12));
    // Mixed years in one school, and each row is right about itself.
    expect(purgeDateForClass(old, s.retention_months)!.getTime()).toBeLessThan(
      purgeDateForClass(current, s.retention_months)!.getTime(),
    );
  });

  it("never lets a new cohort be purged from an old term date", () => {
    const s = getPrimarySchool(db7);
    const nextYear = createClass(db7, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Next Year",
      grade: 2,
      schoolYear: "2026-2027",
      yearEndsOn: "2027-06-11",
    });
    // The old behaviour anchored every class to the renewal date, which for
    // this cohort would have been 2027-09-01 — nine months before its own year
    // had even finished its retention window.
    const fromOldTerm = addMonths(s.term_renews_on, s.retention_months);
    const fromOwnYear = purgeDateForClass(nextYear, s.retention_months)!;
    expect(fromOwnYear.getTime()).toBeGreaterThan(fromOldTerm.getTime());

    // A run in the gap between the two dates must leave it alone. This is the
    // exact window where the old behaviour would have deleted it early.
    const inTheGap = runScheduledPurge(db7, new Date("2027-10-01T00:00:00.000Z"));
    expect(inTheGap.classNames).not.toContain("Next Year");
    expect(listClasses(db7, DEMO_SCHOOL, true).some((c) => c.name === "Next Year")).toBe(true);

    // And once its own date arrives, it goes.
    expect(runScheduledPurge(db7, new Date("2029-01-01T00:00:00.000Z")).classNames).toContain(
      "Next Year",
    );
  });
});

describe("rolling over into the next school year", () => {
  it("derives the next label and refuses one it cannot parse", () => {
    expect(nextYearLabel("2025-2026")).toBe("2026-2027");
    expect(nextYearLabel("2026-2027")).toBe("2027-2028");
    // Not a consecutive pair, and not a year at all.
    expect(nextYearLabel("2025-2027")).toBeNull();
    expect(nextYearLabel("Autumn term")).toBeNull();
  });

  it("moves a date on by a year and survives 29 February", () => {
    expect(addYear("2026-06-12")).toBe("2027-06-12");
    // A leap day cannot become 1 March.
    expect(addYear("2024-02-29")).toBe("2025-02-28");
    expect(addYear("2027-02-28")).toBe("2028-02-28");
  });

  it("previews exactly what it will do, including what it will not touch", () => {
    const { db: db8, cleanup } = createTestDb();
    try {
      const school = getPrimarySchool(db8);
      const preview = previewRollover(school, listClasses(db8, DEMO_SCHOOL, true));
      expect("error" in preview).toBe(false);
      if ("error" in preview) return;

      expect(preview.fromYear).toBe("2025-2026");
      expect(preview.toYear).toBe("2026-2027");
      expect(preview.endsOn).toBe(addYear(school.year_ends_on));
      expect(preview.toArchive.length).toBeGreaterThan(0);
      // The claim that matters: existing deletion dates do not move.
      expect(preview.retentionNote).toMatch(/keeps the year-end it was created with/);
    } finally {
      cleanup();
    }
  });

  it("archives the old cohort, opens the new year and closes check-ins", () => {
    const { db: db9, cleanup } = createTestDb();
    try {
      setBenchmarkWindow(db9, DEMO_SCHOOL, "post");
      const before = listClasses(db9, DEMO_SCHOOL).map((c) => ({
        id: c.id,
        due: purgeDateForClass(c, getPrimarySchool(db9).retention_months)!.getTime(),
      }));
      expect(before.length).toBeGreaterThan(0);

      const school = getPrimarySchool(db9);
      const preview = previewRollover(school, listClasses(db9, DEMO_SCHOOL, true));
      if ("error" in preview) throw new Error(preview.error);
      for (const c of preview.toArchive) archiveClass(db9, c.id);
      setAcademicYear(db9, DEMO_SCHOOL, {
        year: preview.toYear,
        startsOn: preview.startsOn,
        endsOn: preview.endsOn,
      });
      setBenchmarkWindow(db9, DEMO_SCHOOL, "closed");

      const after = getPrimarySchool(db9);
      expect(after.academic_year).toBe("2026-2027");
      expect(after.benchmark_window).toBe("closed");
      // Subscription dates are a separate thing and must not have moved.
      expect(after.term_renews_on).toBe(school.term_renews_on);
      expect(listClasses(db9, DEMO_SCHOOL)).toHaveLength(0);

      // And no historical deletion date moved, because each class carries its
      // own snapshot.
      for (const row of before) {
        const c = listClasses(db9, DEMO_SCHOOL, true).find((x) => x.id === row.id)!;
        expect(purgeDateForClass(c, after.retention_months)!.getTime()).toBe(row.due);
      }
    } finally {
      cleanup();
    }
  });
});


/**
 * Sprint 42. The subscription was a self-editable label that nothing enforced.
 *
 * `requestPlanChangeAction` wrote `schools.plan` and `schools.licensed_students`
 * straight to the row while the form it served said "Request a quote" and
 * "records an intent" — so a school could raise its own paid entitlement by
 * typing a bigger number. And nothing read `licensed_students` back, so a school
 * could enrol past whatever it displayed. Both halves are needed: the vendor
 * owns the number, and the number has to bite.
 */
describe("licensed student places are the vendor's record and are enforced", () => {
  let dbL: Db;
  let cleanupL: () => void;
  beforeAll(() => {
    ({ db: dbL, cleanup: cleanupL } = createTestDb());
  });
  afterAll(() => cleanupL());

  const freshSchoolWith = (seats: number) => {
    const { db, cleanup } = createTestDb();
    // Start from a known roster rather than the demo school's 90.
    db.prepare("DELETE FROM students").run();
    setLicensedSeats(db, DEMO_SCHOOL, seats);
    return { db, cleanup };
  };

  it("requesting a quote records the request and changes neither plan nor seats", () => {
    const before = getPrimarySchool(dbL);
    const src = readFileSync(join(process.cwd(), "src/app/actions/admin.ts"), "utf8");
    const start = src.indexOf("export async function requestPlanChangeAction");
    const body = src.slice(start, src.indexOf("\nexport async function", start + 10));

    // The action writes an audit row and nothing else. No UPDATE of the
    // authoritative columns anywhere in it.
    expect(body).toContain('action: "plan.change_requested"');
    expect(body).not.toMatch(/UPDATE schools SET plan/);
    expect(body).not.toMatch(/licensed_students\s*=/);
    expect(body).not.toMatch(/setLicensedSeats|setPlan/);
    // And it tells the administrator the entitlement is unchanged.
    expect(body).toMatch(/still|unchanged/);

    // Simulating what the action now does leaves the row alone.
    recordAudit(dbL, {
      schoolId: DEMO_SCHOOL,
      actorLabel: "Rosa Delgado",
      action: "plan.change_requested",
      detail: "Quote requested: district, 900 licensed students. Current entitlement unchanged.",
    });
    const after = getPrimarySchool(dbL);
    expect(after.plan).toBe(before.plan);
    expect(after.licensed_students).toBe(before.licensed_students);
    expect(
      listAudit(dbL, DEMO_SCHOOL).some((a) => a.action === "plan.change_requested"),
    ).toBe(true);
  });

  it("counts students in every active class in the school against one cap", () => {
    const { db, cleanup } = freshSchoolWith(5);
    try {
      const second = createClass(db, {
        schoolId: DEMO_SCHOOL,
        teacherId: DEMO_TEACHER,
        name: "Room 99",
        grade: 3,
        schoolYear: "2025-2026",
        yearEndsOn: "2026-06-19",
      });
      createStudent(db, { classId: DEMO_CLASS, displayName: "One A." });
      createStudent(db, { classId: DEMO_CLASS, displayName: "Two B." });
      createStudent(db, { classId: second.id, displayName: "Three C." });

      // Three children, two classes, one school total.
      expect(countActiveRosterStudents(db, DEMO_SCHOOL)).toBe(3);
      expect(licenceStatus(db, DEMO_SCHOOL)).toEqual({ used: 3, licensed: 5, remaining: 2 });

      // The cap is the school's, not the class's: filling it from the other
      // class blocks this one.
      createStudent(db, { classId: second.id, displayName: "Four D." });
      createStudent(db, { classId: second.id, displayName: "Five E." });
      expect(() =>
        createStudent(db, { classId: DEMO_CLASS, displayName: "Six F." }),
      ).toThrow(LicenceExceededError);
    } finally {
      cleanup();
    }
  });

  it("allows the last licensed place and refuses the next, writing nothing", () => {
    const { db, cleanup } = freshSchoolWith(3);
    try {
      createStudent(db, { classId: DEMO_CLASS, displayName: "Aa A." });
      createStudent(db, { classId: DEMO_CLASS, displayName: "Bb B." });
      // The third seat is licensed, so it must succeed — a cap that blocks at
      // the number sold is a cap that sells one fewer than it says.
      const last = createStudent(db, { classId: DEMO_CLASS, displayName: "Cc C." });
      expect(last.id).toBeTruthy();
      expect(licenceStatus(db, DEMO_SCHOOL).remaining).toBe(0);

      let raised: unknown;
      try {
        createStudent(db, { classId: DEMO_CLASS, displayName: "Dd D." });
      } catch (error) {
        raised = error;
      }
      expect(raised).toBeInstanceOf(LicenceExceededError);
      expect((raised as LicenceExceededError).used).toBe(3);
      expect((raised as LicenceExceededError).licensed).toBe(3);

      // No row, and the roster is exactly what it was.
      expect(listStudents(db, DEMO_CLASS).map((s) => s.display_name)).toEqual([
        "Aa A.",
        "Bb B.",
        "Cc C.",
      ]);
      expect(countActiveRosterStudents(db, DEMO_SCHOOL)).toBe(3);
      // And no success audit was written for the refused enrolment.
      expect(listAudit(db, DEMO_SCHOOL).filter((a) => a.action === "roster.added")).toHaveLength(0);
    } finally {
      cleanup();
    }
  });

  it("does not charge a new year for cohorts archived for records", () => {
    const { db, cleanup } = freshSchoolWith(3);
    try {
      createStudent(db, { classId: DEMO_CLASS, displayName: "Old A." });
      createStudent(db, { classId: DEMO_CLASS, displayName: "Old B." });
      createStudent(db, { classId: DEMO_CLASS, displayName: "Old C." });
      expect(licenceStatus(db, DEMO_SCHOOL).remaining).toBe(0);

      // Last year's cohort is archived, not deleted: the school keeps it for
      // its retention period. Those desks are empty now.
      archiveClass(db, DEMO_CLASS);
      expect(countActiveRosterStudents(db, DEMO_SCHOOL)).toBe(0);
      expect(licenceStatus(db, DEMO_SCHOOL).remaining).toBe(3);

      const thisYear = createClass(db, {
        schoolId: DEMO_SCHOOL,
        teacherId: DEMO_TEACHER,
        name: "Room 100",
        grade: 4,
        schoolYear: "2026-2027",
        yearEndsOn: "2027-06-18",
      });
      // The full three places are available again, and the records survive.
      for (const n of ["New A.", "New B.", "New C."]) {
        createStudent(db, { classId: thisYear.id, displayName: n });
      }
      expect(listStudents(db, DEMO_CLASS)).toHaveLength(3);
      expect(() =>
        createStudent(db, { classId: thisYear.id, displayName: "New D." }),
      ).toThrow(LicenceExceededError);
    } finally {
      cleanup();
    }
  });

  it("refuses to enrol into an archived cohort, so archiving is not a way round the cap", () => {
    const { db, cleanup } = freshSchoolWith(2);
    try {
      createStudent(db, { classId: DEMO_CLASS, displayName: "Here A." });
      archiveClass(db, DEMO_CLASS);
      // Archived rosters do not consume seats; if they also accepted children,
      // a school could park a full class and keep enrolling.
      expect(() =>
        createStudent(db, { classId: DEMO_CLASS, displayName: "Sneak B." }),
      ).toThrow(/archived/i);
      expect(listStudents(db, DEMO_CLASS)).toHaveLength(1);
    } finally {
      cleanup();
    }
  });

  it("counts each school separately", () => {
    const { db, cleanup } = freshSchoolWith(2);
    try {
      db.prepare(
        `INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent,
           plan, licensed_students, term_starts_on, term_renews_on, academic_year,
           year_starts_on, year_ends_on, contact_name, contact_email, retention_months, created_at)
         VALUES ('sch_far','Far Elementary','far','Far District','Farville','TX','FE','denim',
           'school', 1, '2025-08-01','2026-08-01','2025-2026','2025-08-20','2026-06-19',
           'Head','head@far.demo', 12, '2025-08-01T00:00:00.000Z')`,
      ).run();
      const theirTeacher = createUser(db, {
        schoolId: "sch_far",
        role: "teacher",
        name: "Far Teacher",
        email: "far.teacher@far.demo",
        title: "Grade 2",
      });
      const theirClass = createClass(db, {
        schoolId: "sch_far",
        teacherId: theirTeacher.id,
        name: "Far Room",
        grade: 2,
        schoolYear: "2025-2026",
        yearEndsOn: "2026-06-19",
      });

      createStudent(db, { classId: DEMO_CLASS, displayName: "Ours A." });
      createStudent(db, { classId: DEMO_CLASS, displayName: "Ours B." });
      // Our school is full. Theirs is untouched by that.
      expect(licenceStatus(db, DEMO_SCHOOL).remaining).toBe(0);
      expect(licenceStatus(db, "sch_far")).toEqual({ used: 0, licensed: 1, remaining: 1 });

      createStudent(db, { classId: theirClass.id, displayName: "Theirs A." });
      expect(countActiveRosterStudents(db, DEMO_SCHOOL)).toBe(2);
      expect(countActiveRosterStudents(db, "sch_far")).toBe(1);
      // And their own cap still binds them.
      expect(() =>
        createStudent(db, { classId: theirClass.id, displayName: "Theirs B." }),
      ).toThrow(LicenceExceededError);
    } finally {
      cleanup();
    }
  });

  it("puts the check in the repository, so no action can route around it", () => {
    const repo = readFileSync(join(process.cwd(), "src/lib/repo/classroom.ts"), "utf8");
    const start = repo.indexOf("export function createStudent");
    const body = repo.slice(start, repo.indexOf("\n}", start));
    // Count and insert inside one write transaction, so two enrolments
    // arriving together cannot both read the same count and both write.
    expect(body).toContain("BEGIN IMMEDIATE");
    expect(body).toContain("licenceStatus(db, owner.school_id)");
    expect(body).toContain("LicenceExceededError");
    expect(body).toContain("ROLLBACK");

    // The teacher action catches rather than pre-checks, and names no child in
    // the school-wide audit it writes for the refusal.
    const action = readFileSync(join(process.cwd(), "src/app/actions/teacher.ts"), "utf8");
    const add = action.slice(
      action.indexOf("export async function addStudentAction"),
      action.indexOf("\n}", action.indexOf("export async function addStudentAction")),
    );
    expect(add).toContain("LicenceExceededError");
    expect(add).toContain('action: "roster.blocked_by_licence"');
    const blocked = add.slice(add.indexOf("roster.blocked_by_licence"));
    expect(blocked.slice(0, blocked.indexOf("});"))).not.toContain("displayName");
    // The teacher is told the numbers and where to go, without a child's name.
    expect(add).toMatch(/licensed student places are in use/);
    expect(add).toMatch(/contact_name/);
  });

  it("keeps the roster rules it already had", () => {
    const { db, cleanup } = freshSchoolWith(10);
    try {
      // Data minimisation is unchanged: display name and avatar, nothing else.
      const student = createStudent(db, { classId: DEMO_CLASS, displayName: "Keep K." });
      expect(Object.keys(student).sort()).toEqual(
        ["avatar_key", "class_id", "created_at", "display_name", "id"].sort(),
      );
    } finally {
      cleanup();
    }
  });
});


/**
 * Sprint 43. Sprint 42 metered enrolment and excluded archived cohorts, which
 * is right — a class kept for retention is not a class being taught. It also
 * left a door: archive a full cohort, spend the freed seats on a new one,
 * restore the old class, and the school is past its licence without a single
 * child having gone through `createStudent`. Restoration is a roster mutation
 * that does not look like one.
 */
describe("restoring an archived cohort cannot take a school past its licence", () => {
  const freshSchoolWith = (seats: number) => {
    const { db, cleanup } = createTestDb();
    db.prepare("DELETE FROM students").run();
    setLicensedSeats(db, DEMO_SCHOOL, seats);
    return { db, cleanup };
  };

  const newClass = (db: Db, name: string, grade = 3) =>
    createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name,
      grade,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-19",
    });

  it("refuses when the archived roster would not fit, and changes nothing", () => {
    const { db, cleanup } = freshSchoolWith(4);
    try {
      // Two children archived, two enrolled in their place. 2 + 2 = 4, at cap.
      createStudent(db, { classId: DEMO_CLASS, displayName: "Last A." });
      createStudent(db, { classId: DEMO_CLASS, displayName: "Last B." });
      archiveClass(db, DEMO_CLASS);
      const archivedAt = getClass(db, DEMO_CLASS)!.archived_at;
      expect(archivedAt).toBeTruthy();

      const thisYear = newClass(db, "Room 101");
      for (const n of ["New A.", "New B.", "New C.", "New D."]) {
        createStudent(db, { classId: thisYear.id, displayName: n });
      }
      expect(licenceStatus(db, DEMO_SCHOOL)).toEqual({ used: 4, licensed: 4, remaining: 0 });

      let raised: unknown;
      try {
        restoreClass(db, DEMO_CLASS);
      } catch (error) {
        raised = error;
      }
      expect(raised).toBeInstanceOf(RestoreExceedsLicenceError);
      // It still answers "the licence said no" to a caller that only asks that.
      expect(raised).toBeInstanceOf(LicenceExceededError);
      const e = raised as RestoreExceedsLicenceError;
      expect([e.used, e.roster, e.licensed]).toEqual([4, 2, 4]);

      // The class stays archived, on the same timestamp, with every record.
      expect(getClass(db, DEMO_CLASS)!.archived_at).toBe(archivedAt);
      expect(listStudents(db, DEMO_CLASS)).toHaveLength(2);
      expect(countActiveRosterStudents(db, DEMO_SCHOOL)).toBe(4);
    } finally {
      cleanup();
    }
  });

  it("allows a restore that lands exactly on the cap", () => {
    const { db, cleanup } = freshSchoolWith(4);
    try {
      createStudent(db, { classId: DEMO_CLASS, displayName: "Back A." });
      createStudent(db, { classId: DEMO_CLASS, displayName: "Back B." });
      archiveClass(db, DEMO_CLASS);

      const thisYear = newClass(db, "Room 102");
      createStudent(db, { classId: thisYear.id, displayName: "Here A." });
      createStudent(db, { classId: thisYear.id, displayName: "Here B." });

      // 2 active + 2 archived === 4 licensed. The school paid for those seats.
      restoreClass(db, DEMO_CLASS);
      expect(getClass(db, DEMO_CLASS)!.archived_at).toBeNull();
      expect(licenceStatus(db, DEMO_SCHOOL)).toEqual({ used: 4, licensed: 4, remaining: 0 });
    } finally {
      cleanup();
    }
  });

  it("allows an empty archived class back whatever the licence says", () => {
    const { db, cleanup } = freshSchoolWith(2);
    try {
      const empty = newClass(db, "Room 103");
      archiveClass(db, empty.id);
      const full = newClass(db, "Room 104");
      createStudent(db, { classId: full.id, displayName: "Full A." });
      createStudent(db, { classId: full.id, displayName: "Full B." });
      expect(licenceStatus(db, DEMO_SCHOOL).remaining).toBe(0);

      // No children, no seats, no reason to refuse.
      restoreClass(db, empty.id);
      expect(getClass(db, empty.id)!.archived_at).toBeNull();
      expect(countActiveRosterStudents(db, DEMO_SCHOOL)).toBe(2);
    } finally {
      cleanup();
    }
  });

  it("re-restoring an active class is a no-op, not an overage", () => {
    const { db, cleanup } = freshSchoolWith(2);
    try {
      createStudent(db, { classId: DEMO_CLASS, displayName: "On A." });
      createStudent(db, { classId: DEMO_CLASS, displayName: "On B." });
      // Already active: its students are counted once, and restoring again
      // must not double-count them into a refusal.
      expect(() => restoreClass(db, DEMO_CLASS)).not.toThrow();
      expect(getClass(db, DEMO_CLASS)!.archived_at).toBeNull();
    } finally {
      cleanup();
    }
  });

  it("measures each school against its own licence", () => {
    const { db, cleanup } = freshSchoolWith(1);
    try {
      db.prepare(
        `INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent,
           plan, licensed_students, term_starts_on, term_renews_on, academic_year,
           year_starts_on, year_ends_on, contact_name, contact_email, retention_months, created_at)
         VALUES ('sch_next','Next Elementary','next','Next District','Nextville','NM','NE','denim',
           'school', 9, '2025-08-01','2026-08-01','2025-2026','2025-08-20','2026-06-19',
           'Head','head@next.demo', 12, '2025-08-01T00:00:00.000Z')`,
      ).run();
      const theirTeacher = createUser(db, {
        schoolId: "sch_next",
        role: "teacher",
        name: "Next Teacher",
        email: "next.teacher@next.demo",
        title: "Grade 4",
      });
      const theirClass = createClass(db, {
        schoolId: "sch_next",
        teacherId: theirTeacher.id,
        name: "Next Room",
        grade: 4,
        schoolYear: "2025-2026",
        yearEndsOn: "2026-06-19",
      });
      for (const n of ["Th A.", "Th B.", "Th C."]) {
        createStudent(db, { classId: theirClass.id, displayName: n });
      }
      archiveClass(db, theirClass.id);

      // Our school is full at one seat. That has nothing to do with theirs.
      createStudent(db, { classId: DEMO_CLASS, displayName: "Ours A." });
      expect(licenceStatus(db, DEMO_SCHOOL).remaining).toBe(0);

      restoreClass(db, theirClass.id);
      expect(getClass(db, theirClass.id)!.archived_at).toBeNull();
      expect(countActiveRosterStudents(db, "sch_next")).toBe(3);
      expect(countActiveRosterStudents(db, DEMO_SCHOOL)).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("puts the rule in the repository, so the action cannot be the only guard", () => {
    const repo = readFileSync(join(process.cwd(), "src/lib/repo/classroom.ts"), "utf8");
    const start = repo.indexOf("export function restoreClass");
    const body = repo.slice(start, repo.indexOf("\n}", start));
    expect(body).toContain("BEGIN IMMEDIATE");
    expect(body).toContain("RestoreExceedsLicenceError");
    expect(body).toContain("ROLLBACK");
    // Exactly-on-the-cap is allowed, so the comparison is > and never >=.
    expect(body).toContain("status.used + roster > status.licensed");

    const action = readFileSync(join(process.cwd(), "src/app/actions/admin.ts"), "utf8");
    const restore = action.slice(
      action.indexOf("export async function restoreClassAction"),
      action.indexOf("\n}", action.indexOf("export async function restoreClassAction")),
    );
    expect(restore).toContain("RestoreExceedsLicenceError");
    expect(restore).toContain('action: "class.restore_blocked_by_licence"');
    // Four facts and a route out, and no child named in the audit.
    expect(restore).toMatch(/error\.roster/);
    expect(restore).toMatch(/error\.used/);
    expect(restore).toMatch(/error\.licensed/);
    expect(restore).toMatch(/contact_name/);
    expect(restore).toMatch(/stays archived/);
    const audit = restore.slice(restore.indexOf("class.restore_blocked_by_licence"));
    expect(audit.slice(0, audit.indexOf("});"))).not.toMatch(/display_name|displayName/);
    // And no success audit is written on the refused path.
    expect(restore.indexOf('action: "class.restored"')).toBeGreaterThan(
      restore.indexOf("return {"),
    );
  });

  it("leaves enrolment and retention behaviour alone", () => {
    const { db, cleanup } = freshSchoolWith(3);
    try {
      createStudent(db, { classId: DEMO_CLASS, displayName: "Keep A." });
      archiveClass(db, DEMO_CLASS);
      // Archiving still frees the seat for a new cohort, which is the sprint 42
      // behaviour this must not have broken.
      const next = newClass(db, "Room 105");
      for (const n of ["Fresh A.", "Fresh B.", "Fresh C."]) {
        createStudent(db, { classId: next.id, displayName: n });
      }
      expect(licenceStatus(db, DEMO_SCHOOL)).toEqual({ used: 3, licensed: 3, remaining: 0 });
      // The archived records are still there to be retained, and restoring is
      // refused rather than deleting them.
      expect(listStudents(db, DEMO_CLASS)).toHaveLength(1);
      expect(() => restoreClass(db, DEMO_CLASS)).toThrow(RestoreExceedsLicenceError);
      expect(listStudents(db, DEMO_CLASS)).toHaveLength(1);
    } finally {
      cleanup();
    }
  });
});


/**
 * Sprint 52. The public page sells "Single classroom · $390 / year · Up to 30
 * students", and only the thirty was enforced. A school on the classroom plan
 * could create any number of classes, split its thirty children across them,
 * archive one and create another, and restore archived cohorts freely — so the
 * product sold one classroom and licensed thirty students, which are different
 * things. A buyer could not tell what $390 bought and the vendor gave away the
 * difference.
 */
describe("the classroom plan includes one active classroom", () => {
  const onClassroomPlan = (seats = 30) => {
    const { db, cleanup } = createTestDb();
    db.prepare("DELETE FROM students").run();
    db.prepare("DELETE FROM classes").run();
    db.prepare("UPDATE schools SET plan = 'classroom', licensed_students = ? WHERE id = ?").run(
      seats,
      DEMO_SCHOOL,
    );
    return { db, cleanup };
  };

  const makeClass = (db: Db, name: string) =>
    createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name,
      grade: 3,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-19",
    });

  it("allows the first active class and refuses the second, writing nothing", () => {
    const { db, cleanup } = onClassroomPlan();
    try {
      const first = makeClass(db, "Room A");
      expect(first.id).toBeTruthy();
      expect(classroomAllowance(db, DEMO_SCHOOL)).toEqual({
        active: 1,
        limit: 1,
        plan: "classroom",
      });

      const before = listClasses(db, DEMO_SCHOOL, true).length;
      let raised: unknown;
      try {
        makeClass(db, "Room B");
      } catch (error) {
        raised = error;
      }
      expect(raised).toBeInstanceOf(ClassroomLimitError);
      expect((raised as ClassroomLimitError).active).toBe(1);
      expect((raised as ClassroomLimitError).limit).toBe(1);
      // No class row at all, not even an archived one.
      expect(listClasses(db, DEMO_SCHOOL, true)).toHaveLength(before);
      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("frees the slot when a class is archived, and keeps its records", () => {
    const { db, cleanup } = onClassroomPlan();
    try {
      const first = makeClass(db, "Room A");
      createStudent(db, { classId: first.id, displayName: "Kept K." });
      archiveClass(db, first.id);

      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(0);
      const second = makeClass(db, "Room B");
      expect(second.id).toBeTruthy();
      // The archived cohort is untouched: kept for records, not consuming the
      // room, exactly as archived classes do not consume seats.
      expect(listStudents(db, first.id)).toHaveLength(1);
      expect(getClass(db, first.id)!.archived_at).toBeTruthy();
    } finally {
      cleanup();
    }
  });

  it("refuses a restore while another class is active, touching nothing", () => {
    const { db, cleanup } = onClassroomPlan();
    try {
      const old = makeClass(db, "Room A");
      createStudent(db, { classId: old.id, displayName: "Old O." });
      archiveClass(db, old.id);
      const archivedAt = getClass(db, old.id)!.archived_at;
      const current = makeClass(db, "Room B");
      createStudent(db, { classId: current.id, displayName: "New N." });

      let raised: unknown;
      try {
        restoreClass(db, old.id);
      } catch (error) {
        raised = error;
      }
      expect(raised).toBeInstanceOf(ClassroomLimitError);

      // Still archived, on the same timestamp, with its records.
      expect(getClass(db, old.id)!.archived_at).toBe(archivedAt);
      expect(listStudents(db, old.id)).toHaveLength(1);
      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("allows the restore once the slot is free", () => {
    const { db, cleanup } = onClassroomPlan();
    try {
      const old = makeClass(db, "Room A");
      archiveClass(db, old.id);
      const current = makeClass(db, "Room B");
      expect(() => restoreClass(db, old.id)).toThrow(ClassroomLimitError);

      archiveClass(db, current.id);
      restoreClass(db, old.id);
      expect(getClass(db, old.id)!.archived_at).toBeNull();
      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("treats restoring an already-active class as a no-op", () => {
    const { db, cleanup } = onClassroomPlan();
    try {
      const only = makeClass(db, "Room A");
      // It is already the one active class; restoring it must not count it
      // twice and refuse a class that changes nothing.
      expect(() => restoreClass(db, only.id)).not.toThrow();
      expect(getClass(db, only.id)!.archived_at).toBeNull();
      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("leaves school and district plans alone", () => {
    for (const plan of ["school", "district"]) {
      const { db, cleanup } = onClassroomPlan();
      try {
        db.prepare("UPDATE schools SET plan = ? WHERE id = ?").run(plan, DEMO_SCHOOL);
        for (const name of ["Room A", "Room B", "Room C"]) makeClass(db, name);
        expect(countActiveClasses(db, DEMO_SCHOOL), plan).toBe(3);
        expect(classroomAllowance(db, DEMO_SCHOOL).limit, plan).toBeNull();
      } finally {
        cleanup();
      }
    }
  });

  it("never picks, archives or deletes a class when a school is already over", () => {
    const { db, cleanup } = onClassroomPlan();
    try {
      // A database from before this rule, or after a downgrade: three active
      // classes on a one-room plan. Nothing may be taken away to fix it.
      db.prepare("UPDATE schools SET plan = 'school' WHERE id = ?").run(DEMO_SCHOOL);
      const ids = ["Room A", "Room B", "Room C"].map((n) => makeClass(db, n).id);
      db.prepare("UPDATE schools SET plan = 'classroom' WHERE id = ?").run(DEMO_SCHOOL);

      expect(classroomAllowance(db, DEMO_SCHOOL)).toEqual({
        active: 3,
        limit: 1,
        plan: "classroom",
      });
      // Read-only from here: the next class is refused, and all three survive.
      expect(() => makeClass(db, "Room D")).toThrow(ClassroomLimitError);
      for (const id of ids) {
        expect(getClass(db, id)!.archived_at).toBeNull();
      }
      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(3);
    } finally {
      cleanup();
    }
  });

  it("cannot be oversubscribed by two repository paths racing", () => {
    const { db, cleanup } = onClassroomPlan();
    try {
      const parked = makeClass(db, "Room A");
      archiveClass(db, parked.id);
      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(0);

      // The two ways to take the slot, back to back. Whichever wins, the other
      // must be refused: the check and the write share one transaction, so a
      // count read before the first write cannot survive into the second.
      restoreClass(db, parked.id);
      expect(() => makeClass(db, "Room B")).toThrow(ClassroomLimitError);
      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(1);

      // And the other order.
      archiveClass(db, parked.id);
      const fresh = makeClass(db, "Room C");
      expect(() => restoreClass(db, parked.id)).toThrow(ClassroomLimitError);
      expect(countActiveClasses(db, DEMO_SCHOOL)).toBe(1);
      expect(getClass(db, fresh.id)!.archived_at).toBeNull();
    } finally {
      cleanup();
    }
  });

  it("does the counting and the writing inside one transaction", () => {
    const repo = readFileSync(join(process.cwd(), "src/lib/repo/classroom.ts"), "utf8");
    for (const fn of ["createClass", "restoreClass"]) {
      const start = repo.indexOf(`export function ${fn}(`);
      const body = repo.slice(start, repo.indexOf("\n}", start));
      expect(body, fn).toContain("assertRoomForActiveClass");
      expect(body, fn).toContain("BEGIN IMMEDIATE");
      expect(body, fn).toContain("ROLLBACK");
    }
  });

  it("says what was refused without naming a child, and points somewhere useful", () => {
    const message = classroomLimitRefusal(new ClassroomLimitError("classroom", 1, 1), "create");
    expect(message).toMatch(/Single classroom plan includes one active class/);
    expect(message).toMatch(/Nothing has been changed/);
    expect(message).toMatch(/archived class and all of its records are still here/);
    expect(message).toMatch(/Program and plan page/);

    const admin = readFileSync(join(process.cwd(), "src/app/actions/admin.ts"), "utf8");
    const teacher = readFileSync(join(process.cwd(), "src/app/actions/teacher.ts"), "utf8");
    // Configuration facts only in the audit, and no success audit on refusal.
    for (const [src, blockedAction, successAction] of [
      [admin, "class.restore_blocked_by_plan", "class.restored"],
      [teacher, "class.blocked_by_plan", "class.created"],
    ] as const) {
      const at = src.indexOf(blockedAction);
      expect(at, blockedAction).toBeGreaterThan(-1);
      const entry = src.slice(at, src.indexOf("});", at));
      expect(entry).not.toMatch(/display_name|displayName|listStudents/);
      expect(entry).not.toContain(successAction);
    }
  });

  it("keeps the public wording and the enforced limit from drifting apart", () => {
    // The words a school buys on, and the number the code enforces, in one
    // assertion. If either moves without the other, this fails.
    const publicPlans = readFileSync(
      join(process.cwd(), "src/app/(site)/plans/page.tsx"),
      "utf8",
    );
    const selector = readFileSync(
      join(process.cwd(), "src/app/admin/program/PlanForm.tsx"),
      "utf8",
    );

    expect(publicPlans).toContain('name: "Single classroom"');
    expect(publicPlans).toMatch(/unit: "per classroom, per year"/);
    expect(selector).toContain("Single classroom · $390 / year");

    expect(ACTIVE_CLASS_LIMIT.classroom).toBe(1);
    // Sold per school and per district, so rooms are not what they are priced
    // on. `null` and not a large number, so the intent is legible.
    expect(ACTIVE_CLASS_LIMIT.school).toBeNull();
    expect(ACTIVE_CLASS_LIMIT.district).toBeNull();
    // Every plan the selector offers has a decision recorded here.
    for (const plan of ["classroom", "school", "district"]) {
      expect(Object.hasOwn(ACTIVE_CLASS_LIMIT, plan), plan).toBe(true);
    }
  });
});
