import type { BenchmarkForm, Mission } from "@/content/types";
import type { BenchmarkRecord, BenchmarkWindow } from "@/lib/types";
import { CORE_GRADE_BAND } from "@/content/scope";
import { trackForGrade } from "@/content/foundations";

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
  /**
   * Sprint 85's acceptance correction. Optional so every existing caller keeps
   * its meaning, and supplied by all of them — a mission a class was never
   * allowed to be given must not open for a child just because an assignment
   * row exists. Rows made before the rule existed are the whole reason this is
   * checked here rather than trusted from the toggle.
   */
  eligible?: boolean;
}): MissionAccess {
  // Fail closed on an out-of-band mission, including one already completed:
  // "replay" is write-free, but offering a grade 1 child a grades 3-5 session
  // to replay is the same reading-band problem in a quieter place.
  if (input.eligible === false) return "denied";
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
  /**
   * The class's grade. Optional for the same reason as above, and supplied by
   * every caller: the check-ins measure the nine skills the grades 2-4 core
   * missions teach, so a grade 1 or grade 5 child has no business in them and
   * their answers would enter a fall-to-spring comparison for a cohort that
   * never played the curriculum being compared.
   */
  grade?: number;
}): boolean {
  if (input.grade !== undefined && !gradeIsInCoreBand(input.grade)) return false;
  if (input.window === "closed") return false;
  if (input.window !== input.form) return false;
  const existing = input.records.find((r) => r.form === input.form);
  return !existing?.completed_at;
}

/** Which check-in to offer, given the window. Null when there is nothing open. */
export function nextBenchmarkFor(
  records: readonly BenchmarkRecord[],
  window: BenchmarkWindow,
  grade?: number,
): { form: BenchmarkForm; resuming: boolean } | null {
  if (grade !== undefined && !gradeIsInCoreBand(grade)) return null;
  if (window === "closed") return null;
  const existing = records.find((r) => r.form === window);
  if (existing?.completed_at) return null;
  return { form: window, resuming: Boolean(existing) };
}

/**
 * Which authored content a class of this grade may be *given*, by grade band.
 *
 * Sprint 85 made one truthful commercial scope — the assessed program is
 * `CORE_GRADE_BAND`, and grades 1 and 5 get First Look — and enforced it
 * nowhere. Every core mission's `AssignToggle` rendered for every class,
 * `setAssignmentAction` validated the mission and the class but never the
 * grade, and neither `missionAccessFor` nor `canTakeBenchmark` had ever seen a
 * grade at all. So a grade 1 class could be assigned a grades 3–5 First Look
 * session or any grades 2–4 core mission, and a grade 5 class the early track —
 * while the new Plans copy said a grade 1 or 5 class "gets" First Look and that
 * "every mission card says its grade band on its face". Both were false.
 *
 * That is not only a broken sales promise. Children were assignable content
 * outside the reading band it was authored and levelled for, which is the one
 * thing a grade band is for.
 *
 * The rule, derived rather than listed: a class may be given the First Look
 * track `trackForGrade` picks for it, and the core curriculum only if its grade
 * is inside `CORE_GRADE_BAND`. Grade 1 therefore gets the early track and
 * nothing else; grade 5 the upper track and nothing else; grades 2 to 4 their
 * track plus all 27 core missions.
 *
 * **Assignment and play are bounded; preview is not.** A teacher can still open,
 * read and put any mission on the board — sprint 81 established that the
 * authored curriculum is what a school buys, and a grade 1 teacher looking at a
 * grade 4 mission harms nobody. What is bounded is what reaches a child.
 */

/** The inclusive grade range a band covers: "2-4" → [2, 4]. */
function bandRange(band: string): [number, number] {
  const [low, high] = band.split("-").map(Number);
  return [low, high];
}

/** True when this grade sits inside the assessed core band. */
export function gradeIsInCoreBand(grade: number): boolean {
  const [low, high] = bandRange(CORE_GRADE_BAND);
  return grade >= low && grade <= high;
}

/**
 * May a class of this grade be given this mission?
 *
 * Pure, and keyed on the mission's own `segment`/`track`/`gradeBand` rather
 * than on a list of ids, so adding a mission cannot quietly widen the rule.
 */
export function classMayBeAssigned(
  grade: number,
  mission: Pick<Mission, "segment" | "track" | "gradeBand">,
): boolean {
  if (mission.segment === "foundation") {
    // One track per class, the one written for that grade.
    return mission.track === trackForGrade(grade);
  }
  return gradeIsInCoreBand(grade);
}

/**
 * Why a class may not be given a mission, phrased for the person who tried.
 *
 * Names the mission's band and the class's grade, because "not eligible" leaves
 * a teacher guessing which of the two is the problem. It does not tell them to
 * ask anybody: nothing in the product can widen a reading band, and pretending
 * an administrator could would be the kind of unactionable recovery route
 * sprint 70 removed elsewhere.
 */
export function assignmentBandRefusal(
  grade: number,
  mission: Pick<Mission, "title" | "segment" | "track" | "gradeBand">,
): string {
  const band = `Grades ${mission.gradeBand}`;
  if (mission.segment === "foundation") {
    return (
      `${mission.title} is the ${band} First Look session, and this is a Grade ${grade} class. ` +
      `Each class runs the one track written for its grade, so assign that one instead.`
    );
  }
  return (
    `${mission.title} is written and reading-levelled for ${band}, and this is a Grade ${grade} ` +
    `class. It cannot be assigned to children outside that band. You can still open it and ` +
    `teach it on the board.`
  );
}
