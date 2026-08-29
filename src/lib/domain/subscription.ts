import type { School } from "@/lib/types";
import { isCalendarDate } from "@/lib/domain/calendar";

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

/**
 * A contract date this product recognizes: exactly `YYYY-MM-DD`, and a real
 * day in the calendar.
 *
 * `term_starts_on` and `term_renews_on` are unconstrained text, and sprint 49
 * compared the renewal string lexicographically without ever asking whether it
 * was a date. So `"soon"` sorted after every real date and kept a school active
 * **indefinitely**; `"2026-13-45"` and `"2026-02-30"` were treated as ordinary
 * deadlines; a timestamp or a padded string compared as text; and the pages
 * rendered `Invalid Date` and `in NaN days`.
 *
 * The round-trip is what rejects an impossible day: `2026-02-30` parses to
 * March 2nd, which does not stringify back to what was written. A real leap day
 * survives it — `2024-02-29` round-trips exactly.
 *
 * Non-coercive throughout. No `trim`, no `Date.parse`, no normalizing a nearly
 * right value into a right one: a malformed date is not evidence of when a term
 * begins or ends, and guessing sets a commercial deadline nobody agreed to.
 */
// Sprint 60 extracted this to `calendar.ts`, because the academic dates need
// the identical rule and two definitions of "is this a real day" drift.
export const isContractDate = isCalendarDate;

/** Both dates real, and the term does not renew before it starts. */
export function hasVerifiableTerm(
  school: Pick<School, "term_starts_on" | "term_renews_on">,
  ): boolean {
  return (
    isContractDate(school.term_starts_on) &&
    isContractDate(school.term_renews_on) &&
    school.term_starts_on <= school.term_renews_on
  );
}

/**
 * Three states, not two.
 *
 * Sprint 49's rule was that an unset renewal date cannot lapse a school,
 * because refusing to teach over a blank field would be inventing a commercial
 * fact. That reasoning holds — and the conclusion was half of one. **Active is
 * also a commercial decision.** A paid product that cannot verify its own term
 * should say so rather than pick the answer that happens to keep teaching, and
 * `needs-configuration` is neither ended nor overdue: nobody's subscription
 * expired, the record is unreadable.
 */
export type SubscriptionState =
  | { kind: "active"; renewsOn: string }
  | { kind: "lapsed"; renewedOn: string }
  | { kind: "needs-configuration" };

export function subscriptionState(
  school: Pick<School, "term_starts_on" | "term_renews_on">,
  now: Date,
): SubscriptionState {
  if (!hasVerifiableTerm(school)) return { kind: "needs-configuration" };
  const renewsOn = school.term_renews_on;
  return calendarDate(now) > renewsOn
    ? { kind: "lapsed", renewedOn: renewsOn }
    : { kind: "active", renewsOn };
}

export function hasLapsed(
  school: Pick<School, "term_starts_on" | "term_renews_on">,
  now: Date,
): boolean {
  return subscriptionState(school, now).kind === "lapsed";
}

/**
 * Why new classroom work is closed, or null when it is open.
 *
 * The two reasons close the same doors and need different sentences: one is a
 * subscription that ended, the other an account record nobody can read.
 */
export function instructionClosed(
  school: Pick<School, "term_starts_on" | "term_renews_on">,
  now: Date,
): "lapsed" | "needs-configuration" | null {
  const state = subscriptionState(school, now);
  return state.kind === "active" ? null : state.kind;
}

/**
 * What a lapsed school is told, in each of the two voices the product has.
 *
 * Staff get the commercial fact and the way out. Children get neither: a child
 * is not a party to the contract and must not be shown billing language, so
 * they get the same sentence they would get for any closed class.
 */
export const LAPSED_STAFF_TITLE = "This subscription has ended";

/**
 * What a paused term does and does not do to records, stated causally.
 *
 * Sprint 65: every one of these notices said "nothing has been deleted", and
 * the lapsed one added that everything the school already has "stays here and
 * stays readable". Audited against `subscription-gate.ts` and the purge, all of
 * that is unsupported.
 *
 * The term gate covers **instructional and classroom writes only**. Sprint 49
 * deliberately left retention outside it: `runScheduledPurge` has no
 * subscription check at all, `deleteClassDataAction` is on the allowed list,
 * and so are the retention settings. That was the right call — holding a
 * school's own records hostage to an invoice would be the wrong product — but
 * it means a due cohort may **already have been purged** before the notice was
 * read, and another may be deleted **while it is on screen**.
 *
 * So the claim is narrowed to the one this product can actually make: the
 * pause itself is not a deletion, and the schedule the school configured
 * carries on. Nothing here promises what still exists.
 */
