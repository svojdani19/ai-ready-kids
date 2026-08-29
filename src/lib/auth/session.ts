import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, row } from "@/lib/db";
import {
  decodeJoinGrant,
  decodeSession,
  encodeJoinGrant,
  encodeSession,
  type SessionValue,
} from "./token";
import { getStudent, getClass, normaliseJoinCode } from "@/lib/repo/classroom";
import { getUser } from "@/lib/repo/school";
import type { Classroom, Student, User } from "@/lib/types";

/**
 * Demo authentication.
 *
 * There are no passwords in this MVP and that is on purpose: an elementary
 * pilot should not be the thing that invents another credential store. Staff
 * pick or type their school email, students enter a class code and tap their
 * own name. The session cookie is HMAC signed with a key generated on first
 * run and kept in the database, so nothing has to be configured and no secret
 * ever lands in a file the developer has to manage.
 *
 * Production replaces this wholesale with district SSO. See the README section
 * "Deferred integrations".
 */

const COOKIE = "airk_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

/** The join grant cookie, and how long proving a class code stays proved. */
const JOIN_COOKIE = "airk_join";
const JOIN_MAX_AGE_SECONDS = 60 * 10;

export type { SessionValue };

function signingKey(): Buffer {
  const db = getDb();
  const existing = row<{ value: string }>(
    db.prepare("SELECT value FROM meta WHERE key = 'session_key'").get(),
  );
  if (existing) return Buffer.from(existing.value, "hex");
  const key = randomBytes(32);
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('session_key', ?)").run(
    key.toString("hex"),
  );
  return key;
}

export async function readSession(): Promise<SessionValue | null> {
  const store = await cookies();
  return decodeSession(signingKey(), store.get(COOKIE)?.value);
}

export async function writeSession(value: SessionValue): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, encodeSession(signingKey(), value), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Record that this browser entered the correct code for one class. */
export async function writeJoinGrant(classId: string, code: string): Promise<void> {
  const store = await cookies();
  const exp = Math.floor(Date.now() / 1000) + JOIN_MAX_AGE_SECONDS;
  store.set(JOIN_COOKIE, encodeJoinGrant(signingKey(), { kind: "join", classId, code, exp }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: JOIN_MAX_AGE_SECONDS,
  });
}

/** The class and code this browser proved, or null. */
export async function readJoinGrant(): Promise<{ classId: string; code: string } | null> {
  const store = await cookies();
  const grant = decodeJoinGrant(
    signingKey(),
    store.get(JOIN_COOKIE)?.value,
    Math.floor(Date.now() / 1000),
  );
  return grant ? { classId: grant.classId, code: grant.code } : null;
}

export async function clearJoinGrant(): Promise<void> {
  const store = await cookies();
  store.delete(JOIN_COOKIE);
}

export interface StaffContext {
  user: User;
}

export interface StudentContext {
  student: Student;
  classroom: Classroom;
}

export async function currentStaff(): Promise<StaffContext | null> {
  const session = await readSession();
  if (session?.kind !== "staff") return null;
  const user = getUser(getDb(), session.userId);
  return user ? { user } : null;
}

/**
 * A student session is only good for as long as the code that bought it.
 *
 * Rotation invalidated new joins and half-finished grants, but not a session
 * already issued — so a code that leaked kept one browser inside the class for
 * the rest of the twelve hours, after the administrator had done the exact
 * thing the product told them to do. The comparison below is the whole fix:
 * the code carried in the signed cookie against the class's current one.
 *
 * Both sides are normalised. The cookie is written from an already-normalised
 * value, but normalising here too means a stored code that was never
 * normalised cannot fail to match itself.
 */
export async function currentStudent(): Promise<StudentContext | null> {
  const session = await readSession();
  if (session?.kind !== "student") return null;
  const db = getDb();
  const student = getStudent(db, session.studentId);
  if (!student) return null;
  const classroom = getClass(db, student.class_id);
  if (!classroom) return null;
  // Archived is a closed class, not merely a hidden one. Sprint 69: this
  // resolver is what every student page and every instructional action trusts,
  // and it used to hand back an archived classroom quite happily — so
  // "finished class" and year rollover did not actually close student access.
  // Both `/join` steps already refused an archived class; the session did not.
  if (classroom.archived_at) return null;
  if (normaliseJoinCode(classroom.join_code) !== normaliseJoinCode(session.code)) return null;
  return { student, classroom };
}

export async function requireStaff(): Promise<StaffContext> {
  const staff = await currentStaff();
  if (!staff) redirect("/signin");
  return staff;
}

/**
 * Teacher surfaces render named children and their individual evidence. An
 * administrator arriving at one is sent to their own dashboard rather than
 * shown the roster, because the product tells them they see aggregates.
 */
export async function requireTeacher(): Promise<StaffContext> {
  const staff = await requireStaff();
  if (staff.user.role !== "teacher") redirect("/admin");
  return staff;
}

export async function requireAdmin(): Promise<StaffContext> {
  const staff = await requireStaff();
  if (staff.user.role !== "admin") redirect("/teacher");
  return staff;
}

export async function requireStudent(): Promise<StudentContext> {
  const student = await currentStudent();
  if (!student) redirect("/join");
  return student;
}
