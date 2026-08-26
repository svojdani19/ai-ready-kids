"use client";

import { useActionState } from "react";
import { createClassAction, type ActionState } from "@/app/actions/teacher";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Bits";
import type { User } from "@/lib/types";

export function CreateClassForm({
  teachers,
  schoolYear,
}: {
  teachers: User[];
  schoolYear: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createClassAction,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-4" noValidate>
      <input type="hidden" name="schoolYear" value={schoolYear} />
      <div className="sm:col-span-2">
        <Field label="Class name" htmlFor="name" hint="What the room is called, like Room 7." error={state.error}>
          <input id="name" name="name" required maxLength={40} className={inputClass} placeholder="Room 7" />
        </Field>
      </div>
      <Field label="Grade" htmlFor="grade">
        <select id="grade" name="grade" defaultValue="3" className={inputClass}>
          <option value="2">Grade 2</option>
          <option value="3">Grade 3</option>
          <option value="4">Grade 4</option>
        </select>
      </Field>
      <Field label="Teacher" htmlFor="teacherId">
        <select id="teacherId" name="teacherId" className={inputClass}>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create class"}
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
