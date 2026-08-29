# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 71 — a school operation and its audit entry were two facts

- **Reviewed against:** HEAD `0a09050`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-71.md`](2026-08-29-sprint-71.md)

### The finding

`/privacy` promises *"Every configuration change and every deletion writes an
audit entry"*; the admin Audit log and the plans page say the same. All four
class operations mutated first and audited afterwards, each committing
separately. When `recordAudit` failed: **delete** had already cascade-removed
the class, roster, attempts, check-ins and assignments — and the administrator
saw an unhandled failure over a class that no longer existed; **archive** had
rotated the code and signed the room out; **rotate** had invalidated the
credential; **restore** had reactivated the roster. All unrecorded. Someone
reading the log for "who deleted Room 12" would find nothing while Room 12 was
gone.

### The correction

`auditedWrite(db, write, audit)` — one `BEGIN IMMEDIATE` over the mutation and
its audit insert. Repository operations check `db.isTransaction` and
participate; a test pins that. Each action returns a calm inline error naming
the unchanged state, with deletion saying **"no records were removed"**
explicitly. No message promises support, monitoring or diagnostics, and a test
forbids each phrasing.

Restore refusals are untouched: a plan/cap/licence refusal throws before
anything is written, and its refusal audit is recorded separately afterwards
because it records that nothing happened. `deleteClassDataAction` now returns
`{ error?: string }` and both call sites return it rather than discarding, so
`ConfirmAction` can render the error.

### Failing-before

A `BEFORE INSERT` trigger on `audit_log` raises `ABORT` for one action, after
the mutation has run. Against the pre-fix sequence, **4 of 15 fail** — one per
operation — with the delete diff showing 23 children's records gone and
`data.deleted` audits at 0.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      752 passed (22 files)   — up from 737
build      ✓ Compiled successfully
```

Snapshots are `toEqual` over stringified rows of `classes` (including
`archived_at` and `join_code`), `students`, `attempts`, `benchmarks`,
`assignments`, `audit_log` and `schools`, table-driven across all four
operations both after the injected failure and after the retry.

### Browser

Trigger installed **in place** — no file swap, so no repeat of sprint 70's
stale-inode mistake. At both widths, the real Delete confirmation on Room 12:
`errorPage false`, inline "no records were removed" message, Room 12 still
listed with 23 students, confirmation reopenable, no overflow. Database after:
4 classes / 90 students / 884 attempts / 6 audit rows, `data.deleted` audits
**0**. Trigger dropped and the demo verified **on disk and in the running
process**. A successful destructive deletion was not re-driven in the browser;
the retry-success integration test is that evidence.

### Where to push hardest

1. **Non-class operations are unchanged.** `setRetentionAction`,
   `setAcademicDatesAction`, staff removal and the report export still audit
   outside a transaction. Same shape, smaller consequence — a configuration
   write rather than a cascading deletion — but not fixed, and the brief scoped
   me to four.
2. **The buyer-promise guard names four actions by name.** A fifth class
   operation added later would not be noticed by it. A lint rule or a repository
   boundary that made auditing impossible outside a transaction would be the
   durable version.
3. **Failures still write nothing.** An administrator who retries successfully
   gets a log showing one clean operation, with no sign the first attempt failed.
   Consistent with sprint 70, and still a gap in the story an auditor could read.
4. **`revalidatePath` runs after the commit.** The atomicity claim stops at the
   transaction boundary; a revalidation failure would leave the write done.
5. **One pre-existing assertion was replaced, not deleted.** `admin-journey`
   checked that the restore success audit appeared *after* `return {` in the
   source — a text-position proxy that the move into the transaction invalidated.
   It is now a behavioural assertion in the new file. Worth confirming I replaced
   it with something stronger rather than something quieter.
