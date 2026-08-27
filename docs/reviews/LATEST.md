# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 23 — the export promised a protection it did not provide

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-23.md`](2026-08-27-sprint-23.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. **Sprints 22
  and 23 are the second pass over the reporting layer. Sprint 23 is the first
  defect here where the product made a written promise it did not keep.**

### What changed

Worse than sprint 22. That was a claim that could mislead a teacher; this was a
privacy defect and a false statement inside the export.

1. **Competency rates were suppressed on the wrong group.** Sprint 22 fixed the
   rate's own arithmetic and left the suppression check pointing at
   `allStudents` / `students.length`. A school of thirty where **one** child had
   completed the only relevant mission exported that competency as a percentage:
   contributing group one, check saw thirty. In grades 2-4 somebody can usually
   work out who the single participant was.
2. **The benchmark path had no suppression at all.** Fall, spring and matched
   growth were computed for any non-empty list, one student included, passed
   through `buildSchoolReport` unchanged and exported by `reportToCsv`. A school
   with one matched student could export that child's before-and-after change in
   a file that assured the recipient groups below five are suppressed.
3. **Suppression now counts distinct contributing students, everywhere.**
   `summariseCohort` carries `contributorIds` per competency so the school
   roll-up can **deduplicate across classes** before checking the threshold.
   Class cells use that class's own contributors. Suppressed cells carry null
   raw counts too, because "1 of 1" discloses what the percentage would have.
4. **Benchmark suppression happens at the source**, in
   `summariseCohortBenchmark`: five distinct students per window, five *matched*
   for growth, and the same matched threshold on every per-competency growth
   cell. Every consumer inherits it. Participation counts stay visible — they
   say how many took part, not how anybody did.
5. **The privacy note now says what is true**, in three sentences: what
   contributing means and that it is usually fewer than are enrolled; the
   check-in thresholds; and completion rate named as the documented exception
   rather than quietly covered by a sentence that never fitted it. The public
   privacy page and the report page's own table description had the same stale
   claim and were corrected too.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **343 tests**, Turbopack build.
- Eight new tests: thirty enrolled with one contributor; suppressed raw counts;
  the four-versus-five boundary in one class; multi-class deduplication (3 + 2
  reports at school level, neither class alone); one matched benchmark student
  with every rate and growth cell null; five matched reporting; and a sweep that
  **every suppressed cell in the object produces a CSV row containing "too few
  to report" and no percentage**.
- A class row being unsuppressed and its competency cell being suppressed are
  asserted as two different things, because they are.
- No new student fields, identifiers, telemetry or scoring. `contributorIds` is
  internal to the calculation and never reaches the report object.
- The admin report page and public privacy page checked in the browser.

### Where this is most likely still wrong

- **A correctness fix does not carry a privacy fix with it.** Sprint 22 fixed
  the arithmetic of this exact rate and left the guard pointing at the wrong
  number — two passes over the same twenty lines, one defect each, and the
  second was the more serious. Changing what a number means changes who it
  identifies. Re-read the guard in the same breath as the arithmetic.
- **Nothing verifies the privacy prose against the code that implements it**,
  beyond the specific assertions added here. The notes are authored text sitting
  next to a separate implementation and can drift again. A promise in the prose
  is a test case; only some of them have tests.
- **The CSV suppression sweep is not generic.** It covers competency and
  class-completion rows, not every row type.
- **The benchmark roll-up has now been touched but not read for claims of its
  own** — only for suppression.
- **Every mission has been read once. None has been read twice.**
- **Nothing checks what a wrong answer costs a child** — still open from
  sprint 20.
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
