"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getClassByJoinCode, getStudent, listStudents } from "@/lib/repo/classroom";
import { getUserByEmail } from "@/lib/repo/school";
import { clearSession, writeSession } from "@/lib/auth/session";
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
  if (!classroom) {
    return { error: "That code did not match a class. Check the letters and try again.", code };
  }
  redirect(`/join/${classroom.id}`);
}

/** Step two: tap your own name. No password, because there is nothing to protect. */
export async function chooseStudent(studentId: string): Promise<void> {
  const student = getStudent(getDb(), studentId);
  if (!student) redirect("/join");
  await writeSession({ kind: "student", studentId: student.id });
  redirect("/student");
}

export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/");
}
