import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

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

import { createTestDb, DEMO_ADMIN, DEMO_SCHOOL } from "./helpers";
import type { Db } from "@/lib/db";
import { setRetentionAction } from "@/app/actions/admin";
import { writeSession } from "@/lib/auth/session";
import { getSchool, listAudit } from "@/lib/repo/school";
import { listClasses, listStudents } from "@/lib/repo/classroom";
import { retentionRows } from "@/lib/domain/retention";
import { RETENTION_FAILED } from "@/lib/repo/audited";

let db: Db;
let cleanup: () => void;

/** A second school, to prove the write is scoped. */
const OTHER = "sch_other";

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  globalThis.__airkDb = db;
  db.prepare(
    `INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent, plan,
      licensed_students, term_starts_on, term_renews_on, academic_year, year_starts_on, year_ends_on,
      contact_name, contact_email, retention_months, benchmark_window, created_at)
     VALUES ('sch_other','Other','other','D','C','ST','OT','pine','school',500,'2025-08-18','2026-09-01',
             '2025-2026','2025-08-25','2026-06-12','C','c@x.demo',24,'closed','2025-07-01')`,
  ).run();
});
afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

/** Fixed dates, so eligibility is a fact rather than a function of "now". */
const BEFORE_3MONTH = new Date("2026-09-11T00:00:00.000Z");
const AFTER_3MONTH = new Date("2026-09-13T00:00:00.000Z");
const BEFORE_12MONTH = new Date("2027-06-11T00:00:00.000Z");

function derived(now: Date) {
  // By id, not `getPrimarySchool` — this fixture adds a second school on
  // purpose, and picking "the first one" would have silently measured the
  // wrong one's policy.
  const school = getSchool(db, DEMO_SCHOOL)!;
  return retentionRows(
    school,
    listClasses(db, DEMO_SCHOOL, true).map((c) => ({ ...c, studentCount: 0 })),
    now,
  ).map((r) => ({
    classId: r.classId,
    purgeOn: r.purgeOn ? r.purgeOn.toISOString() : null,
    eligibleNow: r.eligibleNow,
    blockedReason: r.blockedReason ?? null,
  }));
}

/** The exact set of classes the purge would act on at a given date. */
const eligibleAt = (now: Date) =>
  derived(now)
    .filter((r) => r.eligibleNow)
    .map((r) => r.classId)
    .sort();

function snapshot() {
  const dump = (sql: string) => JSON.stringify(db.prepare(sql).all());
  return {
    school: dump(`SELECT * FROM schools WHERE id = '${DEMO_SCHOOL}'`),
    otherSchool: dump(`SELECT * FROM schools WHERE id = '${OTHER}'`),
    classes: dump("SELECT * FROM classes ORDER BY id"),
    students: dump("SELECT * FROM students ORDER BY id"),
    attempts: dump("SELECT * FROM attempts ORDER BY id"),
    benchmarks: dump("SELECT * FROM benchmarks ORDER BY id"),
    audit: dump("SELECT action, detail FROM audit_log ORDER BY created_at, id"),
    derivedBefore: JSON.stringify(derived(BEFORE_3MONTH)),
    derivedAfter: JSON.stringify(derived(AFTER_3MONTH)),
    eligible3: JSON.stringify(eligibleAt(AFTER_3MONTH)),
    eligible12: JSON.stringify(eligibleAt(BEFORE_12MONTH)),
  };
}

const auditsOf = (action: string) =>
  listAudit(db, DEMO_SCHOOL, 500).filter((a) => a.action === action);

/**
 * The demo seed already contains one `retention.updated` row — the school's
 * original policy being set. Every assertion here is therefore a delta against
 * the baseline, not an absolute count, which is the difference between "this
 * action wrote one" and "one exists".
 */
const retentionAuditBaseline = () => auditsOf("retention.updated").length;

function failRetentionAudit(): void {
  db.exec(`
    CREATE TRIGGER _fail_audit BEFORE INSERT ON audit_log
    WHEN NEW.action = 'retention.updated'
    BEGIN
      SELECT RAISE(ABORT, 'injected audit failure');
    END;
  `);
}
const removeFailure = () => db.exec("DROP TRIGGER IF EXISTS _fail_audit");

async function signInAsAdmin() {
  jar.store.clear();
  await writeSession({ kind: "staff", userId: DEMO_ADMIN });
}

function form(months: unknown): FormData {
  const data = new FormData();
  data.set("retention_months", String(months));
  return data;
}

