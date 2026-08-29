/**
 * Content model for AI Ready Kids.
 *
 * Every word a student can see is authored here and shipped with the build.
 * There is no generative model in the request path: a mission is a finite,
 * hand-reviewed graph of scenes, and the only thing the runtime does is walk
 * it. That is what makes the experience safety-reviewable in structure.
 */

export type CompetencyId = "privacy" | "verification" | "ownership";

export interface Competency {
  id: CompetencyId;
  /** Short label used on badges and the student map. */
  name: string;
  /** Adult-facing label used on dashboards and reports. */
  formalName: string;
  /** Kid-facing one-liner, ~grade 3 reading level. */
  kidBlurb: string;
  /** Educator-facing description used in guides and the school report. */
  educatorBlurb: string;
  accent: "pine" | "marigold" | "denim";
  skills: Skill[];
}

export interface Skill {
  id: string;
  competency: CompetencyId;
  /** What the student sees when they demonstrate it. */
  kidLabel: string;
  /** What a teacher or administrator sees as evidence. */
  educatorLabel: string;
}

export type FeedbackTone =
  /** The choice demonstrates the skill. */
  | "strong"
  /** Reasonable, but there is a safer or more independent move. */
  | "partial"
  /** Not safe / not the goal. Always paired with a retry, never a dead end. */
  | "rethink";

export interface Feedback {
  tone: FeedbackTone;
  /** Headline shown to the student. Kept under ~8 words. */
  headline: string;
  /** 1-3 short sentences, second person, no shaming language. */
  body: string;
  /**
   * Optional line surfaced to teachers in the discussion guide and mission
   * preview. Never shown to students.
   */
  coachNote?: string;
}

export interface ChoiceEvidence {
  skillId: string;
  result: "demonstrated" | "developing";
}

export interface Choice {
  id: string;
  label: string;
  /** Optional longer label for screen readers when the visible text is terse. */
  ariaLabel?: string;
  feedback: Feedback;
  evidence?: ChoiceEvidence;
  /** Scene to continue to once feedback is acknowledged. */
  next: string;
  /**
   * When true the student returns to this same scene to choose again after
   * reading the feedback. Used for `rethink` choices so nobody is ever locked
   * into an unsafe path.
   */
  retry?: boolean;
}

export type SceneArt =
  | "classroom"
  | "tablet"
  | "camera"
  | "library"
  | "bedroom-night"
  | "playground"
  | "desk-test"
  | "four-doors"
  | "kitchen"
  | "hallway";

export interface Scene {
  id: string;
  kind: "story" | "decision" | "reflect" | "ending";
  art: SceneArt;
  /** Speaker label for the panel, e.g. "Sprocket" or "Nia". */
  speaker?: string;
  /**
   * Narration paragraphs. Written to be read aloud: short sentences, no
   * parentheticals, no abbreviations that a screen reader mangles.
   */
  narration: string[];
  /** The question posed at a decision scene. */
  prompt?: string;
  choices?: Choice[];
  /** Scene to continue to for non-decision scenes. */
  next?: string;
  /** Closing summary lines, ending scenes only. */
  wrapUp?: string[];
}

/**
 * One invented picture, described rather than shown. Every field is authored:
 * nothing here is sourced, uploaded, or photographed by a school.
 */
export interface ExtensionCard {
  /** What the room calls it, like "Photo 1". */
  label: string;
  /** The picture, described in a sentence or two, to read out or project. */
  description: string;
  /** What it hints at. Never what it settles. */
  suggests: string;
  /** What it would actually take to know, and what stays unknown. */
  proves: string;
  /**
   * Whether everybody in the picture was actually asked. Optional, because it
   * only applies where a mission teaches consent as a separate step from
   * background — The Class Photo does, The Filter That Wanted More does not.
   */
  consent?: string;
  /**
   * What can and cannot be controlled about the next moment. Optional, because
   * it only applies where a mission teaches that a frame you have checked is
   * not the same as a frame you can keep checking — What the Camera Sees does,
   * and it is the difference between a preview and a live stream.
   */
  control?: string;
  /** Whether this one is ready for a big audience, and why that is separate. */
  audience: string;
}

export interface DiscussionGuide {
  /** 2-4 sentence framing for the teacher before the lesson. */
  setup: string;
  /** What the mission is actually teaching, in teacher language. */
  lookFor: string[];
  /** Questions for a whole-class debrief after everyone plays. */
  questions: string[];
  /** A short "if a student says..." table for common misconceptions. */
  misconceptions: { student: string; response: string }[];
  /** 10-minute unplugged extension. */
  extension: string;
  /**
   * Optional invented material for the extension, so that an activity about
   * looking closely at pictures never requires a teacher to supply a real one.
   *
   * Sprint 37: the extension for The Filter That Wanted More used to ask a
   * teacher to project three photographs of their own classroom. In a mission
   * about what a picture gives away, that put real children's faces, names on
   * cubbies and work, uniforms and school signage on a projector — and a
   * projected screen can itself be photographed. The activity contained the
   * hazard it was teaching against. Authored cards remove the sourcing step
   * entirely: they are read aloud or projected as they are.
   */
  extensionCards?: ExtensionCard[];
}

