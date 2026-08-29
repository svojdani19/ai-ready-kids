import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import {
  assignMission,
  deleteClass,
  getClass,
  listAssignments,
  listStudents,
} from "@/lib/repo/classroom";
import { listAudit } from "@/lib/repo/school";
import { DELETION_SCOPE, SURROUNDING_RECORD } from "@/content/data-inventory";
import { MISSIONS } from "@/content/missions";

const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

const copyOf = (p: string) =>
  src(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1")
    .replace(/^import[^\n]*$/gm, "")
    .replace(/\s+/g, " ");

const rendered = (p: string) =>
  copyOf(p).replace(/\bDELETION_SCOPE\b/g, DELETION_SCOPE.join(" "));

/** Every `DELETE FROM <table>` the shipped code contains, with its file. */
function deleteStatements(): { file: string; table: string }[] {
  const found: { file: string; table: string }[] = [];
  const walk = (dir: string) => {
    for (const item of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
      const rel = `${dir}/${item.name}`;
      if (item.isDirectory()) walk(rel);
      else if (/\.tsx?$/.test(item.name)) {
        for (const m of src(rel).matchAll(/DELETE FROM\s+([a-z_]+|\$\{table\})/g)) {
          found.push({ file: rel, table: m[1] });
        }
      }
    }
  };
  ["src", "scripts"].forEach(walk);
  return found;
}

describe("the deletion promise matches the DELETE statements that exist", () => {
  it("reaches only classes, students, staff, attempts and assignments", () => {
    const inProduct = deleteStatements().filter((d) => !d.file.startsWith("src/lib/db/reset"));
    const tables = [...new Set(inProduct.map((d) => d.table))].sort();

    // The whole self-service surface. `students` and `assignments` are the
    // single-row controls; the cascade does the rest through foreign keys.
    expect(tables).toEqual(["assignments", "attempts", "classes", "students", "users"]);

    // Nothing deletes the school, the audit log or the product's own settings.
    for (const table of ["schools", "audit_log", "meta", "certifications"]) {
      expect(tables).not.toContain(table);
    }
  });

  it("keeps whole-table deletion in a developer script, out of the product", () => {
    const sweeping = deleteStatements().filter((d) => d.table === "${table}" || d.table === "meta");
    // `resetDatabase` empties every table and re-seeds demo data. It is a
    // script, not a control, and no route or action may reach it.
    expect(sweeping.every((d) => d.file.startsWith("src/lib/db/reset"))).toBe(true);
    const callers = deleteStatements().length;
    expect(callers).toBeGreaterThan(0);
    expect(src("src/lib/db/reset.ts")).toContain("seed(db)");

    const walk = (dir: string): string[] => {
      const hits: string[] = [];
      for (const item of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const rel = `${dir}/${item.name}`;
        if (item.isDirectory()) hits.push(...walk(rel));
        else if (/\.tsx?$/.test(item.name) && /resetDatabase/.test(src(rel))) hits.push(rel);
      }
      return hits;
    };
    expect(walk("src/app")).toEqual([]);
  });

  it("cascades a class exactly as far as the copy says, and no further", () => {
    const { db, cleanup } = createTestDb();
    try {
      // The cascade is a foreign-key behavior, so the test says out loud that
      // foreign keys are on rather than assuming the connection enabled them.
      const [fk] = db.prepare("PRAGMA foreign_keys").all() as { foreign_keys: number }[];
      expect(fk.foreign_keys).toBe(1);

      assignMission(db, {
        classId: DEMO_CLASS,
        missionId: MISSIONS[0].id,
        assignedBy: DEMO_TEACHER,
      });

      // Captured BEFORE the delete. The first version of this test counted
      // attempts `WHERE student_id IN (SELECT id FROM students WHERE class_id
      // = ?)` *after* deleting the class — by which point the inner select was
      // empty, so the count was zero whether or not an orphan survived. It
      // proved nothing about the claim it existed to check.
      const studentIds = listStudents(db, DEMO_CLASS).map((s) => s.id);
      expect(studentIds.length).toBeGreaterThan(0);

      const countBy = (table: string, ids: string[]) =>
        (
          db
            .prepare(
              `SELECT COUNT(*) AS n FROM ${table} WHERE student_id IN (${ids
                .map(() => "?")
                .join(",")})`,
            )
            .get(...ids) as { n: number }
        ).n;

      expect(countBy("attempts", studentIds)).toBeGreaterThan(0);
      expect(countBy("benchmarks", studentIds)).toBeGreaterThan(0);
      const assignmentsBefore = listAssignments(db, DEMO_CLASS).length;
      expect(assignmentsBefore).toBeGreaterThan(0);

      const auditBefore = listAudit(db, DEMO_SCHOOL, 100).length;
      const staffBefore = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number })
        .n;

      deleteClass(db, DEMO_CLASS);

      // Gone, checked against the ids those rows actually carry, so an orphan
      // left behind by a missing cascade fails here.
      expect(countBy("attempts", studentIds)).toBe(0);
      expect(countBy("benchmarks", studentIds)).toBe(0);
      const survivingStudents = (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM students WHERE id IN (${studentIds
              .map(() => "?")
              .join(",")})`,
          )
          .get(...studentIds) as { n: number }
      ).n;
      expect(survivingStudents).toBe(0);

      // The class row itself and its assignments.
      expect(getClass(db, DEMO_CLASS)).toBeUndefined();
      expect(
        (
          db
            .prepare("SELECT COUNT(*) AS n FROM assignments WHERE class_id = ?")
            .get(DEMO_CLASS) as { n: number }
        ).n,
      ).toBe(0);

      // Still here, which is exactly what the copy now admits.
      expect(listAudit(db, DEMO_SCHOOL, 100).length).toBe(auditBefore);
      expect((db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n).toBe(
        staffBefore,
      );
      expect((db.prepare("SELECT COUNT(*) AS n FROM schools").get() as { n: number }).n).toBe(
        1,
      );
    } finally {
      cleanup();
    }
  });

  it("catches an orphan the old query would have missed", () => {
    // Failing-before for the *test logic*, not for the product. The scenario
    // is built in a throwaway database with foreign keys switched off on that
    // connection only: students are removed while their attempts stay, which
    // is the exact state a broken cascade would leave. Production foreign keys
    // are untouched — `SCHEMA_SQL` still sets the pragma, and the previous
    // test asserts it is on in an ordinary fixture.
    const { db, cleanup } = createTestDb();
    try {
      const studentIds = listStudents(db, DEMO_CLASS).map((s) => s.id);
      const placeholders = studentIds.map(() => "?").join(",");
      const attemptsBefore = (
        db
          .prepare(`SELECT COUNT(*) AS n FROM attempts WHERE student_id IN (${placeholders})`)
          .get(...studentIds) as { n: number }
      ).n;
      expect(attemptsBefore).toBeGreaterThan(0);

      db.exec("PRAGMA foreign_keys = OFF");
      db.prepare("DELETE FROM students WHERE class_id = ?").run(DEMO_CLASS);
      db.prepare("DELETE FROM classes WHERE id = ?").run(DEMO_CLASS);
      db.exec("PRAGMA foreign_keys = ON");

      // The query the first version used: the inner select is empty, so it
      // reports zero and the assertion would have passed.
      const oldStyle = (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM attempts WHERE student_id IN
             (SELECT id FROM students WHERE class_id = ?)`,
          )
          .get(DEMO_CLASS) as { n: number }
      ).n;
      expect(oldStyle).toBe(0);

      // The corrected query, against ids captured beforehand, sees the orphans.
      const corrected = (
        db
          .prepare(`SELECT COUNT(*) AS n FROM attempts WHERE student_id IN (${placeholders})`)
          .get(...studentIds) as { n: number }
      ).n;
      expect(corrected).toBe(attemptsBefore);
      expect(corrected).toBeGreaterThan(0);
    } finally {
      cleanup();
    }
  });

  it("promises no erasure the product cannot perform", () => {
    const all = DELETION_SCOPE.join(" ");
    for (const claim of [
      /delete everything/i,
      /delete all (?:their |its |the )?data/i,
      /at any time without contacting us/i,
      /the data is theirs/i,
    ]) {
      expect(all).not.toMatch(claim);
    }
    // And says the missing thing out loud.
    expect(all).toMatch(/no whole-school or account erasure control/i);
    expect(all).toMatch(/the audit log/i);
    // No invented remedy: no support address, no ticket, no SLA.
    expect(all).not.toMatch(/contact (?:us|support)|email us|within \d+ (?:days|hours)|request form|backup/i);
  });

  it.each([
    ["privacy", "src/app/(site)/privacy/page.tsx"],
    ["adminData", "src/app/admin/data/page.tsx"],
    ["forSchools", "src/app/(site)/for-schools/page.tsx"],
  ])("%s makes no whole-school deletion promise", (_name, path) => {
    const copy = rendered(path);
    expect(copy).not.toMatch(/delete everything/i);
    expect(copy).not.toMatch(/at any time without contacting us/i);
    expect(copy).not.toMatch(/delete anything sooner at any time/i);
  });

  it("says the same thing on the public page and the administrator's page", () => {
    for (const path of ["src/app/(site)/privacy/page.tsx", "src/app/admin/data/page.tsx"]) {
      expect(src(path)).toContain("DELETION_SCOPE");
    }
  });
});

