import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canAdministerClass, canTeachClass } from "@/lib/auth/access";
import { decodeJoinGrant, encodeJoinGrant } from "@/lib/auth/token";
import { canTakeBenchmark, missionAccessFor, nextBenchmarkFor } from "@/lib/domain/eligibility";
import type { BenchmarkRecord } from "@/lib/types";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_STUDENT, DEMO_TEACHER } from "./helpers";
import { decodeSession, encodeSession } from "@/lib/auth/token";
import { getMission, MISSIONS } from "@/content/missions";
import { getBenchmarkForm } from "@/content/benchmark";
import { findChoice, findScene, validateMission } from "@/lib/domain/missionPath";
import {
  createClass,
  createStudent,
  deleteStudentFromClass,
  getClass,
  listStudents,
} from "@/lib/repo/classroom";
import { createUser } from "@/lib/repo/school";

let db: Db;
let cleanup: () => void;

beforeAll(() => {
  ({ db, cleanup } = createTestDb());
});
afterAll(() => cleanup());

describe("session cookies", () => {
  const key = randomBytes(32);

  it("round-trips a staff and a student session", () => {
    expect(decodeSession(key, encodeSession(key, { kind: "staff", userId: "usr_1" }))).toEqual({
      kind: "staff",
      userId: "usr_1",
    });
    expect(
      decodeSession(key, encodeSession(key, { kind: "student", studentId: "stu_1" })),
    ).toEqual({ kind: "student", studentId: "stu_1" });
  });

  it("rejects a cookie signed with a different key", () => {
    const token = encodeSession(randomBytes(32), { kind: "staff", userId: "usr_1" });
    expect(decodeSession(key, token)).toBeNull();
  });

  it("rejects a tampered payload that keeps the old signature", () => {
    const token = encodeSession(key, { kind: "student", studentId: "stu_1" });
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ kind: "staff", userId: "usr_delgado" }))
      .toString("base64url");
    expect(decodeSession(key, `${forged}.${signature}`)).toBeNull();
  });

  it("rejects malformed, empty and missing cookies", () => {
    for (const bad of [undefined, "", "nodot", "a.b", ".", "..", "x".repeat(200)]) {
      expect(decodeSession(key, bad)).toBeNull();
    }
  });

  it("rejects a validly signed payload of the wrong shape", () => {
    const payload = Buffer.from(JSON.stringify({ kind: "superuser" })).toString("base64url");
    const token = `${payload}.${encodeSession(key, { kind: "staff", userId: "x" }).split(".")[1]}`;
    expect(decodeSession(key, token)).toBeNull();

    const validSig = encodeSession(key, { kind: "staff", userId: "x" });
    const [p] = validSig.split(".");
    expect(decodeSession(key, `${p}.wrong`)).toBeNull();
  });
});

describe("submitted decisions are checked against the shipped content", () => {
  const mission = getMission("sprocket-wants-to-know")!;

  it("accepts a real scene and choice pair", () => {
    const scene = mission.scenes.find((s) => s.choices?.length)!;
    expect(findChoice(mission, scene.id, scene.choices![0].id)).toBeDefined();
  });

  it("rejects an invented scene, an invented choice, or a mismatched pair", () => {
    expect(findScene(mission, "s999")).toBeUndefined();
    expect(findChoice(mission, "s2", "c99")).toBeUndefined();
    // A choice id that exists on a different scene must not be accepted here.
    const ending = mission.scenes.find((s) => s.kind === "ending")!;
    expect(findChoice(mission, ending.id, "c1")).toBeUndefined();
  });

  it("rejects an unknown mission slug and an unknown check-in form", () => {
    expect(getMission("not-a-mission")).toBeUndefined();
    expect(getBenchmarkForm("midterm")).toBeUndefined();
    expect(getBenchmarkForm("")).toBeUndefined();
    expect(getBenchmarkForm("pre")).toBeDefined();
  });

  it("keeps every shipped mission structurally valid", () => {
    for (const m of MISSIONS) expect(validateMission(m)).toEqual([]);
  });
});

