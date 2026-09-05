"use client";

import { useEffect, useState } from "react";
import { SceneArt } from "@/components/art/SceneArt";
import type { HeroPanel } from "@/content/hero";

/**
 * The rotating hero panel: one real decision from the curriculum at a time.
 *
 * The panel used to be a still. A still can only ever argue that this product
 * teaches one thing, and a school evaluator who reads "three things" two
 * sections further down has already been shown otherwise. Rotating through one
 * mission per competency makes the hero say what the page says.
 *
 * **Every word here comes from the mission.** This component holds the
 * mechanics and the colours; `content/hero.ts` derives the copy from
 * `MISSIONS`, so nothing child-facing is authored on a marketing page and
 * nothing can drift out of step with the scene it quotes.
 *
 * **Motion.** It stops on hover, on keyboard focus, on request, and entirely
 * for a reader whose system asks for reduced motion. Nothing on this page
 * depends on the rotation: every panel is reachable by its own button, so a
 * stopped carousel is a working one.
 */

const LANE: Record<string, { border: string; wash: string; text: string; dot: string }> = {
  pine: {
    border: "border-pine",
    wash: "bg-pine-wash",
    text: "text-pine-deep",
    dot: "bg-pine",
  },
  marigold: {
    border: "border-marigold",
    wash: "bg-marigold-wash",
    text: "text-marigold-deep",
    dot: "bg-marigold",
  },
  denim: {
    border: "border-denim",
    wash: "bg-denim-wash",
    text: "text-denim-deep",
    dot: "bg-denim",
  },
};

/** Long enough to read a decision and both answers without hurrying. */
const DWELL_MS = 8000;

export function HeroScenes({ panels }: { panels: HeroPanel[] }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [stopped, setStopped] = useState(false);
  // Starts false so the server and the first client render agree; the effect
  // below corrects it before the first tick would have fired.
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const rotating = !held && !stopped && !reducedMotion && panels.length > 1;

  useEffect(() => {
    if (!rotating) return;
    // `index` is a dependency on purpose: choosing a panel restarts its dwell
    // rather than inheriting whatever was left of the previous one.
    const timer = window.setTimeout(
      () => setIndex((current) => (current + 1) % panels.length),
      DWELL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [rotating, index, panels.length]);

  const panel = panels[index];
  const lane = LANE[panel.accent] ?? LANE.pine;

  return (
    <div
      className="overflow-hidden rounded-3xl border-4 border-ink bg-surface shadow-sticker-deep"
      role="group"
      aria-roledescription="carousel"
      aria-label="Decisions from the curriculum"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      {/*
        Keyed on the panel so React replaces the subtree rather than mutating
        it, which is what makes the fade run. The fade itself is one class, and
        the reduced-motion rule in globals.css already neutralises it.
      */}
      <div key={panel.slug} className="ark-fade-in">
        <div className="h-52 border-b-4 border-ink sm:h-60">
          <SceneArt art={panel.art} />
        </div>
        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">
            Mission {panel.missionNumber} · {panel.competencyName}
          </p>
          <p className="mt-2 font-display text-lg leading-snug text-ink sm:text-xl">
            {panel.moment}
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-soft">{panel.prompt}</p>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border-2 border-sand-deep bg-paper px-3.5 py-2.5 text-sm text-ink-soft">
              {panel.tempting}
            </div>
            <div
              className={`rounded-xl border-2 px-3.5 py-2.5 text-sm font-semibold ${lane.border} ${lane.wash} ${lane.text}`}
            >
              {panel.demonstrated} ✓
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-sand-deep px-5 py-3">
        <div className="flex items-center gap-2">
          {panels.map((option, i) => {
            const active = i === index;
            return (
              <button
                key={option.slug}
                type="button"
                onClick={() => setIndex(i)}
                aria-current={active ? "true" : undefined}
                // The mission is named rather than numbered: "slide 2 of 3"
                // tells a screen reader user nothing about what they would get.
                aria-label={`${option.competencyName}: ${option.title}`}
                // Padded rather than drawn larger: the dot stays a dot, and the
                // thing a finger has to land on is a 28px square rather than a
                // 12px one.
                className="-m-2 flex items-center p-2"
              >
                <span
                  className={`block h-3 rounded-full border-2 border-ink transition-all ${
                    active ? `w-8 ${(LANE[option.accent] ?? LANE.pine).dot}` : "w-3 bg-paper"
                  }`}
                />
              </button>
            );
          })}
        </div>
        {/*
          Auto-rotation needs a way to stop it, and a reader who has already
          asked their system for less motion should not be handed a control for
          something that is not running.
        */}
        {!reducedMotion && panels.length > 1 ? (
          <button
            type="button"
            onClick={() => setStopped((was) => !was)}
            className="-my-1 px-1 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-ink-faint underline underline-offset-4 hover:text-ink"
          >
            {stopped ? "Play" : "Pause"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
