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
  DEMO_CLASS,
  DEMO_SCHOOL,
  DEMO_TEACHER,
  DEMO_STUDENT,
} from "./helpers";
import type { Db } from "@/lib/db";
import { setAssignmentAction } from "@/app/actions/teacher";
import { beginMission, submitDecision } from "@/app/actions/student";
import { writeSession } from "@/lib/auth/session";
import { listAudit } from "@/lib/repo/school";
import {
  archiveClass,
  getClass,
  listAssignments,
  normaliseJoinCode,
} from "@/lib/repo/classroom";
import { getAttempt } from "@/lib/repo/progress";
import { expectedDecisionSceneId } from "@/lib/domain/missionPath";
import { MISSIONS } from "@/content/missions";
import { ASSIGNMENT_FAILED } from "@/lib/repo/audited";

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

const assignedIds = () => listAssignments(db, DEMO_CLASS).map((a) => a.mission_id).sort();
const auditsOf = (action: string) =>
  listAudit(db, DEMO_SCHOOL, 500).filter((a) => a.action === action);

function snapshot() {
  const dump = (sql: string) => JSON.stringify(db.prepare(sql).all());
  return {
    assignments: dump("SELECT * FROM assignments ORDER BY id"),
    attempts: dump("SELECT * FROM attempts ORDER BY id"),
    students: dump("SELECT * FROM students ORDER BY id"),
    classes: dump("SELECT * FROM classes ORDER BY id"),
    audit: dump("SELECT action, detail FROM audit_log ORDER BY created_at, id"),
  };
}

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

const asTeacher = async () => {
  jar.store.clear();
  await writeSession({ kind: "staff", userId: DEMO_TEACHER });
};
const asChild = async () => {
  jar.store.clear();
  await writeSession({
    kind: "student",
    studentId: DEMO_STUDENT,
    code: normaliseJoinCode(getClass(db, DEMO_CLASS)!.join_code),
  });
};

/** A mission this class does not have, and this child has never touched. */
function unassignedMission() {
  const has = new Set(assignedIds());
  const m = MISSIONS.find(
    (mission) => !has.has(mission.id) && !getAttempt(db, DEMO_STUDENT, mission.id),
  );
  expect(m, "fixture needs an unassigned, untouched mission").toBeTruthy();
  return m!;
}

/** A mission this class has, which this child has not finished. */
function assignedUnfinished() {
  const has = new Set(assignedIds());
  const m = MISSIONS.find(
    (mission) => has.has(mission.id) && !getAttempt(db, DEMO_STUDENT, mission.id)?.completed_at,
  );
  expect(m, "fixture needs an assigned, unfinished mission").toBeTruthy();
  return m!;
}

/**
 * What the child's browser can actually do, through the real endpoints.
 *
 * Assignment existence is not the child-facing consequence: `beginMission` and
 * `submitDecision` are what a mission page posts to, so those are what get
 * called. `beginMission` refuses by throwing out of `requirePlayableMission`.
 */
async function childCanOpen(mission: (typeof MISSIONS)[number]): Promise<boolean> {
  await asChild();
  try {
    await beginMission(mission.slug);
    return true;
  } catch {
    return false;
  } finally {
    await asTeacher();
  }
}