describe("school scoping", () => {
  it("gives every class a school id an action can check against", () => {
    const classroom = getClass(db, DEMO_CLASS)!;
    expect(classroom.school_id).toBe(DEMO_SCHOOL);
  });

  it("keeps a second school's classes distinguishable", () => {
    db.prepare(
      `INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent, plan,
        licensed_students, term_starts_on, term_renews_on, contact_name, contact_email,
        retention_months, created_at)
       VALUES ('sch_other','Other Elementary','other','Elsewhere','Town','OH','OE','denim','school',
        50,'2025-08-18','2026-09-01','A Person','a@other.demo',12,'2025-07-01T00:00:00.000Z')`,
    ).run();
    const outsider = createUser(db, {
      schoolId: "sch_other",
      role: "teacher",
      name: "Outside Teacher",
      email: "out@other.demo",
      title: "Grade 3",
    });
    const foreign = createClass(db, {
      schoolId: "sch_other",
      teacherId: outsider.id,
      name: "Room 99",
      grade: 3,
      schoolYear: "2025-2026",
    });

    // The guard every staff action performs: compare the class's school to
    // the signed-in user's school.
    expect(getClass(db, foreign.id)!.school_id).not.toBe(DEMO_SCHOOL);
    expect(getClass(db, DEMO_CLASS)!.school_id).not.toBe("sch_other");
  });
});

describe("the student record holds nothing it should not", () => {
  it("has exactly five columns and none of them are identifying", () => {
    const columns = db
      .prepare("SELECT name FROM pragma_table_info('students')")
      .all()
      .map((r) => (r as { name: string }).name);
    expect(columns.sort()).toEqual(
      ["avatar_key", "class_id", "created_at", "display_name", "id"].sort(),
    );
    for (const banned of ["surname", "last_name", "email", "dob", "birth", "address", "photo", "notes"]) {
      expect(columns.join(" ")).not.toContain(banned);
    }
  });

  it("has no table for behavioural telemetry or risk scoring", () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((r) => (r as { name: string }).name);
    for (const banned of ["events", "telemetry", "sessions_log", "risk", "scores", "flags"]) {
      expect(tables).not.toContain(banned);
    }
  });

  it("stores only content identifiers in an attempt path, never free text", () => {
    const attempt = db
      .prepare("SELECT path_json FROM attempts WHERE student_id = ? LIMIT 1")
      .get(DEMO_STUDENT) as { path_json: string } | undefined;
    const path = JSON.parse(attempt!.path_json) as { sceneId: string; choiceId: string }[];
    for (const step of path) {
      expect(step.sceneId).toMatch(/^s\d+$/);
      expect(step.choiceId).toMatch(/^c\d+$/);
      expect(Object.keys(step).sort()).toEqual(["choiceId", "sceneId"]);
    }
  });
});

