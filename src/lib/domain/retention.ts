import type { Classroom, School } from "@/lib/types";
import { isCalendarDate } from "@/lib/domain/calendar";

/**
 * Retention math for the administrator's data controls.
 *
 * The product's position is that a school should be able to answer "when does
 * this disappear" with a date, not a policy paragraph. Everything here is a
 * pure calculation over the school's configured window so the admin screen can
 * show that date before anybody clicks a destructive button.
 */

export const RETENTION_OPTIONS = [
  { months: 3, label: "3 months after the school year ends" },
  { months: 12, label: "12 months after the school year ends", recommended: true },
  { months: 24, label: "24 months after the school year ends" },
  { months: 36, label: "36 months after the school year ends" },
] as const;

/**
 * The retention windows this product recognizes, and nothing else.
 *
 * `schools.retention_months` is unconstrained integer data. The form only ever
 * writes one of the four values above, but a vendor edit, a migration defect or
 * a stale value — `-12`, `0`, `7`, `120` — is data this code used to accept
 * without looking. It went straight into `addMonths`, and a **negative** window
 * moves a cohort's deletion date to before its school year ended, which makes
 * every class immediately eligible and hands `runScheduledPurge` a license to
 * permanently delete the roster, every attempt and both check-ins, with no
 * restore path.
 *
 * So an unrecognized value is classified, never repaired. Not coerced, not
 * clamped, not rounded, and above all not defaulted to twelve: a guess that
 * lands early deletes a child's records before the school's own policy said it
 * would, and a guess that lands late retains them past it. Neither is a
 * decision this code gets to make on a school's behalf — the same reasoning
 * sprint 32 applied to a missing year-end date, and the same direction sprints
 * 34 and 53 settled for unrecognized state.
 */
export const RECOGNISED_RETENTION_MONTHS: readonly number[] = RETENTION_OPTIONS.map(
  (option) => option.months,
);

export function isRecognizedRetention(months: unknown): months is number {
  return (
    typeof months === "number" &&
    Number.isInteger(months) &&
    RECOGNISED_RETENTION_MONTHS.includes(months)
  );
}

/**
 * Why a cohort has no deletion date. Three reasons, all different.
 *
 * Sprint 60 added the third. A **malformed** year end — `"2026-13-45"`, a
 * timestamp, anything that is not a real day — used to pass the emptiness check
 * and go straight into `addMonths`, which returned an Invalid Date. The row
 * then read as having a schedule while the purge job compared `NaN <= now`,
 * found it false, and moved on saying nothing was due. A missing date is an
 * administrator mid-migration; a malformed one is a broken record that was
 * silently retaining a child's records for ever.
 */
export type RetentionBlock = "unrecognized-policy" | "no-year-end" | "malformed-year-end";

export function addMonths(iso: string, months: number): Date {
  const date = new Date(iso);
  const day = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + months);
  // Guard the 31st-of-a-short-month case.
  if (date.getUTCDate() < day) date.setUTCDate(0);
  return date;
}

/**
 * When the school's **current** cohort becomes due. A summary figure only.
 *
 * Until sprint 32 this used `term_renews_on` — the subscription renewal — for
 * every class in the school, while the interface said "after the school year
 * ends". In the seed those are September 1st and June 12th, three months apart,
 * and a future cohort would have inherited the same fixed renewal date and
 * could have come due before its own retention period had elapsed. Renewal is
 * when money changes hands; the school year ends when the children go home.
 */
export function purgeDateFor(school: School): Date | null {
  if (!isRecognizedRetention(school.retention_months)) return null;
  // Validated, not merely non-empty. `addMonths` on a malformed string returns
  // an Invalid Date, and an Invalid Date is worse than no date: it renders, it
  // compares false against everything, and it looks like a schedule.
  if (!isCalendarDate(school.year_ends_on)) return null;
  return addMonths(school.year_ends_on, school.retention_months);
}