describe("a failed assignment change leaves the class offered exactly what it was", () => {
  it("assign: the mission stays off, and the child still cannot open it", async () => {
    await asTeacher();
    const mission = unassignedMission();
    expect(await childCanOpen(mission)).toBe(false);

    const before = snapshot();
    const beforeIds = assignedIds();
    const baseline = auditsOf("mission.assigned").length;

    failAuditFor("mission.assigned");
    const result = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: mission.id,
      assigned: true,
    });
    removeFailure();

    expect(result.error).toBe(ASSIGNMENT_FAILED("Room 12"));
    expect(assignedIds()).toEqual(beforeIds);
    expect(snapshot()).toEqual(before);
    expect(auditsOf("mission.assigned")).toHaveLength(baseline);

    // The consequence, through the endpoint the child's browser posts to.
    expect(await childCanOpen(mission)).toBe(false);
    expect(getAttempt(db, DEMO_STUDENT, mission.id)).toBeUndefined();
  });

  it("unassign: the mission stays on, and an incomplete attempt is still continuable", async () => {
    await asTeacher();
    const mission = assignedUnfinished();

    // The child starts it and records one decision — a half-finished attempt,
    // which is the state a withdrawal would strand.
    await asChild();
    await beginMission(mission.slug);
    const at = expectedDecisionSceneId(mission, getAttempt(db, DEMO_STUDENT, mission.id)!.path)!;
    const scene = mission.scenes.find((s) => s.id === at)!;
    const choice = scene.choices!.find((c) => !c.retry)!;
    expect(
      await submitDecision({ slug: mission.slug, sceneId: scene.id, choiceId: choice.id }),
    ).toEqual({ ok: true });
    await asTeacher();

    const attemptBefore = JSON.stringify(getAttempt(db, DEMO_STUDENT, mission.id));
    const before = snapshot();
    const baseline = auditsOf("mission.unassigned").length;

    failAuditFor("mission.unassigned");
    const result = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: mission.id,
      assigned: false,
    });
    removeFailure();

    expect(result.error).toBe(ASSIGNMENT_FAILED("Room 12"));
    expect(assignedIds()).toContain(mission.id);
    expect(snapshot()).toEqual(before);
    expect(auditsOf("mission.unassigned")).toHaveLength(baseline);

    // Still continuable: the saved path is untouched and the next decision saves.
    expect(JSON.stringify(getAttempt(db, DEMO_STUDENT, mission.id))).toBe(attemptBefore);
    await asChild();
    const next = expectedDecisionSceneId(mission, getAttempt(db, DEMO_STUDENT, mission.id)!.path)!;
    const nextScene = mission.scenes.find((s) => s.id === next)!;
    const nextChoice = nextScene.choices!.find((c) => !c.retry)!;
    expect(
      await submitDecision({ slug: mission.slug, sceneId: nextScene.id, choiceId: nextChoice.id }),
    ).toEqual({ ok: true });
    await asTeacher();
  });

  it("says what did not change, and claims nothing that did not happen", () => {
    const message = ASSIGNMENT_FAILED("Room 12");
    expect(message).toMatch(/offered exactly the same missions as before/i);
    expect(message).toMatch(/no child's saved mission work or badge has changed/i);
    expect(message).toMatch(/nothing was written to the audit log/i);
    expect(message).toMatch(/safe to try again/i);
    for (const promise of [/account contact/i, /\bsupport\b/i, /within \d+ (?:minutes|hours|days)/i]) {
      expect(message).not.toMatch(promise);
    }
  });
});

describe("the retry changes the assignment and nothing else", () => {
  it("assigning opens the mission to the child and writes one audit", async () => {
    await asTeacher();
    const mission = unassignedMission();
    failAuditFor("mission.assigned");
    await setAssignmentAction({ classId: DEMO_CLASS, missionId: mission.id, assigned: true });
    removeFailure();

    const before = snapshot();
    const beforeIds = assignedIds();
    const attemptsBefore = (db.prepare("SELECT COUNT(*) AS n FROM attempts").get() as { n: number }).n;
    const baseline = auditsOf("mission.assigned").length;

    const result = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: mission.id,
      assigned: true,
    });

    expect(result.error).toBeUndefined();
    expect(assignedIds()).toEqual([...beforeIds, mission.id].sort());
    // No attempt was created by assigning.
    expect((db.prepare("SELECT COUNT(*) AS n FROM attempts").get() as { n: number }).n).toBe(
      attemptsBefore,
    );
    expect(JSON.stringify(db.prepare("SELECT * FROM students ORDER BY id").all())).toBe(
      before.students,
    );

    const entries = auditsOf("mission.assigned");
    expect(entries).toHaveLength(baseline + 1);
    expect(entries[0].detail).toBe(`${mission.title} assigned to Room 12.`);

    // The child can now open it, through the real endpoint.
    expect(await childCanOpen(mission)).toBe(true);
  });

  it("unassigning closes the mission and deletes no work", async () => {
    await asTeacher();
    const mission = assignedUnfinished();
    await asChild();
    await beginMission(mission.slug);
    await asTeacher();
    const attemptBefore = JSON.stringify(getAttempt(db, DEMO_STUDENT, mission.id));
    const attemptsBefore = (db.prepare("SELECT COUNT(*) AS n FROM attempts").get() as { n: number }).n;
    const baseline = auditsOf("mission.unassigned").length;

    const result = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: mission.id,
      assigned: false,
    });

    expect(result.error).toBeUndefined();
    expect(assignedIds()).not.toContain(mission.id);
    // The child's work survives the withdrawal — it is just no longer offered.
    expect(JSON.stringify(getAttempt(db, DEMO_STUDENT, mission.id))).toBe(attemptBefore);
    expect((db.prepare("SELECT COUNT(*) AS n FROM attempts").get() as { n: number }).n).toBe(
      attemptsBefore,
    );
    expect(auditsOf("mission.unassigned")).toHaveLength(baseline + 1);

    // And the endpoint now refuses, because the attempt is unfinished.
    expect(await childCanOpen(mission)).toBe(false);
  });

  it("keeps replay working for a mission the child had already finished", async () => {
    await asTeacher();
    // A finished attempt is deliberately eligible under the replay rule.
    const finished = MISSIONS.find(
      (m) =>
        assignedIds().includes(m.id) && getAttempt(db, DEMO_STUDENT, m.id)?.completed_at,
    );
    expect(finished, "fixture needs an assigned, completed mission").toBeTruthy();

    const result = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: finished!.id,
      assigned: false,
    });
    expect(result.error).toBeUndefined();
    expect(assignedIds()).not.toContain(finished!.id);

    // Withdrawing does not take away a badge already earned: replay still opens.
    expect(await childCanOpen(finished!)).toBe(true);
    expect(getAttempt(db, DEMO_STUDENT, finished!.id)?.completed_at).toBeTruthy();
  });
});

