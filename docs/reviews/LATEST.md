# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 47 — P1: the board covered the application but not the tab order

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-47.md`](2026-08-28-sprint-47.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–32 walk ordinary school workflows; 33–34 build the migration path
  and its gate; 35–41 fix teacher-facing and content defects; 42–43 make the paid
  entitlement the vendor's number and enforce it; 44 removed the last claim that
  the product certifies teachers; 45–46 gave the shared navigation a keyboard
  exit at both widths. **Sprint 47 is the same defect class in the place it
  matters most: the surface a teacher is holding while a class watches.**

### What changed

1. **Classroom Mode painted over the application without taking it out of the
   tab order.** `fixed inset-0`, no modal semantics, no focus containment, and an
   Exit button that unmounted while focused without restoring the launcher. A
   teacher driving from the keyboard tabs one stop too far onto a control the
   projector covers, **nothing on screen changes**, and there is no way to tell
   what happened — then Exit drops them at the top of the document with the class
   waiting.
2. **Both full-screen states are now one labelled modal surface**, present and
   debrief, each with `role="dialog"`, `aria-modal="true"` and a name. **The plan
   page is not modal** — reading a lesson plan is ordinary page reading.
3. **Tab and Shift+Tab stay inside the surface.** Tab is intercepted and wrapped
   rather than the background being made inert, which keeps the change inside
   Classroom Mode as scoped. `tabindex="-1"` is excluded, so the stage wrapper
   stays available for programmatic focus without becoming a stop.
4. **It contains without trapping**: Exit, ← Back, Next/Go to debrief and Notes
   are all on screen and all in the cycle, and a test asserts they are visible.
5. **Exit returns focus to the exact launcher that opened the board.** Which of
   the two "Put it on the board" buttons was pressed is recorded at launch — a
   teacher who launched from the foot of the plan and lands back at the top has
   lost their place, which is the same defect in a smaller form.
6. **Only Exit restores.** "Finish and open the guide" navigates normally and
   nothing pulls focus back.
7. **Every presenter shortcut is untouched** — arrows, space, Page Up/Down, 1–4,
   N, and Escape still returning from a revealed branch to the choice list.
   **Escape is not an exit from Classroom Mode**, and the trap ignores it.

### Already verified — please do not redo

- Typecheck, lint, **542 tests** (up from 531), Turbopack production build.
- Eleven tests added, twenty-two in the file, **nine confirmed to fail without
  the fix** by stashing the component. They render the real component **inside
  the page furniture it covers** — header link, sign-out button, footer link — so
  "does Tab reach the navigation" is asked rather than assumed. Coverage: modal
  semantics on both states and none on the plan; forward and reverse containment
  over thirty stops each, asserting on every iteration that focus is inside and
  that each underlying control does **not** have it; debrief containment; the
  visible exits; exact-launcher recovery from **both** buttons; no focus theft on
  guide navigation; stage-change focus landing on something visible inside the
  surface; and a shortcut regression covering 1–4, Escape-to-choice-list with the
  dialog still open, N both ways, and arrows/Page keys forwards and back.
- **Browser-checked at 1280×800, keyboard only:** launched from the second
  button; 30 Tabs and 25 Shift+Tabs stayed inside the board; ArrowRight to the
  debrief, label switches, 12 more Tabs contained; ← Back then Exit → dialog
  gone, **focus on the second launcher**, visible.
- **768×1024:** containment over 20 Tabs, all four board controls 44px tall, no
  horizontal overflow, and Exit from a header launch returned focus to the
  **header** launcher.
- **No curriculum, recording, student-data or subscription change**, and no
  change to what Escape means.

### Where this is most likely still wrong — best places to push

- **The background is not `inert`.** Containment is enforced by intercepting Tab,
  so covered controls remain focusable in principle — a screen-reader virtual
  cursor or a browser's link list could still surface them, and `aria-modal` is
  the only thing telling assistive technology to ignore them. Real `inert` would
  be stronger and means reaching outside this component; worth doing
  deliberately rather than as a side effect.
- **The pattern across 45, 46 and 47 is now nameable: this product builds
  overlays well and finishes them for pointers.** The remaining candidates are
  the `ConfirmAction` two-step, the student mission player's full-screen states,
  and the read-aloud control. None has been checked for focus containment,
  return-focus, or modal semantics.
- **No general keyboard-only pass exists**, only the surfaces a sprint touched.
- **Mobile panel state survives a resize** — sprint 46. Focus-safe, still a state
  wrinkle.
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
