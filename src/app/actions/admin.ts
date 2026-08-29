"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { canAdministerClass } from "@/lib/auth/access";
import {
  ClassroomLimitError,
  classroomLimitRefusal,
  isRecognisedSeatCount,
  licenceStatus,
  LicenceNotRecognisedError,
  MAX_LICENSED_STUDENTS,
  MIN_LICENSED_STUDENTS,
  licenceNotRecognisedRefusal,
  PlanNotRecognisedError,
  planNotRecognisedRefusal,
  RestoreExceedsLicenceError,
} from "@/lib/repo/entitlement";
import {
  asExpectedError,
  assertSubscriptionActive,
  lapsedRefusal,
} from "@/lib/auth/subscription-gate";
import { previewRollover } from "@/lib/domain/rollover";
import { ACADEMIC_PROBLEM_MESSAGE, academicProblem } from "@/lib/domain/calendar";
import {
  archiveClass,
  deleteClass,
  listClasses,
  getClass,
  listStudents,
  reassignClass,
  restoreClass,
  rotateJoinCode,
} from "@/lib/repo/classroom";
import {
  classesOwnedBy,
  createUser,
  deleteUser,
  getUser,
  getUserByEmail,
  listUsers,
  recordAudit,
  getSchool,
  setAcademicDates,
  setAcademicYear,
  setBenchmarkWindow,
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
  // One source with the domain, so an administrator cannot request a number the
  // repository would then refuse, and the repository cannot accept one the form
  // would reject.
  if (!isRecognisedSeatCount(seats)) {
    return {
      error: `Licensed students must be a whole number between ${MIN_LICENSED_STUDENTS} and ${MAX_LICENSED_STUDENTS}.`,
    };
  }

  const db = getDb();
  const school = getSchool(db, user.school_id)!;
  // Deliberately no UPDATE. Until sprint 42 this action wrote plan and
  // licensed_students straight to the school row while telling the
  // administrator it was recording an intent, which meant a school could raise
  // its own paid entitlement by typing a bigger number into a form labelled
  // "Request a quote". What a school has bought is the vendor's record, not the
  // school's, and a seat count a customer can edit cannot appear on an invoice.
  // The current entitlement is only quoted back when it is a number this
  // product would sell. Repeating a malformed one — "-5 seats" — states it as
  // the agreement in an audit trail a school may later rely on.
  const current = licenceStatus(db, user.school_id);
  const currentSeats = current.recognised
    ? `${current.licensed} seats`
    : "a seat licence that needs configuration";
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "plan.change_requested",
    detail:
      `Quote requested: ${plan}, ${seats} licensed students. ` +
      `Current entitlement unchanged at ${school.plan}, ${currentSeats}. ` +
      "No plan change, no seat change and no billing action.",
  });
  revalidatePath("/admin/program");
  return {
    ok: current.recognised
      ? `Request sent to your account contact. Your plan is still ${school.plan} with ` +
        `${current.licensed} licensed students, and it stays that way until a new ` +
        "agreement is in place. Nothing has been charged and nothing has changed."
      : "Request sent to your account contact. Your seat licence still needs configuration, " +
        "and this request has not changed it — nothing has been charged and nothing has " +
        "changed. Your account contact can correct the licence and quote the new one together.",
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

/**
 * Open or close a check-in window. An administrator's decision, recorded in the
 * audit log, because "fall" and "spring" are claims about when something
 * happened and the product had nothing behind them.
 */
export async function setBenchmarkWindowAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAdmin();
  const window = String(formData.get("window") ?? "");
  if (window !== "closed" && window !== "pre" && window !== "post") {
    return { error: "Choose closed, fall or spring." };
  }

  const db = getDb();
  // Opening a check-in window is a classroom change: it decides whether
  // children can start a form. Paused with the rest of instruction.
  const lapsed = lapsedRefusal(db, user.school_id);
  if (lapsed) return { error: lapsed };
  
  setBenchmarkWindow(db, user.school_id, window);
  const label =
    window === "closed" ? "closed" : window === "pre" ? "the fall window" : "the spring window";
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "benchmark.window",
    detail: `Check-ins set to ${label}.`,
  });
  revalidatePath("/admin/program");
  revalidatePath("/student");
  return {
    ok:
      window === "closed"
        ? "Check-ins are closed. No student can start or resume either form."
        : `Open: students are now offered ${label === "the fall window" ? "the fall" : "the spring"} check-in.`,
  };
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

