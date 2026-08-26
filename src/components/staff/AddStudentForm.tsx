"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStudentAction, type ActionState } from "@/app/actions/teacher";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Bits";

export function AddStudentForm({ classId }: { classId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addStudentAction,
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      if (inputRef.current) inputRef.current.value = "";
      inputRef.current?.focus();
    }
  }, [state.ok]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3" noValidate>
      <input type="hidden" name="classId" value={classId} />
      <div className="min-w-[16rem] flex-1">
        <Field
          label="Add a student"
          htmlFor="displayName"
          hint="First name and last initial only, like Sam R."
          error={state.error}
        >
          <input
            id="displayName"
            name="displayName"
            ref={inputRef}
            required
            maxLength={24}
            autoComplete="off"
            placeholder="Sam R."
            className={inputClass}
            aria-describedby={state.error ? "displayName-error" : "displayName-hint"}
            aria-invalid={state.error ? true : undefined}
          />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add to roster"}
      </Button>
      {state.ok && (
        <p role="status" className="w-full text-sm font-semibold text-pine-deep">
          {state.ok}
        </p>
      )}
    </form>
  );
}
