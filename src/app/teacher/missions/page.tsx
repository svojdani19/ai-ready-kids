import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { listAssignments, listClasses, listClassesForTeacher } from "@/lib/repo/classroom";
import { COMPETENCIES } from "@/content/competencies";
import { FOUNDATIONS_BY_TRACK, FOUNDATION_TRACKS, MISSIONS } from "@/content/missions";
import type { Classroom } from "@/lib/types";
import type { Mission } from "@/content/types";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { Note, Tag } from "@/components/ui/Bits";
import { ButtonLink } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { AssignToggle } from "@/components/staff/AssignToggle";
import { classMayBeAssigned } from "@/lib/domain/eligibility";
import { requireOpenCurriculum } from "@/lib/auth/instruction-access";
import { CurriculumClosed } from "@/components/staff/CurriculumClosed";

export const metadata: Metadata = { title: "Mission library" };

const WASH: Record<string, string> = {
  pine: "bg-pine-wash border-pine",
  marigold: "bg-marigold-wash border-marigold",
  denim: "bg-denim-wash border-denim",
};

const DOT: Record<string, string> = {
  pine: "bg-pine",
  marigold: "bg-marigold-deep",
  denim: "bg-denim",
};

/**
 * One library card. Identical for a First Look session and a core mission
 * except for the two things that genuinely differ: a First Look card carries
 * its big idea and its grade band, because that is what a teacher is choosing
 * between when the same three ideas exist in two tiers.
 */
/**
 * The first sentence of a mission's summary, for the card face.
 *
 * The whole summary is two or three sentences of teaching purpose and belongs
 * on the card, but not before a teacher has decided this is the mission they
 * want. It is directly below, under its own label.
 */
function firstSentence(text: string): string {
  const end = text.indexOf(". ");
  return end === -1 ? text : text.slice(0, end + 1);
}

function SessionCard({
  mission,
  accent,
  classes,
  assignedByClass,
}: {
  mission: Mission;
  accent: string;
  classes: Classroom[];
  assignedByClass: Map<string, Set<string>>;
}) {
  const isFoundation = mission.segment === "foundation";
  const assignedCount = classes.filter((c) => assignedByClass.get(c.id)?.has(mission.id)).length;
  return (
    <Panel
      title={
        <Link
          href={`/teacher/missions/${mission.slug}`}
          className="underline-offset-2 hover:underline"
        >
          {mission.title}
        </Link>
      }
      description={firstSentence(mission.summary)}
      actions={
        <span className="flex flex-wrap items-center gap-2">
          <Tag>{mission.estimatedMinutes} min</Tag>
          <Tag tone="neutral">
            {mission.scenes.filter((s) => s.choices?.length).length} decisions
          </Tag>
          {/* Sprint 85 acceptance: every card, not only First Look. The Plans
              page says every mission card shows its grade band, and it did not. */}
          <Tag tone="neutral">Grades {mission.gradeBand}</Tag>
          <Tag tone={assignedCount > 0 ? "pine" : "neutral"}>
            {assignedCount === 0
              ? "Not assigned"
              : `Assigned to ${assignedCount} of ${classes.length}`}
          </Tag>
        </span>
      }
    >
      <PanelBody className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          {isFoundation && mission.bigIdea && (
            <p className="mb-3 rounded-lg border-2 border-sand-deep bg-paper px-3.5 py-2.5 text-sm leading-relaxed text-ink">
              <span className="font-semibold">Big idea: </span>
              {mission.bigIdea}
            </p>
          )}
          <Disclosure summary="What it teaches, and the learning goals">
            <p>{mission.summary}</p>
            <ul className="mt-3 space-y-1.5">
              {mission.learningGoals.map((goal) => (
                <li key={goal} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[accent]}`}
                  />
                  {goal}
                </li>
              ))}
            </ul>
          </Disclosure>
          <div className="mt-3.5 flex flex-wrap items-center gap-3 text-sm">
            <ButtonLink href={`/teacher/classroom/${mission.slug}`} size="sm">
              Teach it on the board
            </ButtonLink>
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

        <div className={`min-w-[13rem] rounded-lg border p-3.5 ${WASH[accent]}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
            Assign to
          </p>
          <ul className="mt-2 space-y-2">
            {classes.map((c) => {
              // An ineligible switch is a control that exists to be refused.
              // The state is shown instead, naming the band and the grade, so
              // the server refusal stays a backstop rather than the workflow.
              const eligible = classMayBeAssigned(c.grade, mission);
              return (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink">{c.name}</span>
                  {eligible ? (
                    <AssignToggle
                      classId={c.id}
                      missionId={mission.id}
                      missionTitle={mission.title}
                      className={c.name}
                      assigned={assignedByClass.get(c.id)?.has(mission.id) ?? false}
                    />
                  ) : (
                    <span className="text-right text-xs leading-snug text-ink-faint">
                      Grades {mission.gradeBand} · unavailable for Grade {c.grade}
                    </span>
                  )}
                </li>
              );
            })}
            {classes.length === 0 && <li className="text-sm text-ink-soft">No classes yet.</li>}
          </ul>
        </div>
      </PanelBody>
    </Panel>
  );
}

export default async function MissionLibrary() {
  const gate = await requireOpenCurriculum();
  if (!gate.open) return <CurriculumClosed reason={gate.reason} role={gate.user.role} />;
  const user = gate.user;
  const db = getDb();
  const classes =
    user.role === "admin" ? listClasses(db, user.school_id) : listClassesForTeacher(db, user.id, user.school_id);

  const assignedByClass = new Map(
    classes.map((c) => [c.id, new Set(listAssignments(db, c.id).map((a) => a.mission_id))]),
  );

  const accentOf = (mission: Mission) =>
    COMPETENCIES.find((c) => c.id === mission.competency)!.accent;

  return (
    <div>
      <PageHeader
        eyebrow="Teacher"
        title="Mission library"
        description="Every branch of every mission is written out and previewable before you assign it. Nothing is generated at run time, so what you read here is exactly what a student can see."
      />

      <Note tone="pine" title="Suggested order">
        Start with the three First Look sessions written for your grade. They take a week
        between them and the rest of the year assumes them. After that run the three
        privacy missions, then verification, then learning ownership. “The Spelling Test
        Surprise” lands best after students have used a tool for something real, so it is
        worth saving for late in the year.
      </Note>

      <div className="mt-7 space-y-9">
        <section aria-labelledby="lib-first-look">
          <h2 id="lib-first-look" className="font-display text-xl text-ink">
            First Look
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
            The introduction, for a class that has not been told what AI is. Two grade
            tiers cover the same three ideas: what a guessing machine is, where one already
            sits in an ordinary day, and who is in charge of it. These sessions record no
            skill evidence. They check that an idea landed, and the roster reports only the
            nine skills the core missions actually rehearse.
          </p>

          <div className="mt-4 space-y-7">
            {FOUNDATION_TRACKS.map((track) => (
              <div key={track.id}>
                <h3 className="font-display text-lg text-ink">
                  {track.name} · {track.grades}
                </h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
                  {track.blurb}
                </p>
                <div className="mt-3 space-y-4">
                  {FOUNDATIONS_BY_TRACK[track.id].map((mission) => (
                    <SessionCard
                      key={mission.id}
                      mission={mission}
                      accent={accentOf(mission)}
                      classes={classes}
                      assignedByClass={assignedByClass}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

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
                <SessionCard
                  key={mission.id}
                  mission={mission}
                  accent={competency.accent}
                  classes={classes}
                  assignedByClass={assignedByClass}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
