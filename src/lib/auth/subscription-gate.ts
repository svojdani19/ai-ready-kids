import "server-only";
import { getDb, type Db } from "@/lib/db";
import { getClass } from "@/lib/repo/classroom";
import { getSchool } from "@/lib/repo/school";
import { hasLapsed, LAPSED_WRITE_REFUSAL } from "@/lib/domain/subscription";

/**
 * The server-side half of the subscription term.
 *
 * Sprint 49 gave `term_renews_on` a meaning; this is what enforces it. The gate
 * lives here, on the path every instructional mutation takes, rather than in the
 * pages that render the buttons — for the same reason sprint 26 moved
 * authorization and sprint 42 moved the seat cap. A stale tab left open over the
 * summer, or a direct call to an exported server action, must not be able to
 * write, and hiding a control is not a rule.
 *
 * Deliberately narrow. This blocks classroom and instructional writes only. A
 * lapsed school still owns everything it has: reports, exports, retention
 * settings, deliberate deletion, staff administration, the renewal request and
 * sign-out all go on working, because the alternative is holding a school's own
 * records hostage to an invoice.
 */

/** Raised when an instructional write is attempted after the term ended. */
export class SubscriptionLapsedError extends Error {
  constructor() {
    super(LAPSED_WRITE_REFUSAL);
    this.name = "SubscriptionLapsedError";
  }
}

/** True when this school may not make classroom changes right now. */
export function schoolHasLapsed(db: Db, schoolId: string, now = new Date()): boolean {
  const school = getSchool(db, schoolId);
  if (!school) return false;
  return hasLapsed(school, now);
}

/** Throw if the school's term has ended. For actions that already throw. */
export function assertSubscriptionActive(db: Db, schoolId: string, now = new Date()): void {
  if (schoolHasLapsed(db, schoolId, now)) throw new SubscriptionLapsedError();
}

/** The same check by class, for the many actions that hold a class id. */
export function assertClassSubscriptionActive(db: Db, classId: string, now = new Date()): void {
  const classroom = getClass(db, classId);
  if (!classroom) return;
  assertSubscriptionActive(db, classroom.school_id, now);
}

/**
 * For actions that return `{ error }` rather than throwing. Returns the refusal
 * string, or null when the school is fine — so a caller reads as
 * `const lapsed = lapsedRefusal(...); if (lapsed) return { error: lapsed };`
 */
export function lapsedRefusal(db: Db, schoolId: string, now = new Date()): string | null {
  return schoolHasLapsed(db, schoolId, now) ? LAPSED_WRITE_REFUSAL : null;
}

/** Convenience for actions that only have the request's own db handle. */
export function currentDb(): Db {
  return getDb();
}

/**
 * Turn the thrown refusal into an expected `{ error }` for a caller that
 * renders one.
 *
 * The gate throws, because a throw is what a resolver every mutation shares can
 * do without every caller remembering to check. But a teacher pressing a button
 * should meet a sentence, not an error page, so the actions that render a
 * result catch it here. Anything else still throws, which is the backstop: a
 * new action that forgets this fails loudly rather than writing.
 */
export function asExpectedError(error: unknown): { error: string } | null {
  return error instanceof SubscriptionLapsedError ? { error: error.message } : null;
}
