import { SCHEMA_SQL } from "./schema";
import { LATEST_VERSION } from "./migrations";
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
 *
 * **This is demo data only and is not an upgrade path.** It replaces rows; it
 * does not change the shape of anything. Schema changes are migrations — see
 * `migrations.ts` — and running this on an out-of-date database would empty it
 * without upgrading it.
 */
export function resetDatabase(db: Db): void {
  db.exec(SCHEMA_SQL);
  db.exec("PRAGMA foreign_keys = OFF");
  for (const table of TABLES) db.exec(`DELETE FROM ${table}`);
  // Keep the signing key so open sessions survive, and keep the schema
  // version: dropping it would make the next open mistake an existing database
  // for a brand-new one and skip any migration it still needed.
  db.exec("DELETE FROM meta WHERE key NOT IN ('session_key', 'schema_version')");
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)").run(
    String(LATEST_VERSION),
  );
  db.exec("PRAGMA foreign_keys = ON");
  seed(db);
}