/**
 * Hand a class to a different teacher. Administrator-only, because it changes
 * who can see a roster.
 */
export async function reassignClassAction(
  classId: string,
  teacherId: string,
): Promise<{ error?: string }> {
  const { user } = await requireAdmin();
  const db = getDb();
  const lapsed = lapsedRefusal(db, user.school_id);
  if (lapsed) return { error: lapsed };
  
  const classroom = getClass(db, classId);
  if (!classroom || classroom.school_id !== user.school_id) {
    return { error: "Unknown class." };
  }
  const from = getUser(db, classroom.teacher_id);
  const to = getUser(db, teacherId);
  if (!to || to.role !== "teacher" || to.school_id !== user.school_id) {
    return { error: "Choose a teacher at this school." };
  }
  if (to.id === classroom.teacher_id) {
    return { error: `${to.name} already has ${classroom.name}.` };
  }
  if (!reassignClass(db, classId, teacherId)) {
    return { error: "That class could not be reassigned." };
  }

  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "class.reassigned",
    detail: `${classroom.name} moved from ${from?.name ?? "an unassigned owner"} to ${to.name}. Roster, records and class code unchanged.`,
  });
  revalidatePath("/admin/classes");
  revalidatePath("/admin/staff");
  return {};
}

/**
 * Record when the school year starts and ends.
 *
 * Needed because a migrated database has no academic dates — the old schema
 * held none — and retention stays blocked until somebody who knows the answer
 * supplies it. Backfills the cohorts in that year at the same time.
 */
export async function setAcademicDatesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAdmin();
  const year = String(formData.get("academicYear") ?? "").trim();
  const startsOn = String(formData.get("startsOn") ?? "").trim();
  const endsOn = String(formData.get("endsOn") ?? "").trim();

  // Shape was all this checked, so "2026-13-45" and "2026-02-30" were saved to
  // the school and backfilled into classes. The ordering guard passed too:
  // comparing two Invalid Dates gives NaN, and every comparison against NaN is
  // false. One validator now, before any school, class or audit write.
  const problem = academicProblem({ year, startsOn, endsOn });
  if (problem) return { error: ACADEMIC_PROBLEM_MESSAGE[problem] };

  const db = getDb();
  const repair = setAcademicDates(db, user.school_id, { year, startsOn, endsOn });
  // Two separate facts, reported separately. Saying "3 classes repaired" when
  // one was relabelled and two got a date would be one number standing for two
  // different things, and neither would be checkable.
  const parts: string[] = [];
  if (repair.relabelled) {
    parts.push(
      `${repair.relabelled} class${repair.relabelled === 1 ? "" : "es"} moved onto ${year} from a school year that could not be read`,
    );
  }
  if (repair.datesRepaired) {
    parts.push(
      `${repair.datesRepaired} class${repair.datesRepaired === 1 ? "" : "es"} given a usable deletion date`,
    );
  }
  const summary = parts.length ? `${parts.join(", and ")}.` : "";
  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "year.dates_set",
    detail:
      `${year} recorded as running ${startsOn} to ${endsOn}.` +
      (summary
        ? ` ${summary} Classes with a valid deletion date kept it, and other school years were not touched.`
        : " No classes needed repairing."),
  });
  revalidatePath("/admin/program");
  revalidatePath("/admin/data");
  return {
    ok: summary
      ? `Saved. ${summary} Classes with a valid deletion date kept it, and other school years were not touched.`
      : "Saved.",
  };
}

/**
 * Roll the school into its next academic year.
 *
 * Archives the current year's classes, moves the academic dates on by a year,
 * and closes any open check-in window. It deliberately does not touch
 * subscription dates, and it cannot move an existing class's deletion date,
 * because every class carries the year-end it was created with.
 */
