"use client";

import { useActionState } from "react";
import { requestPlanChangeAction, type ActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, Note } from "@/components/ui/Bits";

const PLANS = [
  { value: "classroom", label: "Single classroom · $390 / year", seats: 30 },
  { value: "school", label: "Whole school · $2,400 / year", seats: 400 },
  { value: "district", label: "District · annual agreement", seats: 5000 },
];

export function PlanForm({ plan, seats }: { plan: string; seats: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    requestPlanChangeAction,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Plan" htmlFor="plan" error={state.error}>
        <select id="plan" name="plan" defaultValue={plan} className={inputClass}>
          {PLANS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Licensed students"
        htmlFor="licensed_students"
        hint="Used for the seat count on your invoice."
      >
        <input
          id="licensed_students"
          name="licensed_students"
          type="number"
          min={1}
          max={5000}
          defaultValue={seats}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Recording…" : "Request a quote"}
        </Button>
        {state.ok && (
          <p role="status" className="mt-3 text-sm font-semibold text-pine-deep">
            {state.ok}
          </p>
        )}
        <div className="mt-4">
          <Note tone="neutral" title="No billing in this build">
            This form records an intent and writes an audit entry. It takes no card details,
            stores no billing identifiers and calls no payment processor. Schools buy this
            product on a purchase order, so the real flow is a quote, a PO and an invoice
            from your account contact.
          </Note>
          <Note tone="neutral" title="Choosing District does not enable anything">
            The plan is a label on this school&rsquo;s record. Roster sync, single sign-on and
            multi-school rollup reporting are not built, and selecting District does not
            switch them on or change what this product can do.
          </Note>
        </div>
      </div>
    </form>
  );
}
