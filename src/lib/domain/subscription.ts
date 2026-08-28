import type { School } from "@/lib/types";

/**
 * What the subscription term actually means.
 *
 * `schools.term_renews_on` existed from the start and, until sprint 49, changed
 * nothing but labels. Every classroom and student write succeeded after it, and
 * the Program & plan page said as much: it described a real deployment making
 * classes read-only and then admitted this build did not. So the annual term a
 * school buys was not a term, and the renewal date was a note in a diary.
 *
 * This file is the single place that decides. One rule, one meaning, testable
 * without a clock.
 *
 * **The rule matches the wording the product already used**: the school is
 * active *through* the renewal date and lapsed on the next calendar day. A
 * renewal on 2026-09-01 means the first of September is a normal teaching day.
 *
 * **Date-only, deliberately.** The stored value is `YYYY-MM-DD` — a school
 * business date, not an instant — so the comparison is between date strings and
 * never between timestamps. `now` is reduced to its UTC calendar date rather
 * than the server's local one, because a deployment that lapses at a different
 * moment depending on the host's `TZ` is a bug nobody can reproduce. The cost is
 * that the boundary can sit a few hours off a school's local midnight; the
 * benefit is that it is the same everywhere and can be reasoned about.
 */

/** The UTC calendar date of an instant, as `YYYY-MM-DD`. */
export function calendarDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export type SubscriptionState =
  | { kind: "active"; renewsOn: string }
  | { kind: "lapsed"; renewedOn: string };

export function subscriptionState(
  school: Pick<School, "term_renews_on">,
  now: Date,
): SubscriptionState {
  const renewsOn = school.term_renews_on;
  // An unset renewal date cannot lapse a school. Refusing to teach because a
  // field is empty would be the software inventing a commercial fact.
  if (!renewsOn) return { kind: "active", renewsOn };
  return calendarDate(now) > renewsOn
    ? { kind: "lapsed", renewedOn: renewsOn }
    : { kind: "active", renewsOn };
}

export function hasLapsed(school: Pick<School, "term_renews_on">, now: Date): boolean {
  return subscriptionState(school, now).kind === "lapsed";
}

/**
 * What a lapsed school is told, in each of the two voices the product has.
 *
 * Staff get the commercial fact and the way out. Children get neither: a child
 * is not a party to the contract and must not be shown billing language, so
 * they get the same sentence they would get for any closed class.
 */
export const LAPSED_STAFF_TITLE = "This subscription has ended";

export const LAPSED_STAFF_BODY =
  "Classroom changes are paused: nobody can start or record new work, and rosters, " +
  "assignments, class codes and check-in windows cannot be changed. Everything the " +
  "school already has stays here and stays readable — records, reports and exports are " +
  "all still available, and nothing has been deleted. An administrator can request " +
  "renewal on the Program and plan page.";

/** Shown to staff when a write is refused, and returned by the server actions. */
export const LAPSED_WRITE_REFUSAL =
  "This school's subscription has ended, so classroom changes are paused. Records, " +
  "reports and exports are still available. An administrator can request renewal on " +
  "the Program and plan page.";

/** Grade 2-4. No billing, no blame, and a person to go to. */
export const LAPSED_STUDENT_MESSAGE = "Your class isn't open right now. Ask your teacher.";
