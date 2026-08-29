import type { Classroom, School } from "@/lib/types";
import {
  ACADEMIC_NEEDS_CONFIGURATION,
  ACADEMIC_PROBLEM_MESSAGE,
  academicProblem,
  isCalendarDate,
} from "@/lib/domain/calendar";
import { formatDate } from "./retention";

/**
 * Rolling a school into its next academic year.
 *
 * There was no rollover at all. The class page took the year from whichever
 * class sorted first and fell back to a hard-coded "2025-2026", the create form
 * hid it in a hidden field, and the action had the same literal as its default
 * — so on 27 August 2026 every new class was still being created in the
 * previous year. Nothing anywhere moved the term dates. The annual programme
 * could not survive its first renewal.
 *
 * This is a pure preview so an administrator can see exactly what will happen
 * before anything does, and so the four claims it makes can be tested without
 * a database.
 */
export interface RolloverPreview {
  /** The year being left. */
  fromYear: string;
  /** The year being entered, derived from the one being left. */
  toYear: string;
  /** Academic dates for the new year, a year on from the current ones. */
  startsOn: string;
  endsOn: string;
  /** Classes in the current year that will be archived. */
  toArchive: { id: string; name: string; grade: number }[];
  /** Already archived, and untouched by this. */
  alreadyArchived: number;
  /**
   * Whether any check-in window is open. Rolling over closes it, because a
   * spring window left open would greet the new cohort with the previous
   * year's form.
   */
  windowWasOpen: boolean;
  /**
   * Human-readable statement that historical retention does not move. Each
   * class carries its own year-end snapshot, so this is a fact rather than a
   * promise.
   */
  retentionNote: string;
}

/** "2025-2026" -> "2026-2027". Returns null if the label is not that shape. */
export function nextYearLabel(year: string): string | null {
  const match = /^(\d{4})-(\d{4})$/.exec(year);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (end !== start + 1) return null;
  return `${start + 1}-${end + 1}`;
}

/**
 * Add a year to an ISO date, keeping the day where the calendar allows it.
 * 29 February becomes 28 February rather than rolling into March.
 */
/**
 * Add a year, or return null when the input is not a real day.
 *
 * Sprint 60: this used to build a `Date` from whatever it was given, and
 * `new Date("2026-13-45").getUTCFullYear()` is `NaN`, so `Date.UTC(NaN, …)`
 * produced an Invalid Date and `.toISOString()` threw `RangeError` — taking
 * down the Program page, which is the only place an administrator can correct
 * the dates. The recovery surface must never be the thing that breaks.
 */
export function addYearOrNull(iso: string): string | null {
  return isCalendarDate(iso) ? addYear(iso) : null;
}

export function addYear(iso: string): string {
  const date = new Date(iso);
  const year = date.getUTCFullYear() + 1;
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const safe = new Date(Date.UTC(year, month, Math.min(day, lastDay)));
  return safe.toISOString().slice(0, 10);
}

export function previewRollover(
  school: School,
  classes: Classroom[],
): RolloverPreview | { error: string } {
  // Validate the whole calendar before any formatting or arithmetic. The old
  // check looked only at the label, so a valid label with an impossible date
  // reached `addYear` and `formatDate` below.
  const problem = academicProblem({
    year: school.academic_year,
    startsOn: school.year_starts_on,
    endsOn: school.year_ends_on,
  });
  if (problem) {
    // Never quotes the stored value back: a malformed label is not a fact
    // about the school year and does not belong on the page as though it were.
    return {
      error: `${ACADEMIC_NEEDS_CONFIGURATION}. ${ACADEMIC_PROBLEM_MESSAGE[problem]}`,
    };
  }
  const toYear = nextYearLabel(school.academic_year);
  const startsOn = addYearOrNull(school.year_starts_on);
  const endsOn = addYearOrNull(school.year_ends_on);
  if (!toYear || !startsOn || !endsOn) {
    return { error: `${ACADEMIC_NEEDS_CONFIGURATION}. ${ACADEMIC_PROBLEM_MESSAGE.label}` };
  }

  const current = classes.filter(
    (c) => c.school_year === school.academic_year && !c.archived_at,
  );
  return {
    fromYear: school.academic_year,
    toYear,
    startsOn,
    endsOn,
    toArchive: current.map((c) => ({ id: c.id, name: c.name, grade: c.grade })),
    alreadyArchived: classes.filter((c) => c.archived_at).length,
    windowWasOpen: school.benchmark_window !== "closed",
    retentionNote: `Nothing already here changes its deletion date. Every class keeps the year-end it was created with, so ${school.academic_year} classes stay due ${formatDate(
      school.year_ends_on,
    )} plus ${school.retention_months} months.`,
  };
}
