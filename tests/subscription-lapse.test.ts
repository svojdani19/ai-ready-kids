import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "@/lib/db";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_STUDENT } from "./helpers";
import {
  calendarDate,
  hasLapsed,
  LAPSED_STUDENT_MESSAGE,
  LAPSED_WRITE_REFUSAL,
  subscriptionState,
} from "@/lib/domain/subscription";
import {
  assertClassSubscriptionActive,
  assertSubscriptionActive,
  lapsedRefusal,
  schoolHasLapsed,
  SubscriptionLapsedError,
} from "@/lib/auth/subscription-gate";
import { getPrimarySchool } from "@/lib/repo/school";
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
  const school = { term_renews_on: "2026-09-01" };

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

  it("never lapses a school with no renewal date recorded", () => {
    // Refusing to teach because a field is empty would be the software
    // inventing a commercial fact.
    expect(hasLapsed({ term_renews_on: "" }, SEP_02)).toBe(false);
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
    chooseStudent: "resumes an existing session; recording is gated separately",
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
