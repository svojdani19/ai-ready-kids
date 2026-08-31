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

import {
  createTestDb,
  DEMO_ADMIN,
  DEMO_CLASS,
  DEMO_SCHOOL,
} from "./helpers";
import type { Db } from "@/lib/db";
import { setBenchmarkWindowAction } from "@/app/actions/admin";
import { submitCheckInAnswer } from "@/app/actions/student";
import { writeSession } from "@/lib/auth/session";
import { getSchool, listAudit } from "@/lib/repo/school";
import { listBenchmarksForStudent } from "@/lib/repo/progress";
import { getClass, normalizeJoinCode } from "@/lib/repo/classroom";
import { canTakeBenchmark, nextBenchmarkFor } from "@/lib/domain/eligibility";
import { BENCHMARK_WINDOW_FAILED } from "@/lib/repo/audited";
import { BENCHMARK_FORMS } from "@/content/benchmark";

let db: Db;
let cleanup: () => void;

const OTHER = "sch_other";

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  globalThis.__airkDb = db;
  db.prepare(
    `INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent, plan,
      licensed_students, term_starts_on, term_renews_on, academic_year, year_starts_on, year_ends_on,
      contact_name, contact_email, retention_months, benchmark_window, created_at)
     VALUES ('sch_other','Other','other','D','C','ST','OT','pine','school',500,'2025-08-18','2026-09-01',
             '2025-2026','2025-08-25','2026-06-12','C','c@x.demo',12,'pre','2025-07-01')`,
  ).run();
});
afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

/** A child with no benchmark record at all, so eligibility is unambiguous. */
function freshChild(): string {
  const id = "stu_fresh_probe";
  db.prepare(
    "INSERT INTO students (id, class_id, display_name, avatar_key, created_at) VALUES (?,?,?,?,?)",
  ).run(id, DEMO_CLASS, "Probe F.", "owl", "2025-08-20T00:00:00.000Z");
  return id;
}

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
  };
}

/** What the product would offer this child right now. */
function offeredTo(studentId: string) {
  const school = getSchool(db, DEMO_SCHOOL)!;
  const records = listBenchmarksForStudent(db, studentId);
  return {
    next: nextBenchmarkFor(records, school.benchmark_window, 3),
    pre: canTakeBenchmark({ window: school.benchmark_window, form: "pre", records , grade: 3 }),
    post: canTakeBenchmark({ window: school.benchmark_window, form: "post", records , grade: 3 }),
  };
}

const auditsOf = (action: string) =>
  listAudit(db, DEMO_SCHOOL, 500).filter((a) => a.action === action);

function failWindowAudit(): void {
  db.exec(`
    CREATE TRIGGER _fail_audit BEFORE INSERT ON audit_log
    WHEN NEW.action = 'benchmark.window'
    BEGIN
      SELECT RAISE(ABORT, 'injected audit failure');
    END;
  `);
}
const removeFailure = () => db.exec("DROP TRIGGER IF EXISTS _fail_audit");

const signInAsAdmin = async () => {
  jar.store.clear();
  await writeSession({ kind: "staff", userId: DEMO_ADMIN });
};
const signInAsStudent = async (studentId: string) => {
  jar.store.clear();
  await writeSession({
    kind: "student",
    studentId,
    code: normalizeJoinCode(getClass(db, DEMO_CLASS)!.join_code),
  });
};

function form(window: unknown): FormData {
  const data = new FormData();
  data.set("window", String(window));
  return data;
}

const setWindow = (w: string) =>
  db.prepare("UPDATE schools SET benchmark_window = ? WHERE id = ?").run(w, DEMO_SCHOOL);

