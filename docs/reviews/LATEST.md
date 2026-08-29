# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 60 — P1: the calendar that produced Invalid Dates and hid them

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-60.md`](2026-08-29-sprint-60.md)
- **Review trail:** sprints 49–51 made the subscription term real; 52–53 the
  classroom limit; 54–55 retention and its CLI; 56–57 the seat count and the
  export that leaked it; 58–59 the term dates and the recovery route. **Sprint 60
  does the academic calendar — the last member of the unconstrained-column
  family, and the one with a silent retention consequence.**

### What changed

1. **`setAcademicDatesAction` checked only regex shape**, so `"2026-13-45"` and
   `"2026-02-30"` were saved **and backfilled into every class in that year**.
   The ordering guard passed because comparing two Invalid Dates gives `NaN`.
2. **Three failures downstream.** `addYear` threw `RangeError`, taking down the
   Program page — the only place these can be corrected. `purgeDateForClass`
   returned an Invalid Date, so Data displayed *"Invalid Date"* as a schedule.
   And **the purge job compared `NaN <= now`, skipped the cohort and exited
   saying nothing was due** — a child's records retained indefinitely, reported
   as success.
3. **One rule, extracted** to `calendar.ts`; sprint 58's `isContractDate` now
   *is* `isCalendarDate` rather than a second definition. A date is exact and
   UTC-round-tripping; a label is exact consecutive `YYYY-YYYY`; the pair is
   ordered **and inside the two years named**.
4. **Nothing downstream can produce an Invalid Date.** Retention returns `null`;
   `RetentionBlock` gains **`malformed-year-end`**, distinct from `no-year-end`;
   `previewRollover` validates before any arithmetic and never throws.
5. **The purge blocks instead of skipping**, reporting cohorts **per school as a
   count** — no class name, no child, no raw value — while valid due cohorts in
   the same school **still purge**. The CLI guards its all-clear on both kinds of
   block and exits 1 for either.
6. **Recovery repairs empty *and malformed* year-ends**, scoped to that school
   and that academic year, leaving already-valid snapshots and other years
   untouched — stated with a count in the audit and the message.
7. **Class creation refuses** before any write when the calendar is unreadable,
   with staff-only wording noting existing work is unaffected. **The report
   exports `"Needs configuration"`** rather than a shaped-but-wrong label.

### Already verified — please do not redo

- Typecheck, lint, **656 tests** (up from 641), Turbopack production build.
- Fifteen cases in a new `tests/academic-calendar.test.ts`, **eleven failing
  against the previous code** when the consumers are stashed. Sweeps every
  malformed shape, non-strings, non-consecutive and reversed labels,
  `start >= end`, out-of-span dates, valid leap days, mixed cohorts, the partial
  purge with a refusal snapshot, repair scope across three cohorts and a second
  year, rollover never throwing, and buyer/export safety.
- **Browser at 1280×800 and 768×1024** with `academic_year = "2025-2027"`,
  `year_starts_on = "2026-13-45"` and one cohort on `"2026-02-30"`: Program
  renders with the correction form, **no `Invalid Date`, `NaN` or raw value**,
  rollover suppressed, and the form **does not prefill** the bad values; Data
  shows the cohort *"Blocked"* with a repair instruction and nothing eligible;
  class creation refused with 4 classes intact; JSON/CSV carry
  `schoolYear: "Needs configuration"` and none of the raw values.
- **The purge, live**: three overdue valid cohorts deleted (68 student records),
  then `BLOCKED: 1 cohort across 1 school…` with school and count only, **exit
  1**, malformed cohort untouched.
- **Recovery**: *"Saved. 1 class in 2025-2026 had no usable deletion date and now
  has one. Classes with a valid date were left unchanged."* — rollover returned,
  and the database confirmed only that cohort moved.
- Demo restored with `npm run db:reset`: 4 classes, 90 students, 884 attempts.

### Where this is most likely still wrong — best places to push

- **The columns remain unconstrained.** Safe and recoverable; not prevented.
- **One pre-existing test is intermittently timing-sensitive** — *"offers Try
  again, and advances once the retry succeeds"* in the mission player failed once
  during this sprint and passed on four consecutive re-runs. Unrelated to this
  work, but it is a flake and should be nailed down rather than tolerated.
- **Classroom Mode still opens for a closed school** — outstanding since 49.
- Everything under sprints 49–59 still stands.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings.**
- **Only one previous schema shape is recognised** — sprint 34.
- **The limiter is per process** — sprint 30. **The instrument is unequated** —
  sprint 24. **Every mission has been read once, none twice.**

---

## Sprint 59 — correction to sprint 58: one link for two roles and two problems

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-58.md`](2026-08-29-sprint-58.md), sprint 59
  section.

