import { SCHEMA_SQL } from "./schema";
import { seed } from "./seed";
import type { Db } from "./helpers";

const TABLES = [
  "audit_log",
  "certifications",
  "benchmarks",
  "attempts",
  "assignments",
  "students",
  "classes",
  "users",
  "schools",
];

/**
 * Empty every table and re-seed, in place.
 *
 * Deliberately not "delete the file": a running dev server holds an open
 * handle, and swapping the file underneath it leaves the server reading a
 * deleted inode. Truncating through SQLite means a reset is visible to
 * whatever is already connected.
 */
export function resetDatabase(db: Db): void {
  db.exec(SCHEMA_SQL);
  db.exec("PRAGMA foreign_keys = OFF");
  for (const table of TABLES) db.exec(`DELETE FROM ${table}`);
  db.exec("DELETE FROM meta WHERE key <> 'session_key'");
  db.exec("PRAGMA foreign_keys = ON");
  seed(db);
}
