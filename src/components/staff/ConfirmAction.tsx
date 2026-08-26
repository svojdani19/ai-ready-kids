"use client";

import { useState, useTransition } from "react";

/**
 * A destructive control that states its consequence before it will fire.
 * Two steps, plain language, no modal to dismiss by accident.
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

  const base =
    tone === "danger"
      ? "border-berry text-berry-deep hover:bg-berry-wash"
      : "border-sand-deep text-ink-soft hover:bg-paper-deep";

  if (!confirming) {
    return (
      <span>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${base}`}
        >
          {label}
        </button>
        {error && (
          <span role="alert" className="ml-2 text-xs font-semibold text-berry-deep">
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-berry bg-berry-wash px-3 py-2">
      <span className="text-xs leading-snug text-ink">{question}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await action();
            if (result && "error" in result && result.error) {
              setError(result.error);
              setConfirming(false);
            } else {
              setConfirming(false);
            }
          })
        }
        className="rounded border border-berry-deep bg-berry-deep px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Working…" : confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs font-semibold text-ink-soft underline underline-offset-2"
      >
        Cancel
      </button>
    </span>
  );
}
