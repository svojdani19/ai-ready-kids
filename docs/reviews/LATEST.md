# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 49 — P1: the term that ended and changed nothing

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-49.md`](2026-08-28-sprint-49.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–32 walk ordinary school workflows; 33–34 build the migration path
  and its gate; 35–41 fix teacher-facing and content defects; 42–43 make the paid
  seat count the vendor's number and enforce it at enrolment and restoration; 44
  removed the last certification overclaim; 45–48 gave the navigation, Classroom
  Mode and the shared confirmation control keyboard exits, focus recovery and an
  honest pending state. **Sprint 49 makes the subscription term itself real — a
  gap this file had carried as "documented and unbuilt" for three sprints.**

### What changed

1. **`term_renews_on` changed labels and nothing else.** Every classroom and
   student write succeeded after it, and Program & plan admitted it: *"Nothing
   switches off automatically in this build."* An entitlement that never ends is
   not an entitlement.
2. **One rule, in `src/lib/domain/subscription.ts`.** The school is active
   **through** the renewal date and lapsed on the next calendar day, matching the
   product's own wording. Date-only: `YYYY-MM-DD` compared as strings, `now`
   injected everywhere and reduced to its **UTC** calendar date, because a
   deployment that lapses at a different moment depending on the host's `TZ` is a
   bug nobody can reproduce. An empty renewal date never lapses a school.
3. **Enforced on the shared resolvers**, not in the pages that render the
   buttons — `requirePlayableMission`, `requireOpenCheckIn`,
   `requireOwnActiveClass`, `ownActiveClass`. One door, so a stale tab or a
   direct server-action call cannot write. Ownership and term stay separate
   questions: a teacher's own class is still theirs, and they still cannot change
   it.
4. **Blocked**: mission start/resume/record, check-in answers and completion,
   joining by class code, class creation and lifecycle, roster changes, code
   rotation, assignment changes, check-in windows, year rollover.
5. **Open, deliberately**: read-only pages, the annual report and all three
   exports, the renewal request, sign-out, school profile, staff administration,
   retention settings, the academic dates retention is calculated from,
   deliberate deletion, and the orientation. **A school still owns its records.**
6. **Expected errors, not crashes.** The gate throws — a shared resolver can,
   without every caller remembering — and the actions that render a result catch
   it and return `{ error }`. Seven actions moved from `void` to
   `{ error?: string }`; `AssignToggle` also **reverts its optimistic switch**,
   since a toggle left flipped after a refusal says a mission is assigned when it
   is not.
7. **Visible before effort is wasted.** Staff get one `role="status"` notice in
   the shared shell — a standing condition, not an emergency — naming what is
   paused, what remains, and where to renew. Children get *"Your class isn't open
   right now. Ask your teacher."* and nothing about money. **No control lies**:
   the student home drops "Up next" and the check-in, and mission tiles render as
   tiles rather than links. The false admission is replaced.

### Already verified — please do not redo

- Typecheck, lint, **566 tests** (up from 553), Turbopack production build.
- Thirteen new cases with **no clock** — every date injected: active on 31 Aug
  and on the renewal day, lapsed on 2 Sep, 23:59:59 active and 00:00:00 next day
  not; empty date never lapses; each school measured against its own term.
- **Zero writes on refusal**, proved by snapshotting every table and comparing
  after two refused attempts. No audit row, no flag, no counter — a refusal is
  not an event about a child.
- **The action inventory test**: every exported action across all four action
  files must appear in the gated or allowed map with a written reason, failing on
  an unclassified action *and* on a classified one that no longer exists; then
  each gated body must reach a guard and each allowed one must not. **A new
  mutation cannot silently bypass the gate.**
- Two existing ownership tests now accept the gated resolver names **and
  additionally assert the gated variant delegates to the ownership one**, so the
  looser regex cannot be met by a helper that skipped the check.
- **Browser-checked at 1280×800 and 768×1024** with the demo school lapsed: the
  notice with a working renewal link and no overflow; code rotation and archiving
  returning **expected refusals, not error pages**, with the database unchanged
  and **no audit row written**; a **correct** class code refused at `/join` with
  the child's sentence; a session opened before the lapse still signed in with 16
  badges, every finished mission readable, **zero links into the player**; the
  annual report with Print/CSV/JSON all present and the **renewal request
  succeeding**. Demo data restored.
- **Niche and privacy boundary unchanged**: authored grades 2–4 practice, no
  chatbot, no child free text, no new student fields, no telemetry, no risk
  scoring, aggregate-only admin reporting. **No schema change.**

### Where this is most likely still wrong — best places to push

- **No grace period or warning before the date.** The transition is a cliff on
  one morning; a real deployment would want "renews in 14 days" escalating in the
  shell. That is a product decision about tone, not a mechanism.
- **A lapsed school's teachers can still open Classroom Mode**, which records
  nothing by design so it is not a write. Arguably correct — teaching from a plan
  already bought — but it is a judgement call worth a second opinion.
- **Nothing reconciles the term against an actual agreement** — sprint 42.
  Renewal is a vendor edit to the row.
- **The UTC boundary** can sit a few hours off a school's local midnight. Fixing
  it properly needs a school timezone, which is a new field and was out of scope.
- **The overlay pattern still has candidates**: the student mission player's
  full-screen states and the read-aloud control — sprints 45–48.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **The certification guard is a word list on a file list** — sprint 44.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings**,
  unrelated to this work.
- **Only one previous schema shape is recognised** — sprint 34. No
  down-migrations.
- **The route and action inventory is now complete for the lapse gate**, but not
  for authorization generally.
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Every mission has been read once. None has been read twice.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
