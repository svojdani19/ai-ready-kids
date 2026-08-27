"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { headers } from "next/headers";
import {
  getClass,
  getClassByJoinCode,
  getStudent,
  listStudents,
  normaliseJoinCode,
} from "@/lib/repo/classroom";
import { checkAttempt, clearAttempts, recordFailure } from "@/lib/auth/throttle";
import { getUserByEmail } from "@/lib/repo/school";
import {
  clearJoinGrant,
  clearSession,
  readJoinGrant,
  writeJoinGrant,
  writeSession,
} from "@/lib/auth/session";
import { DEMO } from "@/lib/db/seed";

export interface FormState {
  error?: string;
}

/** One-click demo entry used by the landing page and the sign-in screen. */
export async function enterDemo(role: "teacher" | "admin" | "student"): Promise<void> {
  const db = getDb();
  if (role === "student") {
    const student = getStudent(db, DEMO.studentId) ?? listStudents(db, DEMO.classId)[0];
    if (!student) redirect("/join");
    await writeSession({ kind: "student", studentId: student.id });
    redirect("/student");
  }
  const email = role === "admin" ? DEMO.adminEmail : DEMO.teacherEmail;
  const user = getUserByEmail(db, email);
  if (!user) redirect("/signin");
  await writeSession({ kind: "staff", userId: user.id });
  redirect(role === "admin" ? "/admin" : "/teacher");
}

export async function signInWithEmail(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your school email address." };

  const user = getUserByEmail(getDb(), email);
  if (!user) {
    return {
      error: "We do not recognise that address at this school. Try a demo account below.",
    };
  }
  await writeSession({ kind: "staff", userId: user.id });
  redirect(user.role === "admin" ? "/admin" : "/teacher");
}

export interface JoinState {
  error?: string;
  code?: string;
}

/** Step one of the student flow: a class code, nothing else. */
export async function findClassByCode(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Type the class code your teacher gave you." };

  // Guessing is throttled with progressive backoff. Nothing about the caller
  // is stored: see src/lib/auth/throttle.ts for what this is and is not.
  const bucket = await throttleKey();
  const gate = checkAttempt(bucket);
  if (!gate.allowed) {
    const wait = gate.retryAfterSeconds;
    return {
      error: `That is a lot of tries. Wait ${wait} second${wait === 1 ? "" : "s"} and ask your teacher to read the code out again.`,
      code,
    };
  }

  const classroom = getClassByJoinCode(getDb(), code);
  if (!classroom || classroom.archived_at) {
    // One message for "no such code" and for "archived", so a wrong guess
    // never tells the guesser which kind of wrong it was.
    recordFailure(bucket);
    return { error: "That code did not match a class. Check the letters and try again.", code };
  }
  clearAttempts(bucket);

  // Entering the code is the whole credential, so it has to leave something
  // behind. The code travels with the grant so that rotating it invalidates
  // anything already issued.
  await writeJoinGrant(classroom.id, normaliseJoinCode(classroom.join_code));
  redirect(`/join/${classroom.id}`);
}

/**
 * A coarse bucket for backoff. Uses the forwarded address where a proxy
 * supplies one and falls back to a single shared bucket, which is the safe
 * direction: without an address every caller shares one allowance rather than
 * every caller getting their own.
 */
async function throttleKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "shared";
}

/**
 * Step two: tap your own name. Still no password — but the action verifies the
 * grant itself rather than trusting that the page which rendered the buttons
 * did. It used to take any student id in the database and hand back that
 * child's session, which made every roster in the school reachable by anyone
 * who could guess an id.
 */
export async function chooseStudent(studentId: string): Promise<void> {
  const grant = await readJoinGrant();
  if (!grant) redirect("/join");

  const db = getDb();
  const student = getStudent(db, studentId);
  // The student must belong to the class whose code was entered. A grant for
  // one class is not a grant for the child sitting in another.
  if (!student || student.class_id !== grant.classId) redirect("/join");

  const classroom = getClass(db, grant.classId);
  if (!classroom || classroom.archived_at) redirect("/join");
  // And the code must still be the one that was entered, so a rotated code
  // cannot be finished with.
  if (normaliseJoinCode(classroom.join_code) !== grant.code) redirect("/join");

  await clearJoinGrant();
  await writeSession({ kind: "student", studentId: student.id });
  redirect("/student");
}

export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/");
}
