import "server-only";
import { isRecognisedRetention } from "@/lib/domain/retention";
import type { Db } from "@/lib/db";
import { COMPETENCY_BY_ID, COMPETENCY_IDS } from "@/content/competencies";
import { MISSIONS, MISSION_BY_ID } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";
import { summariseCohort } from "@/lib/domain/evidence";
import {
  MIN_BENCHMARK_GROUP,
  summariseCohortBenchmark,
  type CohortBenchmark,
} from "@/lib/domain/benchmark";
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
  competencies: {
    competency: CompetencyId;
    demonstratedRate: number | null;
    /** Distinct students who contributed to this figure. */
    contributors: number;
  }[];
  suppressed: boolean;
}

export interface SchoolReport {
  generatedAt: string;
  school: Pick<School, "name" | "district" | "city" | "state"> & {
    schoolYear: string;
    /**
     * Retention as policy, not as a stored number.
     *
     * Sprint 57: this object is buyer-facing output — the JSON download
     * serialises all of it — and it carried `plan`, `licensedStudents` and
     * `retentionMonths` raw. So a district-office export could assert
     * `plan: "classrooms"`, `licensedStudents: -5` and `retentionMonths: -12`
     * as though they were the contract, while Program, Overview and Data all
     * correctly refused to present those same values. `plan` and
     * `licensedStudents` are gone entirely: they are account metadata with no
     * consumer in either export or on the printed report, and a report about
     * demonstrated competencies is not where a school's commercial terms
     * belong.
     */
    retention: { status: "configured"; months: number } | { status: "needs-configuration" };
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
    /** Null alongside a suppressed rate: the raw pair counts disclose it too. */
    demonstrated: number | null;
    possible: number | null;
    /** Distinct students across all classes who contributed to this figure. */
    contributors: number;
  }[];
  missions: { missionId: string; title: string; completed: number; assignedTo: number }[];
  byClass: ClassReport[];
  byGrade: { grade: number; students: number; completionRate: number | null }[];
  benchmark: CohortBenchmark;
  certification: { completed: number; total: number; modules: number };
  privacy: string[];
}

/**
 * Suppress a rate unless enough **distinct students actually contributed to
 * that figure**. The group size passed in must never be a roster count or a
 * count of student-skill pairs: a school of thirty where one child completed
 * the only relevant mission has a contributing group of one, however many are
 * enrolled, and reporting it as a percentage discloses that child in a class
 * small enough for a principal to work out who.
 *
 * The one deliberate exception is completion rate, where every assigned student
 * is a contributor by construction — a completion figure is over the whole
 * class by definition. That is called out separately in the privacy notes
 * rather than being folded into the same sentence.
 */
function rateOrSuppress(rate: number, contributors: number): number | null {
  return contributors >= MIN_REPORTABLE_GROUP ? rate : null;
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
    const cells = perClass.map((c) =>
      c.cohort.competencies.find((x) => x.competency === competency),
    );
    const demonstrated = cells.reduce((n, x) => n + (x?.demonstrated ?? 0), 0);
    const totalPossible = cells.reduce((n, x) => n + (x?.possible ?? 0), 0);
    // Deduplicated across classes before the threshold is checked.
    const contributors = new Set(cells.flatMap((x) => x?.contributorIds ?? [])).size;
    const rate = rateOrSuppress(totalPossible ? demonstrated / totalPossible : 0, contributors);
    return {
      competency,
      label: COMPETENCY_BY_ID[competency].formalName,
      // The raw counts disclose the same thing the rate would, so they go too.
      demonstrated: rate === null ? null : demonstrated,
      possible: rate === null ? null : totalPossible,
      contributors,
      demonstratedRate: rate,
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
      // The school's deliberate current year. Taking it from whichever class
      // sorted first meant a mixed-cohort school got labelled by an accident
      // of ordering.
      schoolYear: school.academic_year,
      retention: isRecognisedRetention(school.retention_months)
        ? { status: "configured", months: school.retention_months }
        : { status: "needs-configuration" },
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
        // This class's own distinct contributors, not its roster.
        demonstratedRate: rateOrSuppress(c.demonstratedRate, c.contributorIds.length),
        contributors: c.contributorIds.length,
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
      `Every competency figure reads "too few to report" unless at least ${MIN_REPORTABLE_GROUP} distinct students contributed to that particular figure. Contributing means having completed a mission that offered the skill, which is usually fewer students than are enrolled.`,
      `Check-in rates read "too few to report" unless at least ${MIN_BENCHMARK_GROUP} students completed that window. The fall-to-spring change is withheld unless at least ${MIN_BENCHMARK_GROUP} students completed both windows, and the same threshold applies to every per-competency figure.`,
      "Completion rates are the one figure calculated over everybody assigned, because there the contributing group is the whole class by definition. They are suppressed on class size.",
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
    "Change between check-ins in percentage points (matched students)",
    report.benchmark.pointsDifference === null
      ? null
      : Math.round(report.benchmark.pointsDifference * 10) / 10,
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
