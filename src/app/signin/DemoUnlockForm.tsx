"use client";

import { useActionState } from "react";
import { unlockDemo } from "@/app/actions/auth";
import type { FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Bits";

/**
 * The demonstration password.
 *
 * Deliberately says what is behind it. A visitor who has been sent a link
 * should be able to tell whether they are missing a password they were meant
 * to be given, or looking at a door that was never meant for them.
 */
export function DemoUnlockForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(unlockDemo, {});

  return (
    <form action={formAction} noValidate className="max-w-sm">
      <Field
        label="Demonstration password"
        htmlFor="demo-password"
        hint="Whoever shared this link has it."
        error={state.error}
      >
        <input
          id="demo-password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          aria-describedby={state.error ? "demo-password-error" : "demo-password-hint"}
        />
      </Field>
      <Button type="submit" disabled={pending} className="mt-4">
        {pending ? "Checking…" : "Open the demo"}
      </Button>
    </form>
  );
}
