# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 45 — P1: Escape closed the menu and abandoned the user in it

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-45.md`](2026-08-28-sprint-45.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–32 walk ordinary school workflows; 33–34 build the migration path
  and its gate; 35–41 fix teacher-facing and content defects; 42–43 make the paid
  entitlement the vendor's number and enforce it at enrolment and restoration;
  44 removed the last claim that the product certifies teachers. **Sprint 45
  fixes the keyboard-focus defect sprint 44 found while checking that copy.**

### What changed

1. **Escape stranded keyboard users.** With a desktop dropdown open and one of
   its links focused, Escape hid the menu and left focus on that link — still in
   the document, no longer visible — so the next Tab continued from a place the
   user could not see. A sighted pointer user never meets this; a keyboard or
   switch user meets it every time. For an accessibility assessment, **a
   dismissal that does not say where focus went is not a way out.**
2. **`useDismiss` now reports why it fired.** The close callback takes a
   `DismissReason` — `"escape" | "pointer" | "focus"` — and only Escape returns
   focus, to the exact trigger that opened that menu.
3. **Two guards, both deliberate.** Reason, because every other dismissal already
   leaves focus somewhere the user chose — the link they followed, what they
   clicked, what they tabbed to — and pulling it back would be *taking* focus.
   And `hadFocus`, so the refocus only happens when focus is actually inside the
   menu being hidden; if the user has already moved on there is nothing to
   recover.
4. **No reopen loop.** The refocus lands on the trigger, which is inside the
   wrapper, so the `focusin` dismissal handler sees a target it contains and does
   nothing. Click-outside and focus-out behaviour is otherwise untouched.

### Already verified — please do not redo

- Typecheck, lint, **523 tests** (up from 513), Turbopack production build.
- New `tests/site-header.test.tsx` — jsdom and Testing Library, ten cases,
  against the real component rather than the source, because **focus is
  behaviour**: the question is where the browser puts it, not which line was
  written.
- **Four assert the fix and were confirmed to fail without it**: Escape returns
  focus to the trigger with `aria-expanded="false"` and the link neither focused
  nor visible; each trigger gets its own menu back, not a sibling's; the refocus
  does not reopen the menu and a second Escape is a no-op; Escape still works the
  second time a menu is opened.
- **Six assert it does not over-correct** and pass either way, which is the
  point — a fix that grabs focus is as bad as one that strands it: choosing a
  link, clicking outside, focus moving away on its own, and toggling the trigger
  closed all leave focus where the user put it.
- **Browser-checked at 1280×800, keyboard only:** open, Tab among links, focus on
  *Administrators*, Escape → menu hidden, focus on the trigger and **visible**,
  and Tab from there proceeds to the next visible control (*See the demo*) in
  document order.
- **Browser-checked at 768×1024:** mobile navigation unchanged — desktop triggers
  are not rendered at that width, the panel opens from its own Menu button with
  ten links, and closing it leaves focus on that button, visible and not
  stranded. No horizontal overflow.
- **No curriculum, subscription or child-data change.** Shared header only.

### Where this is most likely still wrong — best places to push

- **The mobile panel does not respond to Escape at all.** It never did, and this
  sprint was asked to leave mobile unchanged, so it is left. It strands nobody
  today because the only way to close it is the button that keeps focus. If
  Escape is added there it needs the same reason-aware treatment.
- **No other closable surface has been checked for this.** The `ConfirmAction`
  two-step, Classroom Mode's overlay and any future dialog all pose the same
  question — is it shut, and where is the user now? — and none has been asked.
- **This is the first interaction test in the suite for the marketing chrome.**
  The header now has one; the footer, the demo page and the join flow do not.
- **No general keyboard-only pass has been done over the product**, only the
  surfaces a sprint happened to touch.
- **Nothing reconciles the entitlement against an actual agreement** — sprint 42.
  Only enrolment and restoration are metered — sprint 43. **Lapsed-subscription
  enforcement remains documented and unbuilt.**
- **The certification guard is a word list on a file list** — sprint 44. It
  cannot catch a different overclaim, or one made in a component not on the list.
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
