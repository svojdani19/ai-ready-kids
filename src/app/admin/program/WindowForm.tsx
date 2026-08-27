"use client";

import { useActionState } from "react";
import { setBenchmarkWindowAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Note } from "@/components/ui/Bits";
import type { BenchmarkWindow } from "@/lib/types";

const CHOICES: { value: BenchmarkWindow; label: string; detail: string }[] = [
  {
    value: "closed",
    label: "Closed",
    detail: "Nobody can start or continue a check-in. This is the default.",
  },
  {
    value: "pre",
    label: "Fall window open",
    detail: "Students are offered the fall check-in. The spring form stays unavailable.",
  },
  {
    value: "post",
    label: "Spring window open",
    detail: "Students are offered the spring check-in. The fall form is closed.",
  },
];

export function WindowForm({ current }: { current: BenchmarkWindow }) {
  const [state, action, pending] = useActionState(setBenchmarkWindowAction, {});

  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-2.5">
        <legend className="sr-only">Check-in window</legend>
        {CHOICES.map((c) => (
          <label
            key={c.value}
            className="flex gap-3 rounded-xl border border-sand-deep bg-paper p-3.5 has-[:checked]:border-pine has-[:checked]:bg-pine-wash"
          >
            <input
              type="radio"
              name="window"
              value={c.value}
              defaultChecked={current === c.value}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">{c.label}</span>
              <span className="block text-sm leading-relaxed text-ink-soft">{c.detail}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save window"}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-clay-deep">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm font-semibold text-pine-deep">
          {state.ok}
        </p>
      )}

      <Note tone="neutral" title="Why this is a switch and not a date">
        The fall and spring check-ins are two authored forms, and the difference between
        them is only a year&rsquo;s difference if a year passed. Nothing here schedules
        itself: a window opens because somebody opened it, and closes the same way. While
        both are closed, no child can start or resume either form, by any route.
      </Note>
    </form>
  );
}
