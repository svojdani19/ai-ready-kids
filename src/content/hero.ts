import { COMPETENCIES } from "./competencies";
import { MISSIONS } from "./missions";
import type { CompetencyId, SceneArt } from "./types";

/**
 * The three missions the landing page shows, and the panel content for each.
 *
 * The hero used to hold one hand-typed decision — Sprocket asking for a full
 * name — copied out of `m-privacy-1` and then left alone. Copied child-facing
 * copy on a marketing page is copy that drifts: edit the mission and the
 * landing page keeps quoting the old wording, and nothing fails.
 *
 * So the panels are **derived**. Which three missions appear is an editorial
 * choice and is written down below; every word inside a panel is read out of
 * the mission itself. Rewrite a scene and the hero follows.
 *
 * Nothing here is generated. These are authored scenes shown as they are.
 */

/**
 * The featured three, one per competency, chosen for a hero rather than at
 * random:
 *
 * - **Sprocket Wants to Know** — the first mission in the program and the
 *   clearest one-line illustration of what this product is.
 * - **The Penguin on the Playground** — a shared picture, which is the
 *   verification case a school evaluator recognises immediately.
 * - **The Practice That Got Skipped** — the homework shortcut, and the one
 *   families ask about first.
 *
 * They are also three different scenes, which matters here: the panel carries
 * an illustration, and a rotation that redraws the same tablet three times
 * does not read as a rotation. `HERO_PANELS` enforces that below rather than
 * trusting this comment.
 */
const FEATURED_SLUGS = [
  "sprocket-wants-to-know",
  "the-penguin-on-the-playground",
  "the-practice-that-got-skipped",
] as const;

export interface HeroPanel {
  slug: string;
  /** "Mission 1", from the mission's own place in the curriculum. */
  missionNumber: number;
  title: string;
  competency: CompetencyId;
  /** "Keep It Private" — the competency as the product names it. */
  competencyName: string;
  /** Lane colour, so the panel is tinted by what it teaches. */
  accent: string;
  art: SceneArt;
  /** The last line before the child has to decide: what is on the screen. */
  moment: string;
  /** The question the mission actually asks. */
  prompt: string;
  /** The move that looks fine and is not. */
  tempting: string;
  /** The move that shows the skill. */
  demonstrated: string;
}

/**
 * Fails closed, loudly, with the mission named.
 *
 * A hero panel is only worth deriving if a missing piece stops the build
 * instead of rendering an empty quotation mark on the front page.
 */
function panelFor(slug: string): HeroPanel {
  const mission = MISSIONS.find((m) => m.slug === slug);
  if (!mission) {
    throw new Error(`The landing page features "${slug}", which is not a core mission.`);
  }

  const scene = mission.scenes.find((s) => s.kind === "decision");
  if (!scene?.prompt || !scene.choices?.length) {
    throw new Error(`"${slug}" has no decision scene with a prompt and choices to show.`);
  }

  const moment = scene.narration[scene.narration.length - 1];
  if (!moment) {
    throw new Error(`"${slug}" asks its question with no narration in front of it.`);
  }

  // The two ends of the scene, not the middle. A `partial` choice is a
  // reasonable answer that stops short, which needs the mission around it to
  // make sense; on a landing page it reads as an arbitrary second option.
  const demonstrated = scene.choices.find((c) => c.feedback.tone === "strong");
  const tempting = scene.choices.find((c) => c.feedback.tone === "rethink");
  if (!demonstrated || !tempting) {
    throw new Error(
      `"${slug}" does not offer both a tempting move and one that shows the skill, so there is no contrast to show.`,
    );
  }

  const competency = COMPETENCIES.find((c) => c.id === mission.competency);
  if (!competency) {
    throw new Error(`"${slug}" belongs to competency "${mission.competency}", which does not exist.`);
  }

  return {
    slug,
    missionNumber: mission.order,
    title: mission.title,
    competency: mission.competency,
    competencyName: competency.name,
    accent: competency.accent,
    art: scene.art,
    moment,
    prompt: scene.prompt,
    tempting: tempting.label,
    demonstrated: demonstrated.label,
  };
}

export const HERO_PANELS: HeroPanel[] = (() => {
  const panels = FEATURED_SLUGS.map(panelFor);

  // One per competency: the hero's other job is to say that this is three
  // things, and three privacy missions would quietly stop saying it.
  const competencies = new Set(panels.map((p) => p.competency));
  if (competencies.size !== panels.length) {
    throw new Error(
      `The landing page features ${panels.length} missions across ${competencies.size} competencies. One each, or the rotation argues against the page it sits on.`,
    );
  }

  // Three different illustrations, for the reason in FEATURED_SLUGS.
  const scenes = new Set(panels.map((p) => p.art));
  if (scenes.size !== panels.length) {
    throw new Error(
      `The featured missions share an illustration (${panels.map((p) => p.art).join(", ")}). The hero rotates a picture as well as a question.`,
    );
  }

  return panels;
})();
