import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_ADMIN, DEMO_CLASS, DEMO_SCHOOL } from "./helpers";
import {
  archiveClass,
  createClass,
  createStudent,
  deleteClass,
  listClasses,
  listStudents,
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
  listAttemptsForSchool,
  listBenchmarksForSchool,
  listBenchmarksForClass,
} from "@/lib/repo/progress";
import { buildSchoolReport, MIN_REPORTABLE_GROUP, reportToCsv } from "@/lib/repo/report";
import { summariseCohortBenchmark } from "@/lib/domain/benchmark";
import { addMonths, formatDate, purgeDateFor, retentionRows } from "@/lib/domain/retention";

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
    expect(report.missions).toHaveLength(9);
    expect(report.byGrade.map((g) => g.grade)).toEqual([2, 3, 4]);
  });

  it("reports pre and post benchmark growth from matched students only", () => {
    const bench = summariseCohortBenchmark(listBenchmarksForSchool(db, DEMO_SCHOOL));
    expect(bench.preCompleted).toBe(90);
    expect(bench.postCompleted).toBeGreaterThan(0);
    expect(bench.matched).toBe(bench.postCompleted);
    expect(bench.growthPoints).not.toBeNull();
    // The seed models instruction working, so spring should beat fall.
    expect(bench.growthPoints!).toBeGreaterThan(0);
  });

  it("returns null growth, not a fake zero, before the spring window runs", () => {
    const room4 = listClasses(db, DEMO_SCHOOL).find((c) => c.name === "Room 4")!;
    const bench = summariseCohortBenchmark(listBenchmarksForClass(db, room4.id));
    expect(bench.postCompleted).toBe(0);
    expect(bench.growthPoints).toBeNull();
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
