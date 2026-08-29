import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";

/**
 * The cookie jar `next/headers` would hand a Server Action. Hoisted because
 * `vi.mock` is hoisted above the imports that use it.
 */
const jar = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    api: {
      get: (name: string) =>
        store.has(name) ? { name, value: store.get(name)! } : undefined,
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

import { createTestDb, DEMO_CLASS, DEMO_STUDENT, DEMO_TEACHER } from "./helpers";
import type { Db } from "@/lib/db";
import { currentStaff, currentStudent, writeSession } from "@/lib/auth/session";
import { encodeSession, signPayload } from "@/lib/auth/token";
import {
  createClass,
  getClass,
  normalizeJoinCode,
  rotateJoinCode,
} from "@/lib/repo/classroom";
import { DEMO_SCHOOL } from "./helpers";

let db: Db;
let cleanup: () => void;

/**
 * The key `session.ts` signs with. It is created lazily on first use there, so
 * this creates one when the fixture has not needed it yet — the same row, read
 * and written the same way.
 */
function signingKey(): Buffer {
  const existing = db.prepare("SELECT value FROM meta WHERE key = 'session_key'").get() as
    | { value: string }
    | undefined;
  if (existing) return Buffer.from(existing.value, "hex");
  const key = randomBytes(32);
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('session_key', ?)").run(
    key.toString("hex"),
  );
  return key;
}

const codeOf = (classId: string) => normalizeJoinCode(getClass(db, classId)!.join_code);

beforeEach(() => {
  ({ db, cleanup } = createTestDb());
  // `getDb()` reads this handle, so the real session code runs against the
  // fixture rather than the developer's database.
  globalThis.__airkDb = db;
  jar.store.clear();
});

afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

describe("a student session dies with the code that issued it", () => {
  it("is valid before its own class code rotates, and invalid after", async () => {
    await writeSession({
      kind: "student",
      studentId: DEMO_STUDENT,
      code: codeOf(DEMO_CLASS),
    });

    // Through the real authorization path, not a helper.
    const before = await currentStudent();
    expect(before?.student.id).toBe(DEMO_STUDENT);
    expect(before?.classroom.id).toBe(DEMO_CLASS);

    // The administrator does the thing the product tells them to do.
    const issuedUnder = codeOf(DEMO_CLASS);
    const fresh = rotateJoinCode(db, DEMO_CLASS);
    expect(fresh).toBeTruthy();
    expect(normalizeJoinCode(fresh!)).not.toBe(issuedUnder);

    // FAILING-BEFORE: this returned the student and their classroom, because
    // the session said only `{ kind, studentId }` and nothing compared it to
    // the class's current code. The leaked code kept working for the rest of
    // the twelve hours, after the stated recovery action had been taken.
    expect(await currentStudent()).toBeNull();

    // The cookie is still there and still validly signed. It is the binding
    // that no longer matches, not the signature.
    expect(jar.store.get("airk_session")).toBeTruthy();
  });

  it("survives a rotation of a different class", async () => {
    const other = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Room 99",
      grade: 3,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-12",
    });

    await writeSession({
      kind: "student",
      studentId: DEMO_STUDENT,
      code: codeOf(DEMO_CLASS),
    });
    expect((await currentStudent())?.student.id).toBe(DEMO_STUDENT);

    rotateJoinCode(db, other.id);

    // Rotation is per class. Somebody else's recovery action does not sign a
    // child out of their own lesson.
    expect((await currentStudent())?.student.id).toBe(DEMO_STUDENT);
  });

  it("rejects a session bound to a code that was never this class's", async () => {
    await writeSession({ kind: "student", studentId: DEMO_STUDENT, code: "NOTTHECODE1" });
    expect(await currentStudent()).toBeNull();
  });

  it("rejects a legacy session token that carries no binding at all", async () => {
    // The shape an older build wrote, signed with this database's real key so
    // the signature is genuinely valid. Fail closed: rejected, not trusted.
    const payload = Buffer.from(
      JSON.stringify({ kind: "student", studentId: DEMO_STUDENT }),
      "utf8",
    ).toString("base64url");
    jar.store.set("airk_session", `${payload}.${signPayload(signingKey(), payload)}`);

    expect(await currentStudent()).toBeNull();
  });

  it("leaves staff sessions alone, before and after a rotation", async () => {
    await writeSession({ kind: "staff", userId: DEMO_TEACHER });
    expect((await currentStaff())?.user.id).toBe(DEMO_TEACHER);

    rotateJoinCode(db, DEMO_CLASS);

    // A teacher's own session has nothing to do with a class code, and
    // rotating one must not sign them out of the tool they rotate it with.
    expect((await currentStaff())?.user.id).toBe(DEMO_TEACHER);
    expect(await currentStudent()).toBeNull();
  });

  it("accepts a session issued from the code the class has after a rotation", async () => {
    rotateJoinCode(db, DEMO_CLASS);
    // What `chooseStudent` does: issue against the code the verified grant
    // carried, which the checks there confirm is the current one.
    await writeSession({
      kind: "student",
      studentId: DEMO_STUDENT,
      code: codeOf(DEMO_CLASS),
    });
    expect((await currentStudent())?.student.id).toBe(DEMO_STUDENT);
  });

  it("still requires the class to exist and the student to be on it", async () => {
    const stored = encodeSession(signingKey(), {
      kind: "student",
      studentId: "stu_does_not_exist",
      code: codeOf(DEMO_CLASS),
    });
    jar.store.set("airk_session", stored);
    expect(await currentStudent()).toBeNull();
  });
});
