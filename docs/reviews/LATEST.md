# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 42 — P1: the subscription was a label the customer could edit

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-42.md`](2026-08-28-sprint-42.md)
- **Review trail:** sprints 01–25 read and fixed the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–32 walk ordinary school workflows; 33–34 build the migration path
  and its gate; 35 removed an instruction that would have destroyed children's
  records; 36 traced the first shared scene; 37–41 removed three teacher
  activities that required photographs of real children and corrected two
  wording defects in the replacements. **Sprint 42 is the first commercial one:
  the paid entitlement was self-editable and unenforced.**

### The commercial rationale

Schools buy this on a purchase order — quote, PO, invoice, named account
contact. There is no card and there should not be one, which makes the
entitlement record the entire commercial mechanism: the only thing between "what
we agreed" and "what you are using". It has to be true in both directions. **The
vendor owns the number**, because a customer-editable seat count cannot appear
on an invoice and a renewal that opens by disputing it costs more than the seat.
**The number has to bite**, because an entitlement nothing enforces is how a
vendor finds at renewal that it has given away a third of its product and how a
school finds it is being asked for money it never budgeted. Neither half
restricts schools; both let the two sides point at one figure a year later.

### What changed

1. **`requestPlanChangeAction` ran `UPDATE schools SET plan = ?,
   licensed_students = ?`** while the form said *Request a quote* and *records
   an intent*. Typing 5000 made the school a 5000-seat district customer as far
   as every screen was concerned. **And `addStudentAction` never read
   `licensed_students`**, so enrolment was unlimited across all classes. Either
   alone is a bug; together the seat count was decoration.
2. **The request now records a request and nothing else.** The `UPDATE` is gone;
   one audit entry names what was asked for *and what the entitlement still is*,
   and the message says so plainly.
3. **The entitlement is read-only in the UI**, in its own block above the request
   fields, which are relabelled *Plan you would like* / *Student places you would
   like*. The page stat is now **used of licensed** with the remainder.
4. **The cap is enforced in `createStudent`, not the action** — the repository is
   the only door, and the action *catches* rather than pre-checks so there is no
   window between asking and inserting. Count and insert run in one
   `BEGIN IMMEDIATE` transaction, so two near-simultaneous enrolments cannot both
   read the same count and both write; a refusal rolls back and writes nothing.
5. **Seats in use = children on active rosters.** Archived cohorts are excluded
   deliberately: a cohort kept for retention is not a child being taught, and
   charging a new year for it would mean buying the same desk twice and would
   push administrators toward deleting records early to free capacity.
6. **The last licensed seat succeeds** — a cap that blocks *at* the number sold
   sells one fewer than it says. The next is refused with seats used, seats
   licensed and the contact path, and the school-wide audit records
   `roster.blocked_by_licence` with **no child's name**.
7. **Enrolling into an archived class is refused**, so archiving a full cohort is
   not a way to keep enrolling.

### Already verified — please do not redo

- Typecheck, lint, **494 tests** (up from 486), Turbopack production build.
- Eight acceptance tests, all confirmed to **fail without the enforcement** by
  stashing the changed source and re-running: quote leaves plan and seats
  unchanged while recording the request; two active classes combine toward one
  cap; the final seat succeeds and the next fails with **no row and no success
  audit**; archived cohorts do not consume seats and their records survive;
  archived classes refuse enrolment; two schools count separately; the check is
  in the repository with `BEGIN IMMEDIATE`/`ROLLBACK` and the refusal audit
  carries no display name; and the student record still holds exactly the five
  existing fields.
- **Browser-verified at 1280×800** with the dev school temporarily at 91 seats
  against 90 children: a **district / 5000** request returned the
  unchanged-entitlement message and left the row at `school` / 91; the 91st child
  enrolled; the 92nd was refused, **no row was written**, and the audit named the
  class and numbers only. Demo data restored to 90 students / 120 seats.
- **No card fields, payment processor or billing identifiers.** Purchase orders,
  quotes, invoices and the named account contact are untouched.
- **Student fields, aggregate-only admin reporting, privacy constraints and the
  authored niche are unchanged.**
- One harness change: `createTestDb` licenses the fixture generously, since
  almost no test is about entitlement and many enrol past the demo school's
  purchase. Cap tests call the new `setLicensedSeats` and state the number.

### Where this is most likely still wrong — best places to push

- **Restoring an archived class can cross the cap.** Archiving frees seats, so
  archive a full cohort, enrol a new one, restore the old one, and the active
  roster exceeds the licence. `restoreClassAction` does not check. This wants a
  product decision — refuse, allow with a reported overage, or restore
  read-only — so it is reported rather than invented. The enrolment path cannot
  reach it, because archived classes refuse enrolment.
- **Lapsed-subscription read-only enforcement does not exist**, left for a
  separate review as instructed. Nothing switches off at renewal, and the
  program page still says so.
- **Nothing reconciles the entitlement against an actual agreement.** There is no
  record of what was quoted, ordered or invoiced — only an audit line saying
  somebody asked. A real deployment needs the vendor side of that.
- **The cap counts students, and a school could still create unlimited classes,
  teachers and assignments.** Only the student seat is metered, which is what is
  sold, but it is worth confirming that is the intended meter.
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
