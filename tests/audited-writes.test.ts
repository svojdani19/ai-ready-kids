import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import type { Db } from "@/lib/db";
import {
  ARCHIVE_FAILED,
  auditedWrite,
  DELETE_FAILED,
  RESTORE_FAILED,
  ROTATE_FAILED,
} from "@/lib/repo/audited";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  archiveClass,
  createClass,
  deleteClass,
  getClass,
  listStudents,
  restoreClass,
  rotateJoinCode,
} from "@/lib/repo/classroom";
import { listAudit } from "@/lib/repo/school";
import { setLicensedSeats } from "./helpers";
import { RestoreExceedsLicenceError } from "@/lib/repo/entitlement";

let db: Db;
let cleanup: () => void;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
});
afterEach(() => cleanup());

/**
 * Everything these four operations touch, plus the things they must not.
 * Stringified rows, so a single `toEqual` covers every column.
 */
function snapshot() {
  const dump = (sql: string, ...args: unknown[]) =>
    JSON.stringify(db.prepare(sql).all(...(args as never[])));
  return {
    classes: dump(
      "SELECT id, name, teacher_id, grade, school_year, year_ends_on, archived_at, join_code FROM classes ORDER BY id",
    ),
    students: dump("SELECT * FROM students ORDER BY id"),
    attempts: dump("SELECT * FROM attempts ORDER BY id"),
    benchmarks: dump("SELECT * FROM benchmarks ORDER BY id"),
    assignments: dump("SELECT * FROM assignments ORDER BY id"),
    audit: dump("SELECT action, detail FROM audit_log ORDER BY created_at, id"),
    schools: dump("SELECT * FROM schools ORDER BY id"),
  };
}

/**
 * Abort the audit insert for one action, and only after the class mutation has
 * already run.
 *
 * A `BEFORE INSERT` trigger on `audit_log` is exactly the failure the defect
 * described: the mutation has executed, and the record of it cannot be written.
 * Nothing else in the database is touched by the trigger, so anything that
 * survives is the operation's own doing.
 */
function failAuditFor(action: string): void {
  db.exec(`
    CREATE TRIGGER _fail_audit BEFORE INSERT ON audit_log
    WHEN NEW.action = '${action}'
    BEGIN
      SELECT RAISE(ABORT, 'injected audit failure');
    END;
  `);
}
const removeFailure = () => db.exec("DROP TRIGGER IF EXISTS _fail_audit");

/** The four operations, each as the action performs it. */
const OPERATIONS = [
  {
    name: "delete",
    action: "data.deleted",
    prepare: () => {},
    run: () =>
      auditedWrite(
        db,
        () => deleteClass(db, DEMO_CLASS),
        () => ({
          schoolId: DEMO_SCHOOL,
          actorLabel: "Rosa Delgado",
          action: "data.deleted",
          detail: "Room 12 permanently deleted.",
        }),
      ),
    assertDone: () => {
      expect(getClass(db, DEMO_CLASS)).toBeUndefined();
      expect(listStudents(db, DEMO_CLASS)).toEqual([]);
    },
  },
  {
    name: "archive",
    action: "class.archived",
    prepare: () => {},
    run: () =>
      auditedWrite(
        db,
        () => archiveClass(db, DEMO_CLASS),
        () => ({
          schoolId: DEMO_SCHOOL,
          actorLabel: "Rosa Delgado",
          action: "class.archived",
          detail: "Room 12 archived.",
        }),
      ),
    assertDone: () => {
      expect(getClass(db, DEMO_CLASS)!.archived_at).toBeTruthy();
    },
  },
  {
    name: "rotate",
    action: "class.code_rotated",
    prepare: () => {},
    run: () =>
      auditedWrite(
        db,
        () => rotateJoinCode(db, DEMO_CLASS),
        () => ({
          schoolId: DEMO_SCHOOL,
          actorLabel: "Rosa Delgado",
          action: "class.code_rotated",
          detail: "Room 12 has a new class code.",
        }),
      ),
    assertDone: () => {
      expect(getClass(db, DEMO_CLASS)!.archived_at).toBeNull();
    },
  },
  {
    name: "restore",
    action: "class.restored",
    // Starts archived, which is the only state a restore can act on.
    prepare: () => archiveClass(db, DEMO_CLASS),
    run: () =>
      auditedWrite(
        db,
        () => restoreClass(db, DEMO_CLASS),
        () => ({
          schoolId: DEMO_SCHOOL,
          actorLabel: "Rosa Delgado",
          action: "class.restored",
          detail: "Room 12 restored to active.",
        }),
      ),
    assertDone: () => {
      expect(getClass(db, DEMO_CLASS)!.archived_at).toBeNull();
    },
  },
] as const;

