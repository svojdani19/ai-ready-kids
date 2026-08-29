import "server-only";
import type { Db } from "@/lib/db";

/**
 * What a school has bought, and what it is currently using.
 *
 * Until sprint 42 `schools.licensed_students` was a number an administrator
 * could type into a form labeled "Request a quote" — the action wrote it
 * straight to the row — and nothing anywhere read it back. So the seat count
 * was simultaneously self-editable and unenforced: a school could raise its own
 * paid entitlement, and could also enrol past it without either number
 * objecting. For a school buyer that makes the invoice seat count meaningless,
 * and it is why a vendor cannot run a purchase-order subscription on it without
 * arguing about what was actually sold.
 *
 * The fix is in two halves and both are needed. The quote request records an
 * intent and nothing else, so the licensed figure is only ever changed by the
 * vendor. And enrollment is checked against it at the point a row is written,
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
 * `: "Classroom"`, so **every** unrecognized value displayed as the Classroom
 * plan. Combined with `ACTIVE_CLASS_LIMIT[plan] ?? null` — which gave the same
 * value no limit at all — a typo like `"classrooms"` from a migration or a
 * vendor edit showed an administrator the cheapest plan while granting the most
 * expensive behavior. The paid gate failed open exactly where the entitlement
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
export class PlanNotRecognizedError extends Error {
  readonly plan: string;

  constructor(plan: string) {
    super(`Unrecognized plan: ${JSON.stringify(plan)}.`);
    this.name = "PlanNotRecognizedError";
    this.plan = plan;
  }
}

/** Shown when the plan cannot be verified. Never mentions a specific plan. */
export function planNotRecognizedRefusal(
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
   * for a plan this build recognizes. An unknown plan sets `recognized: false`
   * and `limit: 0`, so no lookup miss can be read as "no limit". Deliberately
   * not written with `??`: that operator turns an absent entitlement into an
   * unlimited one, which is the bug this replaced.
   */
  limit: number | null;
  plan: string;
  /** False when `schools.plan` is not a plan this build sells. */
  recognized: boolean;
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
    return { active, limit: 0, plan: school.plan, recognized: false };
  }
  return { active, limit: ACTIVE_CLASS_LIMIT[school.plan], plan: school.plan, recognized: true };
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
  const { active, limit, plan, recognized } = classroomAllowance(db, schoolId);
  // An unverifiable plan fails closed. Sprint 34 settled this direction for an
  // unrecognized database and the reasoning is the same: refusing leaves
  // everything readable and recoverable, while guessing grants something
  // nobody agreed to sell.
  if (!recognized) throw new PlanNotRecognizedError(plan);
  if (limit !== null && active >= limit) {
    throw new ClassroomLimitError(plan, active, limit);
  }
}

/**
 * The seat counts this product recognizes as a contract number.
 *
 * `schools.licensed_students` is unconstrained, and the column's INTEGER
 * affinity does not stop SQLite storing a float or text. Until sprint 56 every
 * value was trusted as a purchased entitlement: `-5` showed a buyer "90 of -5
 * licensed", told teachers the school had exceeded a negative license, was
 * repeated back in quote messages as the current agreement, and misclassified
 * every enrollment as an overage. `5001` granted capacity outside the range the
 * product's own quote form accepts, and presented it as bought.
 *
 * The range is exactly the one `requestPlanChangeAction` already enforces, and
 * it lives here so the two cannot drift — an administrator cannot request a
 * number the domain would then refuse, and the domain cannot accept a number
 * the form would reject.
 *
 * Nothing is coerced. No `Number()`, no clamp, no round, no `Math.max` into
 * validity, and no falling back to a plan's suggested seats: a malformed vendor
 * value is not evidence of what a school bought, and inventing an entitlement
 * is the failure this replaces.
 */
export const MIN_LICENSED_STUDENTS = 1;
export const MAX_LICENSED_STUDENTS = 5000;

export function isRecognizedSeatCount(seats: unknown): seats is number {
  return (
    typeof seats === "number" &&
    Number.isInteger(seats) &&
    seats >= MIN_LICENSED_STUDENTS &&
    seats <= MAX_LICENSED_STUDENTS
  );
}

/**
 * Raised when the stored seat count is not a contract number this product
 * recognizes. Distinct from `LicenseExceededError`: the school has not
 * exceeded anything, its account record is wrong, and telling a teacher they
 * are over a license would be false as well as unhelpful.
 */
export class LicenseNotRecognizedError extends Error {
  constructor() {
    super("The seat license on this school is not a recognized number.");
    this.name = "LicenseNotRecognizedError";
  }
}

/** Shown to staff. Never repeats the malformed value back to them. */
export function licenseNotRecognizedRefusal(
  action: "enrol" | "restore",
  contactName: string,
): string {
  const verb = action === "enrol" ? "Adding a student" : "Restoring this class";
  return (
    `This school's seat license needs configuration, so no new students can be enrolled. ` +
    `${verb} has been declined and nothing has been changed — every class, roster and record ` +
    `is exactly as it was. Ask ${contactName} to have the seat license corrected on the account.`
  );
}

/** Raised when an enrollment would take a school past its licensed seats. */
export class LicenseExceededError extends Error {
  readonly used: number;
  readonly licensed: number;

  constructor(used: number, licensed: number) {
    super(`Licensed seats used: ${used} of ${licensed}.`);
    this.name = "LicenseExceededError";
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
 * Extends `LicenseExceededError` so a caller that only cares "the license said
 * no" still catches it, and carries the roster being brought back, because an
 * administrator cannot act on "you are over" without knowing by how much.
 */
export class RestoreExceedsLicenseError extends LicenseExceededError {
  /** Children on the archived roster that restoring would reactivate. */
  readonly roster: number;

  constructor(used: number, roster: number, licensed: number) {
    super(used, licensed);
    this.name = "RestoreExceedsLicenseError";
    this.message = `Restoring ${roster} students would take ${used} of ${licensed} past the license.`;
    this.roster = roster;
  }
}

/**
 * Seats in use, and — only when the stored number is a recognized contract
 * value — what was bought and what is left.
 *
 * Discriminated on purpose. The old shape returned `licensed` and `remaining`
 * whatever was stored, so every caller had a number to display and compare
 * against, and none of them could tell that the number meant nothing. `used` is
 * always real: it is counted from rosters, not read from the account.
 */
export type LicenseStatus =
  | { recognized: true; used: number; licensed: number; remaining: number }
  | { recognized: false; used: number };

export function licenseStatus(db: Db, schoolId: string): LicenseStatus {
  const row = db.prepare("SELECT licensed_students AS n FROM schools WHERE id = ?").get(schoolId) as
    | { n: unknown }
    | undefined;
  if (row === undefined) throw new Error("Unknown school");
  const used = countActiveRosterStudents(db, schoolId);
  if (!isRecognizedSeatCount(row.n)) return { recognized: false, used };
  const licensed = row.n;
  return { recognized: true, used, licensed, remaining: Math.max(0, licensed - used) };
}
