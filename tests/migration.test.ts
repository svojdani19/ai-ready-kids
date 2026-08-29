import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openDatabase, row, rows } from "@/lib/db";
import { classifySchema, LATEST_VERSION, MIGRATIONS } from "@/lib/db/migrations";
import { resetDatabase } from "@/lib/db/reset";
import { retentionRows, purgeDateForClass } from "@/lib/domain/retention";
import { runScheduledPurge } from "@/lib/domain/purge";
import { getPrimarySchool } from "@/lib/repo/school";
import { listClasses, listStudents } from "@/lib/repo/classroom";

/**
 * Upgrading an existing database.
 *
 * Sprint 32 added four columns and nothing migrated them. `openDatabase` ran
 * `CREATE TABLE IF NOT EXISTS` — which creates missing tables and does nothing
 * about missing columns — and then wrote `schema_version = 1` unconditionally,
 * without ever reading it. So an existing database silently claimed to be
 * current and failed on the first query touching a new column, and the README
 * told the operator to delete the file. For a school that is every roster,
 * every authored-choice attempt, every skill record, badge and check-in.
 *
 * The fixture below is the **literal** pre-sprint-32 schema, extracted from the
 * commit before it, so this test cannot drift into testing the current shape.
 */
const V1_SQL = readFileSync(join(process.cwd(), "tests/fixtures/v1-schema.sql"), "utf8");

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/**
 * A version-1 database holding one of everything, linked together.
 *
 * `version` is what goes in the `meta` row. Passing `null` reproduces the state
 * the **pre-sprint-33 `db:reset`** left behind: it deleted every meta row
 * except `session_key`, so a complete v1 database could exist with no recorded
 * version at all. Sprint 33's opener read that as a brand-new file.
 */
function makeLegacyDatabase(version: string | null = "1"): string {
  const dir = mkdtempSync(join(tmpdir(), "airk-migrate-"));
  dirs.push(dir);
  const path = join(dir, "legacy.db");
  const db = new DatabaseSync(path);
  db.exec(V1_SQL);
  if (version !== null) {
    db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)").run(
      version,
    );
  }
  // The old reset kept this row, so the fixture does too.
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('session_key', 'abc123')").run();

  db.prepare(
    `INSERT INTO schools (id, name, slug, district, city, state, monogram, plan,
      licensed_students, term_starts_on, term_renews_on, contact_name, contact_email,
      retention_months, created_at)
     VALUES ('sch_old','Old Elementary','old','Old District','Oldtown','ST','OE','school',
      120,'2025-08-18','2026-09-01','Head','head@old.demo',12,'2025-08-01T00:00:00.000Z')`,
  ).run();
  db.prepare(
    `INSERT INTO users (id, school_id, role, name, email, title, created_at)
     VALUES ('usr_old','sch_old','teacher','Old Teacher','old.teacher@old.demo','Grade 3','2025-08-01T00:00:00.000Z')`,
  ).run();
  db.prepare(
    `INSERT INTO classes (id, school_id, teacher_id, name, grade, join_code, school_year, created_at, archived_at)
     VALUES ('cls_old','sch_old','usr_old','Room Old',3,'MAPLE-317','2025-2026','2025-08-20T00:00:00.000Z',NULL)`,
  ).run();
  db.prepare(
    `INSERT INTO students (id, class_id, display_name, avatar_key, created_at)
     VALUES ('stu_old','cls_old','Sam R.','fox','2025-08-21T00:00:00.000Z')`,
  ).run();
  db.prepare(
    `INSERT INTO assignments (id, class_id, mission_id, assigned_by, assigned_at, note)
     VALUES ('asg_old','cls_old','m-privacy-1','usr_old','2025-08-22T00:00:00.000Z','On the rug.')`,
  ).run();
  db.prepare(
    `INSERT INTO attempts (id, student_id, mission_id, started_at, completed_at, path_json, evidence_json)
     VALUES ('att_old','stu_old','m-privacy-1','2025-09-01T00:00:00.000Z','2025-09-01T00:10:00.000Z',
       '[{"sceneId":"s2","choiceId":"c1"}]','{"privacy.identity":"demonstrated"}')`,
  ).run();
  db.prepare(
    `INSERT INTO benchmarks (id, student_id, form, started_at, completed_at, responses_json)
     VALUES ('bmk_old','stu_old','pre','2025-09-02T00:00:00.000Z','2025-09-02T00:09:00.000Z','{"pre-1":"b"}')`,
  ).run();
  db.prepare(
    `INSERT INTO certifications (id, user_id, answers_json, completed_at)
     VALUES ('crt_old','usr_old','{"cert-1":"a"}','2025-08-25T00:40:00.000Z')`,
  ).run();
  db.prepare(
    `INSERT INTO audit_log (id, school_id, actor_label, action, detail, created_at)
     VALUES ('aud_old','sch_old','Head','class.created','Room Old created.','2025-08-20T00:00:00.000Z')`,
  ).run();
  db.close();
  return path;
}

