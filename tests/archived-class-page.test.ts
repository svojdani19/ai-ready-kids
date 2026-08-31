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

import { createTestDb, DEMO_CLASS, DEMO_TEACHER } from "./helpers";
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
  if (node == null || typeof node === "boolean" || typeof node === "number") return out;
  if (typeof node === "string") {
    out.push(node);
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
const textOf = async (tree: unknown) => allStrings(await render(tree)).join("   ");

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
