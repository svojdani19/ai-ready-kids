/**
 * Rebuild the local demo database.
 *
 * Safe to run while `npm run dev` is going: it truncates and re-seeds through
 * SQLite rather than replacing the file, so a running server picks up the new
 * data on its next query. Everything in here is fictional demo content.
 */
import { resolve } from "node:path";
import { DEFAULT_DB_PATH, openDatabase } from "@/lib/db";
import { resetDatabase } from "@/lib/db/reset";

const target = process.env.AIRK_DB_PATH ? resolve(process.env.AIRK_DB_PATH) : DEFAULT_DB_PATH;

const db = openDatabase(target);
resetDatabase(db);

const count = (table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

console.log(`Reseeded ${target}`);
console.log(
  `  ${count("schools")} school · ${count("users")} staff · ${count("classes")} classes · ${count("students")} students`,
);
console.log(
  `  ${count("assignments")} assignments · ${count("attempts")} mission attempts · ${count("benchmarks")} check-ins`,
);
db.close();
