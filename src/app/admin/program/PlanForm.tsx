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

/**
 * A request, and only a request.
 *
 * Until sprint 42 this form wrote plan and licensed_students straight to the
 * school row while its own note said it "records an intent". A school could
 * therefore raise its own paid entitlement by typing a bigger number. The
 * fields below are now what the school would like; what it has is shown above
 * them, read-only, and only the vendor changes that.
 */
export function PlanForm({
  plan,
  seats,
  planLabel,
}: {
  plan: string;
  seats: number;
  planLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    requestPlanChangeAction,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2 rounded-lg border border-sand-deep bg-paper-deep px-4 py-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Your current entitlement
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">
          {planLabel} · {seats} licensed students
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          Set by your agreement and changed by your account contact, not from this page. The
          fields below ask for something different; they do not grant it.
        </p>
      </div>
      <Field label="Plan you would like" htmlFor="plan" error={state.error}>
        <select id="plan" name="plan" defaultValue={plan} className={inputClass}>
          {PLANS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Student places you would like"
        htmlFor="licensed_students"
        hint="The seat count to quote. Your current places do not change until the agreement does."
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
          {pending ? "Sending…" : "Request a quote"}
        </Button>
        {state.ok && (
          <p role="status" className="mt-3 text-sm font-semibold text-pine-deep">
            {state.ok}
          </p>
        )}
        <div className="mt-4">
          <Note tone="neutral" title="What this button does">
            It writes an audit entry saying you asked. It does not change your plan, your
            student places or anybody&apos;s access, and it takes no card details, stores no
            billing identifiers and calls no payment processor. Schools buy this product on
            a purchase order, so the real flow is a quote, a PO and an invoice from your
            account contact.
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
