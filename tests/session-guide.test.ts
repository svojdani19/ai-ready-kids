import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createTestDb, DEMO_CLASS, DEMO_SCHOOL, DEMO_STUDENT, DEMO_TEACHER, playToEnd } from "./helpers";
import {
  NOT_THIS,
  ROOM_SETUPS,
  SESSION_SHAPES,
  WHAT_IS_RECORDED,
  WHEN_THINGS_HAPPEN,
} from "@/content/session-guide";
import { ALL_SESSIONS, FOUNDATIONS, MISSIONS } from "@/content/missions";
import { assignMission } from "@/lib/repo/classroom";
import { buildSchoolReport } from "@/lib/repo/report";

const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("the session guide describes the sessions that exist", () => {
  it("covers both shapes, and only the two the product has", () => {
    expect(SESSION_SHAPES.map((s) => s.id).sort()).toEqual(["core-mission", "first-look"]);
    const segments = [...new Set(ALL_SESSIONS.map((m) => m.segment))].sort();
    expect(segments).toEqual(["core", "foundation"]);
  });

  it("states counts and grade bands that match the content", () => {
    const firstLook = SESSION_SHAPES.find((s) => s.id === "first-look")!;
    const core = SESSION_SHAPES.find((s) => s.id === "core-mission")!;

    // "six First Look sessions", in two tiers.
    expect(FOUNDATIONS).toHaveLength(6);
    expect(firstLook.applies).toMatch(/\bsix\b/i);
    const tiers = [...new Set(FOUNDATIONS.map((m) => m.gradeBand))].sort();
    expect(tiers).toEqual(["1-2", "3-5"]);
    expect(firstLook.applies).toMatch(/1–2/);
    expect(firstLook.applies).toMatch(/3–5/);

    // "All 27 core missions, grades 2–4 … 7 to 9 minutes".
    expect(MISSIONS).toHaveLength(27);
    expect(core.applies).toMatch(/\b27\b/);
    expect([...new Set(MISSIONS.map((m) => m.gradeBand))]).toEqual(["2-4"]);
    expect(core.applies).toMatch(/2–4/);
    const mins = MISSIONS.map((m) => m.estimatedMinutes);
    expect(Math.min(...mins)).toBe(7);
    expect(Math.max(...mins)).toBe(9);
    expect(core.applies).toMatch(/7 to 9 minutes/);
  });

  it("matches the debrief length the printed guide header has always claimed", () => {
    // The guide header says "N minutes independent, 15 minutes debrief". The
    // run sheet must not contradict the line printed directly above it.
    const guide = src("src/app/teacher/guides/[slug]/page.tsx");
    expect(guide).toMatch(/minutes independent, 15\s*\n?\s*minutes debrief/);
    const core = SESSION_SHAPES.find((s) => s.id === "core-mission")!;
    const debrief = core.steps.find((s) => /debrief/i.test(s.label))!;
    expect(debrief.minutes).toBe(15);
  });

  it("has steps that add up to the total it advertises", () => {
    for (const shape of SESSION_SHAPES) {
      const sum = shape.steps.reduce((n, s) => n + s.minutes, 0);
      const [low, high] = shape.totalMinutes.match(/\d+/g)!.map(Number);
      expect(sum, `${shape.id} steps sum to ${sum}`).toBeGreaterThanOrEqual(low);
      expect(sum).toBeLessThanOrEqual(high);
      expect(shape.steps.length).toBeGreaterThanOrEqual(3);
      for (const step of shape.steps) {
        expect(step.teacher.length).toBeGreaterThan(40);
        expect(step.children.length).toBeGreaterThan(20);
      }
    }
  });
});

