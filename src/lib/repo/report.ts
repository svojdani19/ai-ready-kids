import "server-only";
import type { Db } from "@/lib/db";
import { COMPETENCY_BY_ID, COMPETENCY_IDS } from "@/content/competencies";
import { MISSIONS, MISSION_BY_ID } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";
import { summariseCohort } from "@/lib/domain/evidence";
import { summariseCohortBenchmark, type CohortBenchmark } from "@/lib/domain/benchmark";
import { listAssignments, listClasses, listStudents } from "./classroom";
import { listAttemptsForClass, listBenchmarksForClass, listCertifications } from "./progress";
import { getSchool, listUsers } from "./school";
import type { School } from "@/lib/types";
import type { CompetencyId } from "@/content/types";

/**
 * Minimum group size for anything that leaves the building.
 *
 * A percentage over three students is a description of three children. Cells
 * below this threshold are reported as null and rendered as "too few to
 * report" rather than as a number, which is the same convention state report
 * cards use.
 */
export const MIN_REPORTABLE_GROUP = 5;

export interface ClassReport {
  classId: string;
  className: string;
  grade: number;
  teacherName: string;
  students: number;
  assignedMissions: number;
  completionRate: number | null;
  competencies: { competency: CompetencyId; demonstratedRate: number | null }[];
  suppressed: boolean;
}

export interface SchoolReport {
  generatedAt: string;
  school: Pick<School, "name" | "district" | "city" | "state"> & {
    schoolYear: string;
    termStartsOn: string;
    termRenewsOn: string;
    plan: string;
    licensedStudents: number;
    retentionMonths: number;
  };
  totals: {
    classes: number;
    students: number;
    teachers: number;
    missionsAvailable: number;
    assignmentsMade: number;
    missionsCompleted: number;
    completionRate: number;
  };
  competencies: {
    competency: CompetencyId;
    label: string;
    demonstratedRate: number | null;
    demonstrated: number;
    possible: number;
  }[];
  missions: { missionId: string; title: string; completed: number; assignedTo: number }[];
  byClass: ClassReport[];
  byGrade: { grade: number; students: number; completionRate: number | null }[];
  benchmark: CohortBenchmark;
  certification: { completed: number; total: number; modules: number };
  privacy: string[];
}

function rateOrSuppress(rate: number, groupSize: number): number | null {
  return groupSize >= MIN_REPORTABLE_GROUP ? rate : null;
}

