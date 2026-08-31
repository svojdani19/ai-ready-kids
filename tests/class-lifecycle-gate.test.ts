import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** The cookie jar a Server Action gets from `next/headers`. */
const jar = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    api: {
      get: (n: string) => (store.has(n) ? { name: n, value: store.get(n)! } : undefined),
      set: (n: string, v: string) => {
        store.set(n, v);
      },
      delete: (n: string) => {
        store.delete(n);
      },
    },
  };
});

vi.mock("next/headers", () => ({ cookies: async () => jar.api, headers: async () => new Map() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import type { Db } from "@/lib/db";
import { writeSession } from "@/lib/auth/session";
import { archiveClass, getClass, restoreClass } from "@/lib/repo/classroom";
import {
  CLASS_OPERATIONS,
  classArchivedRefusal,
  type ClassOperation,
} from "@/lib/auth/class-state";
import {
  LAPSED_WRITE_REFUSAL,
  UNVERIFIED_WRITE_REFUSAL,
} from "@/lib/domain/subscription";
import { MISSIONS } from "@/content/missions";
import {
  addStudentAction,
  removeStudentAction,
  renameStudentAction,
  rotateJoinCodeAction,
  setAssignmentAction,
} from "@/app/actions/teacher";

let db: Db;
let cleanup: () => void;

/**
 * Everything a parked class promises to keep, as one comparable value.
 *
 * Archiving takes the cohort out of the seat count and closes student sessions.
 * It does not empty the class: the roster, every attempt, every check-in, every
 * badge and every assignment stay stored, and a restore brings them all back.
 * A refused mutation must leave all of it byte-identical, and must leave the
 * audit log alone too — a refusal is not an event.
 */
function snapshot() {
  const dump = (sql: string) => JSON.stringify(db.prepare(sql).all());
  return {
    classes: dump("SELECT * FROM classes ORDER BY id"),
    students: dump("SELECT * FROM students ORDER BY id"),
    attempts: dump("SELECT * FROM attempts ORDER BY id"),
    benchmarks: dump("SELECT * FROM benchmarks ORDER BY id"),
    assignments: dump("SELECT * FROM assignments ORDER BY id"),
    audit: dump("SELECT * FROM audit_log ORDER BY id"),
  };
}

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

const studentOn = (classId: string) =>
  db.prepare("SELECT id, display_name FROM students WHERE class_id = ? ORDER BY id LIMIT 1").get(
    classId,
  ) as { id: string; display_name: string };

/** A mission the demo class does not already have, so assigning is a real change. */
const unassignedMission = () => {
  const held = new Set(
    db
      .prepare("SELECT mission_id FROM assignments WHERE class_id = ?")
      .all(DEMO_CLASS)
      .map((r) => (r as { mission_id: string }).mission_id),
  );
  return MISSIONS.find((m) => !held.has(m.id))!;
};

/**
 * Each classroom mutation, called the way a teacher's form or button calls it.
 *
 * Every one goes through the real exported Server Action with a real signed
 * teacher session. Nothing here reaches into the resolver: the claim is about
 * what an action does, not about what a helper returns.
 */
const MUTATIONS: {
  operation: ClassOperation;
  name: string;
  run: () => Promise<{ error?: string; ok?: string }>;
}[] = [
  {
    operation: "add_student",
    name: "addStudentAction",
    run: () =>
      addStudentAction({}, form({ classId: DEMO_CLASS, displayName: "Newcomer N." })),
  },
  {
    operation: "rename_student",
    name: "renameStudentAction",
    run: () =>
      renameStudentAction(
        {},
        form({
          classId: DEMO_CLASS,
          studentId: studentOn(DEMO_CLASS).id,
          displayName: "Renamed R.",
        }),
      ),
  },
  {
    operation: "remove_student",
    name: "removeStudentAction",
    run: () => removeStudentAction(DEMO_CLASS, studentOn(DEMO_CLASS).id),
  },
  {
    operation: "rotate_code",
    name: "rotateJoinCodeAction",
    run: () => rotateJoinCodeAction(DEMO_CLASS),
  },
  {
    operation: "set_assignment",
    name: "setAssignmentAction",
    run: () =>
      setAssignmentAction({
        classId: DEMO_CLASS,
        missionId: unassignedMission().id,
        assigned: true,
      }),
  },
];

beforeEach(async () => {
  ({ db, cleanup } = createTestDb());
  globalThis.__airkDb = db;
  jar.store.clear();
  await writeSession({ kind: "staff", userId: DEMO_TEACHER });
});

afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

/**
 * The finding. Three of these five never checked `archived_at`, and three
 * consecutive reviews named only two of the three — `addStudentAction` was
 * missed every time, while enrolling a child into a finished cohort and
 * consuming a licensed seat.
 */
describe("no classroom mutation touches a parked class", () => {
  it.each(MUTATIONS.map((m) => [m.name, m] as const))(
    "%s refuses while the class is archived",
    async (_n, mutation) => {
      archiveClass(db, DEMO_CLASS);
      const before = snapshot();

      const result = await mutation.run();

      expect(result.error).toBe(classArchivedRefusal(mutation.operation));
      expect(result.ok).toBeUndefined();
      // Nothing moved, and no audit row was written: a refusal is not an event.
      expect(snapshot()).toEqual(before);
    },
  );

  it.each(MUTATIONS.map((m) => [m.name, m] as const))(
    "%s works again once the class is restored",
    async (_n, mutation) => {
      archiveClass(db, DEMO_CLASS);
      expect((await mutation.run()).error).toBe(classArchivedRefusal(mutation.operation));

      restoreClass(db, DEMO_CLASS);
      const after = await mutation.run();

      // The refusal is gone. Whatever else the action decides is its own
      // business — this asserts only that the lifecycle no longer refuses it.
      expect(after.error).not.toBe(classArchivedRefusal(mutation.operation));
      expect(getClass(db, DEMO_CLASS)!.archived_at).toBeNull();
    },
  );

  it("refuses above the transaction, taking no write lock", async () => {
    archiveClass(db, DEMO_CLASS);
    // An audit trigger armed on the table every one of these would write to.
    // If any mutation reached its transaction, this fires and the refusal
    // becomes a different message.
    db.exec(`CREATE TRIGGER refuse_probe BEFORE INSERT ON audit_log
             BEGIN SELECT RAISE(ABORT, 'reached the transaction'); END`);
    try {
      for (const mutation of MUTATIONS) {
        const result = await mutation.run();
        expect(result.error, mutation.name).toBe(classArchivedRefusal(mutation.operation));
      }
    } finally {
      db.exec("DROP TRIGGER refuse_probe");
    }
  });
});

describe("the refusal says which thing it is refusing", () => {
  it("gives every operation its own sentence", () => {
    const sentences = Object.keys(CLASS_OPERATIONS).map((op) =>
      classArchivedRefusal(op as ClassOperation),
    );
    // A single generic message would leave a teacher to work out which of four
    // things they just tried is the one being refused.
    expect(new Set(sentences).size).toBe(sentences.length);
    for (const s of sentences) {
      expect(s).toMatch(/^That class is archived\. Restore the class before .+\.$/);
    }
  });

  it("covers every operation the resolver accepts, and no more", () => {
    const source = readFileSync(join(process.cwd(), "src/app/actions/teacher.ts"), "utf8");
    const used = new Set(
      [...source.matchAll(/requireOwnActiveClass\([^,)]+,\s*"(\w+)"\)/g)].map((m) => m[1]),
    );
    // Every operation named in an action exists in the map...
    for (const op of used) expect(Object.keys(CLASS_OPERATIONS)).toContain(op);
    // ...and every operation in the map is actually used by an action, so a
    // stale phrase cannot sit there looking like coverage.
    expect([...used].sort()).toEqual(Object.keys(CLASS_OPERATIONS).sort());
  });
});

/**
 * Two closed doors, and the order matters.
 *
 * A lapsed school's archived class is refused by both rules. The subscription
 * answer is the more useful one — it explains why every other class in the
 * building is refusing too — and it is the one a teacher can act on by talking
 * to an administrator. Being told "that class is archived" would send them to
 * restore a class that would still refuse.
 */
describe("entitlement is answered before lifecycle", () => {
  // Both dates, because a renewal earlier than the start is not a lapse — it is
  // an unreadable term, which is the other message entirely.
  const setTerm = (starts: string, renews: string) =>
    db
      .prepare("update schools set term_starts_on = ?, term_renews_on = ? where id = ?")
      .run(starts, renews, DEMO_SCHOOL);
  const LAPSED = () => setTerm("2024-08-18", "2025-06-30");
  const UNREADABLE = () => setTerm("2025-08-18", "soon");
  const ACTIVE = () => setTerm("2025-08-18", "2999-09-01");

  it("tells a lapsed school about its subscription, not about the class", async () => {
    archiveClass(db, DEMO_CLASS);
    LAPSED();
    for (const mutation of MUTATIONS) {
      const result = await mutation.run();
      expect(result.error, mutation.name).toBe(LAPSED_WRITE_REFUSAL);
    }
  });

  it("says the same for dates it cannot read", async () => {
    archiveClass(db, DEMO_CLASS);
    UNREADABLE();
    expect((await MUTATIONS[0].run()).error).toBe(UNVERIFIED_WRITE_REFUSAL);
  });

  it("falls through to the class once the term is fixed", async () => {
    archiveClass(db, DEMO_CLASS);
    LAPSED();
    expect((await MUTATIONS[0].run()).error).toBe(LAPSED_WRITE_REFUSAL);
    ACTIVE();
    expect((await MUTATIONS[0].run()).error).toBe(classArchivedRefusal("add_student"));
  });
});

/**
 * The mechanism, not a list.
 *
 * Sprints 76, 79 and 81 each wrote down which actions still needed the check,
 * and all three lists were wrong in the same way. What follows asserts the
 * shape that makes a list unnecessary: the resolver every mutation already used
 * is the only place the question is asked, and it cannot be called without
 * asking it.
 */
describe("the check cannot be forgotten by a new action", () => {
  const source = readFileSync(join(process.cwd(), "src/app/actions/teacher.ts"), "utf8");

  it("asks about archived_at in exactly one place", () => {
    // A per-action check is now a duplicate, and a duplicate is how the
    // resolver's answer gets quietly overridden with a different sentence.
    const occurrences = source.match(/archived_at/g) ?? [];
    expect(occurrences).toHaveLength(1);
    expect(source).toMatch(
      /async function requireOwnActiveClass[\s\S]{0,900}?classroom\.archived_at[\s\S]{0,120}?throw new ClassArchivedError\(operation\)/,
    );
  });

  it("resolves every classroom mutation through it", () => {
    // Each exported action that holds a class id and writes must go through the
    // resolver. `createClassAction` is excluded because it has no class yet.
    const actions = [...source.matchAll(/export async function (\w+Action)\(/g)].map((m) => ({
      name: m[1],
      start: m.index!,
    }));
    expect(actions.length).toBeGreaterThanOrEqual(6);

    for (const [i, action] of actions.entries()) {
      const body = source.slice(action.start, actions[i + 1]?.start ?? source.length);
      const takesClassId = /classId/.test(body);
      const isCreate = action.name === "createClassAction";
      if (!takesClassId || isCreate) continue;
      expect(
        body,
        `${action.name} handles a class id without resolving it through requireOwnActiveClass`,
      ).toMatch(/requireOwnActiveClass\(/);
    }
  });

  it("requires an operation at every call site", () => {
    const calls = [...source.matchAll(/requireOwnActiveClass\(([^)]*)\)/g)]
      // The declaration itself, not a call.
      .filter((m) => !source.slice(0, m.index!).endsWith("async function "));
    expect(calls.length).toBeGreaterThanOrEqual(5);
    for (const call of calls) {
      expect(call[1], `requireOwnActiveClass(${call[1]}) passes no operation`).toMatch(
        /,\s*("(\w+)"|operation)/,
      );
    }
  });
});
