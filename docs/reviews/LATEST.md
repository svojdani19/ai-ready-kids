# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 32 — the product could not survive its own first renewal

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-32.md`](2026-08-27-sprint-32.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  sprint 25 the educator orientation. Every body of authored content has been
  read once. Sprints 26-30 audit what the product permits and promises.
  **Sprints 31-32 walk ordinary school workflows. Sprint 32 found that the
  academic year and the subscription term were the same field, and that there
  was no rollover at all.**

### What changed

1. **There was no school year, only a subscription term.** The classes page took
   the year from whichever class sorted first with `?? "2025-2026"` behind it,
   the create form hid it, and the action had the same literal as its fallback —
   so **on 27 August 2026 every new class was still being created in
   2025-2026**. Nothing anywhere moved the term dates, and reports took the year
   from `classes[0]`, labelling a mixed-cohort school by an accident of
   ordering.
2. **Retention was anchored to the renewal date.** `purgeDateFor` used
   `term_renews_on` for every class while the interface said "months after the
   school year ends". In the seed those are **1 September and 12 June**.
   `class.school_year` already existed and was ignored, and a future cohort
   would have inherited that fixed date and could have come due **before its own
   retention period elapsed**.
3. **They are separate fields now.** A school carries `academic_year`,
   `year_starts_on` and `year_ends_on` beside the subscription dates, and every
   class **snapshots its cohort's year end at creation**. Retention is per class
   from that snapshot, so a rollover cannot move an existing cohort's date and a
   new cohort cannot inherit an old term's. The seed keeps the two sets
   deliberately apart and a test asserts they differ.
4. **There is a rollover, and it previews before it acts** — what will be
   archived, the new year and its dates, that check-ins close, and that every
   class keeps the year-end it was created with. Subscription dates are
   explicitly untouched. `nextYearLabel` refuses a label it cannot parse;
   `addYear` turns 29 February into 28 February.
5. **A name can be corrected without deleting the child.** The roster had Add
   and Remove and nothing between, so a typo meant a wrong name all year or
   losing every attempt, check-in and badge. `renameStudent` moves only
   `display_name`, scoped by class and student, sharing one `validateDisplayName`
   with adding so the two cannot drift. The audit names the class, never the
   child.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **440 tests**, Turbopack build.
- The year tests include the one that matters: a 2026-2027 cohort run through
  the purge **in the gap between the old term-derived date and its own** must
  survive, and go only when its own date arrives. Plus mixed cohorts each right
  about themselves, the leap-day boundary, the preview's four claims, and a full
  rollover asserting no historical deletion date moved and the subscription date
  did not either.
- Rename tests: a typo corrected with attempt, evidence, badge and avatar
  intact; a preferred-name change; a colleague's student refused; both actions
  sharing one validator.
- Verified in the app: rolled Brightwood to 2026-2027, four classes archived,
  check-ins closed, and the 2025-2026 cohorts still read June 12, 2027 on the
  retention page afterwards.

### Where this is most likely still wrong

- **Nothing here had ever run the year forward.** Thirty-one sprints ran against
  a database seeded to a single school year and all of them passed. The defect
  was not that something computed wrongly — it was that the passage of time had
  never happened. There was no second cohort, no archived year, no August. That
  is a whole category: not "is this correct" but "is this correct *the second
  time*".
- **Two ideas sharing one field** is now the fourth appearance: school
  membership doing the work of ownership (26), "fall and spring" with no state
  (27), a friendly identifier doing the work of a credential (30), and the
  invoice date doing the work of the last day of school (32). Each time the
  interface described the second idea, the code stored only the first, and they
  coincided closely enough in the demo that nothing looked wrong.
- **No migrations.** Adding a column needs `data/airk.db` deleted, because
  `db:reset` truncates in place. Documented in the README; a real deployment
  needs migrations.
- **Rollover is one school at a time** and archives everything in the current
  year. Two cohorts running side by side is not modelled.
- **Bulk reassignment does not exist** — sprint 31.
- **The route and action inventory is still not complete.**
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Marketing prose is still mostly untested** — sprint 26.
- **Every mission has been read once. None has been read twice.**
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
