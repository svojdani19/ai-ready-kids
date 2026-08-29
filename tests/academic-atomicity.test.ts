import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

/** The cookie jar a Server Action gets from `next/headers`. */
const jar = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    api: {
      get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
      set: (name: string, value: string) => {
        store.set(name, value);
      },
      delete: (name: string) => {
        store.delete(name);
      },
    },
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => jar.api,
  headers: async () => new Map(),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import { createTestDb, DEMO_ADMIN, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import type { Db } from "@/lib/db";
import { setAcademicDatesAction } from "@/app/actions/admin";
import { writeSession } from "@/lib/auth/session";
import { setAcademicDates, listAudit } from "@/lib/repo/school";
import { ACADEMIC_DATES_FAILED } from "@/lib/repo/audited";

let db: Db;
let cleanup: () => void;

/** Ids used across the fixture. */
const BROKEN_A = "cls_broken_a";
const BROKEN_B = "cls_broken_b";
const VALID_SAME_LABEL = "cls_valid_same";
const HISTORY = "cls_history";
const OTHER_SCHOOL_CLASS = "cls_other_school";

const NEW_YEAR = "2026-2027";
const NEW_START = "2026-08-25";
const NEW_END = "2027-06-12";

/**
 * A school whose calendar is unreadable, with two genuine repair candidates and
 * three controls.
 *
 * The candidates carry the school's own broken label, which is the only way
 * such a cohort can exist: class creation copies whatever the school says.
 */
function buildFixture(): void {
  // The school's stored calendar is not a readable year.
  db.prepare(
    "UPDATE schools SET academic_year = '2025-2027', year_starts_on = '', year_ends_on = '2026-13-45' WHERE id = ?",
  ).run(DEMO_SCHOOL);

  const insert = db.prepare(
    `INSERT INTO classes (id, school_id, teacher_id, name, grade, join_code, school_year, year_ends_on, created_at, archived_at)
     VALUES (?,?,?,?,?,?,?,?,?,NULL)`,
  );
  // Two repair candidates: broken label AND unreadable date.
  insert.run(BROKEN_A, DEMO_SCHOOL, DEMO_TEACHER, "Broken A", 3, "AAA-BBB-101", "2025-2027", "", "2025-08-01");
  insert.run(BROKEN_B, DEMO_SCHOOL, DEMO_TEACHER, "Broken B", 4, "AAA-BBB-102", "2025-2027", "2026-13-45", "2025-08-01");
  // Control: same broken label, but a date that is a real day and must not move.
  insert.run(VALID_SAME_LABEL, DEMO_SCHOOL, DEMO_TEACHER, "Valid Same", 2, "AAA-BBB-103", "2025-2027", "2026-06-30", "2025-08-01");
  // Control: a true historical year, never rewritten.
  insert.run(HISTORY, DEMO_SCHOOL, DEMO_TEACHER, "History", 3, "AAA-BBB-104", "2024-2025", "", "2024-08-01");

  // Control: another school entirely.
  db.prepare(
    `INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent, plan,
      licensed_students, term_starts_on, term_renews_on, academic_year, year_starts_on, year_ends_on,
      contact_name, contact_email, retention_months, benchmark_window, created_at)
     VALUES ('sch_other','Other','other','D','C','ST','OT','pine','school',500,'2025-08-18','2026-09-01',
             '2025-2027','','2026-13-45','C','c@x.demo',12,'closed','2025-07-01')`,
  ).run();
  db.prepare(
    "INSERT INTO users (id, school_id, role, name, email, title, created_at) VALUES ('usr_other','sch_other','teacher','T','t@other.demo','T','2025-07-01')",
  ).run();
  insert.run(OTHER_SCHOOL_CLASS, "sch_other", "usr_other", "Other Room", 3, "AAA-BBB-105", "2025-2027", "", "2025-08-01");
}

function snapshot() {
  const dump = (sql: string) => JSON.stringify(db.prepare(sql).all());
  return {
    schools: dump("SELECT * FROM schools ORDER BY id"),
    classes: dump("SELECT * FROM classes ORDER BY id"),
    audit: dump("SELECT action, detail FROM audit_log ORDER BY created_at, id"),
    students: dump("SELECT * FROM students ORDER BY id"),
    attempts: dump("SELECT * FROM attempts ORDER BY id"),
  };
}

const classRow = (id: string) =>
  db.prepare("SELECT * FROM classes WHERE id = ?").get(id) as Record<string, unknown>;
const schoolRow = () =>
  db.prepare("SELECT * FROM schools WHERE id = ?").get(DEMO_SCHOOL) as Record<string, unknown>;
const auditsOf = (action: string) =>
  listAudit(db, DEMO_SCHOOL, 500).filter((a) => a.action === action);

/**
 * Abort the second class repair.
 *
 * The counter table means the first `UPDATE classes` inside the transaction
 * succeeds and the next one raises — a failure landing strictly between two
 * intended repairs, which is the exact shape of the defect.
 */
function failAfterFirstClassRepair(): void {
  db.exec("CREATE TABLE IF NOT EXISTS _repairs (n INTEGER)");
  db.exec("DELETE FROM _repairs");
  db.exec(`
    CREATE TRIGGER _fail_repair AFTER UPDATE ON classes
    BEGIN
      INSERT INTO _repairs (n) VALUES (1);
      SELECT RAISE(ABORT, 'injected class repair failure')
      WHERE (SELECT COUNT(*) FROM _repairs) > 1;
    END;
  `);
}

/** Abort the success audit for this action, after every repair has run. */
function failDatesAudit(): void {
  db.exec(`
    CREATE TRIGGER _fail_audit BEFORE INSERT ON audit_log
    WHEN NEW.action = 'year.dates_set'
    BEGIN
      SELECT RAISE(ABORT, 'injected audit failure');
    END;
  `);
}

function removeFailures(): void {
  db.exec("DROP TRIGGER IF EXISTS _fail_repair");
  db.exec("DROP TRIGGER IF EXISTS _fail_audit");
  db.exec("DROP TABLE IF EXISTS _repairs");
}

async function signInAsAdmin(): Promise<void> {
  jar.store.clear();
  await writeSession({ kind: "staff", userId: DEMO_ADMIN });
}

function form(year: string, startsOn: string, endsOn: string): FormData {
  const data = new FormData();
  data.set("academicYear", year);
  data.set("startsOn", startsOn);
  data.set("endsOn", endsOn);
  return data;
}

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  globalThis.__airkDb = db;
  buildFixture();
});
afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

