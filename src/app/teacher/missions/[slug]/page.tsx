import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { listClasses, listClassesForTeacher, listAssignments } from "@/lib/repo/classroom";
import { getMission } from "@/content/missions";
import { COMPETENCY_BY_ID, SKILL_BY_ID } from "@/content/competencies";
import { SceneArt } from "@/components/art/SceneArt";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { ButtonLink } from "@/components/ui/Button";
import { Note, Tag } from "@/components/ui/Bits";
import { AssignToggle } from "@/components/staff/AssignToggle";
import { endSentence } from "@/lib/domain/sentence";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: getMission(slug)?.title ?? "Mission" };
}

const TONE: Record<string, { label: string; cls: string }> = {
  strong: { label: "Safe choice", cls: "border-pine bg-pine-wash text-pine-deep" },
  partial: { label: "Partly there", cls: "border-denim bg-denim-wash text-denim-deep" },
  rethink: { label: "Loops back", cls: "border-berry bg-berry-wash text-berry-deep" },
};

export default async function MissionPreview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();

  const { user } = await requireStaff();
  const db = getDb();
  const classes =
    user.role === "admin" ? listClasses(db, user.school_id) : listClassesForTeacher(db, user.id, user.school_id);
  const assignedByClass = new Map(
    classes.map((c) => [c.id, new Set(listAssignments(db, c.id).map((a) => a.mission_id))]),
  );

  const competency = COMPETENCY_BY_ID[mission.competency];
  const isFoundation = mission.segment === "foundation";

  return (
    <div>
      <PageHeader
        eyebrow={
          isFoundation
            ? `First Look · Session ${mission.order} · Grades ${mission.gradeBand}`
            : `${competency.formalName} · Mission ${mission.order}`
        }
        title={mission.title}
        description={mission.summary}
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/teacher/classroom/${mission.slug}`} size="sm">
              Teach it on the board
            </ButtonLink>
            <ButtonLink href={`/teacher/guides/${mission.slug}`} variant="secondary" size="sm">
              Printable guide
            </ButtonLink>
            <ButtonLink href={`/family/${mission.slug}`} variant="secondary" size="sm">
              Family take-home
            </ButtonLink>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Tag tone="pine">{mission.estimatedMinutes} minutes</Tag>
        <Tag>Grades {mission.gradeBand}</Tag>
        <Tag>{mission.scenes.length} scenes</Tag>
        <Tag>{mission.scenes.filter((s) => s.choices?.length).length} decisions</Tag>
        {/* A First Look session records nothing, so it must not be labelled
            with a primary skill. What it has is a skill it leads into, and
            saying so is the difference between an honest library card and one
            that implies the roster will fill in. */}
        <Tag tone="denim">
          {isFoundation ? "Leads into" : "Primary skill"}:{" "}
          {SKILL_BY_ID[mission.primarySkillId].educatorLabel}
        </Tag>
      </div>

      {isFoundation && (
        <div className="mt-4">
          <Note tone="marigold" title="Records no evidence">
            {mission.bigIdea} This session is an introduction, so nothing in it appears on
            the class roster or the school report. Finishing it earns the student a badge
            and nothing else.
          </Note>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_16rem]">
        <Panel title="Learning goals">
          <PanelBody>
            <ul className="space-y-2">
              {mission.learningGoals.map((goal) => (
                <li key={goal} className="flex gap-2 text-[0.95rem] leading-relaxed text-ink-soft">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
                  {goal}
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>

        <Panel title="Assign">
          <PanelBody>
            <ul className="space-y-2">
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
              {classes.length === 0 && <li className="text-sm text-ink-soft">No classes yet.</li>}
            </ul>
          </PanelBody>
        </Panel>
      </div>

      {/* Full branch preview */}
      <section className="mt-8" aria-labelledby="branches">
        <h2 id="branches" className="font-display text-2xl text-ink">
          Every scene, every branch
        </h2>
        <p className="mt-1.5 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft">
          This is the complete content of the mission. Coach notes are for you and are
          never shown to a student.
        </p>

        <ol className="mt-5 space-y-4">
          {mission.scenes.map((scene, index) => (
            <li key={scene.id}>
              <Panel
                title={
                  <span className="flex items-center gap-2">
                    Scene {index + 1}
                    <Tag>{scene.kind}</Tag>
                    {scene.speaker && <Tag tone="marigold">{scene.speaker}</Tag>}
                  </span>
                }
              >
                <div className="grid gap-0 sm:grid-cols-[11rem_1fr]">
                  <div className="h-28 border-b border-sand sm:h-auto sm:border-b-0 sm:border-r">
                    <SceneArt art={scene.art} />
                  </div>
                  <PanelBody>
                    {scene.narration.map((line, i) => (
                      <p key={i} className="mb-2 text-[0.95rem] leading-relaxed text-ink last:mb-0">
                        {line}
                      </p>
                    ))}

                    {scene.prompt && (
                      <p className="mt-3 font-semibold text-ink">{scene.prompt}</p>
                    )}

                    {scene.choices && (
                      <ul className="mt-3 space-y-2.5">
                        {scene.choices.map((choice) => (
                          <li
                            key={choice.id}
                            className={`rounded-lg border-l-4 border border-sand-deep bg-paper p-3 ${
                              TONE[choice.feedback.tone].cls.split(" ")[0]
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] ${TONE[choice.feedback.tone].cls}`}
                              >
                                {TONE[choice.feedback.tone].label}
                              </span>
                              {choice.evidence && (
                                <span className="text-[0.7rem] font-semibold text-ink-faint">
                                  Records {choice.evidence.result}:{" "}
                                  {SKILL_BY_ID[choice.evidence.skillId]?.educatorLabel}
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-[0.95rem] font-medium text-ink">
                              {choice.label}
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                              <strong className="font-semibold text-ink">
                                {endSentence(choice.feedback.headline)}
                              </strong>{" "}
                              {choice.feedback.body}
                            </p>
                            {choice.feedback.coachNote && (
                              <p className="mt-2 rounded border-l-2 border-marigold bg-marigold-wash px-2.5 py-1.5 text-sm leading-relaxed text-ink-soft">
                                <strong className="font-semibold text-marigold-deep">
                                  Coach note:
                                </strong>{" "}
                                {choice.feedback.coachNote}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {scene.wrapUp && (
                      <ul className="mt-3 space-y-1.5">
                        {scene.wrapUp.map((line) => (
                          <li key={line} className="text-[0.95rem] font-medium text-ink">
                            · {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </PanelBody>
                </div>
              </Panel>
            </li>
          ))}
        </ol>
      </section>

      {/* Discussion guide */}
      <section className="mt-8" aria-labelledby="guide">
        <h2 id="guide" className="font-display text-2xl text-ink">
          Discussion guide
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Before you assign it">
            <PanelBody>
              <p className="text-[0.95rem] leading-relaxed text-ink-soft">
                {mission.guide.setup}
              </p>
              <h3 className="mt-4 text-sm font-semibold text-ink">What to watch for</h3>
              <ul className="mt-2 space-y-1.5">
                {mission.guide.lookFor.map((l) => (
                  <li key={l} className="text-sm leading-relaxed text-ink-soft">
                    · {l}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          <Panel title="Debrief questions">
            <PanelBody>
              <ol className="space-y-2">
                {mission.guide.questions.map((q, i) => (
                  <li key={q} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-ink-soft">
                    <span className="font-semibold text-ink">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>

          <Panel title="If a student says…">
            <PanelBody>
              <dl className="space-y-3">
                {mission.guide.misconceptions.map((m) => (
                  <div key={m.student}>
                    <dt className="text-[0.95rem] font-semibold italic text-ink">
                      “{m.student}”
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{m.response}</dd>
                  </div>
                ))}
              </dl>
            </PanelBody>
          </Panel>

          <Panel title="Unplugged extension">
            <PanelBody>
              <p className="text-[0.95rem] leading-relaxed text-ink-soft">
                {mission.guide.extension}
              </p>
              {mission.guide.extensionCards && (
                <ol className="mt-3 space-y-3">
                  {mission.guide.extensionCards.map((card) => (
                    <li key={card.label} className="rounded-lg border border-sand p-3">
                      <p className="text-sm font-semibold text-ink">{card.label}</p>
                      <p className="mt-1 text-[0.95rem] leading-relaxed text-ink">
                        {card.description}
                      </p>
                      <dl className="mt-2 space-y-1 text-sm leading-relaxed text-ink-soft">
                        <div>
                          <dt className="inline font-semibold text-ink">Suggests: </dt>
                          <dd className="inline">{card.suggests}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-ink">Proves: </dt>
                          <dd className="inline">{card.proves}</dd>
                        </div>
                        {card.consent && (
                          <div>
                            <dt className="inline font-semibold text-ink">Everyone in it: </dt>
                            <dd className="inline">{card.consent}</dd>
                          </div>
                        )}
                        {card.control && (
                          <div>
                            <dt className="inline font-semibold text-ink">The next moment: </dt>
                            <dd className="inline">{card.control}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="inline font-semibold text-ink">
                            Ready for a big audience?{" "}
                          </dt>
                          <dd className="inline">{card.audience}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ol>
              )}
              <Note tone="pine" title="Family take-home">
                <Link
                  href={`/family/${mission.slug}`}
                  className="font-semibold underline underline-offset-2"
                >
                  {mission.family.familyRule}
                </Link>
              </Note>
            </PanelBody>
          </Panel>
        </div>
      </section>

      <div className="mt-8">
        <ButtonLink href="/teacher/missions" variant="secondary" size="sm">
          ← Mission library
        </ButtonLink>
      </div>
    </div>
  );
}
