"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireAdmin, requireStaff } from "@/lib/auth/session";
import { canTeachClass } from "@/lib/auth/access";
import { MISSION_BY_ID } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";
import {
  assignMission,
  createClass,
  rotateJoinCode,
  createStudent,
  deleteStudentFromClass,
  getClass,
  listStudents,
  renameStudent,
  unassignMission,
} from "@/lib/repo/classroom";
import { getSchool, getUser, recordAudit } from "@/lib/repo/school";
import {
  ClassroomLimitError,
  classroomLimitRefusal,
  LicenceExceededError,
} from "@/lib/repo/entitlement";
import {
  asExpectedError,
  assertSubscriptionActive,
  lapsedRefusal,
} from "@/lib/auth/subscription-gate";
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
/**
 * Every mutation below goes through this. It used to accept any staff member
 * in the school, which meant a teacher holding a colleague's class id could
 * add students to it, remove them, and change its assignments — and an
 * administrator could do the same. Ownership is the rule now, and it is
 * checked here rather than only in the page that renders the buttons, because
 * a server action is a public endpoint whatever the UI shows.
 */
async function requireOwnClass(classId: string) {
  const { user } = await requireStaff();
  const db = getDb();
  const classroom = getClass(db, classId);
  if (!canTeachClass(user, classroom)) {
    throw new Error("That is not your class.");
  }
  return { user, db, classroom: classroom! };
}

/**
 * The same, plus the subscription term.
 *
 * Every classroom mutation goes through here rather than through the plain
 * ownership check, so the gate is on the path and not on the page. Ownership
 * and entitlement are separate questions and both have to be answered: a
 * teacher's own class is still their own class after the term ends, and they
 * still cannot change it.
 */
async function requireOwnActiveClass(classId: string) {
  const resolved = await requireOwnClass(classId);
  assertSubscriptionActive(resolved.db, resolved.user.school_id);
  return resolved;
}

/**
 * Creating a class is an administrator operation, and it is the only place in
 * the product that offers it. It used to accept any staff member, so an
 * ordinary teacher could create classes for themselves through a direct call
 * even though no authorised screen offers that — a hidden entitlement is still
 * an entitlement. And the requested owner was trusted: the foreign key proves
 * a user row exists, not that they teach here.
 */
export async function createClassAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const grade = Number(formData.get("grade"));

  if (name.length < 2) return { error: "Give the class a name with at least two characters." };
  if (![2, 3, 4].includes(grade)) return { error: "Choose grade 2, 3 or 4." };

  const db = getDb();
  const lapsed = lapsedRefusal(db, user.school_id);
  if (lapsed) return { error: lapsed };

  const teacherId = String(formData.get("teacherId") ?? "");
  const owner = teacherId ? getUser(db, teacherId) : undefined;
  if (!owner || owner.role !== "teacher" || owner.school_id !== user.school_id) {
    return { error: "Choose a teacher at this school to own the class." };
  }

  // The academic year comes from the school, not from a hidden form field with
  // a hard-coded fallback. On the day this was written that fallback meant
  // every new class was still being created in 2025-2026.
  const school = getSchool(db, user.school_id);
  if (!school) return { error: "That school could not be found." };
  let created;
  try {
    created = createClass(db, {
      schoolId: user.school_id,
      teacherId: owner.id,
      name,
      grade,
      schoolYear: school.academic_year,
      yearEndsOn: school.year_ends_on,
    });
  } catch (error) {
    if (error instanceof ClassroomLimitError) {
      recordAudit(db, {
        schoolId: user.school_id,
        actorLabel: user.name,
        action: "class.blocked_by_plan",
        detail: `A new class was declined. ${error.active} of ${error.limit} active classes on the ${error.plan} plan.`,
      });
      return { error: classroomLimitRefusal(error, "create") };
    }
    throw error;
  }
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

/**
 * The one place a roster name is checked, so adding and renaming cannot drift
 * apart. Data minimisation is enforced here, not just documented: a roster
 * entry that looks like a full surname is refused with an explanation.
 */
function validateDisplayName(displayName: string): string | undefined {
  if (displayName.length < 2) {
    return "Enter a first name and a last initial, like Sam R.";
  }
  if (displayName.length > 24) {
    return "Keep it short: a first name and a last initial.";
  }
  if (/\b[A-Za-z]{2,}\s+[A-Za-z]{3,}\b/.test(displayName)) {
    return "Use a first name and a last initial only, like Sam R. This product never stores a student's full name.";
  }
  return undefined;
}

export async function addStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const classId = String(formData.get("classId") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim();

    const invalid = validateDisplayName(displayName);
    if (invalid) return { error: invalid };

    const { db, user, classroom } = await requireOwnActiveClass(classId);
    const existing = listStudents(db, classId);
    if (existing.some((s) => s.display_name.toLowerCase() === displayName.toLowerCase())) {
      return { error: `${displayName} is already on this roster.` };
    }

    // The licence check lives in the repository, so this is a catch rather than a
    // pre-check: an action that asked first and inserted afterwards would leave a
    // window between the two, and would be one door among several.
    try {
      createStudent(db, { classId, displayName });
    } catch (error) {
      if (error instanceof LicenceExceededError) {
        const school = getSchool(db, user.school_id)!;
        // No row was written, and no success audit. The refusal is recorded
        // because a school buyer needs to see that the cap did something, and it
        // names no child: a licence event is a fact about the school.
        recordAudit(db, {
          schoolId: user.school_id,
          actorLabel: user.name,
          action: "roster.blocked_by_licence",
          detail: `An enrolment was declined in ${classroom.name}. ${error.used} of ${error.licensed} licensed students in use.`,
        });
        return {
          error:
            `${error.used} of ${error.licensed} licensed student places are in use, so this ` +
            `school cannot enrol anybody else yet. Nothing was added. Ask ${school.contact_name} ` +
            "to request more places on the Program and plan page.",
        };
      }
      throw error;
    }

    recordAudit(db, {
      schoolId: user.school_id,
      actorLabel: user.name,
      action: "roster.added",
      detail: `One student added to ${classroom.name}.`,
    });
    revalidatePath(`/teacher/class/${classId}`);
    return { ok: `${displayName} added to ${classroom.name}.` };
  } catch (error) {
    const refusal = asExpectedError(error);
    if (refusal) return refusal;
    throw error;
  }
}