describe("a class belongs to its teacher, not to the school", () => {
  /**
   * Two live disclosures until sprint 26, both from the same missing rule.
   * `requireStaff` accepts administrators, and every teacher page and action
   * checked only `school_id`, so an administrator could open a roster and read
   * each child's name beside their individual evidence — while the privacy
   * page promised aggregates — and any teacher holding a colleague's class id
   * could read that roster and mutate it.
   *
   * These assert the rule directly rather than through a rendered page,
   * because a server action is a public endpoint whatever the UI links to.
   */
  const school = "sch_a";
  const owner = { id: "usr_owner", role: "teacher" as const, school_id: school };
  const colleague = { id: "usr_colleague", role: "teacher" as const, school_id: school };
  const admin = { id: "usr_admin", role: "admin" as const, school_id: school };
  const outsider = { id: "usr_far", role: "teacher" as const, school_id: "sch_b" };
  const classroom = { teacher_id: owner.id, school_id: school };

  it("lets the teacher of record in", () => {
    expect(canTeachClass(owner, classroom)).toBe(true);
  });

  it("keeps a colleague out of a class that is not theirs", () => {
    expect(canTeachClass(colleague, classroom)).toBe(false);
  });

  it("keeps an administrator out, deliberately rather than by not linking", () => {
    // The old fix would have been to remove the link. A link is not a
    // permission model: the URL is guessable and the actions are callable.
    expect(canTeachClass(admin, classroom)).toBe(false);
  });

  it("keeps another school out even when the ids look right", () => {
    expect(canTeachClass(outsider, { ...classroom, teacher_id: outsider.id })).toBe(false);
  });

  it("refuses a missing class rather than throwing at the call site", () => {
    expect(canTeachClass(owner, undefined)).toBe(false);
  });

  it("gives an administrator the class as an object and not the children in it", () => {
    // Creating, renaming, archiving, deleting and retention are class
    // identity. Rosters and evidence are not, and this rule cannot express
    // them, which is the point.
    expect(canAdministerClass(admin, classroom)).toBe(true);
    expect(canAdministerClass(owner, classroom)).toBe(false);
    expect(canAdministerClass(admin, { school_id: "sch_b" })).toBe(false);
  });

  it("has no role that can both administer and teach the same class", () => {
    for (const user of [owner, colleague, admin, outsider]) {
      const both = canTeachClass(user, classroom) && canAdministerClass(user, classroom);
      expect(both, `${user.id}`).toBe(false);
    }
  });
});

describe("no surface routes an administrator to a named roster", () => {
  const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it("does not link from the admin class list into the teacher class page", () => {
    // The disclosure had two doors: this link, and the teacher overview
    // handing an administrator every class in the school.
    expect(src("src/app/admin/classes/page.tsx")).not.toContain("/teacher/class/");
  });

  it("gates both roster-bearing teacher pages on the teacher role", () => {
    for (const page of ["src/app/teacher/page.tsx", "src/app/teacher/class/[classId]/page.tsx"]) {
      const body = src(page);
      expect(body, page).toContain("requireTeacher()");
      expect(body, page).not.toContain("requireStaff()");
    }
  });

  it("routes every class mutation through the ownership check", () => {
    const actions = src("src/app/actions/teacher.ts");
    // Each mutating action takes a classId and must resolve it via
    // requireOwnClass rather than looking the class up itself.
    for (const action of ["addStudentAction", "removeStudentAction", "setAssignmentAction"]) {
      const start = actions.indexOf(`export async function ${action}`);
      expect(start, action).toBeGreaterThan(-1);
      const body = actions.slice(start, actions.indexOf("export async function", start + 10));
      expect(body, action).toContain("requireOwnClass");
    }
    // And the check itself must be ownership, not school membership.
    expect(actions).toContain("canTeachClass(user, classroom)");
    expect(actions).not.toContain("classroom.school_id !== user.school_id");
  });
});

