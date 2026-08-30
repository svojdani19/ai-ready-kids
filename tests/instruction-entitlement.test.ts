import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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

// Next's real `redirect` and `notFound` throw framework errors. These throw
// recognizable ones so a test can tell "the page sent me away" from "the page
// blew up" — and so a gate that redirected instead of rendering is visible
// rather than silently passing.
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { createTestDb, DEMO_ADMIN, DEMO_CLASS, DEMO_SCHOOL, DEMO_TEACHER } from "./helpers";
import type { Db } from "@/lib/db";
import { writeSession } from "@/lib/auth/session";
import { requireOpenCurriculum } from "@/lib/auth/instruction-access";
import {
  LAPSED_CURRICULUM_BODY,
  LAPSED_CURRICULUM_TITLE,
  UNVERIFIED_CURRICULUM_BODY,
  UNVERIFIED_CURRICULUM_TITLE,
} from "@/lib/domain/subscription";
import { MISSIONS, FOUNDATIONS } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";
import { SESSION_SHAPES } from "@/content/session-guide";

import { PLANS } from "@/app/(site)/plans/page";
import { ROLES } from "@/app/(site)/for-schools/page";
import { CURRICULUM_SCOPE } from "@/lib/domain/subscription";
import MissionLibrary from "@/app/teacher/missions/page";
import MissionPreview from "@/app/teacher/missions/[slug]/page";
import PrintableGuide from "@/app/teacher/guides/[slug]/page";
import ClassroomPage from "@/app/teacher/classroom/[slug]/page";
import CertificationPage from "@/app/teacher/certification/page";
import HowToRunASession from "@/app/teacher/how-to-run-a-session/page";
import TeacherOverview from "@/app/teacher/page";
import ClassPage from "@/app/teacher/class/[classId]/page";

let db: Db;
let cleanup: () => void;

beforeAll(() => {
  ({ db, cleanup } = createTestDb());
  // These are real page components, and a page calls `getDb()` rather than
  // being handed a handle. Without this binding they would read the
  // developer's own data/ directory instead of the fixture.
  globalThis.__airkDb = db;
});
afterAll(() => {
  globalThis.__airkDb = undefined;
  cleanup();
});

const setTerm = (starts: string, renews: string) =>
  db
    .prepare("update schools set term_starts_on = ?, term_renews_on = ? where id = ?")
    .run(starts, renews, DEMO_SCHOOL);

/** An unambiguously live term, restored before every test so states cannot leak. */
const ACTIVE = () => setTerm("2025-08-18", "2999-09-01");
const LAPSED = () => setTerm("2024-08-18", "2025-06-30");
/** Not a date at all — the value that used to keep a school active forever. */
const UNREADABLE = () => setTerm("2025-08-18", "soon");

beforeEach(async () => {
  ACTIVE();
  await writeSession({ kind: "staff", userId: DEMO_TEACHER });
});

/**
 * Render a server-component tree the way the framework would, then read every
 * string in it.
 *
 * Both halves are load-bearing. A page that returns `<CurriculumClosed …/>`
 * returns an element whose type is a function that has not run, so an
 * unrendered walk would find the two props and none of the copy — and would
 * pass just as happily if the page had returned the whole mission library.
 * Function components are therefore invoked, awaited and recursed into.
 *
 * The string walk then reads props as well as children, because
 * `ClassroomPage` returns `<ClassroomMode mission={mission} />`: the entire
 * authored mission, every scene and every branch, travels as a prop and is
 * invisible to a children-only walk. Walking both is what makes "no authored
 * content was served" a claim about the response rather than about visible
 * text.
 */
