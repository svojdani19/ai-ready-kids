import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_STUDENT } from "./helpers";
import { decodeSession, encodeSession } from "@/lib/auth/token";
import { getMission, MISSIONS } from "@/content/missions";
import { getBenchmarkForm } from "@/content/benchmark";
import { findChoice, findScene, validateMission } from "@/lib/domain/missionPath";
import { createClass, getClass } from "@/lib/repo/classroom";
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
