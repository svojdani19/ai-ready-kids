import "server-only";
import type { Db } from "@/lib/db";
import { recordAudit } from "@/lib/repo/school";
import { classArchivedRefusal } from "@/lib/auth/class-state";

/**
 * A class operation and its audit entry, committed together or not at all.
 *
 * Every one of these actions used to mutate first and audit afterwards, each
 * write committing on its own. If `recordAudit` failed, the consequential
 * change had already happened and the administrator was told it had not:
 *
 * - **Delete** had already cascade-removed the class, roster, attempts,
 *   check-ins and assignments, with no `data.deleted` entry to show for it.
 * - **Archive** had already rotated the code and signed the room out, with no
 *   `class.archived` entry.
 * - **Rotate** had already invalidated the credential, with no record of it.
 * - **Restore** had already reactivated the roster, unrecorded.
 *
 * The product sells the opposite on three surfaces — "Every configuration
 * change and every deletion writes an audit entry" — so this was a buyer
 * promise and a credential-recovery problem, not a logging gap. Somebody
 * reading the audit log to answer "who deleted Room 12, and when" would have
 * found nothing, while Room 12 was gone.
 *
 * `BEGIN IMMEDIATE` takes the write lock up front, and the audit insert is
 * inside it, so either both land or the database is untouched. Repository
 * operations that open their own transaction check `db.isTransaction` and
 * participate, so nesting is safe.
 */
export type AuditInput = {
  schoolId: string;
  actorLabel: string;
  action: string;
  detail: string;
};

export function auditedWrite<T>(
  db: Db,
  write: () => T,
  audit: (result: T) => AuditInput | null,
): T {
  const outer = db.isTransaction;
  if (!outer) db.exec("BEGIN IMMEDIATE");
  try {
    const result = write();
    // `null` means the write turned out to be a no-op, so there is no event to
    // record. Sprint 76: an idempotent call — assigning a mission a class
    // already has, unassigning one it does not — must not produce an audit
    // entry describing something that did not happen. The write still runs
    // inside the transaction either way; only the record is conditional.
    const entry = audit(result);
    if (entry) recordAudit(db, entry);
    if (!outer) db.exec("COMMIT");
    return result;
  } catch (error) {
    if (!outer) db.exec("ROLLBACK");
    throw error;
  }
}

/**
 * What to tell an administrator when the write failed.
 *
 * Each names the state that is unchanged, because "something went wrong" leaves
 * them wondering whether to check. None promises support, monitoring or a
 * diagnostic trail: this build has no support destination and writes no record
 * of a failed attempt, which sprint 70 established the hard way.
 */
export const DELETE_FAILED = (className: string) =>
  `${className} was not deleted, and no records were removed: the roster, every mission ` +
  `attempt, both check-ins and the class itself are all exactly as they were. Nothing ` +
  `was written to the audit log either. Try again if you still want to delete it.`;

export const ARCHIVE_FAILED = (className: string) =>
  `${className} was not archived. It is still active, its join code is unchanged, and ` +
  `anyone signed in to it stays signed in. Nothing was changed. Try again.`;

export const RESTORE_FAILED = (className: string) =>
  `${className} was not restored. It is still archived, its join code is unchanged, and ` +
  `none of its records have changed. Try again.`;

export const ACADEMIC_DATES_FAILED =
  "The academic dates were not saved. The school year, its first and last day, " +
  "every class year label and every class year-end date used to work out when " +
  "records are deleted are all exactly as they were before you pressed Save. " +
  "Try again.";

/**
 * Retention is one number that moves every cohort's deletion date.
 *
 * The message names the two things an administrator would otherwise have to go
 * and check: that the schedule did not move, and that nothing was deleted while
 * the save was failing. It does not claim the attempt was recorded, because it
 * was not — the rollback takes the audit row with it.
 */
/**
 * The check-in window decides, immediately and school-wide, whether children may
 * start or resume the fall form, the spring form, or neither.
 *
 * The message answers the question an administrator would otherwise have to go
 * and ask a classroom: what are the children being offered right now. It also
 * says no child was moved between forms or stopped mid-answer, because a
 * half-applied window change is the one that would corrupt a fall-to-spring
 * comparison. It does not claim the attempt was recorded — the rollback takes
 * the audit row with it.
 */
export const BENCHMARK_WINDOW_FAILED =
  "The check-in window was not changed. Children are still offered exactly the " +
  "same check-in as before you pressed Save — the same fall form, spring form, " +
  "or none at all — and this attempt started no child, stopped no child, and " +
  "moved nobody to a different check-in. Try again.";

export const RETENTION_FAILED =
  "The retention window was not changed. Every class keeps the same retention " +
  "status and the same scheduled deletion date it had before you pressed Save, " +
  "and no records were deleted. Try again.";

/**
 * Archiving parks a class; it does not empty it.
 *
 * Sprint 69 closed the student sessions, so nobody is inside an archived class
 * while it is archived — but the roster, the attempts and the assignments all
 * remain stored, and the class can be restored. A mission assigned or withdrawn
 * while parked therefore becomes effective for children **the moment somebody
 * restores it**, without the restoring administrator or the teacher ever making
 * a post-restore decision about it. Sprint 76 first recorded that as a
 * consistency gap; it is a lifecycle one.
 */
export const ASSIGNMENT_CLASS_ARCHIVED = classArchivedRefusal("set_assignment");

/**
 * Assigning or withdrawing a mission decides which authored practice a class may
 * open. The message names what a teacher would otherwise have to go and check —
 * the mission list, and whether any child's saved work moved — and says outright
 * that nothing reached the audit log, so nobody goes looking for an entry that
 * was rolled back.
 */
export const ASSIGNMENT_FAILED = (className: string) =>
  `That did not save. ${className} is offered exactly the same missions as before, ` +
  `no child's saved mission work or badge has changed, and nothing was written to ` +
  `the audit log. It is safe to try again.`;

/**
 * Removing a child from a parked class is permanent, and archiving is not.
 *
 * Archiving closes the student sessions and takes the cohort out of the active
 * seat count. It does not empty the class: the roster, every attempt, every
 * check-in and every badge stay stored, and the class can be restored. The
 * archive and retention promises both rest on that — records remain unchanged
 * until a restore, a scheduled purge or an explicit administrator deletion.
 *
 * `removeStudentAction` bypassed all three. It cascades a child's row to every
 * attempt and check-in they have, permanently, and `requireOwnActiveClass`
 * checks ownership and the subscription term but never `archived_at` — so a
 * stale tab or a direct call could delete one child out of a parked cohort and
 * quietly change what a school's history and exports say about a year that was
 * supposed to be finished.
 */
export const REMOVE_STUDENT_CLASS_ARCHIVED = classArchivedRefusal("remove_student");

export const REMOVE_STUDENT_FAILED = (className: string) =>
  `That student was not removed, and no records were deleted: they are still on ` +
  `${className}'s roster with their mission history and check-ins exactly as they were. ` +
  `Try again.`;

export const REMOVE_STAFF_FAILED = (staffName: string) =>
  `${staffName} was not removed. They still have their account and their orientation ` +
  `record, and no class changed hands. Nothing was changed. Try again.`;

export const ROTATE_FAILED = (className: string) =>
  `${className} did not get a new code. The current code still works and nobody has been ` +
  `signed out. Nothing was changed. Try again.`;
