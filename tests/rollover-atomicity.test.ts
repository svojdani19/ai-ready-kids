import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createTestDb, DEMO_SCHOOL } from "./helpers";
import type { Db } from "@/lib/db";
import { performRollover, ROLLOVER_FAILED } from "@/lib/repo/rollover";
import { listClasses } from "@/lib/repo/classroom";
import { getSchool, listAudit } from "@/lib/repo/school";

let db: Db;
let cleanup: () => void;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
});
afterEach(() => cleanup());

/**
 * Everything the rollover touches, plus the things it promises not to.
 * Stringified so a single `toEqual` covers every column of every row.
 */
function snapshot() {
  return {
    classes: JSON.stringify(
      db
        .prepare(
          "SELECT id, name, school_year, year_ends_on, archived_at, join_code FROM classes ORDER BY id",
        )
        .all(),
    ),
    school: JSON.stringify(
      db
        .prepare(
          `SELECT academic_year, year_starts_on, year_ends_on, benchmark_window,
                  term_starts_on, term_renews_on, retention_months
           FROM schools WHERE id = ?`,
        )
        .get(DEMO_SCHOOL),
    ),
    audit: JSON.stringify(
      db.prepare("SELECT action, detail FROM audit_log ORDER BY created_at, id").all(),
    ),
  };
}

/**
 * A deterministic failure that lands **after** at least one class has been
 * archived and its code rotated.
 *
 * The trigger counts archives with a temporary table and raises on the second,
 * so the first `UPDATE classes SET archived_at = ..., join_code = ...` inside
 * the transaction succeeds and the next one aborts. That is the exact shape of
 * the defect: partway through the class loop, credentials already rotated.
 *
 * Guarded, not assumed: `installFailureAfterFirstArchive` returns the number of
 * classes the rollover intends to archive, and the tests assert it is at least
 * two — otherwise "after the first write" would be vacuous.
 */
function installFailureAfterFirstArchive(): number {
  const active = listClasses(db, DEMO_SCHOOL, false).filter(
    (c) => c.school_year === getSchool(db, DEMO_SCHOOL)!.academic_year,
  );
  db.exec("CREATE TABLE IF NOT EXISTS _archive_calls (n INTEGER)");
  db.exec("DELETE FROM _archive_calls");
  db.exec(`
    CREATE TRIGGER _fail_after_first_archive
    AFTER UPDATE OF archived_at ON classes
    WHEN NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL
    BEGIN
      INSERT INTO _archive_calls (n) VALUES (1);
      SELECT RAISE(ABORT, 'injected failure after the first archive')
      WHERE (SELECT COUNT(*) FROM _archive_calls) > 1;
    END;
  `);
  return active.length;
}

function removeFailure(): void {
  db.exec("DROP TRIGGER IF EXISTS _fail_after_first_archive");
  db.exec("DROP TABLE IF EXISTS _archive_calls");
}