describe("assigning a mission stores no free text", () => {
  it("has no note parameter left to pass", () => {
    const repo = src("src/lib/repo/classroom.ts");
    const fn = repo.slice(repo.indexOf("export function assignMission"));
    const body = fn.slice(0, fn.indexOf("\n}"));
    // The parameter is gone, and the column is written as a literal NULL.
    expect(body).not.toMatch(/note\?:/);
    expect(body).not.toMatch(/input\.note/);
    expect(body).toMatch(/VALUES \(\?,\?,\?,\?,\?,NULL,NULL\)/);
    expect(body).not.toMatch(/DO UPDATE SET note/);
  });

  it("writes null for both unused columns, however often it runs", () => {
    const { db, cleanup } = createTestDb();
    try {
      const mission = MISSIONS[1];
      assignMission(db, { classId: DEMO_CLASS, missionId: mission.id, assignedBy: DEMO_TEACHER });
      assignMission(db, { classId: DEMO_CLASS, missionId: mission.id, assignedBy: DEMO_TEACHER });
      const rows = listAssignments(db, DEMO_CLASS).filter((a) => a.mission_id === mission.id);
      expect(rows).toHaveLength(1);
      expect(rows[0].note).toBeNull();
      expect(rows[0].due_on).toBeNull();
    } finally {
      cleanup();
    }
  });

  it("seeds no assignment note either", () => {
    const { db, cleanup } = createTestDb();
    try {
      const withNotes = (
        db
          .prepare("SELECT COUNT(*) AS n FROM assignments WHERE note IS NOT NULL")
          .get() as { n: number }
      ).n;
      const withDates = (
        db
          .prepare("SELECT COUNT(*) AS n FROM assignments WHERE due_on IS NOT NULL")
          .get() as { n: number }
      ).n;
      expect(withNotes).toBe(0);
      expect(withDates).toBe(0);
      // The demo used to write "Do this one together on the rug…", which made
      // an unused column look like a feature in use.
      expect(src("src/lib/db/seed.ts")).not.toMatch(/on the rug/i);
    } finally {
      cleanup();
    }
  });

  it("claims no enforcement the schema does not provide", () => {
    const entry = SURROUNDING_RECORD.find((e) => e.columns.includes("assignments"))!;
    const line = `${entry.what} ${entry.why}`;

    // The assurance that was propped up by the absence of a form.
    expect(line).not.toMatch(/nothing here names a student/i);

    // What is true instead: no write path now, an older database may hold one,
    // and the child boundary is separate and absolute.
    expect(line).toMatch(/both unused/i);
    expect(line).toMatch(/no control in this product writes the note/i);
    expect(line).toMatch(/carried over from an older build may still hold/i);
    expect(line).toMatch(/no free-text input in the student experience/i);
  });
});
