import type { CompetencyId, Mission } from "../types";
import { privacyMissions } from "./privacy";
import { verificationMissions } from "./verification";
import { ownershipMissions } from "./ownership";

export const MISSIONS: Mission[] = [
  ...privacyMissions,
  ...verificationMissions,
  ...ownershipMissions,
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

export function getMission(slug: string): Mission | undefined {
  return MISSION_BY_SLUG[slug];
}
