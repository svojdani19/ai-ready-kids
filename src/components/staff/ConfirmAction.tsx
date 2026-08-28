"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

/**
 * A destructive control that states its consequence before it will fire.
 * Two steps, plain language, no modal to dismiss by accident.
 *
 * Sprint 48 fixed two things that were wrong once the action was actually
 * running, and one that was wrong for anybody using a keyboard.
 *
 * **Cancel used to lie.** It stayed operative after the confirm button was
 * pressed, and all it did was collapse the interface — `setConfirming(false)`.
 * The server action carried on. An administrator could press Cancel on a class
 * deletion, watch the confirmation disappear, reasonably conclude they had
 * stopped it, and then find the roster gone. A control that says Cancel and
 * cannot cancel is worse than no control: it converts a moment of doubt into
 * false reassurance, on exactly the operations where doubt should be acted on.
 * Once the request is away there is nothing truthful to offer but a statement
 * of fact, so that is what it offers.
 *
 * **Focus went nowhere.** Opening the confirmation unmounted the button that
 * had focus and put focus on nothing; collapsing it left the user wherever that
 * had dropped them. Same defect class as sprints 45-47, in the control that
 * guards deletion.
 */
export function ConfirmAction({
  label,
  confirmLabel,
  question,
  action,
  tone = "danger",
}: {
  label: string;
  confirmLabel: string;
  question: string;
  action: () => Promise<void | { error?: string }>;
  tone?: "danger" | "quiet";
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const questionId = useId();
  const launcher = useRef<HTMLButtonElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);
  /** Set when a collapse should hand focus back, so a first render does not. */
  const restoreFocus = useRef(false);
  /**
   * Belt and braces against a double fire. `disabled={pending}` only takes
   * effect after a re-render, and two clicks can land before one happens.
   */
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (confirming) {
      // Focus the confirm action itself. It is the reason the step exists, and
      // it carries the question as its description.
      confirm.current?.focus();
      return;
    }
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    const el = launcher.current;
    // `isConnected` matters on success: a delete revalidates the page, and the
    // row this control lived in may be gone. Focusing a detached node puts
    // focus on nothing, which is the defect this is here to avoid.
    if (el?.isConnected) el.focus();
  }, [confirming]);

  const base =
    tone === "danger"
      ? "border-berry text-berry-deep hover:bg-berry-wash"
      : "border-sand-deep text-ink-soft hover:bg-paper-deep";

  const run = () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    startTransition(async () => {
      let result: void | { error?: string };
      try {
        result = await action();
      } finally {
        inFlight.current = false;
      }
      if (!mounted.current) return;
      if (result && "error" in result && result.error) setError(result.error);
      // Collapse either way, and ask for focus back. An expected error leaves
      // the administrator at the launcher with the alert beside it, which is
      // where recovering from it starts.
      restoreFocus.current = true;
      setConfirming(false);
    });
  };

  const cancel = () => {
    // Pre-submit only. This button does not exist once the request is away.
    restoreFocus.current = true;
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <span className="inline-block">
        <button
          ref={launcher}
          type="button"
          onClick={() => setConfirming(true)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${base}`}
        >
          {label}
        </button>
        {/* A block, not an inline span. A refusal that has to state four
            numbers and where to go next is a sentence, and a sentence squeezed
            beside a button in a table cell is unreadable. */}
        {error && (
          <span
            role="alert"
            className="mt-1.5 block max-w-[22rem] text-left text-xs font-semibold leading-snug text-berry-deep"
          >
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-berry bg-berry-wash px-3 py-2">
      <span id={questionId} className="text-xs leading-snug text-ink">
        {question}
      </span>
      <button
        ref={confirm}
        type="button"
        disabled={pending}
        aria-describedby={questionId}
        onClick={run}
        className="rounded border border-berry-deep bg-berry-deep px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Working…" : confirmLabel}
      </button>
      {pending ? (
        // Not a button. There is nothing left to press: the request is with the
        // server and this component cannot recall it. Saying so plainly is the
        // only honest thing on offer.
        <span className="text-xs font-semibold text-ink-soft">Cannot be stopped now</span>
      ) : (
        <button
          type="button"
          onClick={cancel}
          className="text-xs font-semibold text-ink-soft underline underline-offset-2"
        >
          Cancel
        </button>
      )}
    </span>
  );
}
