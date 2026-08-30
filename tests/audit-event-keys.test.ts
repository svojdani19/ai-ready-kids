import { describe, expect, it } from "vitest";
import { beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const jar = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    api: {
      get: (n: string) => (store.has(n) ? { name: n, value: store.get(n)! } : undefined),
      set: (n: string, v: string) => void store.set(n, v),
      delete: (n: string) => void store.delete(n),
    },
  };
});
vi.mock("next/headers", () => ({ cookies: async () => jar.api, headers: async () => new Map() }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/**
 * Persisted audit identifiers are data, not prose.
 *
 * `audit_log.action` values are machine keys: they are written into a school's
 * database and read back by whoever later exports it, migrates it, answers a
 * support question about it, or builds a report on it. A key is the same string
 * forever or it is two different events.
 *
 * Sprint 77's American-English conversion swept four of them from `_licence` to
 * `_license` along with the product's prose. Nothing rendered changed and no
 * query broke, which is exactly why it was easy to miss: the damage would have
 * appeared later, in a database holding both spellings of one event with no
 * record of why.
 *
 * These four are pinned here. The rule is not "British spelling" — it is that a
 * stored identifier does not get localized, spell-checked or normalized, and
 * changing one is a migration rather than an edit. The details, messages and
 * labels beside them are prose and stay American.
 */
const STABLE_EVENT_KEYS = [
  "class.restore_blocked_by_licence",
  "class.restore_blocked_by_licence_config",
  "roster.blocked_by_licence",
  "roster.blocked_by_licence_config",
] as const;

const ACTION_FILES = ["src/app/actions/admin.ts", "src/app/actions/teacher.ts"];

describe("persisted audit event keys are stable identifiers", () => {
  it.each(STABLE_EVENT_KEYS)("%s is the value written", (key) => {
    const written = ACTION_FILES.map(src).join("\n");
    expect(written).toContain(`action: "${key}"`);
  });

  it("no American-spelled variant of these four is written anywhere", () => {
    // The spelling-normalized forms, which sprint 77 introduced and sprint 78
    // took back out. If one reappears, one event type has two keys again.
    const everywhere = [...ACTION_FILES, "src/lib/repo/audited.ts"].map(src).join("\n");
    for (const key of STABLE_EVENT_KEYS) {
      const normalized = key.replace("licence", "license");
      expect(everywhere, `${normalized} must not be written`).not.toContain(
        `action: "${normalized}"`,
      );
    }
  });

  it("keeps the rendered detail beside each key in American English", () => {
    // The key is data; the sentence a school reads is prose. Both at once.
    const admin = src("src/app/actions/admin.ts");
    const teacher = src("src/app/actions/teacher.ts");
    for (const body of [admin, teacher]) {
      // Details mention the seat license, spelled the American way.
      const details = [...body.matchAll(/detail: `([^`]*)`/g)].map((m) => m[1]).join(" ");
      expect(details).not.toMatch(/\blicence\b/);
    }
    expect(admin).toMatch(/seat license is not a recognized number/);
    expect(teacher).toMatch(/seat license is not a recognized number/);
  });

  it("is not written by any schema, migration or seed", () => {
    // Nothing bakes these into a database shape, so restoring them needed no
    // migration — a fact this test keeps true.
    for (const p of ["src/lib/db/schema.ts", "src/lib/db/migrations.ts", "src/lib/db/seed.ts"]) {
      expect(src(p)).not.toContain("blocked_by_lic");
    }
  });
});


import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import { addStudentAction } from "@/app/actions/teacher";
import { restoreClassAction } from "@/app/actions/admin";
import { writeSession } from "@/lib/auth/session";
import { listAudit } from "@/lib/repo/school";
import { archiveClass, listStudents } from "@/lib/repo/classroom";

let db: Db;
let cleanup: () => void;

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  globalThis.__airkDb = db;
});
afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

const auditsOf = (action: string) =>
  listAudit(db, DEMO_SCHOOL, 500).filter((a) => a.action === action);

async function asTeacher() {
  jar.store.clear();
  await writeSession({ kind: "staff", userId: DEMO_TEACHER });
}

function addForm(displayName: string): FormData {
  const data = new FormData();
  data.set("classId", DEMO_CLASS);
  data.set("displayName", displayName);
  return data;
}

/**
 * The two roster keys had source-text coverage only. Driving the real action
 * proves the string that reaches `audit_log.action`, which is the thing that
 * has to stay stable — a source assertion would still pass if the value were
 * rewritten on the way to the database.
 */
describe("the roster refusal keys, written by the real action", () => {
  it("an over-license enrollment writes roster.blocked_by_licence", async () => {
    await asTeacher();
    // One seat short of the roster that already exists.
    const active = listStudents(db, DEMO_CLASS).length;
    db.prepare("UPDATE schools SET licensed_students = ? WHERE id = ?").run(active, DEMO_SCHOOL);

    const result = await addStudentAction({}, addForm("Newcomer P."));

    expect(result.error).toBeTruthy();
    expect(auditsOf("roster.blocked_by_licence")).toHaveLength(1);
    expect(auditsOf("roster.blocked_by_license")).toHaveLength(0);
    // The sentence the school reads is American, and names no child.
    const entry = auditsOf("roster.blocked_by_licence")[0];
    expect(entry.detail).toMatch(/An enrollment was declined/);
    expect(entry.detail).not.toMatch(/Newcomer/);
    expect(listStudents(db, DEMO_CLASS)).toHaveLength(active);
  });

  it("a malformed seat license writes roster.blocked_by_licence_config", async () => {
    await asTeacher();
    // Outside 1-5000, so an account-record problem rather than an overage.
    db.prepare("UPDATE schools SET licensed_students = -7 WHERE id = ?").run(DEMO_SCHOOL);
    const before = listStudents(db, DEMO_CLASS).length;

    const result = await addStudentAction({}, addForm("Newcomer P."));

    expect(result.error).toBeTruthy();
    expect(auditsOf("roster.blocked_by_licence_config")).toHaveLength(1);
    expect(auditsOf("roster.blocked_by_licence_config")[0].detail).toMatch(
      /seat license is not a recognized number/,
    );
    // Never echoes the malformed value back.
    expect(auditsOf("roster.blocked_by_licence_config")[0].detail).not.toMatch(/-7/);
    expect(listStudents(db, DEMO_CLASS)).toHaveLength(before);
  });
});

describe("the class restore refusal keys, written by the real action", () => {
  it("an over-license restore writes class.restore_blocked_by_licence", async () => {
    jar.store.clear();
    await writeSession({ kind: "staff", userId: "usr_delgado" });
    archiveClass(db, DEMO_CLASS);
    const roster = listStudents(db, DEMO_CLASS).length;
    const active = (
      db.prepare(
        "SELECT COUNT(*) AS n FROM students WHERE class_id IN (SELECT id FROM classes WHERE archived_at IS NULL)",
      ).get() as { n: number }
    ).n;
    db.prepare("UPDATE schools SET licensed_students = ? WHERE id = ?").run(
      active + roster - 1,
      DEMO_SCHOOL,
    );

    const result = await restoreClassAction(DEMO_CLASS);

    expect(result.error).toBeTruthy();
    expect(auditsOf("class.restore_blocked_by_licence")).toHaveLength(1);
    expect(auditsOf("class.restore_blocked_by_license")).toHaveLength(0);
    expect(auditsOf("class.restore_blocked_by_licence")[0].detail).toMatch(/licensed students/);
  });
});