describe("the retention policy and its audit commit together", () => {
  it("returns a calm inline error and moves no deletion date when the audit fails", async () => {
    await signInAsAdmin();
    expect(getSchool(db, DEMO_SCHOOL)!.retention_months).toBe(12);
    const baseline = retentionAuditBaseline();
    const before = snapshot();

    failRetentionAudit();
    const result = await setRetentionAction({}, form(3));
    removeFailure();

    expect(result.error).toBe(RETENTION_FAILED);
    expect(result.ok).toBeUndefined();
    expect(RETENTION_FAILED).toMatch(/retention window was not changed/i);
    expect(RETENTION_FAILED).toMatch(/same scheduled deletion date it had before/i);
    expect(RETENTION_FAILED).toMatch(/no records were deleted/i);
    expect(RETENTION_FAILED).toMatch(/try again/i);
    // Never claims the failed attempt was recorded, and promises no support.
    expect(RETENTION_FAILED).not.toMatch(/\blogged\b|recorded|audit/i);
    for (const promise of [/account contact/i, /\bsupport\b/i, /within \d+ (?:minutes|hours|days)/i]) {
      expect(RETENTION_FAILED).not.toMatch(promise);
    }

    // School row, class rows, derived due dates, purge eligibility, audit rows,
    // and the other school — all exact.
    expect(snapshot()).toEqual(before);
    expect(auditsOf("retention.updated")).toHaveLength(baseline);
  });

  it("changes only retention_months on the retry, and moves due dates by exactly the policy", async () => {
    await signInAsAdmin();
    failRetentionAudit();
    await setRetentionAction({}, form(3));
    removeFailure();

    const baseline = retentionAuditBaseline();
    const before = snapshot();
    expect(getSchool(db, DEMO_SCHOOL)!.retention_months, "the failed attempt must have rolled back").toBe(12);
    const schoolBefore = getSchool(db, DEMO_SCHOOL)! as unknown as Record<string, unknown>;
    const auditBefore = listAudit(db, DEMO_SCHOOL, 500).length;
    const counts = {
      students: listStudents(db, "cls_room12").length,
      allStudents: (db.prepare("SELECT COUNT(*) AS n FROM students").get() as { n: number }).n,
      attempts: (db.prepare("SELECT COUNT(*) AS n FROM attempts").get() as { n: number }).n,
      benchmarks: (db.prepare("SELECT COUNT(*) AS n FROM benchmarks").get() as { n: number }).n,
    };

    const result = await setRetentionAction({}, form(3));

    expect(result.error).toBeUndefined();
    expect(result.ok).toMatch(/Retention set to 3 months after the school year ends/);

    // The school row differs in exactly one column.
    const schoolAfter = getSchool(db, DEMO_SCHOOL)! as unknown as Record<string, unknown>;
    const except = (row: Record<string, unknown>) => {
      const rest: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) if (k !== "retention_months") rest[k] = v;
      return rest;
    };
    expect(except(schoolAfter)).toEqual(except(schoolBefore));
    expect(schoolAfter.retention_months).toBe(3);

    // Every class row is byte-identical: the policy is not copied onto them.
    expect(JSON.stringify(db.prepare("SELECT * FROM classes ORDER BY id").all())).toBe(
      before.classes,
    );

    // Due dates move by exactly nine months, from each class's own year-end.
    for (const row of derived(BEFORE_3MONTH)) {
      const wasOn = JSON.parse(before.derivedBefore).find(
        (r: { classId: string }) => r.classId === row.classId,
      );
      const was = new Date(wasOn.purgeOn);
      const now = new Date(row.purgeOn!);
      const months =
        (now.getUTCFullYear() - was.getUTCFullYear()) * 12 +
        (now.getUTCMonth() - was.getUTCMonth());
      expect(months).toBe(3 - 12);
      // Same day of month, taken from the class's recorded year-end.
      expect(now.getUTCDate()).toBe(was.getUTCDate());
    }

    // Eligibility now follows the new policy at fixed boundary dates.
    expect(eligibleAt(BEFORE_3MONTH)).toEqual([]);
    expect(eligibleAt(AFTER_3MONTH)).toEqual(
      listClasses(db, DEMO_SCHOOL, true).map((c) => c.id).sort(),
    );

    // Nothing was deleted.
    expect((db.prepare("SELECT COUNT(*) AS n FROM students").get() as { n: number }).n).toBe(
      counts.allStudents,
    );
    expect((db.prepare("SELECT COUNT(*) AS n FROM attempts").get() as { n: number }).n).toBe(
      counts.attempts,
    );
    expect((db.prepare("SELECT COUNT(*) AS n FROM benchmarks").get() as { n: number }).n).toBe(
      counts.benchmarks,
    );

    // Exactly one audit, carrying the policy the screen reported.
    const entries = auditsOf("retention.updated");
    expect(entries).toHaveLength(baseline + 1);
    expect(entries[0].detail).toMatch(/retention set to 3 months after the school year ends/i);
    expect(listAudit(db, DEMO_SCHOOL, 500).length).toBe(auditBefore + 1);

    // And the other school is untouched.
    expect(JSON.stringify(db.prepare(`SELECT * FROM schools WHERE id = '${OTHER}'`).all())).toBe(
      before.otherSchool,
    );
    expect(getSchool(db, OTHER)!.retention_months).toBe(24);
  });

  it("refuses an option the product does not offer, and writes nothing", async () => {
    await signInAsAdmin();
    const baseline = retentionAuditBaseline();
    const before = snapshot();

    for (const bad of [7, 0, -12, "twelve", ""]) {
      const result = await setRetentionAction({}, form(bad));
      expect(result.error).toBe("Choose one of the available retention windows.");
      expect(result.ok).toBeUndefined();
    }

    expect(snapshot()).toEqual(before);
    expect(auditsOf("retention.updated")).toHaveLength(baseline);
  });
});
