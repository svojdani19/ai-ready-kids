# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 48 — P1: the Cancel that could not cancel

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-48.md`](2026-08-28-sprint-48.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–32 walk ordinary school workflows; 33–34 build the migration path
  and its gate; 35–41 fix teacher-facing and content defects; 42–43 make the paid
  entitlement the vendor's number and enforce it; 44 removed the last claim that
  the product certifies teachers; 45–47 gave the shared navigation and Classroom
  Mode keyboard exits and focus recovery. **Sprint 48 fixes the shared
  confirmation control — the one that guards deletion.**

### What changed

1. **Cancel stayed live after the confirm was pressed, and could not cancel
   anything.** All it did was collapse the interface; the server action carried
   on. An administrator could press *Delete permanently*, have a second thought,
   press *Cancel*, watch the confirmation vanish, reasonably conclude they had
   stopped it — and find the roster, mission history, evidence and both check-ins
   gone. **This is false reassurance at the exact moment doubt should be acted
   on**, and it is worse than no control: without it the user knows they are
   committed and goes looking for a way to recover.
2. **Once the request is away there is no Cancel** — non-interactive text,
   **"Cannot be stopped now"**. Not a disabled button, which still reads as a
   control that might come back.
3. **No reopening or re-firing while pending.** The state stays `confirming`, so
   the launcher does not exist to press again; `disabled` is backed by an
   `inFlight` ref because `disabled` only applies after a re-render and two
   clicks can land before one happens. The action runs **at most once**.
4. **Focus enters the confirmation** — on the confirm button, with the question
   as its `aria-describedby`, so the consequence is read with the control. Still
   an **inline two-step, not a modal**.
5. **Focus comes back on every exit**: pre-submit Cancel (which never calls the
   action), an expected `{error}` (collapse, preserve and announce the
   `role="alert"`, focus the launcher so recovery can start), and success — but
   only if the launcher is **still connected**, since a delete revalidates and
   may take the row with it. Unmount touches nothing.
6. **A previous error is cleared on retry**, so a stale alert cannot sit beside a
   fresh attempt.

### Already verified — please do not redo

- Typecheck, lint, **553 tests** (up from 542), Turbopack production build.
- New `tests/confirm-action.test.tsx`, eleven cases, driven by a **deferred
  promise the test settles by hand**, so the pending state is inspected while the
  action is genuinely in flight rather than guessed at with a timer. **Six
  confirmed to fail against the old component**; five guard what must not
  regress — single invocation under a double press, no reopening while pending,
  error clearing, unmount safety, no focus theft on first render.
- **Admin at 1280×800, archive and restore:** focus entered *Archive class* with
  the question described and no `role="dialog"`; Cancel returned focus to the
  exact launcher with the class still active; and on a real confirm a
  `MutationObserver` watching the row through the transition recorded **"Cannot
  be stopped now"** and a **disabled "Working…"**, while the marker for a live
  Cancel coexisting with pending **never fired**.
- **Teacher at 768×1024, rotate a class code:** focus entered *Change it*;
  Cancel returned focus to *New code* and **the code did not rotate**; on confirm
  the pending text appeared with no live Cancel, the code changed, and focus came
  back to the launcher. No horizontal overflow.
- **Server actions, entitlement enforcement, retention, audit behaviour,
  child-data constraints and the inline non-modal design are unchanged.** No
  caller changed; the `action` contract is untouched.

### Where this is most likely still wrong — best places to push

- **A confirmed action still cannot be undone.** This makes the interface honest
  about that; it does not add an undo. Archive and restore are reversible by
  their opposite, but `deleteClassDataAction` is protected only by the two-step
  and its wording. Whether a school product should offer a grace period on
  permanent deletion is a product decision, not a component one.
- **Focus after success lands on the launcher element, which may have been
  relabelled** — on the admin path React reused the node and it went from
  *Restore* to *Archive*, because the action succeeded and the row changed. That
  is the right outcome, but "restore focus to the launcher" and "restore focus to
  a button with the same label" are different things, and only the first is
  achievable when the action changes what the row offers.
- **The overlay pattern still has candidates**: the student mission player's
  full-screen states and the read-aloud control have not been checked for focus
  containment, return-focus or modal semantics — sprints 45–47.
- **No general keyboard-only pass exists**, only the surfaces a sprint touched.
- **Nothing reconciles the entitlement against an actual agreement** — sprint 42.
  Only enrolment and restoration are metered — sprint 43. **Lapsed-subscription
  enforcement remains documented and unbuilt.**
- **The certification guard is a word list on a file list** — sprint 44.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings**,
  unrelated to this work.
- **Only one previous schema shape is recognised** — sprint 34. No
  down-migrations.
- **The route and action inventory is still not complete.**
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Every mission has been read once. None has been read twice.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