### The defect

`StaffShell` is shared by administrators and teachers, and the new
needs-configuration notice always rendered *"Request renewal on the Program and
plan page"* → `/admin/program`. **The notice says "This is not an expiry", then
tells staff to request renewal** — a sales action for what the same paragraph
has just explained is a broken account record. And **a teacher cannot open that
link**: `requireAdmin` bounces them back to `/teacher`, so the only route
offered was a dead end for most readers, making a configuration incident at a
paying school look like a lapsed invoice.

### The correction

Recovery now depends on **why** and **who**:

| | administrator | teacher |
|---|---|---|
| **needs-configuration** | *"See your account details on the Program and plan page"* | *"Ask your school administrator to have the account team correct the subscription dates."* |
| **lapsed** | *"Request renewal on the Program and plan page"* | *"Ask your school administrator, who can request renewal for the school."* |

The administrator's configuration link is **honestly labelled** — the page shows
account details, it does not correct them — and **no support address is
invented**, asserted across all four combinations.

### Already verified — please do not redo

- Typecheck, lint, **641 tests** (up from 635), Turbopack production build.
- Six cases, **all failing against the sprint-58 shell**. One assertion needed
  care: forbidding `has ended` caught **"nothing has ended"** — the denial the
  copy should contain — so the test strips denial clauses, forbids the claim, and
  separately asserts the denial is present. **Banning a word is not banning an
  assertion.**
- **Browser at 1280×800 and 768×1024, both roles, both reasons**: admin
  needs-config → `/admin/program` labelled *"See your account details…"* with no
  "renew" anywhere; teacher needs-config → **zero links** and the administrator
  handoff; admin lapsed → *"This subscription has ended"* with the renewal link
  unchanged; teacher lapsed → **zero admin links** and a usable handoff. No
  overflow.
- Demo restored: term 2025-08-18 → 2026-09-01, plan school, 120 seats, retention
  12, four classes, 90 students, 885 attempts, 16 audit rows.

### Where this is most likely still wrong

- **No other shared component has been audited for role-dependent copy.** This
  one was found because a reviewer read it; nothing systematically checks that a
  call to action is reachable by everyone who sees it.
- Everything under sprint 58 below still stands, including the malformed
  `year_ends_on` reaching `addMonths`.

---

