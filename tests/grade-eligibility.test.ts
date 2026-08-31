import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The cookie jar a Server Action and a Server Component get from `next/headers`. */
const jar = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    api: {
      get: (n: string) => (store.has(n) ? { name: n, value: store.get(n)! } : undefined),
      set: (n: string, v: string) => {
        store.set(n, v);
      },
      delete: (n: string) => {
        store.delete(n);
      },
    },
  };
});

vi.mock("next/headers", () => ({ cookies: async () => jar.api, headers: async () => new Map() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { createTestDb, DEMO_ADMIN, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import type { Db } from "@/lib/db";
import { writeSession } from "@/lib/auth/session";
import {
  createClass,
  createStudent,
  listAssignments,
  normalizeJoinCode,
  getClass,
} from "@/lib/repo/classroom";
import { assignMission } from "@/lib/repo/classroom";
import { createClassAction, setAssignmentAction } from "@/app/actions/teacher";
import { beginMission } from "@/app/actions/student";
import {
  classMayBeAssigned,
  CREATABLE_GRADES,
  gradeIsInCoreBand,
  canTakeBenchmark,
  nextBenchmarkFor,
} from "@/lib/domain/eligibility";
import { MISSIONS } from "@/content/missions";
import { FOUNDATIONS_BY_TRACK } from "@/content/foundations";
import { CORE_GRADE_BAND } from "@/content/scope";
import StudentHome from "@/app/student/page";
import PlayPage from "@/app/student/play/[slug]/page";
import { readFileSync } from "node:fs";
import { join } from "node:path";
function readSource(p: string) {
  return readFileSync(join(process.cwd(), p), "utf8");
}

let db: Db;
let cleanup: () => void;

/** Every grade the product's copy talks about. */
const GRADES = [1, 2, 3, 4, 5] as const;


beforeEach(async () => {
  ({ db, cleanup } = createTestDb());
  globalThis.__airkDb = db;
  jar.store.clear();
  await writeSession({ kind: "staff", userId: DEMO_TEACHER });
});

afterEach(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

/** A class of this grade, owned by the demo teacher, with one child on it. */
function classOfGrade(grade: number) {
  const classroom = createClass(db, {
    schoolId: DEMO_SCHOOL,
    teacherId: DEMO_TEACHER,
    name: `Grade ${grade} room`,
    grade,
    schoolYear: "2025-2026",
    yearEndsOn: "2026-06-12",
  });
  const student = createStudent(db, { classId: classroom.id, displayName: "Test T." });
  return { classroom, student };
}

const earlyTrack = FOUNDATIONS_BY_TRACK.early;
const upperTrack = FOUNDATIONS_BY_TRACK.upper;
const aCoreMission = MISSIONS[0];

/**
 * Sprint 85 made one truthful commercial scope and enforced it nowhere.
 *
 * Every core `AssignToggle` rendered for every class, `setAssignmentAction`
 * validated the mission and the class but never the grade, and neither
 * `missionAccessFor` nor `canTakeBenchmark` had ever seen a grade. So a grade 1
 * class could be assigned a grades 3-5 First Look session or any grades 2-4 core
 * mission, and a grade 5 class the early track — while the new Plans copy said a
 * grade 1 or 5 class "gets" First Look and that "every mission card says its
 * grade band on its face". Both were false, and children were assignable content
 * outside the reading band it was levelled for.
 */
describe("the eligibility rule is derived, not listed", () => {
  it.each(GRADES.map((g) => [g] as const))("grade %i gets its own First Look track", (grade) => {
    const mine = grade <= 2 ? earlyTrack : upperTrack;
    const theirs = grade <= 2 ? upperTrack : earlyTrack;
    for (const session of mine) expect(classMayBeAssigned(grade, session)).toBe(true);
    for (const session of theirs) expect(classMayBeAssigned(grade, session)).toBe(false);
  });

  it.each(GRADES.map((g) => [g] as const))("grade %i and the core curriculum", (grade) => {
    const inBand = grade >= 2 && grade <= 4;
    expect(gradeIsInCoreBand(grade)).toBe(inBand);
    for (const mission of MISSIONS) {
      expect(classMayBeAssigned(grade, mission), `${mission.slug} for grade ${grade}`).toBe(inBand);
    }
  });

  it("keys on the mission, not on a list of ids", () => {
    // A mission invented here — never in MISSIONS — follows the same rule, so
    // adding curriculum cannot quietly widen eligibility.
    const invented = { segment: "core" as const, track: undefined, gradeBand: CORE_GRADE_BAND };
    expect(classMayBeAssigned(1, invented)).toBe(false);
    expect(classMayBeAssigned(3, invented)).toBe(true);
  });
});

describe("the server refuses an out-of-band assignment", () => {
  it.each(CREATABLE_GRADES.map((g) => [g] as const))(
    "grade %i can be given a core mission, because it is in band",
    async (grade) => {
      const { classroom } = classOfGrade(grade);
      const result = await setAssignmentAction({
        classId: classroom.id,
        missionId: aCoreMission.id,
        assigned: true,
      });
      if (gradeIsInCoreBand(grade)) {
        expect(result.error).toBeUndefined();
        expect(listAssignments(db, classroom.id).map((a) => a.mission_id)).toContain(
          aCoreMission.id,
        );
      } else {
        expect(result.error).toContain(`Grades ${aCoreMission.gradeBand}`);
        expect(result.error).toContain(`Grade ${grade} class`);
        // Nothing was written.
        expect(listAssignments(db, classroom.id)).toHaveLength(0);
      }
    },
  );

  it("refuses the wrong First Look track and names both sides", async () => {
    // Reachable today: a grade 2 class and the grades 3-5 track.
    const { classroom } = classOfGrade(2);
    const wrong = upperTrack[0];
    const result = await setAssignmentAction({
      classId: classroom.id,
      missionId: wrong.id,
      assigned: true,
    });
    expect(result.error).toContain(wrong.title);
    expect(result.error).toContain("Grades 3-5");
    expect(result.error).toContain("Grade 2 class");
    expect(listAssignments(db, classroom.id)).toHaveLength(0);

    // And accepts the right one.
    const right = await setAssignmentAction({
      classId: classroom.id,
      missionId: earlyTrack[0].id,
      assigned: true,
    });
    expect(right.error).toBeUndefined();
  });

  it("still allows unassigning an out-of-band row, so a stale one can be removed", async () => {
    const { classroom } = classOfGrade(2);
    // A row of the kind that existed before this rule did.
    assignMission(db, { classId: classroom.id, missionId: upperTrack[0].id, assignedBy: DEMO_TEACHER });
    expect(listAssignments(db, classroom.id)).toHaveLength(1);

    // Assigning it is refused...
    expect(
      (await setAssignmentAction({ classId: classroom.id, missionId: upperTrack[0].id, assigned: true }))
        .error,
    ).toBeTruthy();
    // ...and withdrawing it is not, which is the only way to clear it.
    const result = await setAssignmentAction({
      classId: classroom.id,
      missionId: upperTrack[0].id,
      assigned: false,
    });
    expect(result.error).toBeUndefined();
    expect(listAssignments(db, classroom.id)).toHaveLength(0);
  });
});

/**
 * The row already exists. Refusing the toggle does not help the child who is
 * already looking at the card, so the student surfaces check for themselves.
 */
describe("a stale out-of-band assignment does not open for a child", () => {
  const OUT_OF_BAND = upperTrack[0];

  async function signInChildOf(grade: number, mission = OUT_OF_BAND) {
    const { classroom, student } = classOfGrade(grade);
    assignMission(db, { classId: classroom.id, missionId: mission.id, assignedBy: DEMO_TEACHER });
    await writeSession({
      kind: "student",
      studentId: student.id,
      code: normalizeJoinCode(getClass(db, classroom.id)!.join_code),
    });
    return { classroom, student };
  }

  it("is not listed on the student map", async () => {
    await signInChildOf(2);
    const text = JSON.stringify(await StudentHome());
    expect(text).not.toContain(OUT_OF_BAND.title);
  });

  it("cannot be opened by URL", async () => {
    await signInChildOf(2);
    await expect(
      PlayPage({ params: Promise.resolve({ slug: OUT_OF_BAND.slug }) }),
    ).rejects.toThrow("REDIRECT:/student");
  });

  it("cannot be begun through the server action", async () => {
    await signInChildOf(2);
    await expect(beginMission(OUT_OF_BAND.slug)).rejects.toThrow(
      "That mission is not open for your class.",
    );
  });

  it("opens normally for the class the track is written for", async () => {
    await signInChildOf(3);
    await expect(beginMission(OUT_OF_BAND.slug)).resolves.toBeUndefined();
  });

  it("opens a core mission normally inside the band", async () => {
    await signInChildOf(3, aCoreMission);
    await expect(beginMission(aCoreMission.slug)).resolves.toBeUndefined();
  });

  it("leaves the assignment row alone", async () => {
    const { classroom } = await signInChildOf(2);
    await expect(beginMission(OUT_OF_BAND.slug)).rejects.toThrow();
    // Hidden and refused, not deleted. A teacher removes it.
    expect(listAssignments(db, classroom.id)).toHaveLength(1);
  });
});

describe("the check-ins stay inside the assessed band", () => {
  it.each(GRADES.map((g) => [g] as const))("grade %i is offered a check-in only in band", (grade) => {
    const open = canTakeBenchmark({ window: "pre", form: "pre", records: [], grade });
    expect(open).toBe(gradeIsInCoreBand(grade));
    const next = nextBenchmarkFor([], "pre", grade);
    expect(next === null).toBe(!gradeIsInCoreBand(grade));
  });

  it("cannot be called without a grade at all", () => {
    // The bound was optional when it was introduced, which meant the invariant
    // failed open for any caller that forgot. `grade` is now required, so
    // omitting it is a type error rather than an unbounded answer — asserted at
    // the source, since a compile error cannot be caught at runtime.
    const source = readSource("src/lib/domain/eligibility.ts");
    expect(source).toMatch(/grade: number;\n\}\): boolean \{/);
    expect(source).not.toMatch(/grade\?: number/);
    expect(source).not.toMatch(/eligible\?: boolean/);
    // And the guards read it unconditionally, with no "if supplied" escape.
    expect(source).toContain("if (!gradeIsInCoreBand(input.grade)) return false;");
    expect(source).toContain("if (!input.eligible) return \"denied\";");
  });
});

describe("every teacher surface shows the band", () => {
  it("the mission library tags all of them, not only First Look", () => {
    const source = readSource("src/app/teacher/missions/page.tsx");
    // FAILING-BEFORE: `{isFoundation && <Tag …>Grades {mission.gradeBand}</Tag>}`.
    expect(source).not.toMatch(/isFoundation && <Tag[^>]*>\s*Grades/);
    expect(source).toMatch(/<Tag tone="neutral">Grades \{mission\.gradeBand\}<\/Tag>/);
  });

  it("the class page puts the band on every row", () => {
    const source = readSource("src/app/teacher/class/[classId]/page.tsx");
    expect(source).toMatch(/Grades \{m\.gradeBand\}/);
  });

  it("replaces an ineligible switch with a stated reason on both surfaces", () => {
    for (const file of [
      "src/app/teacher/missions/page.tsx",
      "src/app/teacher/class/[classId]/page.tsx",
    ]) {
      const source = readSource(file);
      expect(source, `${file} does not consult the rule`).toContain("classMayBeAssigned");
      expect(source, `${file} has no stated unavailable state`).toMatch(/unavailable for Grade /);
    }
  });
});


/**
 * Class creation is grades 2 to 4, refused rather than thrown.
 *
 * `CreateClassForm` offered Grade 1 and Grade 5 and `createClassAction`
 * validated `[1, 2, 3, 4, 5]`, while `classes.grade` has always been
 * constrained to `CHECK (grade BETWEEN 2 AND 4)`. An administrator choosing
 * Grade 1 therefore met a thrown `CHECK constraint failed: grade BETWEEN 2 AND
 * 4` instead of a sentence. The product's niche is this band, so the band is the
 * answer: the options are gone, the action refuses before any repository call,
 * and the schema is untouched.
 */
describe("class creation is bounded to the assessed band", () => {
  const createForm = (grade: string) => {
    const fd = new FormData();
    // A name the seed does not already use — it ships a "Room 4" at grade 2.
    fd.set("name", `New Grade ${grade} Room`);
    fd.set("grade", grade);
    fd.set("teacherId", DEMO_TEACHER);
    return fd;
  };

  beforeEach(async () => {
    await writeSession({ kind: "staff", userId: DEMO_ADMIN });
  });

  it("the form exposes exactly grades 2, 3 and 4", () => {
    const form = readSource("src/app/admin/classes/CreateClassForm.tsx");
    const options = [...form.matchAll(/<option value="(\d)">Grade \d<\/option>/g)].map(
      (m) => Number(m[1]),
    );
    expect(options).toEqual([...CREATABLE_GRADES]);
    // And the hint no longer promises grades that cannot be created.
    expect(form).not.toMatch(/Grades 1 and 5 get the First Look sessions/);
  });

  it.each([1, 5].map((g) => [g] as const))(
    "refuses grade %i calmly, with no insert and no constraint error",
    async (grade) => {
      const before = db.prepare("select count(*) c from classes").get() as { c: number };
      const result = await createClassAction({}, createForm(String(grade)));
      // A sentence, not a thrown database error.
      expect(result.error).toMatch(/Choose a grade from 2 to 4/);
      expect(result.error).not.toMatch(/CHECK constraint/);
      const after = db.prepare("select count(*) c from classes").get() as { c: number };
      expect(after.c).toBe(before.c);
    },
  );

  it.each([2, 3, 4].map((g) => [g] as const))(
    "still creates a grade %i class unchanged",
    async (grade) => {
      const result = await createClassAction({}, createForm(String(grade)));
      expect(result.error).toBeUndefined();
      const made = (
        db.prepare("select grade from classes where name = ?").get(`New Grade ${grade} Room`) as
          | { grade: number }
          | undefined
      );
      expect(made?.grade).toBe(grade);
    },
  );

  it("refuses before touching the repository", () => {
    // The check has to precede `createClass`, or the refusal is the database's.
    const action = readSource("src/app/actions/teacher.ts");
    const body = action.slice(action.indexOf("export async function createClassAction"));
    const guard = body.indexOf("CREATABLE_GRADES.includes(grade)");
    const write = body.indexOf("createClass(db");
    expect(guard).toBeGreaterThan(-1);
    expect(write).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(write);
  });

  it("leaves the schema constraint exactly as it was", () => {
    expect(readSource("src/lib/db/schema.ts")).toMatch(
      /grade\s+INTEGER NOT NULL CHECK \(grade BETWEEN 2 AND 4\)/,
    );
  });

  it("derives the creatable grades from the assessed band", () => {
    expect([...CREATABLE_GRADES]).toEqual([2, 3, 4]);
    for (const grade of CREATABLE_GRADES) expect(gradeIsInCoreBand(grade)).toBe(true);
  });
});

