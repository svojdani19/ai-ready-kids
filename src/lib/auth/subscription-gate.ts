import "server-only";
import { getDb, type Db } from "@/lib/db";
import { getClass } from "@/lib/repo/classroom";
import { getSchool } from "@/lib/repo/school";
import {
  instructionClosed,
  LAPSED_WRITE_REFUSAL,
  UNVERIFIED_WRITE_REFUSAL,
} from "@/lib/domain/subscription";

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

/**
 * Raised when the term dates cannot be read at all.
 *
 * Distinct from `SubscriptionLapsedError` because nothing has ended: telling a
 * school its subscription expired when the truth is that a date field says
 * `"soon"` is a different — and wrong — commercial claim.
 */
export class TermNotConfiguredError extends Error {
  constructor() {
    super(UNVERIFIED_WRITE_REFUSAL);
    this.name = "TermNotConfiguredError";
  }
}

/** Why classroom work is closed for this school, or null when it is open. */
export function schoolInstructionClosed(
  db: Db,
  schoolId: string,
  now = new Date(),
): "lapsed" | "needs-configuration" | null {
  const school = getSchool(db, schoolId);
  if (!school) return null;
  return instructionClosed(school, now);
}

/**
 * True when this school may not make classroom changes right now, for either
 * reason. Child-facing surfaces use this: a class that is not open is not open,
 * and a seven-year-old is told the same sentence whichever it is.
 */
export function schoolHasLapsed(db: Db, schoolId: string, now = new Date()): boolean {
  return schoolInstructionClosed(db, schoolId, now) !== null;
}

/** Throw if the school may not make classroom changes. For actions that throw. */
export function assertSubscriptionActive(db: Db, schoolId: string, now = new Date()): void {
  const closed = schoolInstructionClosed(db, schoolId, now);
  if (closed === "needs-configuration") throw new TermNotConfiguredError();
  if (closed === "lapsed") throw new SubscriptionLapsedError();
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
  const closed = schoolInstructionClosed(db, schoolId, now);
  if (closed === "needs-configuration") return UNVERIFIED_WRITE_REFUSAL;
  if (closed === "lapsed") return LAPSED_WRITE_REFUSAL;
  return null;
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
  if (error instanceof SubscriptionLapsedError) return { error: error.message };
  if (error instanceof TermNotConfiguredError) return { error: error.message };
  return null;
}
