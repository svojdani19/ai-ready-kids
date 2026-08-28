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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    setError(null);
    startTransition(async () => {
      const result = await setAssignmentAction({ classId, missionId, assigned: next });
      // Put the switch back if the server refused. An optimistic toggle that
      // stays flipped after a refusal tells a teacher a mission is assigned
      // when it is not, which is worse than the refusal itself.
      if (result?.error) {
        setOn(!next);
        setError(result.error);
      }
    });
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
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
    {error && (
      <span role="alert" className="max-w-[22rem] text-left text-xs font-semibold leading-snug text-berry-deep">
        {error}
      </span>
    )}
    </span>
  );
}
