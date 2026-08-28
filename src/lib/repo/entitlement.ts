import "server-only";
import type { Db } from "@/lib/db";

/**
 * What a school has bought, and what it is currently using.
 *
 * Until sprint 42 `schools.licensed_students` was a number an administrator
 * could type into a form labelled "Request a quote" — the action wrote it
 * straight to the row — and nothing anywhere read it back. So the seat count
 * was simultaneously self-editable and unenforced: a school could raise its own
 * paid entitlement, and could also enrol past it without either number
 * objecting. For a school buyer that makes the invoice seat count meaningless,
 * and it is why a vendor cannot run a purchase-order subscription on it without
 * arguing about what was actually sold.
 *
 * The fix is in two halves and both are needed. The quote request records an
 * intent and nothing else, so the licensed figure is only ever changed by the
 * vendor. And enrolment is checked against it at the point a row is written,
 * so the figure means something.
 */

/**
 * How many classes a plan may have active at once.
 *
 * The public page sells "Single classroom · $390 / year · Up to 30 students",
 * and until sprint 52 only the thirty was enforced. A school on the classroom
 * plan could create any number of classes, split its thirty children across
 * them, archive one and create another, and restore archived cohorts freely —
 * so the product sold one classroom and licensed thirty students, which are
 * different things. A buyer could not tell what $390 bought, and the vendor was
 * giving away the difference.
 *
 * `null` means no limit. School and district are sold per school and per
 * district, so the number of rooms is not what they are priced on.
 */
export const ACTIVE_CLASS_LIMIT = {
  classroom: 1,
  school: null,
  district: null,
} as const satisfies Record<string, number | null>;

export type KnownPlan = keyof typeof ACTIVE_CLASS_LIMIT;

export function isKnownPlan(plan: string): plan is KnownPlan {
  return Object.hasOwn(ACTIVE_CLASS_LIMIT, plan);
}

/**
 * The plan's name, or an admission that it has none.
 *
 * Sprint 53: the administrator page rendered this as a ternary ending in
 * `: "Classroom"`, so **every** unrecognised value displayed as the Classroom
 * plan. Combined with `ACTIVE_CLASS_LIMIT[plan] ?? null` — which gave the same
 * value no limit at all — a typo like `"classrooms"` from a migration or a
 * vendor edit showed an administrator the cheapest plan while granting the most
 * expensive behaviour. The paid gate failed open exactly where the entitlement
 * data was malformed, which is the one place it most needs to hold.
 */
export const PLAN_LABEL: Record<KnownPlan, string> = {
  classroom: "Single classroom",
  school: "Whole school",
  district: "District",
};

export const UNRECOGNISED_PLAN_LABEL = "Plan needs configuration";

export function planLabel(plan: string): string {
  return isKnownPlan(plan) ? PLAN_LABEL[plan] : UNRECOGNISED_PLAN_LABEL;
}

/**
 * Raised when `schools.plan` is not a plan this build sells.
 *
 * Distinct from `ClassroomLimitError` because it is a different conversation:
 * the school has not exceeded anything, the record is wrong. It refuses in the
 * safe direction — no new or restored classrooms — and changes nothing, because
 * a bad plan value is not evidence about which classes a school should have.
 */
export class PlanNotRecognisedError extends Error {
  readonly plan: string;

  constructor(plan: string) {
    super(`Unrecognised plan: ${JSON.stringify(plan)}.`);
    this.name = "PlanNotRecognisedError";
    this.plan = plan;
  }
}

/** Shown when the plan cannot be verified. Never mentions a specific plan. */
export function planNotRecognisedRefusal(
  action: "create" | "restore",
  contactName: string,
): string {
  const verb = action === "create" ? "Creating a class" : "Restoring this class";
  return (
    `This school's plan could not be verified, so no new classrooms can be activated. ` +
    `${verb} has been declined and nothing has been changed — every class, archived class ` +
    `and record is exactly as it was. Ask ${contactName} to have the plan corrected on the ` +
    `account, and this will start working again.`
  );
}

/** Raised when a class would take a school past its plan's active classes. */
export class ClassroomLimitError extends Error {
  readonly active: number;
  readonly limit: number;
  readonly plan: string;

  constructor(plan: string, active: number, limit: number) {
    super(`Active classes: ${active} of ${limit} on the ${plan} plan.`);
    this.name = "ClassroomLimitError";
    this.plan = plan;
    this.active = active;
    this.limit = limit;
  }
}

/**
 * What an administrator is told when the room limit refuses.
 *
 * One sentence of fact, one of reassurance, one route out. No child is named —
 * a plan limit is a fact about a school's configuration, not about anybody in
 * it — and the archived records are mentioned explicitly, because the first
 * worry on reading "you cannot have another class" is what happened to the old
 * one.
 */
export function classroomLimitRefusal(error: ClassroomLimitError, action: "create" | "restore"): string {
  const verb = action === "create" ? "Creating another class" : "Restoring this class";
  return (
    `The Single classroom plan includes one active class, and this school already has ` +
    `${error.active}. ${verb} would make ${error.active + 1}. Nothing has been changed, and every ` +
    `archived class and all of its records are still here. Archive the active class to free the ` +
    `slot, or ask for a quote on the Program and plan page.`
  );
}

