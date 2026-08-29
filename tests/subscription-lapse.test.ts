import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_STUDENT } from "./helpers";
import {
  calendarDate,
  hasLapsed,
  hasVerifiableTerm,
  instructionClosed,
  isContractDate,
  LAPSED_STAFF_BODY,
  staffHandoff,
  subscriptionNotice,
  UNVERIFIED_STAFF_BODY,
  UNVERIFIED_WRITE_REFUSAL,
  LAPSED_STUDENT_MESSAGE,
  LAPSED_WRITE_REFUSAL,
  subscriptionState,
} from "@/lib/domain/subscription";
import {
  assertClassSubscriptionActive,
  assertSubscriptionActive,
  schoolInstructionClosed,
  TermNotConfiguredError,
  lapsedRefusal,
  schoolHasLapsed,
  SubscriptionLapsedError,
} from "@/lib/auth/subscription-gate";
import { getPrimarySchool } from "@/lib/repo/school";
import { purgeDateFor, retentionRows } from "@/lib/domain/retention";
import { runScheduledPurge } from "@/lib/domain/purge";
import { deleteClass, getClass, listClasses } from "@/lib/repo/classroom";

import { buildSchoolReport, reportToCsv } from "@/lib/repo/report";
import { getAttempt, listBenchmarksForStudent } from "@/lib/repo/progress";
import { listStudents } from "@/lib/repo/classroom";

/**
 * Sprint 49. The product sells an annual subscription and stores
 * `term_renews_on`, and until now that date changed nothing but labels — every
 * classroom and student write succeeded after it. The Program & plan page said
 * so out loud: it described a real deployment making classes read-only and then
 * admitted this build did not. A school could teach indefinitely on an expired
 * term, so the entitlement and the renewal promise were not real.
 */

const AUG_31 = new Date("2026-08-31T12:00:00.000Z");
const SEP_01 = new Date("2026-09-01T12:00:00.000Z");
const SEP_02 = new Date("2026-09-02T00:30:00.000Z");

describe("the subscription term has one meaning", () => {
  // Both dates now, because sprint 57 validates the pair: a term that renews
  // before it starts is not a term this product can read.
  const school = { term_starts_on: "2025-09-01", term_renews_on: "2026-09-01" };

  it("keeps the school active through the renewal date itself", () => {
    // The product's own wording is "renews on", and a school that has paid
    // through the first of September teaches on the first of September.
    expect(hasLapsed(school, AUG_31)).toBe(false);
    expect(hasLapsed(school, SEP_01)).toBe(false);
    expect(subscriptionState(school, SEP_01)).toEqual({
      kind: "active",
      renewsOn: "2026-09-01",
    });
  });

  it("lapses on the next calendar day", () => {
    expect(hasLapsed(school, SEP_02)).toBe(true);
    expect(subscriptionState(school, SEP_02)).toEqual({
      kind: "lapsed",
      renewedOn: "2026-09-01",
    });
  });

  it("compares calendar dates, not timestamps", () => {
    // Late on the renewal day and early the next: the only thing that moves the
    // answer is the date, so the rule cannot drift with a server's clock within
    // a day or with the time a request happens to arrive.
    expect(hasLapsed(school, new Date("2026-09-01T23:59:59.000Z"))).toBe(false);
    expect(hasLapsed(school, new Date("2026-09-02T00:00:00.000Z"))).toBe(true);
    expect(calendarDate(new Date("2026-09-01T23:59:59.000Z"))).toBe("2026-09-01");
  });

  it("treats a school with no renewal date as unverifiable, not active", () => {
    // Sprint 49 said an empty field cannot lapse a school, which is true — and
    // active is a commercial decision too. Sprint 57 makes it a third state.
    // Sprint 57 changed this answer deliberately; see the sprint 57 block below.
    expect(subscriptionState({ term_starts_on: "", term_renews_on: "" }, SEP_02)).toEqual({
      kind: "needs-configuration",
    });
  });
});

