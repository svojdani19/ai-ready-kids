"use client";

import { useState, useTransition } from "react";
import { reassignClassAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Bits";

/**
 * Hand a class to another teacher. Small and inline, because offboarding a
 * departing teacher is a routine September and June job, not a rare one — and
 * until sprint 31 the only alternatives were deleting every class they owned,
 * students and all, or leaving their account live.
 */
export function ReassignForm({
  classId,
  className,
  currentTeacherId,
  teachers,
}: {
  classId: string;
  className: string;
  currentTeacherId: string;
  teachers: { id: string; name: string }[];
}) {
  const others = teachers.filter((t) => t.id !== currentTeacherId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (others.length === 0) return null;

  if (!open) {
    return (
      <Button type="button" size="sm" variant="quiet" onClick={() => setOpen(true)}>
        Reassign
      </Button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center justify-end gap-2"
      action={(formData) => {
        const teacherId = String(formData.get("teacherId") ?? "");
        start(async () => {
          const result = await reassignClassAction(classId, teacherId);
          if (result?.error) setError(result.error);
          else setOpen(false);
        });
      }}
    >
      <label className="sr-only" htmlFor={`reassign-${classId}`}>
        New teacher for {className}
      </label>
      <select id={`reassign-${classId}`} name="teacherId" className={`${inputClass} w-auto`}>
        {others.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Moving…" : "Move it"}
      </Button>
      <Button type="button" size="sm" variant="quiet" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error && (
        <p role="alert" className="w-full text-right text-sm font-semibold text-clay-deep">
          {error}
        </p>
      )}
    </form>
  );
}
