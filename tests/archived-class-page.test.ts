import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The cookie jar a Server Component gets from `next/headers`. */
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

import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import type { Db } from "@/lib/db";
import { writeSession } from "@/lib/auth/session";
import { archiveClass, getClass, listStudents, restoreClass } from "@/lib/repo/classroom";
import { ARCHIVED_CLASS_TITLE } from "@/components/staff/ArchivedClassNotice";
import { AssignToggle } from "@/components/staff/AssignToggle";
import { AddStudentForm } from "@/components/staff/AddStudentForm";
import { RemoveStudentButton } from "@/components/staff/RemoveStudentButton";
import { RenameStudentForm } from "@/components/staff/RenameStudentForm";
import { ConfirmAction } from "@/components/staff/ConfirmAction";
import ClassPage from "@/app/teacher/class/[classId]/page";
import TeacherOverview from "@/app/teacher/page";
import { listArchivedClassesForTeacher, listClassesForTeacher, createClass } from "@/lib/repo/classroom";
import { createUser } from "@/lib/repo/school";
import { ButtonLink } from "@/components/ui/Button";

let db: Db;
let cleanup: () => void;

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

/**
 * Render a server-component tree the way the framework would.
 *
 * Function components are invoked and recursed into, because an unrendered walk
 * would find `<AssignToggle …/>` as an element whose type has not run and read
 * none of its copy. Client components that need a browser are left intact, so
 * their props and children are still visible — which is exactly what the
 * "is this control present" question needs.
 */
async function render(node: unknown): Promise<unknown> {
  if (node == null || typeof node !== "object") return node;
  if (Array.isArray(node)) return Promise.all(node.map(render));
  const el = node as { type?: unknown; props?: Record<string, unknown> };
  if (typeof el.type === "function") {
    try {
      return await render(await (el.type as (p: unknown) => unknown)(el.props ?? {}));
    } catch {
      return node;
    }
  }
  if (el.props && "children" in el.props) {
    return { ...el, props: { ...el.props, children: await render(el.props.children) } };
  }
  return node;
}

function allStrings(node: unknown, out: string[] = [], seen = new Set<unknown>()): string[] {
  if (node == null || typeof node === "boolean") return out;
  if (typeof node === "string") {
    out.push(node);
    return out;
  }
  // Numbers are content. `Grade {classroom.grade}` renders the grade as a
  // numeric child, and a walker that skipped it read "Grade · 2025-2026 ·
  // students" — which would have made an assertion about the card's context
  // impossible to write, and a `not.toContain` about a number pass vacuously.
  if (typeof node === "number") {
    out.push(String(node));
    return out;
  }
  if (typeof node === "function" || typeof node !== "object") return out;
  if (seen.has(node)) return out;
  seen.add(node);
  if (Array.isArray(node)) {
    for (const child of node) allStrings(child, out, seen);
    return out;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key.startsWith("_") || key === "type" || key === "ref" || key === "key") continue;
    allStrings(value, out, seen);
  }
  return out;
}

/** Every component function appearing anywhere in the tree, by identity. */
function componentsIn(node: unknown, out = new Set<unknown>(), seen = new Set<unknown>()): Set<unknown> {
  if (node == null || typeof node !== "object") return out;
  if (seen.has(node)) return out;
  seen.add(node);
  if (Array.isArray(node)) {
    for (const child of node) componentsIn(child, out, seen);
    return out;
  }
  const el = node as { type?: unknown; props?: Record<string, unknown> };
  if (typeof el.type === "function") out.add(el.type);
  for (const value of Object.values(node as Record<string, unknown>)) {
    componentsIn(value, out, seen);
  }
  return out;
}

const page = () => ClassPage({ params: Promise.resolve({ classId: DEMO_CLASS }) });
/**
 * Two renderings, for two different questions.
 *
 * `textOf` pads between strings so a presence/absence check cannot be fooled by
 * two unrelated fragments abutting into a phrase that is not on the page.
 * `denseTextOf` joins them the way the DOM does, which is the only way to assert
 * a rendered sentence: `Grade {grade} · {year}` arrives as the separate children
 * `"Grade "`, `3`, `" · "`, `"2025-2026"`, and reads as "Grade 3 · 2025-2026"
 * only once concatenated.
 */
