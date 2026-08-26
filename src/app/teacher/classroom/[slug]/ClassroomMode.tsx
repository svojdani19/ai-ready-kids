"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Choice, Mission, Scene } from "@/content/types";
import { decisionSceneIds } from "@/lib/domain/missionPath";
import { SceneArt } from "@/components/art/SceneArt";

/**
 * Classroom Mode: teacher-led, whole-class facilitation on a projector or
 * interactive board.
 *
 * Three things make this different from the student player, and all three are
 * deliberate:
 *
 *  1. It records nothing. No attempt, no evidence, no timing. A group lesson
 *     is instruction, not assessment, and quietly logging what a room shouted
 *     out would be both bad data and bad faith.
 *  2. The teacher can reveal any branch, not just one. The most valuable
 *     question in a group is "what would have happened if we picked B?", and
 *     the independent player cannot answer it without a child choosing wrongly
 *     on purpose.
 *  3. Type is sized for the back of a room, not for a Chromebook at arm's
 *     length. Everything scales with the viewport via clamp().
 */

const TONE: Record<string, { label: string; border: string; wash: string; text: string }> = {
  strong: { label: "Safe choice", border: "border-pine", wash: "bg-pine-wash", text: "text-pine-deep" },
  partial: { label: "Partly there", border: "border-denim", wash: "bg-denim-wash", text: "text-denim-deep" },
  rethink: { label: "Loops back", border: "border-berry", wash: "bg-berry-wash", text: "text-berry-deep" },
};

const LETTERS = ["A", "B", "C", "D"];

/** Linear running order, so Next and Back are one predictable step. */
function runningOrder(mission: Mission): Scene[] {
  const byId = new Map(mission.scenes.map((s) => [s.id, s]));
  const order: Scene[] = [];
  const seen = new Set<string>();
  let id: string | undefined = mission.openingSceneId;

  while (id && !seen.has(id)) {
    const scene = byId.get(id);
    if (!scene) break;
    seen.add(id);
    order.push(scene);
    if (scene.kind === "ending") break;
    // At a decision, the running order follows the safe branch. Every other
    // branch is still reachable from the controls, it just is not the spine.
    id = scene.choices?.length
      ? (scene.choices.find((c) => c.feedback.tone === "strong") ?? scene.choices[0]).next
      : scene.next;
  }
  return order;
}

