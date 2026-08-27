import type { CompetencyId, Mission } from "../types";
import { privacyMissions } from "./privacy";
import { privacyMoreMissions } from "./privacy-more";
import { verificationMissions } from "./verification";
import { verificationMoreMissions } from "./verification-more";
import { ownershipMissions } from "./ownership";
import { ownershipMoreMissions } from "./ownership-more";

/**
 * Twenty-seven missions: three competencies, three skills each, three missions
 * per skill.
 *
 * `order` runs in three interleaved passes of nine rather than in skill
 * triplets. Each pass touches all nine skills once, rotating through the
 * competencies, so the three encounters with a skill sit nine missions apart
 * and any prefix a teacher assigns is balanced across all three competencies.
 *
 * The earlier triplet ordering was blocked practice wearing a spacing label: a
 * class assigned the first nine missions received privacy and nothing else.
 * `tests/evidence-integrity.test.ts` asserts the interleaving directly so it
 * cannot quietly regress the next time missions are added.
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
