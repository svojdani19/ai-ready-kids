import type { BenchmarkForm } from "@/content/types";
import type { BenchmarkRecord, BenchmarkWindow } from "@/lib/types";

/**
 * What a student is allowed to open, as rules rather than as which card the
 * home page happens to render.
 *
 * Until sprint 27 neither of these existed. The student home showed only
 * assigned missions and only the next check-in, and that was the whole of the
 * enforcement: `/student/play/[slug]` accepted any shipped mission and the
 * three mission actions accepted any slug, so a child could open and record
 * evidence for a mission their class had never been given. The check-in was
 * worse — `nextBenchmarkFor` offered the spring form the moment the fall one
 * was completed, with no window state and no dates anywhere, while the
 * administrator pages, the plans page and the report all called them fall and
 * spring windows. A child could take both back to back and the report would
 * present the difference as a year's change.
 *
 * These are pure so the page loader and the server action can share one rule,
 * and so the rule can be asserted without rendering anything.
 */

export type MissionAccess = "assigned" | "replay" | "denied";

/**
 * A mission is playable when the class currently has it assigned. Replaying
 * something already completed stays allowed on purpose: the student home links
 * "Play again", replays are write-free, and withdrawing an assignment should
 * not delete a child's access to work they already did.
 */
export function missionAccessFor(input: {
  missionId: string;
  assignedMissionIds: readonly string[];
  hasCompleted: boolean;
}): MissionAccess {
  if (input.assignedMissionIds.includes(input.missionId)) return "assigned";
  if (input.hasCompleted) return "replay";
  return "denied";
}

/**
 * A check-in is open when its school's window says so, and not otherwise.
 * A completed form cannot be reopened — answering and finishing are both
 * refused — so a child cannot revise a finished window while it is still open.
 */
export function canTakeBenchmark(input: {
  window: BenchmarkWindow;
  form: BenchmarkForm;
  records: readonly BenchmarkRecord[];
}): boolean {
  if (input.window === "closed") return false;
  if (input.window !== input.form) return false;
  const existing = input.records.find((r) => r.form === input.form);
  return !existing?.completed_at;
}

/** Which check-in to offer, given the window. Null when there is nothing open. */
export function nextBenchmarkFor(
  records: readonly BenchmarkRecord[],
  window: BenchmarkWindow,
): { form: BenchmarkForm; resuming: boolean } | null {
  if (window === "closed") return null;
  const existing = records.find((r) => r.form === window);
  if (existing?.completed_at) return null;
  return { form: window, resuming: Boolean(existing) };
}
