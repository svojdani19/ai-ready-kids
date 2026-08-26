import type { Competency, CompetencyId, Skill } from "./types";

/**
 * Three competencies, three skills each. This is the spine of the whole
 * product: missions, benchmark items, badges, teacher evidence and the school
 * report all key off these ids.
 */
export const COMPETENCIES: Competency[] = [
  {
    id: "privacy",
    name: "Keep It Private",
    formalName: "Privacy and Personal Information",
    kidBlurb: "Know what to keep to yourself when a computer asks you things.",
    educatorBlurb:
      "Students recognise requests for identifying information, images and location, and practise declining and escalating to a trusted adult.",
    accent: "pine",
    skills: [
      {
        id: "privacy.identity",
        competency: "privacy",
        kidLabel: "Kept my private facts private",
        educatorLabel: "Withholds identifying information from an AI tool",
      },
      {
        id: "privacy.media",
        competency: "privacy",
        kidLabel: "Thought before sharing a picture or place",
        educatorLabel: "Evaluates requests for photos, camera and location access",
      },
      {
        id: "privacy.escalate",
        competency: "privacy",
        kidLabel: "Stopped and got a grown-up",
        educatorLabel: "Stops and involves a trusted adult when a request feels wrong",
      },
    ],
  },
  {
    id: "verification",
    name: "Check It Out",
    formalName: "Verification and Evidence",
    kidBlurb: "Find out if something is really true before you believe it.",
    educatorBlurb:
      "Students learn that fluent, confident output can still be wrong, notice signs of synthetic media, and check claims against a trusted source.",
    accent: "marigold",
    skills: [
      {
        id: "verify.confidence",
        competency: "verification",
        kidLabel: "Knew that sounding sure is not the same as being right",
        educatorLabel: "Separates confident delivery from accuracy",
      },
      {
        id: "verify.synthetic",
        competency: "verification",
        kidLabel: "Spotted a picture or voice that might be made up",
        educatorLabel: "Identifies plausible indicators of synthetic image or audio",
      },
      {
        id: "verify.source",
        competency: "verification",
        kidLabel: "Checked with a source I can trust",
        educatorLabel: "Compares a claim against an authoritative source",
      },
    ],
  },
  {
    id: "ownership",
    name: "Own Your Thinking",
    formalName: "Learning Ownership",
    kidBlurb: "Make sure the learning ends up in your brain, not just on your page.",
    educatorBlurb:
      "Students choose deliberately among thinking, looking up, asking a person and using AI, and can name when help has replaced their own learning.",
    accent: "denim",
    skills: [
      {
        id: "own.effort",
        competency: "ownership",
        kidLabel: "Kept the thinking work as mine",
        educatorLabel: "Attempts the task before requesting assistance",
      },
      {
        id: "own.toolchoice",
        competency: "ownership",
        kidLabel: "Picked the right kind of help",
        educatorLabel: "Selects an appropriate strategy: think, look up, ask a person, or use AI",
      },
      {
        id: "own.honesty",
        competency: "ownership",
        kidLabel: "Said out loud what the computer did for me",
        educatorLabel: "Accurately reports what assistance was used",
      },
    ],
  },
];

export const COMPETENCY_BY_ID: Record<CompetencyId, Competency> = Object.fromEntries(
  COMPETENCIES.map((c) => [c.id, c]),
) as Record<CompetencyId, Competency>;

export const ALL_SKILLS: Skill[] = COMPETENCIES.flatMap((c) => c.skills);

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(
  ALL_SKILLS.map((s) => [s.id, s]),
);

export const COMPETENCY_IDS: CompetencyId[] = COMPETENCIES.map((c) => c.id);

/** Tailwind token names per competency, kept in one place for consistency. */
export const ACCENT_CLASSES: Record<
  Competency["accent"],
  { text: string; bg: string; wash: string; border: string; solid: string }
> = {
  pine: {
    text: "text-pine-deep",
    bg: "bg-pine",
    wash: "bg-pine-wash",
    border: "border-pine",
    solid: "bg-pine-deep",
  },
  marigold: {
    text: "text-marigold-deep",
    bg: "bg-marigold",
    wash: "bg-marigold-wash",
    border: "border-marigold",
    solid: "bg-marigold-deep",
  },
  denim: {
    text: "text-denim-deep",
    bg: "bg-denim",
    wash: "bg-denim-wash",
    border: "border-denim",
    solid: "bg-denim-deep",
  },
};