/**
 * Fix a name without touching anything else.
 *
 * The roster offered Add and Remove and nothing between them, so a typo, a
 * preferred name, or two children needing clearer initials left a teacher
 * choosing between a wrong name on a shared screen all year and deleting the
 * child — losing every attempt, check-in and badge — then re-adding a blank
 * record. For a seven-year-old, seeing the wrong name in front of the class is
 * both common and needlessly personal.
 *
 * Only `display_name` moves. The student id, avatar, attempts, check-ins,
 * badges and any live session are all keyed on the id and survive untouched.
 */
export async function renameStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const classId = String(formData.get("classId") ?? "");
    const studentId = String(formData.get("studentId") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim();

    const invalid = validateDisplayName(displayName);
    if (invalid) return { error: invalid };

    const { db, user, classroom } = await requireOwnActiveClass(classId);
    const students = listStudents(db, classId);
    const target = students.find((s) => s.id === studentId);
    // Same shape as the delete: authorising the class is not authorising the
    // child, so the student has to be on this roster.
    if (!target) return { error: "That student is not on this class's roster." };

    if (target.display_name === displayName) return { ok: "That is already the name." };
    if (
      students.some(
        (s) => s.id !== studentId && s.display_name.toLowerCase() === displayName.toLowerCase(),
      )
    ) {
      return { error: `${displayName} is already on this roster.` };
    }

    renameStudent(db, studentId, classroom.id, displayName);
    recordAudit(db, {
      schoolId: user.school_id,
      actorLabel: user.name,
      // No child's name in a school-wide log, before or after.
      action: "roster.renamed",
      detail: `A student's display name was corrected in ${classroom.name}. No records changed.`,
    });
    revalidatePath(`/teacher/class/${classId}`);
    return { ok: "Name updated. Everything they have done is still there." };
  } catch (error) {
    const refusal = asExpectedError(error);
    if (refusal) return refusal;
    throw error;
  }
}

export async function removeStudentAction(classId: string, studentId: string): Promise<{ error?: string }> {
  try {
    const { db, user, classroom } = await requireOwnActiveClass(classId);

    // Authorising the class is not authorising the child. The delete is scoped
    // by both ids and reports whether it actually removed anything, so a
    // mismatched pair changes nothing and does not leave a success audit behind
    // claiming it did.
    const removed = deleteStudentFromClass(db, studentId, classroom.id);
    if (!removed) {
      throw new Error("That student is not on this class's roster.");
    }

    recordAudit(db, {
      schoolId: user.school_id,
      actorLabel: user.name,
      action: "roster.removed",
      detail: `One student and all of their records removed from ${classroom.name}.`,
    });
    revalidatePath(`/teacher/class/${classId}`);
    return {};
  } catch (error) {
    const refusal = asExpectedError(error);
    if (refusal) return refusal;
    throw error;
  }
}

/**
 * Rotate a class code without deleting the class.
 *
 * A code that has been photographed or passed around used to be valid for the
 * rest of the year, because the only way to change it was to delete the class
 * and rebuild it — taking every roster and record with it. Rotating also
 * invalidates join grants already issued, since a grant carries the code it
 * was granted against.
 */
export async function rotateJoinCodeAction(classId: string): Promise<{ error?: string }> {
  try {
    const { db, user, classroom } = await requireOwnActiveClass(classId);
    const code = rotateJoinCode(db, classroom.id);
    if (!code) throw new Error("That class no longer exists.");
    recordAudit(db, {
      schoolId: user.school_id,
      actorLabel: user.name,
      action: "class.code_rotated",
      detail: `${classroom.name} has a new class code. The old one stopped working immediately.`,
    });
    revalidatePath(`/teacher/class/${classId}`);
    return {};
  } catch (error) {
    const refusal = asExpectedError(error);
    if (refusal) return refusal;
    throw error;
  }
}

export async function setAssignmentAction(input: {
  classId: string;
  missionId: string;
  assigned: boolean;
}): Promise<{ error?: string }> {
  try {
    const mission = MISSION_BY_ID[input.missionId];
    if (!mission) throw new Error("Unknown mission.");
    const { db, user, classroom } = await requireOwnActiveClass(input.classId);

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
    return {};
  } catch (error) {
    const refusal = asExpectedError(error);
    if (refusal) return refusal;
    throw error;
  }
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
  if (!answered) throw new Error("Read every module and answer its check before finishing the orientation.");

  completeCertification(db, user.id);
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "certification.completed",
    detail: "AI Ready Educator: Foundations orientation completed. Modules read and checks answered; the checks are not gated.",
  });
  revalidatePath("/teacher/certification");
  revalidatePath("/admin/staff");
}
