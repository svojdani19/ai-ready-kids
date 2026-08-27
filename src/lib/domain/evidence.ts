import { COMPETENCIES, COMPETENCY_IDS, SKILL_BY_ID } from "@/content/competencies";
import { MISSIONS, MISSION_BY_ID } from "@/content/missions";
import type { CompetencyId, Mission } from "@/content/types";
import type { Attempt, EvidenceMap, EvidenceResult } from "@/lib/types";

/**
 * Evidence roll-ups.
 *
 * Deliberately absent from this module: any single number that scores a
 * child. There is no overall percentage, no risk band, no readiness index and
 * no comparison of one student against another. The unit of reporting is
 * "which of the nine skills has this student demonstrated", because that is
 * the only claim the content actually supports.
 *
 * Two different claims live here and they must not be confused, because one of
 * them was quietly doing the other's job until sprint 22.
 *
 *   Lifetime evidence — `SkillState.result`. Sticky: once a child chooses a
 *   demonstrated response in any completed mission, that is what the skill
 *   reads forever. The honest sentence is "has independently shown this at
 *   least once", which is what the student and roster labels say.
 *
 *   Opportunity evidence — `SkillState.opportunities` and the counts beside
 *   it. One entry per completed mission that actually recorded a result for
 *   the skill, in order. A later coached result is visible here and does not
 *   erase the earlier success. Since the curriculum deliberately meets each
 *   skill in three different situations, this is the only view that can say
 *   anything about transfer.
 *
 * A lifetime maximum cannot tell "shown once, then needed coaching twice" from
 * "shown independently every time", so it cannot support a teaching
 * recommendation. Anything instructional must come from the opportunity view,
 * and must say what its denominator was.
 */

/**
 * The smallest group this module will compute a rate over. Matches the
 * suppression threshold used in reporting; kept here so the domain layer does
 * not have to import the repo layer.
 */
export const MIN_COMPARABLE_GROUP = 5;

/** Missions whose scene graph contains a choice recording each skill. */
const MISSIONS_OFFERING = new Map<string, string[]>();
for (const mission of MISSIONS) {
  const offered = new Set<string>();
  for (const scene of mission.scenes) {
    for (const choice of scene.choices ?? []) {
      if (choice.evidence) offered.add(choice.evidence.skillId);
    }
  }
  for (const skillId of offered) {
    const list = MISSIONS_OFFERING.get(skillId) ?? [];
    list.push(mission.id);
    MISSIONS_OFFERING.set(skillId, list);
  }
}

/** Mission ids that offer a chance to record this skill, authored order. */
export function missionsOfferingSkill(skillId: string): string[] {
  return MISSIONS_OFFERING.get(skillId) ?? [];
}

export interface SkillState {
  skillId: string;
  competency: CompetencyId;
  /** Lifetime, sticky: has this been shown unaided at least once. */
  result: EvidenceResult | "not-yet";
  /** Completed missions that recorded a result for this skill, oldest first. */
  opportunities: EvidenceResult[];
  /** How many of those were reached without a Try again. */
  demonstratedCount: number;
  /** How many needed coaching, including ones after an earlier success. */
  developingCount: number;
  /** The most recent opportunity, which the lifetime result may not reflect. */
  latest: EvidenceResult | undefined;
  /** Authored missions that could record it, whether or not they are assigned. */
  offeredBy: number;
}

export interface CompetencyState {
  competency: CompetencyId;
  demonstrated: number;
  developing: number;
  total: number;
  missionsCompleted: number;
  missionsTotal: number;
}

export interface StudentSummary {
  evidence: EvidenceMap;
  skills: SkillState[];
  competencies: CompetencyState[];
  completedMissionIds: string[];
  inProgressMissionIds: string[];
  badgeIds: string[];
  skillsDemonstrated: number;
  skillsTotal: number;
}

/** Merge evidence maps, treating `demonstrated` as sticky. */
export function mergeEvidence(maps: EvidenceMap[]): EvidenceMap {
  const merged: EvidenceMap = {};
  for (const map of maps) {
    for (const [skillId, result] of Object.entries(map)) {
      if (merged[skillId] === "demonstrated") continue;
      merged[skillId] = result;
    }
  }
  return merged;
}