/**
 * Active classes are the ones being taught. Archived cohorts kept for records
 * do not consume the slot, for the same reason they do not consume seats: a
 * class held for retention is not a class in use, and charging for it would
 * push a school toward deleting records early to free capacity.
 */
export function countActiveClasses(db: Db, schoolId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM classes WHERE school_id = ? AND archived_at IS NULL")
    .get(schoolId) as { n: number };
  return row.n;
}

export interface ClassroomAllowance {
  active: number;
  /**
   * `null` means this plan does not limit rooms — and it is only ever reached
   * for a plan this build recognises. An unknown plan sets `recognised: false`
   * and `limit: 0`, so no lookup miss can be read as "no limit". Deliberately
   * not written with `??`: that operator turns an absent entitlement into an
   * unlimited one, which is the bug this replaced.
   */
  limit: number | null;
  plan: string;
  /** False when `schools.plan` is not a plan this build sells. */
  recognised: boolean;
}

export function classroomAllowance(db: Db, schoolId: string): ClassroomAllowance {
  const school = db.prepare("SELECT plan FROM schools WHERE id = ?").get(schoolId) as
    | { plan: string }
    | undefined;
  if (!school) throw new Error("Unknown school");
  const active = countActiveClasses(db, schoolId);
  if (!isKnownPlan(school.plan)) {
    // Zero, not null. An unverifiable entitlement grants nothing new, and the
    // existing classes are untouched — `active` is reported as it is, which is
    // how the pages can say "3 active, no new ones" without inventing a plan.
    return { active, limit: 0, plan: school.plan, recognised: false };
  }
  return { active, limit: ACTIVE_CLASS_LIMIT[school.plan], plan: school.plan, recognised: true };
}

/**
 * Would one more active class exceed the plan?
 *
 * Written as "is there room for one more" rather than "is the school over its
 * limit", because a database that is already over — from a plan downgrade, or
 * from before this rule existed — must be left exactly as it is. Nothing here
 * deletes, archives or picks a class; it refuses the next one and says why.
 */
export function assertRoomForActiveClass(db: Db, schoolId: string): void {
  const { active, limit, plan, recognised } = classroomAllowance(db, schoolId);
  // An unverifiable plan fails closed. Sprint 34 settled this direction for an
  // unrecognised database and the reasoning is the same: refusing leaves
  // everything readable and recoverable, while guessing grants something
  // nobody agreed to sell.
  if (!recognised) throw new PlanNotRecognisedError(plan);
  if (limit !== null && active >= limit) {
    throw new ClassroomLimitError(plan, active, limit);
  }
}

/** Raised when an enrolment would take a school past its licensed seats. */
export class LicenceExceededError extends Error {
  readonly used: number;
  readonly licensed: number;

  constructor(used: number, licensed: number) {
    super(`Licensed seats used: ${used} of ${licensed}.`);
    this.name = "LicenceExceededError";
    this.used = used;
    this.licensed = licensed;
  }
}

/**
 * Seats in use: children on the roster of a class that is currently active.
 *
 * Archived classes are deliberately excluded. A school keeps last year's
 * cohorts for its retention period, and a cohort held for records is not a
 * child being taught — charging a new school year for children who left in July
 * would mean a school buying seats twice for the same desk, and would push
 * administrators toward deleting records early to free capacity. That is the
 * opposite of what the retention policy is for.
 */
export function countActiveRosterStudents(db: Db, schoolId: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n
         FROM students s
         JOIN classes c ON c.id = s.class_id
        WHERE c.school_id = ? AND c.archived_at IS NULL`,
    )
    .get(schoolId) as { n: number };
  return row.n;
}

/**
 * Raised when restoring an archived cohort would take a school past its seats.
 *
 * Extends `LicenceExceededError` so a caller that only cares "the licence said
 * no" still catches it, and carries the roster being brought back, because an
 * administrator cannot act on "you are over" without knowing by how much.
 */
export class RestoreExceedsLicenceError extends LicenceExceededError {
  /** Children on the archived roster that restoring would reactivate. */
  readonly roster: number;

  constructor(used: number, roster: number, licensed: number) {
    super(used, licensed);
    this.name = "RestoreExceedsLicenceError";
    this.message = `Restoring ${roster} students would take ${used} of ${licensed} past the licence.`;
    this.roster = roster;
  }
}

export interface LicenceStatus {
  used: number;
  licensed: number;
  /** Never negative: a school whose licence was cut is at zero, not below it. */
  remaining: number;
}

export function licenceStatus(db: Db, schoolId: string): LicenceStatus {
  const licensed = (
    db.prepare("SELECT licensed_students AS n FROM schools WHERE id = ?").get(schoolId) as
      | { n: number }
      | undefined
  )?.n;
  if (licensed === undefined) throw new Error("Unknown school");
  const used = countActiveRosterStudents(db, schoolId);
  return { used, licensed, remaining: Math.max(0, licensed - used) };
}
