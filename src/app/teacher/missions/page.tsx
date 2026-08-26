import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { listAssignments, listClasses, listClassesForTeacher } from "@/lib/repo/classroom";
import { COMPETENCIES } from "@/content/competencies";
import { MISSIONS } from "@/content/missions";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { Note, Tag } from "@/components/ui/Bits";
import { AssignToggle } from "@/components/staff/AssignToggle";

export const metadata: Metadata = { title: "Mission library" };

const WASH: Record<string, string> = {
  pine: "bg-pine-wash border-pine",
  marigold: "bg-marigold-wash border-marigold",
  denim: "bg-denim-wash border-denim",
};

export default async function MissionLibrary() {
  const { user } = await requireStaff();
  const db = getDb();
  const classes =
    user.role === "admin" ? listClasses(db, user.school_id) : listClassesForTeacher(db, user.id);

  const assignedByClass = new Map(
    classes.map((c) => [c.id, new Set(listAssignments(db, c.id).map((a) => a.mission_id))]),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Teacher"
        title="Mission library"
        description="Every branch of every mission is written out and previewable before you assign it. Nothing is generated at run time, so what you read here is exactly what a student can see."
      />

      <Note tone="pine" title="Suggested order">
        Run the three privacy missions first, then verification, then learning ownership.
        “The Spelling Test Surprise” lands best after students have used a tool for
        something real, so it is worth saving for late in the year.
      </Note>

      <div className="mt-7 space-y-7">
        {COMPETENCIES.map((competency) => (
          <section key={competency.id} aria-labelledby={`lib-${competency.id}`}>
            <h2 id={`lib-${competency.id}`} className="font-display text-xl text-ink">
              {competency.formalName}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
              {competency.educatorBlurb}
            </p>

            <div className="mt-4 space-y-4">
              {MISSIONS.filter((m) => m.competency === competency.id).map((mission) => (
                <Panel
                  key={mission.id}
                  title={
                    <Link
                      href={`/teacher/missions/${mission.slug}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {mission.title}
                    </Link>
                  }
                  description={mission.summary}
                  actions={
                    <span className="flex items-center gap-2">
                      <Tag>{mission.estimatedMinutes} min</Tag>
                      <Tag tone="neutral">
                        {mission.scenes.filter((s) => s.choices?.length).length} decisions
                      </Tag>
                    </span>
                  }
                >
                  <PanelBody className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                        Learning goals
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {mission.learningGoals.map((goal) => (
                          <li
                            key={goal}
                            className="flex gap-2 text-sm leading-relaxed text-ink-soft"
                          >
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                competency.accent === "pine"
                                  ? "bg-pine"
                                  : competency.accent === "marigold"
                                    ? "bg-marigold-deep"
                                    : "bg-denim"
                              }`}
                            />
                            {goal}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <Link
                          href={`/teacher/classroom/${mission.slug}`}
                          className="font-semibold text-pine-deep underline underline-offset-2"
                        >
                          Teach it on the board
                        </Link>
                        <Link
                          href={`/teacher/missions/${mission.slug}`}
                          className="font-semibold text-pine-deep underline underline-offset-2"
                        >
                          Preview every branch
                        </Link>
                        <Link
                          href={`/teacher/guides/${mission.slug}`}
                          className="font-semibold text-pine-deep underline underline-offset-2"
                        >
                          Printable discussion guide
                        </Link>
                        <Link
                          href={`/family/${mission.slug}`}
                          className="font-semibold text-pine-deep underline underline-offset-2"
                        >
                          Family take-home
                        </Link>
                      </div>
                    </div>

                    <div
                      className={`min-w-[13rem] rounded-lg border p-3.5 ${WASH[competency.accent]}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
                        Assign to
                      </p>
                      <ul className="mt-2 space-y-2">
                        {classes.map((c) => (
                          <li key={c.id} className="flex items-center justify-between gap-2">
                            <span className="text-sm text-ink">{c.name}</span>
                            <AssignToggle
                              classId={c.id}
                              missionId={mission.id}
                              missionTitle={mission.title}
                              className={c.name}
                              assigned={assignedByClass.get(c.id)?.has(mission.id) ?? false}
                            />
                          </li>
                        ))}
                        {classes.length === 0 && (
                          <li className="text-sm text-ink-soft">No classes yet.</li>
                        )}
                      </ul>
                    </div>
                  </PanelBody>
                </Panel>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
