import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { ConfirmAction } from "@/components/staff/ConfirmAction";
import { rotateJoinCodeAction } from "@/app/actions/teacher";
import { requireTeacher } from "@/lib/auth/session";
import { canTeachClass } from "@/lib/auth/access";
import { getClass, listAssignments, listStudents } from "@/lib/repo/classroom";
import { getUser } from "@/lib/repo/school";
import { listAttemptsForClass, listBenchmarksForClass } from "@/lib/repo/progress";
import { summarizeCohort, summarizeStudent } from "@/lib/domain/evidence";
import { summarizeCohortBenchmark } from "@/lib/domain/benchmark";
import { COMPETENCIES, COMPETENCY_BY_ID } from "@/content/competencies";
import { ALL_SESSIONS, FOUNDATIONS_BY_TRACK, MISSIONS, MISSION_BY_ID, trackForGrade } from "@/content/missions";
import { Avatar } from "@/components/art/Avatar";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Note, Stat, Tag } from "@/components/ui/Bits";
import { Meter } from "@/components/ui/Meter";
import { AssignToggle } from "@/components/staff/AssignToggle";
import { AddStudentForm } from "@/components/staff/AddStudentForm";
import { RemoveStudentButton } from "@/components/staff/RemoveStudentButton";
import { RenameStudentForm } from "@/components/staff/RenameStudentForm";

export const metadata: Metadata = { title: "Class" };

const ACCENT: Record<string, "pine" | "marigold" | "denim"> = {
  privacy: "pine",
  verification: "marigold",
  ownership: "denim",
};