describe("a class code is worth something", () => {
  /**
   * Before sprint 27 it was worth nothing. `findClassByCode` validated the
   * code and then discarded it: `/join/[classId]` rendered every child's name
   * to anyone holding a class id, and `chooseStudent` issued a session for any
   * student id it was handed, without checking the child was even in the class
   * whose roster had been shown. The class code is the only credential the
   * privacy page claims, and it protected neither the roster nor the account.
   *
   * The grant is asserted here at the token layer, where the tamper cases for
   * the session cookie already live, because that is the layer that decides.
   */
  const key = randomBytes(32);
  const now = 1_760_000_000;

  it("round-trips a grant for one class", () => {
    const token = encodeJoinGrant(key, { kind: "join", classId: "cls_a", exp: now + 600 });
    expect(decodeJoinGrant(key, token, now)?.classId).toBe("cls_a");
  });

  it("refuses a grant signed with a different key", () => {
    const token = encodeJoinGrant(randomBytes(32), { kind: "join", classId: "cls_a", exp: now + 600 });
    expect(decodeJoinGrant(key, token, now)).toBeNull();
  });

  it("refuses a grant whose class was swapped after signing", () => {
    // A grant for class A must not become a grant for class B.
    const token = encodeJoinGrant(key, { kind: "join", classId: "cls_a", exp: now + 600 });
    const [, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ kind: "join", classId: "cls_b", exp: now + 600 }),
      "utf8",
    ).toString("base64url");
    expect(decodeJoinGrant(key, `${forged}.${signature}`, now)).toBeNull();
  });

  it("expires rather than lasting as long as a session", () => {
    const token = encodeJoinGrant(key, { kind: "join", classId: "cls_a", exp: now + 60 });
    expect(decodeJoinGrant(key, token, now + 59)).not.toBeNull();
    expect(decodeJoinGrant(key, token, now + 61)).toBeNull();
  });

  it("refuses a session token presented as a grant, and the reverse", () => {
    const session = encodeSession(key, { kind: "student", studentId: "stu_1" });
    expect(decodeJoinGrant(key, session, now)).toBeNull();
    const grant = encodeJoinGrant(key, { kind: "join", classId: "cls_a", exp: now + 600 });
    expect(decodeSession(key, grant)).toBeNull();
  });

  it("refuses missing and malformed tokens", () => {
    for (const bad of [undefined, "", "no-dot", "a.b", ".."]) {
      expect(decodeJoinGrant(key, bad, now)).toBeNull();
    }
  });
});

describe("the join surfaces check the grant themselves", () => {
  const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it("refuses a roster URL without a grant for that exact class", () => {
    const page = src("src/app/join/[classId]/page.tsx");
    expect(page).toContain("readJoinGrant()");
    expect(page).toContain("granted !== classId");
  });

  it("verifies the grant in the action rather than trusting the page", () => {
    // The page renders the buttons; the action is the endpoint.
    const actions = src("src/app/actions/auth.ts");
    const start = actions.indexOf("export async function chooseStudent");
    const body = actions.slice(start);
    expect(body).toContain("readJoinGrant()");
    expect(body).toContain("student.class_id !== grantedClassId");
    expect(body).toContain("classroom.archived_at");
    // And the grant is spent, not left lying around.
    expect(body).toContain("clearJoinGrant()");
  });

  it("does not hand out a grant for an archived class", () => {
    const actions = src("src/app/actions/auth.ts");
    const start = actions.indexOf("export async function findClassByCode");
    const body = actions.slice(start, actions.indexOf("export async function", start + 10));
    expect(body).toContain("classroom.archived_at");
    expect(body).toContain("writeJoinGrant");
  });
});