export function summariseStudent(attempts: Attempt[]): StudentSummary {
  // Oldest first, so the per-opportunity sequence reads in the order the child
  // actually met the skill rather than in whatever order the rows came back.
  const completed = attempts
    .filter((a) => a.completed_at)
    .sort((a, b) => (a.completed_at ?? "").localeCompare(b.completed_at ?? ""));
  const evidence = mergeEvidence(completed.map((a) => a.evidence));

  const skills: SkillState[] = COMPETENCIES.flatMap((c) =>
    c.skills.map((s) => {
      const opportunities = completed
        .map((a) => a.evidence[s.id])
        .filter((r): r is EvidenceResult => r === "demonstrated" || r === "developing");
      return {
        skillId: s.id,
        competency: c.id,
        result: evidence[s.id] ?? ("not-yet" as const),
        opportunities,
        demonstratedCount: opportunities.filter((r) => r === "demonstrated").length,
        developingCount: opportunities.filter((r) => r === "developing").length,
        latest: opportunities.at(-1),
        offeredBy: missionsOfferingSkill(s.id).length,
      };
    }),
  );

  const completedMissionIds = completed.map((a) => a.mission_id);
  const competencies: CompetencyState[] = COMPETENCIES.map((c) => {
    const own = skills.filter((s) => s.competency === c.id);
    const missions = MISSIONS.filter((m) => m.competency === c.id);
    return {
      competency: c.id,
      demonstrated: own.filter((s) => s.result === "demonstrated").length,
      developing: own.filter((s) => s.result === "developing").length,
      total: own.length,
      missionsCompleted: missions.filter((m) => completedMissionIds.includes(m.id)).length,
      missionsTotal: missions.length,
    };
  });

  const badgeIds = completedMissionIds
    .map((id) => MISSION_BY_ID[id]?.badge.id)
    .filter((b): b is string => Boolean(b));

  return {
    evidence,
    skills,
    competencies,
    completedMissionIds,
    inProgressMissionIds: attempts.filter((a) => !a.completed_at).map((a) => a.mission_id),
    badgeIds,
    skillsDemonstrated: skills.filter((s) => s.result === "demonstrated").length,
    skillsTotal: skills.length,
  };
}

export interface CohortSkillStat {
  skillId: string;
  competency: CompetencyId;
  educatorLabel: string;
  /** Students whose lifetime evidence is demonstrated. Sticky. */
  demonstrated: number;
  /** Students whose lifetime evidence is developing and never demonstrated. */
  developing: number;
  /** Students with no evidence at all, which usually means no opportunity. */
  notYet: number;
  /** Students who have had at least one recorded opportunity at this skill. */
  withOpportunity: number;
  /**
   * Demonstrated over `withOpportunity` — never over the whole roster. A skill
   * one student of thirty has met and shown is 100% of the students who
   * practised it, not 3% of the class. Zero when nobody has had a go.
   */
  demonstratedRate: number;
  /** Every recorded opportunity across the class, for the transfer view. */
  opportunities: number;
  /** How many of those were reached unaided. */
  independentOpportunities: number;
  /**
   * Independent over total opportunities. Unlike `demonstratedRate` this is
   * not sticky, so a class that shows a skill once and then needs coaching
   * twice reads differently from one that shows it every time. It is the only
   * rate here that can move downwards, which is what makes it the one an
   * instructional suggestion can be built on.
   */
  independentRate: number;
}

export interface CohortSummary {
  studentCount: number;
  /** Students who have completed at least one assigned mission. */
  startedCount: number;
  assignedMissionIds: string[];
  /** Completed assigned missions divided by (students x assigned missions). */
  completionRate: number;
  missionCompletion: { missionId: string; completed: number; started: number }[];
  skills: CohortSkillStat[];
  competencies: {
    competency: CompetencyId;
    demonstratedRate: number;
    demonstrated: number;
    possible: number;
    /**
     * Distinct students who contributed at least one opportunity to this
     * competency. This — not the roster, and not `possible`, which counts
     * student-skill pairs — is the group that suppression must be applied to.
     * Ids rather than a count so that a school-level roll-up can deduplicate
     * across classes before checking the threshold. Never exported.
     */
    contributorIds: string[];
  }[];
}

