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
 */

export interface SkillState {
  skillId: string;
  competency: CompetencyId;
  result: EvidenceResult | "not-yet";
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
  const completed = attempts.filter((a) => a.completed_at);
  const evidence = mergeEvidence(completed.map((a) => a.evidence));

  const skills: SkillState[] = COMPETENCIES.flatMap((c) =>
    c.skills.map((s) => ({
      skillId: s.id,
      competency: c.id,
      result: evidence[s.id] ?? ("not-yet" as const),
    })),
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
  demonstrated: number;
  developing: number;
  notYet: number;
  /** Share of students with any completed mission touching this skill. */
  demonstratedRate: number;
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
      return {
        skillId: s.id,
        competency: c.id,
        educatorLabel: SKILL_BY_ID[s.id].educatorLabel,
        demonstrated,
        developing,
        notYet: states.length - demonstrated - developing,
        demonstratedRate: states.length ? demonstrated / states.length : 0,
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

  const competencies = COMPETENCY_IDS.map((id) => {
    const own = skills.filter((s) => s.competency === id);
    const demonstrated = own.reduce((n, s) => n + s.demonstrated, 0);
    const possible = own.length * studentIds.length;
    return {
      competency: id,
      demonstrated,
      possible,
      demonstratedRate: possible ? demonstrated / possible : 0,
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
 * Instructional next step for a class: the skill the fewest students have
 * demonstrated, expressed as something to teach rather than a deficiency.
 */
export function nextTeachingFocus(
  cohort: CohortSummary,
): { skillId: string; label: string; mission: Mission | undefined; rate: number } | undefined {
  const covered = cohort.skills.filter((s) => s.demonstrated + s.developing > 0);
  const pool = covered.length ? covered : cohort.skills;
  const weakest = [...pool].sort((a, b) => a.demonstratedRate - b.demonstratedRate)[0];
  if (!weakest) return undefined;
  return {
    skillId: weakest.skillId,
    label: weakest.educatorLabel,
    mission: MISSIONS.find((m) => m.primarySkillId === weakest.skillId),
    rate: weakest.demonstratedRate,
  };
}