describe("the repository helper is atomic on its own", () => {
  it("rolls back the school write and the first repair when a later one fails", () => {
    // The fixture really does have two candidates, so "after the first repair"
    // is not vacuous.
    expect(classRow(BROKEN_A).school_year).toBe("2025-2027");
    expect(classRow(BROKEN_B).school_year).toBe("2025-2027");
    const before = snapshot();

    failAfterFirstClassRepair();
    // The helper's own transaction, with no action wrapper involved.
    expect(() =>
      setAcademicDates(db, DEMO_SCHOOL, { year: NEW_YEAR, startsOn: NEW_START, endsOn: NEW_END }),
    ).toThrow(/injected class repair failure/);
    const attempted = (db.prepare("SELECT COUNT(*) AS n FROM _repairs").get() as { n: number }).n;
    removeFailures();

    // The counter row rolled back with everything else, which is how we know
    // the repair was inside the transaction rather than committed around it.
    expect(attempted).toBe(0);
    expect(snapshot()).toEqual(before);
    expect(schoolRow().academic_year).toBe("2025-2027");
  });

  it("participates in an outer transaction rather than owning it", () => {
    const before = snapshot();
    db.exec("BEGIN IMMEDIATE");
    setAcademicDates(db, DEMO_SCHOOL, { year: NEW_YEAR, startsOn: NEW_START, endsOn: NEW_END });
    expect(snapshot()).not.toEqual(before);
    db.exec("ROLLBACK");
    expect(snapshot()).toEqual(before);
  });
});

