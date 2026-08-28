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
