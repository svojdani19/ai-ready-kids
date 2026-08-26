"use client";

import { useActionState } from "react";
import { updateSchoolAction, type ActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Bits";
import type { School } from "@/lib/types";

const ACCENTS = [
  { value: "pine", label: "Pine green" },
  { value: "marigold", label: "Marigold" },
  { value: "denim", label: "Denim blue" },
  { value: "berry", label: "Berry" },
];

export function SchoolForm({ school }: { school: School }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateSchoolAction,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <Field label="School name" htmlFor="name" error={state.error}>
          <input
            id="name"
            name="name"
            defaultValue={school.name}
            required
            maxLength={80}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Monogram" htmlFor="monogram" hint="One to three letters, shown in the sidebar.">
        <input
          id="monogram"
          name="monogram"
          defaultValue={school.monogram}
          required
          maxLength={3}
          className={`${inputClass} uppercase`}
        />
      </Field>
      <Field label="Accent colour" htmlFor="brand_accent">
        <select
          id="brand_accent"
          name="brand_accent"
          defaultValue={school.brand_accent}
          className={inputClass}
        >
          {ACCENTS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Programme contact" htmlFor="contact_name">
        <input
          id="contact_name"
          name="contact_name"
          defaultValue={school.contact_name}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Contact email" htmlFor="contact_email">
        <input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={school.contact_email}
          required
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save school details"}
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