export interface FamilyTakeHome {
  /** Plain-language summary for a caregiver. Avoids jargon entirely. */
  summary: string;
  /** Three dinner-table questions. */
  questions: string[];
  /** One thing to try at home. */
  tryAtHome: string;
  /** The one sentence we want the family to remember. */
  familyRule: string;
}

/**
 * Which half of the program a session belongs to.
 *
 * `core` is the twenty-seven assessed missions: they rehearse a decision and
 * record evidence against one of the nine skills.
 *
 * `foundation` is the First Look segment, for a child who has not yet been
 * told what AI is. It teaches what a guessing machine is, where one already
 * sits in their day, and who is in charge of it. A foundation session records
 * no evidence at all — there is no decision in it that a child could get
 * wrong in the sense the nine skills mean, and reporting one would put a
 * comprehension check in a column that says "demonstrated this skill".
 * `validateMission` enforces that; `tests/foundations.test.ts` proves it.
 */
export type Segment = "foundation" | "core";

/**
 * Foundation sessions come in two grade tiers rather than one. A first grader
 * and a fifth grader both need to be told what AI is, and a single script
 * written for either one patronises or loses the other.
 */
export type FoundationTrack = "early" | "upper";

/**
 * Reading and interest band. `1-2` and `3-5` are the two First Look tiers;
 * `2-4` is the core curriculum, which is written and reading-levelled for
 * that band and is not claimed beyond it.
 */
export type GradeBand = "1-2" | "2-4" | "3-5";

export interface Mission {
  id: string;
  slug: string;
  /** Core: 1 to 27 across the curriculum. Foundation: 1 to 3 within its track. */
  order: number;
  title: string;
  segment: Segment;
  /**
   * Core: the competency this mission is assessed against.
   *
   * Foundation: the competency the session opens the door to. Nothing is
   * assessed, so this is a routing and color decision, not a claim — it is
   * what puts the session in the right lane on the map and gives its badge a
   * glyph from the right family.
   */
  competency: CompetencyId;
  /**
   * Core: which of the competency's skills this mission is built around, and
   * the skill its evidence is reported under.
   *
   * Foundation: the skill the session previews. Never recorded. Teacher-facing
   * screens label it "Leads into", never "Primary skill", because a First Look
   * session cannot and does not report it.
   */
  primarySkillId: string;
  /** Foundation sessions only: which tier this is written for. */
  track?: FoundationTrack;
  /**
   * Foundation sessions only. The one sentence the session exists to leave
   * behind, in the child's own register. Shown on the teacher's library card
   * and read out at the end of Classroom Mode.
   */
  bigIdea?: string;
  gradeBand: GradeBand;
  estimatedMinutes: number;
  /** Kid-facing teaser on the mission map. */
  teaser: string;
  /** Educator-facing summary. */
  summary: string;
  learningGoals: string[];
  /** Sticker awarded on completion. */
  badge: { id: string; name: string; blurb: string };
  openingSceneId: string;
  scenes: Scene[];
  guide: DiscussionGuide;
  family: FamilyTakeHome;
}

/* ---------------------------------------------------------------- *
 * Annual benchmark
 * ---------------------------------------------------------------- */

export type BenchmarkForm = "pre" | "post";

export interface BenchmarkItem {
  id: string;
  competency: CompetencyId;
  skillId: string;
  /** Scenario text. Deliberately set in a context no mission uses. */
  scenario: string;
  question: string;
  options: { id: string; label: string; correct: boolean }[];
}

export interface BenchmarkFormContent {
  form: BenchmarkForm;
  title: string;
  /** Student-facing framing. Never uses the words test, score, or grade. */
  intro: string[];
  outro: string[];
  items: BenchmarkItem[];
}

/* ---------------------------------------------------------------- *
 * Educator orientation
 * ---------------------------------------------------------------- */

export interface CertificationModule {
  id: string;
  order: number;
  title: string;
  minutes: number;
  /** Markdown-free paragraphs; rendered as plain prose. */
  body: string[];
  keyPoints: string[];
  check: {
    question: string;
    options: { id: string; label: string; correct: boolean }[];
    /** Shown after answering, whichever option was picked. */
    explanation: string;
  };
}
