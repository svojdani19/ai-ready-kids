"use server";

import { revalidatePath } from "next/cache";
import {
  ACADEMIC_NEEDS_CONFIGURATION,
  hasVerifiableAcademicDates,
} from "@/lib/domain/calendar";
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
import {
  ASSIGNMENT_CLASS_ARCHIVED,
  ASSIGNMENT_FAILED,
  auditedWrite,
  REMOVE_STUDENT_FAILED,
  ROTATE_FAILED,
} from "@/lib/repo/audited";
import { getSchool, getUser, recordAudit } from "@/lib/repo/school";
import {
  ClassroomLimitError,
  classroomLimitRefusal,
  LicenseExceededError,
  LicenseNotRecognizedError,
  licenseNotRecognizedRefusal,
  PlanNotRecognizedError,
  planNotRecognizedRefusal,
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
 * even though no authorized screen offers that — a hidden entitlement is still
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
  if (![1, 2, 3, 4, 5].includes(grade)) return { error: "Choose a grade from 1 to 5." };

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

  // A new class snapshots the school's academic year and its year-end date,
  // and that snapshot is what retention is calculated from for the rest of the
  // cohort's life. Creating one from a calendar nobody can read mints a class
  // that can never be scheduled for deletion — so this refuses before any
  // class or audit row is written. Staff-only wording: no child is affected and
  // ordinary mission work carries on.
  if (!hasVerifiableAcademicDates(school)) {
    return {
      error:
        `${ACADEMIC_NEEDS_CONFIGURATION}. A new class copies the school year and its end date, ` +
        "and those cannot be read right now, so nothing has been created. An administrator can " +
        "set them on the Program and plan page — existing classes and student work are unaffected.",
    };
  }
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
    if (error instanceof PlanNotRecognizedError) {
      recordAudit(db, {
        schoolId: user.school_id,
        actorLabel: user.name,
        action: "class.blocked_by_plan_config",
        detail: `A new class was declined: the school's plan value is not recognized. Nothing was changed.`,
      });
      return { error: planNotRecognizedRefusal("create", school.contact_name) };
    }
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
 * apart. Data minimization is enforced here, not just documented: a roster
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

    // The license check lives in the repository, so this is a catch rather than a
    // pre-check: an action that asked first and inserted afterwards would leave a
    // window between the two, and would be one door among several.
    try {
      createStudent(db, { classId, displayName });
    } catch (error) {
      if (error instanceof LicenseNotRecognizedError) {
      const school = getSchool(db, user.school_id)!;
      recordAudit(db, {
        schoolId: user.school_id,
        actorLabel: user.name,
        // Not "blocked_by_license": nothing was exceeded. And the malformed
        // value is not written here either — an audit is a record of what
        // happened, and what happened is that the account needs fixing.
        action: "roster.blocked_by_license_config",
        detail: `An enrollment was declined in ${classroom.name}: the school's seat license is not a recognized number. Nothing was changed.`,
      });
      return { error: licenseNotRecognizedRefusal("enrol", school.contact_name) };
    }
    if (error instanceof LicenseExceededError) {
        const school = getSchool(db, user.school_id)!;
        // No row was written, and no success audit. The refusal is recorded
        // because a school buyer needs to see that the cap did something, and it
        // names no child: a license event is a fact about the school.
        recordAudit(db, {
          schoolId: user.school_id,
          actorLabel: user.name,
          action: "roster.blocked_by_license",
          detail: `An enrollment was declined in ${classroom.name}. ${error.used} of ${error.licensed} licensed students in use.`,
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
    // Same shape as the delete: authorizing the class is not authorizing the
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

    // Authorizing the class is not authorizing the child. The delete is scoped
    // by both ids and reports whether it actually removed anything, so a
    // mismatched pair changes nothing and does not leave a success audit behind
    // claiming it did.
    // The removal and its record commit together. This deletes a child's row
    // and cascades to every attempt and check-in they have, so a lost audit
    // entry means records gone with no answer to "who removed them, and when".
    try {
      auditedWrite(
        db,
        () => {
          const removed = deleteStudentFromClass(db, studentId, classroom.id);
          if (!removed) {
            throw new Error("That student is not on this class's roster.");
          }
          return removed;
        },
        () => ({
          schoolId: user.school_id,
          actorLabel: user.name,
          action: "roster.removed",
          detail: `One student and all of their records removed from ${classroom.name}.`,
        }),
      );
    } catch (error) {
      if (asExpectedError(error)) throw error;
      // The mismatched-pair refusal keeps its own message: nothing was
      // attempted, so this is not an operational failure.
      if (error instanceof Error && /not on this class's roster/.test(error.message)) {
        return { error: "That student is not on this class's roster." };
      }
      return { error: REMOVE_STUDENT_FAILED(classroom.name) };
    }
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
    // Sprint 71 made the administrator's rotation atomic and left this one —
    // the same repository call, the same credential consequence, and the path
    // teachers actually use most. A code that changed without a record of it
    // changing is the worst of both.
    try {
      auditedWrite(
        db,
        () => {
          const code = rotateJoinCode(db, classroom.id);
          if (!code) throw new Error("That class no longer exists.");
          return code;
        },
        () => ({
          schoolId: user.school_id,
          actorLabel: user.name,
          action: "class.code_rotated",
          detail: `${classroom.name} has a new class code. The old one is now rejected on its next use, for new joins and for browsers already signed in with it.`,
        }),
      );
    } catch (error) {
      if (asExpectedError(error)) throw error;
      return { error: ROTATE_FAILED(classroom.name) };
    }
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

    // Archived classes are parked, not empty. The roster, attempts and
    // assignments are all still stored and the class can be restored, so a
    // mission changed while it is parked would go live for children the moment
    // it comes back — with nobody having decided that after the restore.
    //
    // Refused here, above the transaction, and only for this action: widening
    // `requireOwnActiveClass` would change every classroom mutation at once,
    // which is a different correction.
    if (classroom.archived_at) {
      return { error: ASSIGNMENT_CLASS_ARCHIVED };
    }

    // The change and its record commit together. Sprint 76: these were two
    // separate commits, so a failing audit insert could expose a mission to a
    // class, or withdraw one mid-attempt, with nothing recording who did it —
    // and the optimistic switch got an uncaught error rather than a state a
    // teacher could act on.
    //
    // The audit is conditional on the write having changed something. Both
    // repository calls are idempotent by design, for the double-tap and the
    // stale tab; that is right for the data and wrong for the log, which must
    // not gain "mission assigned" for a mission the class already had.
    try {
      auditedWrite(
        db,
        () =>
          input.assigned
            ? assignMission(db, {
                classId: input.classId,
                missionId: input.missionId,
                assignedBy: user.id,
              })
            : unassignMission(db, input.classId, input.missionId),
        (changed) =>
          changed
            ? {
                schoolId: user.school_id,
                actorLabel: user.name,
                action: input.assigned ? "mission.assigned" : "mission.unassigned",
                detail: `${mission.title} ${input.assigned ? "assigned to" : "removed from"} ${classroom.name}.`,
              }
            : null,
      );
    } catch (error) {
      if (asExpectedError(error)) throw error;
      return { error: ASSIGNMENT_FAILED(classroom.name) };
    }
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