export async function rolloverYearAction(): Promise<ActionState> {
  const { user } = await requireAdmin();
  const db = getDb();
  // Rolling over starts a new teaching year, which is the one thing an expired
  // subscription most clearly does not cover.
  const lapsed = lapsedRefusal(db, user.school_id);
  if (lapsed) return { error: lapsed };
  
  const school = getSchool(db, user.school_id);
  if (!school) return { error: "That school could not be found." };

  const preview = previewRollover(school, listClasses(db, user.school_id, true));
  if ("error" in preview) return { error: preview.error };

  for (const c of preview.toArchive) archiveClass(db, c.id);
  setAcademicYear(db, user.school_id, {
    year: preview.toYear,
    startsOn: preview.startsOn,
    endsOn: preview.endsOn,
  });
  setBenchmarkWindow(db, user.school_id, "closed");

  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "year.rolled",
    detail: `${preview.fromYear} rolled into ${preview.toYear}. ${preview.toArchive.length} class${preview.toArchive.length === 1 ? "" : "es"} archived — each issued a new join code, with students signed out on their next request — check-ins closed, and no existing deletion date moved.`,
  });
  revalidatePath("/admin/program");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/data");
  return {
    ok: `${preview.toYear} is now the current year. ${preview.toArchive.length} class${preview.toArchive.length === 1 ? " was" : "es were"} archived, and check-ins are closed. Archived classes have new join codes and their students are signed out on their next request; no record and no deletion date changed.`,
  };
}