describe("upgrading a version 1 database", () => {
  it("adds the new columns and advances the recorded version", () => {
    const path = makeLegacyDatabase();
    const db = openDatabase(path);

    const version = row<{ value: string }>(
      db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
    );
    expect(Number(version!.value)).toBe(LATEST_VERSION);
    expect(LATEST_VERSION).toBe(2);

    const schoolCols = (
      db.prepare("PRAGMA table_info(schools)").all() as { name: string }[]
    ).map((c) => c.name);
    expect(schoolCols).toContain("academic_year");
    expect(schoolCols).toContain("year_starts_on");
    expect(schoolCols).toContain("year_ends_on");
    const classCols = (
      db.prepare("PRAGMA table_info(classes)").all() as { name: string }[]
    ).map((c) => c.name);
    expect(classCols).toContain("year_ends_on");
    db.close();
  });

  it("preserves every record and every link between them", () => {
    const path = makeLegacyDatabase();
    const db = openDatabase(path);

    const school = getPrimarySchool(db);
    expect(school.id).toBe("sch_old");
    expect(school.term_renews_on).toBe("2026-09-01");
    expect(school.retention_months).toBe(12);

    const classes = listClasses(db, "sch_old");
    expect(classes).toHaveLength(1);
    expect(classes[0].join_code).toBe("MAPLE-317");
    expect(classes[0].teacher_id).toBe("usr_old");

    const students = listStudents(db, "cls_old");
    expect(students).toHaveLength(1);
    expect(students[0].display_name).toBe("Sam R.");
    expect(students[0].avatar_key).toBe("fox");

    // The evidence a teacher acts on, and the path behind it.
    const attempt = row<{ path_json: string; evidence_json: string; completed_at: string }>(
      db.prepare("SELECT * FROM attempts WHERE id = 'att_old'").get(),
    )!;
    expect(JSON.parse(attempt.path_json)).toEqual([{ sceneId: "s2", choiceId: "c1" }]);
    expect(JSON.parse(attempt.evidence_json)).toEqual({ "privacy.identity": "demonstrated" });
    expect(attempt.completed_at).toBe("2025-09-01T00:10:00.000Z");

    for (const [table, id] of [
      ["assignments", "asg_old"],
      ["benchmarks", "bmk_old"],
      ["certifications", "crt_old"],
      ["audit_log", "aud_old"],
      ["users", "usr_old"],
    ] as const) {
      expect(
        rows(db.prepare(`SELECT id FROM ${table} WHERE id = ?`).all(id)),
        table,
      ).toHaveLength(1);
    }
    db.close();
  });

  it("carries the academic year label forward but not a guessed date", () => {
    const path = makeLegacyDatabase();
    const db = openDatabase(path);
    const school = getPrimarySchool(db);

    // The label is in the old data and is accurate.
    expect(school.academic_year).toBe("2025-2026");
    // The dates are not, and are deliberately left empty. In particular the
    // renewal date must not have been borrowed: it is 1 September, three
    // months after a normal year end, and using it would have shifted every
    // legacy deletion date.
    expect(school.year_starts_on).toBe("");
    expect(school.year_ends_on).toBe("");
    expect(school.year_ends_on).not.toBe(school.term_renews_on);
    expect(listClasses(db, "sch_old")[0].year_ends_on).toBe("");
    db.close();
  });

  it("blocks retention for migrated cohorts instead of inventing a date", () => {
    const path = makeLegacyDatabase();
    const db = openDatabase(path);
    const school = getPrimarySchool(db);
    const classes = listClasses(db, "sch_old").map((c) => ({ ...c, studentCount: 1 }));

    expect(purgeDateForClass(classes[0], school.retention_months)).toBeNull();
    const [rowState] = retentionRows(school, classes, new Date("2099-01-01T00:00:00.000Z"));
    expect(rowState.purgeOn).toBeNull();
    // Unknown is not the same as due, even a lifetime later.
    expect(rowState.eligibleNow).toBe(false);

    const result = runScheduledPurge(db, new Date("2099-01-01T00:00:00.000Z"));
    expect(result.classesDeleted).toBe(0);
    expect(listStudents(db, "cls_old")).toHaveLength(1);
    db.close();
  });

  it("is a no-op when run again", () => {
    const path = makeLegacyDatabase();
    const first = openDatabase(path);
    const before = row<{ n: number }>(
      first.prepare("SELECT COUNT(*) AS n FROM students").get(),
    )!.n;
    first.close();

    const second = openDatabase(path);
    const version = row<{ value: string }>(
      second.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
    );
    expect(Number(version!.value)).toBe(LATEST_VERSION);
    expect(row<{ n: number }>(second.prepare("SELECT COUNT(*) AS n FROM students").get())!.n).toBe(
      before,
    );
    // And still exactly one of each new column, not duplicated by a second run.
    const cols = (second.prepare("PRAGMA table_info(schools)").all() as { name: string }[]).filter(
      (c) => c.name === "academic_year",
    );
    expect(cols).toHaveLength(1);
    second.close();
  });

  it("rolls back and does not advance the version when a migration fails", () => {
    const path = makeLegacyDatabase();
    const original = MIGRATIONS[0].up;
    MIGRATIONS[0].up = (db) => {
      original(db);
      throw new Error("forced failure partway through");
    };
    try {
      expect(() => openDatabase(path)).toThrow(/rolled back/i);
    } finally {
      MIGRATIONS[0].up = original;
    }

    // Reopen with a raw handle so the opener cannot repair it on the way in.
    const db = new DatabaseSync(path);
    const version = row<{ value: string }>(
      db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
    );
    expect(Number(version!.value)).toBe(1);
    // The column the failed migration added must be gone with it.
    const cols = (db.prepare("PRAGMA table_info(schools)").all() as { name: string }[]).map(
      (c) => c.name,
    );
    expect(cols).not.toContain("academic_year");
    // And the data is untouched.
    expect(row<{ n: number }>(db.prepare("SELECT COUNT(*) AS n FROM students").get())!.n).toBe(1);
    db.close();
  });

  it("stamps a brand-new database at the latest version without migrating", () => {
    const dir = mkdtempSync(join(tmpdir(), "airk-fresh-"));
    dirs.push(dir);
    const db = openDatabase(join(dir, "fresh.db"));
    const version = row<{ value: string }>(
      db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
    );
    expect(Number(version!.value)).toBe(LATEST_VERSION);
    db.close();
  });

  it("keeps the version across a demo reset", () => {
    // `db:reset` empties tables and re-seeds. It used to drop the version row
    // along with everything else, which was harmless only while the opener
    // rewrote the version unconditionally. Now it would make the next open
    // mistake an existing database for a new one and skip a migration.
    const dir = mkdtempSync(join(tmpdir(), "airk-reset-"));
    dirs.push(dir);
    const path = join(dir, "reset.db");
    const db = openDatabase(path);
    resetDatabase(db);
    const version = row<{ value: string }>(
      db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
    );
    expect(Number(version!.value)).toBe(LATEST_VERSION);
    db.close();
  });

});

