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
import { createTestDb, DEMO_ADMIN, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import { removeStaffAction, restoreClassAction } from "@/app/actions/admin";
import { removeStudentAction, rotateJoinCodeAction } from "@/app/actions/teacher";
import { writeSession } from "@/lib/auth/session";
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
  deleteClass,
  listStudents,
  createClass,
  restoreClass,
  rotateJoinCode,
} from "@/lib/repo/classroom";
import { createUser, listAudit } from "@/lib/repo/school";
import { setLicensedSeats } from "./helpers";

let db: Db;
let cleanup: () => void;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  // `getDb()` inside the action reads this handle.
  globalThis.__airkDb = db;
});
afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

/**
 * Everything these four operations touch, plus the things they must not.
 * Stringified rows, so a single `toEqual` covers every column.
 */
const dump = (sql: string) => JSON.stringify(db.prepare(sql).all());

function snapshot() {
  return {
    classes: dump(
      "SELECT id, name, teacher_id, grade, school_year, year_ends_on, archived_at, join_code FROM classes ORDER BY id",
    ),
    ...protectedRecords(),
    audit: dump("SELECT action, detail FROM audit_log ORDER BY created_at, id"),
  };
}

/**
 * Everything none of these four operations may touch — every roster row, every
 * attempt and check-in, every assignment, the school itself, and every class
 * other than the one being acted on.
 */
function protectedRecords() {
  return {
    students: dump("SELECT * FROM students ORDER BY id"),
    attempts: dump("SELECT * FROM attempts ORDER BY id"),
    benchmarks: dump("SELECT * FROM benchmarks ORDER BY id"),
    assignments: dump("SELECT * FROM assignments ORDER BY id"),
    schools: dump("SELECT * FROM schools ORDER BY id"),
    otherClasses: dump(
      `SELECT * FROM classes WHERE id != '${DEMO_CLASS}' ORDER BY id`,
    ),
  };
}

/** The acted-on class, in full, or null once it is gone. */
function classRow(): Record<string, unknown> | null {
  return (
    (db.prepare("SELECT * FROM classes WHERE id = ?").get(DEMO_CLASS) as Record<
      string,
      unknown
    >) ?? null
  );
}

/**
 * The class row minus the columns an operation is allowed to change. Anything
 * left must match exactly, which is what stops "it changed something" from
 * passing for "it changed the right thing".
 */
function classExcept(row: Record<string, unknown> | null, ...allowed: string[]) {
  if (!row) return null;
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) if (!allowed.includes(k)) rest[k] = v;
  return rest;
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

type Snap = {
  class: Record<string, unknown> | null;
  records: ReturnType<typeof protectedRecords>;
};