## Sprint 58 — P1: "soon" was a subscription that never ended

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-58.md`](2026-08-29-sprint-58.md)
- **Review trail:** sprints 49–51 made the subscription term real; 52–53 the
  classroom limit and its fail-open correction; 54–55 retention and its CLI
  wording; 56–57 the seat count and the export that leaked it. **Sprint 58 does
  the term dates — the gap this file had listed as outstanding twice.**

### What changed

1. **`subscriptionState` compared the renewal string lexicographically without
   validating it.** `"soon"` sorts after every `YYYY-MM-DD`, so a school with
   that value stayed **active indefinitely** — a paid term that could never end.
   `"2026-13-45"` and `"2026-02-30"` were ordinary deadlines; Program rendered
   `Invalid Date` and `in NaN days`; Overview silently dropped its renewal
   warning because `NaN <= 60` is false; the annual JSON exported the raw values.
2. **A strict validator**: exactly `YYYY-MM-DD` and a real day, checked by UTC
   round-trip — `2026-02-30` parses to March 2nd and does not stringify back,
   while **real leap days survive**. The pair is ordered: a term cannot renew
   before it starts. **Non-coercive** — no `trim`, no `Date.parse`, asserted.
3. **Three states.** `needs-configuration` is **neither active nor lapsed** and
   must never be called ended or overdue. Sprint 49 was right that an empty field
   cannot lapse a school — and **active is a commercial decision too**.
4. **Fails closed with `TermNotConfiguredError`**, distinct from the lapse error,
   converted by `asExpectedError` so no gated action produces an error page.
   Every gate reads one rule; **children see only the generic class-not-open
   sentence** for either reason. Staff get the distinction, including *"This is
   not an expiry."*
5. **Buyer pages compute no day count for an unreadable term** — the source of
   `Invalid Date` and `NaN` — and show *"Needs configuration"* / *"Classroom
   changes are paused"* with no raw value.
6. **`termStartsOn` and `termRenewsOn` removed from `SchoolReport`**, sprint 57's
   finding applied one field over. Its single consumer sits inside a block that
   only renders for a verifiable term and now reads the school directly.

### Already verified — please do not redo

- Typecheck, lint, **635 tests** (up from 622), Turbopack production build.
- Eleven cases, **all failing against the previous code**: sweep of `""`, `" "`,
  `"soon"`, `"2026-13-45"`, `"2026-02-30"`, `"2026-9-1"`, leading/trailing
  whitespace, a timestamp, `"26-09-01"`, `"2026/09/01"`, plus `null`,
  `undefined`, a number, `{}`, `[]`; leap days both ways; start-after-renewal; a
  whole-database snapshot proving a refusal writes nothing; recovery restoring
  both active and lapsed; child surfaces carrying no configuration detail; gate
  consumers pinned; buyer pages free of raw dates/`Invalid Date`/`NaN`; export
  clean and CSV unchanged; quote request neither gated nor rewriting dates.
- **Browser at 1280×800 and 768×1024** with `term_renews_on = 'soon'`: staff
  notice with *"This is not an expiry"*; Overview note and *"Classroom changes
  are paused"*; Program showing *"Needs configuration"* / *"Need configuration"*;
  **no `Invalid Date`, `NaN` or `soon`** anywhere; a code rotation refused with
  the configuration message and the code **unchanged** in the database; a correct
  class code giving a child only *"Your class isn't open right now. Ask your
  teacher."* with **no** subscription/configuration/renewal/dates wording; the
  JSON `school` block carrying **no term dates and no `soon`**; CSV clean; and
  recovery immediately restoring *"RENEWS | September 1, 2026 | in 3 days"*.
- Demo restored: plan school, 120 seats, retention 12, term 2025-08-18 →
  2026-09-01, four classes, 90 students, 885 attempts, 16 audit rows.
- **No schema, billing, child fields, LMS/SIS, chatbot, telemetry or risk
  scoring.**

### Where this is most likely still wrong — best places to push

- **The columns are still unconstrained.** Safe and recoverable; not prevented.
- **`year_starts_on` and `year_ends_on` are the remaining pair.** Retention
  already blocks on an *empty* year-end and an unrecognised window, but a
  **malformed** year-end (`"2026-13-45"`) would reach `addMonths` and produce an
  Invalid Date rather than a refusal. That is the next one.
- **Classroom Mode still opens for a closed school.** It records nothing by
  design, so no gate refuses it; arguably correct, still a judgement call —
  outstanding since sprint 49.
- Everything under sprints 49–57 still stands.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings.**
- **Only one previous schema shape is recognised** — sprint 34.
- **The limiter is per process** — sprint 30. **The instrument is unequated** —
  sprint 24. **Every mission has been read once, none twice.**

---

## Sprint 57 — correction to sprint 56: the export was the buyer-facing surface

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-56.md`](2026-08-28-sprint-56.md), sprint 57
  section.

### The defect

Sprints 53, 54 and 56 stopped Program, Overview and Data presenting a malformed
plan, seat count or retention window as contract or policy. **The annual report
was missed — and it is the artefact that leaves the building.**
`buildSchoolReport` copied all three raw, and the JSON download serialises the
whole object, so a district-office export could assert `plan: "classrooms"`,
`licensedStudents: -5`, `retentionMonths: -12`. The printed report also rendered
*"Data retention is set to -12 months after the school year ends."*

The route's own comment claimed an export **"can never contain something the
screen was hiding"** — false in one direction: the screen renders a chosen
subset; the JSON serialises everything.

### The correction

- **`plan` and `licensedStudents` removed from the report entirely.** No consumer
  in the page, the CSV or the JSON's intended use. Account metadata does not
  belong in a report about demonstrated competencies.
- **Retention is discriminated**: `{ status: "configured"; months }` or
  `{ status: "needs-configuration" }`, never the stored number. A valid window
  keeps the existing truthful sentence; an invalid one reads *"Retention needs
  configuration; automatic purge is blocked."*
