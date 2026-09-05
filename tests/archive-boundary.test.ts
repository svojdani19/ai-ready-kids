import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

/** Same cookie jar shape a Server Action gets from `next/headers`. */
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

// `requireStudent` redirects when `currentStudent` returns null. Next's real
// redirect throws a framework error; this throws a recognizable one so the
// tests can tell "the action refused" from "the action blew up".
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import {
  createTestDb,
  DEMO_CLASS,
  DEMO_SCHOOL,
  DEMO_STUDENT,
  DEMO_TEACHER,
} from "./helpers";
import type { Db } from "@/lib/db";
import { currentStaff, currentStudent, writeSession } from "@/lib/auth/session";
import {
  archiveClass,
  createClass,
  getClass,
  listAssignments,
  listClasses,
  normalizeJoinCode,
  restoreClass,
} from "@/lib/repo/classroom";
import { licenseStatus } from "@/lib/repo/entitlement";
import { beginMission, submitCheckInAnswer, submitDecision } from "@/app/actions/student";
import { getAttempt, startAttempt } from "@/lib/repo/progress";
import { expectedDecisionSceneId } from "@/lib/domain/missionPath";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { MISSIONS } from "@/content/missions";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let db: Db;
let cleanup: () => void;

const codeOf = (classId: string) => normalizeJoinCode(getClass(db, classId)!.join_code);

/** Every row that must survive archiving, as a comparable snapshot. */
function snapshot() {
  const dump = (sql: string) => JSON.stringify(db.prepare(sql).all());
  return {
    students: dump("SELECT * FROM students ORDER BY id"),
    attempts: dump("SELECT * FROM attempts ORDER BY id"),
    benchmarks: dump("SELECT * FROM benchmarks ORDER BY id"),
    assignments: dump("SELECT * FROM assignments ORDER BY id"),
    users: dump("SELECT * FROM users ORDER BY id"),
    schools: dump("SELECT * FROM schools ORDER BY id"),
    // Everything about the class except the two columns archiving may change.
    classesExceptCredential: dump(
      `SELECT id, school_id, teacher_id, name, grade, school_year, year_ends_on, created_at
       FROM classes ORDER BY id`,
    ),
  };
}

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  globalThis.__airkDb = db;
  jar.store.clear();
});

afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

describe("archiving closes student access, not just the seat count", () => {
  it("rejects a student session on the next request after archive", async () => {
    await writeSession({ kind: "student", studentId: DEMO_STUDENT, code: codeOf(DEMO_CLASS) });
    expect((await currentStudent())?.student.id).toBe(DEMO_STUDENT);

    archiveClass(db, DEMO_CLASS);

    // FAILING-BEFORE: this returned the student and an archived classroom, so
    // every student page and instructional action carried on working.
    expect(await currentStudent()).toBeNull();
  });

  it("stays rejected after the class is restored", async () => {
    const original = codeOf(DEMO_CLASS);
    await writeSession({ kind: "student", studentId: DEMO_STUDENT, code: original });
    expect(await currentStudent()).not.toBeNull();

    archiveClass(db, DEMO_CLASS);
    expect(await currentStudent()).toBeNull();

    restoreClass(db, DEMO_CLASS);

    // The class is active again, and the old cookie is still no good: archiving
    // issued a new code, and the session is bound to the one it came in with.
    expect(getClass(db, DEMO_CLASS)!.archived_at).toBeNull();
    expect(codeOf(DEMO_CLASS)).not.toBe(original);
    expect(await currentStudent()).toBeNull();
  });

  it("lets a child back in with the code the class has now", async () => {
    archiveClass(db, DEMO_CLASS);
    restoreClass(db, DEMO_CLASS);

    // What `chooseStudent` writes after a fresh join with the current code.
    await writeSession({ kind: "student", studentId: DEMO_STUDENT, code: codeOf(DEMO_CLASS) });
    expect((await currentStudent())?.student.id).toBe(DEMO_STUDENT);
  });

  it("does not touch a student in a different class", async () => {
    const other = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Room 99",
      grade: 3,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-12",
    });
    await writeSession({ kind: "student", studentId: DEMO_STUDENT, code: codeOf(DEMO_CLASS) });

    archiveClass(db, other.id);

    expect((await currentStudent())?.student.id).toBe(DEMO_STUDENT);
  });

  it("leaves staff sessions alone", async () => {
    await writeSession({ kind: "staff", userId: DEMO_TEACHER });
    archiveClass(db, DEMO_CLASS);
    // The teacher still needs their tools; an archived class is theirs to
    // restore, rename or delete.
    expect((await currentStaff())?.user.id).toBe(DEMO_TEACHER);
  });
});

