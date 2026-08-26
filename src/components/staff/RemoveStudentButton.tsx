"use client";

import { useState, useTransition } from "react";
import { removeStudentAction } from "@/app/actions/teacher";

/**
 * Two-step delete. Removing a student removes their mission history and
 * check-ins with them, so the confirmation says exactly that rather than
 * asking a vague "are you sure".
 */
export function RemoveStudentButton({
  classId,
  studentId,
  displayName,
}: {
  classId: string;
  studentId: string;
  displayName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold text-ink-faint underline underline-offset-2 hover:text-berry-deep"
      >
        Remove
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-ink-soft">Delete all records?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await removeStudentAction(classId, studentId);
          })
        }
        className="rounded border border-berry px-2 py-0.5 text-xs font-semibold text-berry-deep hover:bg-berry-wash disabled:opacity-60"
      >
        {pending ? "Removing…" : `Yes, remove ${displayName}`}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs font-semibold text-ink-faint underline underline-offset-2 hover:text-ink"
      >
        Cancel
      </button>
    </span>
  );
}