- **The route comment now states a guarantee it can keep** — resting on the
  object carrying no raw account metadata rather than on the screen hiding
  things, which is the stronger and truer property.

### Already verified — please do not redo

- Typecheck, lint, **622 tests** (up from 616), Turbopack production build.
- Six cases, **five failing against the previous code**: no account keys on the
  object; the serialised account block free of all three malformed values and
  reading `needs-configuration`; a valid window still
  `{"status":"configured","months":24}`; the printed report keeping the truthful
  sentence and never rendering `retentionMonths`; the CSV clean; and the route's
  narrower guarantee.
- One assertion needed scoping: **`-5` appears legitimately in authored mission
  ids** like `m-privacy-5`, so the value check is scoped to `report.school` while
  the key check stays document-wide.
- **Browser at 1280×800 and 768×1024** with all three malformed: the report reads
  *"Retention needs configuration; automatic purge is blocked."*, `-12`/`-5`/
  `classrooms` appear **nowhere**, print-visible copy displayed, no overflow.
- **The fetched JSON body's `school` block**: name, district, city, state,
  schoolYear, termStartsOn, termRenewsOn, `retention: {status:
  "needs-configuration"}` — and nothing else. CSV clean too.
- **Valid case**: *"Data retention is set to 12 months…"* and
  `{"status":"configured","months":12}`.
- Demo restored: plan school, 120 seats, retention 12, four classes, 90 students,
  885 attempts.

### Where this is most likely still wrong

- **The family is closed on the three columns, across four surfaces now.** The
  date fields remain unswept — a malformed `term_renews_on` or `year_ends_on`
  reaches both the report and `subscriptionState` unchecked.
- Everything under sprint 56 below still stands.

---

## Sprint 56 — P1: the seat count nobody checked

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-56.md`](2026-08-28-sprint-56.md)
- **Review trail:** sprints 01–48 built the curriculum and audited what the
  product permits, promises and does; 49–51 made the subscription term real;
  52–53 the classroom-plan limit and its fail-open correction; 54–55 the
  retention window and its CLI wording. **Sprint 56 closes the
  unconstrained-column family: `plan`, `retention_months` and now
  `licensed_students`.**

### What changed

1. **`schools.licensed_students` was trusted as a contract number everywhere.**
   With `-5` a buyer saw *"90 of -5 licensed"*, teachers were told the school had
   exceeded a **negative** licence, quote copy repeated `-5` as the current
   agreement, and **every** enrolment and restore was misclassified as an
   overage. With `5001` the repository granted capacity outside the 1–5000 range
   the product's own quote form accepts, presented as purchased.
2. **One recognised policy**: integer, 1–5000 — **exactly the range
   `requestPlanChangeAction` already enforced**, now read from one place by both,
   so the form and the domain cannot drift. **Nothing coerced**: no `Number()`,
   clamp, round, `Math.max` into validity, or plan-suggestion default.
3. **`LicenceStatus` is discriminated.** `used` is always real; when the stored
   number is not a contract value there is **no `licensed` and no `remaining`**
   to display or compare. Making it unrepresentable surfaced all eleven consumers
   at compile time — which is how the two buyer pages were found.
4. **Both write paths fail closed before the capacity comparison**, throwing
   `LicenceNotRecognisedError` — distinct from `LicenceExceededError`, since
   nothing was exceeded. Nothing written, nothing removed or changed. Valid
   1–5000 and legitimate over-cap behaviour unchanged.
5. **Staff see a configuration message with no digits in it** — asserted — and
   audits use `*_blocked_by_licence_config`, distinct from the overage actions,
   with no child named and **the raw value not written into the trail**.
6. **Buyer surfaces say "Seat licence needs configuration — no new students can
   be enrolled"** on both Program status and School overview, aggregates intact.
   **The quote form does not prefill a malformed value**, and the success message
   and audit no longer repeat it as an entitlement.

### Already verified — please do not redo

- Typecheck, lint, **616 tests** (up from 607), Turbopack production build.
- Nine cases, **all failing against the previous code** when stashed. Sweep of
  `-12, -5, 0, 2.5, 5001, 1_000_000, NaN, "30", null, undefined, {}` for the
  classifier and the storable subset — including text `"thirty"` — through the
  database: no enrolment, no restore, no class or child mutation with counts
  compared table by table, no success audit, distinct config audit and refusal,
  the raw value never marketed as entitlement, and the quote request still usable
  without changing the stored value. Boundaries **1 and 5000** valid; ordinary
  over-cap unchanged. Drift guards over classifier, both repository paths
  (configuration checked *before* capacity), both actions and both buyer pages.
- **Fixture correction:** `createTestDb` had licensed **100000** seats since
  sprint 42 — a number no school could buy. Now 5000, the real maximum.
- **Browser at 1280×800 (`-5`)**: `-5` appears **nowhere** on either buyer page,
  quote field **empty**, aggregates intact; a quote for 150 succeeded saying the
  licence still needs configuration, stored value stayed `-5`, audit read *"a
  seat licence that needs configuration"*; teacher add refused with **no digits
  in the message**.
- **Browser at 768×1024 (`5001`)**: both pages show the configuration state with
  `5001` **nowhere**; admin Restore refused, class still Archived; no overflow.
- **Recovery**: at 120, Program reads *"90 of 120 | 30 left"* and the quote field
  prefills `120`.
- Demo restored: plan school, 120 seats, retention 12, four active classes, 90
  students, 885 attempts, 16 audit rows.
- **No schema, billing, child fields, LMS/SIS, chatbot, telemetry or risk
  scoring.**

### Where this is most likely still wrong — best places to push

- **The column is still unconstrained.** Safe, visible and recoverable; not
  prevented. A CHECK constraint needs a migration.
- **The family is closed, but the dates are not.** `term_starts_on`,
  `term_renews_on`, `year_starts_on` and `year_ends_on` are validated on write
  and read without defence — sprint 49's `subscriptionState` treats an empty
  renewal date as never lapsing, but a malformed one (`"soon"`, `"2026-13-45"`)
  has not been swept.
- Everything under sprints 49–55 still stands.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings.**
- **Only one previous schema shape is recognised** — sprint 34.
- **The limiter is per process** — sprint 30. **The instrument is unequated** —
  sprint 24. **Every mission has been read once, none twice.**

---

## Sprint 55 — correction to sprint 54: the transcript contradicted itself

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-54.md`](2026-08-28-sprint-54.md), sprint 55
  section.

