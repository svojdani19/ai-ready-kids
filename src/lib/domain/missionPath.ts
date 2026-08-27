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
        // A sole safe exit teaches the recovery step, but every completer is
        // funnelled through it. It may intentionally omit evidence because it
        // cannot distinguish independent reasoning from a coached retry.
        if (
          choice.feedback.tone === "strong" &&
          !choice.evidence &&
          nonRetryChoices.length > 1
        ) {
          add(scene.id, `Strong choice ${choice.id} records no evidence`);
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
