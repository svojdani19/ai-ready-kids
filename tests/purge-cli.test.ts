import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "@/lib/db";
import { seed } from "@/lib/db/seed";
import { DEMO_SCHOOL } from "./helpers";

/**
 * Sprint 55. The CLI is the operator's whole view of the retention job, so its
 * wording is the safety property — asserted by running it, not by reading it.
 *
 * Sprint 54 made the job fail closed and printed a BLOCKED section, but left
 * the zero-deletion branch unconditional. So a blocked-only run said "Nothing is
 * past its retention date. No records were deleted." and *then* said a school
 * had been skipped. For a blocked school the first sentence is not merely
 * unhelpful, it is unknowable: there is no valid schedule for anything to be
 * past. That contradictory pair appeared in sprint 54's own verified
 * transcript, quoted as evidence, and I did not notice it.
 */

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A seeded database on disk, so the CLI can be run against it for real. */
function database(retentionMonths: number, yearEndsOn = "2020-06-19"): string {
  const dir = mkdtempSync(join(tmpdir(), "airk-purge-cli-"));
  temps.push(dir);
  const path = join(dir, "test.db");
  const db = openDatabase(path);
  seed(db);
  db.prepare("UPDATE schools SET retention_months = ?, year_ends_on = ? WHERE id = ?").run(
    retentionMonths,
    yearEndsOn,
    DEMO_SCHOOL,
  );
  db.close();
  return path;
}

function runCli(dbPath: string): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execFileSync("npx", ["tsx", "scripts/purge.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, AIRK_DB_PATH: dbPath },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { stdout, stderr: "", status: 0 };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; status?: number };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", status: e.status ?? 1 };
  }
}

const ALL_CLEAR = "Nothing is past its retention date";

describe("the purge CLI never reports a safety block as nothing due", () => {
  it("says nothing about being up to date when a school is blocked", () => {
    const { stdout, stderr, status } = runCli(database(-12));
    const all = `${stdout}\n${stderr}`;

    // The contradiction, gone: no all-clear claim of any kind.
    expect(stdout).not.toContain(ALL_CLEAR);
    expect(all).not.toContain(ALL_CLEAR);
    // Replaced by something true and scoped to the schools it can speak for.
    expect(stdout).toContain(
      "No records were deleted from schools with a recognized retention policy.",
    );
    // And the block itself, on stderr, naming the school and the value.
    expect(stderr).toContain("BLOCKED");
    expect(stderr).toContain("Brightwood Elementary School");
    expect(stderr).toContain("-12");
    expect(status).toBe(1);
  }, 60_000);

  it("keeps the quiet-success line when nothing is due and nothing is blocked", () => {
    // A recognized window whose date has not arrived: genuinely nothing due.
    const { stdout, stderr, status } = runCli(database(36, "2030-06-19"));
    expect(stdout).toContain(ALL_CLEAR);
    expect(stderr).not.toContain("BLOCKED");
    expect(status).toBe(0);
  }, 60_000);

  it("reports deletions and the block together when both happen", () => {
    // The demo school is blocked; a second school is due and must still purge,
    // so the summary and the block have to coexist without contradicting.
    const path = database(0);
    const db = openDatabase(path);
    db.prepare(
      `INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent,
         plan, licensed_students, term_starts_on, term_renews_on, academic_year,
         year_starts_on, year_ends_on, contact_name, contact_email, retention_months, created_at)
       VALUES ('sch_due','Due Elementary','due','Due District','Dueville','ME','DE','denim',
         'school', 50, '2019-08-01','2030-08-01','2019-2020','2019-08-20','2020-06-19',
         'Head','head@due.demo', 3, '2019-08-01T00:00:00.000Z')`,
    ).run();
    db.prepare(
      `INSERT INTO users (id, school_id, role, name, email, title, created_at)
       VALUES ('usr_due','sch_due','teacher','Due Teacher','due@due.demo','Grade 3','2019-08-01T00:00:00.000Z')`,
    ).run();
    db.prepare(
      `INSERT INTO classes (id, school_id, teacher_id, name, grade, join_code, school_year, year_ends_on, created_at, archived_at)
       VALUES ('cls_due','sch_due','usr_due','Due Room',3,'DUE-ROOM-101','2019-2020','2020-06-19','2019-08-20T00:00:00.000Z',NULL)`,
    ).run();
    db.close();

    const { stdout, stderr, status } = runCli(path);
    expect(stdout).toContain("Deleted 1 class");
    expect(stdout).toContain("Due Room");
    // Still no all-clear, because one school could not be assessed at all.
    expect(stdout).not.toContain(ALL_CLEAR);
    expect(stderr).toContain("BLOCKED");
    expect(status).toBe(1);
  }, 60_000);
});
