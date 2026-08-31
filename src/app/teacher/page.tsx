import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireTeacher } from "@/lib/auth/session";
import {
  listArchivedClassesForTeacher,
  listAssignments,
  listClassesForTeacher,
  listStudents,
} from "@/lib/repo/classroom";
import { getCertification, listAttemptsForClass } from "@/lib/repo/progress";
import { nextTeachingFocus, summarizeCohort } from "@/lib/domain/evidence";
import { COMPETENCY_BY_ID } from "@/content/competencies";
import { ALL_SESSIONS, MISSION_BY_ID } from "@/content/missions";
import { CERTIFICATION_MODULES } from "@/content/certification";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Note, Stat, Tag } from "@/components/ui/Bits";
import { Meter } from "@/components/ui/Meter";

export const metadata: Metadata = { title: "Teacher overview" };

const ACCENT: Record<string, "pine" | "marigold" | "denim"> = {
  privacy: "pine",
  verification: "marigold",
  ownership: "denim",
};

export default async function TeacherOverview() {
  const { user } = await requireTeacher();
  const db = getDb();

  // Only classes this teacher is the teacher of record for. This used to hand
  // an administrator every class in the school, with a button through to each
  // roster — the second way into the same disclosure.
  const classes = listClassesForTeacher(db, user.id, user.school_id);

  /**
   * Sprint 85: archiving a class removed the only way to reach it.
   *
   * `listClassesForTeacher` filters `archived_at IS NULL`, so the moment an
   * administrator archived a cohort it left this page — and this page is the
   * only navigation to `/teacher/class/[classId]`. Sprint 84 made that page
   * honest and read-only when reached; nothing led there. The records were
   * available to whoever had kept the URL, which is not a workflow a school can
   * train a substitute or a returning teacher around.
   *
   * Listed separately and counted nowhere: the stats above, the seat figures and
   * every assignment surface stay active-only, because a parked cohort is not
   * part of this year's teaching and must not quietly rejoin it.
   */
  const archivedClasses = listArchivedClassesForTeacher(db, user.id, user.school_id);
  const archivedCards = archivedClasses.map((classroom) => ({
    classroom,
    studentCount: listStudents(db, classroom.id).length,
  }));

  const cards = classes.map((classroom) => {
    const students = listStudents(db, classroom.id);
    const assignments = listAssignments(db, classroom.id);
    const cohort = summarizeCohort({
      studentIds: students.map((s) => s.id),
      attempts: listAttemptsForClass(db, classroom.id),
      assignedMissionIds: assignments.map((a) => a.mission_id),
    });
    return { classroom, students, assignments, cohort, focus: nextTeachingFocus(cohort) };
  });

  const cert = getCertification(db, user.id);
  const certDone = Boolean(cert?.completed_at);
  const certAnswered = CERTIFICATION_MODULES.filter((m) => cert?.answers[m.id]).length;

  const totalStudents = cards.reduce((n, c) => n + c.students.length, 0);
  const overall =
    cards.length > 0
      ? cards.reduce((n, c) => n + c.cohort.completionRate, 0) / cards.length
      : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Teacher"
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description="Completion, and the skills your students have chosen unaided. Nothing here labels a child, and there is no risk score to look for."
        actions={
          <>
            <ButtonLink href="/teacher/how-to-run-a-session" variant="secondary">
              Running a session
            </ButtonLink>
            <ButtonLink href="/teacher/missions" variant="secondary">
              Mission library
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Classes" value={cards.length} />
        <Stat label="Students" value={totalStudents} />
        <Stat
          label="Assigned work completed"
          value={`${Math.round(overall * 100)}%`}
          hint="Averaged across your classes"
        />
      </div>

      {!certDone && (
        <div className="mt-5">
          <Note
            tone="marigold"
            title={
              certAnswered === 0
                ? "Your educator orientation is not started"
                : `Your educator orientation is ${certAnswered} of ${CERTIFICATION_MODULES.length} modules in`
            }
          >
            AI Ready Educator: Foundations takes about forty minutes and is designed to be
            done in two sittings.{" "}
            <Link
              href="/teacher/certification"
              className="font-semibold underline underline-offset-2"
            >
              {certAnswered === 0 ? "Start it" : "Carry on"}
            </Link>
            .
          </Note>
        </div>
      )}

      <div className="mt-8 space-y-5">
        {cards.length === 0 ? (
          // A teacher whose only classes are archived has taught here; telling
          // them they "do not have a class yet" above a list of their own
          // finished cohorts is both wrong and dismissive of the year they ran.
          <EmptyState
            title={
              archivedCards.length > 0
                ? "You do not have an active class right now"
                : "You do not have a class yet"
            }
            action={
              <ButtonLink href="/admin/classes" variant="secondary">
                Ask your administrator to create one
              </ButtonLink>
            }
          >
            {archivedCards.length > 0
              ? "Your archived classes are below and their records are still readable. A new class is created by an administrator, or by you from the administrator area if you have that access."
              : "Classes are created by an administrator, or by you from the administrator area if you have that access."}
          </EmptyState>
        ) : (
          cards.map(({ classroom, students, assignments, cohort, focus }) => (
            <Panel
              key={classroom.id}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {classroom.name}
                  <Tag>Grade {classroom.grade}</Tag>
                  <Tag tone="denim">Code {classroom.join_code}</Tag>
                </span>
              }
              description={`${students.length} students · ${assignments.length} of ${ALL_SESSIONS.length} missions assigned`}
              actions={
                <ButtonLink href={`/teacher/class/${classroom.id}`} size="sm" variant="secondary">
                  Open class
                </ButtonLink>
              }
            >
              <PanelBody className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-3">
                  <Meter
                    label="Assigned missions completed"
                    value={cohort.completionRate}
                    accent="pine"
                  />
                  {cohort.competencies.map((c) => (
                    <Meter
                      key={c.competency}
                      size="sm"
                      label={COMPETENCY_BY_ID[c.competency].formalName}
                      value={c.demonstratedRate}
                      accent={ACCENT[c.competency]}
                      valueLabel={`${Math.round(c.demonstratedRate * 100)}% of skills shown`}
                    />
                  ))}
                </div>

                <div className="rounded-lg border border-sand-deep bg-paper p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                    {focus?.kind === "not-practiced" ? "Next unpracticed skill" : "Suggested next focus"}
                  </p>
                  {focus ? (
                    <>
                      <p className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-ink">
                        {focus.label}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                        {focus.kind === "reteach" ? (
                          <>
                            Chosen first go {focus.independentOpportunities} of the{" "}
                            {focus.opportunities} times it has come up, across{" "}
                            {focus.withOpportunity} students.
                          </>
                        ) : (
                          <>
                            Not enough of this class has met this skill yet to say anything
                            about how well it is understood.{" "}
                            {focus.withOpportunity === 0
                              ? "Nobody has reached it."
                              : `${focus.withOpportunity} ${
                                  focus.withOpportunity === 1 ? "student has" : "students have"
                                } so far.`}
                          </>
                        )}
                        {focus.mission
                          ? ` The mission built around it is “${focus.mission.title}”.`
                          : ""}
                      </p>
                      {focus.mission && (
                        <Link
                          href={`/teacher/missions/${focus.mission.slug}`}
                          className="mt-3 inline-block text-sm font-semibold text-pine-deep underline underline-offset-2"
                        >
                          Open the discussion guide
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="mt-1.5 text-sm text-ink-soft">
                      Assign a mission to see a suggestion here.
                    </p>
                  )}
                </div>
              </PanelBody>

              {assignments.length > 0 && (
                <PanelBody className="border-t border-sand">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                    Completion by mission
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {cohort.missionCompletion.map((m) => {
                      const mission = MISSION_BY_ID[m.missionId];
                      if (!mission) return null;
                      return (
                        <li key={m.missionId}>
                          <Meter
                            size="sm"
                            label={mission.title}
                            value={m.completed}
                            max={students.length || 1}
                            accent={ACCENT[mission.competency]}
                            valueLabel={`${m.completed}/${students.length}`}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </PanelBody>
              )}
            </Panel>
          ))
        )}
      </div>

      {archivedCards.length > 0 && (
        <section aria-labelledby="archived-classes" className="mt-10">
          <h2
            id="archived-classes"
            className="font-display text-xl leading-tight text-ink"
          >
            Archived classes
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Finished cohorts you taught. They are read-only: nobody can join them and
            nothing in them can be changed, and they are not counted in the figures above.
            Their records are still here.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {archivedCards.map(({ classroom, studentCount }) => (
              <li
                key={classroom.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-deep bg-paper-deep px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[0.95rem] font-semibold text-ink">
                    {classroom.name}
                    {/* No join code. Archiving rotated it and it admits nobody;
                        printing it here is how a dead code reaches a board. */}
                    <Tag>Read-only</Tag>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    Grade {classroom.grade} · {classroom.school_year} · {studentCount}{" "}
                    students
                  </p>
                </div>
                <ButtonLink
                  href={`/teacher/class/${classroom.id}`}
                  size="sm"
                  variant="secondary"
                >
                  View records
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