async function render(node: unknown): Promise<unknown> {
  if (node == null || typeof node !== "object") return node;
  if (Array.isArray(node)) return Promise.all(node.map(render));
  const el = node as { type?: unknown; props?: Record<string, unknown> };
  if (typeof el.type === "function") {
    try {
      return await render(await (el.type as (p: unknown) => unknown)(el.props ?? {}));
    } catch {
      // A client component that needs a browser cannot be invoked here. Its
      // element is kept intact, so its props and children are still read.
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
  if (typeof node === "function") return out;
  if (typeof node !== "object") return out;
  if (seen.has(node)) return out;
  seen.add(node);
  if (Array.isArray(node)) {
    for (const child of node) allStrings(child, out, seen);
    return out;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    // `_owner`/`_store` are React internals and `type` is the component
    // function itself; neither is content that was served.
    if (key.startsWith("_") || key === "type" || key === "ref" || key === "key") continue;
    allStrings(value, out, seen);
  }
  return out;
}

const textOf = async (tree: unknown) => allStrings(await render(tree)).join("   ");

/** The six authored teaching routes, each with the arguments it needs. */
const PROTECTED = [
  { name: "mission library", run: () => MissionLibrary() },
  {
    name: "mission detail",
    run: () => MissionPreview({ params: Promise.resolve({ slug: MISSIONS[0].slug }) }),
  },
  {
    name: "printable discussion guide",
    run: () => PrintableGuide({ params: Promise.resolve({ slug: MISSIONS[0].slug }) }),
  },
  {
    name: "Classroom Mode",
    run: () => ClassroomPage({ params: Promise.resolve({ slug: FOUNDATIONS[0].slug }) }),
  },
  { name: "educator orientation", run: () => CertificationPage() },
  { name: "how to run a session", run: () => HowToRunASession() },
] as const;

/**
 * Authored content that must not appear in a blocked response — one distinctive
 * string per surface, read from the content modules rather than retyped, so
 * rewording a mission cannot quietly make this assertion vacuous.
 */
const AUTHORED = [
  MISSIONS[0].title,
  MISSIONS[0].bigIdea,
  FOUNDATIONS[0].bigIdea,
  FOUNDATIONS[0].scenes[0].narration?.[0] ?? FOUNDATIONS[0].title,
  CERTIFICATION_MODULES[0].body[0],
  SESSION_SHAPES[0].steps[0].teacher,
];

describe("the gate resolves the three commercial states", () => {
  it("is open inside the term", async () => {
    expect((await requireOpenCurriculum()).open).toBe(true);
  });

  it("is lapsed the day after the renewal date, and open on it", async () => {
    setTerm("2025-08-18", "2026-09-01");
    // The product's rule is active *through* the renewal date.
    expect((await requireOpenCurriculum(new Date("2026-09-01T23:00:00Z"))).open).toBe(true);
    expect(await requireOpenCurriculum(new Date("2026-09-02T00:00:00Z"))).toMatchObject({
      open: false,
      reason: "lapsed",
    });
  });

  it("needs configuration when a date is not a date", async () => {
    UNREADABLE();
    expect(await requireOpenCurriculum()).toMatchObject({
      open: false,
      reason: "needs-configuration",
    });
  });

  it("authenticates before it reveals anything about the school", async () => {
    LAPSED();
    jar.store.clear();
    // A signed-out visitor is sent to sign in and never learns whether the
    // school exists, let alone whether it has paid.
    await expect(requireOpenCurriculum()).rejects.toThrow("REDIRECT:/signin");
  });
});

describe.each([
  ["lapsed", LAPSED, LAPSED_CURRICULUM_TITLE, UNVERIFIED_CURRICULUM_TITLE] as const,
  ["needs-configuration", UNREADABLE, UNVERIFIED_CURRICULUM_TITLE, LAPSED_CURRICULUM_TITLE] as const,
])("while %s, no authored curriculum is served", (reason, apply, mine, theirs) => {
  it.each(PROTECTED.map((p) => [p.name, p] as const))("%s is gated", async (_n, route) => {
    apply();
    const text = await textOf(await route.run());
    expect(text).toContain(mine);
    // The two states never borrow each other's commercial claim.
    expect(text).not.toContain(theirs);
    for (const authored of AUTHORED) expect(text).not.toContain(authored);
  });

  it("says the right thing and gives a teacher a way out they can take", async () => {
    apply();
    const text = await textOf(await MissionLibrary());
    expect(text).toContain(
      reason === "lapsed" ? LAPSED_CURRICULUM_BODY : UNVERIFIED_CURRICULUM_BODY,
    );
    // A teacher gets a person, not `/admin/program`, which would bounce them.
    expect(text).toContain("Ask your school administrator");
    expect(text).not.toContain("/admin/program");
    // And always a route back to their own dashboard.
    expect(text).toContain("/teacher");
  });

  it("gives an administrator the page only they can open", async () => {
    apply();
    await writeSession({ kind: "staff", userId: DEMO_ADMIN });
    const text = await textOf(await MissionLibrary());
    expect(text).toContain("/admin/program");
  });

  it("leaves the school's own records open", async () => {
    apply();
    // The teacher dashboard and a class's own history: the school's records,
    // which renewal must never be a condition for reaching.
    const overview = await textOf(await TeacherOverview());
    expect(overview).not.toContain(mine);
    expect(overview).toContain("Room 12");

    const classPage = await textOf(await ClassPage({ params: Promise.resolve({ classId: DEMO_CLASS }) }));
    expect(classPage).not.toContain(mine);
  });

  it("reopens the moment the dates are right again", async () => {
    apply();
    expect(await textOf(await MissionLibrary())).toContain(mine);
    ACTIVE();
    const text = await textOf(await MissionLibrary());
    expect(text).not.toContain(mine);
    expect(text).toContain("Mission library");
  });
});

describe("the two states never share a sentence", () => {
  it("only the lapsed copy claims something ended", () => {
    expect(LAPSED_CURRICULUM_BODY).toContain("term has ended");
    expect(UNVERIFIED_CURRICULUM_BODY).not.toContain("has ended.");
    expect(UNVERIFIED_CURRICULUM_BODY).toContain("This is not an expiry");
    expect(LAPSED_CURRICULUM_BODY).not.toContain("not an expiry");
  });

  it("both promise the school its own records, in the same words", () => {
    for (const body of [LAPSED_CURRICULUM_BODY, UNVERIFIED_CURRICULUM_BODY]) {
      expect(body).toContain("reports and exports");
      expect(body).toContain("retention settings");
      expect(body).toContain("certificate already earned");
      expect(body).toContain("never a condition");
    }
  });

  it("does not announce the same headline twice", () => {
    // The shell already carries one `role="status"` for this account
    // condition. A second live region on the page repeating the same title
    // announces it twice to a screen reader; the panel is the page's content,
    // so it is a landmark with the page's `h1` instead.
    const panel = readFileSync(
      join(process.cwd(), "src/components/staff/CurriculumClosed.tsx"),
      "utf8",
    );
    // Comments discuss the decision; only markup counts as making it.
    const markup = panel
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(markup).not.toMatch(/role="(status|alert)"/);
    expect(panel).toContain('aria-labelledby="curriculum-closed-title"');
    expect(panel).toContain("<h1");
  });

  it("says nothing to a child", () => {
    // Children are blocked at the class and are never shown billing language.
    // Neither string may reach a student-facing module.
    const player = readFileSync(
      join(process.cwd(), "src/app/student/play/[slug]/MissionPlayer.tsx"),
      "utf8",
    );
    expect(player).not.toContain("CURRICULUM");
    expect(player).not.toContain("subscription");
  });
});

/**
 * The public-route decision and the commercial claim are one fact.
 *
 * Sprint 81 gated the authored curriculum and deliberately left `/family/[slug]`
 * public — statically generated, no session, nothing to collect from a
 * caregiver. It left the Single classroom plan card still selling "Printable
 * family take-homes" by the year, which is a buyer-facing contradiction: the
 * product was charging annually for pages it hands to anyone with the link.
 *
 * Sprint 81's acceptance correction resolved it on the copy, not on the page.
 * These tests hold the two halves together so neither can drift alone: a paid
 * claim about take-homes
 * fails here, and so does a session check on the family route. Whichever way
 * somebody breaks the boundary, the same suite tells them.
 */
describe("family take-homes are a free public resource, and the copy says so", () => {
  const familySource = readFileSync(
    join(process.cwd(), "src/app/family/[slug]/page.tsx"),
    "utf8",
  );

  const FAMILY_CLAIM = /family take-?home|take-?home for famil/i;

  it("no plan sells a family take-home", () => {
    for (const plan of PLANS) {
      for (const feature of plan.features) {
        expect(feature, `${plan.name} sells "${feature}"`).not.toMatch(FAMILY_CLAIM);
      }
      // Nor as a thing coming later, which would be the same claim deferred.
      for (const planned of plan.planned ?? []) {
        expect(planned, `${plan.name} promises "${planned}"`).not.toMatch(FAMILY_CLAIM);
      }
    }
  });

  it("the plans page says outright that they are free and need no subscription", () => {
    const plansSource = readFileSync(
      join(process.cwd(), "src/app/(site)/plans/page.tsx"),
      "utf8",
    );
    expect(plansSource).toMatch(/free public resource/i);
    expect(plansSource).toMatch(/not part of any plan/i);
    expect(plansSource).toMatch(/no subscription/i);
  });

  it("the gated scope does not include them", () => {
    // The sentence a blocked teacher reads names what is licensed. If a family
    // take-home ever appears in it, the gate and the copy have diverged again.
    expect(CURRICULUM_SCOPE).not.toMatch(FAMILY_CLAIM);
    expect(CURRICULUM_SCOPE).toContain("discussion guides");
  });

  it("only the Families card claims them, and calls them free", () => {
    const families = ROLES.find((r) => r.id === "families")!;
    expect(families.points.join(" ")).toMatch(/free public resources?, not part of any plan/i);
    expect(families.points.join(" ")).toMatch(/no subscription is needed/i);

    // A paid-audience card may mention the take-home, but never as something
    // that stops when the term does.
    for (const role of ROLES.filter((r) => r.id !== "families")) {
      for (const point of role.points) {
        if (!FAMILY_CLAIM.test(point)) continue;
        expect(point, `${role.title}: "${point}"`).toMatch(/free|either way|without a subscription/i);
      }
    }
  });

  it("the route takes no session and collects nothing", () => {
    // The other half of the same fact. Were this to gain a session check, the
    // free claim above would become false while still passing on its own.
    expect(familySource).not.toMatch(/require(Staff|Teacher|Admin|OpenCurriculum)\(/);
    expect(familySource).not.toContain("@/lib/auth/session");
    expect(familySource).not.toContain("instruction-access");
    expect(familySource).not.toMatch(/\bcookies\(/);
    // Nothing to submit: no form, no input, no server action.
    expect(familySource).not.toMatch(/<form|<input|<textarea|"use server"/);
  });

  it("stays statically generated for every session and mission", () => {
    expect(familySource).toContain("export function generateStaticParams");
    // Prerendered for all of them, not a subset somebody has to maintain.
    expect(familySource).toContain("ALL_SESSIONS.map");
    // `force-dynamic` or a dynamic params opt-out would silently undo it.
    expect(familySource).not.toMatch(/force-dynamic|revalidate\s*=\s*0/);
  });
});

/**
 * The inventory. A fixed list of known routes would pass forever while somebody
 * adds a seventh teaching page; this enumerates what is on disk and forces a
 * decision about each one.
 */
describe("no authored teaching route can be added without a decision", () => {
  /** Routes deliberately outside the gate, each with the reason it is out. */
  const OPEN_BY_DESIGN: Record<string, string> = {
    "page.tsx": "the teacher dashboard: the school's own classes and history",
    "class/[classId]/page.tsx": "a class's own roster, history and evidence",
    "certification/certificate/page.tsx":
      "a completion certificate already earned, which is the reader's and not the vendor's",
  };

  function pages(dir: string, base = ""): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...pages(full, base ? `${base}/${entry}` : entry));
      else if (entry === "page.tsx") out.push(base ? `${base}/${entry}` : entry);
    }
    return out;
  }

  const root = join(process.cwd(), "src/app/teacher");
  const found = pages(root);

  it("finds every page under /teacher", () => {
    // A sanity check on the walker itself: were it ever to return nothing, the
    // whole inventory below would pass vacuously.
    expect(found.length).toBeGreaterThanOrEqual(9);
    expect(found).toContain("missions/page.tsx");
    expect(found).toContain("guides/[slug]/page.tsx");
  });

  it.each(found.map((p) => [p] as const))("%s is gated or explicitly exempt", (rel) => {
    const src = readFileSync(join(root, rel), "utf8");
    const gated = src.includes("requireOpenCurriculum(");
    const exempt = rel in OPEN_BY_DESIGN;
    expect(
      gated || exempt,
      `${rel} serves authored content without requireOpenCurriculum and is not listed in OPEN_BY_DESIGN`,
    ).toBe(true);
    // Never both: an exemption that is also gated means the list is stale.
    expect(gated && exempt).toBe(false);
  });

  it("every exemption still authenticates", () => {
    for (const rel of Object.keys(OPEN_BY_DESIGN)) {
      const src = readFileSync(join(root, rel), "utf8");
      expect(src, `${rel} is exempt from the curriculum gate and must still require staff`).toMatch(
        /require(Staff|Teacher|Admin)\(/,
      );
    }
  });

  it("the gate is checked before anything is rendered", () => {
    for (const rel of found.filter((p) => !(p in OPEN_BY_DESIGN))) {
      const src = readFileSync(join(root, rel), "utf8");
      const body = src.slice(src.indexOf("export default async function"));
      const gate = body.indexOf("requireOpenCurriculum(");
      // The first `return` in the component body, whatever it renders into.
      const returned = body.search(/\n  return[ (]/);
      expect(gate, `${rel} does not call the gate inside its component`).toBeGreaterThan(-1);
      expect(returned, `${rel} has no return statement to compare against`).toBeGreaterThan(-1);
      expect(gate, `${rel} renders before it checks entitlement`).toBeLessThan(returned);
    }
  });
});