describe("a lapsed school is read-only for instruction and nothing else", () => {
  let db: Db;
  let cleanup: () => void;

  const lapse = () =>
    db.prepare("UPDATE schools SET term_renews_on = '2026-09-01' WHERE id = ?").run(DEMO_SCHOOL);
  const renew = () =>
    db.prepare("UPDATE schools SET term_renews_on = '2030-09-01' WHERE id = ?").run(DEMO_SCHOOL);

  /** Every row in every table, for proving a refusal wrote nothing at all. */
  const snapshot = () => {
    const tables = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all() as { name: string }[]
    ).map((t) => t.name);
    return tables
      .map((t) => `${t}:${JSON.stringify(db.prepare(`SELECT * FROM ${t}`).all())}`)
      .join("\n");
  };

  beforeAll(() => {
    ({ db, cleanup } = createTestDb());
  });
  afterAll(() => cleanup());

  it("refuses instructional writes once the term has ended", () => {
    lapse();
    expect(schoolHasLapsed(db, DEMO_SCHOOL, SEP_02)).toBe(true);
    expect(() => assertSubscriptionActive(db, DEMO_SCHOOL, SEP_02)).toThrow(
      SubscriptionLapsedError,
    );
    expect(() => assertClassSubscriptionActive(db, DEMO_CLASS, SEP_02)).toThrow(
      SubscriptionLapsedError,
    );
    expect(lapsedRefusal(db, DEMO_SCHOOL, SEP_02)).toBe(LAPSED_WRITE_REFUSAL);
  });

  it("allows everything on the boundary day, and again after renewal", () => {
    lapse();
    expect(() => assertSubscriptionActive(db, DEMO_SCHOOL, SEP_01)).not.toThrow();
    expect(lapsedRefusal(db, DEMO_SCHOOL, SEP_01)).toBeNull();
    renew();
    expect(() => assertSubscriptionActive(db, DEMO_SCHOOL, SEP_02)).not.toThrow();
    expect(lapsedRefusal(db, DEMO_SCHOOL, SEP_02)).toBeNull();
  });

  it("measures each school against its own term", () => {
    lapse();
    db.prepare(
      `INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent,
         plan, licensed_students, term_starts_on, term_renews_on, academic_year,
         year_starts_on, year_ends_on, contact_name, contact_email, retention_months, created_at)
       VALUES ('sch_paid','Paid Elementary','paid','Paid District','Paidville','OR','PE','denim',
         'school', 50, '2026-01-01','2030-01-01','2025-2026','2025-08-20','2026-06-19',
         'Head','head@paid.demo', 12, '2026-01-01T00:00:00.000Z')`,
    ).run();
    expect(schoolHasLapsed(db, DEMO_SCHOOL, SEP_02)).toBe(true);
    expect(schoolHasLapsed(db, "sch_paid", SEP_02)).toBe(false);
    renew();
  });

  it("writes absolutely nothing when a write is refused", () => {
    lapse();
    const before = snapshot();
    for (const attempt of [
      () => assertSubscriptionActive(db, DEMO_SCHOOL, SEP_02),
      () => assertClassSubscriptionActive(db, DEMO_CLASS, SEP_02),
    ]) {
      expect(attempt).toThrow(SubscriptionLapsedError);
    }
    // No audit row, no flag, no counter. A refusal is not an event about a
    // child and is not recorded as one.
    expect(snapshot()).toBe(before);
    renew();
  });

  it("keeps every existing record readable and intact", () => {
    lapse();
    // Nothing is deleted or reset: the school still owns all of it.
    expect(listStudents(db, DEMO_CLASS).length).toBeGreaterThan(0);
    expect(getAttempt(db, DEMO_STUDENT, "m-privacy-1")).toBeDefined();
    expect(listBenchmarksForStudent(db, DEMO_STUDENT).length).toBeGreaterThanOrEqual(0);
    expect(getPrimarySchool(db).id).toBe(DEMO_SCHOOL);
    renew();
  });

  it("tells a child nothing about money", () => {
    expect(LAPSED_STUDENT_MESSAGE).toBe("Your class isn't open right now. Ask your teacher.");
    for (const word of ["subscription", "renew", "invoice", "pay", "licence", "license", "$"]) {
      expect(LAPSED_STUDENT_MESSAGE.toLowerCase()).not.toContain(word);
    }
    // And staff are told the fact and the way out, without being told to panic.
    expect(LAPSED_WRITE_REFUSAL).toMatch(/records, reports and exports are still available/i);
    expect(LAPSED_WRITE_REFUSAL).toMatch(/request renewal/i);
  });
});

/**
 * The inventory. A new server action must be classified, or this fails.
 *
 * Hiding a control is not a rule and neither is remembering to add a check, so
 * the list of exported actions is compared against an explicit decision for
 * each one. Adding a mutation without deciding whether the subscription gates
 * it is the failure mode this exists to prevent.
 */
describe("every server action has a decision about the lapse gate", () => {
  const FILES = [
    "src/app/actions/admin.ts",
    "src/app/actions/teacher.ts",
    "src/app/actions/student.ts",
    "src/app/actions/auth.ts",
  ];

  /** Gated: classroom and instructional writes. */
  const GATED: Record<string, string> = {
    // Student instruction.
    beginMission: "starts or resumes a mission",
    submitDecision: "records mission progress",
    finishMission: "completes a mission",
    submitCheckInAnswer: "records a check-in answer",
    finishCheckIn: "completes a check-in",
    findClassByCode: "lets a new child into a class",
    chooseStudent:
      "writes a new student session from a join grant — it creates one, it does not resume one",
    // Teacher classroom mutations.
    createClassAction: "creates a class",
    addStudentAction: "roster change",
    renameStudentAction: "roster change",
    removeStudentAction: "roster change",
    rotateJoinCodeAction: "class code rotation",
    setAssignmentAction: "assignment change",
    // Administrator classroom lifecycle.
    rotateJoinCodeAsAdminAction: "class code rotation",
    archiveClassAction: "class lifecycle",
    restoreClassAction: "class lifecycle",
    reassignClassAction: "class lifecycle",
    setBenchmarkWindowAction: "opens or closes a child-facing check-in",
    rolloverYearAction: "starts a new teaching year",
  };

  /** Open: the school still owns its records and its account. */
  const ALLOWED: Record<string, string> = {
    updateSchoolAction: "school contact and profile maintenance",
    requestPlanChangeAction: "the renewal request itself — gating this would be absurd",
    setRetentionAction: "data governance; the school decides what is kept",
    setAcademicDatesAction: "records the year end that retention is calculated from",
    addTeacherAction: "staff and account administration",
    removeStaffAction: "staff offboarding must work after a term ends",
    deleteClassDataAction: "deliberate deletion; a school may want its records gone",
    answerCertificationAction: "orientation touches no classroom or child record",
    completeCertificationAction: "orientation touches no classroom or child record",
    enterDemo: "sign-in",
    signInWithEmail: "sign-in",
    signOut: "sign-out must always work",
  };

  const exported = FILES.flatMap((file) => {
    const src = readFileSync(join(process.cwd(), file), "utf8");
    return Array.from(src.matchAll(/export async function (\w+)/g)).map((m) => m[1]);
  });

  it("classifies every exported action, with none left over", () => {
    const decided = new Set([...Object.keys(GATED), ...Object.keys(ALLOWED)]);
    const undecided = exported.filter((name) => !decided.has(name));
    expect(undecided, "new server actions need a lapse-gate decision").toEqual([]);

    const stale = [...decided].filter((name) => !exported.includes(name));
    expect(stale, "classified actions that no longer exist").toEqual([]);
  });

  it("routes every gated action through the gate", () => {
    const sources = Object.fromEntries(
      FILES.map((f) => [f, readFileSync(join(process.cwd(), f), "utf8")]),
    );
    // The helpers that carry the check, so an action can satisfy this either
    // directly or through the shared resolver it already uses.
    const GUARDS = [
      "assertSubscriptionActive",
      "assertClassSubscriptionActive",
      "lapsedRefusal",
      "schoolHasLapsed",
      "requireOwnActiveClass",
      "ownActiveClass",
      "requireOpenCheckIn",
      "requirePlayableMission",
    ];

    for (const name of Object.keys(GATED)) {
      const file = FILES.find((f) => sources[f].includes(`export async function ${name}`))!;
      const src = sources[file];
      const start = src.indexOf(`export async function ${name}`);
      const end = src.indexOf("\nexport ", start + 10);
      const body = src.slice(start, end === -1 ? undefined : end);
      expect(
        GUARDS.some((guard) => body.includes(guard)),
        `${name} does not reach the subscription gate`,
      ).toBe(true);
    }
  });

  it("keeps the gate itself out of the allowed actions", () => {
    const sources = Object.fromEntries(
      FILES.map((f) => [f, readFileSync(join(process.cwd(), f), "utf8")]),
    );
    for (const name of ["requestPlanChangeAction", "signOut", "deleteClassDataAction"]) {
      const file = FILES.find((f) => sources[f].includes(`export async function ${name}`))!;
      const src = sources[file];
      const start = src.indexOf(`export async function ${name}`);
      const end = src.indexOf("\nexport ", start + 10);
      const body = src.slice(start, end === -1 ? undefined : end);
      expect(body).not.toContain("assertSubscriptionActive");
      expect(body).not.toContain("lapsedRefusal");
      expect(body).not.toContain("ownActiveClass");
    }
  });
});


