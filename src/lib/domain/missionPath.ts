import type { Choice, Mission, Scene } from "@/content/types";
import type { PathStep } from "@/lib/types";

/**
 * Pure helpers for walking a mission's scene graph.
 *
 * The player is a client component but the graph rules live here so they can
 * be unit tested, and so the server can validate a submitted decision instead
 * of trusting whatever the browser sent.
 */

export function sceneMap(mission: Mission): Map<string, Scene> {
  return new Map(mission.scenes.map((s) => [s.id, s]));
}

export function findScene(mission: Mission, sceneId: string): Scene | undefined {
  return mission.scenes.find((s) => s.id === sceneId);
}

export function findChoice(
  mission: Mission,
  sceneId: string,
  choiceId: string,
): Choice | undefined {
  return findScene(mission, sceneId)?.choices?.find((c) => c.id === choiceId);
}

/** Where a choice sends the player: a retry returns to the same scene. */
export function nextSceneAfter(scene: Scene, choice: Choice): string {
  return choice.retry ? scene.id : choice.next;
}

/**
 * Replay a stored path to work out which scene a returning student is on.
 * Unrecognised steps stop the replay rather than throwing, so a content edit
 * that removes a scene degrades to "start again" instead of a crash.
 */
export function resumeSceneId(mission: Mission, path: PathStep[]): string {
  let current = mission.openingSceneId;
  for (const step of path) {
    const scene = findScene(mission, step.sceneId);
    if (!scene) break;
    const choice = scene.choices?.find((c) => c.id === step.choiceId);
    if (!choice) break;
    current = nextSceneAfter(scene, choice);
  }
  // A student who has made no decision yet starts at the opening scene, story
  // beats and all. Only a resume skips forward past the story scenes that sit
  // between the last recorded decision and the next thing to choose.
  if (path.length === 0) return mission.openingSceneId;

  const seen = new Set<string>();
  let scene = findScene(mission, current);
  while (scene && !scene.choices?.length && scene.kind !== "ending" && scene.next) {
    if (seen.has(scene.id)) break;
    seen.add(scene.id);
    scene = findScene(mission, scene.next);
  }
  return scene?.id ?? mission.openingSceneId;
}

/** Walk forward through story scenes to the next thing that stops you. */
function settle(mission: Mission, startId: string): Scene | undefined {
  const seen = new Set<string>();
  let scene = findScene(mission, startId);
  while (scene && !scene.choices?.length && scene.kind !== "ending" && scene.next) {
    if (seen.has(scene.id)) break;
    seen.add(scene.id);
    scene = findScene(mission, scene.next);
  }
  return scene;
}

/**
 * The one decision this attempt may record next, or null if the mission has
 * run out of decisions.
 *
 * Until sprint 28 nothing computed this. `submitDecision` checked that a scene
 * and a choice existed somewhere in the mission and `recordDecision` appended
 * whatever it was handed, so a caller could post the strongest option from
 * every decision scene in any order — skipping the story, skipping every
 * authored correction — and come out with a full set of `demonstrated`
 * evidence. The authored graph is the product's central claim, and it was
 * being enforced by the player component rather than by the server.
 */
export function expectedDecisionSceneId(mission: Mission, path: PathStep[]): string | null {
  const scene = settle(mission, resumeSceneId(mission, path));
  if (!scene || scene.kind === "ending") return null;
  return scene.choices?.length ? scene.id : null;
}

/**
 * Whether replaying this path actually arrives at an ending. `completeAttempt`
 * used to take the caller's word for it, so a mission could be marked finished
 * — badge and all — from its opening scene.
 */
export function hasReachedEnding(mission: Mission, path: PathStep[]): boolean {
  return settle(mission, resumeSceneId(mission, path))?.kind === "ending";
}

/** Decision scenes only — what the student's "step 3 of 5" counter shows. */
export function decisionSceneIds(mission: Mission): string[] {
  return mission.scenes.filter((s) => (s.choices?.length ?? 0) > 0).map((s) => s.id);
}

export function decisionNumber(mission: Mission, sceneId: string): number | null {
  const index = decisionSceneIds(mission).indexOf(sceneId);
  return index === -1 ? null : index + 1;
}

export interface ContentIssue {
  missionSlug: string;
  sceneId: string;
  problem: string;
}

