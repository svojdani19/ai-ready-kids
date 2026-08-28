/**
 * Run the retention purge.
 *
 * This is the job a deployment schedules. Nothing in this build runs it on a
 * timer — there is no cron here and the product does not claim there is — so
 * the honest arrangement is a documented entry point that an operator or a
 * platform scheduler calls daily.
 *
 * Idempotent: running it twice deletes nothing the second time.
 */
import { resolve } from "node:path";
import { DEFAULT_DB_PATH, openDatabase } from "@/lib/db";
import { runScheduledPurge } from "@/lib/domain/purge";

const target = process.env.AIRK_DB_PATH ? resolve(process.env.AIRK_DB_PATH) : DEFAULT_DB_PATH;
const db = openDatabase(target);
const result = runScheduledPurge(db);

if (result.classesDeleted === 0) {
  console.log("Nothing is past its retention date. No records were deleted.");
} else {
  console.log(
    `Deleted ${result.classesDeleted} class${result.classesDeleted === 1 ? "" : "es"} ` +
      `and ${result.studentsDeleted} student record${result.studentsDeleted === 1 ? "" : "s"}, ` +
      `with every attempt and check-in belonging to them: ${result.classNames.join(", ")}.`,
  );
}

// Printed separately and last, so a safety block is never read as success.
// "Nothing is past its retention date" and "this school has no working policy"
// look identical in a log if both come out as zero deletions, and an operator
// who mistakes the second for the first will not know that a school's schedule
// has silently stopped.
if (result.blocked.length > 0) {
  console.error(
    `\nBLOCKED: ${result.blocked.length} school${result.blocked.length === 1 ? "" : "s"} ` +
      "skipped because the retention window is not one this product recognises. " +
      "No records were deleted for them, and nothing has been changed.",
  );
  for (const school of result.blocked) {
    console.error(
      `  - ${school.schoolName}: retention_months is ${JSON.stringify(school.retentionMonths)}, ` +
        "which is not 3, 12, 24 or 36. Set a policy on the Data and retention page.",
    );
  }
  // A non-zero exit, so a scheduler notices rather than logging it into
  // nothing. Automatic deletion has stopped for these schools until somebody
  // acts, and that is worth waking up for.
  process.exitCode = 1;
}