/**
 * Sprint 50. Sprint 49 gated `findClassByCode` and classified `chooseStudent`
 * as "resumes an existing session". It does not: it *creates* one, from a join
 * grant that lasts ten minutes. So a child who typed a correct code minutes
 * before the term ended still held a valid grant, `/join/[classId]` still
 * rendered the whole roster by name, and `chooseStudent` cleared the grant and
 * wrote a fresh student session without asking about the term again.
 *
 * Checking the first step of a two-step flow is checking half of it — and the
 * inventory that was supposed to catch exactly this was satisfied by a
 * classification I had written down wrongly.
 */
describe("a join grant issued before the lapse cannot finish afterwards", () => {
  const SRC = {
    auth: readFileSync(join(process.cwd(), "src/app/actions/auth.ts"), "utf8"),
    roster: readFileSync(join(process.cwd(), "src/app/join/[classId]/page.tsx"), "utf8"),
    joinPage: readFileSync(join(process.cwd(), "src/app/join/page.tsx"), "utf8"),
  };

  const bodyOf = (src: string, name: string) => {
    const start = src.indexOf(`export async function ${name}`);
    expect(start, name).toBeGreaterThan(-1);
    const end = src.indexOf("\nexport ", start + 10);
    return src.slice(start, end === -1 ? undefined : end);
  };

  it("rechecks the term in chooseStudent, after the grant and before any write", () => {
    const body = bodyOf(SRC.auth, "chooseStudent");
    expect(body).toContain("schoolHasLapsed(db, classroom.school_id)");

    // Order matters twice over. The check must come after the grant, class and
    // code have been validated — so it cannot leak that a class exists — and
    // before the session is written.
    const codeCheck = body.indexOf("normaliseJoinCode(classroom.join_code) !== grant.code");
    const lapseCheck = body.indexOf("schoolHasLapsed");
    const sessionWrite = body.indexOf("writeSession(");
    expect(codeCheck).toBeGreaterThan(-1);
    expect(lapseCheck).toBeGreaterThan(codeCheck);
    expect(sessionWrite).toBeGreaterThan(lapseCheck);
  });

  it("writes nothing and drops the grant when it refuses", () => {
    const body = bodyOf(SRC.auth, "chooseStudent");
    const refusal = body.slice(body.indexOf("schoolHasLapsed"), body.indexOf("writeSession("));
    // The grant goes, so a refused child is not left holding a credential that
    // would let them retry the same stale page.
    expect(refusal).toContain("clearJoinGrant()");
    // And no session, no audit, no note that a child tried.
    expect(refusal).not.toContain("writeSession");
    expect(refusal).not.toContain("recordAudit");
    expect(body).not.toContain("recordFailure");
  });

  /**
   * Sprint 51. The sprint-50 lapsed branch called `clearJoinGrant()` from the
   * Server Component, and Next 16 refuses a cookie write outside a Server
   * Action or Route Handler — so a child who merely *refreshed* the roster
   * after their school lapsed got a 500 instead of the sentence meant for them.
   *
   * The action path was fine, which is exactly why the browser check missed it:
   * pressing a name runs in a Server Action, where the write is allowed. Only
   * the plain GET was broken, and only the plain GET was never walked.
   */
  it("never writes a cookie from the roster Server Component", () => {
    // A page component is not a mutation context. This is the property, not
    // the symptom: any cookie write here fails at runtime, whatever it is for.
    expect(SRC.roster).not.toMatch(/clearJoinGrant\s*\(/);
    expect(SRC.roster).not.toMatch(/cookies\s*\(\)/);
    expect(SRC.roster).not.toMatch(/\.(set|delete)\s*\(\s*["'`]?airk/i);
  });

  it("clears the grant through a Route Handler instead", () => {
    const handler = readFileSync(join(process.cwd(), "src/app/join/closed/route.ts"), "utf8");
    // A Route Handler is a supported mutation context; a page is not.
    expect(handler).toMatch(/export async function (GET|POST)/);
    expect(handler).toContain("clearJoinGrant()");
    expect(handler).toContain("/join?closed=1");
    // And the page hands off to it rather than doing the write itself.
    expect(SRC.roster).toContain('redirect("/join/closed")');
  });

  it("keeps the action path clearing its own grant, where that is allowed", () => {
    // chooseStudent is a Server Action, so it may write cookies and should
    // still drop the grant itself rather than bouncing through the handler.
    const body = bodyOf(SRC.auth, "chooseStudent");
    expect(body).toContain("clearJoinGrant()");
    expect(SRC.auth).toContain('"use server"');
  });

  it("does not list a single name on a stale granted roster page", () => {
    // The lapse check has to come before the roster is read, not merely before
    // it is rendered: a closed class should not be handing out a class list.
    const lapseCheck = SRC.roster.indexOf("schoolHasLapsed(db, classroom.school_id)");
    const listNames = SRC.roster.indexOf("listStudents(db, classId)");
    expect(lapseCheck).toBeGreaterThan(-1);
    expect(listNames).toBeGreaterThan(-1);
    expect(lapseCheck).toBeLessThan(listNames);
    // And the grant is dropped on the way out — by the Route Handler this
    // redirects to, since a Server Component may not write cookies.
    expect(SRC.roster).toContain('redirect("/join/closed")');
  });

  it("sends the child to their own words, with no billing anywhere near it", () => {
    expect(SRC.auth).toContain('redirect("/join?closed=1")');
    expect(SRC.roster).toContain('redirect("/join/closed")');
    expect(SRC.joinPage).toContain("LAPSED_STUDENT_MESSAGE");
    // Comments and imports are not copy — sprint 44's lesson, which this
    // assertion tripped over on its first draft: the module path
    // `domain/subscription` and a note about renewal are not shown to a child.
    const copy = SRC.joinPage
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1")
      .replace(/^import[^\n]*$/gm, "");
    for (const word of ["subscription", "renew", "invoice", "licence", "$"]) {
      expect(copy.toLowerCase()).not.toContain(word);
    }
  });

  it("classifies chooseStudent as gated, for what it actually does", () => {
    // The mis-classification was the defect. Naming it here so the description
    // has to stay true to the behaviour rather than to a first impression.
    const inventory = readFileSync(join(process.cwd(), "tests/subscription-lapse.test.ts"), "utf8");
    const allowedBlock = inventory.slice(
      inventory.indexOf("const ALLOWED"),
      inventory.indexOf("};", inventory.indexOf("const ALLOWED")),
    );
    expect(allowedBlock).not.toContain("chooseStudent");
    const gatedBlock = inventory.slice(
      inventory.indexOf("const GATED"),
      inventory.indexOf("};", inventory.indexOf("const GATED")),
    );
    expect(gatedBlock).toContain("chooseStudent");
  });
});

/**
 * Sprint 50, second half. `restoreClassAction` resolved the class with
 * `ownActiveClass` *before* its try block, so a lapsed subscription escaped as
 * an unhandled throw and an error page — while archive and rotate, wrapped
 * whole, returned the sentence. A guard that turns one refusal into a crash is
 * not a guard the caller can use.
 */
describe("a lapsed restore refuses in the same words as the others", () => {
  const admin = readFileSync(join(process.cwd(), "src/app/actions/admin.ts"), "utf8");
  const bodyOf = (name: string) => {
    const start = admin.indexOf(`export async function ${name}`);
    const end = admin.indexOf("\nexport ", start + 10);
    return admin.slice(start, end === -1 ? undefined : end);
  };

  it("resolves the class inside the try, not before it", () => {
    const body = bodyOf("restoreClassAction");
    const tryAt = body.indexOf("try {");
    const resolve = body.indexOf("await ownActiveClass(classId)");
    expect(tryAt).toBeGreaterThan(-1);
    expect(resolve).toBeGreaterThan(tryAt);
    expect(body).toContain("asExpectedError(error)");
  });

  it("still handles the licence refusal it already had", () => {
    const body = bodyOf("restoreClassAction");
    expect(body).toContain("RestoreExceedsLicenceError");
    expect(body).toContain('action: "class.restore_blocked_by_licence"');
    // The success audit is still only on the success path.
    expect(body).toContain('action: "class.restored"');
  });

  it("fails the same way as archive and rotate", () => {
    for (const name of ["archiveClassAction", "rotateJoinCodeAsAdminAction", "restoreClassAction"]) {
      const body = bodyOf(name);
      const tryAt = body.indexOf("try {");
      const resolve = body.search(/await own(Active)?Class\(classId\)/);
      expect(tryAt, name).toBeGreaterThan(-1);
      expect(resolve, name).toBeGreaterThan(tryAt);
      expect(body, name).toContain("asExpectedError(error)");
    }
  });
});


/**
 * Sprint 57. `term_starts_on` and `term_renews_on` are unconstrained text, and
 * `subscriptionState` compared the renewal string lexicographically without
 * ever asking whether it was a date.
 *
 * So `"soon"` sorts after every real `YYYY-MM-DD` and kept a school **active
 * indefinitely**. `"2026-13-45"` and `"2026-02-30"` were ordinary deadlines. A
 * timestamp or a padded string compared as text. Program rendered `Invalid
 * Date` and `in NaN days`, Overview dropped the renewal warning, and the annual
 * JSON exported the raw values to a district office.
 *
 * Sprint 49's rule was that an empty field cannot lapse a school, because
 * refusing to teach over a blank would invent a commercial fact. That is true
 * and it was half an answer: **active is a commercial decision too.**
 */
describe("a term that cannot be read is neither active nor lapsed", () => {
  const MALFORMED = [
    "",
    " ",
    "soon",
    "2026-13-45",
    "2026-02-30",
    "2026-9-1",
    " 2026-09-01",
    "2026-09-01 ",
    "2026-09-01T00:00:00.000Z",
    "26-09-01",
    "2026/09/01",
  ];
  const NON_STRINGS = [null, undefined, 20260901, {}, []];

  it("accepts only an exact, real calendar date", () => {
    for (const value of ["2026-09-01", "2025-01-31", "2024-02-29", "2000-02-29"]) {
      expect(isContractDate(value), value).toBe(true);
    }
    // A real leap day survives; a fake one does not, because 2026-02-30 parses
    // to March 2nd and does not stringify back to what was written.
    expect(isContractDate("2026-02-29")).toBe(false);
    expect(isContractDate("2023-02-29")).toBe(false);
    for (const value of MALFORMED) expect(isContractDate(value), JSON.stringify(value)).toBe(false);
    for (const value of NON_STRINGS) {
      expect(isContractDate(value), JSON.stringify(value)).toBe(false);
    }
  });

  it("does not coerce a nearly-right value into a right one", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/domain/subscription.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1");
    expect(src).not.toMatch(/\.trim\(\)/);
    expect(src).not.toMatch(/Date\.parse/);
  });

  it("refuses a term that renews before it starts", () => {
    expect(hasVerifiableTerm({ term_starts_on: "2026-09-01", term_renews_on: "2025-09-01" })).toBe(
      false,
    );
    // Equal is fine: a one-day term is odd, not unreadable.
    expect(hasVerifiableTerm({ term_starts_on: "2026-09-01", term_renews_on: "2026-09-01" })).toBe(
      true,
    );
  });

  it("reports needs-configuration, and never calls it ended or overdue", () => {
    for (const value of MALFORMED) {
      const school = { term_starts_on: "2025-09-01", term_renews_on: value };
      expect(subscriptionState(school, SEP_02), value).toEqual({ kind: "needs-configuration" });
      // Emphatically not lapsed: nothing expired.
      expect(hasLapsed(school, SEP_02), value).toBe(false);
      expect(instructionClosed(school, SEP_02), value).toBe("needs-configuration");
    }
    // A malformed *start* date is just as unreadable as a malformed renewal.
    expect(
      subscriptionState({ term_starts_on: "soon", term_renews_on: "2030-09-01" }, SEP_02),
    ).toEqual({ kind: "needs-configuration" });
    // And the staff copy says so without claiming an expiry.
    expect(UNVERIFIED_STAFF_BODY).toMatch(/not an expiry/i);
    expect(UNVERIFIED_WRITE_REFUSAL).toMatch(/nothing has ended/i);
    expect(UNVERIFIED_WRITE_REFUSAL).not.toMatch(/subscription has ended|lapsed|overdue/i);
  });

  it("leaves valid active and lapsed behaviour exactly as it was", () => {
    const school = { term_starts_on: "2025-09-01", term_renews_on: "2026-09-01" };
    expect(subscriptionState(school, SEP_01)).toEqual({ kind: "active", renewsOn: "2026-09-01" });
    expect(subscriptionState(school, SEP_02)).toEqual({ kind: "lapsed", renewedOn: "2026-09-01" });
    // The UTC boundary is untouched.
    expect(hasLapsed(school, new Date("2026-09-01T23:59:59.000Z"))).toBe(false);
    expect(hasLapsed(school, new Date("2026-09-02T00:00:00.000Z"))).toBe(true);
  });
});

describe("an unverifiable term closes new classroom work and writes nothing", () => {
  let dbT: Db;
  let cleanupT: () => void;

  const setTerm = (starts: string, renews: string) =>
    dbT
      .prepare("UPDATE schools SET term_starts_on = ?, term_renews_on = ? WHERE id = ?")
      .run(starts, renews, DEMO_SCHOOL);

  const snapshot = () => {
    const tables = (
      dbT
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all() as { name: string }[]
    ).map((t) => t.name);
    return tables
      .map((t) => `${t}:${JSON.stringify(dbT.prepare(`SELECT * FROM ${t}`).all())}`)
      .join("\n");
  };

  beforeAll(() => {
    ({ db: dbT, cleanup: cleanupT } = createTestDb());
  });
  afterAll(() => cleanupT());

  it("throws a configuration error, distinct from the lapse one", () => {
    setTerm("2025-09-01", "soon");
    expect(schoolInstructionClosed(dbT, DEMO_SCHOOL, SEP_02)).toBe("needs-configuration");
    expect(() => assertSubscriptionActive(dbT, DEMO_SCHOOL, SEP_02)).toThrow(
      TermNotConfiguredError,
    );
    expect(() => assertSubscriptionActive(dbT, DEMO_SCHOOL, SEP_02)).not.toThrow(
      SubscriptionLapsedError,
    );
    expect(() => assertClassSubscriptionActive(dbT, DEMO_CLASS, SEP_02)).toThrow(
      TermNotConfiguredError,
    );
    expect(lapsedRefusal(dbT, DEMO_SCHOOL, SEP_02)).toBe(UNVERIFIED_WRITE_REFUSAL);
    setTerm("2025-09-01", "2030-09-01");
  });

  it("writes absolutely nothing when it refuses", () => {
    setTerm("2025-09-01", "2026-13-45");
    const before = snapshot();
    expect(() => assertSubscriptionActive(dbT, DEMO_SCHOOL, SEP_02)).toThrow(
      TermNotConfiguredError,
    );
    expect(() => assertClassSubscriptionActive(dbT, DEMO_CLASS, SEP_02)).toThrow(
      TermNotConfiguredError,
    );
    // No audit row, no flag, no record that anybody tried.
    expect(snapshot()).toBe(before);
    setTerm("2025-09-01", "2030-09-01");
  });

  it("recovers the moment the vendor restores real dates", () => {
    setTerm("2025-09-01", "2026-02-30");
    expect(schoolInstructionClosed(dbT, DEMO_SCHOOL, SEP_02)).toBe("needs-configuration");
    setTerm("2025-09-01", "2030-09-01");
    expect(schoolInstructionClosed(dbT, DEMO_SCHOOL, SEP_02)).toBeNull();
    expect(() => assertSubscriptionActive(dbT, DEMO_SCHOOL, SEP_02)).not.toThrow();
    // And a genuinely lapsed term still lapses.
    setTerm("2025-09-01", "2026-09-01");
    expect(schoolInstructionClosed(dbT, DEMO_SCHOOL, SEP_02)).toBe("lapsed");
    setTerm("2025-08-18", "2026-09-01");
  });

  it("tells a child nothing but the class-not-open sentence", () => {
    // Both reasons close the same doors for a seven-year-old, and the child
    // surfaces ask one question rather than two.
    const gate = readFileSync(join(process.cwd(), "src/lib/auth/subscription-gate.ts"), "utf8");
    expect(gate).toMatch(/schoolHasLapsed[\s\S]{0,400}schoolInstructionClosed\(db, schoolId, now\) !== null/);
    for (const file of [
      "src/app/actions/auth.ts",
      "src/app/join/[classId]/page.tsx",
      "src/app/student/layout.tsx",
      "src/app/student/page.tsx",
    ]) {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      expect(src, file).toContain("schoolHasLapsed");
      // No configuration or billing detail anywhere a child can read.
      expect(src, file).not.toContain("UNVERIFIED_STAFF_BODY");
      expect(src, file).not.toContain("UNVERIFIED_WRITE_REFUSAL");
      expect(src, file).not.toMatch(/needs-configuration/);
    }
  });

  it("keeps every gate consumer on the shared rule", () => {
    const gate = readFileSync(join(process.cwd(), "src/lib/auth/subscription-gate.ts"), "utf8");
    // One place decides; the three entry points all read from it.
    expect(gate).toContain("TermNotConfiguredError");
    expect(gate).toMatch(/assertSubscriptionActive[\s\S]{0,300}needs-configuration/);
    expect(gate).toMatch(/lapsedRefusal[\s\S]{0,300}UNVERIFIED_WRITE_REFUSAL/);
    // The expected-error converter handles both, so no gated action can turn a
    // configuration refusal into an error page.
    expect(gate).toMatch(/asExpectedError[\s\S]{0,300}TermNotConfiguredError/);
  });

  it("keeps the buyer pages free of raw dates, Invalid Date and NaN", () => {
    const program = readFileSync(join(process.cwd(), "src/app/admin/program/page.tsx"), "utf8");
    const overview = readFileSync(join(process.cwd(), "src/app/admin/page.tsx"), "utf8");

    for (const [src, page] of [[program, "program"], [overview, "overview"]] as const) {
      expect(src, page).toContain("subscriptionState");
      expect(src, page).toMatch(/needs-configuration/);
    }
    // The day count is never computed from an unreadable date.
    expect(program).toMatch(/needs-configuration"\s*\n?\s*\?\s*null/);
    expect(overview).toMatch(/needs-configuration" \? null : daysBetween/);
    expect(program).toMatch(/Subscription dates|Need configuration/);
    // The literal moved into the shared constant in sprint 65.
    expect(overview).toMatch(/UNVERIFIED_STAFF_TITLE/);
    // Sprint 65 moved this text into the shared constant so the overview and
    // the shell cannot drift apart, so the property is asserted where it lives.
    expect(overview).toMatch(/UNVERIFIED_STAFF_BODY/);
    expect(UNVERIFIED_STAFF_BODY).toMatch(/classroom changes are paused/i);
  });

  it("exports no account dates at all", () => {
    const { db, cleanup } = createTestDb();
    try {
      db.prepare(
        "UPDATE schools SET term_starts_on = 'soon', term_renews_on = '2026-13-45' WHERE id = ?",
      ).run(DEMO_SCHOOL);
      const report = buildSchoolReport(db, DEMO_SCHOOL, SEP_02);
      const account = JSON.stringify(report.school);

      // Removed entirely: the printed report has no consumer for them, and
      // they are account metadata rather than curriculum outcomes.
      expect(Object.hasOwn(report.school, "termStartsOn")).toBe(false);
      expect(Object.hasOwn(report.school, "termRenewsOn")).toBe(false);
      expect(account).not.toContain("soon");
      expect(account).not.toContain("2026-13-45");
      expect(JSON.stringify(report)).not.toMatch(/termStartsOn|termRenewsOn/);
      // CSV unchanged and still clean.
      expect(reportToCsv(report)).not.toMatch(/soon|2026-13-45|termRenewsOn/);
    } finally {
      cleanup();
    }
  });

  it("leaves the quote request usable and does not rewrite the dates", () => {
    const admin = readFileSync(join(process.cwd(), "src/app/actions/admin.ts"), "utf8");
    const start = admin.indexOf("export async function requestPlanChangeAction");
    const body = admin.slice(start, admin.indexOf("\nexport ", start + 10));
    expect(body).not.toMatch(/term_starts_on|term_renews_on/);
    expect(body).not.toContain("assertSubscriptionActive");
    expect(body).not.toContain("lapsedRefusal");
  });
});


/**
 * Sprint 59. `StaffShell` is shared by administrators and teachers, and the
 * needs-configuration notice rendered one recovery link for both: "Request
 * renewal on the Program and plan page", pointing at `/admin/program`.
 *
 * Two contradictions in the same paragraph. The notice said "This is not an
 * expiry" and then told staff to request renewal — a sales action for what is a
 * broken account record. And a **teacher cannot open that link**: `requireAdmin`
 * bounces them back to `/teacher`, so the only route offered was a dead end for
 * most of the people who would ever read it.
 */
describe("the closed-for-work notice routes the reader somewhere they can go", () => {
  const REASONS = ["needs-configuration", "lapsed"] as const;
  const ROLES = ["admin", "teacher"] as const;

  it("never mentions renewal, ending or overdue when the term is unreadable", () => {
    for (const role of ROLES) {
      const notice = subscriptionNotice("needs-configuration", role);
      const all = `${notice.title} ${notice.body} ${notice.link?.label ?? ""}`.toLowerCase();
      // The contradiction: "this is not an expiry" followed by "request renewal".
      expect(all, role).not.toMatch(/request renewal|renew/);
      // Denials are stripped first. "Nothing has ended" is the point, not a
      // violation of it — the test forbids *asserting* an ending, not the word.
      const claims = all
        .replace(/this is not an expiry/g, "")
        .replace(/nothing has ended/g, "");
      expect(claims, role).not.toMatch(/expired|has ended|overdue|lapsed/);
      // And the denial really is present.
      expect(notice.body).toMatch(/not an expiry/i);
      expect(notice.body).toMatch(/nothing has ended/i);
    }
  });

  it("gives a teacher a person rather than a page they cannot open", () => {
    for (const reason of REASONS) {
      const notice = subscriptionNotice(reason, "teacher");
      // requireAdmin would bounce them straight back to /teacher.
      expect(notice.link, reason).toBeUndefined();
      const handoff = staffHandoff(reason);
      expect(handoff, reason).toMatch(/school administrator/i);
      expect(handoff, reason).not.toMatch(/\/admin/);
    }
    // And the two handoffs say different things, because the two problems are.
    expect(staffHandoff("needs-configuration")).toMatch(/correct the subscription dates/i);
    expect(staffHandoff("lapsed")).toMatch(/request renewal/i);
  });

  it("keeps the renewal route for an administrator on a genuinely lapsed term", () => {
    const notice = subscriptionNotice("lapsed", "admin");
    expect(notice.link).toEqual({
      href: "/admin/program",
      label: "Request renewal on the Program and plan page",
    });
  });

  it("labels the administrator's configuration link honestly", () => {
    const notice = subscriptionNotice("needs-configuration", "admin");
    expect(notice.link?.href).toBe("/admin/program");
    // Offered because it is the only surface they have, not because it fixes
    // anything: the page shows account details, it does not correct them.
    expect(notice.link?.label).toMatch(/see your account details/i);
    expect(notice.link?.label).not.toMatch(/request|renew|fix|correct/i);
  });

  it("invents no support address and promises no self-service correction", () => {
    for (const reason of REASONS) {
      for (const role of ROLES) {
        const notice = subscriptionNotice(reason, role);
        const all = `${notice.title} ${notice.body} ${notice.link?.label ?? ""} ${staffHandoff(reason)}`;
        expect(all, `${reason}/${role}`).not.toMatch(/@|https?:|support\.|\bcall\b|hotline/i);
      }
    }
    // The quote form is never described as the thing that corrects dates.
    expect(subscriptionNotice("needs-configuration", "admin").body).toMatch(
      /account contact to correct the subscription dates/i,
    );
  });

  it("wires the shell to the decision rather than to a fixed link", () => {
    const shell = readFileSync(
      join(process.cwd(), "src/components/staff/StaffShell.tsx"),
      "utf8",
    );
    expect(shell).toContain("subscriptionNotice(closed, role)");
    expect(shell).toContain("staffHandoff(closed)");
    // No hard-coded admin route or renewal sentence left in the component.
    expect(shell).not.toMatch(/href="\/admin\/program"/);
    expect(shell).not.toMatch(/Request renewal on the Program and plan page/);
    // The role comes from the user the shell was given, not assumed.
    expect(shell).toMatch(/user\.role === "admin"/);
  });
});


/**
 * Sprint 65. Every subscription notice said "nothing has been deleted", and the
 * lapsed one added that everything the school already has "stays here and stays
 * readable".
 *
 * Audited against `subscription-gate.ts` and the purge, none of that holds. The
 * term gate covers instructional and classroom writes **only** — sprint 49
 * deliberately left retention outside it, because holding a school's own
 * records hostage to an invoice would be the wrong product. So
 * `runScheduledPurge` has no subscription check at all, `deleteClassDataAction`
 * is on the allowed list, and a due cohort may already have been purged before
 * the notice was read, or be deleted while it is on screen.
 */
describe("a paused term does not pause retention, and the copy says so", () => {
  const LAPSED = new Date("2026-09-02T00:30:00.000Z");

  const school = (over: Record<string, string>) => {
    const { db, cleanup } = createTestDb();
    const sets = Object.entries(over)
      .map(([k]) => `${k} = ?`)
      .join(", ");
    db.prepare(`UPDATE schools SET ${sets} WHERE id = ?`).run(
      ...Object.values(over),
      DEMO_SCHOOL,
    );
    return { db, cleanup };
  };

  const overdueEverything = (db: Db) => {
    db.prepare("UPDATE schools SET retention_months = 3 WHERE id = ?").run(DEMO_SCHOOL);
    db.prepare("UPDATE classes SET year_ends_on = '2020-06-19' WHERE school_id = ?").run(
      DEMO_SCHOOL,
    );
  };

  it.each([
    ["lapsed", { term_starts_on: "2025-09-01", term_renews_on: "2026-09-01" }],
    ["needs-configuration", { term_starts_on: "2025-09-01", term_renews_on: "soon" }],
  ] as const)("still purges due cohorts while %s", (_state, dates) => {
    const { db, cleanup } = school(dates as unknown as Record<string, string>);
    try {
      overdueEverything(db);
      // The gate is closed for instruction...
      expect(schoolInstructionClosed(db, DEMO_SCHOOL, LAPSED)).not.toBeNull();
      expect(() => assertSubscriptionActive(db, DEMO_SCHOOL, LAPSED)).toThrow();

      // ...and the purge deletes anyway, which is the behaviour sprint 49 chose
      // and the copy was contradicting.
      const before = (db.prepare("SELECT COUNT(*) AS n FROM classes").get() as { n: number }).n;
      const result = runScheduledPurge(db, LAPSED);
      expect(result.classesDeleted).toBeGreaterThan(0);
      expect((db.prepare("SELECT COUNT(*) AS n FROM classes").get() as { n: number }).n).toBeLessThan(before);
      expect(result.blocked).toEqual([]);
    } finally {
      cleanup();
    }
  });

  it.each([
    ["lapsed", { term_starts_on: "2025-09-01", term_renews_on: "2026-09-01" }],
    ["needs-configuration", { term_starts_on: "2025-09-01", term_renews_on: "soon" }],
  ] as const)("leaves retention dates and admin deletion working while %s", (_state, dates) => {
    const { db, cleanup } = school(dates as unknown as Record<string, string>);
    try {
      // Retention still calculates: nothing about the term reaches it.
      const current = getPrimarySchool(db);
      expect(purgeDateFor(current)).toBeInstanceOf(Date);
      const rows = retentionRows(
        current,
        listClasses(db, DEMO_SCHOOL, true).map((c) => ({ ...c, studentCount: 0 })),
        LAPSED,
      );
      expect(rows.every((r) => r.purgeOn instanceof Date)).toBe(true);

      // And the administrator's own deletion control still works, because a
      // school owns its records whatever the invoice says.
      const target = listClasses(db, DEMO_SCHOOL, true)[0];
      expect(() => deleteClass(db, target.id)).not.toThrow();
      expect(getClass(db, target.id)).toBeUndefined();

      // Meanwhile the gate every instructional write goes through refuses.
      // (The check is on the shared resolvers, not on the repository call —
      // `createStudent` enforces seats and rooms, not the term.)
      expect(() => assertClassSubscriptionActive(db, DEMO_CLASS, LAPSED)).toThrow();
    } finally {
      cleanup();
    }
  });

  it("promises nothing about what has been deleted or what remains", () => {
    const copy = [
      LAPSED_STAFF_BODY,
      UNVERIFIED_STAFF_BODY,
      subscriptionNotice("lapsed", "admin").body,
      subscriptionNotice("needs-configuration", "admin").body,
    ].join(" ");

    // The historical claim, and the unconditional one about what survives.
    expect(copy).not.toMatch(/nothing has been deleted/i);
    expect(copy).not.toMatch(/nothing is deleted and nothing is hidden/i);
    expect(copy).not.toMatch(/stays here and stays readable/i);
    expect(copy).not.toMatch(/everything the school already has/i);

    // What it says instead: causal, and about the schedule continuing.
    expect(copy).toMatch(/does not itself delete or hide anything/i);
    expect(copy).toMatch(/still inside the school's retention window/i);
    expect(copy).toMatch(/retention schedule the school configured/i);
    expect(copy).toMatch(/deletion controls carry on/i);

    // The real distinction between the two states survives.
    expect(UNVERIFIED_STAFF_BODY).toMatch(/not an expiry/i);
    expect(LAPSED_STAFF_BODY).not.toMatch(/not an expiry/i);
  });

  it("keeps 'nothing has been changed' only where it is transactionally true", () => {
    // A refusal is about the attempt the gate just rejected, before any write.
    expect(LAPSED_WRITE_REFUSAL).toMatch(/nothing has been changed/i);
    expect(UNVERIFIED_WRITE_REFUSAL).toMatch(/nothing has been changed/i);
    // The standing notices make no such claim about the school.
    expect(LAPSED_STAFF_BODY).not.toMatch(/nothing has been changed/i);
    expect(UNVERIFIED_STAFF_BODY).not.toMatch(/nothing has been changed/i);
  });

  it("uses the shared copy rather than a second version of it", () => {
    const overview = readFileSync(join(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    expect(overview).toContain("UNVERIFIED_STAFF_BODY");
    expect(overview).not.toMatch(/nothing has been deleted/i);

    const program = readFileSync(join(process.cwd(), "src/app/admin/program/page.tsx"), "utf8");
    expect(program).not.toMatch(/Nothing is deleted and nothing is hidden/i);
    // And it states the thing the old paragraph got wrong.
    expect(program).toMatch(/does not itself delete or hide anything/i);
    expect(program).toMatch(/schedule you configured carries on/i);
  });

  it("claims no deletion timeline this build does not run", () => {
    // Comments and imports are not copy (sprint 44), and this assertion needs
    // the stripping because the source explains the very phrase it forbids.
    const program = readFileSync(join(process.cwd(), "src/app/admin/program/page.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1")
      .replace(/^import[^\n]*$/gm, "")
      // JSX wraps mid-sentence, so a phrase check has to see one line.
      .replace(/\s+/g, " ");

    // Nothing in this build runs the purge on a timer: `npm run purge` is
    // scheduled by a deployment, so "on time" is a promise about somebody
    // else's cron that the product cannot keep. The Data page has always said
    // so; this note had started saying the opposite.
    expect(program).not.toMatch(/deleted on time/i);
    expect(program).not.toMatch(/deleted (?:automatically )?on schedule/i);

    // Due date and deletion event are different facts, and the copy separates
    // them: the class *stays due*, and the *job* is what deletes it.
    expect(program).toMatch(/stays due/i);
    expect(program).toMatch(/next time your deployment runs the purge job/i);
    expect(program).toMatch(/due is not yet deleted/i);

    // And the term state is neither an accelerator nor a brake on that.
    expect(program).toMatch(/neither brings that forward nor holds it back/i);

    // The shared notices never took on a timeline claim of their own.
    // Word boundaries, not substrings: unanchored `on schedule` matches inside
    // "retenti-on schedule", which is the phrase these notices are supposed to
    // contain.
    for (const body of [LAPSED_STAFF_BODY, UNVERIFIED_STAFF_BODY]) {
      expect(body).not.toMatch(/\bon time\b|\bon schedule\b|\bimmediately\b|\bwithin \d/i);
    }
  });

  it("says nothing to a child about any of it", () => {
    for (const word of ["subscription", "renew", "retention", "deleted", "configuration"]) {
      expect(LAPSED_STUDENT_MESSAGE.toLowerCase()).not.toContain(word);
    }
    expect(LAPSED_STUDENT_MESSAGE).toBe("Your class isn't open right now. Ask your teacher.");
  });
});
