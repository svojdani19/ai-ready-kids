"use client";

import { useActionState } from "react";
import { addTeacherAction, type ActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Bits";

export function AddStaffForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addTeacherAction,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-4" noValidate>
      <Field label="Name" htmlFor="name" error={state.error}>
        <input id="name" name="name" required maxLength={60} className={inputClass} placeholder="Jordan Ellis" />
      </Field>
      <Field label="School email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputClass}
          placeholder="j.ellis@brightwood.demo"
        />
      </Field>
      <Field label="Role or room" htmlFor="title">
        <input
          id="title"
          name="title"
          required
          maxLength={60}
          className={inputClass}
          placeholder="Grade 2 Teacher, Room 6"
        />
      </Field>
      <Field label="Access" htmlFor="role">
        <select id="role" name="role" defaultValue="teacher" className={inputClass}>
          <option value="teacher">Teacher</option>
          <option value="admin">Administrator</option>
        </select>
      </Field>
      <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add staff member"}
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
