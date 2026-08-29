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
      {/* Shown, not hidden. The year the class lands in is the thing most
          likely to be wrong in August, and it used to be invisible — and
          ignored, since the action now takes it from the school record. */}
      <p className="sm:col-span-4 text-sm text-ink-soft">
        New classes join the current school year, <strong>{schoolYear}</strong>. Roll the
        school over on the Program &amp; plan page when the year changes.
      </p>
      <div className="sm:col-span-2">
        <Field label="Class name" htmlFor="name" hint="What the room is called, like Room 7." error={state.error}>
          <input id="name" name="name" required maxLength={40} className={inputClass} placeholder="Room 7" />
        </Field>
      </div>
      {/* Grades 1 and 5 are here for First Look, which is written for them.
          The twenty-seven core missions are reading-levelled for grades 2 to 4
          and say so on every library card, so a grade 1 or grade 5 teacher can
          see what they are assigning rather than finding out in the lesson. */}
      <Field
        label="Grade"
        htmlFor="grade"
        hint="Grades 1 and 5 get the First Look sessions written for them."
      >
        <select id="grade" name="grade" defaultValue="3" className={inputClass}>
          <option value="1">Grade 1</option>
          <option value="2">Grade 2</option>
          <option value="3">Grade 3</option>
          <option value="4">Grade 4</option>
          <option value="5">Grade 5</option>
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