### The defect

`scripts/purge.ts` branched the summary on `classesDeleted === 0` alone, so a
blocked-only run printed *"Nothing is past its retention date. No records were
deleted."* **immediately above** the BLOCKED section. For a blocked school
whether anything is past its retention date is **unknowable** — that is the
point of the block — so the all-clear is a claim the program cannot make.

Sprint 54 existed to stop an operator mistaking a block for "nothing due", and
this printed exactly that mistake into the log. **It is in that sprint's own
verified transcript, which I quoted as proof the requirement was met.**

### The fix

The zero-deletion summary branches on `blocked.length`:

| deletions | blocked | summary |
|---|---|---|
| 0 | 0 | *"Nothing is past its retention date. No records were deleted."* |
| 0 | ≥1 | *"No records were deleted from schools with a recognised retention policy."* |
| ≥1 | ≥1 | the deletion summary, plus the block |

### Already verified — please do not redo

- Typecheck, lint, **607 tests** (up from 604), Turbopack production build.
- New `tests/purge-cli.test.ts` **runs the CLI as a subprocess** against seeded
  temporary databases, because the wording *is* the safety property and reading
  the source would only re-assert what I already believed. Three cases, one
  **confirmed to fail against the sprint-54 script**: blocked-only (no all-clear
  in stdout or stderr, the scoped sentence present, `BLOCKED` naming the school
  and `-12`, exit **1**); nothing due and nothing blocked (original phrase, no
  `BLOCKED`, exit **0**); and one school purged while another is blocked (both
  the deletion summary and the block, still no all-clear, exit **1**).
- **Real run with `retention_months = -12`**: the scoped sentence, then BLOCKED,
  exit **1**. Restored to 12: the quiet-success line, exit **0**. Demo intact —
  4 classes, 90 students, 885 attempts, 16 audit rows.
- **No other scope touched.**

### Where this is most likely still wrong

- **Output is only guarded where a test reads it.** This is the first test in the
  suite that runs a CLI and asserts on what it prints; `db:reset`, `seed` and the
  build scripts are unchecked.
- Everything under sprint 54 below still stands, including the unconstrained
  column and `licensed_students` being unaudited.

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