const DOT: Record<string, string> = {
  demonstrated: "bg-pine",
  developing: "bg-marigold",
  "not-yet": "bg-sand-deep",
};

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const { user } = await requireTeacher();
  const db = getDb();

  // Ownership, not school membership. An administrator reaching this URL gets
  // the same 404 as a stranger: the product promises them aggregates, and this
  // page renders named children beside their individual evidence.
  const found = getClass(db, classId);
  if (!canTeachClass(user, found)) notFound();
  const classroom = found!;

  const teacher = getUser(db, classroom.teacher_id);
  const students = listStudents(db, classId);
  const assignments = listAssignments(db, classId);
  const assignedIds = new Set(assignments.map((a) => a.mission_id));
  const attempts = listAttemptsForClass(db, classId);
  const cohort = summarizeCohort({
    studentIds: students.map((s) => s.id),
    attempts,
    assignedMissionIds: assignments.map((a) => a.mission_id),
  });
  const bench = summarizeCohortBenchmark(listBenchmarksForClass(db, classId));

  const byStudent = new Map(students.map((s) => [s.id, [] as typeof attempts]));
  for (const a of attempts) byStudent.get(a.student_id)?.push(a);

  // Counted across every mission, not only the assigned ones. Unassigning a
  // mission hides it from students; it does not undo the work they did, and
  // showing "0 of 23 finished" next to a mission the class already completed
  // would be plainly wrong.
  const completedByMission = new Map<string, number>();
  for (const attempt of attempts) {
    if (!attempt.completed_at) continue;
    completedByMission.set(
      attempt.mission_id,
      (completedByMission.get(attempt.mission_id) ?? 0) + 1,
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={teacher ? teacher.name : "Class"}
        title={classroom.name}
        description={`Grade ${classroom.grade} · ${classroom.school_year} · ${students.length} students`}
        actions={
          <div className="rounded-lg border-2 border-denim bg-denim-wash px-4 py-2 text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-denim-deep">
              Class code
            </p>
            <p className="font-display text-xl tracking-[0.1em] text-ink">
              {classroom.join_code}
            </p>
            <div className="mt-1.5">
              <ConfirmAction
                tone="quiet"
                label="New code"
                confirmLabel="Change it"
                question="Everybody will need the new code: anybody halfway through joining, and any student already signed in with the old one, who is asked to rejoin next time they load a page. Change it?"
                action={rotateJoinCodeAction.bind(null, classroom.id)}
              />
            </div>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Students" value={students.length} />
        <Stat label="Missions assigned" value={`${assignments.length} of ${ALL_SESSIONS.length}`} />
        <Stat
          label="Assigned work completed"
          value={`${Math.round(cohort.completionRate * 100)}%`}
        />
        <Stat
          label="Check-ins finished"
          value={`${bench.preCompleted} / ${bench.postCompleted}`}
          hint="Fall / spring"
        />
      </div>

      {/* Assignments */}
      <div className="mt-8">
        <Panel
          title="Assigned missions"
          description="Turn a mission on and it appears on every student's map in this class straight away."
        >
          <PanelBody className="space-y-5">
            {/* The First Look track written for this class's grade. The other
                track is a click away in the library; putting both here would
                offer a grade 1 teacher three sessions pitched at grade 5. */}
            {[
              {
                id: "first-look",
                label: `First Look · grades ${
                  trackForGrade(classroom.grade) === "early" ? "1 and 2" : "3 to 5"
                }`,
                missions: FOUNDATIONS_BY_TRACK[trackForGrade(classroom.grade)],
              },
              ...COMPETENCIES.map((competency) => ({
                id: competency.id,
                label: competency.formalName,
                missions: MISSIONS.filter((m) => m.competency === competency.id),
              })),
            ].map((group) => (
              <div key={group.id}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  {group.label}
                </h3>
                <ul className="mt-2 space-y-2">
                  {group.missions.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand bg-paper px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/teacher/missions/${m.slug}`}
                          className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
                        >
                          {m.title}
                        </Link>
                        <p className="text-xs text-ink-soft">
                          {m.estimatedMinutes} min · {completedByMission.get(m.id) ?? 0} of{" "}
                          {students.length} finished ·{" "}
                          <Link
                            href={`/teacher/classroom/${m.slug}`}
                            className="font-semibold text-pine-deep underline underline-offset-2"
                          >
                            Teach on the board
                          </Link>
                        </p>
                      </div>
                      <AssignToggle
                        classId={classroom.id}
                        missionId={m.id}
                        missionTitle={m.title}
                        className={classroom.name}
                        assigned={assignedIds.has(m.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      {/* Competency evidence */}
      <div className="mt-6">
        <Panel
          title="Competency evidence"
          description="How many students have chosen a skillful response unaided at least once. Reaching the same answer after a Try again does not count here."
        >
          <PanelBody className="grid gap-4 sm:grid-cols-3">
            {COMPETENCIES.map((competency) => (
              <div key={competency.id}>
                <h3 className="text-sm font-semibold text-ink">{competency.formalName}</h3>
                <ul className="mt-2.5 space-y-2.5">
                  {cohort.skills
                    .filter((s) => s.competency === competency.id)
                    .map((s) => (
                      <li key={s.skillId}>
                        <Meter
                          size="sm"
                          label={s.educatorLabel}
                          value={s.demonstratedRate}
                          accent={ACCENT[competency.id]}
                          valueLabel={
                            s.withOpportunity === 0
                              ? "not met yet"
                              : `${s.demonstrated}/${s.withOpportunity} met it`
                          }
                        />
                        {s.opportunities > 0 && (
                          <p className="mt-1 text-xs text-ink-faint">
                            {s.independentOpportunities} of {s.opportunities} times it came
                            up, it was chosen first go
                          </p>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>

      {/* Roster */}
      <div className="mt-6">
        <Panel
          title="Roster"
          description="One row per student. Green means chosen unaided at least once. Amber means a partly-right choice, or the safe answer reached after a Try again. Gray means no evidence yet."
        >
          {students.length === 0 ? (
            <PanelBody>
              <EmptyState title="Nobody on this roster yet">
                Add students below. They join by typing the class code and tapping their own
                name, so there is nothing else to set up.
              </EmptyState>
            </PanelBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-sm">
                <caption className="sr-only">
                  Students in {classroom.name} with missions completed and skills demonstrated
                </caption>
                <thead>
                  <tr className="border-b border-sand text-left">
                    <th scope="col" className="px-5 py-2.5 font-semibold text-ink-soft">
                      Student
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">
                      Missions
                    </th>
                    {COMPETENCIES.map((c) => (
                      <th key={c.id} scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">
                        {c.name}
                      </th>
                    ))}
                    <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">
                      Skills shown
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold text-ink-soft">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const summary = summarizeStudent(byStudent.get(student.id) ?? []);
                    return (
                      <tr key={student.id} className="border-b border-sand last:border-0">
                        <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                          <span className="flex items-center gap-2.5">
                            <Avatar avatarKey={student.avatar_key} size={26} />
                            {student.display_name}
                          </span>
                        </th>
                        <td className="ark-tabular px-3 py-2.5 text-ink-soft">
                          {summary.completedMissionIds.length}
                          <span className="text-ink-faint">/{assignments.length}</span>
                        </td>
                        {COMPETENCIES.map((c) => (
                          <td key={c.id} className="px-3 py-2.5">
                            <span className="flex gap-1.5">
                              {c.skills.map((skill) => {
                                const state =
                                  summary.evidence[skill.id] ?? ("not-yet" as const);
                                return (
                                  <span
                                    key={skill.id}
                                    title={`${skill.educatorLabel}: ${state}`}
                                    className={`h-3.5 w-3.5 rounded-sm ${DOT[state]}`}
                                  >
                                    <span className="sr-only">
                                      {skill.educatorLabel}: {state}
                                    </span>
                                  </span>
                                );
                              })}
                            </span>
                          </td>
                        ))}
                        <td className="ark-tabular px-3 py-2.5 font-semibold text-ink">
                          {summary.skillsDemonstrated}
                          <span className="font-normal text-ink-faint">
                            /{summary.skillsTotal}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <RenameStudentForm
                              classId={classroom.id}
                              studentId={student.id}
                              displayName={student.display_name}
                            />
                            <RemoveStudentButton
                              classId={classroom.id}
                              studentId={student.id}
                              displayName={student.display_name}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <PanelBody className="border-t border-sand">
            <AddStudentForm classId={classroom.id} />
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Note tone="neutral" title="What this page deliberately does not show">
          There is no overall score, no ranking, no risk band and no inference about a
          child&rsquo;s judgment or character. A gray square means a mission has not been
          played, not that a student would make an unsafe choice.
        </Note>
        <Note tone="denim" title="Check-in windows">
          {bench.postCompleted === 0
            ? `${bench.preCompleted} students finished the fall check-in. The spring window has not been run for this class yet.`
            : `${bench.matched} students finished both windows. The change between them is ${
                bench.pointsDifference === null
                  ? "not available"
                  : `${bench.pointsDifference > 0 ? "+" : ""}${Math.round(bench.pointsDifference)} points`
              }. Aggregate figures only — individual check-in answers are not shown to anyone.`}
        </Note>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Assigned missions:{" "}
        {assignments.length === 0
          ? "none yet."
          : assignments
              .map((a) => MISSION_BY_ID[a.mission_id]?.title)
              .filter(Boolean)
              .join(", ")}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/teacher" variant="secondary" size="sm">
          ← All classes
        </ButtonLink>
        <ButtonLink href="/teacher/missions" variant="secondary" size="sm">
          Mission library
        </ButtonLink>
        <Tag tone="pine">
          {COMPETENCY_BY_ID.privacy.name}, {COMPETENCY_BY_ID.verification.name} and{" "}
          {COMPETENCY_BY_ID.ownership.name}
        </Tag>
      </div>
    </div>
  );
}
