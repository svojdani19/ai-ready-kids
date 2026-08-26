"use client";

import { useActionState } from "react";
import { findClassByCode, type JoinState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

export function JoinForm() {
  const [state, formAction, pending] = useActionState<JoinState, FormData>(
    findClassByCode,
    {},
  );

  return (
    <form action={formAction} noValidate>
      <label htmlFor="code" className="block font-display text-2xl text-ink">
        Type your class code
      </label>
      <p id="code-hint" className="mt-1.5 text-[0.95rem] text-ink-soft">
        Your teacher will show you the code. It looks like MAPLE-317.
      </p>
      <input
        id="code"
        name="code"
        defaultValue={state.code}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        required
        placeholder="MAPLE-317"
        aria-describedby={state.error ? "code-error" : "code-hint"}
        aria-invalid={state.error ? true : undefined}
        className="mt-4 w-full rounded-2xl border-4 border-ink bg-surface px-5 py-4 text-center font-display text-3xl uppercase tracking-[0.18em] text-ink placeholder:text-sand-deep focus:border-marigold-deep focus:outline-none"
      />
      {state.error && (
        <p
          id="code-error"
          role="alert"
          className="mt-3 rounded-xl border-2 border-berry bg-berry-wash px-4 py-3 text-[0.95rem] font-semibold text-berry-deep"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" variant="kid" size="lg" className="mt-5 w-full" disabled={pending}>
        {pending ? "Looking…" : "Go"}
      </Button>
    </form>
  );
}
