import type { CompetencyId, Mission } from "../types";
import { privacyMissions } from "./privacy";
import { privacyMoreMissions } from "./privacy-more";
import { verificationMissions } from "./verification";
import { verificationMoreMissions } from "./verification-more";
import { ownershipMissions } from "./ownership";
import { ownershipMoreMissions } from "./ownership-more";

/**
 * Twenty-seven missions: three competencies, three skills each, three missions
 * per skill. `order` runs in skill triplets, so missions 1 to 3 all build the
 * same skill in different situations rather than sweeping across a competency
 * once. A teacher assigning in order gets spaced practice for free.
 */
export const MISSIONS: Mission[] = [
  ...privacyMissions,
  ...privacyMoreMissions,
  ...verificationMissions,
  ...verificationMoreMissions,
  ...ownershipMissions,
  ...ownershipMoreMissions,
].sort((a, b) => a.order - b.order);

export const MISSION_BY_SLUG: Record<string, Mission> = Object.fromEntries(
  MISSIONS.map((m) => [m.slug, m]),
);

export const MISSION_BY_ID: Record<string, Mission> = Object.fromEntries(
  MISSIONS.map((m) => [m.id, m]),
);

export function missionsForCompetency(competency: CompetencyId): Mission[] {
  return MISSIONS.filter((m) => m.competency === competency);
}

/** The three missions that build one named skill, in teaching order. */
export function missionsForSkill(skillId: string): Mission[] {
  return MISSIONS.filter((m) => m.primarySkillId === skillId);
}

export function getMission(slug: string): Mission | undefined {
  return MISSION_BY_SLUG[slug];
}
