"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Choice, Mission, Scene } from "@/content/types";
import { finishMission, submitDecision } from "@/app/actions/student";
import { decisionNumber, decisionSceneIds, findScene, nextSceneAfter } from "@/lib/domain/missionPath";
import { SceneArt } from "@/components/art/SceneArt";
import { BadgeSticker } from "@/components/art/BadgeSticker";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ReadAloud } from "@/components/student/ReadAloud";

const TONE: Record<string, { border: string; wash: string; text: string; label: string }> = {
  strong: {
    border: "border-pine",
    wash: "bg-pine-wash",
    text: "text-pine-deep",
    label: "Good thinking",
  },
  partial: {
    border: "border-denim",
    wash: "bg-denim-wash",
    text: "text-denim-deep",
    label: "Almost",
  },
  rethink: {
    border: "border-berry",
    wash: "bg-berry-wash",
    text: "text-berry-deep",
    label: "Let's look again",
  },
};

export function MissionPlayer({
  mission,
  initialSceneId,
  alreadyCompleted,
}: {
  mission: Mission;
  initialSceneId: string;
  alreadyCompleted: boolean;
}) {
  const [sceneId, setSceneId] = useState(initialSceneId);
  const [chosen, setChosen] = useState<Choice | null>(null);
  /**
   * Whether the chosen decision has reached the server yet.
   *
   * The authored feedback appears instantly — it is local content and making a
   * child wait to read it would be pointless. What waits is the way forward:
   * "Keep going" stays disabled until the decision is recorded, so a dropped
   * network cannot quietly cost a student the evidence of a skill they just
   * demonstrated. A replay records nothing, so it is "saved" from the start.
   */
  const [save, setSave] = useState<{
    status: "idle" | "saving" | "saved" | "error";
    message?: string;
  }>({ status: "idle" });
  /**
   * Whether finishing the mission has reached the server.
   *
   * The badge is a claim about a record, so it is not shown until the record
   * exists. Until then the ending reads "Saving your badge…", and the ways out
   * of the mission are held closed — a child who leaves mid-save would land
   * back on a map that still says the mission is unfinished, having just been
   * congratulated for finishing it. A replay writes nothing, so it starts
   * saved.
   */
  const [finishState, setFinishState] = useState<"idle" | "saving" | "saved" | "error">(
    alreadyCompleted ? "saved" : "idle",
  );
  /**
   * Whether the mission was already finished when this player mounted.
   *
   * The prop flips to true as soon as completion is recorded, because the
   * route re-renders. Using it directly for the replay note meant a child was
   * told "you already finished this one" in the same breath as finishing it
   * for the first time.
   */
  const [wasFinishedOnEntry] = useState(alreadyCompleted);
  const [, startTransition] = useTransition();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  const scene: Scene = findScene(mission, sceneId) ?? mission.scenes[0];
  const totalDecisions = decisionSceneIds(mission).length;
  const currentDecision = decisionNumber(mission, scene.id);

  // Move focus with the story so a keyboard or screen reader user is never
  // stranded at the top of the page after advancing.
  useEffect(() => {
    if (!chosen) headingRef.current?.focus();
  }, [sceneId, chosen]);

  useEffect(() => {
    if (chosen) feedbackRef.current?.focus();
  }, [chosen]);

  const runFinish = useCallback(() => {
    setFinishState("saving");
    startTransition(async () => {
      try {
        await finishMission(mission.slug);
        setFinishState("saved");
      } catch {
        setFinishState("error");
      }
    });
  }, [mission.slug, startTransition]);

  useEffect(() => {
    if (scene.kind !== "ending" || alreadyCompleted || finishedRef.current) return;
    finishedRef.current = true;
    runFinish();
  }, [scene.kind, alreadyCompleted, runFinish]);

  const persist = useCallback(
    (choice: Choice) => {
      setSave({ status: "saving" });
      startTransition(async () => {
        try {
          const result = await submitDecision({
            slug: mission.slug,
            sceneId: scene.id,
            choiceId: choice.id,
          });
          setSave(
            result.ok
              ? { status: "saved" }
              : { status: "error", message: result.error },
          );
        } catch {
          setSave({
            status: "error",
            message: "We could not save that choice just now.",
          });
        }
      });
    },
    [mission.slug, scene.id, startTransition],
  );

  const choose = useCallback(
    (choice: Choice) => {
      setChosen(choice);
      // A finished mission is read-only: replaying writes nothing at all, so
      // there is nothing to wait for.
      if (alreadyCompleted) {
        setSave({ status: "saved" });
        return;
      }
      persist(choice);
    },
    [alreadyCompleted, persist],
  );

  const advance = useCallback(() => {
    if (!chosen || save.status === "saving" || save.status === "error") return;
    const target = nextSceneAfter(scene, chosen);
    setChosen(null);
    setSave({ status: "idle" });
    setSceneId(target);
  }, [chosen, scene, save.status]);

  const spokenText = chosen
    ? `${TONE[chosen.feedback.tone].label}. ${chosen.feedback.headline}. ${chosen.feedback.body}`
    : [
        ...scene.narration,
        scene.prompt ?? "",
        ...(scene.choices ?? []).map((c, i) => `Choice ${i + 1}. ${c.label}`),
        ...(scene.wrapUp ?? []),
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Mission {mission.order}
          </p>
          <h1 className="font-display text-2xl leading-tight text-ink">{mission.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <ReadAloud key={spokenText} text={spokenText} />
          {/* The ending screen has its own way out, gated on the save. A
              second, ungated one here would defeat that. */}
          {scene.kind !== "ending" && (
            <Link
              href="/student"
              className="flex min-h-11 items-center rounded-xl border-2 border-sand-deep bg-surface px-4 text-base font-semibold text-ink-soft hover:bg-paper-deep hover:text-ink"
            >
              Save and exit
            </Link>
          )}
        </div>
      </div>

      {currentDecision !== null && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink-soft">
            Decision {currentDecision} of {totalDecisions}
          </p>
          <ol className="mt-1.5 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: totalDecisions }, (_, i) => (
              <li
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < currentDecision - 1
                    ? "bg-pine"
                    : i === currentDecision - 1
                      ? "bg-marigold-deep"
                      : "bg-sand"
                }`}
              />
            ))}
          </ol>
        </div>
      )}

      <article className="mt-5 overflow-hidden rounded-3xl border-4 border-ink bg-surface">
        <div className="h-52 border-b-4 border-ink sm:h-72">
          <SceneArt art={scene.art} />
        </div>

        <div className="p-5 sm:p-7">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="sr-only focus:outline-none"
          >
            {scene.kind === "ending" ? "Mission finished" : `Part of ${mission.title}`}
          </h2>

          {scene.speaker && (
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper-deep px-3 py-1 text-sm font-bold text-ink">
              <span aria-hidden="true">▸</span> {scene.speaker} says
            </p>
          )}

          <div className="space-y-3.5">
            {scene.narration.map((line, i) => (
              <p key={i} className="text-lg leading-[1.75] text-ink sm:text-xl">
                {line}
              </p>
            ))}
          </div>

          {scene.kind === "ending" && scene.wrapUp && (
            <div
              className={`mt-6 rounded-2xl border-2 p-5 ${
                finishState === "saved"
                  ? "border-pine bg-pine-wash"
                  : "border-sand-deep bg-paper-deep"
              }`}
            >
              {/* The badge is only claimed once it is recorded. Before that the
                  sticker is shown unearned and the words say what is actually
                  happening. */}
              <div className="flex items-center gap-3" aria-live="polite">
                <BadgeSticker
                  badgeId={mission.badge.id}
                  competency={mission.competency}
                  earned={finishState === "saved"}
                  size={56}
                />
                <div>
                  {finishState === "saved" ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pine-deep">
                        Badge earned
                      </p>
                      <p className="font-display text-xl text-ink">{mission.badge.name}</p>
                      <p className="text-sm text-ink-soft">{mission.badge.blurb}</p>
                    </>
                  ) : finishState === "error" ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-berry-deep">
                        Not saved yet
                      </p>
                      <p className="font-display text-xl text-ink">
                        Your badge is not lost
                      </p>
                      <p className="text-sm text-ink-soft">
                        You finished the mission. We just have not been able to write it
                        down yet. Tap Try again.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                        Nearly there
                      </p>
                      <p className="font-display text-xl text-ink">Saving your badge…</p>
                      <p className="text-sm text-ink-soft">
                        Hang on one moment while we write this down.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <h3 className="mt-5 font-display text-lg text-ink">Three things to remember</h3>
              <ul className="mt-2 space-y-2">
                {scene.wrapUp.map((line) => (
                  <li key={line} className="flex gap-2.5 text-[1.05rem] leading-relaxed text-ink">
                    <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pine" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decision, feedback and continuation */}
          <div className="mt-6">
            {chosen ? (
              <div
                ref={feedbackRef}
                tabIndex={-1}
                aria-live="polite"
                className={`rounded-2xl border-4 p-5 focus:outline-none ${TONE[chosen.feedback.tone].border} ${TONE[chosen.feedback.tone].wash}`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-[0.14em] ${TONE[chosen.feedback.tone].text}`}
                >
                  {TONE[chosen.feedback.tone].label}
                </p>
                <p className="mt-1.5 font-display text-2xl leading-tight text-ink">
                  {chosen.feedback.headline}
                </p>
                <p className="mt-2.5 text-[1.05rem] leading-relaxed text-ink sm:text-lg">
                  {chosen.feedback.body}
                </p>
                {save.status === "error" ? (
                  <div className="mt-5">
                    <p
                      role="alert"
                      className="rounded-xl border-2 border-berry bg-surface px-4 py-3 text-[0.95rem] font-semibold text-berry-deep"
                    >
                      {save.message} Nothing is lost — your answer is still right here.
                    </p>
                    <Button
                      variant="kid"
                      size="lg"
                      className="mt-3 w-full sm:w-auto"
                      onClick={() => persist(chosen)}
                    >
                      Try again
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="kid"
                    size="lg"
                    className="mt-5 w-full sm:w-auto"
                    onClick={advance}
                    disabled={save.status === "saving"}
                  >
                    {save.status === "saving"
                      ? "Saving…"
                      : chosen.retry
                        ? "Have another go"
                        : "Keep going"}
                  </Button>
                )}
              </div>
            ) : scene.choices?.length ? (
              <fieldset>
                <legend className="mb-3 font-display text-xl leading-snug text-ink">
                  {scene.prompt}
                </legend>
                <ul className="space-y-3">
                  {scene.choices.map((choice, index) => (
                    <li key={choice.id}>
                      <button
                        type="button"
                        onClick={() => choose(choice)}
                        aria-label={choice.ariaLabel ?? choice.label}
                        className="ark-sticker flex w-full items-start gap-3 rounded-2xl border-4 border-ink bg-paper px-4 py-3.5 text-left transition-colors hover:bg-marigold-wash"
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface font-display text-base font-bold text-ink"
                        >
                          {index + 1}
                        </span>
                        <span className="pt-0.5 text-[1.05rem] leading-snug text-ink sm:text-lg">
                          {choice.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : scene.kind === "ending" ? (
              // The ways out only appear once finishing is recorded. Leaving
              // mid-save would drop the child back on a map that still says
              // this mission is unfinished.
              finishState === "saved" ? (
                <div className="flex flex-wrap gap-3">
                  <ButtonLink href="/student" variant="kid" size="lg">
                    Back to my missions
                  </ButtonLink>
                  <ButtonLink href={`/family/${mission.slug}`} variant="secondary" size="lg">
                    Take-home page
                  </ButtonLink>
                </div>
              ) : finishState === "error" ? (
                <div>
                  <p
                    role="alert"
                    className="rounded-xl border-2 border-berry bg-surface px-4 py-3 text-[0.95rem] font-semibold text-berry-deep"
                  >
                    We could not save that you finished this mission. Nothing you did is
                    lost.
                  </p>
                  <Button variant="kid" size="lg" className="mt-3" onClick={runFinish}>
                    Try again
                  </Button>
                </div>
              ) : (
                // The panel above already says what is being saved; repeating
                // it here would announce the same sentence twice.
                <Button variant="kid" size="lg" disabled>
                  Saving…
                </Button>
              )
            ) : (
              <Button
                variant="kid"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => scene.next && setSceneId(scene.next)}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </article>

      {wasFinishedOnEntry && (
        <p className="mt-4 text-center text-sm text-ink-soft">
          You already finished this one. Read it as many times as you like — your badge
          stays, and nothing you tap now gets recorded.
        </p>
      )}
    </div>
  );
}