const capture = (): Snap => ({ class: classRow(), records: protectedRecords() });

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
    // The class and its cascade are gone; every other class is untouched.
    assertRetry: (before: Snap) => {
      expect(classRow()).toBeNull();
      expect(listStudents(db, DEMO_CLASS)).toEqual([]);
      expect(dump(`SELECT * FROM classes WHERE id != '${DEMO_CLASS}' ORDER BY id`)).toBe(
        before.records.otherClasses,
      );
      expect(dump("SELECT * FROM schools ORDER BY id")).toBe(before.records.schools);
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
    // Archive is two facts: the timestamp AND the rotated credential. Asserting
    // only the first would pass if `archiveClass` stopped rotating — half of the
    // boundary sprint 69 built.
    assertRetry: (before: Snap) => {
      const after = classRow()!;
      expect(after.archived_at).toBeTruthy();
      expect(before.class!.archived_at).toBeNull();
      expect(after.join_code).not.toBe(before.class!.join_code);
      // Nothing else about the class moved: not the teacher, the grade, the
      // school year or the year-end the deletion date is calculated from.
      expect(classExcept(after, "archived_at", "join_code")).toEqual(
        classExcept(before.class, "archived_at", "join_code"),
      );
      expect(protectedRecords()).toEqual(before.records);
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
    // The code must actually change. `archived_at` staying null is the
    // precondition, and would hold if `rotateJoinCode` became a no-op.
    assertRetry: (before: Snap) => {
      const after = classRow()!;
      expect(after.join_code).not.toBe(before.class!.join_code);
      expect(after.archived_at).toBeNull();
      expect(classExcept(after, "join_code")).toEqual(classExcept(before.class, "join_code"));
      expect(protectedRecords()).toEqual(before.records);
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
    // Only the timestamp comes back. Restoring does not un-rotate the code the
    // archive issued — that is the point of sprint 69's revocation — so the
    // code must be byte-identical to the archived state.
    assertRetry: (before: Snap) => {
      const after = classRow()!;
      expect(after.archived_at).toBeNull();
      expect(before.class!.archived_at).toBeTruthy();
      expect(after.join_code).toBe(before.class!.join_code);
      expect(classExcept(after, "archived_at")).toEqual(classExcept(before.class, "archived_at"));
      expect(protectedRecords()).toEqual(before.records);
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
    "%s: the retry makes exactly the intended change, and one audit entry",
    (_name, op) => {
      op.prepare();
      // Captured before the failed attempt, so the comparison spans both.
      const before = capture();

      failAuditFor(op.action);
      expect(() => op.run()).toThrow();
      removeFailure();

      const auditBefore = listAudit(db, DEMO_SCHOOL, 200).length;
      op.run();

      // Operation-specific, and capable of failing if the central mutation
      // becomes a no-op — which is the whole reason this is not one shared
      // "something changed" assertion.
      op.assertRetry(before);

      const entries = listAudit(db, DEMO_SCHOOL, 200).filter((a) => a.action === op.action);
      expect(entries).toHaveLength(1);
      // And the failed attempt left no entry of its own.
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

describe("restore refusals go through the real action", () => {
  /**
   * The exported Server Action, with a real seeded database and a real
   * administrator session.
   *
   * The first version of this test called `restoreClass` directly, watched it
   * throw, and then wrote the refusal audit row itself with
   * `auditedWrite(() => {})`. That is manufacturing the evidence: it would have
   * passed just as happily if `restoreClassAction` had stopped writing refusal
   * audits altogether. Nothing below creates an audit row.
   */
  async function signInAsAdmin() {
    jar.store.clear();
    await writeSession({ kind: "staff", userId: DEMO_ADMIN });
  }

  const auditsOf = (action: string) =>
    listAudit(db, DEMO_SCHOOL, 200).filter((a) => a.action === action);

  it("refuses over the license, changes nothing, and writes only its refusal audit", async () => {
    await signInAsAdmin();
    archiveClass(db, DEMO_CLASS);
    const roster = listStudents(db, DEMO_CLASS).length;
    expect(roster).toBeGreaterThan(0);
    const active = (
      db
        .prepare(
          "SELECT COUNT(*) AS n FROM students WHERE class_id IN (SELECT id FROM classes WHERE archived_at IS NULL)",
        )
        .get() as { n: number }
    ).n;
    // One seat short of what restoring would need.
    setLicensedSeats(db, DEMO_SCHOOL, active + roster - 1);

    const before = capture();
    const auditBefore = listAudit(db, DEMO_SCHOOL, 200).length;

    const result = await restoreClassAction(DEMO_CLASS);

    // The established inline message, not the operational-failure one.
    expect(result.error).toMatch(/licensed places are already in use/i);
    expect(result.error).toMatch(/stays archived and none of its records have changed/i);
    expect(result.error).not.toMatch(/was not restored\. It is still archived/);

    // Nothing moved, including the code the archive rotated.
    expect(classRow()).toEqual(before.class);
    expect(protectedRecords()).toEqual(before.records);

    // Written by the action, not by this test.
    expect(auditsOf("class.restore_blocked_by_license")).toHaveLength(1);
    expect(auditsOf("class.restored")).toHaveLength(0);
    expect(listAudit(db, DEMO_SCHOOL, 200).length).toBe(auditBefore + 1);
  });

  it("refuses over the classroom cap, changes nothing, and writes only its refusal audit", async () => {
    await signInAsAdmin();
    // The classroom plan allows one active room. Archive this one, leave
    // another active, and restoring is one room too many.
    db.prepare("UPDATE schools SET plan = 'classroom' WHERE id = ?").run(DEMO_SCHOOL);
    archiveClass(db, DEMO_CLASS);

    const before = capture();
    const auditBefore = listAudit(db, DEMO_SCHOOL, 200).length;

    const result = await restoreClassAction(DEMO_CLASS);

    expect(result.error).toMatch(/classroom plan/i);
    expect(classRow()).toEqual(before.class);
    expect(protectedRecords()).toEqual(before.records);
    expect(auditsOf("class.restore_blocked_by_plan")).toHaveLength(1);
    expect(auditsOf("class.restored")).toHaveLength(0);
    expect(listAudit(db, DEMO_SCHOOL, 200).length).toBe(auditBefore + 1);
  });

  it("refuses an unrecognized plan, changes nothing, and writes only its refusal audit", async () => {
    await signInAsAdmin();
    db.prepare("UPDATE schools SET plan = 'enterprise-plus' WHERE id = ?").run(DEMO_SCHOOL);
    archiveClass(db, DEMO_CLASS);

    const before = capture();
    const auditBefore = listAudit(db, DEMO_SCHOOL, 200).length;

    const result = await restoreClassAction(DEMO_CLASS);

    expect(result.error).toBeTruthy();
    // Never echoes the stored value back — sprint 53's rule.
    expect(result.error).not.toMatch(/enterprise-plus/);
    expect(classRow()).toEqual(before.class);
    expect(protectedRecords()).toEqual(before.records);
    expect(auditsOf("class.restore_blocked_by_plan_config")).toHaveLength(1);
    expect(auditsOf("class.restored")).toHaveLength(0);
    expect(listAudit(db, DEMO_SCHOOL, 200).length).toBe(auditBefore + 1);
  });

  it("refuses a malformed seat license, changes nothing, and writes only its refusal audit", async () => {
    // The fourth refusal handler. It was the one path the first version of this
    // suite left out, while the sprint record claimed all four audit calls were
    // proved — so removing only this `recordAudit` still passed.
    await signInAsAdmin();
    archiveClass(db, DEMO_CLASS);
    // Outside 1-5000, which sprint 56 made an unrecognized contract value. Not
    // a number this product sells, so it is an account-record problem rather
    // than an overage.
    db.prepare("UPDATE schools SET licensed_students = -7 WHERE id = ?").run(DEMO_SCHOOL);

    const before = capture();
    const auditBefore = listAudit(db, DEMO_SCHOOL, 200).length;

    const result = await restoreClassAction(DEMO_CLASS);

    // The established configuration refusal, not the over-the-license one and
    // not the operational-failure one.
    expect(result.error).toMatch(/seat license needs configuration/i);
    expect(result.error).toMatch(/nothing has been changed/i);
    expect(result.error).toMatch(/have the seat license corrected on the account/i);
    expect(result.error).not.toMatch(/licensed places are already in use/i);
    expect(result.error).not.toMatch(/was not restored\. It is still archived/);
    // Never repeats the malformed value back — sprint 56's rule.
    expect(result.error).not.toMatch(/-7|\b7\b/);

    // Nothing moved, including the code the archive rotated.
    expect(classRow()).toEqual(before.class);
    expect(protectedRecords()).toEqual(before.records);

    expect(auditsOf("class.restore_blocked_by_license_config")).toHaveLength(1);
    expect(auditsOf("class.restored")).toHaveLength(0);
    expect(listAudit(db, DEMO_SCHOOL, 200).length).toBe(auditBefore + 1);
  });

  it("restores through the action when the school has the seats", async () => {
    await signInAsAdmin();
    archiveClass(db, DEMO_CLASS);
    const before = capture();

    const result = await restoreClassAction(DEMO_CLASS);

    expect(result.error).toBeUndefined();
    expect(classRow()!.archived_at).toBeNull();
    // Restoring does not un-rotate the archive's code.
    expect(classRow()!.join_code).toBe(before.class!.join_code);
    expect(protectedRecords()).toEqual(before.records);
    expect(auditsOf("class.restored")).toHaveLength(1);
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

describe("sprint 73: the destructive teacher and staff operations audit atomically", () => {
  const auditsOf = (action: string) =>
    listAudit(db, DEMO_SCHOOL, 500).filter((a) => a.action === action);

  async function signInAs(userId: string) {
    jar.store.clear();
    await writeSession({ kind: "staff", userId });
  }

  it("teacher code rotation: an audit failure leaves the code untouched", async () => {
    await signInAs(DEMO_TEACHER);
    const before = capture();

    failAuditFor("class.code_rotated");
    const result = await rotateJoinCodeAction(DEMO_CLASS);
    removeFailure();

    expect(result.error).toBe(ROTATE_FAILED("Room 12"));
    expect(result.error).toMatch(/current code still works and nobody has been signed out/i);
    // The whole point: the credential did not change.
    expect(classRow()!.join_code).toBe(before.class!.join_code);
    expect(classRow()).toEqual(before.class);
    expect(protectedRecords()).toEqual(before.records);
    expect(auditsOf("class.code_rotated")).toHaveLength(0);
  });

  it("teacher code rotation: the retry rotates and audits exactly once", async () => {
    await signInAs(DEMO_TEACHER);
    failAuditFor("class.code_rotated");
    await rotateJoinCodeAction(DEMO_CLASS);
    removeFailure();

    const before = capture();
    const auditBefore = listAudit(db, DEMO_SCHOOL, 500).length;
    const result = await rotateJoinCodeAction(DEMO_CLASS);

    expect(result.error).toBeUndefined();
    expect(classRow()!.join_code).not.toBe(before.class!.join_code);
    expect(classExcept(classRow(), "join_code")).toEqual(classExcept(before.class, "join_code"));
    expect(protectedRecords()).toEqual(before.records);
    expect(auditsOf("class.code_rotated")).toHaveLength(1);
    expect(listAudit(db, DEMO_SCHOOL, 500).length).toBe(auditBefore + 1);
  });

  it("removing a student: an audit failure deletes no records", async () => {
    await signInAs(DEMO_TEACHER);
    const victim = listStudents(db, DEMO_CLASS)[0];
    const before = capture();
    const attemptsBefore = (
      db
        .prepare("SELECT COUNT(*) AS n FROM attempts WHERE student_id = ?")
        .get(victim.id) as { n: number }
    ).n;
    expect(attemptsBefore).toBeGreaterThan(0);

    failAuditFor("roster.removed");
    const result = await removeStudentAction(DEMO_CLASS, victim.id);
    removeFailure();

    expect(result.error).toMatch(/no records were deleted/i);
    expect(result.error).toMatch(/still on Room 12's roster/i);
    // The child, and everything that hangs off them.
    expect(listStudents(db, DEMO_CLASS).map((s) => s.id)).toContain(victim.id);
    expect(
      (
        db
          .prepare("SELECT COUNT(*) AS n FROM attempts WHERE student_id = ?")
          .get(victim.id) as { n: number }
      ).n,
    ).toBe(attemptsBefore);
    expect(protectedRecords()).toEqual(before.records);
    expect(auditsOf("roster.removed")).toHaveLength(0);
  });

  it("removing a student: the retry removes them and audits exactly once", async () => {
    await signInAs(DEMO_TEACHER);
    const victim = listStudents(db, DEMO_CLASS)[0];
    failAuditFor("roster.removed");
    await removeStudentAction(DEMO_CLASS, victim.id);
    removeFailure();

    const rosterBefore = listStudents(db, DEMO_CLASS).length;
    const auditBefore = listAudit(db, DEMO_SCHOOL, 500).length;
    const result = await removeStudentAction(DEMO_CLASS, victim.id);

    expect(result.error).toBeUndefined();
    expect(listStudents(db, DEMO_CLASS)).toHaveLength(rosterBefore - 1);
    // Captured id, so an orphaned attempt fails here rather than hiding behind
    // an empty subquery — sprint 67's lesson.
    expect(
      (
        db
          .prepare("SELECT COUNT(*) AS n FROM attempts WHERE student_id = ?")
          .get(victim.id) as { n: number }
      ).n,
    ).toBe(0);
    expect(auditsOf("roster.removed")).toHaveLength(1);
    expect(listAudit(db, DEMO_SCHOOL, 500).length).toBe(auditBefore + 1);
  });

  it("a mismatched student and class still refuses, and audits nothing", async () => {
    await signInAs(DEMO_TEACHER);
    const other = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Room 99",
      grade: 3,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-12",
    });
    const victim = listStudents(db, DEMO_CLASS)[0];
    const before = capture();

    // Authorizing the class is not authorizing the child.
    const result = await removeStudentAction(other.id, victim.id);

    expect(result.error).toMatch(/not on this class's roster/i);
    expect(listStudents(db, DEMO_CLASS).map((s) => s.id)).toContain(victim.id);
    expect(protectedRecords()).toEqual(before.records);
    expect(auditsOf("roster.removed")).toHaveLength(0);
  });

  it("removing staff: an audit failure keeps the account and its orientation", async () => {
    await signInAs(DEMO_ADMIN);
    // A teacher who owns no classes, so the offboarding guards pass.
    const spare = createUser(db, {
      schoolId: DEMO_SCHOOL,
      role: "teacher",
      name: "Spare Teacher",
      email: "spare@brightwood.demo",
      title: "Teacher",
    });
    const usersBefore = JSON.stringify(db.prepare("SELECT * FROM users ORDER BY id").all());

    failAuditFor("staff.removed");
    const result = await removeStaffAction(spare.id);
    removeFailure();

    expect(result.error).toMatch(/was not removed/i);
    expect(result.error).toMatch(/still have their account and their orientation record/i);
    expect(JSON.stringify(db.prepare("SELECT * FROM users ORDER BY id").all())).toBe(usersBefore);
    expect(auditsOf("staff.removed")).toHaveLength(0);
  });

  it("removing staff: the retry removes them and audits exactly once", async () => {
    await signInAs(DEMO_ADMIN);
    const spare = createUser(db, {
      schoolId: DEMO_SCHOOL,
      role: "teacher",
      name: "Spare Teacher",
      email: "spare@brightwood.demo",
      title: "Teacher",
    });
    failAuditFor("staff.removed");
    await removeStaffAction(spare.id);
    removeFailure();

    const auditBefore = listAudit(db, DEMO_SCHOOL, 500).length;
    const result = await removeStaffAction(spare.id);

    expect(result.error).toBeUndefined();
    expect(db.prepare("SELECT * FROM users WHERE id = ?").get(spare.id)).toBeUndefined();
    expect(auditsOf("staff.removed")).toHaveLength(1);
    expect(listAudit(db, DEMO_SCHOOL, 500).length).toBe(auditBefore + 1);
  });
});

describe("no destructive or credential-changing action audits outside a transaction", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  /** Every exported action body, keyed by name. */
  function actionBodies(): { file: string; name: string; body: string }[] {
    const out: { file: string; name: string; body: string }[] = [];
    for (const file of ["src/app/actions/admin.ts", "src/app/actions/teacher.ts"]) {
      const src = read(file);
      const starts = [...src.matchAll(/export async function (\w+)/g)];
      starts.forEach((m, i) => {
        const from = m.index!;
        const to = i + 1 < starts.length ? starts[i + 1].index! : src.length;
        out.push({ file, name: m[1], body: src.slice(from, to) });
      });
    }
    return out;
  }

  /**
   * Repository calls whose failure cannot be undone by trying again, or which
   * change a credential. An action that performs one of these and writes an
   * audit must do both in one transaction — otherwise the record and the
   * consequence can part company, which is the whole subject of sprints 71-73.
   *
   * Keyed on the repository call rather than the action name, so a **new**
   * action that deletes a class or rotates a code is caught without anyone
   * remembering to add it to a list. That was the gap I named in sprint 71.
   */
  const CONSEQUENTIAL = [
    "deleteClass(",
    "deleteStudentFromClass(",
    "deleteUser(",
    "rotateJoinCode(",
    "archiveClass(",
    "restoreClass(",
    "setAcademicDates(",
    // Sprint 74. Not destructive in itself, but it moves the scheduled deletion
    // date for every cohort and changes which records the purge considers
    // eligible — the one configuration write whose loss is a data-governance
    // problem rather than a cosmetic one. Added deliberately and singly; the
    // other configuration writes stay out, because keying this on "any write"
    // would turn it back into the list it replaced.
    "setRetentionMonths(",
    // Sprint 75. Also not destructive, and also not cosmetic: it decides
    // school-wide, immediately, whether children may start or resume a
    // check-in. A lost record of who opened a window is a benchmark-integrity
    // question. Added singly, for the same reason retention was.
    "setBenchmarkWindow(",
    // Sprint 76. Deciding which authored mission a class may open is the same
    // kind of thing one class at a time: assigning exposes a mission to
    // children, unassigning withdraws one that may be half-finished.
    "assignMission(",
    "unassignMission(",
  ];

  it("pairs every consequential write with auditedWrite", () => {
    const offenders: string[] = [];
    for (const { file, name, body } of actionBodies()) {
      const stripped = body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1");
      const does = CONSEQUENTIAL.filter((call) => stripped.includes(call));
      if (does.length === 0) continue;
      if (!stripped.includes("recordAudit") && !stripped.includes("auditedWrite")) continue;
      if (!stripped.includes("auditedWrite")) {
        offenders.push(`${file}:${name} performs ${does.join(", ")} and audits outside a transaction`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("actually looks at something, rather than passing on an empty sweep", () => {
    // A guard that scanned nothing would pass silently. These are the actions
    // it must be finding.
    const wrapped = actionBodies().filter((a) => a.body.includes("auditedWrite")).map((a) => a.name);
    expect(wrapped).toEqual(
      expect.arrayContaining([
        "setAcademicDatesAction",
        "rotateJoinCodeAsAdminAction",
        "archiveClassAction",
        "restoreClassAction",
        "deleteClassDataAction",
        "removeStaffAction",
        "removeStudentAction",
        "rotateJoinCodeAction",
        "setRetentionAction",
        "setBenchmarkWindowAction",
        "setAssignmentAction",
      ]),
    );
    expect(wrapped.length).toBeGreaterThanOrEqual(11);
  });
});
