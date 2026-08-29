"use client";

import { useActionState } from "react";
import { rolloverYearAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Note } from "@/components/ui/Bits";
import type { RolloverPreview } from "@/lib/domain/rollover";

/**
 * Shows exactly what a rollover will do before it does it. Everything here is
 * computed on the server by `previewRollover`; this only renders it.
 */
export function RolloverForm({ preview }: { preview: RolloverPreview | { error: string } }) {
  const [state, action, pending] = useActionState(
    async () => rolloverYearAction(),
    {} as { ok?: string; error?: string },
  );

  if ("error" in preview) {
    return (
      <Note tone="neutral" title="Rollover unavailable">
        {preview.error}
      </Note>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-[0.95rem] leading-relaxed text-ink">
        Moving from <strong>{preview.fromYear}</strong> to <strong>{preview.toYear}</strong>.
      </p>
      <ul className="space-y-2 text-sm leading-relaxed text-ink-soft">
        <li>
          <strong>{preview.toArchive.length}</strong>{" "}
          {preview.toArchive.length === 1 ? "class" : "classes"} archived
          {preview.toArchive.length > 0 && (
            <>: {preview.toArchive.map((c) => c.name).join(", ")}</>
          )}
          . {preview.alreadyArchived > 0 && `${preview.alreadyArchived} already archived, untouched.`}
        </li>
        {/* What archiving now does to access, stated before the button rather
            than discovered afterwards. Sprint 69 made archive close student
            sessions and rotate the code; a preview that omitted that would be
            describing the old behavior. */}
        <li>
          Each newly archived class gets a <strong>new join code</strong>, and children
          signed in to it are asked to rejoin on their next request. The old codes and
          sessions stay invalid even if you restore a class later.
        </li>
        <li>
          New classes will be created in <strong>{preview.toYear}</strong>, ending{" "}
          <strong>{preview.endsOn}</strong>.
        </li>
        <li>
          Check-ins{" "}
          {preview.windowWasOpen
            ? "close, so the new cohort is not handed last year's form."
            : "stay closed."}
        </li>
        <li>{preview.retentionNote}</li>
      </ul>

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Rolling over…" : `Start ${preview.toYear}`}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-clay-deep">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm font-semibold text-pine-deep">
          {state.ok}
        </p>
      )}

      <Note tone="neutral" title="Subscription dates do not move">
        Renewal is a separate thing on a separate date, and this does not touch it. The
        school year is when the children arrive and go home; renewal is when the invoice
        goes out. Retention counts from the first.
      </Note>
    </form>
  );
}