describe("an idempotent request records no event that did not happen", () => {
  it("assigning a mission the class already has writes no audit", async () => {
    await asTeacher();
    const mission = unassignedMission();
    await setAssignmentAction({ classId: DEMO_CLASS, missionId: mission.id, assigned: true });
    const afterFirst = snapshot();
    const baseline = auditsOf("mission.assigned").length;

    // The double-tap, or the stale tab resending.
    const again = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: mission.id,
      assigned: true,
    });

    // Not an error: the class is in the state the teacher asked for, and the
    // switch should show it. But nothing happened, so nothing is recorded.
    expect(again.error).toBeUndefined();
    expect(snapshot()).toEqual(afterFirst);
    expect(auditsOf("mission.assigned")).toHaveLength(baseline);
  });

  it("unassigning a mission the class does not have writes no audit", async () => {
    await asTeacher();
    const mission = unassignedMission();
    const before = snapshot();
    const baseline = auditsOf("mission.unassigned").length;

    const result = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: mission.id,
      assigned: false,
    });

    expect(result.error).toBeUndefined();
    expect(snapshot()).toEqual(before);
    expect(auditsOf("mission.unassigned")).toHaveLength(baseline);
  });
});

describe("the existing refusals still refuse, and write nothing", () => {
  it("rejects a mission that does not exist", async () => {
    await asTeacher();
    const before = snapshot();
    await expect(
      setAssignmentAction({ classId: DEMO_CLASS, missionId: "m-nope", assigned: true }),
    ).rejects.toThrow(/Unknown mission/);
    expect(snapshot()).toEqual(before);
  });

  it("rejects a class this teacher does not own", async () => {
    jar.store.clear();
    await writeSession({ kind: "staff", userId: "usr_whitfield" });
    const mission = MISSIONS[0];
    const before = snapshot();
    await expect(
      setAssignmentAction({ classId: DEMO_CLASS, missionId: mission.id, assigned: true }),
    ).rejects.toThrow();
    expect(snapshot()).toEqual(before);
    await asTeacher();
  });

  it("does NOT currently refuse an archived class — recorded, not asserted as correct", async () => {
    // Found while writing this sprint, and deliberately not fixed here.
    //
    // `requireOwnActiveClass` is named "active" but checks ownership and the
    // subscription term only; it never looks at `archived_at`. So assigning to
    // an archived class succeeds, even though `createStudent` refuses one
    // outright ("That class is archived. Restore it before adding.").
    //
    // No child is exposed by it — sprint 69 made archiving close student
    // sessions, so an archived class has nobody in it — which is why this is a
    // consistency gap rather than an access hole, and why fixing it is an
    // authorization change belonging to its own sprint rather than a quiet
    // widening of this one. This test exists so the behaviour is written down
    // and a later fix has to change it deliberately.
    await asTeacher();
    const mission = unassignedMission();
    archiveClass(db, DEMO_CLASS);

    const result = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: mission.id,
      assigned: true,
    });

    expect(result.error).toBeUndefined();
    expect(assignedIds()).toContain(mission.id);
    // What this sprint does guarantee about it: the write and its audit still
    // commit together, so the log matches the data either way.
    expect(auditsOf("mission.assigned").some((a) => a.detail.includes(mission.title))).toBe(true);
  });

  it("refuses while the subscription is lapsed, and writes nothing", async () => {
    await asTeacher();
    const mission = unassignedMission();
    db.prepare("UPDATE schools SET term_renews_on = '2020-09-01' WHERE id = ?").run(DEMO_SCHOOL);
    const before = snapshot();

    const result = await setAssignmentAction({
      classId: DEMO_CLASS,
      missionId: mission.id,
      assigned: true,
    });

    expect(result.error).toBeTruthy();
    expect(result.error).not.toBe(ASSIGNMENT_FAILED("Room 12"));
    expect(result.error).toMatch(/subscription/i);
    expect(snapshot()).toEqual(before);
  });
});