describe("archiving revokes exactly once", () => {
  it("issues one new code, and archiving again changes nothing", () => {
    const original = codeOf(DEMO_CLASS);

    archiveClass(db, DEMO_CLASS);
    const afterFirst = codeOf(DEMO_CLASS);
    const archivedAt = getClass(db, DEMO_CLASS)!.archived_at;
    expect(afterFirst).not.toBe(original);
    expect(archivedAt).toBeTruthy();

    // No-op: not a second code, and not a moved timestamp.
    archiveClass(db, DEMO_CLASS);
    archiveClass(db, DEMO_CLASS);
    expect(codeOf(DEMO_CLASS)).toBe(afterFirst);
    expect(getClass(db, DEMO_CLASS)!.archived_at).toBe(archivedAt);
  });

  it("is a no-op for a class that does not exist", () => {
    const before = snapshot();
    expect(() => archiveClass(db, "cls_nope")).not.toThrow();
    expect(snapshot()).toEqual(before);
  });

  it("rotates once through the rollover path too", () => {
    // The rollover archives every class of the outgoing year. Same repository
    // function, so the revocation is not a property of one action.
    const active = listClasses(db, DEMO_SCHOOL, false);
    expect(active.length).toBeGreaterThan(1);
    const codesBefore = new Map(active.map((c) => [c.id, normalizeJoinCode(c.join_code)]));

    for (const c of active) archiveClass(db, c.id);
    const afterFirst = new Map(
      listClasses(db, DEMO_SCHOOL, true).map((c) => [c.id, normalizeJoinCode(c.join_code)]),
    );
    for (const [id, before] of codesBefore) expect(afterFirst.get(id)).not.toBe(before);

    // A second sweep over classes that are already archived changes nothing.
    for (const c of listClasses(db, DEMO_SCHOOL, true)) archiveClass(db, c.id);
    for (const [id, code] of afterFirst) {
      expect(normalizeJoinCode(getClass(db, id)!.join_code)).toBe(code);
    }
  });
});

describe("archiving changes the credential and nothing else", () => {
  it("preserves every record row for row, apart from archived_at and join_code", () => {
    const before = snapshot();
    const classBefore = getClass(db, DEMO_CLASS)!;

    archiveClass(db, DEMO_CLASS);

    const after = snapshot();
    for (const key of Object.keys(before) as (keyof typeof before)[]) {
      expect(after[key], `${key} changed`).toBe(before[key]);
    }

    const classAfter = getClass(db, DEMO_CLASS)!;
    expect(classAfter.year_ends_on).toBe(classBefore.year_ends_on);
    expect(classAfter.school_year).toBe(classBefore.school_year);
    expect(classAfter.teacher_id).toBe(classBefore.teacher_id);
    expect(classAfter.archived_at).toBeTruthy();
    expect(classAfter.join_code).not.toBe(classBefore.join_code);
  });

  it("frees the licensed seats the roster was using", () => {
    const before = licenseStatus(db, DEMO_SCHOOL);
    const roster = db
      .prepare("SELECT COUNT(*) AS n FROM students WHERE class_id = ?")
      .get(DEMO_CLASS) as { n: number };
    expect(roster.n).toBeGreaterThan(0);

    archiveClass(db, DEMO_CLASS);

    expect(licenseStatus(db, DEMO_SCHOOL).used).toBe(before.used - roster.n);
  });

  it("refuses the real student actions after archive, and writes nothing", async () => {
    // The first version of this test called the repository behind
    // `if (resolved)` — a branch that is unreachable once the fix is in, so it
    // proved `currentStudent` returns null a second time and nothing about the
    // actions. These are the exported Server Actions a child's browser posts
    // to, called directly, with no resolver check in front of them.
    // Assigned to this class and not already finished by this child, so the
    // attempt has a live decision point to post at.
    const assigned = new Set(listAssignments(db, DEMO_CLASS).map((a) => a.mission_id));
    const mission = MISSIONS.find(
      (m) => assigned.has(m.id) && !getAttempt(db, DEMO_STUDENT, m.id)?.completed_at,
    )!;
    expect(mission).toBeTruthy();

    await writeSession({ kind: "student", studentId: DEMO_STUDENT, code: codeOf(DEMO_CLASS) });
    // A real, reachable scene and choice: on the old implementation this call
    // appended to path_json and merged evidence_json.
    startAttempt(db, DEMO_STUDENT, mission.id);
    const sceneId = expectedDecisionSceneId(mission, getAttempt(db, DEMO_STUDENT, mission.id)!.path);
    expect(sceneId, "the fixture must offer a live decision point").not.toBeNull();
    const scene = mission.scenes.find((sc) => sc.id === sceneId)!;
    const choice = scene.choices!.find((c) => !c.retry)!;

    // The check-in this child could otherwise answer.
    db.prepare("UPDATE schools SET benchmark_window = 'pre' WHERE id = ?").run(DEMO_SCHOOL);
    db.prepare("DELETE FROM benchmarks WHERE student_id = ?").run(DEMO_STUDENT);
    const item = BENCHMARK_FORMS.pre.items[0];

    archiveClass(db, DEMO_CLASS);

    const attemptRows = () =>
      JSON.stringify(
        db.prepare("SELECT * FROM attempts WHERE student_id = ? ORDER BY id").all(DEMO_STUDENT),
      );
    const benchmarkRows = () =>
      JSON.stringify(
        db.prepare("SELECT * FROM benchmarks WHERE student_id = ? ORDER BY id").all(DEMO_STUDENT),
      );
    const attemptsBefore = attemptRows();
    const benchmarksBefore = benchmarkRows();

    // Returns its refusal rather than hiding it behind a redirect.
    const decision = await submitDecision({
      slug: mission.slug,
      sceneId: scene.id,
      choiceId: choice.id,
    });
    expect(decision).toEqual({ ok: false, error: "That mission is not open for your class." });

    const checkIn = await submitCheckInAnswer({
      form: "pre",
      itemId: item.id,
      optionId: item.options[0].id,
    });
    expect(checkIn).toEqual({ ok: false, error: "That check-in is not open." });

    // `beginMission` has no return value to inspect, so its refusal is the
    // redirect `requireStudent` performs.
    await expect(beginMission(mission.slug)).rejects.toThrow(/REDIRECT:\/join/);

    // Byte for byte, including path_json, evidence_json and completed_at.
    expect(attemptRows()).toBe(attemptsBefore);
    expect(benchmarkRows()).toBe(benchmarksBefore);
  });
});

