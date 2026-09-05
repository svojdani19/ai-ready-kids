"use client";

import { useActionState } from "react";
import { setRetentionAction, type ActionState } from "@/app/actions/admin";
import { RETENTION_OPTIONS } from "@/lib/domain/retention";
import { Button } from "@/components/ui/Button";

export function RetentionForm({ current }: { current: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    setRetentionAction,
    {},
  );

  return (
    <form action={formAction} noValidate>
      {/*
        `min-w-0` on the fieldset: browsers give `fieldset` an implicit
        `min-width: min-content`, so it refuses to shrink and — inside a grid
        item, which is `min-width: auto` by default — pushed this panel 176px
        past a 390px viewport. The radio labels wrap perfectly well once the
        fieldset lets them.
      */}
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-ink">
          Keep student records for
        </legend>
        <ul className="mt-3 space-y-2">
          {RETENTION_OPTIONS.map((option) => (
            <li key={option.months}>
              <label className="flex items-start gap-3 rounded-lg border-2 border-sand-deep bg-surface px-3.5 py-2.5 has-checked:border-pine has-checked:bg-pine-wash">
                <input
                  type="radio"
                  name="retention_months"
                  value={option.months}
                  defaultChecked={option.months === current}
                  className="mt-1 h-4 w-4 accent-pine"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{option.label}</span>
                  {"recommended" in option && option.recommended && (
                    <span className="block text-xs text-ink-soft">
                      Recommended: long enough to compare two check-ins, short enough that
                      nothing lingers.
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {state.error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-berry-deep">
          {state.error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save retention window"}
        </Button>
        {state.ok && (
          <p role="status" className="text-sm font-semibold text-pine-deep">
            {state.ok}
          </p>
        )}
      </div>
    </form>
  );
}
