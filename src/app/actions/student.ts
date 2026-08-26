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
  recordDecision,
  resetAttempt,
  saveBenchmarkResponse,
  startAttempt,
} from "@/lib/repo/progress";

/**
 * Every mutation re-validates the submitted ids against the shipped content
 * before writing. The browser can only ever ask to record a decision that
 * actually exists in the authored graph.
 */

export async function beginMission(slug: string): Promise<void> {
  const mission = getMission(slug);
  if (!mission) throw new Error(`Unknown mission: ${slug}`);
  const { student } = await requireStudent();
  startAttempt(getDb(), student.id, mission.id);
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

  const { student } = await requireStudent();
  recordDecision(getDb(), {
    studentId: student.id,
    missionId: mission.id,
    sceneId: scene.id,
    choiceId: choice.id,
    evidence: choice.evidence,
  });
  return { ok: true };
}

export async function finishMission(slug: string): Promise<void> {
  const mission = getMission(slug);
  if (!mission) throw new Error(`Unknown mission: ${slug}`);
  const { student } = await requireStudent();
  completeAttempt(getDb(), student.id, mission.id);
  revalidatePath("/student");
  revalidatePath("/student/badges");
}

export async function replayMission(slug: string): Promise<void> {
  const mission = getMission(slug);
  if (!mission) throw new Error(`Unknown mission: ${slug}`);
  const { student } = await requireStudent();
  resetAttempt(getDb(), student.id, mission.id);
  revalidatePath(`/student/play/${slug}`);
}

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

  const { student } = await requireStudent();
  saveBenchmarkResponse(getDb(), {
    studentId: student.id,
    form: content.form,
    itemId: item.id,
    optionId: input.optionId,
  });
  return { ok: true };
}

export async function finishCheckIn(form: string): Promise<void> {
  const content = getBenchmarkForm(form);
  if (!content) throw new Error(`Unknown check-in: ${form}`);
  const { student } = await requireStudent();
  completeBenchmark(getDb(), student.id, content.form);
  revalidatePath("/student");
}
