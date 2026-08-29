import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SCHEMA_SQL } from "./schema";
import { classifySchema, LATEST_VERSION, MIGRATIONS } from "./migrations";
import { seedIfEmpty } from "./seed";
import type { Db } from "./helpers";

export * from "./helpers";

export const DEFAULT_DB_PATH = resolve(process.cwd(), "data", "airk.db");

function stampVersion(db: Db, version: number): void {
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(
    "schema_version",
    String(version),
  );
}

/**
 * Bring an existing database up to the current schema.
 *
 * Each pending migration runs inside its own transaction with the version row
 * written in the same transaction, so a failure rolls the change and the
 * version back together and the process stops. There is no state where half a
 * migration has been applied and the version says it succeeded.
 */
function migrate(db: Db, from: number): void {
  const pending = MIGRATIONS.filter((m) => m.version > from).sort(
    (a, b) => a.version - b.version,
  );
  for (const migration of pending) {
    db.exec("BEGIN");
    try {
      migration.up(db);
      stampVersion(db, migration.version);
      db.exec("COMMIT");
    } catch (cause) {
      db.exec("ROLLBACK");
      throw new Error(
        `Migration ${migration.version} (${migration.name}) failed and was rolled back. The database is still at version ${from} and nothing was changed.`,
        { cause },
      );
    }
  }
}

/**
 * Open a database, apply the schema, and migrate an existing one forward.
 *
 * A brand-new file gets the current schema and is stamped at the latest
 * version, so no migration runs against it. An existing file is migrated from
 * whatever version it records. `CREATE TABLE IF NOT EXISTS` still runs on both
 * because it is how genuinely new *tables* arrive; new *columns* are the
 * migrations' job, which is the distinction that broke sprint 32.
 *
 * Exported separately from the singleton so tests can spin up an isolated
 * database per file without touching local development data.
 */
export function openDatabase(path: string): Db {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);

  // Classify before touching anything. An absent version row is not evidence
  // of a new file — the pre-sprint-33 reset deleted it from databases that were
  // otherwise complete — so the shape is inspected rather than inferred, and
  // anything unrecognized stops here rather than being stamped.
  const state = classifySchema(db);
  if (state.kind === "unrecognized") {
    db.close();
    throw new Error(
      `Refusing to open ${path}: ${state.reason}. Nothing has been changed. ` +
        "Take a copy of the file before doing anything else — it is a single file and a copy is a complete backup. " +
        "If it was written by a newer version of this software, run that version instead of downgrading. " +
        "Otherwise restore the most recent backup, or start a fresh database with `npm run db:reset` if the contents are demo data you do not need.",
    );
  }

  db.exec(SCHEMA_SQL);

  if (state.kind === "empty") {
    // Nothing was there, so the schema just applied is already current.
    stampVersion(db, LATEST_VERSION);
    return db;
  }

  // A recognized-but-unstamped database gets the version its shape actually
  // has, and is then migrated forward like any other.
  const from = state.version;
  if (state.kind === "unversioned") stampVersion(db, from);
  if (from < LATEST_VERSION) migrate(db, from);
  return db;
}

/** Open, apply schema, and seed demo data when the database is brand new. */
export function openSeededDatabase(path: string): Db {
  const db = openDatabase(path);
  seedIfEmpty(db);
  return db;
}

declare global {
  // Next.js reloads modules in development; without this the process would
  // leak a new sqlite handle on every hot update.
  var __airkDb: Db | undefined;
}

/** Process-wide handle used by server components and server actions. */
export function getDb(): Db {
  if (!globalThis.__airkDb) {
    globalThis.__airkDb = openSeededDatabase(
      process.env.AIRK_DB_PATH ?? DEFAULT_DB_PATH,
    );
  }
  return globalThis.__airkDb;
}

export function closeDb(): void {
  globalThis.__airkDb?.close();
  globalThis.__airkDb = undefined;
}