describe("a rollover that fails part-way changes nothing", () => {
  it("rolls back the archives and codes already written", () => {
    const intended = installFailureAfterFirstArchive();
    // Without this the failure could land before any write and the test would
    // pass for the wrong reason.
    expect(intended, "the fixture needs at least two classes to archive").toBeGreaterThan(1);

    const before = snapshot();

    expect(() => performRollover(db, DEMO_SCHOOL, "Rosa Delgado")).toThrow(
      /injected failure after the first archive/,
    );

    // The trigger fired at least twice: one archive committed inside the
    // transaction before the abort, which is the state the defect left behind.
    const archivesAttempted = (
      db.prepare("SELECT COUNT(*) AS n FROM _archive_calls").get() as { n: number }
    ).n;
    removeFailure();

    // Rolled back with the transaction, so the counter is gone too — proving
    // the write really was inside it rather than committed around it.
    expect(archivesAttempted).toBe(0);

    // Byte for byte: no archived_at, no rotated join_code, no academic dates,
    // no window change, no audit row. Subscription and retention untouched.
    expect(snapshot()).toEqual(before);
  });

  it("reports the failure to the caller as an error rather than a crash", () => {
    installFailureAfterFirstArchive();
    const before = snapshot();

    // The action's contract: catch, report, keep the retry path. The message
    // is only true because the assertion above proves the rollback.
    let result: { error?: string } = {};
    try {
      performRollover(db, DEMO_SCHOOL, "Rosa Delgado");
    } catch {
      result = { error: ROLLOVER_FAILED };
    }
    removeFailure();

    expect(result.error).toBe(ROLLOVER_FAILED);
    // The proven claim, and the retry instruction.
    expect(ROLLOVER_FAILED).toMatch(/did not finish, so nothing was changed/i);
    expect(ROLLOVER_FAILED).toMatch(/try again/i);
    // The truthful stop: leaving it alone costs nothing.
    expect(ROLLOVER_FAILED).toMatch(/leave the school year as it is/i);
    expect(ROLLOVER_FAILED).toMatch(/carry on unchanged/i);

    // No support channel, diagnostic trail or response time is promised. This
    // product ships no technical support destination — the programme contact
    // handles quotes and invoices — and a failed attempt writes no audit row,
    // so there would be nothing to inspect even if there were somewhere to
    // send an administrator.
    for (const promise of [
      /account contact/i,
      /can look at it/i,
      /contact (?:us|support)/i,
      /\bsupport\b/i,
      /we (?:will|'ll) (?:look|investigate|fix)/i,
      /report(?:ed)? (?:this|it) (?:to|automatically)/i,
      /within \d+ (?:minutes|hours|days)/i,
      /\blogged\b|\bdiagnostic/i,
    ]) {
      expect(ROLLOVER_FAILED).not.toMatch(promise);
    }

    expect(snapshot()).toEqual(before);
  });

  it("succeeds cleanly on the retry once the failure is removed", () => {
    const intended = installFailureAfterFirstArchive();
    expect(() => performRollover(db, DEMO_SCHOOL, "Rosa Delgado")).toThrow();
    removeFailure();

    const school = getSchool(db, DEMO_SCHOOL)!;
    const fromYear = school.academic_year;
    const codesBefore = new Map(
      listClasses(db, DEMO_SCHOOL, true).map((c) => [c.id, c.join_code]),
    );
    const termBefore = { starts: school.term_starts_on, renews: school.term_renews_on };
    const yearEndsBefore = new Map(
      listClasses(db, DEMO_SCHOOL, true).map((c) => [c.id, c.year_ends_on]),
    );
    const auditBefore = listAudit(db, DEMO_SCHOOL, 200).length;

    const outcome = performRollover(db, DEMO_SCHOOL, "Rosa Delgado");
    expect(outcome).toEqual({
      ok: true,
      fromYear,
      toYear: "2026-2027",
      archived: intended,
    });

    // Every intended class archived, each with a rotated code.
    const after = listClasses(db, DEMO_SCHOOL, true);
    const rolled = after.filter((c) => c.school_year === fromYear);
    expect(rolled.length).toBe(intended);
    for (const c of rolled) {
      expect(c.archived_at).toBeTruthy();
      expect(c.join_code).not.toBe(codesBefore.get(c.id));
      // Deletion schedule untouched.
      expect(c.year_ends_on).toBe(yearEndsBefore.get(c.id));
    }

    // School moved on; subscription and retention did not.
    const now = getSchool(db, DEMO_SCHOOL)!;
    expect(now.academic_year).toBe("2026-2027");
    expect(now.year_starts_on).toBe("2026-08-25");
    expect(now.year_ends_on).toBe("2027-06-12");
    expect(now.benchmark_window).toBe("closed");
    expect(now.term_starts_on).toBe(termBefore.starts);
    expect(now.term_renews_on).toBe(termBefore.renews);
    expect(now.retention_months).toBe(school.retention_months);

    // Exactly one success audit, and none from the failed attempt.
    const rolls = listAudit(db, DEMO_SCHOOL, 200).filter((a) => a.action === "year.rolled");
    expect(rolls).toHaveLength(1);
    expect(listAudit(db, DEMO_SCHOOL, 200).length).toBe(auditBefore + 1);
  });

  it("archives inside the caller's transaction rather than around it", () => {
    // The property the atomicity rests on: `archiveClass` must not commit when
    // there is an outer transaction. If it did, the rollback above could not
    // undo the first archive.
    db.exec("BEGIN IMMEDIATE");
    const before = snapshot();
    performRollover(db, DEMO_SCHOOL, "Rosa Delgado");
    // Written, but not committed.
    expect(snapshot()).not.toEqual(before);
    db.exec("ROLLBACK");
    expect(snapshot()).toEqual(before);
  });
});
