import type { ReactNode } from "react";

/**
 * Supporting detail, folded away until somebody wants it.
 *
 * Native `<details>` on purpose. It is keyboard operable, it is announced as
 * expandable, it works with JavaScript disabled, and browser find-in-page opens
 * it — none of which is true of a div with an onClick, and all of which a school
 * evaluator running a screen reader will notice.
 *
 * **What must never go in here.** Anything a person needs to read *before*
 * acting: a warning about deleting data, rotating a code, changing access or
 * rolling over a year. This is for methodology, inventories and rationale —
 * material that is worth keeping and not worth reading first. `globals.css`
 * forces every one of these open when the page is printed, so nothing
 * disappears from a report a district files.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: string;
  children: ReactNode;
  /** Open on load. For a section that is usually wanted but still separable. */
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="ark-disclosure group rounded-2xl border-2 border-sand-deep bg-surface"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-bold text-ink hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
        {summary}
        <span
          aria-hidden="true"
          className="shrink-0 text-lg font-bold leading-none text-ink-faint transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="border-t-2 border-sand-deep px-4 py-3.5 text-[0.95rem] leading-relaxed text-ink-soft">
        {children}
      </div>
    </details>
  );
}
