# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 72 — repairing a school calendar was three commits, and one of them set retention dates

- **Reviewed against:** HEAD `f33dd64`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-72.md`](2026-08-29-sprint-72.md)

### The finding

`setAcademicDates` committed in pieces — the school row, then the decisive read
of the previous academic year, then a loop repairing each candidate cohort's
label and year-end — and the action wrote `year.dates_set` separately after all
of it. A failure partway left the calendar changed, **some** cohorts repaired
and others not, and no audit. **Each class's `year_ends_on` is what its
retention due date is calculated from**, so that leaves two cohorts in the same
year on different deletion schedules, one still unschedulable, with nothing
recording the attempt.

### The correction

`setAcademicDates` is transaction-aware itself, so direct repository callers are
safe too, and `BEGIN IMMEDIATE` is taken **before** the read that decides which
labels are candidates. An outer transaction is participated in, never committed
or rolled back here. The action wraps the helper plus the success audit in
`auditedWrite`; validation stays before the transaction so a rejected form never
takes a write lock. On failure it returns a calm inline error naming the school
year, the class labels and the class year-ends used for retention as unchanged,
with a retry instruction and no support promise.

### Failing-before

Two genuine candidates (broken label + unreadable date) plus three controls: a
same-label class with a **valid** date, a real historical year, and another
school. A counter trigger aborts the **second** class update, so the failure
lands between two intended repairs. Against the un-transacted helper:

```
school = 2026-2027 / 2027-06-12      ← calendar already moved
a      = 2026-2027 / (empty)         ← relabelled, retention date still unusable
b      = 2025-2027 / 2026-13-45      ← not repaired at all
audits = 0
```

The corrected helper throws and the whole snapshot is byte-for-byte unchanged,
including the trigger's own counter row. Through the real action with an
audit-insert abort: `ACADEMIC_DATES_FAILED` returned, snapshot exact,
`year.dates_set` rows **0**. Retry asserts exact new dates, both candidates
repaired in label and year-end, all three controls untouched, subscription and
retention preserved, and exactly one audit carrying the same two facts as the
on-screen message.

**Mutation checks, one at a time** — date repair disabled, relabel repair
disabled, success audit removed, helper transaction removed — each fails the
relevant test on its own. No batch mutation, no test-side insert as evidence.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      760 passed (23 files)   — up from 755
build      ✓ Compiled successfully
```

### Browser

Trigger armed **in place**, no file swapping. At 1280×800 and 768×1024: changed
**Last day** to `2026-06-19` in the real form and saved — `errorPage false`,
inline message readable and within the viewport, field reverted to `2026-06-12`,
retry usable, no overflow. Server state unchanged both times, `year.dates_set`
audits **0**. Trigger dropped and the demo verified **on disk and in the running
process**: the form reads back the original dates, `/admin/data` still shows all
four due dates as **June 12, 2027**, six seeded audit actions in order. No
successful save was driven in the browser.

### Where to push hardest

1. **Two pre-existing source-position tests were replaced, not patched.**
   *"validates before any write"* checked where `academicProblem` sat relative to
   `setAcademicDates(` in the file; it now drives the validator against a real
   database and asserts nothing was written. Worth confirming the replacement is
   stronger rather than quieter — that has been the failure mode in four of my
   recent sprints.
2. **The other configuration actions are unchanged.** `setRetentionAction`,
   `setSchoolAction`, `setBenchmarkWindowAction` and staff removal still audit
   outside a transaction. Each is a single-row write, so a lost entry cannot
   produce a half-repaired state — but the page's promise covers them too, and
   the scope here was one action.
3. **`auditedWrite` is applied action by action.** Nothing structurally stops the
   next configuration action from auditing separately.
4. **Failures still write nothing.** A successful retry shows one clean entry
   with no sign the first attempt failed.
5. **The repair scope is deliberately narrow and unchanged.** A cohort whose
   label is a *real* school year but whose date is unreadable is repairable only
   by opening that year, not the current one. History is not rewritten, which is
   right — but it leaves one recovery path that requires knowing which year to
   open.