describe("an existing database with no recorded version", () => {
  /**
   * The exact state the pre-sprint-33 `db:reset` produced: it opened a v1
   * database and then deleted every `meta` row except `session_key`. Sprint 33
   * read the absent version as "brand-new file", applied `CREATE TABLE IF NOT
   * EXISTS` — which adds no columns — stamped version 2, and handed back a
   * database that claimed to be current and failed on the first query touching
   * a new column. Its own upgrade test always inserted version 1, so it never
   * saw this.
   */
  it("is recognized as version 1 by its shape, not assumed to be new", () => {
    const path = makeLegacyDatabase(null);
    const raw = new DatabaseSync(path);
    // Precondition: complete v1 data, no version row.
    expect(
      raw.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
    ).toBeUndefined();
    expect(row<{ n: number }>(raw.prepare("SELECT COUNT(*) AS n FROM students").get())!.n).toBe(1);
    expect(classifySchema(raw)).toEqual({ kind: "unversioned", version: 1 });
    raw.close();

    const db = openDatabase(path);
    const version = row<{ value: string }>(
      db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
    );
    expect(Number(version!.value)).toBe(LATEST_VERSION);
    db.close();
  });

  it("migrates it and keeps every record", () => {
    const path = makeLegacyDatabase(null);
    const db = openDatabase(path);

    // The columns actually arrived this time.
    const classCols = (
      db.prepare("PRAGMA table_info(classes)").all() as { name: string }[]
    ).map((c) => c.name);
    expect(classCols).toContain("year_ends_on");

    // And a query touching a new column works, which is the thing that failed.
    expect(listClasses(db, "sch_old")[0].year_ends_on).toBe("");
    expect(getPrimarySchool(db).academic_year).toBe("2025-2026");

    expect(listStudents(db, "cls_old")[0].display_name).toBe("Sam R.");
    const attempt = row<{ evidence_json: string }>(
      db.prepare("SELECT * FROM attempts WHERE id = 'att_old'").get(),
    )!;
    expect(JSON.parse(attempt.evidence_json)).toEqual({ "privacy.identity": "demonstrated" });
    for (const [table, id] of [
      ["assignments", "asg_old"],
      ["benchmarks", "bmk_old"],
      ["certifications", "crt_old"],
      ["audit_log", "aud_old"],
    ] as const) {
      expect(rows(db.prepare(`SELECT id FROM ${table} WHERE id = ?`).all(id)), table).toHaveLength(
        1,
      );
    }
    // Retention is still blocked, unchanged by this fix.
    expect(purgeDateForClass(listClasses(db, "sch_old")[0], 12)).toBeNull();
    db.close();
  });

  it("recognizes an unversioned database that is already current", () => {
    // The other way the old reset produced this: a sprint 32 database, which
    // had the v2 shape while `SCHEMA_VERSION` still said "1", reset before
    // sprint 33 landed.
    const dir = mkdtempSync(join(tmpdir(), "airk-v2-unversioned-"));
    dirs.push(dir);
    const path = join(dir, "v2.db");
    const seeded = openDatabase(path);
    seeded.prepare("DELETE FROM meta WHERE key = 'schema_version'").run();
    expect(classifySchema(seeded)).toEqual({ kind: "unversioned", version: 2 });
    seeded.close();

    const db = openDatabase(path);
    const version = row<{ value: string }>(
      db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
    );
    expect(Number(version!.value)).toBe(2);
    db.close();
  });
});