describe("a failed window change leaves children offered exactly what they were", () => {
  it("closed → fall: the child is still offered nothing, and the endpoint still refuses", async () => {
    setWindow("closed");
    const child = freshChild();
    await signInAsAdmin();

    expect(offeredTo(child)).toEqual({ next: null, pre: false, post: false });
    const before = snapshot();
    const baseline = auditsOf("benchmark.window").length;

    failWindowAudit();
    const result = await setBenchmarkWindowAction({}, form("pre"));
    removeFailure();

    expect(result.error).toBe(BENCHMARK_WINDOW_FAILED);
    expect(result.ok).toBeUndefined();
    expect(getSchool(db, DEMO_SCHOOL)!.benchmark_window).toBe("closed");
    expect(offeredTo(child)).toEqual({ next: null, pre: false, post: false });

    // The real endpoint a child's browser posts to, as that child.
    await signInAsStudent(child);
    const item = BENCHMARK_FORMS.pre.items[0];
    const answer = await submitCheckInAnswer({
      form: "pre",
      itemId: item.id,
      optionId: item.options[0].id,
    });
    expect(answer).toEqual({ ok: false, error: "That check-in is not open." });
    expect(listBenchmarksForStudent(db, child)).toEqual([]);
    await signInAsAdmin();

    expect(snapshot()).toEqual(before);
    expect(auditsOf("benchmark.window")).toHaveLength(baseline);
  });

  it("fall → closed: an unfinished fall record stays resumable and exact", async () => {
    setWindow("pre");
    const child = freshChild();
    // A part-finished fall check-in, the state a mid-form class is in.
    const item = BENCHMARK_FORMS.pre.items[0];
    await signInAsStudent(child);
    expect(
      await submitCheckInAnswer({ form: "pre", itemId: item.id, optionId: item.options[0].id }),
    ).toEqual({ ok: true });
    await signInAsAdmin();

    const recordBefore = JSON.stringify(listBenchmarksForStudent(db, child));
    expect(offeredTo(child).next).toEqual({ form: "pre", resuming: true });
    const before = snapshot();
    const baseline = auditsOf("benchmark.window").length;

    failWindowAudit();
    const result = await setBenchmarkWindowAction({}, form("closed"));
    removeFailure();

    expect(result.error).toBe(BENCHMARK_WINDOW_FAILED);
    expect(getSchool(db, DEMO_SCHOOL)!.benchmark_window).toBe("pre");
    // Still resumable, and the saved option is untouched.
    expect(offeredTo(child).next).toEqual({ form: "pre", resuming: true });
    expect(offeredTo(child).pre).toBe(true);
    expect(JSON.stringify(listBenchmarksForStudent(db, child))).toBe(recordBefore);
    expect(snapshot()).toEqual(before);
    expect(auditsOf("benchmark.window")).toHaveLength(baseline);
  });

  it("fall → spring: fall stays the only eligible form", async () => {
    setWindow("pre");
    const child = freshChild();
    await signInAsAdmin();

    expect(offeredTo(child)).toEqual({
      next: { form: "pre", resuming: false },
      pre: true,
      post: false,
    });
    const before = snapshot();
    const baseline = auditsOf("benchmark.window").length;

    failWindowAudit();
    const result = await setBenchmarkWindowAction({}, form("post"));
    removeFailure();

    expect(result.error).toBe(BENCHMARK_WINDOW_FAILED);
    expect(getSchool(db, DEMO_SCHOOL)!.benchmark_window).toBe("pre");
    expect(offeredTo(child)).toEqual({
      next: { form: "pre", resuming: false },
      pre: true,
      post: false,
    });
    expect(snapshot()).toEqual(before);
    expect(auditsOf("benchmark.window")).toHaveLength(baseline);
  });

  it("says what did not happen, and claims nothing that did not", () => {
    expect(BENCHMARK_WINDOW_FAILED).toMatch(/check-in window was not changed/i);
    expect(BENCHMARK_WINDOW_FAILED).toMatch(/still offered exactly the same check-in as before/i);
    expect(BENCHMARK_WINDOW_FAILED).toMatch(
      /started no child, stopped no child, and moved nobody to a different check-in/i,
    );
    expect(BENCHMARK_WINDOW_FAILED).toMatch(/try again/i);
    expect(BENCHMARK_WINDOW_FAILED).not.toMatch(/\blogged\b|recorded|audit/i);
    for (const promise of [/account contact/i, /\bsupport\b/i, /within \d+ (?:minutes|hours|days)/i]) {
      expect(BENCHMARK_WINDOW_FAILED).not.toMatch(promise);
    }
  });
});