const RETENTION_UNAFFECTED =
  "This does not itself delete or hide anything. Records still inside the school's retention " +
  "window remain available, along with reports and exports, and the retention schedule the " +
  "school configured and the administrator's own deletion controls carry on as before.";

export const LAPSED_STAFF_BODY =
  "Classroom changes are paused: nobody can start or record new work, and rosters, " +
  "assignments, class codes and check-in windows cannot be changed. " +
  RETENTION_UNAFFECTED;

/**
 * Shown to staff when a write is refused, and returned by the server actions.
 *
 * "Nothing has been changed" stays in the refusal messages, because there it is
 * transactionally true of the action that was just rejected — the gate refuses
 * before any write. It is a statement about this attempt, not about the school.
 */
export const LAPSED_WRITE_REFUSAL =
  "This school's subscription has ended, so classroom changes are paused. Nothing has been " +
  "changed. Records, reports and exports are still available. An administrator can request " +
  "renewal on the Program and plan page.";

export const UNVERIFIED_STAFF_TITLE = "Subscription dates need configuration";

export const UNVERIFIED_STAFF_BODY =
  "This school's subscription dates cannot be read, so classroom changes are paused: nobody " +
  "can start or record new work, and rosters, assignments, class codes and check-in windows " +
  "cannot be changed. This is not an expiry — nothing has ended. " +
  RETENTION_UNAFFECTED +
  " Ask your account contact to correct the subscription dates on the account.";

/** Returned by the server actions when the term cannot be verified. */
export const UNVERIFIED_WRITE_REFUSAL =
  "This school's subscription dates need configuration, so classroom changes are paused. " +
  "Nothing has ended and nothing has been changed. Records, reports and exports are still " +
  "available. Ask your account contact to correct the subscription dates.";

/** Grade 2-4. No billing, no blame, and a person to go to. */
export const LAPSED_STUDENT_MESSAGE = "Your class isn't open right now. Ask your teacher.";

/**
 * What a member of staff is told when classroom work is closed, and where to
 * go — which depends on **why** it is closed and **who** is reading.
 *
 * Sprint 59: the shell rendered one recovery link for everybody, "Request
 * renewal on the Program and plan page", pointing at `/admin/program`. Two
 * contradictions followed from that. The notice said "This is not an expiry"
 * and then told staff to request renewal — which is a sales action for a
 * problem that is a broken account record. And a **teacher** cannot open that
 * link at all: `requireAdmin` bounces them straight back to `/teacher`, so the
 * one route offered was a dead end for most of the people who would see it.
 *
 * Four combinations, each with a route the reader can actually take. No support
 * address is invented, and nothing implies the quote form corrects dates — only
 * the vendor can do that, and the copy says so.
 */
export interface SubscriptionNotice {
  title: string;
  body: string;
  /** Omitted when the reader has no page they are allowed to open. */
  link?: { href: string; label: string };
}

export function subscriptionNotice(
  reason: "lapsed" | "needs-configuration",
  role: "admin" | "teacher",
): SubscriptionNotice {
  if (reason === "needs-configuration") {
    return {
      title: UNVERIFIED_STAFF_TITLE,
      body: UNVERIFIED_STAFF_BODY,
      link:
        role === "admin"
          ? // Honestly labeled: the page shows the account details, it does
            // not correct them. Offered because it is the only surface an
            // administrator has for this, not because it fixes anything.
            { href: "/admin/program", label: "See your account details on the Program and plan page" }
          : undefined,
    };
  }
  return {
    title: LAPSED_STAFF_TITLE,
    body: LAPSED_STAFF_BODY,
    link:
      role === "admin"
        ? { href: "/admin/program", label: "Request renewal on the Program and plan page" }
        : undefined,
  };
}

/**
 * The handoff for a teacher, who has no administrator page to open. Given
 * instead of a link rather than as well as one, so nobody is pointed at a route
 * that will bounce them.
 */
export function staffHandoff(reason: "lapsed" | "needs-configuration"): string {
  return reason === "needs-configuration"
    ? "Ask your school administrator to have the account team correct the subscription dates."
    : "Ask your school administrator, who can request renewal for the school.";
}
