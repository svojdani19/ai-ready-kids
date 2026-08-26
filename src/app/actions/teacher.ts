"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { MISSION_BY_ID } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";
import {
  assignMission,
  createClass,
  createStudent,
  deleteStudent,
  getClass,
  listStudents,
  unassignMission,
} from "@/lib/repo/classroom";
import { recordAudit } from "@/lib/repo/school";
import {
  completeCertification,
  getCertification,
  saveCertificationAnswer,
} from "@/lib/repo/progress";

export interface ActionState {
  error?: string;
  ok?: string;
}

/** Staff may only touch classes inside their own school. */
async function requireOwnClass(classId: string) {
  const { user } = await requireStaff();
  const db = getDb();
  const classroom = getClass(db, classId);
  if (!classroom || classroom.school_id !== user.school_id) {
    throw new Error("That class is not part of your school.");
  }
  return { user, db, classroom };
}

export async function createClassAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireStaff();
  const name = String(formData.get("name") ?? "").trim();
  const grade = Number(formData.get("grade"));

  if (name.length < 2) return { error: "Give the class a name with at least two characters." };
  if (![2, 3, 4].includes(grade)) return { error: "Choose grade 2, 3 or 4." };

  const db = getDb();
  const created = createClass(db, {
    schoolId: user.school_id,
    teacherId: String(formData.get("teacherId") ?? user.id),
    name,
    grade,
    schoolYear: String(formData.get("schoolYear") ?? "2025-2026"),
  });
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "class.created",
    detail: `${created.name} created for Grade ${created.grade}, join code ${created.join_code}.`,
  });
  revalidatePath("/teacher");
  revalidatePath("/admin/classes");
  return { ok: `${created.name} created. The class code is ${created.join_code}.` };
}

export async function addStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classId = String(formData.get("classId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (displayName.length < 2) {
    return { error: "Enter a first name and a last initial, like Sam R." };
  }
  if (displayName.length > 24) {
    return { error: "Keep it short: a first name and a last initial." };
  }
  // Data minimisation is enforced here, not just documented. A roster entry
  // that looks like a full surname is refused with an explanation.
  if (/\b[A-Za-z]{2,}\s+[A-Za-z]{3,}\b/.test(displayName)) {
    return {
      error:
        "Use a first name and a last initial only, like Sam R. This product never stores a student's full name.",
    };
  }

  const { db, user, classroom } = await requireOwnClass(classId);
  const existing = listStudents(db, classId);
  if (existing.some((s) => s.display_name.toLowerCase() === displayName.toLowerCase())) {
    return { error: `${displayName} is already on this roster.` };
  }

  createStudent(db, { classId, displayName });
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "roster.added",
    detail: `One student added to ${classroom.name}.`,
  });
  revalidatePath(`/teacher/class/${classId}`);
  return { ok: `${displayName} added to ${classroom.name}.` };
}

export async function removeStudentAction(classId: string, studentId: string): Promise<void> {
  const { db, user, classroom } = await requireOwnClass(classId);
  deleteStudent(db, studentId);
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "roster.removed",
    detail: `One student and all of their records removed from ${classroom.name}.`,
  });
  revalidatePath(`/teacher/class/${classId}`);
}

export async function setAssignmentAction(input: {
  classId: string;
  missionId: string;
  assigned: boolean;
}): Promise<void> {
  const mission = MISSION_BY_ID[input.missionId];
  if (!mission) throw new Error("Unknown mission.");
  const { db, user, classroom } = await requireOwnClass(input.classId);

  if (input.assigned) {
    assignMission(db, {
      classId: input.classId,
      missionId: input.missionId,
      assignedBy: user.id,
    });
  } else {
    unassignMission(db, input.classId, input.missionId);
  }

  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: input.assigned ? "mission.assigned" : "mission.unassigned",
    detail: `${mission.title} ${input.assigned ? "assigned to" : "removed from"} ${classroom.name}.`,
  });
  revalidatePath("/teacher/missions");
  revalidatePath(`/teacher/missions/${mission.slug}`);
  revalidatePath(`/teacher/class/${input.classId}`);
}

export async function answerCertificationAction(
  moduleId: string,
  optionId: string,
): Promise<void> {
  const mod = CERTIFICATION_MODULES.find((m) => m.id === moduleId);
  if (!mod || !mod.check.options.some((o) => o.id === optionId)) {
    throw new Error("That answer is not part of this module.");
  }
  const { user } = await requireStaff();
  saveCertificationAnswer(getDb(), user.id, moduleId, optionId);
  revalidatePath("/teacher/certification");
}

export async function completeCertificationAction(): Promise<void> {
  const { user } = await requireStaff();
  const db = getDb();
  const record = getCertification(db, user.id);
  const answered = CERTIFICATION_MODULES.every((m) => record?.answers[m.id]);
  if (!answered) throw new Error("Finish every module before completing the certification.");

  completeCertification(db, user.id);
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "certification.completed",
    detail: "AI Ready Educator: Foundations completed.",
  });
  revalidatePath("/teacher/certification");
  revalidatePath("/admin/staff");
}
