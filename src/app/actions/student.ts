"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getMission } from "@/content/missions";
import { getBenchmarkForm } from "@/content/benchmark";
import { findChoice, findScene } from "@/lib/domain/missionPath";
import { requireStudent } from "@/lib/auth/session";
import {
  completeAttempt,
  completeBenchmark,
  getAttempt,
  listBenchmarksForStudent,
  recordDecision,
  saveBenchmarkResponse,
  startAttempt,
} from "@/lib/repo/progress";
import { getClass, listAssignments } from "@/lib/repo/classroom";
import { getSchool } from "@/lib/repo/school";
import { canTakeBenchmark, classMayBeAssigned, missionAccessFor } from "@/lib/domain/eligibility";
import { assertClassSubscriptionActive } from "@/lib/auth/subscription-gate";

/**
 * Every mutation re-validates the submitted ids against the shipped content
 * before writing. The browser can only ever ask to record a decision that
 * actually exists in the authored graph.
 *
 * And, since sprint 27, against what this student is actually allowed to open.
 * Validating that a mission exists is not the same as validating that it was
 * assigned, and these are public endpoints: which card the home page renders
 * has never been a permission.
 */

/** Resolve a check-in the student may take right now, or throw. */
async function requireOpenCheckIn(form: string) {
  const content = getBenchmarkForm(form);
  if (!content) throw new Error(`Unknown check-in: ${form}`);
  const { student } = await requireStudent();
  const db = getDb();
  const classroom = getClass(db, student.class_id);
  const school = classroom ? getSchool(db, classroom.school_id) : undefined;
  if (!school) throw new Error("That check-in is not open.");
  // The term first. A lapsed school records no new work — but nothing already
  // written is touched, and the child is told in their own words, not in
  // billing language, by the surfaces that render this.
  assertClassSubscriptionActive(db, student.class_id);
  const open = canTakeBenchmark({
    window: school.benchmark_window,
    form: content.form,
    records: listBenchmarksForStudent(db, student.id),
    // The check-ins measure the nine skills the core missions teach. A missing
    // classroom is not a pass: `grade` is required, and 0 is outside every band,
    // so an unresolvable class closes the check-in rather than opening it.
    grade: classroom?.grade ?? 0,
  });
  if (!open) throw new Error("That check-in is not open.");
  return { content, student, db };
}

/** Resolve a mission the student may play, or throw. */
async function requirePlayableMission(slug: string) {
  const mission = getMission(slug);
  if (!mission) throw new Error(`Unknown mission: ${slug}`);
  const { student } = await requireStudent();
  const db = getDb();
  assertClassSubscriptionActive(db, student.class_id);
  const classroom = getClass(db, student.class_id);
  const access = missionAccessFor({
    missionId: mission.id,
    assignedMissionIds: listAssignments(db, student.class_id).map((a) => a.mission_id),
    hasCompleted: Boolean(getAttempt(db, student.id, mission.id)?.completed_at),
    // Sprint 85: a stale out-of-band assignment does not make a mission open.
    eligible: classroom ? classMayBeAssigned(classroom.grade, mission) : false,
  });
  if (access === "denied") throw new Error("That mission is not open for your class.");
  return { mission, student, db };
}

export async function beginMission(slug: string): Promise<void> {
  const { mission, student, db } = await requirePlayableMission(slug);
  startAttempt(db, student.id, mission.id);
}

export async function submitDecision(input: {
  slug: string;
  sceneId: string;
  choiceId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const mission = getMission(input.slug);
  if (!mission) return { ok: false, error: "Unknown mission." };

  const scene = findScene(mission, input.sceneId);
  const choice = findChoice(mission, input.sceneId, input.choiceId);
  if (!scene || !choice) return { ok: false, error: "That choice is not part of this mission." };

  let student, db;
  try {
    ({ student, db } = await requirePlayableMission(input.slug));
  } catch {
    return { ok: false, error: "That mission is not open for your class." };
  }
  recordDecision(db, {
    studentId: student.id,
    missionId: mission.id,
    sceneId: scene.id,
    choiceId: choice.id,
    evidence: choice.evidence,
  });
  return { ok: true };
}

export async function finishMission(slug: string): Promise<void> {
  const { mission, student, db } = await requirePlayableMission(slug);
  completeAttempt(db, student.id, mission.id);
  revalidatePath("/student");
  revalidatePath("/student/badges");
}

/*
 * `replayMission` used to live here and is gone on purpose.
 *
 * The player, the README and several review records all promise that replaying
 * a finished mission is read-only: "your badge stays, and nothing you tap now
 * gets recorded". This action did the opposite. It was not wired to any button,
 * but it was exported, and an exported server action is a callable endpoint —
 * a completed mission is deliberately eligible under the replay rule, so a
 * direct call passed the access check and then deleted the whole attempt:
 * completion, path, evidence and the badge with it. If the assignment had since
 * been withdrawn the child also lost access to the mission entirely.
 *
 * Replay now means what the copy says: the completed attempt is loaded and
 * every write refuses. `resetAttempt` survives in the repository for tests and
 * for any future support tool, which would need to be an authorized adult
 * operation with confirmation and an audit entry — not something a child's
 * browser can invoke.
 */

export async function submitCheckInAnswer(input: {
  form: string;
  itemId: string;
  optionId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const content = getBenchmarkForm(input.form);
  if (!content) return { ok: false, error: "Unknown check-in." };

  const item = content.items.find((i) => i.id === input.itemId);
  if (!item || !item.options.some((o) => o.id === input.optionId)) {
    return { ok: false, error: "That answer is not part of this check-in." };
  }

  let student, db;
  try {
    ({ student, db } = await requireOpenCheckIn(input.form));
  } catch {
    return { ok: false, error: "That check-in is not open." };
  }
  saveBenchmarkResponse(db, {
    studentId: student.id,
    form: content.form,
    itemId: item.id,
    optionId: input.optionId,
  });
  return { ok: true };
}

export async function finishCheckIn(form: string): Promise<void> {
  const { content, student, db } = await requireOpenCheckIn(form);
  completeBenchmark(db, student.id, content.form);
  revalidatePath("/student");
}