describe("a class operation and its audit entry commit together", () => {
  it.each(OPERATIONS.map((o) => [o.name, o] as const))(
    "%s: an audit failure leaves the database exactly as it was",
    (_name, op) => {
      op.prepare();
      const before = snapshot();

      failAuditFor(op.action);
      // The mutation runs, then the audit insert aborts. Before the fix the
      // mutation had already committed and only this throw reached the caller.
      expect(() => op.run()).toThrow(/injected audit failure/);
      removeFailure();

      // Byte for byte, including archived_at, join_code, every student row,
      // every attempt and check-in, and the audit log itself.
      expect(snapshot()).toEqual(before);
      expect(
        listAudit(db, DEMO_SCHOOL, 200).some((a) => a.action === op.action),
      ).toBe(false);
    },
  );

  it.each(OPERATIONS.map((o) => [o.name, o] as const))(
    "%s: succeeds on the retry, with exactly one audit entry",
    (_name, op) => {
      op.prepare();
      failAuditFor(op.action);
      expect(() => op.run()).toThrow();
      removeFailure();

      const auditBefore = listAudit(db, DEMO_SCHOOL, 200).length;
      op.run();

      op.assertDone();
      const entries = listAudit(db, DEMO_SCHOOL, 200).filter((a) => a.action === op.action);
      expect(entries).toHaveLength(1);
      expect(listAudit(db, DEMO_SCHOOL, 200).length).toBe(auditBefore + 1);
    },
  );

  it("delete really removes the cascade once it succeeds", () => {
    const studentIds = listStudents(db, DEMO_CLASS).map((s) => s.id);
    expect(studentIds.length).toBeGreaterThan(0);
    const placeholders = studentIds.map(() => "?").join(",");
    const countBy = (table: string) =>
      (
        db
          .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE student_id IN (${placeholders})`)
          .get(...studentIds) as { n: number }
      ).n;
    expect(countBy("attempts")).toBeGreaterThan(0);

    OPERATIONS[0].run();

    // Captured before the delete, so an orphan fails here — sprint 67's lesson.
    expect(countBy("attempts")).toBe(0);
    expect(countBy("benchmarks")).toBe(0);
    expect(
      (
        db.prepare("SELECT COUNT(*) AS n FROM assignments WHERE class_id = ?").get(DEMO_CLASS) as {
          n: number;
        }
      ).n,
    ).toBe(0);
    expect(listAudit(db, DEMO_SCHOOL, 200).filter((a) => a.action === "data.deleted")).toHaveLength(
      1,
    );
  });

  it("participates in an outer transaction rather than committing around it", () => {
    const before = snapshot();
    db.exec("BEGIN IMMEDIATE");
    OPERATIONS[2].run();
    expect(snapshot()).not.toEqual(before);
    db.exec("ROLLBACK");
    expect(snapshot()).toEqual(before);
  });
});

describe("restore refusals are unaffected", () => {
  it("still refuses over the licence, mutates nothing, and keeps its own audit", () => {
    archiveClass(db, DEMO_CLASS);
    const roster = listStudents(db, DEMO_CLASS).length;
    expect(roster).toBeGreaterThan(0);
    // Leave room for everyone except this cohort.
    const active = (
      db.prepare(
        "SELECT COUNT(*) AS n FROM students WHERE class_id IN (SELECT id FROM classes WHERE archived_at IS NULL)",
      ).get() as { n: number }
    ).n;
    setLicensedSeats(db, DEMO_SCHOOL, active + roster - 1);

    const before = snapshot();
    expect(() => restoreClass(db, DEMO_CLASS)).toThrow(RestoreExceedsLicenceError);

    // The refusal touched nothing, and the class is still archived.
    expect(snapshot()).toEqual(before);
    expect(getClass(db, DEMO_CLASS)!.archived_at).toBeTruthy();

    // The refusal audit is written by the action outside the transaction, so a
    // rolled-back nothing does not take the record of it with it.
    auditedWrite(
      db,
      () => {},
      () => ({
        schoolId: DEMO_SCHOOL,
        actorLabel: "Rosa Delgado",
        action: "class.restore_blocked_by_licence",
        detail: "Restoring Room 12 was declined.",
      }),
    );
    const refusals = listAudit(db, DEMO_SCHOOL, 200).filter(
      (a) => a.action === "class.restore_blocked_by_licence",
    );
    expect(refusals).toHaveLength(1);
    expect(
      listAudit(db, DEMO_SCHOOL, 200).some((a) => a.action === "class.restored"),
    ).toBe(false);
  });

  it("still restores when the school has the seats", () => {
    const other = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Room 99",
      grade: 3,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-12",
    });
    archiveClass(db, other.id);
    expect(() => restoreClass(db, other.id)).not.toThrow();
    expect(getClass(db, other.id)!.archived_at).toBeNull();
  });
});

describe("the audit promise on the buyer-facing pages is the one this code keeps", () => {
  const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
  const copyOf = (p: string) =>
    src(p)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1")
      .replace(/^import[^\n]*$/gm, "")
      .replace(/\s+/g, " ");

  it("keeps the promise, and ties it to the transaction that makes it true", () => {
    // The promise is not weakened. It is kept, and this is what keeps it: all
    // four class operations commit their audit row with the mutation, so
    // "every configuration change and every deletion writes an audit entry"
    // cannot be falsified by an audit insert failing after the fact.
    expect(copyOf("src/app/(site)/privacy/page.tsx")).toMatch(
      /Every configuration change and every deletion writes an audit entry/i,
    );
    expect(copyOf("src/app/admin/data/page.tsx")).toMatch(
      /Every configuration and deletion action, with who did it and when/i,
    );

    const admin = src("src/app/actions/admin.ts");
    const slice = (name: string) => {
      const start = admin.indexOf(`export async function ${name}`);
      expect(start, `${name} not found`).toBeGreaterThan(-1);
      return admin.slice(start, admin.indexOf("\nexport ", start + 1));
    };
    for (const name of [
      "deleteClassDataAction",
      "archiveClassAction",
      "restoreClassAction",
      "rotateJoinCodeAsAdminAction",
    ]) {
      expect(slice(name), `${name} must audit inside the transaction`).toContain("auditedWrite");
    }
  });

  it("returns the delete result to the control that renders it", () => {
    // Both call sites used to `await` and discard, so ConfirmAction had nothing
    // to show when the write failed over a class that was already gone.
    const admin = src("src/app/actions/admin.ts");
    expect(admin).toMatch(
      /export async function deleteClassDataAction\(classId: string\): Promise<\{ error\?: string \}>/,
    );
    for (const page of ["src/app/admin/classes/page.tsx", "src/app/admin/data/page.tsx"]) {
      expect(src(page)).toMatch(/return deleteClassDataAction\(/);
      expect(src(page)).not.toMatch(/await deleteClassDataAction\(/);
    }
  });

  it("promises no support channel in any failure message", () => {
    const messages = [
      DELETE_FAILED("Room 12"),
      ARCHIVE_FAILED("Room 12"),
      RESTORE_FAILED("Room 12"),
      ROTATE_FAILED("Room 12"),
    ];
    for (const message of messages) {
      // Sprint 70's lesson: no destination exists, and failures leave no trace.
      for (const promise of [
        /account contact/i,
        /contact (?:us|support)/i,
        /\bsupport\b/i,
        /we (?:will|'ll) (?:look|investigate|fix)/i,
        /within \d+ (?:minutes|hours|days)/i,
        /\blogged\b|\bdiagnostic/i,
      ]) {
        expect(message).not.toMatch(promise);
      }
      expect(message).toMatch(/try again/i);
    }
    // Deletion is the one that must say it explicitly.
    expect(DELETE_FAILED("Room 12")).toMatch(/no records were removed/i);
    // And each names the state that did not change.
    expect(ARCHIVE_FAILED("Room 12")).toMatch(/still active, its join code is unchanged/i);
    expect(RESTORE_FAILED("Room 12")).toMatch(/still archived/i);
    expect(ROTATE_FAILED("Room 12")).toMatch(/current code still works/i);
  });
});