describe("the retry changes the window and nothing else", () => {
  it("opens the fall window, writes one audit, and starts nobody", async () => {
    setWindow("closed");
    const child = freshChild();
    await signInAsAdmin();

    failWindowAudit();
    await setBenchmarkWindowAction({}, form("pre"));
    removeFailure();
    expect(getSchool(db, DEMO_SCHOOL)!.benchmark_window).toBe("closed");

    const before = snapshot();
    const schoolBefore = getSchool(db, DEMO_SCHOOL)! as unknown as Record<string, unknown>;
    const baseline = auditsOf("benchmark.window").length;
    const auditTotal = listAudit(db, DEMO_SCHOOL, 500).length;

    const result = await setBenchmarkWindowAction({}, form("pre"));

    expect(result.error).toBeUndefined();
    expect(result.ok).toBe("Open: students are now offered the fall check-in.");

    // The school row differs in exactly one column.
    const after = getSchool(db, DEMO_SCHOOL)! as unknown as Record<string, unknown>;
    const except = (row: Record<string, unknown>) => {
      const rest: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) if (k !== "benchmark_window") rest[k] = v;
      return rest;
    };
    expect(except(after)).toEqual(except(schoolBefore));
    expect(after.benchmark_window).toBe("pre");

    // Eligibility follows the window exactly.
    expect(offeredTo(child)).toEqual({
      next: { form: "pre", resuming: false },
      pre: true,
      post: false,
    });

    // Opening a window starts nobody: no benchmark row, no attempt, no roster
    // change anywhere.
    expect(listBenchmarksForStudent(db, child)).toEqual([]);
    for (const key of ["classes", "students", "attempts", "benchmarks"] as const) {
      expect(JSON.stringify(db.prepare(`SELECT * FROM ${key} ORDER BY id`).all())).toBe(
        before[key],
      );
    }

    // Exactly one audit, whose detail matches what the administrator was told.
    const entries = auditsOf("benchmark.window");
    expect(entries).toHaveLength(baseline + 1);
    expect(entries[0].detail).toBe("Check-ins set to the fall window.");
    expect(listAudit(db, DEMO_SCHOOL, 500).length).toBe(auditTotal + 1);

    // The other school keeps its own window.
    expect(JSON.stringify(db.prepare(`SELECT * FROM schools WHERE id = '${OTHER}'`).all())).toBe(
      before.otherSchool,
    );
    expect(getSchool(db, OTHER)!.benchmark_window).toBe("pre");
  });

  it("closes the window and stops offering either form", async () => {
    setWindow("pre");
    const child = freshChild();
    await signInAsAdmin();

    const result = await setBenchmarkWindowAction({}, form("closed"));

    expect(result.ok).toBe("Check-ins are closed. No student can start or resume either form.");
    expect(offeredTo(child)).toEqual({ next: null, pre: false, post: false });
    expect(auditsOf("benchmark.window").some((a) => a.detail === "Check-ins set to closed.")).toBe(
      true,
    );
  });
});

describe("the existing refusals still refuse, and write nothing", () => {
  it("rejects a window the product does not offer", async () => {
    await signInAsAdmin();
    const before = snapshot();
    const baseline = auditsOf("benchmark.window").length;

    for (const bad of ["", "summer", "PRE", "1", "null"]) {
      const result = await setBenchmarkWindowAction({}, form(bad));
      expect(result.error).toBe("Choose closed, fall or spring.");
      expect(result.ok).toBeUndefined();
    }

    expect(snapshot()).toEqual(before);
    expect(auditsOf("benchmark.window")).toHaveLength(baseline);
  });

  it("refuses while the subscription is lapsed, before any write", async () => {
    await signInAsAdmin();
    setWindow("closed");
    db.prepare("UPDATE schools SET term_renews_on = '2020-09-01' WHERE id = ?").run(DEMO_SCHOOL);
    const before = snapshot();
    const baseline = auditsOf("benchmark.window").length;

    const result = await setBenchmarkWindowAction({}, form("pre"));

    // The term refusal, not the operational-failure message.
    expect(result.error).toBeTruthy();
    expect(result.error).not.toBe(BENCHMARK_WINDOW_FAILED);
    expect(result.error).toMatch(/subscription/i);
    expect(getSchool(db, DEMO_SCHOOL)!.benchmark_window).toBe("closed");
    expect(snapshot()).toEqual(before);
    expect(auditsOf("benchmark.window")).toHaveLength(baseline);
  });
});
