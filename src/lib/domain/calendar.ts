/**
 * One definition of a date this product will act on, and one of an academic
 * year label.
 *
 * Extracted from sprint 58's `isContractDate` rather than re-stated: two
 * validators for "is this a real day" drift, and the whole point of both is
 * that a value either means something or it does not.
 *
 * Sprint 60: `setAcademicDatesAction` checked only the regex shape, so
 * `"2026-13-45"` and `"2026-02-30"` were saved to the school **and backfilled
 * into classes**. The `<=` ordering check passed because comparing two Invalid
 * Dates yields NaN and every comparison against NaN is false. From there:
 * `addYear` threw `RangeError` and took the administrator's recovery page down
 * with it; `purgeDateForClass` returned an Invalid Date, so a cohort read as
 * having a deletion date while the purge job silently skipped it and exited
 * saying nothing was due — a child's records retained indefinitely behind a
 * screen that displayed `Invalid Date`.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_LABEL = /^(\d{4})-(\d{4})$/;

/**
 * Exactly `YYYY-MM-DD`, and a real day.
 *
 * The UTC round-trip is what rejects an impossible day: `2026-02-30` parses to
 * March 2nd and does not stringify back to what was written. A real leap day
 * survives it. Non-coercive — no `trim`, no `Date.parse`, no normalising a
 * nearly right value into a right one.
 */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Midnight UTC on a validated calendar date. Never an Invalid Date. */
export function calendarDateOrNull(value: unknown): Date | null {
  return isCalendarDate(value) ? new Date(`${value}T00:00:00.000Z`) : null;
}

/**
 * Exactly `YYYY-YYYY`, and consecutive.
 *
 * `"2025-2027"` was accepted on shape alone, which is not a school year — and
 * a class created under it snapshotted the label without anybody checking.
 */
export function academicYearBounds(label: unknown): { first: number; second: number } | null {
  if (typeof label !== "string") return null;
  const match = YEAR_LABEL.exec(label);
  if (!match) return null;
  const first = Number(match[1]);
  const second = Number(match[2]);
  return second === first + 1 ? { first, second } : null;
}

export function isAcademicYearLabel(label: unknown): label is string {
  return academicYearBounds(label) !== null;
}

export type AcademicDates = { year: string; startsOn: string; endsOn: string };

/**
 * Why a school's academic calendar cannot be acted on, or null when it can.
 *
 * The span check is what makes the label and the dates one fact rather than
 * three fields: a year called 2025-2026 that runs from 2019 to 2031 is not a
 * school year, and every cohort created under it would snapshot a deletion date
 * from a calendar nobody recognises.
 */
export type AcademicProblem =
  | "label"
  | "start-date"
  | "end-date"
  | "order"
  | "span";

export function academicProblem(input: {
  year: unknown;
  startsOn: unknown;
  endsOn: unknown;
}): AcademicProblem | null {
  const bounds = academicYearBounds(input.year);
  if (!bounds) return "label";
  if (!isCalendarDate(input.startsOn)) return "start-date";
  if (!isCalendarDate(input.endsOn)) return "end-date";
  // Strictly before: a year that starts and ends on the same day is not one.
  if (!(input.startsOn < input.endsOn)) return "order";
  const startYear = Number(input.startsOn.slice(0, 4));
  const endYear = Number(input.endsOn.slice(0, 4));
  const within = (y: number) => y === bounds.first || y === bounds.second;
  if (!within(startYear) || !within(endYear)) return "span";
  return null;
}

export function hasVerifiableAcademicDates(school: {
  academic_year: unknown;
  year_starts_on: unknown;
  year_ends_on: unknown;
}): boolean {
  return (
    academicProblem({
      year: school.academic_year,
      startsOn: school.year_starts_on,
      endsOn: school.year_ends_on,
    }) === null
  );
}

/** What an administrator is told, per problem. Never quotes the stored value. */
export const ACADEMIC_PROBLEM_MESSAGE: Record<AcademicProblem, string> = {
  label: "Write the school year as two consecutive years, like 2025-2026.",
  "start-date": "Give the first day as a real date in year-month-day order, like 2025-08-25.",
  "end-date": "Give the last day as a real date in year-month-day order, like 2026-06-12.",
  order: "The year has to end after it starts.",
  span: "Both dates have to fall inside the two years you named.",
};

export const ACADEMIC_NEEDS_CONFIGURATION = "Academic dates need configuration";