const textOf = async (tree: unknown) => allStrings(await render(tree)).join("   ");
const denseTextOf = async (tree: unknown) => allStrings(await render(tree)).join("");

/**
 * Every control that mutates the class. Sprint 82 refuses all five server-side;
 * this asserts the archived page does not offer them in the first place, so a
 * teacher is not asked to discover the state by being refused five times.
 */
const MUTATION_CONTROLS = [
  ["AssignToggle", AssignToggle],
  ["AddStudentForm", AddStudentForm],
  ["RemoveStudentButton", RemoveStudentButton],
  ["RenameStudentForm", RenameStudentForm],
  ["ConfirmAction (New code)", ConfirmAction],
] as const;

describe("an active class is unchanged", () => {
  it("offers every control and the working code", async () => {
    const tree = await page();
    const present = componentsIn(tree);
    for (const [name, component] of MUTATION_CONTROLS) {
      expect(present.has(component), `${name} is missing from an active class`).toBe(true);
    }
    const text = await textOf(tree);
    expect(text).toContain(getClass(db, DEMO_CLASS)!.join_code);
    expect(text).toMatch(/appears on every student's map in this class straight away/);
    expect(text).not.toContain(ARCHIVED_CLASS_TITLE);
    expect(text).not.toMatch(/Inactive/);
  });
});

describe("an archived class says so before anybody acts", () => {
  beforeEach(() => archiveClass(db, DEMO_CLASS));

  it("still renders, rather than redirecting or 404ing", async () => {
    await expect(page()).resolves.toBeTruthy();
  });

  it("states the read-only condition and what restores it", async () => {
    const text = await textOf(await page());
    expect(text).toContain(ARCHIVED_CLASS_TITLE);
    expect(text).toMatch(/Students cannot join it/);
    expect(text).toMatch(/an administrator has to restore the class/i);
    // And says the records are still here, because the alternative reading of
    // "archived" is "deleted".
    expect(text).toMatch(/stays readable|Nothing has been deleted/i);
  });

  it("offers no control that would be refused", async () => {
    const present = componentsIn(await page());
    for (const [name, component] of MUTATION_CONTROLS) {
      expect(present.has(component), `${name} is still offered on an archived class`).toBe(false);
    }
  });

  it("does not present the join code as usable", async () => {
    const code = getClass(db, DEMO_CLASS)!.join_code;
    const text = await textOf(await page());
    // The rotated code is not printed at all: a code on this page is a code
    // somebody writes on a board.
    expect(text).not.toContain(code);
    expect(text).toMatch(/Inactive/);
    expect(text).toMatch(/No code admits students to an archived class/);
    expect(text).not.toMatch(/New code/);
  });

  it("does not promise a mission goes live straight away", async () => {
    const text = await textOf(await page());
    expect(text).not.toMatch(/appears on every student's map in this class straight away/);
    expect(text).toMatch(/Nothing can be turned on or off until an administrator restores it/);
  });

  it("keeps the roster, the completed work and the evidence", async () => {
    const students = listStudents(db, DEMO_CLASS);
    expect(students.length).toBeGreaterThan(0);
    const text = await textOf(await page());
    // Every child still named, with their evidence beside them.
    for (const student of students) expect(text).toContain(student.display_name);
    expect(text).toMatch(/Students in .* with missions completed and skills demonstrated/);
    expect(text).toMatch(/Competency evidence/);
    expect(text).toMatch(/Check-in windows/);
    // What was assigned is still legible, as a fact rather than a switch.
    expect(text).toMatch(/Was assigned|Not assigned/);
  });

  it("goes back to normal when the class is restored", async () => {
    expect(await textOf(await page())).toContain(ARCHIVED_CLASS_TITLE);
    restoreClass(db, DEMO_CLASS);
    const tree = await page();
    const text = await textOf(tree);
    expect(text).not.toContain(ARCHIVED_CLASS_TITLE);
    expect(text).toMatch(/appears on every student's map in this class straight away/);
    const present = componentsIn(tree);
    for (const [name, component] of MUTATION_CONTROLS) {
      expect(present.has(component), `${name} did not come back after a restore`).toBe(true);
    }
  });
});

/**
 * The notice is what a screen-reader user meets instead of the missing buttons,
 * so its semantics are part of the correction rather than decoration.
 */
describe("the archived notice is announced and named", () => {
  beforeEach(() => archiveClass(db, DEMO_CLASS));

  it("is a status region labelled by its own heading", async () => {
    const rendered = (await render(await page())) as unknown;
    const found: Record<string, unknown>[] = [];
    const walk = (n: unknown, seen = new Set<unknown>()) => {
      if (n == null || typeof n !== "object" || seen.has(n)) return;
      seen.add(n);
      if (Array.isArray(n)) return n.forEach((c) => walk(c, seen));
      const el = n as { props?: Record<string, unknown> };
      if (el.props?.["aria-labelledby"] === "archived-class-title") found.push(el.props);
      for (const v of Object.values(n as Record<string, unknown>)) walk(v, seen);
    };
    walk(rendered);
    expect(found, "the archived notice should be one labelled region").toHaveLength(1);
    // A standing condition the teacher navigated into, not an interruption.
    expect(found[0].role).toBe("status");
  });

  it("names the class it is talking about", async () => {
    const text = await textOf(await page());
    expect(text).toContain(getClass(db, DEMO_CLASS)!.name);
  });
});

/**
 * Defense in depth, not a replacement. Sprint 82's resolver still has to refuse,
 * because a stale tab rendered before the archive still holds every control.
 */
describe("the server guard is untouched", () => {
  it("still refuses a mutation that arrives from a stale page", async () => {
    archiveClass(db, DEMO_CLASS);
    const { rotateJoinCodeAction } = await import("@/app/actions/teacher");
    const result = await rotateJoinCodeAction(DEMO_CLASS);
    expect(result.error).toMatch(/^That class is archived\./);
  });
});

/**
 * Sprint 85: archiving a class removed the only way to reach it.
 *
 * `listClassesForTeacher` filters `archived_at IS NULL`, and the dashboard is
 * the only navigation to `/teacher/class/[classId]`. So the moment an
 * administrator archived a cohort, its own teacher could reach the roster,
 * completed work and evidence only from a URL they had kept — which is not a
 * workflow a school can train a substitute or a returning teacher around. The
 * page above is honest when reached; nothing led there.
 *
 * The correction is a separate section fed by a separate query, so a parked
 * cohort is reachable without being able to leak into anything operational.
 */
describe("the dashboard leads to archived records without mixing them in", () => {
  const overview = () => TeacherOverview();

  it("keeps archived cohorts out of the active list", () => {
    archiveClass(db, DEMO_CLASS);
    const active = listClassesForTeacher(db, DEMO_TEACHER, DEMO_SCHOOL);
    expect(active.map((c) => c.id)).not.toContain(DEMO_CLASS);
    // The archived query is the mirror image, and returns no active class.
    const archived = listArchivedClassesForTeacher(db, DEMO_TEACHER, DEMO_SCHOOL);
    expect(archived.map((c) => c.id)).toContain(DEMO_CLASS);
    for (const c of archived) expect(c.archived_at).not.toBeNull();
  });

  it("shows no archived section while nothing is archived", async () => {
    const text = await textOf(await overview());
    expect(text).not.toMatch(/Archived classes/);
    expect(text).toContain(getClass(db, DEMO_CLASS)!.name);
  });

  it("moves the class from the active list into the archived section", async () => {
    const name = getClass(db, DEMO_CLASS)!.name;
    const before = await textOf(await overview());
    expect(before).toMatch(/Open class/);

    const { grade, school_year: year } = getClass(db, DEMO_CLASS)!;
    const roster = listStudents(db, DEMO_CLASS).length;
    archiveClass(db, DEMO_CLASS);
    const text = await textOf(await overview());

    expect(text).toMatch(/Archived classes/);
    expect(text).toContain(name);
    expect(text).toMatch(/Read-only/);
    expect(text).toMatch(/View records/);

    // The minimum useful context, as one rendered sentence: name, grade, school
    // year, roster count. Nothing else about the cohort, and nothing operational.
    const dense = await denseTextOf(await overview());
    expect(dense).toContain(`Grade ${grade} · ${year} · ${roster} students`);
  });

  it("does not tell a teacher with archived classes that they have none yet", async () => {
    archiveClass(db, DEMO_CLASS);
    const text = await textOf(await overview());
    // "You do not have a class yet", printed directly above a list of the
    // teacher's own finished cohorts, is both wrong and dismissive.
    expect(text).not.toMatch(/You do not have a class yet/);
    expect(text).toMatch(/You do not have an active class right now/);
    expect(text).toMatch(/archived classes are below/i);
  });

  it("links to the read-only page for that class", async () => {
    archiveClass(db, DEMO_CLASS);
    const text = await textOf(await overview());
    expect(text).toContain(`/teacher/class/${DEMO_CLASS}`);
  });

  it("shows no join code and no active call to action", async () => {
    const code = getClass(db, DEMO_CLASS)!.join_code;
    archiveClass(db, DEMO_CLASS);
    const text = await textOf(await overview());
    // Archiving rotated the code and it admits nobody. A code on a dashboard is
    // a code somebody writes on a board.
    expect(text).not.toContain(code);
    expect(text).not.toMatch(/Open class/);
    expect(text).not.toMatch(/New code|Add to roster/);
  });

  it("offers no control that mutates a parked class", async () => {
    archiveClass(db, DEMO_CLASS);
    const present = componentsIn(await overview());
    for (const [name, component] of MUTATION_CONTROLS) {
      expect(present.has(component), `${name} is offered on the dashboard`).toBe(false);
    }
    // The only affordance is a link.
    expect(present.has(ButtonLink)).toBe(true);
  });

  it("counts archived cohorts in none of the figures", async () => {
    const students = listStudents(db, DEMO_CLASS).length;
    expect(students).toBeGreaterThan(0);
    archiveClass(db, DEMO_CLASS);
    // The *unrendered* tree: `Stat` is a component, and rendering it turns its
    // label/value props into markup where a number in prose looks the same as a
    // figure. The props are the figure.
    const rendered = (await overview()) as unknown;

    // Walk to the Stat props rather than the prose.
    const stats: Record<string, unknown>[] = [];
    const walk = (n: unknown, seen = new Set<unknown>()) => {
      if (n == null || typeof n !== "object" || seen.has(n)) return;
      seen.add(n);
      if (Array.isArray(n)) return n.forEach((c) => walk(c, seen));
      const el = n as { props?: Record<string, unknown> };
      if (el.props && "label" in el.props && "value" in el.props) stats.push(el.props);
      for (const v of Object.values(n as Record<string, unknown>)) walk(v, seen);
    };
    walk(rendered);
    const byLabel = new Map(stats.map((s) => [String(s.label), s.value]));
    expect(byLabel.get("Classes")).toBe(0);
    expect(byLabel.get("Students")).toBe(0);
  });

  it("never shows another teacher's archived class", async () => {
    const other = createUser(db, {
      schoolId: DEMO_SCHOOL,
      name: "Other Teacher",
      email: "other.teacher@brightwood.demo",
      role: "teacher",
      title: "Grade 4 Teacher",
    });
    const theirs = createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: other.id,
      name: "Room 99",
      grade: 4,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-12",
    });
    archiveClass(db, theirs.id);
    archiveClass(db, DEMO_CLASS);

    const text = await textOf(await overview());
    expect(text).toMatch(/Archived classes/);
    expect(text).toContain(getClass(db, DEMO_CLASS)!.name);
    // Ownership, not school membership — the same boundary the class page draws.
    expect(text).not.toContain("Room 99");
    expect(listArchivedClassesForTeacher(db, DEMO_TEACHER, DEMO_SCHOOL).map((c) => c.id)).not.toContain(
      theirs.id,
    );
  });
});

/**
 * A class can be archived before anybody joins it.
 *
 * Nothing requires a roster to archive: `archiveClass` checks only
 * `archived_at`, and `archiveClassAction` checks only ownership and the term.
 * So the zero-student archived class is reachable — a cohort created and parked
 * before enrollment, or emptied and then archived.
 *
 * Sprint 84 hid `AddStudentForm` and replaced the join code with "Inactive", and
 * left the roster's empty state unconditional. It went on saying *"Add students
 * below. They join by typing the class code…"* on a page rendering neither
 * control. A teacher or substitute is then told to use an affordance that is not
 * there and a code that admits nobody, at exactly the moment they most need the
 * read-only state to be coherent.
 */
describe("a class with no students at all", () => {
  /** An owned class with an empty roster, in whichever state the test needs. */
  const emptyClass = () =>
    createClass(db, {
      schoolId: DEMO_SCHOOL,
      teacherId: DEMO_TEACHER,
      name: "Room 0",
      grade: 3,
      schoolYear: "2025-2026",
      yearEndsOn: "2026-06-12",
    });

  const pageFor = (classId: string) => ClassPage({ params: Promise.resolve({ classId }) });

  it("can be archived with an empty roster, which is what makes this reachable", () => {
    const empty = emptyClass();
    expect(listStudents(db, empty.id)).toHaveLength(0);
    archiveClass(db, empty.id);
    // No guard anywhere refused it.
    expect(getClass(db, empty.id)!.archived_at).not.toBeNull();
  });

  it("active and empty is unchanged: the form and the code guidance stay", async () => {
    const empty = emptyClass();
    const tree = await pageFor(empty.id);
    const text = await textOf(tree);

    expect(text).toMatch(/Nobody on this roster yet/);
    expect(text).toMatch(/Add students below/);
    expect(text).toMatch(/typing the class code/);
    // The control the copy points at is actually there.
    expect(componentsIn(tree).has(AddStudentForm)).toBe(true);
    expect(text).toContain(getClass(db, empty.id)!.join_code);
    expect(text).not.toMatch(/No student records to review/);
  });

  it("archived and empty says there is nothing to review, and how to change that", async () => {
    const empty = emptyClass();
    archiveClass(db, empty.id);
    const text = await textOf(await pageFor(empty.id));

    expect(text).toMatch(/No student records to review/);
    expect(text).toMatch(/Nobody joined this class before it was archived/);
    expect(text).toMatch(/no roster, no completed work and no evidence/i);
    expect(text).toMatch(/An administrator has to restore the class before anybody can be added/);
  });

  it("archived and empty never points at a control or a code", async () => {
    const empty = emptyClass();
    const code = getClass(db, empty.id)!.join_code;
    archiveClass(db, empty.id);
    const tree = await pageFor(empty.id);
    const text = await textOf(tree);

    // The two sentences that made the page contradict itself.
    expect(text).not.toMatch(/Add students below/);
    expect(text).not.toMatch(/typing the class code/);
    expect(text).not.toMatch(/Nobody on this roster yet/);

    // Component identity, not wording: the form is genuinely absent, and so is
    // every other mutation control.
    const present = componentsIn(tree);
    for (const [name, component] of MUTATION_CONTROLS) {
      expect(present.has(component), `${name} is offered on an empty archived class`).toBe(false);
    }

    // No code, old or new. The pre-archive code is checked too, because a page
    // that printed the rotated one would still be printing a dead code.
    expect(text).not.toContain(code);
    expect(text).not.toContain(getClass(db, empty.id)!.join_code);
    expect(text).toMatch(/Inactive/);
  });

  it("still carries the archived notice, so the state is stated once", async () => {
    const empty = emptyClass();
    archiveClass(db, empty.id);
    const text = await textOf(await pageFor(empty.id));
    expect(text).toContain(ARCHIVED_CLASS_TITLE);
  });

  it("leaves a non-empty archived class exactly as sprint 84 left it", async () => {
    // The correction is scoped to the zero-student branch: a parked class with a
    // roster still shows every child, their work and their evidence.
    archiveClass(db, DEMO_CLASS);
    const text = await textOf(await page());
    expect(text).not.toMatch(/No student records to review/);
    for (const student of listStudents(db, DEMO_CLASS)) {
      expect(text).toContain(student.display_name);
    }
    expect(text).toMatch(/Competency evidence/);
    expect(text).toMatch(/Check-in windows/);
  });
});
