"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { schoolHasLapsed } from "@/lib/auth/subscription-gate";
import { LAPSED_STUDENT_MESSAGE } from "@/lib/domain/subscription";
import { headers } from "next/headers";
import {
  getClass,
  getClassByJoinCode,
  getStudent,
  listStudents,
  normalizeJoinCode,
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
import {
  DEMO_LOCKED_MESSAGE,
  demoPasswordIsValid,
  demoUnlocked,
  writeDemoUnlock,
} from "@/lib/auth/demo-gate";

export interface FormState {
  error?: string;
}

/**
 * Type the demonstration password once; the three seats open for twelve hours.
 *
 * Checked on the server and answered the same way whether the password is
 * wrong or the gate is off — there is nothing here worth telling an attacker,
 * and a deployment with no password set never renders this form.
 */
export async function unlockDemo(_prev: FormState, formData: FormData): Promise<FormState> {
  const supplied = String(formData.get("password") ?? "");
  if (!supplied) return { error: "Enter the demonstration password." };
  if (!demoPasswordIsValid(supplied)) return { error: "That password is not right." };
  await writeDemoUnlock();
  redirect("/signin");
}

/** One-click demo entry used by the landing page and the sign-in screen. */
export async function enterDemo(role: "teacher" | "admin" | "student"): Promise<void> {
  // The buttons are not rendered while the gate is locked, so this is the
  // backstop for a form posted from a stale page or from outside the product.
  if (!(await demoUnlocked())) redirect("/signin");
  const db = getDb();
  if (role === "student") {
    const student = getStudent(db, DEMO.studentId) ?? listStudents(db, DEMO.classId)[0];
    if (!student) redirect("/join");
    // Bound to the class's *current* code, read at issue time. A demo session
    // minted before a rotation is no more privileged than a real one.
    const demoClass = getClass(db, student.class_id);
    if (!demoClass) redirect("/join");
    await writeSession({
      kind: "student",
      studentId: student.id,
      code: normalizeJoinCode(demoClass.join_code),
    });
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
  // Email sign-in reaches the same seats as the demo buttons, so gating one
  // without the other would leave the door open beside the lock.
  if (!(await demoUnlocked())) return { error: DEMO_LOCKED_MESSAGE };

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your school email address." };

  const user = getUserByEmail(getDb(), email);
  if (!user) {
    return {
      error: "We do not recognize that address at this school. Try a demo account below.",
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

  const db = getDb();
  const classroom = getClassByJoinCode(db, code);
  if (!classroom || classroom.archived_at) {
    // One message for "no such code" and for "archived", so a wrong guess
    // never tells the guesser which kind of wrong it was.
    recordFailure(bucket);
    return { error: "That code did not match a class. Check the letters and try again.", code };
  }
  clearAttempts(bucket);

  // A lapsed school takes no new joiners. The code was right, so this is not a
  // failed guess and is not thrown into the throttle — and the child is told
  // the class is not open rather than anything about an invoice.
  if (schoolHasLapsed(db, classroom.school_id)) {
    return { error: LAPSED_STUDENT_MESSAGE, code };
  }

  // Entering the code is the whole credential, so it has to leave something
  // behind. The code travels with the grant so that rotating it invalidates
  // anything already issued.
  await writeJoinGrant(classroom.id, normalizeJoinCode(classroom.join_code));
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
  if (normalizeJoinCode(classroom.join_code) !== grant.code) redirect("/join");

  // The term, rechecked here and not only at the code step.
  //
  // Sprint 49 gated `findClassByCode` and classified this action as "resumes an
  // existing session", which is not what it does: it *creates* one. A grant
  // lasts ten minutes, so a child who typed a correct code minutes before the
  // term ended still held a valid grant, and this wrote them a fresh session
  // without asking again. Checking at the first step of a two-step flow is
  // checking half of it.
  //
  // The grant is cleared on the way out, so a refused child is not left holding
  // a credential that would let them retry the same stale page, and nothing at
  // all is written — no session, no audit row, no record that a child tried.
  if (schoolHasLapsed(db, classroom.school_id)) {
    await clearJoinGrant();
    redirect("/join?closed=1");
  }

  await clearJoinGrant();
  // The code the grant carried, which the checks above have just confirmed is
  // still the class's current one. Not re-read from the class: the session
  // records what authorized it.
  await writeSession({ kind: "student", studentId: student.id, code: grant.code });
  redirect("/student");
}

export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/");
}
