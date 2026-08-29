import "server-only";
import type { Db } from "@/lib/db";
import { archiveClass, listClasses } from "@/lib/repo/classroom";
import { getSchool, recordAudit, setAcademicYear, setBenchmarkWindow } from "@/lib/repo/school";
import { previewRollover } from "@/lib/domain/rollover";

/**
 * The school year rollover, as one transaction.
 *
 * It used to be a sequence of independently committed writes. `archiveClass`
 * commits per class when there is no outer transaction, and `setAcademicYear`,
 * `setBenchmarkWindow` and `recordAudit` each committed on their own after it.
 * A failure on the second class, or on any later write, left the school half
 * transitioned: some cohorts archived and their join codes rotated, others
 * still active, the academic dates still last year's, the check-in window in
 * whichever state it had reached, and no trustworthy audit row either way.
 *
 * Sprint 69 raised the cost of that. Archiving now rotates a class's join code,
 * so a partial rollover does not merely mislabel a class — it hands out new
 * credentials for some rooms and not others, with nothing recording which.
 *
 * Two things make this atomic rather than merely wrapped:
 *
 * 1. `BEGIN IMMEDIATE` takes the write lock up front, so the read the decision
 *    is made from cannot be overtaken between reading and writing.
 * 2. The school and the classes are **re-read inside** the transaction and the
 *    preview recomputed from them. The page's preview is informational and can
 *    be seconds stale; the one the mutation acts on is this one.
 *
 * `archiveClass` already honors an outer transaction, so it participates here
 * instead of committing around it.
 */
export type RolloverOutcome =
  | { ok: true; fromYear: string; toYear: string; archived: number }
  | { ok: false; error: string };

/**
 * The message for a write that failed part-way.
 *
 * The first clause is only truthful because the rollback below is
 * unconditional — `tests/rollover-atomicity.test.ts` injects a failure after
 * the first class is archived and asserts the database is byte-for-byte what it
 * was.
 *
 * The last clause used to be "if it keeps happening your account contact can
 * look at it", which was not. The program contact is the school-side person
 * for quotes, purchase orders and invoices; this product ships no technical
 * support destination, and this sprint deliberately writes no audit row or
 * diagnostic for a failed attempt — so there would be nothing for anyone to
 * look at even if there were somewhere to send them. The honest next step is
 * the one the administrator can actually take: try again, and if it still
 * fails, stop, because stopping costs nothing.
 */
export const ROLLOVER_FAILED =
  "The rollover did not finish, so nothing was changed: every class, code, date " +
  "and check-in window is exactly as it was before you pressed the button. " +
  "Try again. If it still does not work, leave the school year as it is — your " +
  "classes, rosters and codes carry on unchanged, and you can roll over later.";

export function performRollover(
  db: Db,
  schoolId: string,
  actorLabel: string,
): RolloverOutcome {
  const outer = db.isTransaction;
  if (!outer) db.exec("BEGIN IMMEDIATE");
  try {
    // Decisive, and inside the lock. Not the preview the page rendered.
    const school = getSchool(db, schoolId);
    if (!school) throw new Error("That school could not be found.");
    const preview = previewRollover(school, listClasses(db, schoolId, true));
    if ("error" in preview) {
      // A refusal, not a failure: nothing has been written yet, so this ends
      // the transaction cleanly and reports the reason the preview gives.
      if (!outer) db.exec("ROLLBACK");
      return { ok: false, error: preview.error };
    }

    for (const c of preview.toArchive) archiveClass(db, c.id);
    setAcademicYear(db, schoolId, {
      year: preview.toYear,
      startsOn: preview.startsOn,
      endsOn: preview.endsOn,
    });
    setBenchmarkWindow(db, schoolId, "closed");

    // Exactly once, and inside the transaction, so a failure after it takes
    // the audit row with it. An audit entry for a rollover that did not happen
    // is worse than none.
    recordAudit(db, {
      schoolId,
      actorLabel,
      action: "year.rolled",
      detail: `${preview.fromYear} rolled into ${preview.toYear}. ${preview.toArchive.length} class${preview.toArchive.length === 1 ? "" : "es"} archived — each issued a new join code, with students signed out on their next request — check-ins closed, and no existing deletion date moved.`,
    });

    if (!outer) db.exec("COMMIT");
    return {
      ok: true,
      fromYear: preview.fromYear,
      toYear: preview.toYear,
      archived: preview.toArchive.length,
    };
  } catch (error) {
    if (!outer) db.exec("ROLLBACK");
    throw error;
  }
}