describe("what the guide says a session records is what it records", () => {
  it("a finished First Look counts as completed work and moves no competency", () => {
    const { db, cleanup } = createTestDb();
    try {
      db.prepare("DELETE FROM attempts").run();
      const before = buildSchoolReport(db, DEMO_SCHOOL);
      const f = FOUNDATIONS[0];
      assignMission(db, { classId: DEMO_CLASS, missionId: f.id, assignedBy: DEMO_TEACHER });
      playToEnd(db, DEMO_STUDENT, f);
      const after = buildSchoolReport(db, DEMO_SCHOOL);

      // "That the child opened and finished it, which counts toward completed
      // work" — an attempt row exists and the completed count rose.
      expect(
        (
          db
            .prepare("SELECT COUNT(*) AS n FROM attempts WHERE student_id = ? AND mission_id = ?")
            .get(DEMO_STUDENT, f.id) as { n: number }
        ).n,
      ).toBe(1);
      expect(after.totals.missionsCompleted).toBe(before.totals.missionsCompleted + 1);

      // "No skill is marked demonstrated, so it moves no competency figure."
      for (const c of after.competencies) {
        const was = before.competencies.find((b) => b.competency === c.competency)!;
        expect(c.demonstratedRate).toBe(was.demonstratedRate);
      }

      const claim = WHAT_IS_RECORDED.find((w) => /First Look/.test(w.shape))!;
      expect(claim.recorded).toMatch(/counts toward completed work/i);
      expect(claim.recorded).toMatch(/no skill is marked demonstrated/i);
      // And never the claim orientation used to make.
      expect(claim.recorded).not.toMatch(/records nothing/i);
    } finally {
      cleanup();
    }
  });

  it("the educator orientation no longer says First Look records nothing", () => {
    // It does record an attempt and it does count as completed work; only the
    // skill evidence is absent. The guide and orientation must agree.
    const orientation = src("src/content/certification/index.ts");
    expect(orientation).not.toMatch(/First Look records nothing on the roster/);
    expect(orientation).toMatch(/First Look records no skill evidence/);
    expect(orientation).toMatch(/counts as completed work/i);
  });
});

describe("the guide does not undo the product's own boundaries", () => {
  it("tells teachers not to reintroduce what the product refuses to build", () => {
    const all = NOT_THIS.join(" ");
    // No timer/score/leaderboard exists in the product; an extension must not
    // add one back. Nor may an extension ask a child for personal information.
    expect(all).toMatch(/timer, a race or a points chart/i);
    expect(all).toMatch(/type anything about themselves/i);
    expect(all).toMatch(/read a child's choices out to the room/i);
    expect(NOT_THIS.length).toBeGreaterThanOrEqual(5);
  });

  it("claims no certification, compliance, monitoring or support", () => {
    const page = src("src/app/teacher/how-to-run-a-session/page.tsx")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1");
    const copy = [
      ...SESSION_SHAPES.flatMap((s) => [s.applies, s.keyPoint, ...s.steps.map((t) => `${t.teacher} ${t.children}`)]),
      ...ROOM_SETUPS.map((r) => r.guidance),
      ...WHEN_THINGS_HAPPEN.map((w) => w.response),
      ...WHAT_IS_RECORDED.map((w) => w.recorded),
      ...NOT_THIS,
      page,
    ].join(" ");
    for (const overclaim of [
      /certifi/i,
      /compliant|compliance/i,
      /guarantee/i,
      /\bWCAG\b|fully accessible/i,
      /contact (?:us|support)/i,
      /\bevidence-based\b|\bresearch shows\b|\bproven to\b/i,
    ]) {
      expect(copy).not.toMatch(overclaim);
    }
  });

  it("mentions no live model, chatbot or child free text", () => {
    const copy = SESSION_SHAPES.flatMap((s) => s.steps.map((t) => `${t.teacher} ${t.children}`)).join(" ");
    for (const banned of [/chatbot/i, /type (?:a|their) (?:message|answer|question)/i]) {
      expect(copy).not.toMatch(banned);
    }
  });
});

describe("the guidance is reachable from where a teacher is", () => {
  it("is in the teacher navigation and linked from the session pages", () => {
    expect(src("src/app/teacher/layout.tsx")).toContain("/teacher/how-to-run-a-session");
    expect(src("src/app/teacher/page.tsx")).toContain("/teacher/how-to-run-a-session");
    expect(src("src/app/teacher/missions/[slug]/page.tsx")).toContain(
      "/teacher/how-to-run-a-session",
    );
    // And both per-session surfaces read the shared shapes rather than their own.
    for (const p of [
      "src/app/teacher/missions/[slug]/page.tsx",
      "src/app/teacher/guides/[slug]/page.tsx",
    ]) {
      expect(src(p)).toContain("SESSION_SHAPES");
    }
  });

  it("picks the shape from the session's own segment", () => {
    for (const p of [
      "src/app/teacher/missions/[slug]/page.tsx",
      "src/app/teacher/guides/[slug]/page.tsx",
    ]) {
      expect(src(p)).toMatch(/segment === "foundation"\s*\?\s*sh\.id === "first-look"/);
    }
  });
});
