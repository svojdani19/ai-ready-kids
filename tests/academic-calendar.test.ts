import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import {
  ACADEMIC_PROBLEM_MESSAGE,
  academicProblem,
  academicYearBounds,
  hasVerifiableAcademicDates,
  isAcademicYearLabel,
  isCalendarDate,
} from "@/lib/domain/calendar";
import { addYearOrNull, previewRollover } from "@/lib/domain/rollover";
import { purgeDateFor, purgeDateForClass, retentionRows } from "@/lib/domain/retention";
import { runScheduledPurge } from "@/lib/domain/purge";
import { createClass, getClass, listClasses } from "@/lib/repo/classroom";
import { getPrimarySchool, setAcademicDates } from "@/lib/repo/school";
import { buildSchoolReport, reportToCsv } from "@/lib/repo/report";

/**
 * Sprint 60. `setAcademicDatesAction` checked only the regex shape, so
 * "2026-13-45" and "2026-02-30" were saved to the school AND backfilled into
 * every class in that year. The ordering guard passed too: comparing two
 * Invalid Dates gives NaN, and every comparison against NaN is false.
 *
 * Downstream, three separate failures. `addYear` threw RangeError and took the
 * Program page - the only place these can be corrected - down with it.
 * `purgeDateForClass` returned an Invalid Date, so a cohort read as *having* a
 * deletion date while the purge job compared NaN <= now, found it false, and
 * exited saying nothing was due: a child's records retained indefinitely behind
 * a screen showing "Invalid Date". And correcting the school only repaired
 * cohorts whose date was exactly "", so a malformed snapshot had no recovery
 * path at all.
 */

const MALFORMED_DATES = [
  "",
  " ",
  "2026-13-45",
  "2026-02-30",
  "2026-9-1",
  " 2026-06-12",
  "2026-06-12 ",
  "2026-06-12T00:00:00.000Z",
  "26-06-12",
  "2026/06/12",
  "soon",
];
const NON_STRINGS = [null, undefined, 20260612, {}, []];
const NOW = new Date("2027-08-28T00:00:00.000Z");

describe("one rule for a real day and a real school year", () => {
  it("accepts only exact, round-tripping calendar days", () => {
    for (const value of ["2026-06-12", "2024-02-29", "2000-02-29"]) {
      expect(isCalendarDate(value), value).toBe(true);
    }
    expect(isCalendarDate("2026-02-29")).toBe(false);
    for (const value of [...MALFORMED_DATES, ...NON_STRINGS]) {
      expect(isCalendarDate(value), JSON.stringify(value)).toBe(false);
    }
  });

  it("requires two consecutive years in the label", () => {
    expect(academicYearBounds("2025-2026")).toEqual({ first: 2025, second: 2026 });
    for (const label of ["2025-2027", "2026-2025", "2025-2025", "25-26", "2025", ""]) {
      expect(isAcademicYearLabel(label), label).toBe(false);
    }
    for (const label of NON_STRINGS) {
      expect(isAcademicYearLabel(label), JSON.stringify(label)).toBe(false);
    }
  });

  it("names the exact problem, and never quotes the stored value", () => {
    expect(academicProblem({ year: "2025-2027", startsOn: "2025-08-25", endsOn: "2026-06-12" })).toBe("label");
    expect(academicProblem({ year: "2025-2026", startsOn: "2026-13-45", endsOn: "2026-06-12" })).toBe("start-date");
    expect(academicProblem({ year: "2025-2026", startsOn: "2025-08-25", endsOn: "2026-02-30" })).toBe("end-date");
    expect(academicProblem({ year: "2025-2026", startsOn: "2026-06-12", endsOn: "2025-08-25" })).toBe("order");
    expect(academicProblem({ year: "2025-2026", startsOn: "2026-06-12", endsOn: "2026-06-12" })).toBe("order");
    expect(academicProblem({ year: "2025-2026", startsOn: "2019-08-25", endsOn: "2031-06-12" })).toBe("span");
    expect(academicProblem({ year: "2023-2024", startsOn: "2023-08-25", endsOn: "2024-02-29" })).toBeNull();

    for (const message of Object.values(ACADEMIC_PROBLEM_MESSAGE)) {
      expect(message).not.toMatch(/2026-13-45|2025-2027|undefined|NaN/);
    }
  });

  it("does not coerce a nearly-right value into a right one", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/domain/calendar.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1");
    expect(src).not.toMatch(/\.trim\(\)/);
    expect(src).not.toMatch(/Date\.parse/);
  });
});

