import type { Classroom, School } from "@/lib/types";

/**
 * Retention maths for the administrator's data controls.
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
export function purgeDateFor(school: School): Date {
  return addMonths(school.year_ends_on, school.retention_months);
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
): Date {
  return addMonths(classroom.year_ends_on, retentionMonths);
}

export interface RetentionRow {
  classId: string;
  className: string;
  grade: number;
  schoolYear: string;
  studentCount: number;
  archived: boolean;
  purgeOn: Date;
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
 * than the policy allows. Archiving is an organisational act; the deletion date
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
    return {
      classId: c.id,
      className: c.name,
      grade: c.grade,
      schoolYear: c.school_year,
      studentCount: c.studentCount,
      archived: Boolean(c.archived_at),
      purgeOn,
      eligibleNow: purgeOn.getTime() <= now.getTime(),
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
