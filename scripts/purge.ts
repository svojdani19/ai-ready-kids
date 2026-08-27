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
