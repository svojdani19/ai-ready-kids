# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 43 — P1: the roster mutation that did not look like one

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-43.md`](2026-08-28-sprint-43.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–32 walk ordinary school workflows; 33–34 build the migration path
  and its gate; 35–41 fix teacher-facing and content defects, including three
  activities that required photographs of real children. Sprint 42 made the paid
  entitlement the vendor's number and enforced it at enrolment, and reported one
  bypass it did not close. **Sprint 43 closes it.**

### What changed

1. **Restoration bypassed the seat cap.** Sprint 42 excluded archived cohorts
   from the count — correct, since a class kept for retention is not a class
   being taught. But archive a full cohort, spend the freed seats on a new one,
   restore the old class, and the school is over its licence with no child having
   passed through `createStudent`. **Restoration is a roster mutation that does
   not look like one**, which is why a check written where children are *created*
   missed it.
2. **`restoreClass` now refuses when `used + roster > licensed`.** Enforced in
   the repository, not the action, so a direct call cannot bypass it; the action
   catches rather than pre-checks. Read and write share one `BEGIN IMMEDIATE`
   transaction, so a restore and an enrolment arriving together cannot both see
   the same free seat, and a refusal rolls back with `archived_at` untouched.
3. **The class stays archived and every record is kept.** Refusal was chosen over
   the alternatives deliberately: an overage is a bill nobody agreed to and there
   is no PO mechanism to charge it; a partial restore would have software
   choosing which children come back; and deleting to free capacity is the one
   outcome retention exists to prevent. The administrator's two ordinary moves —
   archive another cohort, or ask for more places — both stay open.
4. **Exactly on the cap is allowed**, `>` and never `>=`; a school that bought 90
   seats can have 90 children. **An empty archived class always restores**, and
   **re-restoring an active class is a no-op**, not a double-count.
5. **The refusal names all four numbers and the route out**, and the audit
   records `class.restore_blocked_by_licence` with the class and counts and **no
   child's name**. No success audit on the refused path.
6. **One UI change:** `ConfirmAction` rendered errors inline beside the button. A
   refusal stating four numbers is a sentence, and a sentence beside a button in
   a table cell is unreadable, so it is now a block below.

### Already verified — please do not redo

- Typecheck, lint, **501 tests** (up from 494), Turbopack production build.
- Seven tests. The three asserting refusal were confirmed to **fail without the
  rule** by stashing the source; the rest assert restoration still *succeeds* —
  exact cap, empty class, re-restore, other schools — because a cap that
  over-blocks is as much a bug as one that under-blocks. Also covered: the error
  is both `RestoreExceedsLicenceError` and `LicenceExceededError`; the `>`
  operator is asserted directly; archiving still frees seats for a new cohort and
  a refused restore leaves the archived records in place for retention.
- **Browser-verified at 1280×800** with Room 4 archived (21 students), 69 active,
  89 seats — one short. Restore refused, message rendered legibly below the
  button, row still tagged Archived; database confirmed `archived_at` unchanged
  on its original timestamp, 21 records intact, audit with counts only, and
  **zero** `class.restored` entries. Raising the licence to exactly 90 let the
  same restore succeed with a normal audit entry. Demo data restored.
- **PO/invoice model, named account contact, no payment processor, no billing
  identifiers, no new student fields, aggregate-only admin reporting and every
  standing constraint are unchanged.** Sprint 42's enrolment metering and the
  retention behaviour are covered by tests here to prove they still hold.

### Where this is most likely still wrong — best places to push

- **Restoration was the bypass sprint 42 found. Are there others?** Any path that
  makes an existing record active without creating it is a candidate — a class
  move between schools, a bulk import, an un-delete, a future merge. Only
  `createStudent` and `restoreClass` are metered today. `reassignClass` moves a
  class between teachers within one school, so it does not cross a licence, but
  that is the shape to keep checking.
- **Nothing reconciles the entitlement against an actual agreement.** There is no
  record of what was quoted, ordered or invoiced — only an audit line saying
  somebody asked. A real deployment needs the vendor side.
- **Lapsed-subscription read-only enforcement does not exist**, still deferred.
  Nothing switches off at renewal and the program page says so.
- **Only the student seat is metered.** A school can create unlimited classes,
  teachers and assignments. That matches what is sold, but it is worth
  confirming it is the intended meter.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings**,
  unrelated to this work.
- **Only one previous schema shape is recognised** — sprint 34. No
  down-migrations.
- **Rollover is one school at a time**; bulk reassignment does not exist.
- **The route and action inventory is still not complete.**
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Every mission has been read once. None has been read twice.**
- **No general guard against factual error exists or can.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
