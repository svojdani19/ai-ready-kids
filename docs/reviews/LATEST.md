# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 54 — P1: the retention window that could delete records early

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-54.md`](2026-08-28-sprint-54.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–34 school workflows, the migration path and its gate; 35–41
  content defects; 42–43 the seat count; 44 the certification overclaim; 45–48
  keyboard exits, focus recovery and an honest pending state; 49–51 the
  subscription term and two corrections; 52–53 the classroom-plan limit and its
  fail-open correction. **Sprint 54 is the same defect shape as 53 with a far
  worse consequence: not revenue, but permanent deletion of child records.**

### What changed

1. **`schools.retention_months` is unconstrained integer data**, and the domain
   passed it straight to `addMonths`. A **negative** window moves a cohort's
   deletion date to *before* its school year ended, making every class
   `eligibleNow`, and `runScheduledPurge` then deletes the class and cascades
   **the roster, every attempt and both check-ins** — with no restore path. The
   Data page displayed the bad value as policy, so nothing warned anybody.
2. **One recognised source.** `RECOGNISED_RETENTION_MONTHS` is derived from
   `RETENTION_OPTIONS`, so the form's options and the domain's acceptance are one
   list. **Nothing is coerced, clamped, rounded or defaulted to 12** — a guess
   that lands early deletes early and one that lands late retains past policy.
3. **The job fails closed per school**, skipping before it reads or writes
   anything, recording the school in `result.blocked`, and continuing — so **one
   broken school never stops a correctly configured school purging on time**. No
   `retention.purged` audit for a blocked school. The report names a school and a
   number, **never a child**.
4. **Two blocks, not one.** `blockedReason` distinguishes
   `"unrecognised-policy"` from `"no-year-end"`: different situations, different
   sentences, different people.
5. **The page says so**: *"Needs configuration"* naming the stored value as a
   value rather than policy, *"Blocked"* for the due date, and *"Retention needs
   configuration — automatic purge is blocked"* per class. Nothing is marked
   eligible. **Delete now stays available** with its existing confirmation — a
   deliberate admin action, not automatic retention. Saving a valid window
   recovers; **viewing the page overwrites nothing**.
6. **The CLI cannot be misread.** A safety block and a quiet night both produce
   zero deletions. Blocked schools now print to stderr, after the summary, with
   **`process.exitCode = 1`** so a scheduler notices.

### Already verified — please do not redo

- Typecheck, lint, **604 tests** (up from 596), Turbopack production build.
- Eight cases, **all eight failing against the previous code** when stashed:
  the recognised set equals what `RETENTION_OPTIONS` offers; a sweep of
  `-12, 0, 1, 7, 120, -1, 2.5, NaN` plus `"12"`, `null`, `undefined`, `{}`, `[]`;
  **no row `eligibleNow`** under `-12`; **zero classes, students, attempts and
  check-ins deleted** for every storable malformed value with counts compared
  table by table and **no success audit**; **a second correctly configured school
  still purges in the same run** while the malformed one loses nothing; recovery
  after a valid save; 3/12/24/36 unchanged; and a drift guard over the job, the
  calculation, the CLI and the page.
- Recorded honestly in the test: **`NaN` is not representable** — SQLite rejects
  it against the NOT NULL column — so it is swept through the pure functions and
  not the job.
- **CLI against a real database with `-12`:** printed the `BLOCKED` block naming
  the school and the value, **exit code 1**, and afterwards **4 classes, 90
  students, 885 attempts, 134 check-ins intact, 0 `retention.purged` rows**. With
  a valid window the same command exits **0**.
- **Browser at 1280×800 (`-12`) and 768×1024 (`7`)**: no crash, *"Needs
  configuration"*, *"Blocked"*, the per-class notice, **nothing eligible**, the
  malformed number never shown as policy, **Delete now present and not clicked**,
  no overflow — and recovery by selecting 12 worked at both sizes.
- Demo restored: retention 12, plan school, 120 seats, four active classes, 90
  students, 885 attempts, 16 audit rows.
- **No schema, child fields, billing, LMS/SIS, chatbot, telemetry or risk
  scoring.**

### Where this is most likely still wrong — best places to push

- **The column is still unconstrained.** This makes a bad value safe, visible and
  recoverable; it does not prevent one. A CHECK constraint needs a migration.
- **`licensed_students` has not been audited for the same shape.** `plan` was
  fixed in sprint 53 and `retention_months` here; `benchmark_window` has a CHECK
  constraint. A negative or absurd seat count deletes nothing, but it is the last
  unaudited member of the same family.
- **The blocked report is only surfaced by the CLI.** An operator who never runs
  `npm run purge` learns about it from the Data page, which requires somebody to
  visit it. There is no alerting.
- Everything under sprints 49–53 still stands: no grace period before the term
  ends, Classroom Mode opens for a lapsed school, the UTC boundary, a downgrade
  not blocked at the point of change, and no general guard against cookie writes
  from a Server Component.
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
