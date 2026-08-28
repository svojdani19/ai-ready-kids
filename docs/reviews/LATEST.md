# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 52 — P1: one classroom, or thirty students?

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-52.md`](2026-08-28-sprint-52.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–34 school workflows, the migration path and its gate; 35–41
  teacher-facing and content defects; 42–43 the seat count; 44 the certification
  overclaim; 45–48 keyboard exits, focus recovery and an honest pending state;
  49–51 the subscription term and two corrections to it. **Sprint 52 enforces
  the other half of what the classroom plan sells.**

### What changed

1. **The public page sells "Single classroom · $390 / year · Up to 30 students"
   and only the thirty was enforced.** A school on the classroom plan could
   create any number of classes, split its thirty children across them, archive
   one and create another, and restore archived cohorts freely.
   `createClass` had **no plan check at all**; `restoreClass` checked only
   students. **The product sold one classroom and licensed thirty students,
   which are different things** — a buyer could not tell what $390 bought, and a
   three-form-entry school could run a year on one classroom licence.
2. **`ACTIVE_CLASS_LIMIT`**: `classroom: 1`, `school: null`, `district: null`.
   `null` rather than a big number, so the intent is legible — school and
   district are priced per school and per district, not per room.
3. **Archived classes do not consume the slot**, for the same reason they do not
   consume seats: charging for a cohort kept for retention pushes an
   administrator toward deleting records early to free capacity.
4. **Enforced at the repository boundary in both paths that can take the slot**,
   each with the count and the write in one `BEGIN IMMEDIATE` transaction.
   `restoreClass` checks the room **before** the seats, and is guarded on
   `archived_at`, so **re-restoring an active class stays a no-op**.
5. **Nothing is ever taken away.** A database already over the limit — a
   downgrade, or from before the rule — is left completely intact and becomes
   read-only: the next class is refused, and no class is deleted, auto-archived
   or picked.
6. **Calm expected refusals**, shared wording across create and restore, naming
   what the plan includes, that nothing changed, that archived records remain,
   and pointing at Program & plan. Audits record **configuration facts only** —
   rooms and plan — with **no child named** and **no success audit** on refusal.
7. **Visible before the form**: an *Active classrooms* stat on Program & plan and
   the same fact on the Classes create panel.

### Already verified — please do not redo

- Typecheck, lint, **588 tests** (up from 577), Turbopack production build.
- Eleven cases, **all confirmed to fail without the rule** by stashing the
  source: first allowed / second refused with zero class rows; archiving frees
  the slot and archived records survive; restore refused with the archived class
  on its original timestamp; restore succeeds once free; active restore is a
  no-op; school and district allow three; an already-over database left intact;
  the two write paths cannot oversubscribe in either order; both functions carry
  `assertRoomForActiveClass`/`BEGIN IMMEDIATE`/`ROLLBACK`; the refusal wording
  and the audit's silence about children; and a **drift guard** binding the
  public copy to `ACTIVE_CLASS_LIMIT.classroom === 1`.
- **Browser-checked at 1280×800 and 768×1024** with the demo school temporarily
  on the classroom plan: `Active classrooms: 1 of 1` on both screens; **create
  refused** with the full sentence and still 4 classes; **restore refused** with
  the class still tagged Archived; **exactly two audit rows added**, both
  configuration facts with no child named and no success audit; **archiving the
  active class freed the slot** and Room 4 then restored cleanly; no overflow.
- Demo restored: `plan school`, 120 seats, four active classes, 90 students, 16
  audit rows.
- **No chatbot, child free text, new student fields, telemetry, risk scoring or
  payment data. No schema change** — `plan` already existed. Seat enforcement,
  retention and the lapse gate untouched.

### Where this is most likely still wrong — best places to push

- **A downgrade is not blocked.** Nothing stops a school moving from `school` to
  `classroom` with three classes active; the result is the read-only state rather
  than a refusal at the point of change. The plan is vendor-set, so that is
  arguably where the conversation belongs — but it is a judgement call.
- **Only rooms and seats are metered.** Teachers, assignments and archived
  cohorts are unlimited on every plan. That matches what is sold today; it is
  worth confirming it is the intended meter.
- **The drift guard checks the words that exist**, not that every public claim
  has an enforcement. A new bullet on the plans page would not fail anything.
- Everything under sprints 49–51 still stands: no grace period before the term
  ends, Classroom Mode still opens for a lapsed school, the UTC boundary, and no
  general guard against cookie writes from a Server Component.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings.**
- **Only one previous schema shape is recognised** — sprint 34.
- **The limiter is per process** — sprint 30. **The instrument is unequated** —
  sprint 24. **Every mission has been read once, none twice.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