export function summariseCohort(input: {
  studentIds: string[];
  attempts: Attempt[];
  assignedMissionIds: string[];
}): CohortSummary {
  const { studentIds, attempts, assignedMissionIds } = input;
  const byStudent = new Map<string, Attempt[]>();
  for (const id of studentIds) byStudent.set(id, []);
  for (const a of attempts) {
    const list = byStudent.get(a.student_id);
    if (list) list.push(a);
  }

  const summaries = studentIds.map((id) => summariseStudent(byStudent.get(id) ?? []));

  const skills: CohortSkillStat[] = COMPETENCIES.flatMap((c) =>
    c.skills.map((s) => {
      const states = summaries.map(
        (sum) => sum.skills.find((x) => x.skillId === s.id)?.result ?? "not-yet",
      );
      const demonstrated = states.filter((r) => r === "demonstrated").length;
      const developing = states.filter((r) => r === "developing").length;
      const own = summaries.map((sum) => sum.skills.find((x) => x.skillId === s.id));
      const withOpportunity = own.filter((x) => (x?.opportunities.length ?? 0) > 0).length;
      const opportunities = own.reduce((n, x) => n + (x?.opportunities.length ?? 0), 0);
      const independentOpportunities = own.reduce((n, x) => n + (x?.demonstratedCount ?? 0), 0);
      return {
        skillId: s.id,
        competency: c.id,
        educatorLabel: SKILL_BY_ID[s.id].educatorLabel,
        demonstrated,
        developing,
        notYet: states.length - demonstrated - developing,
        withOpportunity,
        demonstratedRate: withOpportunity ? demonstrated / withOpportunity : 0,
        opportunities,
        independentOpportunities,
        independentRate: opportunities ? independentOpportunities / opportunities : 0,
      };
    }),
  );

  const missionCompletion = assignedMissionIds.map((missionId) => {
    const relevant = attempts.filter((a) => a.mission_id === missionId);
    return {
      missionId,
      completed: relevant.filter((a) => a.completed_at).length,
      started: relevant.length,
    };
  });

  const possibleCompletions = studentIds.length * assignedMissionIds.length;
  const actualCompletions = missionCompletion.reduce((n, m) => n + m.completed, 0);

  // Same correction as the per-skill rate: the denominator is student-skill
  // pairs where the student has actually met the skill, not every pair that
  // could exist if everything were assigned and finished.
  const competencies = COMPETENCY_IDS.map((id) => {
    const own = skills.filter((s) => s.competency === id);
    const demonstrated = own.reduce((n, s) => n + s.demonstrated, 0);
    const possible = own.reduce((n, s) => n + s.withOpportunity, 0);
    const contributorIds = studentIds.filter((studentId, index) =>
      summaries[index].skills.some(
        (skill) => skill.competency === id && skill.opportunities.length > 0,
      ),
    );
    return {
      competency: id,
      demonstrated,
      possible,
      demonstratedRate: possible ? demonstrated / possible : 0,
      contributorIds,
    };
  });

  return {
    studentCount: studentIds.length,
    startedCount: summaries.filter(
      (s) => s.completedMissionIds.length > 0 || s.inProgressMissionIds.length > 0,
    ).length,
    assignedMissionIds,
    completionRate: possibleCompletions ? actualCompletions / possibleCompletions : 0,
    missionCompletion,
    skills,
    competencies,
  };
}

/**
 * Next step for a class. Two kinds, and which one you get depends on whether
 * the class has actually generated a comparable signal yet.
 *
 * `reteach` is an instructional claim and is only produced when enough
 * students have had a real opportunity at the skill. It reports its own
 * denominator, because "40% of the eleven children who have met it" and "40%
 * of the class" are different sentences and only one of them is true.
 *
 * It ranks on `independentRate` rather than on the lifetime figure. Lifetime
 * evidence is sticky and therefore saturates — with three authored encounters
 * per skill, nearly every child eventually has one good result, and a metric
 * that only ever goes up cannot say what needs teaching this week. How often a
 * skill is chosen first go, across every time it has come up, can.
 *
 * `not-practised` is a coverage observation, not a judgement about
 * understanding. A skill nobody has reached is not a weakness, and the earlier
 * version of this function ranked exactly that as the class's biggest gap:
 * dividing by the whole roster meant the least-assigned skill always scored
 * lowest, so early in a sequence it recommended reteaching something the class
 * had never been taught.
 */
export type TeachingFocus =
  | {
      kind: "reteach";
      skillId: string;
      label: string;
      mission: Mission | undefined;
      /** Times it was chosen first go, across every encounter in the class. */
      independentOpportunities: number;
      /** Times it came up at all. The denominator, and it is stated in the UI. */
      opportunities: number;
      /** How many students that spans, so nobody reads it as a headcount. */
      withOpportunity: number;
      rate: number;
    }
  | {
      kind: "not-practised";
      skillId: string;
      label: string;
      mission: Mission | undefined;
      withOpportunity: number;
    };

export function nextTeachingFocus(cohort: CohortSummary): TeachingFocus | undefined {
  if (cohort.skills.length === 0) return undefined;

  // Comparable means enough students to say anything, and enough of this class
  // for the number to be about the class rather than about a handful of it.
  const threshold = Math.max(MIN_COMPARABLE_GROUP, Math.ceil(cohort.studentCount / 2));
  const comparable = cohort.skills.filter((s) => s.withOpportunity >= threshold);

  if (comparable.length > 0) {
    const weakest = [...comparable].sort(
      (a, b) => a.independentRate - b.independentRate || a.skillId.localeCompare(b.skillId),
    )[0];
    return {
      kind: "reteach",
      skillId: weakest.skillId,
      label: weakest.educatorLabel,
      mission: MISSIONS.find((m) => m.primarySkillId === weakest.skillId),
      independentOpportunities: weakest.independentOpportunities,
      opportunities: weakest.opportunities,
      withOpportunity: weakest.withOpportunity,
      rate: weakest.independentRate,
    };
  }

  // Nothing has comparable coverage. Say what has been practised least, and
  // say it as coverage rather than as a competency gap.
  const leastPractised = [...cohort.skills].sort(
    (a, b) => a.withOpportunity - b.withOpportunity || a.skillId.localeCompare(b.skillId),
  )[0];
  return {
    kind: "not-practised",
    skillId: leastPractised.skillId,
    label: leastPractised.educatorLabel,
    mission: MISSIONS.find((m) => m.primarySkillId === leastPractised.skillId),
    withOpportunity: leastPractised.withOpportunity,
  };
}