describe("what a student may open is a rule, not a rendered card", () => {
  it("denies a mission the class was never assigned", () => {
    expect(
      missionAccessFor({ missionId: "m-1", assignedMissionIds: ["m-2"], hasCompleted: false }),
    ).toBe("denied");
  });

  it("allows an assigned mission, and a replay of one already finished", () => {
    expect(
      missionAccessFor({ missionId: "m-1", assignedMissionIds: ["m-1"], hasCompleted: false }),
    ).toBe("assigned");
    // Withdrawing an assignment must not delete access to completed work.
    expect(
      missionAccessFor({ missionId: "m-1", assignedMissionIds: [], hasCompleted: true }),
    ).toBe("replay");
  });

  it("keeps both check-ins shut while the school has no window open", () => {
    for (const form of ["pre", "post"] as const) {
      expect(canTakeBenchmark({ window: "closed", form, records: [] })).toBe(false);
    }
  });

  it("does not open spring because fall is finished", () => {
    // The whole of the old rule: `nextBenchmarkFor` offered post the moment
    // pre was completed, with no window state anywhere in the product.
    const done = [{ form: "pre", completed_at: "2026-01-10" }] as unknown as BenchmarkRecord[];
    expect(canTakeBenchmark({ window: "pre", form: "post", records: done })).toBe(false);
    expect(nextBenchmarkFor(done, "pre")).toBeNull();
    expect(nextBenchmarkFor(done, "post")).toEqual({ form: "post", resuming: false });
  });

  it("refuses to reopen a form that is already finished", () => {
    const done = [{ form: "post", completed_at: "2026-05-10" }] as unknown as BenchmarkRecord[];
    expect(canTakeBenchmark({ window: "post", form: "post", records: done })).toBe(false);
  });

  it("gates the student pages and every student action on those rules", () => {
    const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
    expect(src("src/app/student/play/[slug]/page.tsx")).toContain("missionAccessFor");
    expect(src("src/app/student/checkin/[form]/page.tsx")).toContain("canTakeBenchmark");

    const actions = src("src/app/actions/student.ts");
    // Both helpers exist and every mutation goes through one of them.
    expect(actions).toContain("requirePlayableMission");
    expect(actions).toContain("requireOpenCheckIn");
    for (const action of ["beginMission", "submitDecision", "finishMission", "replayMission"]) {
      const start = actions.indexOf(`export async function ${action}`);
      const body = actions.slice(start, actions.indexOf("export async function", start + 10));
      expect(body, action).toContain("requirePlayableMission");
    }
    for (const action of ["submitCheckInAnswer", "finishCheckIn"]) {
      const start = actions.indexOf(`export async function ${action}`);
      const body = actions.slice(start, actions.indexOf("export async function", start + 10) + 1 || undefined);
      expect(body, action).toContain("requireOpenCheckIn");
    }
  });
});

describe("deleting a child is scoped to the class that authorised it", () => {
  /**
   * `removeStudentAction` authorised the *class* and then deleted the
   * *student* by bare id. A teacher could pass their own legitimate class id
   * alongside any student id they knew and permanently delete that child —
   * from a colleague's class, or another school — taking every cascaded
   * attempt and check-in with them, while the audit entry named the wrong
   * class. Same shape as sprint 27, one level deeper: the thing checked and
   * the thing acted on were different objects.
   */
  let scoped: Db;
  let cleanupScoped: () => void;
  beforeAll(() => {
    ({ db: scoped, cleanup: cleanupScoped } = createTestDb());
  });
  afterAll(() => cleanupScoped());

  function makeClass(name: string) {
    return createClass(scoped, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name,
      grade: 3,
      schoolYear: "2025-2026",
    }).id;
  }

  it("removes a student who is on that roster", () => {
    const classId = makeClass("Scoped A");
    const student = createStudent(scoped, { classId, displayName: "Owned P." });
    expect(deleteStudentFromClass(scoped, student.id, classId)).toBe(true);
    expect(listStudents(scoped, classId)).toHaveLength(0);
  });

  it("refuses a student from a colleague's class and changes nothing", () => {
    const mine = makeClass("Scoped Mine");
    const theirs = makeClass("Scoped Theirs");
    const victim = createStudent(scoped, { classId: theirs, displayName: "Other C." });

    expect(deleteStudentFromClass(scoped, victim.id, mine)).toBe(false);
    expect(listStudents(scoped, theirs).map((s) => s.id)).toContain(victim.id);
  });

  it("refuses an unknown student id without reporting success", () => {
    const classId = makeClass("Scoped Ghost");
    expect(deleteStudentFromClass(scoped, "stu_does_not_exist", classId)).toBe(false);
  });

  it("makes the action refuse a mismatch rather than writing a false audit", () => {
    const src = readFileSync(join(process.cwd(), "src/app/actions/teacher.ts"), "utf8");
    const start = src.indexOf("export async function removeStudentAction");
    const body = src.slice(start, src.indexOf("export async function", start + 10));
    // Scoped by both ids, and the audit is only reached when a row went.
    expect(body).toContain("deleteStudentFromClass(db, studentId, classroom.id)");
    expect(body.indexOf("if (!removed)")).toBeLessThan(body.indexOf("recordAudit"));
    expect(body).not.toContain("deleteStudent(db, studentId)");
  });
});
