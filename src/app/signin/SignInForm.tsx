"use client";

import { useActionState } from "react";
import { signInWithEmail, type FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Bits";

export function SignInForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    signInWithEmail,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        label="School email address"
        htmlFor="email"
        hint="Any Brightwood staff address works in this demo. No password is required."
        error={state.error}
      >
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="a.okafor@brightwood.demo"
          className={inputClass}
          aria-describedby={state.error ? "email-error" : "email-hint"}
          aria-invalid={state.error ? true : undefined}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