describe("anything unrecognized fails closed", () => {
  /**
   * Stamping a version onto a file whose contents nobody has established is
   * how sprint 33's defect worked. Refusing to open is the safe direction: the
   * data is still there and a person can look at it.
   */
  function fileWith(sql: string, name: string): string {
    const dir = mkdtempSync(join(tmpdir(), "airk-odd-"));
    dirs.push(dir);
    const path = join(dir, name);
    const db = new DatabaseSync(path);
    db.exec(sql);
    db.close();
    return path;
  }

  it("opens a genuinely empty file and stamps it current", () => {
    const dir = mkdtempSync(join(tmpdir(), "airk-empty-"));
    dirs.push(dir);
    const path = join(dir, "empty.db");
    // Touch it into existence with no tables at all.
    new DatabaseSync(path).close();

    const raw = new DatabaseSync(path);
    expect(classifySchema(raw)).toEqual({ kind: "empty" });
    raw.close();

    const db = openDatabase(path);
    expect(
      Number(
        row<{ value: string }>(
          db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
        )!.value,
      ),
    ).toBe(LATEST_VERSION);
    db.close();
  });

  it("refuses a partial schema it does not recognize", () => {
    const path = fileWith(
      `CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
       CREATE TABLE schools (id TEXT PRIMARY KEY, name TEXT NOT NULL);`,
      "partial.db",
    );
    expect(() => openDatabase(path)).toThrow(/missing .*users/i);
    expect(() => openDatabase(path)).toThrow(/Nothing has been changed/);
  });

  it("refuses a malformed version rather than coercing it", () => {
    for (const bad of ["two", "2.5", "-1", " ", "0", "2abc"]) {
      const path = makeLegacyDatabase(bad);
      expect(() => openDatabase(path), bad).toThrow(/Refusing to open/);
    }
  });

  it("refuses a database from a newer build instead of downgrading it", () => {
    const path = makeLegacyDatabase(String(LATEST_VERSION + 1));
    expect(() => openDatabase(path)).toThrow(/newer version of this software/);
    // And it says what to do about it.
    expect(() => openDatabase(path)).toThrow(/Take a copy of the file/);
  });

  it("refuses a version whose claimed shape is not the shape present", () => {
    // Says version 2, has version 1 columns.
    const path = makeLegacyDatabase("2");
    expect(() => openDatabase(path)).toThrow(/do not have that shape/);
    // Nothing was written on the way out.
    const raw = new DatabaseSync(path);
    expect(
      row<{ value: string }>(
        raw.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get(),
      )!.value,
    ).toBe("2");
    expect(
      (raw.prepare("PRAGMA table_info(schools)").all() as { name: string }[]).map((c) => c.name),
    ).not.toContain("academic_year");
    raw.close();
  });
});
