"use client";

import { useActionState } from "react";
import { setAcademicDatesAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, Note } from "@/components/ui/Bits";
import type { ActionState } from "@/app/actions/admin";
import {
  ACADEMIC_STATE_NOTE,
  type AcademicSettingsState,
} from "@/lib/domain/calendar";

/**
 * Records the academic dates.
 *
 * The note above the form depends on `state`, which the parent computes from
 * the raw stored values — not on whether the prefills are null. Sprint 60
 * stopped prefilling unreadable values, and this form then read those nulls as
 * "missing" and told an administrator the record had come forward from an
 * earlier version. That is a claim about provenance the product cannot support:
 * an absent legacy column and a record somebody corrupted last week look
 * identical from here, and they need different responses.
 */
export function AcademicDatesForm({
  academicYear,
  startsOn,
  endsOn,
  settingsState,
}: {
  /** Null when the stored value is not one this product recognises. */
  academicYear: string | null;
  startsOn: string | null;
  endsOn: string | null;
  /** Decided by the parent from what is actually stored. */
  settingsState: AcademicSettingsState;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    setAcademicDatesAction,
    {},
  );
  const note = settingsState === "ok" ? null : ACADEMIC_STATE_NOTE[settingsState];

  return (
    <form action={action} className="space-y-4">
      {note && (
        <Note tone={settingsState === "unreadable" ? "berry" : "denim"} title={note.title}>
          {note.body}
        </Note>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="School year" htmlFor="academicYear" hint="Like 2025-2026.">
          <input
            id="academicYear"
            name="academicYear"
            defaultValue={academicYear ?? undefined}
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
            defaultValue={startsOn ?? undefined}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Last day" htmlFor="endsOn" hint="Retention counts from here.">
          <input
            id="endsOn"
            name="endsOn"
            type="date"
            defaultValue={endsOn ?? undefined}
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
