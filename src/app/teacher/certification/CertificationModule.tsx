"use client";

import { useState, useTransition } from "react";
import type { CertificationModule as ModuleContent } from "@/content/types";
import { answerCertificationAction } from "@/app/actions/teacher";

export function CertificationModuleCard({
  module: mod,
  index,
  savedAnswer,
  locked,
}: {
  module: ModuleContent;
  index: number;
  savedAnswer?: string;
  locked: boolean;
}) {
  const [answer, setAnswer] = useState(savedAnswer);
  const [pending, startTransition] = useTransition();

  const chosen = mod.check.options.find((o) => o.id === answer);

  const select = (optionId: string) => {
    if (locked) return;
    setAnswer(optionId);
    startTransition(async () => {
      await answerCertificationAction(mod.id, optionId);
    });
  };

  return (
    <section
      aria-labelledby={`mod-${mod.id}`}
      className="rounded-xl border border-sand-deep bg-surface"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-sand px-5 py-4">
        <h2 id={`mod-${mod.id}`} className="font-display text-lg text-ink">
          {index + 1}. {mod.title}
        </h2>
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
          {mod.minutes} min read
          {answer ? " · answered" : ""}
        </span>
      </header>

      <div className="space-y-3.5 px-5 py-4">
        {mod.body.map((para, i) => (
          <p key={i} className="text-[0.95rem] leading-relaxed text-ink-soft">
            {para}
          </p>
        ))}

        <ul className="rounded-lg border border-sand bg-paper px-4 py-3">
          {mod.keyPoints.map((point) => (
            <li key={point} className="flex gap-2 py-0.5 text-sm leading-relaxed text-ink">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-sand bg-paper px-5 py-4">
        <fieldset disabled={locked || pending}>
          <legend className="text-sm font-semibold text-ink">{mod.check.question}</legend>
          <ul className="mt-3 space-y-2">
            {mod.check.options.map((option) => {
              const isChosen = answer === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => select(option.id)}
                    aria-pressed={isChosen}
                    className={`w-full rounded-lg border-2 px-3.5 py-2.5 text-left text-sm transition-colors disabled:opacity-70 ${
                      isChosen
                        ? option.correct
                          ? "border-pine bg-pine-wash text-ink"
                          : "border-berry bg-berry-wash text-ink"
                        : "border-sand-deep bg-surface text-ink-soft hover:bg-paper-deep"
                    }`}
                  >
                    {option.label}
                    {isChosen && (
                      <span className="ml-2 text-xs font-bold uppercase tracking-[0.08em]">
                        {option.correct ? "· correct" : "· not quite"}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        {chosen && (
          <p
            role="status"
            className="mt-3 rounded-lg border-l-4 border-denim bg-denim-wash px-3.5 py-2.5 text-sm leading-relaxed text-ink"
          >
            {mod.check.explanation}
          </p>
        )}
      </div>
    </section>
  );
}