describe("the copy says what archiving now does", () => {
  const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
  const copyOf = (p: string) =>
    src(p)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1")
      .replace(/^import[^\n]*$/gm, "")
      .replace(/\s+/g, " ");

  /** One anchored extraction, no fallback — sprint 68's lesson. */
  function only(path: string, pattern: RegExp): string {
    const found = [...copyOf(path).matchAll(pattern)].map((m) => m[1]);
    expect(found, `expected one match in ${path}, found ${found.length}`).toHaveLength(1);
    return found[0].replace(/\$\{classroom\.name\}/g, "Room 12");
  }

  it("tells the administrator about sessions and the code before they commit", () => {
    const question = only(
      "src/app/admin/classes/page.tsx",
      /question=\{`(Archive \$\{classroom\.name\}\?[^`]*)`\}/g,
    );
    expect(question).toMatch(/^Archive Room 12\?/);
    // The old sentence, which described only half of what archiving did even
    // then and none of what it does now.
    expect(question).not.toMatch(/^Archive Room 12\? Students can no longer join\. Its deletion date does not change\.$/);
    expect(question).toMatch(/already signed in is asked to rejoin next time they load a page/i);
    expect(question).toMatch(/new join code/i);
    expect(question).toMatch(/will not work even if you restore it/i);
    // And what does not change stays said.
    expect(question).toMatch(/roster, mission history, check-ins and the deletion date do not change/i);
    // No real-time erasure implied.
    expect(question).not.toMatch(/\bimmediately\b|\bstraight away\b|signed out at once/i);
  });

  it("says the same in the audit entry and the rollover result", () => {
    const admin = copyOf("src/app/actions/admin.ts");
    expect(admin).toMatch(/archived\. Students cannot join and those already signed in are rejected on their next request/i);
    expect(admin).toMatch(/issued a new join code, so the old one stays invalid even if the class is restored/i);
    // The rollover's success message stays with the action; sprint 70 moved
    // its audit detail into the transaction that writes it.
    expect(admin).toMatch(/Archived classes have new join codes and their students are signed out on their next request/i);
    const rollover = copyOf("src/lib/repo/rollover.ts");
    expect(rollover).toMatch(/each issued a new join code, with students signed out on their next request/i);
  });

  it("warns in the rollover preview, before the button", () => {
    const preview = copyOf("src/app/admin/program/RolloverForm.tsx");
    expect(preview).toMatch(/new join code/i);
    expect(preview).toMatch(/asked to rejoin on their next request/i);
    expect(preview).toMatch(/stay invalid even if you restore a class later/i);
  });

  it("no longer describes archiving as merely keeping a class out of the way", () => {
    // These facts used to be in the page description, three sentences above the
    // button. They are now in the confirmation an administrator reads with
    // their finger on Archive, which is where a consequence belongs — so this
    // asserts on that confirmation rather than on the page's opening line.
    const page = copyOf("src/app/admin/classes/page.tsx");
    expect(page).not.toMatch(/keeps a finished class out of the way/i);

    const archive = page.match(/question=\{`Archive[^`]*`\}/)?.[0] ?? "";
    expect(archive, "no archive confirmation found to assert on").not.toBe("");
    // Children already signed in lose access; it is not merely a join block.
    expect(archive).toMatch(/already signed in is asked to rejoin/i);
    // The records claim survives, because it is still true.
    expect(archive).toMatch(/mission history, check-ins and the deletion date do not change/i);
  });
});