/** Why this school has no schedule for its current year, or null. */
export function schoolYearEndBlock(school: Pick<School, "year_ends_on">): RetentionBlock | null {
  if (!school.year_ends_on) return "no-year-end";
  return isCalendarDate(school.year_ends_on) ? null : "malformed-year-end";
}

/**
 * When one cohort becomes due, from that cohort's own year-end date.
 *
 * This is the one that matters. A class snapshots its year-end at creation, so
 * rolling the school over never moves an existing cohort's deletion date and a
 * new cohort never inherits an old one.
 */
export function purgeDateForClass(
  classroom: Pick<Classroom, "year_ends_on">,
  retentionMonths: number,
): Date | null {
  // Empty means the school year end was never recorded — a database migrated
  // from before sprint 32, where nothing held that date. Retention is blocked
  // rather than guessed: a guessed date that lands early would delete a
  // child's records before the school's own window had elapsed, and that is
  // not a decision this code gets to make on a school's behalf.
  // And the policy itself. An unrecognized window produces no date at all,
  // rather than an arithmetic result nobody asked for — a negative one lands
  // before the year even ended.
  if (!isRecognizedRetention(retentionMonths)) return null;
  if (!isCalendarDate(classroom.year_ends_on)) return null;
  return addMonths(classroom.year_ends_on, retentionMonths);
}

/**
 * Why this school has no schedule, or null when it has one.
 *
 * Distinct from "no date recorded" on purpose: a missing year-end is an
 * administrator finishing a migration, and an unrecognized window is a broken
 * account record. They need different sentences and different people.
 */
export function retentionBlock(school: Pick<School, "retention_months">): RetentionBlock | null {
  return isRecognizedRetention(school.retention_months) ? null : "unrecognized-policy";
}

export interface RetentionRow {
  classId: string;
  className: string;
  grade: number;
  schoolYear: string;
  studentCount: number;
  archived: boolean;
  /** Null when there is no date to show, for either reason below. */
  purgeOn: Date | null;
  /**
   * Why there is no date. `"no-year-end"` is a cohort whose school year was
   * never recorded; `"unrecognized-policy"` is a school whose retention window
   * is not one this product sells. Null when a date exists.
   */
  blockedReason: RetentionBlock | null;
  /** Never true while `purgeOn` is null. Unknown is not the same as due. */
  eligibleNow: boolean;
}

/**
 * Retention is anchored to the end of the school year the class belongs to,
 * and to nothing else.
 *
 * Anchored to that cohort's own year-end date, snapshotted when the class was
 * created, so a rollover never moves it.
 *
 * An earlier draft anchored an archived class to its archive date. That is
 * worse in both directions: archiving in March would silently delete a class's
 * records months before the school-wide schedule said they would go, and
 * archiving last year's class in September would push its deletion further out
 * than the policy allows. Archiving is an oorganizational act; the deletion date
 * is a policy the administrator set once.
 */
export function retentionRows(
  school: School,
  classes: (Classroom & { studentCount: number })[],
  now: Date,
): RetentionRow[] {
  return classes.map((c) => {
    // Per cohort, from its own snapshotted year end. One shared date for the
    // whole school was the defect: a class created after a rollover would have
    // carried the previous term's date.
    const purgeOn = purgeDateForClass(c, school.retention_months);
    // The policy is checked first, because a school with a broken window has
    // no schedule at all regardless of what any individual cohort recorded.
    const blockedReason: RetentionBlock | null = !isRecognizedRetention(school.retention_months)
      ? "unrecognized-policy"
      : !c.year_ends_on
        ? "no-year-end"
        : isCalendarDate(c.year_ends_on)
          ? null
          : "malformed-year-end";
    return {
      classId: c.id,
      className: c.name,
      grade: c.grade,
      schoolYear: c.school_year,
      studentCount: c.studentCount,
      archived: Boolean(c.archived_at),
      purgeOn,
      blockedReason,
      eligibleNow: purgeOn !== null && purgeOn.getTime() <= now.getTime(),
    };
  });
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