describe("nothing downstream throws, calculates or exports from a bad calendar", () => {
  const school = (over: Record<string, string>) =>
    ({
      id: DEMO_SCHOOL,
      academic_year: "2025-2026",
      year_starts_on: "2025-08-25",
      year_ends_on: "2026-06-12",
      retention_months: 12,
      ...over,
    }) as never;

  it("rolls over without throwing, whatever is stored", () => {
    for (const value of MALFORMED_DATES) {
      const result = previewRollover(school({ year_ends_on: value }), []);
      expect(result, value).toHaveProperty("error");
      expect((result as { error: string }).error, value).toMatch(/Academic dates need configuration/);
    }
    expect(previewRollover(school({ academic_year: "2025-2027" }), [])).toHaveProperty("error");
    expect(previewRollover(school({}), [])).not.toHaveProperty("error");
    expect(addYearOrNull("2026-13-45")).toBeNull();
    expect(addYearOrNull("2024-02-29")).toBe("2025-02-28");
  });

  it("returns null rather than an Invalid Date for retention", () => {
    for (const value of MALFORMED_DATES) {
      expect(purgeDateFor(school({ year_ends_on: value })), value).toBeNull();
      expect(purgeDateForClass({ year_ends_on: value }, 12), value).toBeNull();
    }
    const valid = purgeDateForClass({ year_ends_on: "2026-06-12" }, 12);
    expect(valid).toBeInstanceOf(Date);
    expect(Number.isNaN(valid!.getTime())).toBe(false);
  });

  it("tells a missing year end apart from a malformed one", () => {
    const classes = [
      { id: "a", name: "A", grade: 3, school_year: "2025-2026", year_ends_on: "", archived_at: null, studentCount: 1 },
      { id: "b", name: "B", grade: 3, school_year: "2025-2026", year_ends_on: "2026-13-45", archived_at: null, studentCount: 1 },
      { id: "c", name: "C", grade: 3, school_year: "2025-2026", year_ends_on: "2026-06-12", archived_at: null, studentCount: 1 },
    ] as never;
    const rows = retentionRows(school({}), classes, NOW);
    expect(rows.map((r) => r.blockedReason)).toEqual(["no-year-end", "malformed-year-end", null]);
    expect(rows[1].purgeOn).toBeNull();
    expect(rows[1].eligibleNow).toBe(false);
    expect(rows[2].purgeOn).toBeInstanceOf(Date);
  });


  /**
   * Sprint 64. The Data page has two blocking branches and they are not the
   * same kind of block.
   *
   * An unrecognised retention **window** makes `runScheduledPurge` skip the
   * whole school (sprint 54), so "nothing is deleted automatically" is true
   * there. An unusable academic **date** only costs the school-level summary
   * figure: every cohort still carries its own snapshotted year-end, and the
   * purge keeps acting on the valid ones.
   *
   * The academic branch was carrying the global claim sprint 63 removed from
   * the Program page — and sprint 63 recorded it as one of the branches that
   * were correct, which was wrong.
   */
  it("scopes the academic-date hint without touching the policy one", () => {
    const page = readFileSync(join(process.cwd(), "src/app/admin/data/page.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1");

    // The academic-date branch: scoped, and no longer globally false.
    expect(page).toMatch(/This year's date is unavailable until the academic dates are set/);
    expect(page).toMatch(/valid recorded year-end still follow their own deletion dates/);
    expect(page).toMatch(/without one is not deleted automatically/);
    expect(page).not.toMatch(/Set the academic dates on Program & plan\. Nothing is deleted until you do\./);

    // The policy branch is deliberately global and must survive untouched:
    // sprint 54 makes the purge skip the entire school for that one.
    expect(page).toMatch(
      /Nothing is deleted automatically while the retention window needs configuration\./,
    );
  });

  it("keeps the summary and the row copy agreeing about a malformed year end", () => {
    const school = {
      academic_year: "2025-2026",
      year_starts_on: "2025-08-25",
      year_ends_on: "2026-13-45",
      retention_months: 12,
    } as never;
    const classes = [
      { id: "ok", name: "Fine", grade: 3, school_year: "2025-2026", year_ends_on: "2026-06-12", archived_at: null, studentCount: 1 },
      { id: "bad", name: "Broken", grade: 3, school_year: "2025-2026", year_ends_on: "2026-13-45", archived_at: null, studentCount: 1 },
    ] as never;

    // The school summary has no date to show...
    expect(purgeDateFor(school)).toBeNull();
    // ...while a cohort with its own valid snapshot still has one, which is
    // exactly why the summary must not claim nothing is deleted.
    const rows = retentionRows(school, classes, NOW);
    expect(rows[0].purgeOn).toBeInstanceOf(Date);
    expect(rows[0].blockedReason).toBeNull();
    expect(rows[1].purgeOn).toBeNull();
    expect(rows[1].blockedReason).toBe("malformed-year-end");
  });

  it("never exports a malformed academic year as a reporting period", () => {
    const { db, cleanup } = createTestDb();
    try {
      db.prepare("UPDATE schools SET academic_year = '2025-2027' WHERE id = ?").run(DEMO_SCHOOL);
      const report = buildSchoolReport(db, DEMO_SCHOOL, NOW);
      expect(report.school.schoolYear).toBe("Needs configuration");
      expect(JSON.stringify(report)).not.toContain("2025-2027");
      expect(reportToCsv(report)).not.toContain("2025-2027");
      db.prepare("UPDATE schools SET academic_year = '2025-2026' WHERE id = ?").run(DEMO_SCHOOL);
      expect(buildSchoolReport(db, DEMO_SCHOOL, NOW).school.schoolYear).toBe("2025-2026");
    } finally {
      cleanup();
    }
  });
});

describe("the purge job blocks on a malformed cohort instead of skipping it", () => {
  let db: Db;
  let cleanup: () => void;

  const counts = () => ({
    classes: (db.prepare("SELECT COUNT(*) AS n FROM classes").get() as { n: number }).n,
  });

  beforeAll(() => {
    ({ db, cleanup } = createTestDb());
    db.prepare("UPDATE schools SET retention_months = 3, year_ends_on = '2020-06-19' WHERE id = ?").run(DEMO_SCHOOL);
    db.prepare("UPDATE classes SET year_ends_on = '2020-06-19' WHERE school_id = ?").run(DEMO_SCHOOL);
    db.prepare("UPDATE classes SET year_ends_on = '2020-13-45' WHERE id = ?").run(DEMO_CLASS);
  });
  afterAll(() => cleanup());

  it("deletes the valid cohorts and refuses the malformed one", () => {
    const before = counts();
    const result = runScheduledPurge(db, NOW);

    expect(result.classesDeleted).toBeGreaterThan(0);
    expect(getClass(db, DEMO_CLASS)).toBeDefined();
    expect(getClass(db, DEMO_CLASS)!.year_ends_on).toBe("2020-13-45");
    expect(counts().classes).toBeLessThan(before.classes);

    expect(result.blockedCohorts).toEqual([
      { schoolId: DEMO_SCHOOL, schoolName: "Brightwood Elementary School", cohorts: 1 },
    ]);
    const report = JSON.stringify(result.blockedCohorts);
    expect(report).not.toContain("2020-13-45");
    expect(report).not.toContain("Room 12");
    expect(report).not.toMatch(/Zaynab|Aisha/);
  });

  it("cannot look successful above a block", () => {
    const cli = readFileSync(join(process.cwd(), "scripts/purge.ts"), "utf8");
    expect(cli).toContain("const anyBlock = blockedSchools + blockedCohortSchools > 0");
    expect(cli).toMatch(/classesDeleted === 0 && anyBlock/);
    expect(cli).toMatch(/if \(anyBlock\) \{[\s\S]{0,200}process\.exitCode = 1/);
    const cohortBlock = cli.slice(cli.indexOf("result.blockedCohorts.length > 0"));
    expect(cohortBlock).not.toMatch(/className|year_ends_on/);
  });
});

describe("an administrator can always recover, and only what is broken is repaired", () => {
  let db: Db;
  let cleanup: () => void;

  beforeAll(() => {
    ({ db, cleanup } = createTestDb());
  });
  afterAll(() => cleanup());

  it("repairs empty and malformed cohorts in that year, and nothing else", () => {
    const mk = (name: string, year: string, endsOn: string) =>
      createClass(db, {
        schoolId: DEMO_SCHOOL,
        teacherId: DEMO_TEACHER,
        name,
        grade: 3,
        schoolYear: year,
        yearEndsOn: endsOn,
      }).id;
    db.prepare("DELETE FROM classes").run();
    const empty = mk("Empty", "2025-2026", "");
    const malformed = mk("Malformed", "2025-2026", "2026-13-45");
    const valid = mk("Valid", "2025-2026", "2026-06-30");
    const otherYear = mk("Other", "2024-2025", "");

    // The school already calls this year 2025-2026, so nothing is relabelled.
    db.prepare("UPDATE schools SET academic_year = '2025-2026' WHERE id = ?").run(DEMO_SCHOOL);
    const repaired = setAcademicDates(db, DEMO_SCHOOL, {
      year: "2025-2026",
      startsOn: "2025-08-25",
      endsOn: "2026-06-12",
    });

    expect(repaired).toEqual({ relabelled: 0, datesRepaired: 2 });
    expect(getClass(db, empty)!.year_ends_on).toBe("2026-06-12");
    expect(getClass(db, malformed)!.year_ends_on).toBe("2026-06-12");
    expect(getClass(db, valid)!.year_ends_on).toBe("2026-06-30");
    expect(getClass(db, otherYear)!.year_ends_on).toBe("");
  });

  it("restores normal rollover and retention immediately", () => {
    db.prepare(
      "UPDATE schools SET academic_year = '2025-2026', year_starts_on = '2026-13-45', year_ends_on = '2026-06-12' WHERE id = ?",
    ).run(DEMO_SCHOOL);
    expect(hasVerifiableAcademicDates(getPrimarySchool(db))).toBe(false);
    expect(previewRollover(getPrimarySchool(db), [])).toHaveProperty("error");

    setAcademicDates(db, DEMO_SCHOOL, {
      year: "2025-2026",
      startsOn: "2025-08-25",
      endsOn: "2026-06-12",
    });
    const school = getPrimarySchool(db);
    expect(hasVerifiableAcademicDates(school)).toBe(true);
    expect(previewRollover(school, listClasses(db, DEMO_SCHOOL, true))).not.toHaveProperty("error");
    expect(purgeDateFor(school)).toBeInstanceOf(Date);
  });

  it("validates before any write, and stays available while other writes pause", () => {
    const action = readFileSync(join(process.cwd(), "src/app/actions/admin.ts"), "utf8");
    const start = action.indexOf("export async function setAcademicDatesAction");
    const body = action.slice(start, action.indexOf("\nexport ", start + 10));
    expect(body).toContain("academicProblem({ year, startsOn, endsOn })");
    expect(body.indexOf("academicProblem")).toBeLessThan(body.indexOf("setAcademicDates("));
    expect(body.indexOf("academicProblem")).toBeLessThan(body.indexOf("recordAudit"));
    expect(body).not.toContain("assertSubscriptionActive");
    expect(body).not.toContain("lapsedRefusal");
    expect(body).not.toMatch(/new Date\(endsOn\)\.getTime\(\)/);
  });

  it("refuses a new class before writing anything when the calendar is unreadable", () => {
    const teacher = readFileSync(join(process.cwd(), "src/app/actions/teacher.ts"), "utf8");
    const start = teacher.indexOf("export async function createClassAction");
    const body = teacher.slice(start, teacher.indexOf("\nexport ", start + 10));
    expect(body).toContain("hasVerifiableAcademicDates(school)");
    expect(body.indexOf("hasVerifiableAcademicDates")).toBeLessThan(body.indexOf("createClass("));
    expect(body.indexOf("hasVerifiableAcademicDates")).toBeLessThan(body.indexOf("recordAudit"));
    expect(body).toMatch(/existing classes and student work are unaffected/);
  });


  /**
   * Sprint 61. The repair matched only `school_year = <the new label>`, which
   * misses the exact legacy state sprint 60 exists to fix.
   *
   * A class created while the school said "2025-2027" copied **that** label
   * along with the broken date. `setAcademicDates` updated the school first and
   * then looked for classes labelled "2025-2026" — so the affected cohort stayed
   * under "2025-2027" with an unreadable date. Data still said Blocked, the
   * purge still exited 1, and there was no correction path from anywhere. The
   * sprint claimed a recovery path it did not have.
   */
  it("recovers a cohort that copied the school's unreadable label", () => {
    db.prepare("DELETE FROM classes").run();
    db.prepare(
      "UPDATE schools SET academic_year = '2025-2027', year_starts_on = '2026-13-45', year_ends_on = '2026-13-45' WHERE id = ?",
    ).run(DEMO_SCHOOL);

    const mk = (name: string, year: string, endsOn: string) =>
      createClass(db, {
        schoolId: DEMO_SCHOOL,
        teacherId: DEMO_TEACHER,
        name,
        grade: 3,
        schoolYear: year,
        yearEndsOn: endsOn,
      }).id;

    // The legacy cohort: it copied the broken label and the broken date.
    const stranded = mk("Stranded", "2025-2027", "2026-13-45");
    // A control under the same broken label but with a usable date: relabelled,
    // date kept, because a valid snapshot records when that year really ended.
    const datedOk = mk("Dated", "2025-2027", "2026-06-30");
    // And a real historical year, which is history and is never rewritten.
    const history = mk("History", "2024-2025", "2025-06-20");

    const repair = setAcademicDates(db, DEMO_SCHOOL, {
      year: "2025-2026",
      startsOn: "2025-08-25",
      endsOn: "2026-06-12",
    });

    expect(repair).toEqual({ relabelled: 2, datesRepaired: 1 });
    expect(getClass(db, stranded)!.school_year).toBe("2025-2026");
    expect(getClass(db, stranded)!.year_ends_on).toBe("2026-06-12");
    expect(getClass(db, datedOk)!.school_year).toBe("2025-2026");
    expect(getClass(db, datedOk)!.year_ends_on).toBe("2026-06-30");
    expect(getClass(db, history)!.school_year).toBe("2024-2025");
    expect(getClass(db, history)!.year_ends_on).toBe("2025-06-20");

    // Data and retention unblock, rollover returns.
    const school = getPrimarySchool(db);
    const classes = listClasses(db, DEMO_SCHOOL, true).map((c) => ({
      ...c,
      studentCount: 0,
    }));
    const rows = retentionRows(school, classes, NOW);
    expect(rows.every((r) => r.blockedReason === null)).toBe(true);
    expect(rows.every((r) => r.purgeOn instanceof Date)).toBe(true);
    expect(hasVerifiableAcademicDates(school)).toBe(true);
    expect(previewRollover(school, listClasses(db, DEMO_SCHOOL, true))).not.toHaveProperty("error");

    // And the purge no longer reports that cohort as malformed.
    const result = runScheduledPurge(db, new Date("2026-06-13T00:00:00.000Z"));
    expect(result.blockedCohorts).toEqual([]);
  });

  it("never rewrites a previous label that was a real school year", () => {
    db.prepare("DELETE FROM classes").run();
    db.prepare(
      "UPDATE schools SET academic_year = '2024-2025', year_starts_on = '2024-08-25', year_ends_on = '2025-06-20' WHERE id = ?",
    ).run(DEMO_SCHOOL);
    const lastYear = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Last year",
      grade: 3,
      schoolYear: "2024-2025",
      yearEndsOn: "",
    }).id;

    // Rolling the school forward normally: the old label was perfectly good, so
    // last year's cohort stays in last year even though its date is empty.
    const repair = setAcademicDates(db, DEMO_SCHOOL, {
      year: "2025-2026",
      startsOn: "2025-08-25",
      endsOn: "2026-06-12",
    });
    expect(repair).toEqual({ relabelled: 0, datesRepaired: 0 });
    expect(getClass(db, lastYear)!.school_year).toBe("2024-2025");
    expect(getClass(db, lastYear)!.year_ends_on).toBe("");
  });

  it("says honestly how much was repaired", () => {
    const action = readFileSync(join(process.cwd(), "src/app/actions/admin.ts"), "utf8");
    const start = action.indexOf("export async function setAcademicDatesAction");
    const body = action.slice(start, action.indexOf("\nexport ", start + 10));
    // Two facts, reported separately: one number for two different things
    // would be checkable as neither.
    expect(body).toMatch(/repair\.relabelled/);
    expect(body).toMatch(/repair\.datesRepaired/);
    expect(body).toMatch(/moved onto \$\{year\} from a school year that could not be read/);
    expect(body).toMatch(/given a usable deletion date/);
    expect(body).toMatch(/Classes with a valid deletion date kept it/);
    expect(body).toMatch(/other school years were not touched/);
  });
});
