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

export interface Mission {
  id: string;
  slug: string;
  order: number;
  title: string;
  competency: CompetencyId;
  /** Which of the competency's skills this mission is built around. */
  primarySkillId: string;
  gradeBand: "2-4";
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
