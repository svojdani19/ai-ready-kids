"use client";

import { useState, useTransition } from "react";
import { setAssignmentAction } from "@/app/actions/teacher";

export function AssignToggle({
  classId,
  missionId,
  missionTitle,
  className: cls,
  assigned,
}: {
  classId: string;
  missionId: string;
  missionTitle: string;
  className: string;
  assigned: boolean;
}) {
  const [on, setOn] = useState(assigned);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await setAssignmentAction({ classId, missionId, assigned: next });
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${missionTitle} assigned to ${cls}`}
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        on
          ? "border-pine bg-pine-wash text-pine-deep"
          : "border-sand-deep bg-surface text-ink-soft hover:bg-paper-deep"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-3.5 w-3.5 rounded-full border-2 ${
          on ? "border-pine bg-pine" : "border-sand-deep bg-paper"
        }`}
      />
      {on ? "Assigned" : "Assign"}
    </button>
  );
}
