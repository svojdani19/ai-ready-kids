# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 74 — one number that moves every deletion date, committed apart from its record

- **Reviewed against:** HEAD `bd8e9ea`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-74.md`](2026-08-29-sprint-74.md)

### The finding

`setRetentionAction` wrote `schools.retention_months` and inserted
`retention.updated` afterwards, as two commits. That field moves the scheduled
deletion date for **every cohort** and changes which children's records the
purge considers eligible — so a failing audit insert left a new deletion
schedule running with no trustworthy record of who set it, on the page that
promises every configuration action is audited.

### The correction

Validation stays above the transaction, so a rejected option never takes a write
lock. `setRetentionMonths` and its audit are wrapped in `auditedWrite`. On
failure the action returns an inline error naming the two things an
administrator would otherwise go and check — the schedule did not move, and
nothing was deleted — and **does not claim the attempt was recorded**, because
the rollback takes the audit row with it. `setRetentionMonths(` joins the
consequential-write guard as exactly one new entry; the other configuration
writes stay out, because keying it on "any write" would turn it back into the
action-name list sprint 73 replaced.

### Proof

Through the exported action with a real admin session, real database and real
`FormData`, against a fixture containing **a second school** on 24 months.
Snapshots include derived `retentionRows` and **the exact set of purge-eligible
class ids at fixed dates**, not just the column.

- **Audit failure:** returns `RETENTION_FAILED`; school row, class rows, derived
  due dates, purge eligibility, audit rows and the other school all exact.
- **Retry:** school row differs in `retention_months` and nothing else; class
  rows byte-identical; each due date moves by exactly **−9 months** from that
  class's own year-end, same day of month; eligibility empty at 2026-09-11 and
  all four classes at 2026-09-13; no student/attempt/check-in count changes;
  exactly one new audit; other school still on 24 months.
- **Invalid option:** `7`, `0`, `-12`, `"twelve"`, `""` each return the existing
  validation error and write nothing.

**Mutation checks, one at a time:** removing `auditedWrite` fails both behaviour
tests *and* both guard tests; removing only the audit spec fails both behaviour
tests; weakening the **no-deletion** clause and weakening the
**date-preservation** clause each fail the audit-failure test on their own.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      802 passed (25 files)   — up from 799
build      ✓ Compiled successfully
```

### Browser

Trigger armed in place, no file swapping. 12 → 3 months on the real page at both
widths: no error page, inline message fully readable and within the viewport,
**12-month option re-selected**, summary still **12 months**, all four due dates
still **June 12, 2027**, retry usable, no overflow. Confirmed again after a hard
refresh. Trigger dropped and the demo verified on disk and in the running
process. No successful save was driven in the browser.

### Where to push hardest

1. **`setBenchmarkWindowAction` is the closest call I left out.** It decides
   which check-in children are offered, so a lost record of who opened a window
   is a real governance question — just not one that moves a deletion date. I
   kept to the stated scope; whether that was the right line is worth challenging.
2. **Eleven configuration actions still audit outside a transaction.** Each is a
   single-row write that cannot leave a half-finished state. The guard
   deliberately does not flag them.
3. **A fixture bug I hit and fixed is worth knowing about.** The derived-row
   helper first used `getPrimarySchool` — `ORDER BY created_at LIMIT 1` — and my
   deliberately-added second school was created earlier, so the test measured the
   wrong school and reported a 0-month move. A test that adds a second school
   must not then ask for "the first one".
4. **Failures still write nothing**, consistent with sprints 70–73.
5. **The guard reads source text** and would miss a write reached through an
   alias or a helper.
