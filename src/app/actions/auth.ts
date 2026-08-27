"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getClass, getClassByJoinCode, getStudent, listStudents } from "@/lib/repo/classroom";
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

  const classroom = getClassByJoinCode(getDb(), code);
  if (!classroom || classroom.archived_at) {
    return { error: "That code did not match a class. Check the letters and try again.", code };
  }
  // Entering the code is the whole credential, so it has to leave something
  // behind. Without this the next page and the next action were open to
  // anybody holding a class id.
  await writeJoinGrant(classroom.id);
  redirect(`/join/${classroom.id}`);
}

/**
 * Step two: tap your own name. Still no password — but the action verifies the
 * grant itself rather than trusting that the page which rendered the buttons
 * did. It used to take any student id in the database and hand back that
 * child's session, which made every roster in the school reachable by anyone
 * who could guess an id.
 */
export async function chooseStudent(studentId: string): Promise<void> {
  const grantedClassId = await readJoinGrant();
  if (!grantedClassId) redirect("/join");

  const db = getDb();
  const student = getStudent(db, studentId);
  // The student must belong to the class whose code was entered. A grant for
  // one class is not a grant for the child sitting in another.
  if (!student || student.class_id !== grantedClassId) redirect("/join");

  const classroom = getClass(db, grantedClassId);
  if (!classroom || classroom.archived_at) redirect("/join");

  await clearJoinGrant();
  await writeSession({ kind: "student", studentId: student.id });
  redirect("/student");
}

export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/");
}
