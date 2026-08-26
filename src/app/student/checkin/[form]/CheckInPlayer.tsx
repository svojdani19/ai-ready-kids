"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BenchmarkFormContent } from "@/content/types";
import { finishCheckIn, submitCheckInAnswer } from "@/app/actions/student";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ReadAloud } from "@/components/student/ReadAloud";

/**
 * The check-in player.
 *
 * No feedback, no running score, no timer and no "correct" chime. A child
 * should finish this with no idea how they did, because the measurement is
 * for the adults and telling a seven year old they got four of nine would be
 * both useless and unkind.
 *
 * Answering is deliberately two steps: the first tap only selects, and a
 * separate Next saves it. An earlier build saved and advanced on the first
 * tap, which meant a stray finger on a Chromebook trackpad silently recorded
 * an answer the child never intended and moved the story on before they could
 * see what happened. At this age the cost of an accidental tap is not a
 * moment of annoyance, it is a wrong measurement nobody can detect later.
 *
 * Next also waits for the server before it moves. An earlier build fired the
 * save and advanced in the same tick, so a dropped school network left the
 * child two stories further on while an error described an answer they could
 * no longer see — and the answer itself was simply gone. Assessment data that
 * disappears quietly is worse than assessment data that fails loudly.
 */
export function CheckInPlayer({
  content,
  initialResponses,
}: {
  content: BenchmarkFormContent;
  initialResponses: Record<string, string>;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"intro" | "items" | "done">("intro");
  const [index, setIndex] = useState(() => {
    const firstUnanswered = content.items.findIndex((i) => !initialResponses[i.id]);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  /** Saved answers. Only ever written after an explicit confirmation. */
  const [responses, setResponses] = useState(initialResponses);
  /**
   * The selection in progress, tied to the item it was made on. Moving away
   * without confirming discards it, so Back always restores what was saved.
   */
  const [pending, setPending] = useState<{ itemId: string; optionId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  /**
   * Marking the whole check-in finished is its own save, and it can fail on
   * its own. Until it succeeds the child stays on the closing screen: routing
   * away first would leave a check-in with nine answers and no completion
   * marker, which every report then treats as unfinished.
   */
  const [finishState, setFinishState] = useState<"idle" | "saving" | "error">("idle");
  const [saving, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [index, stage]);

  const item = content.items[index];
  const answered = Object.keys(responses).length;
  const selected = item
    ? (pending?.itemId === item.id ? pending.optionId : responses[item.id])
    : undefined;
  const isLast = index === content.items.length - 1;

  const spokenItem = item
    ? [
        item.scenario,
        item.question,
        ...item.options.map((o, i) => `Choice ${i + 1}. ${o.label}`),
      ].join(" ")
    : "";

  /** First tap: selects only. Nothing is sent and nothing moves. */
  const select = (optionId: string) => {
    setPending({ itemId: item.id, optionId });
    setError(null);
  };

  /**
   * Second tap: saves the selection and only then moves on. A failure keeps
   * the child exactly where they are, with their pick still highlighted.
   */
  const confirm = () => {
    if (!selected || saving) return;
    const optionId = selected;
    const itemId = item.id;
    setError(null);

    startTransition(async () => {
      let saved = false;
      try {
        const result = await submitCheckInAnswer({
          form: content.form,
          itemId,
          optionId,
        });
        saved = result.ok;
        if (!result.ok) setError(result.error);
      } catch {
        setError("We could not save that answer just now.");
      }

      if (!saved) return;

      setResponses((prev) => ({ ...prev, [itemId]: optionId }));
      setPending(null);
      if (isLast) setStage("done");
      else setIndex(index + 1);
    });
  };

  /** Back discards anything unconfirmed and shows the saved answer again. */
  const goBack = () => {
    if (saving) return;
    setPending(null);
    setError(null);
    setIndex(Math.max(0, index - 1));
  };

  /**
   * Idempotent by design: the server only stamps a completion time if there
   * is not one already, so tapping Try again after a partial failure cannot
   * produce a second, later marker.
   */
  const finish = () => {
    if (finishState === "saving") return;
    setFinishState("saving");
    startTransition(async () => {
      try {
        await finishCheckIn(content.form);
        router.push("/student");
      } catch {
        setFinishState("error");
      }
    });
  };

  if (stage === "intro") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl text-ink focus:outline-none">
          {content.title}
        </h1>
        <div className="mt-5 space-y-3.5 rounded-3xl border-4 border-ink bg-surface p-6">
          {content.intro.map((line) => (
            <p key={line} className="text-lg leading-relaxed text-ink">
              {line}
            </p>
          ))}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="kid" size="lg" onClick={() => setStage("items")}>
              {answered > 0 ? "Carry on" : "Start"}
            </Button>
            <ButtonLink href="/student" variant="secondary" size="lg">
              Not right now
            </ButtonLink>
            <ReadAloud key="intro" text={content.intro.join(" ")} />
          </div>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl text-ink focus:outline-none">
          All done
        </h1>
        <div className="mt-5 space-y-3.5 rounded-3xl border-4 border-ink bg-pine-wash p-6">
          {content.outro.map((line) => (
            <p key={line} className="text-lg leading-relaxed text-ink">
              {line}
            </p>
          ))}

          {finishState === "error" && (
            <p
              role="alert"
              className="rounded-xl border-2 border-berry bg-surface px-4 py-3 text-[0.95rem] font-semibold text-berry-deep"
            >
              We could not finish saving just now. All {content.items.length} of your
              answers are safe. Tap Try again when you are ready.
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="kid"
              size="lg"
              onClick={finish}
              disabled={finishState === "saving"}
            >
              {finishState === "saving"
                ? "Saving…"
                : finishState === "error"
                  ? "Try again"
                  : "Finish"}
            </Button>
            <ReadAloud key="outro" text={content.outro.join(" ")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* The sr-only heading below already announces this, so the visible
            copy is hidden from assistive technology rather than read twice. */}
        <p aria-hidden="true" className="text-sm font-semibold text-ink-soft">
          Story {index + 1} of {content.items.length}
        </p>
        <div className="flex items-center gap-2">
          <ReadAloud key={item.id} text={spokenItem} />
          <ButtonLink href="/student" variant="secondary" size="sm" className="min-h-11">
            Save and exit
          </ButtonLink>
        </div>
      </div>
      <ol className="mt-2 flex gap-1.5" aria-hidden="true">
        {content.items.map((it, i) => (
          <li
            key={it.id}
            className={`h-2 flex-1 rounded-full ${
              responses[it.id] ? "bg-denim" : i === index ? "bg-marigold-deep" : "bg-sand"
            }`}
          />
        ))}
      </ol>

      <article className="mt-5 rounded-3xl border-4 border-ink bg-surface p-6">
        <h1 ref={headingRef} tabIndex={-1} className="sr-only focus:outline-none">
          Story {index + 1} of {content.items.length}
        </h1>
        <p className="text-lg leading-[1.7] text-ink sm:text-xl">{item.scenario}</p>

        {/* Native radios: arrow keys move the selection, the browser handles
            the roving tab stop, and nothing is submitted by choosing one. */}
        <fieldset className="mt-6">
          <legend className="mb-3 font-display text-xl leading-snug text-ink">
            {item.question}
          </legend>
          <ul className="space-y-3">
            {item.options.map((option, i) => {
              const chosen = selected === option.id;
              return (
                <li key={option.id}>
                  <label
                    className={`ark-sticker flex w-full cursor-pointer items-start gap-3 rounded-2xl border-4 px-4 py-3.5 text-left transition-colors ${
                      chosen
                        ? "border-denim-deep bg-denim-wash"
                        : "border-ink bg-paper hover:bg-marigold-wash"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`item-${item.id}`}
                      value={option.id}
                      checked={chosen}
                      onChange={() => select(option.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-display text-base font-bold ${
                        chosen
                          ? "border-denim-deep bg-denim-deep text-white"
                          : "border-ink bg-surface text-ink"
                      }`}
                    >
                      {chosen ? "✓" : i + 1}
                    </span>
                    <span className="pt-0.5 text-[1.05rem] leading-snug text-ink sm:text-lg">
                      {option.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <p className="mt-4 text-sm text-ink-soft" role="status">
          {saving
            ? "Saving your answer…"
            : selected
              ? "That is your pick. Tap Next to keep it, or choose a different one."
              : "Pick the one you would really do. Nothing is saved until you tap Next."}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border-2 border-berry bg-berry-wash px-4 py-3 text-[0.95rem] font-semibold text-berry-deep"
          >
            {error} Your pick is still here. Tap Try again when you are ready.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={goBack} disabled={index === 0 || saving}>
            ← Back
          </Button>
          <Button
            variant="kid"
            size="lg"
            onClick={confirm}
            disabled={!selected || saving}
          >
            {saving ? "Saving…" : error ? "Try again" : isLast ? "Finish" : "Next"}
          </Button>
        </div>
      </article>
    </div>
  );
}