describe("the action commits the repair and its audit together", () => {
  it("returns a calm inline error and changes nothing when the audit fails", async () => {
    await signInAsAdmin();
    const before = snapshot();

    failDatesAudit();
    const result = await setAcademicDatesAction({}, form(NEW_YEAR, NEW_START, NEW_END));
    removeFailures();

    expect(result.error).toBe(ACADEMIC_DATES_FAILED);
    expect(result.ok).toBeUndefined();
    expect(ACADEMIC_DATES_FAILED).toMatch(/were not saved/i);
    expect(ACADEMIC_DATES_FAILED).toMatch(/class year-end date used to work out when/i);
    expect(ACADEMIC_DATES_FAILED).toMatch(/try again/i);
    // Sprint 70's rule: no support destination exists.
    for (const promise of [/account contact/i, /\bsupport\b/i, /within \d+ (?:minutes|hours|days)/i]) {
      expect(ACADEMIC_DATES_FAILED).not.toMatch(promise);
    }

    expect(snapshot()).toEqual(before);
    expect(auditsOf("year.dates_set")).toHaveLength(0);
  });

  it("succeeds on the retry with exactly the intended repairs and one audit", async () => {
    await signInAsAdmin();
    failDatesAudit();
    await setAcademicDatesAction({}, form(NEW_YEAR, NEW_START, NEW_END));
    removeFailures();

    const validBefore = classRow(VALID_SAME_LABEL);
    const historyBefore = classRow(HISTORY);
    const otherBefore = classRow(OTHER_SCHOOL_CLASS);
    const otherSchoolBefore = db.prepare("SELECT * FROM schools WHERE id = 'sch_other'").get();
    const termBefore = { s: schoolRow().term_starts_on, r: schoolRow().term_renews_on };
    const auditBefore = listAudit(db, DEMO_SCHOOL, 500).length;

    const result = await setAcademicDatesAction({}, form(NEW_YEAR, NEW_START, NEW_END));

    expect(result.error).toBeUndefined();
    // Two relabeled, three given a date (the two plus the already-relabeled
    // ones carrying no readable date) — reported as two separate facts.
    expect(result.ok).toMatch(/moved onto 2026-2027 from a school year that could not be read/);
    expect(result.ok).toMatch(/given a usable deletion date/);
    expect(result.ok).toMatch(/Classes with a valid deletion date kept it/);
    expect(result.ok).toMatch(/other school years were not touched/);

    // The school moved, and only its academic columns.
    expect(schoolRow().academic_year).toBe(NEW_YEAR);
    expect(schoolRow().year_starts_on).toBe(NEW_START);
    expect(schoolRow().year_ends_on).toBe(NEW_END);
    expect(schoolRow().term_starts_on).toBe(termBefore.s);
    expect(schoolRow().term_renews_on).toBe(termBefore.r);
    expect(schoolRow().retention_months).toBe(12);

    // Both candidates repaired: label and the year-end retention runs from.
    for (const id of [BROKEN_A, BROKEN_B]) {
      expect(classRow(id).school_year).toBe(NEW_YEAR);
      expect(classRow(id).year_ends_on).toBe(NEW_END);
    }

    // Controls, byte for byte.
    expect(classRow(VALID_SAME_LABEL).year_ends_on).toBe(validBefore.year_ends_on);
    expect(classRow(VALID_SAME_LABEL).year_ends_on).toBe("2026-06-30");
    expect(classRow(HISTORY)).toEqual(historyBefore);
    expect(classRow(OTHER_SCHOOL_CLASS)).toEqual(otherBefore);
    expect(db.prepare("SELECT * FROM schools WHERE id = 'sch_other'").get()).toEqual(
      otherSchoolBefore,
    );

    // Exactly one audit, and its detail carries the same two facts the
    // administrator was shown.
    const entries = auditsOf("year.dates_set");
    expect(entries).toHaveLength(1);
    expect(entries[0].detail).toMatch(/2026-2027 recorded as running 2026-08-25 to 2027-06-12/);
    expect(entries[0].detail).toMatch(/moved onto 2026-2027 from a school year that could not be read/);
    expect(entries[0].detail).toMatch(/given a usable deletion date/);
    expect(listAudit(db, DEMO_SCHOOL, 500).length).toBe(auditBefore + 1);
  });

  it("refuses an invalid form before taking a write lock", async () => {
    await signInAsAdmin();
    const before = snapshot();
    const result = await setAcademicDatesAction({}, form(NEW_YEAR, NEW_START, "2026-13-45"));
    expect(result.error).toBeTruthy();
    expect(result.error).not.toBe(ACADEMIC_DATES_FAILED);
    expect(snapshot()).toEqual(before);
    expect(auditsOf("year.dates_set")).toHaveLength(0);
  });
});
