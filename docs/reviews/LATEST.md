# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 46 — P1: the same menu, two different ways out

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-46.md`](2026-08-28-sprint-46.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–32 walk ordinary school workflows; 33–34 build the migration path
  and its gate; 35–41 fix teacher-facing and content defects; 42–43 make the paid
  entitlement the vendor's number and enforce it at enrolment and restoration; 44
  removed the last claim that the product certifies teachers; 45 gave the desktop
  menu a keyboard exit. **Sprint 46 gives the responsive one the same exit, which
  45 documented and left.**

### What changed

1. **One navigation had two escape behaviours, decided by window width.** Sprint
   45 fixed the desktop disclosure and said mobile was unchanged. At 768×1024
   that panel covers most of the screen, and a keyboard or switch user could only
   close it by finding the Menu button again. A pointer user taps ✕ without
   thinking. This is the harder version of sprint 45's defect: not an oversight
   in one handler, but the same control being operable at one size and not
   another.
2. **Escape now closes the panel and returns focus to the Menu trigger**, with
   the same two guards as the desktop menu plus one the viewport requires.
3. **Focus must be inside the panel**, so Escape never pulls focus back from
   where the user has already moved it — and that is also what makes the resize
   case safe, since focus cannot be inside a panel CSS has removed.
4. **The trigger must be genuinely rendered.** The panel and button are
   `lg:hidden`, so a state surviving a resize to desktop leaves both hidden, and
   refocusing a button nobody can see would be sprint 45's trap in a new place.
   The state is still cleared — the safe reset.
5. **Escape is ignored while the panel is closed**; the effect does not
   subscribe. Link activation, trigger toggling and the desktop `NavMenu` are all
   unchanged.
6. **The visibility check degrades deliberately.** jsdom does no layout —
   `offsetParent` is always null and `checkVisibility` does not exist — so a
   naive check would report everything invisible under test and silently disable
   the recovery the tests verify. It falls back to the focus-location guard, and
   the viewport behaviour is verified in a real browser, which is the only place
   a breakpoint means anything.

### Already verified — please do not redo

- Typecheck, lint, **531 tests** (up from 523), Turbopack production build.
- Eight tests added, eighteen in `tests/site-header.test.tsx`. **Five confirmed
  to fail without the fix** by stashing the component: Escape returns focus;
  focus already moved is not stolen; Escape while closed does nothing; link
  choice and trigger toggle leave focus alone; it keeps working on a second open
  and a second Escape neither reopens nor double-closes; and a **desktop
  regression** case where closing the panel leaves the desktop triggers as they
  were and the desktop menu still escapes on its own terms.
- **768×1024, keyboard only:** open, ten links, focus on *Annual check-ins*,
  Escape → `aria-expanded="false"`, panel hidden, focus on the Menu trigger with
  `checkVisibility()` true, Tab reaches *See the demo*. No overflow.
- **The resize trap, exercised for real:** panel opened at 768×1024 then resized
  to 1280×800, where the mobile trigger and panel both report
  `checkVisibility() === false` while the state was still `true`. Escape from the
  desktop menu then put focus on the **desktop** trigger (visible), **not** the
  hidden mobile one, and reset the stale mobile state to `false`.
- **1280×800:** desktop behaviour unchanged from sprint 45.
- **No curriculum, subscription, child-data or marketing-claim change.**

### Where this is most likely still wrong — best places to push

- **The panel has no click-outside dismissal**, unlike the desktop menu, which
  uses `useDismiss` for pointer and focus-out too. Not asked for, and adding it
  would change pointer behaviour nobody has reported a problem with, so the
  mobile handler does Escape and nothing else. If added later it should go
  through the same reason-aware path, not a second mechanism.
- **Mobile panel state survives a resize.** Reopening at tablet width shows it
  still open. That is pre-existing and now focus-safe, but it is a state
  correctness wrinkle rather than a resolved one.
- **No other closable surface has been checked for either defect.** The
  `ConfirmAction` two-step, Classroom Mode's overlay and any future dialog pose
  the same two questions — where does focus go, and does the answer change with
  the viewport — and none has been asked.
- **No general keyboard-only pass exists**, only the surfaces a sprint touched.
  The header now has interaction tests; the footer, demo page and join flow do
  not.
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