export function buildSchoolReport(db: Db, schoolId: string, now = new Date()): SchoolReport {
  const school = getSchool(db, schoolId);
  if (!school) throw new Error("Unknown school");

  const classes = listClasses(db, schoolId);
  const teachers = listUsers(db, schoolId, "teacher");
  const certs = listCertifications(db, schoolId);

  const perClass = classes.map((classroom) => {
    const students = listStudents(db, classroom.id);
    const assignments = listAssignments(db, classroom.id);
    const cohort = summariseCohort({
      studentIds: students.map((s) => s.id),
      attempts: listAttemptsForClass(db, classroom.id),
      assignedMissionIds: assignments.map((a) => a.mission_id),
    });
    const teacher = teachers.find((t) => t.id === classroom.teacher_id);
    return { classroom, students, assignments, cohort, teacherName: teacher?.name ?? "Unassigned" };
  });

  const allStudents = perClass.reduce((n, c) => n + c.students.length, 0);
  const assignmentsMade = perClass.reduce((n, c) => n + c.assignments.length, 0);
  const missionsCompleted = perClass.reduce(
    (n, c) => n + c.cohort.missionCompletion.reduce((m, x) => m + x.completed, 0),
    0,
  );
  const possible = perClass.reduce(
    (n, c) => n + c.students.length * c.assignments.length,
    0,
  );

  const competencies = COMPETENCY_IDS.map((competency) => {
    const demonstrated = perClass.reduce(
      (n, c) => n + (c.cohort.competencies.find((x) => x.competency === competency)?.demonstrated ?? 0),
      0,
    );
    const totalPossible = perClass.reduce(
      (n, c) => n + (c.cohort.competencies.find((x) => x.competency === competency)?.possible ?? 0),
      0,
    );
    return {
      competency,
      label: COMPETENCY_BY_ID[competency].formalName,
      demonstrated,
      possible: totalPossible,
      demonstratedRate: rateOrSuppress(
        totalPossible ? demonstrated / totalPossible : 0,
        allStudents,
      ),
    };
  });

  const missions = MISSIONS.map((mission) => ({
    missionId: mission.id,
    title: mission.title,
    completed: perClass.reduce(
      (n, c) =>
        n + (c.cohort.missionCompletion.find((m) => m.missionId === mission.id)?.completed ?? 0),
      0,
    ),
    assignedTo: perClass.filter((c) => c.assignments.some((a) => a.mission_id === mission.id))
      .length,
  }));

  const grades = [...new Set(classes.map((c) => c.grade))].sort();
  const byGrade = grades.map((grade) => {
    const inGrade = perClass.filter((c) => c.classroom.grade === grade);
    const students = inGrade.reduce((n, c) => n + c.students.length, 0);
    const gradePossible = inGrade.reduce((n, c) => n + c.students.length * c.assignments.length, 0);
    const gradeDone = inGrade.reduce(
      (n, c) => n + c.cohort.missionCompletion.reduce((m, x) => m + x.completed, 0),
      0,
    );
    return {
      grade,
      students,
      completionRate: rateOrSuppress(gradePossible ? gradeDone / gradePossible : 0, students),
    };
  });

  const benchmark = summariseCohortBenchmark(
    classes.flatMap((c) => listBenchmarksForClass(db, c.id)),
  );

  return {
    generatedAt: now.toISOString(),
    school: {
      name: school.name,
      district: school.district,
      city: school.city,
      state: school.state,
      schoolYear: classes[0]?.school_year ?? "",
      termStartsOn: school.term_starts_on,
      termRenewsOn: school.term_renews_on,
      plan: school.plan,
      licensedStudents: school.licensed_students,
      retentionMonths: school.retention_months,
    },
    totals: {
      classes: classes.length,
      students: allStudents,
      teachers: teachers.length,
      missionsAvailable: MISSIONS.length,
      assignmentsMade,
      missionsCompleted,
      completionRate: possible ? missionsCompleted / possible : 0,
    },
    competencies,
    missions,
    byClass: perClass.map(({ classroom, students, assignments, cohort, teacherName }) => ({
      classId: classroom.id,
      className: classroom.name,
      grade: classroom.grade,
      teacherName,
      students: students.length,
      assignedMissions: assignments.length,
      completionRate: rateOrSuppress(cohort.completionRate, students.length),
      competencies: cohort.competencies.map((c) => ({
        competency: c.competency,
        demonstratedRate: rateOrSuppress(c.demonstratedRate, students.length),
      })),
      suppressed: students.length < MIN_REPORTABLE_GROUP,
    })),
    byGrade,
    benchmark,
    certification: {
      completed: certs.filter((c) => c.completed_at).length,
      total: teachers.length,
      modules: CERTIFICATION_MODULES.length,
    },
    privacy: [
      "This report contains no student names, initials, identifiers, dates of birth or free text written by a child.",
      `Any group smaller than ${MIN_REPORTABLE_GROUP} students is reported as "too few to report" rather than as a percentage.`,
      "Figures describe demonstrated competencies from authored choices. They are not risk scores, behavioural predictions or psychological assessments.",
      "Check-in results are reported only in aggregate. No individual student's answers appear anywhere in this export.",
    ],
  };
}

export function reportToCsv(report: SchoolReport): string {
  const rows: string[][] = [];
  const push = (...cells: (string | number | null)[]) =>
    rows.push(cells.map((c) => (c === null ? "too few to report" : String(c))));

  push("AI Ready Kids school report");
  push("School", report.school.name);
  push("District", report.school.district);
  push("School year", report.school.schoolYear);
  push("Generated", report.generatedAt);
  push();

  push("Section", "Metric", "Value");
  push("Totals", "Classes", report.totals.classes);
  push("Totals", "Students", report.totals.students);
  push("Totals", "Teachers", report.totals.teachers);
  push("Totals", "Assignments made", report.totals.assignmentsMade);
  push("Totals", "Missions completed", report.totals.missionsCompleted);
  push("Totals", "Completion rate", `${Math.round(report.totals.completionRate * 100)}%`);
  push();

  push("Competency", "Skills demonstrated rate");
  for (const c of report.competencies) {
    push(c.label, c.demonstratedRate === null ? null : `${Math.round(c.demonstratedRate * 100)}%`);
  }
  push();

  push("Class", "Grade", "Teacher", "Students", "Missions assigned", "Completion");
  for (const c of report.byClass) {
    push(
      c.className,
      c.grade,
      c.teacherName,
      c.students,
      c.assignedMissions,
      c.completionRate === null ? null : `${Math.round(c.completionRate * 100)}%`,
    );
  }
  push();

  push("Mission", "Assigned to classes", "Students completed");
  for (const m of report.missions) push(m.title, m.assignedTo, m.completed);
  push();

  push("Benchmark", "Value");
  push("Fall check-ins completed", report.benchmark.preCompleted);
  push("Spring check-ins completed", report.benchmark.postCompleted);
  push("Matched students", report.benchmark.matched);
  push(
    "Matched growth (percentage points)",
    report.benchmark.growthPoints === null
      ? null
      : Math.round(report.benchmark.growthPoints * 10) / 10,
  );
  push();

  push("Privacy notes");
  for (const note of report.privacy) push(note);

  return rows
    .map((row) =>
      row
        .map((cell) => (/[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell))
        .join(","),
    )
    .join("\n");
}

export const REPORT_MISSION_TITLES = Object.fromEntries(
  Object.values(MISSION_BY_ID).map((m) => [m.id, m.title]),
);
