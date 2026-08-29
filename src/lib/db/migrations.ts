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

/**
 * Every table the schema has had since version 1. A file missing any of these
 * is not a shape this code knows how to reason about.
 */
const CORE_TABLES = [
  "meta",
  "schools",
  "users",
  "classes",
  "students",
  "assignments",
  "attempts",
  "benchmarks",
  "certifications",
  "audit_log",
];

/** Columns that only exist from version 2 onwards. */
const V2_COLUMNS: [table: string, column: string][] = [
  ["schools", "academic_year"],
  ["schools", "year_starts_on"],
  ["schools", "year_ends_on"],
  ["classes", "year_ends_on"],
];

/** A column version 1 already had, used to tell v1 from something older. */
const V1_COLUMNS: [table: string, column: string][] = [["schools", "benchmark_window"]];

function tableNames(db: Db): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[]
  ).map((t) => t.name);
}

function hasAll(db: Db, required: [string, string][]): boolean {
  return required.every(([table, column]) => columns(db, table).includes(column));
}

function hasNone(db: Db, forbidden: [string, string][]): boolean {
  return forbidden.every(([table, column]) => !columns(db, table).includes(column));
}

/**
 * What kind of file this is, decided **before** the schema is applied.
 *
 * The distinction that matters, and that sprint 33 got wrong: an absent
 * `schema_version` row does not mean a brand-new file. The pre-sprint-33
 * `db:reset` deleted every `meta` row except `session_key`, so a database reset
 * with that command holds a complete set of tables and data and no version at
 * all. Treating it as new meant applying `CREATE TABLE IF NOT EXISTS` — which
 * adds no columns — stamping it current, and handing back a database that
 * claimed to be up to date and failed on the first query touching a new column.
 *
 * So the shape is inspected rather than inferred. Anything this cannot
 * positively recognize fails closed: it is better to refuse to open a database
 * than to stamp a version onto a file whose contents nobody has established.
 */
export type SchemaState =
  | { kind: "empty" }
  | { kind: "versioned"; version: number }
  | { kind: "unversioned"; version: number }
  | { kind: "unrecognized"; reason: string };

export function classifySchema(db: Db): SchemaState {
  const tables = tableNames(db);
  if (tables.length === 0) return { kind: "empty" };

  const missing = CORE_TABLES.filter((t) => !tables.includes(t));
  if (missing.length > 0) {
    return {
      kind: "unrecognized",
      reason: `the file has tables in it but is missing ${missing.join(", ")}, so it is not a shape this version knows`,
    };
  }

  const isV2 = hasAll(db, V2_COLUMNS);
  const isV1 = hasAll(db, V1_COLUMNS) && hasNone(db, V2_COLUMNS);

  const stored = (
    db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get() as
      | { value: string }
      | undefined
  )?.value;

  if (stored !== undefined) {
    // Strict: no decimals, no signs, no whitespace, no "2abc".
    if (!/^\d+$/.test(stored.trim())) {
      return { kind: "unrecognized", reason: `the recorded schema version is "${stored}", which is not a whole number` };
    }
    const version = Number(stored.trim());
    if (version < 1) {
      return { kind: "unrecognized", reason: `the recorded schema version is ${version}` };
    }
    if (version > LATEST_VERSION) {
      return {
        kind: "unrecognized",
        reason: `the database is at schema version ${version} and this build only understands ${LATEST_VERSION}, so it was written by a newer version of the software`,
      };
    }
    // A claimed version has to match what is actually there.
    const shapeMatches = version === 1 ? isV1 : version === 2 ? isV2 : false;
    if (!shapeMatches) {
      return {
        kind: "unrecognized",
        reason: `the database records schema version ${version} but its tables do not have that shape`,
      };
    }
    return { kind: "versioned", version };
  }

  // No version row. This is the state the old reset command produced.
  if (isV2) return { kind: "unversioned", version: 2 };
  if (isV1) return { kind: "unversioned", version: 1 };
  return {
    kind: "unrecognized",
    reason: "the database has no recorded schema version and its shape does not match any version this build knows",
  };
}
