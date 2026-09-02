"use client";

import { useActionState } from "react";
import { enterSite, type GateState } from "@/app/actions/gate";

/**
 * One field and a button. `autoFocus` because there is nothing else on the page
 * to do, and `type="password"` so a shared screen or a projector does not show
 * it to a room — which is exactly the setting this product is demonstrated in.
 */
export function GateForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<GateState, FormData>(enterSite, {});

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="text-sm font-semibold text-ink">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoFocus
        autoComplete="current-password"
        required
        aria-describedby={state.error ? "gate-error" : undefined}
        className="mt-1.5 w-full rounded-lg border-2 border-sand-deep bg-paper px-3.5 py-2.5 text-ink outline-none focus:border-ink"
      />
      {state.error && (
        <p id="gate-error" role="alert" className="mt-2 text-sm font-semibold text-berry-deep">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl border-2 border-pine-deep bg-pine-deep px-4 py-2.5 font-medium text-white transition-colors hover:bg-pine disabled:opacity-50"
      >
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
