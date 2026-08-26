"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import {
  archiveClass,
  deleteClass,
  getClass,
  listStudents,
  restoreClass,
} from "@/lib/repo/classroom";
import {
  countClassesForTeacher,
  createUser,
  deleteUser,
  getUser,
  getUserByEmail,
  listUsers,
  recordAudit,
  setRetentionMonths,
  updateSchoolProfile,
} from "@/lib/repo/school";
import { RETENTION_OPTIONS } from "@/lib/domain/retention";

export interface ActionState {
  error?: string;
  ok?: string;
}

const PLANS = ["classroom", "school", "district"] as const;
const ACCENTS = ["pine", "marigold", "denim", "berry"] as const;

export async function updateSchoolAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const monogram = String(formData.get("monogram") ?? "").trim().toUpperCase();
  const accent = String(formData.get("brand_accent") ?? "");
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();

  if (name.length < 3) return { error: "The school name needs at least three characters." };
  if (!/^[A-Z]{1,3}$/.test(monogram)) {
    return { error: "The monogram must be one to three letters." };
  }
  if (!ACCENTS.includes(accent as (typeof ACCENTS)[number])) {
    return { error: "Pick one of the available accent colours." };
  }
  if (contactName.length < 2) return { error: "Enter a programme contact name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: "Enter a valid contact email address." };
  }

  const db = getDb();
  updateSchoolProfile(db, user.school_id, {
    name,
    monogram,
    brand_accent: accent,
    contact_name: contactName,
    contact_email: contactEmail,
  });
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "school.updated",
    detail: `School profile and branding updated.`,
  });
  revalidatePath("/admin", "layout");
  return { ok: "School details saved." };
}

/**
 * Plan selection placeholder.
 *
 * Deliberately records an intent and nothing else. This build takes no card
 * details, holds no billing identifiers and calls no payment processor, so a
 * change here is a note for the account team rather than a transaction.
 */
export async function requestPlanChangeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAdmin();
  const plan = String(formData.get("plan") ?? "");
  const seats = Number(formData.get("licensed_students"));

  if (!PLANS.includes(plan as (typeof PLANS)[number])) return { error: "Choose a plan." };
  if (!Number.isInteger(seats) || seats < 1 || seats > 5000) {
    return { error: "Licensed students must be a whole number between 1 and 5000." };
  }

  const db = getDb();
  db.prepare("UPDATE schools SET plan = ?, licensed_students = ? WHERE id = ?").run(
    plan,
    seats,
    user.school_id,
  );
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "plan.change_requested",
    detail: `Plan intent recorded: ${plan}, ${seats} licensed students. No billing action taken.`,
  });
  revalidatePath("/admin/program");
  return {
    ok: "Recorded. Your account contact will follow up with a quote — nothing has been charged.",
  };
}

export async function setRetentionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAdmin();
  const months = Number(formData.get("retention_months"));
  if (!RETENTION_OPTIONS.some((o) => o.months === months)) {
    return { error: "Choose one of the available retention windows." };
  }

  const db = getDb();
  setRetentionMonths(db, user.school_id, months);
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "retention.updated",
    detail: `Student record retention set to ${months} months after the school year ends.`,
  });
  revalidatePath("/admin/data");
  return { ok: `Retention set to ${months} months after the school year ends.` };
}

export async function addTeacherAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const role = String(formData.get("role") ?? "teacher");

  if (name.length < 2) return { error: "Enter the staff member's name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (title.length < 2) return { error: "Enter a role or room, like Grade 3 Teacher, Room 12." };
  if (role !== "teacher" && role !== "admin") return { error: "Choose a role." };

  const db = getDb();
  if (getUserByEmail(db, email)) return { error: "Somebody with that email is already here." };

  createUser(db, { schoolId: user.school_id, role, name, email, title });
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "staff.added",
    detail: `${name} added as ${role}.`,
  });
  revalidatePath("/admin/staff");
  return { ok: `${name} can now sign in with ${email}.` };
}

export async function removeStaffAction(userId: string): Promise<{ error?: string }> {
  const { user } = await requireAdmin();
  const db = getDb();
  const target = getUser(db, userId);
  if (!target || target.school_id !== user.school_id) return { error: "Unknown staff member." };
  if (target.id === user.id) return { error: "You cannot remove your own account." };
  if (countClassesForTeacher(db, target.id) > 0) {
    return {
      error: `${target.name} still owns a class. Reassign or archive it first, so nobody's roster disappears by accident.`,
    };
  }
  if (
    target.role === "admin" &&
    listUsers(db, user.school_id, "admin").length <= 1
  ) {
    return { error: "A school must keep at least one administrator." };
  }

  deleteUser(db, userId);
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "staff.removed",
    detail: `${target.name} removed from the school.`,
  });
  revalidatePath("/admin/staff");
  return {};
}

async function ownClass(classId: string) {
  const { user } = await requireAdmin();
  const db = getDb();
  const classroom = getClass(db, classId);
  if (!classroom || classroom.school_id !== user.school_id) {
    throw new Error("That class is not part of your school.");
  }
  return { user, db, classroom };
}

export async function archiveClassAction(classId: string): Promise<void> {
  const { db, user, classroom } = await ownClass(classId);
  archiveClass(db, classId);
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "class.archived",
    detail: `${classroom.name} archived. Its scheduled deletion date is unchanged.`,
  });
  revalidatePath("/admin/classes");
  revalidatePath("/admin/data");
}

export async function restoreClassAction(classId: string): Promise<void> {
  const { db, user, classroom } = await ownClass(classId);
  restoreClass(db, classId);
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "class.restored",
    detail: `${classroom.name} restored to active.`,
  });
  revalidatePath("/admin/classes");
  revalidatePath("/admin/data");
}

/** Irreversible. Removes the roster, every attempt and every check-in. */
export async function deleteClassDataAction(classId: string): Promise<void> {
  const { db, user, classroom } = await ownClass(classId);
  const count = listStudents(db, classId).length;
  deleteClass(db, classId);
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "data.deleted",
    detail: `${classroom.name} permanently deleted, including ${count} student records, their mission history and their check-ins.`,
  });
  revalidatePath("/admin/classes");
  revalidatePath("/admin/data");
  revalidatePath("/admin");
}
