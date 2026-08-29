import "server-only";
import type { Db } from "@/lib/db";
import { recordAudit } from "@/lib/repo/school";

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
  audit: (result: T) => AuditInput,
): T {
  const outer = db.isTransaction;
  if (!outer) db.exec("BEGIN IMMEDIATE");
  try {
    const result = write();
    recordAudit(db, audit(result));
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

export const ROTATE_FAILED = (className: string) =>
  `${className} did not get a new code. The current code still works and nobody has been ` +
  `signed out. Nothing was changed. Try again.`;
