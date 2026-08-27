"use client";

import { useActionState } from "react";
import { setAcademicDatesAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, Note } from "@/components/ui/Bits";
import type { ActionState } from "@/app/actions/admin";

/**
 * Records the academic dates. Shown prominently when they are missing, which
 * is how a database migrated from before sprint 32 arrives — retention is
 * blocked until this is filled in, deliberately, because the alternative was
 * guessing a date that might delete a child's records early.
 */
export function AcademicDatesForm({
  academicYear,
  startsOn,
  endsOn,
}: {
  academicYear: string;
  startsOn: string;
  endsOn: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    setAcademicDatesAction,
    {},
  );
  const missing = !startsOn || !endsOn;

  return (
    <form action={action} className="space-y-4">
      {missing && (
        <Note tone="denim" title="This school year has no recorded dates">
          Records brought forward from an earlier version arrive without them, because the
          old database had nowhere to put them and a guess could have deleted a child&rsquo;s
          work early. Nothing is deleted automatically until you fill these in.
        </Note>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="School year" htmlFor="academicYear" hint="Like 2025-2026.">
          <input
            id="academicYear"
            name="academicYear"
            defaultValue={academicYear}
            placeholder="2025-2026"
            className={inputClass}
            required
          />
        </Field>
        <Field label="First day" htmlFor="startsOn">
          <input
            id="startsOn"
            name="startsOn"
            type="date"
            defaultValue={startsOn}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Last day" htmlFor="endsOn" hint="Retention counts from here.">
          <input
            id="endsOn"
            name="endsOn"
            type="date"
            defaultValue={endsOn}
            className={inputClass}
            required
          />
        </Field>
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save these dates"}
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
    </form>
  );
}