/**
 * Structural safety review, run as a test over every shipped mission.
 *
 * The product's core promise is that a child cannot reach unauthored content
 * or a dead end. That promise is only credible if it is checked mechanically,
 * so this validates reachability, termination, feedback coverage and the rule
 * that an unsafe branch always offers another go.
 */
export function validateMission(mission: Mission): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const scenes = sceneMap(mission);
  const add = (sceneId: string, problem: string) =>
    issues.push({ missionSlug: mission.slug, sceneId, problem });

  if (!scenes.has(mission.openingSceneId)) {
    add(mission.openingSceneId, "Opening scene does not exist");
    return issues;
  }

  for (const scene of mission.scenes) {
    if (scene.narration.length === 0) add(scene.id, "Scene has no narration");

    if (scene.kind === "ending") {
      if (scene.next || scene.choices?.length) {
        add(scene.id, "Ending scene must not continue anywhere");
      }
      if (!scene.wrapUp?.length) add(scene.id, "Ending scene has no wrap-up");
      continue;
    }

    if (scene.choices?.length) {
      if (!scene.prompt) add(scene.id, "Choice scene has no prompt");
      const nonRetryChoices = scene.choices.filter((choice) => !choice.retry);
      for (const choice of scene.choices) {
        if (!choice.feedback.body.trim()) {
          add(scene.id, `Choice ${choice.id} has empty feedback`);
        }
        if (!scenes.has(choice.next)) {
          add(scene.id, `Choice ${choice.id} points at missing scene ${choice.next}`);
        }
        if (choice.feedback.tone === "rethink") {
          if (!choice.retry) add(scene.id, `Unsafe choice ${choice.id} does not offer a retry`);
          if (choice.evidence) {
            add(scene.id, `Unsafe choice ${choice.id} must not record evidence`);
          }
        }
        // First Look records nothing, by design. A comprehension check that a
        // six year old answers on the board is not a demonstrated safety
        // skill, and putting one in the same column as a child declining a
        // request for their street address would make the teacher's roster
        // mean two different things at once. So the evidence rules invert for
        // this segment: instead of requiring a strong choice to record, they
        // forbid any choice from recording at all.
        if (mission.segment === "foundation") {
          if (choice.evidence) {
            add(scene.id, `First Look choice ${choice.id} records evidence`);
          }
        } else if (
          // A sole safe exit teaches the recovery step, but every completer is
          // funnelled through it. It may intentionally omit evidence because it
          // cannot distinguish independent reasoning from a coached retry.
          choice.feedback.tone === "strong" &&
          !choice.evidence &&
          nonRetryChoices.length > 1
        ) {
          add(scene.id, `Strong choice ${choice.id} records no evidence`);
        }

        // The other half of that rule, and the one that matters for reporting.
        // If a scene has exactly one way out, every child who finishes it takes
        // that choice, so taking it says nothing about whether they reasoned
        // their way there or were sent back until they found it. Evidence from
        // such a scene is a record of compliance, not of a demonstrated skill.
        // Either give the scene a second plausible exit or award nothing.
        if (choice.evidence && nonRetryChoices.length === 1) {
          add(
            scene.id,
            `Choice ${choice.id} is the only way out of this scene and still records evidence`,
          );
        }
      }
      if (!scene.choices.some((c) => c.feedback.tone === "strong")) {
        add(scene.id, "Choice scene offers no safe option");
      }
      if (scene.choices.every((c) => c.retry)) {
        add(scene.id, "Every option loops back, so the scene cannot be left");
      }
    } else {
      if (!scene.next) add(scene.id, "Story scene has no continuation");
      else if (!scenes.has(scene.next)) add(scene.id, `Points at missing scene ${scene.next}`);
    }
  }

  // Reachability from the opening scene.
  const reachable = new Set<string>();
  const queue = [mission.openingSceneId];
  while (queue.length) {
    const id = queue.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const scene = scenes.get(id);
    if (!scene) continue;
    if (scene.next && scenes.has(scene.next)) queue.push(scene.next);
    for (const choice of scene.choices ?? []) {
      if (scenes.has(choice.next)) queue.push(choice.next);
    }
  }
  for (const scene of mission.scenes) {
    if (!reachable.has(scene.id)) add(scene.id, "Scene is unreachable from the opening");
  }

  if (!mission.scenes.some((s) => s.kind === "ending")) {
    add(mission.openingSceneId, "Mission has no ending scene");
  }

  return issues;
}