export function ClassroomMode({ mission }: { mission: Mission }) {
  const order = runningOrder(mission);
  const [stage, setStage] = useState<"plan" | "present" | "debrief">("plan");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [debriefIndex, setDebriefIndex] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const scene = order[index] ?? order[0];
  const decisions = decisionSceneIds(mission);
  const decisionNumber = scene ? decisions.indexOf(scene.id) + 1 : 0;

  // Plain functions: the React Compiler memoizes these, and hand-written
  // useCallback deps only get in its way.
  const next = () => {
    setRevealed(null);
    setTally({});
    if (index >= order.length - 1) setStage("debrief");
    else setIndex(index + 1);
  };

  const back = () => {
    setRevealed(null);
    setTally({});
    setIndex(Math.max(0, index - 1));
  };

  // Selecting a branch sets it rather than toggling, because the switcher
  // below stays on screen and a toggle would make tapping the active button
  // do something different from tapping its neighbours.
  const reveal = (choiceId: string) => setRevealed(choiceId);
  const showChoiceList = () => setRevealed(null);

  useEffect(() => {
    stageRef.current?.focus();
  }, [stage, index, debriefIndex]);

  // Presenter keys. A teacher facilitating from the front of a room should
  // never have to find a small button with a mouse.
  //
  // The handler is written out here rather than calling next/back/reveal so
  // the effect depends only on values, not on freshly created functions, and
  // the listener is attached once per scene instead of once per render.
  useEffect(() => {
    if (stage !== "present") return;
    const lastIndex = order.length - 1;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        setRevealed(null);
        setTally({});
        if (index >= lastIndex) setStage("debrief");
        else setIndex(index + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setRevealed(null);
        setTally({});
        setIndex(Math.max(0, index - 1));
      } else if (event.key.toLowerCase() === "n") {
        setShowNotes((v) => !v);
      } else if (event.key === "Escape") {
        setRevealed(null);
      } else if (/^[1-4]$/.test(event.key)) {
        const choice = scene?.choices?.[Number(event.key) - 1];
        if (choice) setRevealed(choice.id);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, scene, index, order.length]);

  /* ------------------------------- plan ------------------------------- */
  if (stage === "plan") {
    return (
      <div className="mx-auto max-w-3xl">
        {/* The launch control sits in the header and stays there while the
            teacher scrolls the plan. A class is already sitting on the rug by
            this point; nobody should have to scroll to start. */}
        <div className="sticky top-0 z-10 -mx-5 mb-5 border-b border-sand-deep bg-paper/95 px-5 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Classroom Mode · Mission {mission.order}
              </p>
              <h1 className="font-display text-2xl leading-tight text-ink sm:text-3xl">
                {mission.title}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setStage("present")}
              className="min-h-12 shrink-0 rounded-xl border-2 border-pine-deep bg-pine-deep px-5 text-base font-semibold text-white hover:bg-pine"
            >
              Put it on the board
            </button>
          </div>
        </div>

        <p className="text-[1.05rem] leading-relaxed text-ink-soft">
          {mission.estimatedMinutes} minutes on the board, plus about fifteen for the
          debrief. Nothing in Classroom Mode is recorded against any student.
        </p>

        <div className="mt-6 rounded-xl border border-sand-deep bg-surface p-5">
          <h2 className="font-display text-lg text-ink">Before you start</h2>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{mission.guide.setup}</p>

          <h3 className="mt-5 text-sm font-semibold text-ink">The decision points</h3>
          <ol className="mt-2 space-y-2">
            {mission.scenes
              .filter((s) => s.choices?.length)
              .map((s, i) => (
                <li key={s.id} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-ink-soft">
                  <span className="font-semibold text-ink">{i + 1}.</span>
                  {s.prompt}
                </li>
              ))}
          </ol>

          <h3 className="mt-5 text-sm font-semibold text-ink">Watch for</h3>
          <ul className="mt-2 space-y-1.5">
            {mission.guide.lookFor.map((l) => (
              <li key={l} className="text-[0.95rem] leading-relaxed text-ink-soft">
                · {l}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-xl border-2 border-denim bg-denim-wash p-5">
          <h2 className="font-display text-lg text-ink">How to drive it</h2>
          <dl className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {[
              ["Right arrow or space", "Next"],
              ["Left arrow", "Back"],
              ["1, 2, 3", "Reveal what that choice does"],
              ["Esc", "Back to the list of choices"],
              ["N", "Show or hide your notes"],
            ].map(([key, what]) => (
              <div key={key} className="flex items-baseline gap-2.5">
                <dt>
                  <kbd className="rounded border border-denim bg-surface px-2 py-0.5 text-xs font-semibold text-denim-deep">
                    {key}
                  </kbd>
                </dt>
                <dd className="text-sm text-ink-soft">{what}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Reveal any branch you like, including the ones that loop back. In a group the
            most useful question is usually “what would have happened if we picked B?”, and
            here you can just show them.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStage("present")}
            className="min-h-12 rounded-xl border-2 border-pine-deep bg-pine-deep px-6 py-3.5 text-lg font-semibold text-white hover:bg-pine"
          >
            Put it on the board
          </button>
          <Link
            href={`/teacher/missions/${mission.slug}`}
            className="rounded-xl border-2 border-sand-deep bg-surface px-6 py-3.5 text-lg font-semibold text-ink hover:bg-paper-deep"
          >
            Back to the mission
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------ debrief ----------------------------- */
  if (stage === "debrief") {
    const question = mission.guide.questions[debriefIndex];
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-paper">
        <div
          ref={stageRef}
          tabIndex={-1}
          className="flex flex-1 flex-col items-center justify-center px-[5vw] text-center focus:outline-none"
        >
          <p className="text-[clamp(0.8rem,1.4vw,1.1rem)] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Talk about it · {debriefIndex + 1} of {mission.guide.questions.length}
          </p>
          <p className="mt-[3vh] max-w-[22ch] font-display text-[clamp(2rem,5.4vw,4.5rem)] leading-[1.15] text-ink sm:max-w-[26ch]">
            {question}
          </p>
          <ul className="mt-[5vh] flex flex-wrap justify-center gap-3">
            {mission.scenes
              .find((s) => s.kind === "ending")
              ?.wrapUp?.map((line) => (
                <li
                  key={line}
                  className="rounded-full border-2 border-pine bg-pine-wash px-4 py-2 text-[clamp(0.85rem,1.5vw,1.15rem)] font-semibold text-pine-deep"
                >
                  {line}
                </li>
              ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-4 border-ink bg-surface px-4 py-3">
          <button
            type="button"
            onClick={() => {
              if (debriefIndex === 0) {
                setStage("present");
              } else {
                setDebriefIndex((i) => i - 1);
              }
            }}
            className="min-h-11 rounded-xl border-2 border-sand-deep bg-surface px-5 text-base font-semibold text-ink hover:bg-paper-deep"
          >
            ← Back
          </button>
          <p className="text-sm text-ink-soft">Nothing here is recorded.</p>
          {debriefIndex < mission.guide.questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setDebriefIndex((i) => i + 1)}
              className="min-h-11 rounded-xl border-2 border-pine-deep bg-pine-deep px-5 text-base font-semibold text-white hover:bg-pine"
            >
              Next question →
            </button>
          ) : (
            <Link
              href={`/teacher/guides/${mission.slug}`}
              className="min-h-11 rounded-xl border-2 border-pine-deep bg-pine-deep px-5 py-2.5 text-base font-semibold text-white hover:bg-pine"
            >
              Finish and open the guide
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------ present ----------------------------- */
  const revealedChoice: Choice | undefined = scene.choices?.find((c) => c.id === revealed);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      <div
        ref={stageRef}
        tabIndex={-1}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto focus:outline-none"
      >
        <div className="flex items-center justify-between gap-4 px-[3vw] pt-3">
          <p className="text-[clamp(0.72rem,1.2vw,1rem)] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {mission.title}
          </p>
          <p className="text-[clamp(0.72rem,1.2vw,1rem)] font-semibold text-ink-faint">
            {decisionNumber > 0
              ? `Decision ${decisionNumber} of ${decisions.length}`
              : `Part ${index + 1} of ${order.length}`}
          </p>
        </div>

        <div className="grid min-h-0 flex-1 content-center items-center gap-[2vw] px-[3vw] py-[2vh] sm:grid-cols-[minmax(0,28%)_1fr] lg:grid-cols-[minmax(0,32%)_1fr]">
          {/* Kept beside the text at every width above a phone. A board
              mirrored from a laptop is often narrower than a desktop, and both
              hiding the illustration and stretching it into a thin banner
              looked broken. A column keeps its aspect ratio intact. */}
          <div className="hidden h-full max-h-[46vh] min-h-[22vh] overflow-hidden rounded-2xl border-4 border-ink sm:block">
            <SceneArt art={scene.art} />
          </div>

          <div>
            {scene.speaker && (
              <p className="mb-[1.5vh] inline-block rounded-full border-4 border-ink bg-paper-deep px-4 py-1 text-[clamp(1rem,1.8vw,1.6rem)] font-bold text-ink">
                {scene.speaker} says
              </p>
            )}

            <div className="space-y-[1.6vh]">
              {scene.narration.map((line, i) => (
                <p
                  key={i}
                  className="text-[clamp(1.25rem,2.5vw,2.4rem)] leading-[1.4] text-ink"
                >
                  {line}
                </p>
              ))}
            </div>

            {scene.prompt && !revealedChoice && (
              <p className="mt-[2.5vh] font-display text-[clamp(1.4rem,3vw,2.8rem)] leading-tight text-marigold-deep">
                {scene.prompt}
              </p>
            )}

            {scene.choices && !revealedChoice && (
              <ul className="mt-[2vh] space-y-[1.2vh]">
                {scene.choices.map((choice, i) => (
                  <li key={choice.id}>
                    <button
                      type="button"
                      onClick={() => reveal(choice.id)}
                      aria-label={`Show what choice ${LETTERS[i]} does: ${choice.label}`}
                      className="flex w-full items-start gap-4 rounded-2xl border-4 border-ink bg-surface px-4 py-3 text-left hover:bg-marigold-wash"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-[clamp(2rem,3.4vw,3.2rem)] w-[clamp(2rem,3.4vw,3.2rem)] shrink-0 items-center justify-center rounded-full border-4 border-ink bg-paper font-display text-[clamp(1rem,1.8vw,1.7rem)] font-bold text-ink"
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="pt-[0.4vh] text-[clamp(1.05rem,2.1vw,2rem)] leading-snug text-ink">
                        {choice.label}
                      </span>
                      {tally[choice.id] ? (
                        <span className="ml-auto shrink-0 self-center rounded-full bg-denim-wash px-3 py-1 text-[clamp(0.9rem,1.5vw,1.3rem)] font-bold text-denim-deep">
                          {tally[choice.id]}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* The question stays on the board while a branch is open, so the
                room can still see what is being answered. */}
            {scene.prompt && revealedChoice && (
              <p className="mt-[2vh] font-display text-[clamp(1.2rem,2.4vw,2.2rem)] leading-tight text-marigold-deep">
                {scene.prompt}
              </p>
            )}

            {/* Branch switcher.
                Without this, revealing a choice replaced the list and the only
                way back to B or C was a number key — fine on a laptop, useless
                on a touch-only interactive board. It is deliberately styled and
                labelled apart from the hands-up tally in the bar below: this
                changes what the room is looking at, that counts votes. */}
            {revealedChoice && scene.choices && (
              <div className="mt-[1.5vh]">
                <p
                  id="branch-switcher-label"
                  className="text-[clamp(0.7rem,1.2vw,1rem)] font-bold uppercase tracking-[0.14em] text-ink-faint"
                >
                  Compare the choices
                </p>
                <div
                  role="group"
                  aria-labelledby="branch-switcher-label"
                  className="mt-[0.8vh] flex flex-wrap gap-2"
                >
                  {scene.choices.map((choice, i) => {
                    const active = choice.id === revealedChoice.id;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => reveal(choice.id)}
                        aria-pressed={active}
                        aria-label={`Show what choice ${LETTERS[i]} does: ${choice.label}`}
                        className={`flex min-h-12 max-w-full items-center gap-2 rounded-xl border-4 px-3 py-1.5 text-left ${
                          active
                            ? "border-ink bg-ink text-paper"
                            : "border-ink bg-surface text-ink hover:bg-marigold-wash"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-display text-base font-bold ${
                            active ? "border-paper bg-paper text-ink" : "border-ink bg-paper text-ink"
                          }`}
                        >
                          {LETTERS[i]}
                        </span>
                        <span
                          aria-hidden="true"
                          className="truncate text-[clamp(0.85rem,1.4vw,1.15rem)] font-semibold"
                          style={{ maxWidth: "22ch" }}
                        >
                          {choice.label}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={showChoiceList}
                    aria-label="Hide this answer and show the list of choices again"
                    className="min-h-12 rounded-xl border-4 border-sand-deep bg-surface px-4 text-[clamp(0.85rem,1.4vw,1.15rem)] font-semibold text-ink-soft hover:bg-paper-deep"
                  >
                    Show the choices
                  </button>
                </div>
              </div>
            )}

            {revealedChoice && (
              <div
                aria-live="polite"
                className={`mt-[1.5vh] rounded-2xl border-4 p-[2.5vh] ${TONE[revealedChoice.feedback.tone].border} ${TONE[revealedChoice.feedback.tone].wash}`}
              >
                <p
                  className={`text-[clamp(0.75rem,1.3vw,1.1rem)] font-bold uppercase tracking-[0.16em] ${TONE[revealedChoice.feedback.tone].text}`}
                >
                  {TONE[revealedChoice.feedback.tone].label}
                </p>
                <p className="mt-[1vh] text-[clamp(1rem,2vw,1.9rem)] leading-snug text-ink-soft">
                  “{revealedChoice.label}”
                </p>
                <p className="mt-[1.5vh] font-display text-[clamp(1.4rem,3vw,2.8rem)] leading-tight text-ink">
                  {revealedChoice.feedback.headline}
                </p>
                <p className="mt-[1.5vh] text-[clamp(1.1rem,2.2vw,2.1rem)] leading-[1.4] text-ink">
                  {revealedChoice.feedback.body}
                </p>
              </div>
            )}

            {scene.kind === "ending" && scene.wrapUp && (
              <ul className="mt-[2.5vh] space-y-[1.2vh]">
                {scene.wrapUp.map((line) => (
                  <li
                    key={line}
                    className="rounded-2xl border-4 border-pine bg-pine-wash px-4 py-3 text-[clamp(1.1rem,2.2vw,2.1rem)] leading-snug text-ink"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {showNotes && (
          <div className="border-t-2 border-dashed border-marigold bg-marigold-wash px-[3vw] py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-marigold-deep">
              Your notes · press N to hide before the class reads them
            </p>
            <ul className="mt-1.5 space-y-1">
              {scene.choices?.some((c) => c.feedback.coachNote)
                ? scene.choices
                    .filter((c) => c.feedback.coachNote)
                    .map((c) => (
                      <li key={c.id} className="text-sm leading-relaxed text-ink">
                        <strong>“{c.label}”</strong> — {c.feedback.coachNote}
                      </li>
                    ))
                : mission.guide.lookFor.map((l) => (
                    <li key={l} className="text-sm leading-relaxed text-ink">
                      · {l}
                    </li>
                  ))}
            </ul>
          </div>
        )}
      </div>

      {/* Facilitation bar. Compact, out of the way, and every target is at
          least 44px so it works on an interactive board with a finger. */}
      <div className="flex flex-wrap items-center gap-2 border-t-4 border-ink bg-surface px-3 py-2.5">
        <button
          type="button"
          onClick={back}
          disabled={index === 0}
          className="min-h-11 rounded-xl border-2 border-sand-deep bg-surface px-4 text-sm font-semibold text-ink hover:bg-paper-deep disabled:opacity-40"
        >
          ← Back
        </button>

        {scene.choices?.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
              Hands up
            </span>
            {scene.choices.map((choice, i) => (
              <button
                key={choice.id}
                type="button"
                onClick={() =>
                  setTally((t) => ({ ...t, [choice.id]: (t[choice.id] ?? 0) + 1 }))
                }
                aria-label={`Add a vote for option ${LETTERS[i]}`}
                className="min-h-11 min-w-11 rounded-xl border-2 border-denim bg-denim-wash px-3 text-sm font-bold text-denim-deep hover:bg-surface"
              >
                {LETTERS[i]} +
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTally({})}
              className="min-h-11 rounded-xl border-2 border-sand-deep bg-surface px-3 text-xs font-semibold text-ink-soft hover:bg-paper-deep"
            >
              Clear
            </button>
          </div>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            aria-pressed={showNotes}
            className={`min-h-11 rounded-xl border-2 px-4 text-sm font-semibold ${
              showNotes
                ? "border-marigold-deep bg-marigold-wash text-marigold-deep"
                : "border-sand-deep bg-surface text-ink hover:bg-paper-deep"
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => {
              setStage("plan");
              setIndex(0);
              setRevealed(null);
              setTally({});
            }}
            className="min-h-11 rounded-xl border-2 border-sand-deep bg-surface px-4 text-sm font-semibold text-ink hover:bg-paper-deep"
          >
            Exit
          </button>
          <button
            type="button"
            onClick={next}
            className="min-h-11 rounded-xl border-2 border-pine-deep bg-pine-deep px-6 text-base font-semibold text-white hover:bg-pine"
          >
            {index >= order.length - 1 ? "Go to debrief →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
