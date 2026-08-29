import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_SQL } from "@/lib/db/schema";
import {
  CLASS_CODE_BOUNDARY,
  CLASS_CODE_POSTURE,
  NOT_COLLECTED,
  STUDENT_LINKED_TABLES,
  STUDENT_RECORD,
  SURROUNDING_RECORD,
} from "@/content/data-inventory";

const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/** Comments and imports are not copy — sprint 44's lesson, repeatedly relearned. */
const copyOf = (p: string) =>
  src(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1")
    .replace(/^import[^\n]*$/gm, "")
    .replace(/\s+/g, " ");

/**
 * What a reader of that page actually sees. A surface may hold the words itself
 * or pull them from the shared module, and an assertion about the copy should
 * not care which — otherwise moving a sentence into shared code looks like
 * deleting it.
 */
const renderedCopy = (p: string) =>
  copyOf(p)
    .replace(/\bCLASS_CODE_BOUNDARY\b/g, CLASS_CODE_BOUNDARY.join(" "))
    .replace(/\bCLASS_CODE_POSTURE\b/g, CLASS_CODE_POSTURE)
    .replace(/\bSTUDENT_RECORD\b/g, STUDENT_RECORD.map((e) => `${e.what} ${e.why}`).join(" "));

const SURFACES = {
  home: "src/app/(site)/page.tsx",
  privacy: "src/app/(site)/privacy/page.tsx",
  adminData: "src/app/admin/data/page.tsx",
  adminClasses: "src/app/admin/classes/page.tsx",
};

/**
 * Column names for one table, read out of the shipped schema rather than a
 * list kept alongside it. A list would drift the same way the two inventories
 * drifted.
 */
function columnsOf(table: string): string[] {
  const m = SCHEMA_SQL.match(
    new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\n\\);`),
  );
  if (!m) throw new Error(`no CREATE TABLE for ${table}`);
  return m[1]
    .split("\n")
    .map((line) => line.replace(/--.*$/, "").trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[0])
    .filter((word) => /^[a-z_]+$/.test(word))
    .filter((word) => !["unique", "check", "primary", "foreign"].includes(word));
}

describe("the student data inventory is the schema, not a summary of it", () => {
  it("accounts for every column of every student-linked table", () => {
    const claimed = new Set(STUDENT_RECORD.flatMap((e) => e.columns));
    const unclaimed: string[] = [];

    for (const table of STUDENT_LINKED_TABLES) {
      for (const column of columnsOf(table)) {
        if (!claimed.has(`${table}.${column}`)) unclaimed.push(`${table}.${column}`);
      }
    }

    // A new column on `students`, `attempts` or `benchmarks` fails here until
    // somebody says out loud what it is. That is the whole point of keeping the
    // word "every" on two buyer-facing pages.
    expect(unclaimed).toEqual([]);
  });

  it("claims no column that the schema does not have", () => {
    const real = new Set(
      STUDENT_LINKED_TABLES.flatMap((t) => columnsOf(t).map((c) => `${t}.${c}`)),
    );
    const invented = STUDENT_RECORD.flatMap((e) => e.columns).filter((c) => !real.has(c));
    expect(invented).toEqual([]);
  });

  it("names the facts the two lists used to omit between them", () => {
    const what = STUDENT_RECORD.map((e) => e.what).join(" ").toLowerCase();
    // Class membership — on the public page, absent from the admin one.
    expect(what).toMatch(/which class the student is on/);
    // Derived per-attempt competency evidence — absent from both.
    expect(what).toMatch(/demonstrated or developing/);
    // Mission and check-in timestamps — mission ones on the public page only,
    // check-in ones on neither.
    expect(what).toMatch(/when a mission was opened and when it was finished/);
    expect(what).toMatch(/when a check-in was opened and when it was finished/);
    // The roster row's creation timestamp — absent from both. Named for what
    // it is, not for a purpose it does not serve; see the visibility test
    // below.
    expect(what).toMatch(/a creation timestamp on the roster row itself/);
  });

  it("keeps the inventory to student scope on both surfaces", () => {
    // Staff certification answers, the audit log and the school's account
    // settings are real records, and none of them is a record about a child.
    // Listing them here would make the scope line false in the other
    // direction.
    const columns = STUDENT_RECORD.flatMap((e) => e.columns).join(" ");
    for (const table of ["certifications", "audit_log", "schools"]) {
      expect(columns).not.toContain(table);
    }
    // And the pages say which scope they are using rather than saying
    // "everything".
    expect(copyOf(SURFACES.adminData)).toMatch(
      /Every column in the database that hangs off a student row/i,
    );
    expect(copyOf(SURFACES.privacy)).toMatch(/It is not everything the product stores/i);
  });

  it("is one list read by both surfaces, not two lists that agree today", () => {
    // Cross-surface agreement enforced structurally: neither page may hold its
    // own copy, so they cannot drift apart again the way they did.
    for (const path of [SURFACES.adminData, SURFACES.privacy]) {
      expect(src(path)).toContain('from "@/content/data-inventory"');
      expect(src(path)).toContain("STUDENT_RECORD");
      // And no hand-written list left behind next to the shared one.
      expect(src(path)).not.toMatch(/const COLLECTED = \[/);
    }
    expect(src(SURFACES.adminData)).toContain("NOT_COLLECTED");
    expect(NOT_COLLECTED.length).toBeGreaterThan(0);
    expect(SURROUNDING_RECORD.length).toBeGreaterThan(0);
  });
});

describe("no surface draws a risk conclusion the product cannot support", () => {
  const BANNED = [
    /nothing worth stealing/i,
    /worth stealing/i,
    /as much security as this data warrants/i,
    /security is proportionate/i,
    /\bproportionate to\b/i,
    /is the entire student record/i,
    /entire value of what sits behind it/i,
    /production[- ]ready/i,
    /secure by design/i,
    // Sprint 66 acceptance: the replacement posture was the same conclusion
    // drawn narrower. An adult in the room does not stop a photographed code
    // being reused, and a small roster does not stop the holder picking a
    // different child on it.
    /supervised pilot/i,
    /adult is in the room/i,
    /small and known/i,
  ];

  it.each(Object.entries(SURFACES))("%s draws none of them", (_name, path) => {
    const copy = renderedCopy(path);
    for (const pattern of BANNED) expect(copy).not.toMatch(pattern);
  });

  it("describes what a class code actually reaches, everywhere it is explained", () => {
    for (const path of [SURFACES.home, SURFACES.privacy, SURFACES.adminClasses]) {
      const copy = renderedCopy(path);
      // Shared access, not identity.
      expect(copy).toMatch(/shared classroom access|not a child's password/i);
      // What the holder can reach: the roster, and any child on it.
      expect(copy).toMatch(/roster/i);
      expect(copy).toMatch(/progress/i);
      // And the mitigation the product does have.
      expect(copy).toMatch(/rotate|new code/i);
    }
  });

  it("states the boundary and the posture in the shared copy", () => {
    const boundary = CLASS_CODE_BOUNDARY.join(" ");
    expect(boundary).toMatch(/not proof of who is using it/i);
    expect(boundary).toMatch(/choose any child listed on it/i);
    expect(boundary).toMatch(/open that child's progress/i);
    expect(boundary).toMatch(/rotate the code/i);
    // No dismissal smuggled back into the shared version.
    for (const line of CLASS_CODE_BOUNDARY) {
      expect(line).not.toMatch(/worth stealing|proportionate|sufficient|harmless/i);
    }

    // The posture still says what is not built, and what this build is.
    expect(CLASS_CODE_POSTURE).toMatch(/roster sync and single sign-on/i);
    expect(CLASS_CODE_POSTURE).toMatch(/not production access control/i);
    expect(CLASS_CODE_POSTURE).not.toMatch(/certifi|recommend|approved for/i);
  });

  it("names no deployment this build is judged good enough for", () => {
    // A local demonstration may be named, and only alongside fictional data.
    expect(CLASS_CODE_POSTURE).toMatch(/local demonstration/i);
    expect(CLASS_CODE_POSTURE).toMatch(/local demonstration running fictional data/i);

    // Nothing is called adequate for real student records — not by this word,
    // and not by a hedged version of it.
    for (const word of [
      /\benough\b/i,
      /\bsuitable\b/i,
      /\bapproved\b/i,
      /\bsafe\b/i,
      /\bproportionate\b/i,
      /\bsupervised pilot\b/i,
      /\bfine for\b/i,
      /\bacceptable\b/i,
    ]) {
      expect(CLASS_CODE_POSTURE).not.toMatch(word);
    }

    // The real-student question is handed to the school, as its judgement.
    expect(CLASS_CODE_POSTURE).toMatch(/real student records/i);
    expect(CLASS_CODE_POSTURE).toMatch(/the school has to weigh/i);
    expect(CLASS_CODE_POSTURE).toMatch(/decision belongs to the school/i);
    expect(CLASS_CODE_POSTURE).toMatch(/nothing here is a vendor assurance/i);
  });

  it("claims no visibility or purpose for a column nothing reads", () => {
    const entry = STUDENT_RECORD.find((e) => e.columns.includes("students.created_at"))!;
    const line = `${entry.what} ${entry.why}`;

    // The claim as written was "so an administrator can see when a record
    // entered the system". No route renders it.
    expect(line).not.toMatch(/so an administrator can see/i);
    expect(line).not.toMatch(/shown to|displayed to|visible to/i);

    // What is true instead, and stated as a boundary rather than a benefit.
    expect(line).toMatch(/no screen in this product displays it/i);
    expect(line).toMatch(/nothing computes from it/i);
    expect(line).toMatch(/deletion dates come from the class's own recorded year-end/i);
  });

  it("proves that column is rendered nowhere, rather than asserting it", () => {
    // A copy assertion about invisibility is only as good as the code, so this
    // walks the routed surfaces. The audit log's own `created_at` is the one
    // timestamp the product does render, and it is not a student's.
    const roots = ["src/app/admin", "src/app/teacher", "src/app/student"];
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const item of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const rel = `${dir}/${item.name}`;
        if (item.isDirectory()) walk(rel);
        else if (/\.tsx?$/.test(item.name)) {
          src(rel)
            .split("\n")
            .forEach((line, i) => {
              if (!/created_at/.test(line)) return;
              // The audit entry, which is a staff action and not a child.
              if (/entry\.created_at/.test(line)) return;
              offenders.push(`${rel}:${i + 1}`);
            });
        }
      }
    };
    roots.forEach(walk);

    expect(offenders).toEqual([]);
  });

  it("still says plainly that unauthorised access reaches education records", () => {
    // The dismissal was load-bearing against this: the same product calls these
    // education records, so "nothing worth stealing" contradicted it.
    expect(copyOf(SURFACES.privacy)).toMatch(/education records under FERPA/i);
    expect(copyOf(SURFACES.adminData)).toMatch(/education records under FERPA/i);
  });
});