export async function removeStaffAction(userId: string): Promise<{ error?: string }> {
  const { user } = await requireAdmin();
  const db = getDb();
  const target = getUser(db, userId);
  if (!target || target.school_id !== user.school_id) return { error: "Unknown staff member." };
  if (target.id === user.id) return { error: "You cannot remove your own account." };
  // Named, not counted, and archived ones included — archiving never changed
  // ownership, so telling an administrator to archive was wrong advice that
  // left them with no way through except deleting a child's records.
  const owned = classesOwnedBy(db, target.id);
  if (owned.length > 0) {
    const list = owned
      .map((c) => (c.archived ? `${c.name} (archived)` : c.name))
      .join(", ");
    return {
      error: `${target.name} still owns ${owned.length === 1 ? "a class" : `${owned.length} classes`}: ${list}. Give ${owned.length === 1 ? "it" : "them"} to another teacher on the Classes page first — archiving does not change who owns a class, and deleting one takes its roster and records with it.`,
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

/**
 * The administrator's scope over a class: their own school, nothing else. The
 * rule itself lives in `canAdministerClass` so that this and the pages that
 * render these controls cannot drift apart.
 */
async function ownClass(classId: string) {
  const { user } = await requireAdmin();
  const db = getDb();
  const classroom = getClass(db, classId);
  if (!canAdministerClass(user, classroom)) {
    throw new Error("That class is not part of your school.");
  }
  return { user, db, classroom: classroom! };
}

/**
 * Ownership plus an unexpired term, for the class lifecycle operations.
 *
 * Deliberately not used by `deleteClassDataAction`. Deleting a school's own
 * records is data governance, not instruction: a school that has stopped
 * subscribing may well want its children's records gone, and refusing that
 * because an invoice lapsed would be holding data hostage. The same reasoning
 * keeps retention settings, exports and the annual report open.
 */
async function ownActiveClass(classId: string) {
  const resolved = await ownClass(classId);
  assertSubscriptionActive(resolved.db, resolved.user.school_id);
  return resolved;
}

/**
 * Give a class a new code, keeping the class.
 *
 * This exists because the Classes page used to tell administrators that a code
 * could only be regenerated by deleting and recreating the class — advice that
 * was already false when sprint 30 gave teachers a safe rotation, and that sat
 * on the same page as Delete data, which permanently removes the roster, every
 * mission attempt, the skill evidence, the badges and both check-ins. A code
 * for seven-to-ten-year-olds gets projected on a whiteboard and read aloud, so
 * needing a new one is an ordinary Tuesday, and the product was answering an
 * ordinary Tuesday with an instruction to erase children's records.
 *
 * A code is class configuration, not a child's record, so it is inside the
 * administrator role as sprint 26 drew it: this changes one column and reaches
 * no roster, no name and no evidence.
 */
export async function rotateJoinCodeAsAdminAction(classId: string): Promise<{ error?: string }> {
  try {
    const { db, user, classroom } = await ownActiveClass(classId);
    const code = rotateJoinCode(db, classroom.id);
    if (!code) throw new Error("That class no longer exists.");
    recordAudit(db, {
      schoolId: user.school_id,
      actorLabel: user.name,
      // No child is named here, and none needs to be: what happened is that a
      // class credential changed, which is a fact about the class.
      action: "class.code_rotated",
      detail: `${classroom.name} has a new class code. The old one is now rejected on its next use, for new joins and for browsers already signed in with it. The roster and all student records are unchanged.`,
    });
    revalidatePath("/admin/classes");
    revalidatePath(`/teacher/class/${classId}`);
    return {};
  } catch (error) {
    const refusal = asExpectedError(error);
    if (refusal) return refusal;
    throw error;
  }
}

export async function archiveClassAction(classId: string): Promise<{ error?: string }> {
  try {
    const { db, user, classroom } = await ownActiveClass(classId);
    archiveClass(db, classId);
    recordAudit(db, {
      schoolId: user.school_id,
      actorLabel: user.name,
      action: "class.archived",
      detail: `${classroom.name} archived. Students cannot join and those already signed in are rejected on their next request; the class was issued a new join code, so the old one stays invalid even if the class is restored. The roster, records and the scheduled deletion date are unchanged.`,
    });
    revalidatePath("/admin/classes");
    revalidatePath("/admin/data");
    return {};
  } catch (error) {
    const refusal = asExpectedError(error);
    if (refusal) return refusal;
    throw error;
  }
}

export async function restoreClassAction(classId: string): Promise<{ error?: string }> {
  // The resolver is inside the try, not before it. Sprint 49 gated this
  // action by swapping in `ownActiveClass` and left the call above the try,
  // so a lapsed subscription escaped as an unhandled throw and an error page
  // — while archive and rotate, wrapped whole, returned the sentence. A
  // guard that turns one refusal into a crash is not a guard the caller can
  // use, and the two paths have to fail the same way.
  try {
    const { db, user, classroom } = await ownActiveClass(classId);
    const school = getSchool(db, user.school_id)!;

    // Catch rather than pre-check: the rule is in the repository, and asking
    // first would leave a window between the answer and the write.
    try {
      restoreClass(db, classId);
    } catch (error) {
      if (error instanceof PlanNotRecognisedError) {
        recordAudit(db, {
          schoolId: user.school_id,
          actorLabel: user.name,
          action: "class.restore_blocked_by_plan_config",
          detail: `Restoring ${classroom.name} was declined: the school's plan value is not recognised. Nothing was changed.`,
        });
        return { error: planNotRecognisedRefusal("restore", school.contact_name) };
      }
      if (error instanceof ClassroomLimitError) {
        // Configuration facts only: how many rooms and on which plan. No child
        // is named, and no success audit is written on this path.
        recordAudit(db, {
          schoolId: user.school_id,
          actorLabel: user.name,
          action: "class.restore_blocked_by_plan",
          detail: `Restoring ${classroom.name} was declined. ${error.active} of ${error.limit} active classes on the ${error.plan} plan.`,
        });
        return { error: classroomLimitRefusal(error, "restore") };
      }
      if (error instanceof LicenceNotRecognisedError) {
        recordAudit(db, {
          schoolId: user.school_id,
          actorLabel: user.name,
          action: "class.restore_blocked_by_licence_config",
          detail: `Restoring ${classroom.name} was declined: the school's seat licence is not a recognised number. Nothing was changed.`,
        });
        return { error: licenceNotRecognisedRefusal("restore", school.contact_name) };
      }
      if (error instanceof RestoreExceedsLicenceError) {
        // Counts only. Which class and how many children is a fact about the
        // school; who those children are is not the licence's business.
        recordAudit(db, {
          schoolId: user.school_id,
          actorLabel: user.name,
          action: "class.restore_blocked_by_licence",
          detail: `Restoring ${classroom.name} was declined. ${error.used} of ${error.licensed} licensed students active, ${error.roster} in the archived class.`,
        });
        return {
          error:
            `${classroom.name} has ${error.roster} students, and ${error.used} of ${error.licensed} ` +
            "licensed places are already in use, so restoring it would take this school past its " +
            `licence. The class stays archived and none of its records have changed. Free places by ` +
            `archiving another class, or ask ${school.contact_name} to request more on the Program ` +
            "and plan page.",
        };
      }
      throw error;
    }

    recordAudit(db, {
      schoolId: user.school_id,
      actorLabel: user.name,
      action: "class.restored",
      detail: `${classroom.name} restored to active.`,
    });
    revalidatePath("/admin/classes");
    revalidatePath("/admin/data");
    return {};
  } catch (error) {
    const refusal = asExpectedError(error);
    if (refusal) return refusal;
    throw error;
  }
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
