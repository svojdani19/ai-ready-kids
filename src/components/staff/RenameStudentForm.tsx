"use client";

import { useActionState, useState } from "react";
import { renameStudentAction, type ActionState } from "@/app/actions/teacher";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Bits";

/**
 * Correct a roster name in place.
 *
 * Deliberately says out loud that nothing is lost, because the only previous
 * way to change a name was to delete the child and start again, and a teacher
 * who has done that once will assume this does the same.
 */
export function RenameStudentForm({
  classId,
  studentId,
  displayName,
}: {
  classId: string;
  studentId: string;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    renameStudentAction,
    {},
  );

  if (!open) {
    return (
      <Button type="button" size="sm" variant="quiet" onClick={() => setOpen(true)}>
        Rename
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="studentId" value={studentId} />
      <label className="sr-only" htmlFor={`rename-${studentId}`}>
        New name for {displayName}
      </label>
      <input
        id={`rename-${studentId}`}
        name="displayName"
        defaultValue={displayName}
        maxLength={24}
        required
        className={`${inputClass} w-40`}
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button type="button" size="sm" variant="quiet" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <p className="w-full text-right text-xs text-ink-faint">
        Changing a name keeps every mission, check-in and badge.
      </p>
      {state.error && (
        <p role="alert" className="w-full text-right text-sm font-semibold text-clay-deep">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="w-full text-right text-sm font-semibold text-pine-deep">
          {state.ok}
        </p>
      )}
    </form>
  );
}
