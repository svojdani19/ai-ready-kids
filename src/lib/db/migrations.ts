import type { Db } from "./helpers";
import { row } from "./helpers";

/**
 * Ordered schema migrations.
 *
 * Until sprint 33 there were none. `openDatabase` ran `CREATE TABLE IF NOT
 * EXISTS` and then wrote `schema_version = 1` unconditionally, without ever
 * reading it. `IF NOT EXISTS` creates missing *tables*; it does nothing about
 * missing *columns*, so sprint 32's four new columns simply did not appear on
 * an existing database and the first query touching them failed. The README
 * said to delete the file — which for a school means deleting every roster,
 * attempt, skill record, badge and check-in, and contradicts the retention
 * story the product sells.
 *
 * Rules for anything added here:
 *
 *  - Ordered by `version`, applied in order, each inside its own transaction.
 *  - The version row is written **inside** that transaction, so a failure rolls
 *    back the change and the version together. There is no half-migrated state.
 *  - Idempotent in effect: a migration only runs when the stored version is
 *    below it, and re-running the opener changes nothing.
 *  - Conservative with data. A migration may not invent a value that could
 *    cause a record to be deleted earlier than the school agreed.
 */
export interface Migration {
  version: number;
  name: string;
  up: (db: Db) => void;
}

/** Column names on a table, for migrations that need to check before adding. */
function columns(db: Db, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
    (c) => c.name,
  );
}

function addColumn(db: Db, table: string, column: string, definition: string): void {
  if (columns(db, table).includes(column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export const MIGRATIONS: Migration[] = [
  {
    version: 2,
    name: "academic year separate from subscription term",
    up(db) {
      // Sprint 32 split the school year from the subscription term. The old
      // schema had only term_starts_on and term_renews_on.
      addColumn(db, "schools", "academic_year", "TEXT NOT NULL DEFAULT ''");
      addColumn(db, "schools", "year_starts_on", "TEXT NOT NULL DEFAULT ''");
      addColumn(db, "schools", "year_ends_on", "TEXT NOT NULL DEFAULT ''");
      addColumn(db, "classes", "year_ends_on", "TEXT NOT NULL DEFAULT ''");

      // The one thing the old data does say accurately: which academic year
      // label its classes were created under. Take the most recent, so an
      // administrator opening the page sees the right year already filled in.
      for (const school of db.prepare("SELECT id FROM schools").all() as { id: string }[]) {
        const latest = row<{ school_year: string }>(
          db
            .prepare(
              `SELECT school_year FROM classes
               WHERE school_id = ? AND school_year <> ''
               ORDER BY school_year DESC LIMIT 1`,
            )
            .get(school.id),
        );
        if (latest) {
          db.prepare("UPDATE schools SET academic_year = ? WHERE id = ?").run(
            latest.school_year,
            school.id,
          );
        }
      }

      // Dates are deliberately left empty.
      //
      // Nothing in the old schema records when a school year ended. A label
      // like "2025-2026" is not a date: districts finish in May, June or July.
      // Guessing early would delete a child's records before the school's own
      // retention window had elapsed, and guessing late would hold them past
      // the policy the school set. Neither is ours to choose, so retention
      // stays blocked for these cohorts until an administrator records the
      // real date — see `retentionRows`, which reports them as not due rather
      // than as due at some invented moment.
    },
  },
];

/** The version a fresh database is stamped with. */
export const LATEST_VERSION = MIGRATIONS.reduce(
  (highest, m) => Math.max(highest, m.version),
  1,
);
