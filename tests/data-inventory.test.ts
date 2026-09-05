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

  /**
   * The surfaces that raise a class code, found rather than listed.
   *
   * This was a hard-coded trio including the landing page. When the landing
   * page dropped its class-code card the guard failed for a page that no longer
   * makes the claim at all — the wrong failure, and the kind that gets a check
   * deleted rather than fixed. The defect it was written for is **half** an
   * explanation: the words "class code" with nothing about shared access. So
   * the rule is now what the test always said it was — a surface either
   * explains a class code properly or does not raise it.
   */
  const explainsClassCode = Object.entries(SURFACES).filter(([, path]) =>
    /class code/i.test(renderedCopy(path)),
  );

  it("is not a vacuous check: the two surfaces that must explain it still do", () => {
    // Without this, every surface dropping the subject would make the guard
    // below pass over an empty list.
    expect(explainsClassCode.map(([name]) => name)).toEqual(
      expect.arrayContaining(["privacy", "adminClasses"]),
    );
  });

  it.each(explainsClassCode)(
    "%s describes what a class code actually reaches",
    (_name, path) => {
      const copy = renderedCopy(path);
      // Shared access, not identity.
      expect(copy).toMatch(/shared classroom access|not a child's password/i);
      // What the holder can reach: the roster, and any child on it.
      expect(copy).toMatch(/roster/i);
      expect(copy).toMatch(/progress/i);
      // And the mitigation the product does have.
      expect(copy).toMatch(/rotate|new code/i);
    },
  );

  it("promises only the rotation containment the code delivers", () => {
    const boundary = CLASS_CODE_BOUNDARY.join(" ");

    // "The old code stops working immediately" was true of new joins and of
    // half-finished grants, and false of a session already issued — which
    // survived rotation for the rest of its twelve hours (sprint 68).
    expect(boundary).not.toMatch(/stops working immediately/i);

    // What is true: rejected on next use, for both credentials.
    expect(boundary).toMatch(/rejected on the next request/i);
    expect(boundary).toMatch(/nobody can join with it/i);
    expect(boundary).toMatch(/already signed in with it is asked to rejoin/i);

    // And the limit said out loud rather than implied away: no real-time
    // control over a page already rendered.
    expect(boundary).toMatch(/cannot do is reach into a page already on a screen/i);

    // No stronger claim smuggled in.
    for (const line of CLASS_CODE_BOUNDARY) {
      expect(line).not.toMatch(/\bimmediately\b|\bin real time\b|\binstantly\b|signed out at once/i);
    }
  });

  it("says the same thing in the administrator's note and the audit entry", () => {
    // `renderedCopy`, not `copyOf`: the page used to hold a hand-written second
    // copy of the boundary — which had already drifted from the module, down to
    // its own typo — and now renders CLASS_CODE_BOUNDARY itself. What a reader
    // sees is identical; what the file contains is not.
    const classes = renderedCopy(SURFACES.adminClasses);
    expect(classes).not.toMatch(/old code stops working immediately/i);
    expect(classes).toMatch(/rejected\s+on the next request/i);
    // The caveat, in whichever words carry it: a page already open is not
    // closed. The page said "mid-mission keeps that screen"; the shared module
    // says "keeps looking at it". Same promise, and the promise is what matters.
    expect(classes).toMatch(/keeps (looking at it|that screen) until they navigate/i);

    for (const path of ["src/app/actions/admin.ts", "src/app/actions/teacher.ts"]) {
      const actions = copyOf(path);
      expect(actions).not.toMatch(/old one stopped working immediately/i);
      expect(actions).toMatch(/rejected on its next use/i);
    }
  });

  /**
   * The one rotation confirmation on a page, extracted or not at all.
   *
   * The first version of this helper was `copy.match(...) ?? copy`, and the
   * fallback was the whole file. `[^`"}]*` stops at the `}` of
   * `${classroom.name}`, so the admin page never matched and every assertion
   * below ran against the entire source — where the note under the table
   * legitimately contains "already signed in with it". The admin confirmation
   * could have regressed and the test would still have passed. That is the
   * sprint-67 false-positive pattern, one sprint later.
   *
   * So: anchored to the specific question, no fallback, and exactly one match
   * required. A renamed prop, a second rotation ConfirmAction or a malformed
   * template fails here rather than silently widening the search.
   */
  function rotationQuestion(path: string, pattern: RegExp): string {
    const found = [...copyOf(path).matchAll(pattern)].map((m) => m[1]);
    expect(
      found,
      `expected exactly one rotation confirmation in ${path}, found ${found.length}`,
    ).toHaveLength(1);
    // The class name is interpolated; substituting a real one keeps the
    // assertions reading the sentence a staff member sees.
    return found[0].replace(/\$\{classroom\.name\}/g, "Room 4");
  }

  it("aligns the rotation confirmations a staff member actually reads", () => {
    // The sprint-68 sweep grepped "stops working immediately" and missed both
    // of these, which said "stop working straight away" and named only people
    // halfway through joining — omitting the sessions the binding newly
    // reaches. Found by driving the confirm dialog rather than reading source.
    const admin = rotationQuestion(
      "src/app/admin/classes/page.tsx",
      // The rotation ConfirmAction specifically. Archive and Delete data are
      // also ConfirmActions on this page and must not be what is read.
      /question=\{`(Give \$\{classroom\.name\} a new code\?[^`]*)`\}/g,
    );
    const teacher = rotationQuestion(
      "src/app/teacher/class/[classId]/page.tsx",
      /question="(Everybody will need the new code[^"]*)"/g,
    );

    // Both extractions found the real thing, not a neighboring prop.
    expect(admin).toMatch(/^Give Room 4 a new code\?/);
    expect(teacher).toMatch(/^Everybody will need the new code/);

    for (const question of [admin, teacher]) {
      expect(question).not.toMatch(/stop working straight away|stops working immediately/i);
      // Both credentials named, not just the half-finished join.
      expect(question).toMatch(/already signed in with (?:it|the old one)/i);
      expect(question).toMatch(/rejoin next time they load a page/i);
    }

    // On the admin question itself, not on the page around it.
    expect(admin).toMatch(
      /roster, assignments, mission history, badges and both check-ins are not touched/i,
    );
  });

  it("fails rather than widening when a confirmation cannot be extracted", () => {
    // The guard that makes the assertions above trustworthy: no silent
    // fallback to a larger haystack.
    expect(() =>
      rotationQuestion("src/app/admin/classes/page.tsx", /question=\{`(NoSuchPrompt[^`]*)`\}/g),
    ).toThrow();
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

    // The real-student question is handed to the school, as its judgment.
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

  it("still says plainly that unauthorized access reaches education records", () => {
    // The dismissal was load-bearing against this: the same product calls these
    // education records, so "nothing worth stealing" contradicted it.
    expect(copyOf(SURFACES.privacy)).toMatch(/education records under FERPA/i);
    expect(copyOf(SURFACES.adminData)).toMatch(/education records under FERPA/i);
  });
});
