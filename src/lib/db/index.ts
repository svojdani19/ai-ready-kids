import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SCHEMA_SQL, SCHEMA_VERSION } from "./schema";
import { seedIfEmpty } from "./seed";
import type { Db } from "./helpers";

export * from "./helpers";

export const DEFAULT_DB_PATH = resolve(process.cwd(), "data", "airk.db");

/**
 * Open a database and apply the schema.
 *
 * Exported separately from the singleton so tests can spin up an isolated
 * database per file without touching local development data.
 */
export function openDatabase(path: string): Db {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec(SCHEMA_SQL);
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(
    "schema_version",
    SCHEMA_VERSION,
  );
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
