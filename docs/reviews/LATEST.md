# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 70 — the school-year rollover was four commits pretending to be one

- **Reviewed against:** HEAD `4d447b0`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-70.md`](2026-08-29-sprint-70.md)

### The finding

`rolloverYearAction` ran a sequence of independently committed writes:
`archiveClass` per class (each opening its own `BEGIN IMMEDIATE` when there was
no outer transaction), then `setAcademicYear`, `setBenchmarkWindow` and
`recordAudit`. A failure on the second class or any later write left the school
half transitioned — some cohorts archived and **their join codes rotated**,
others active, dates still last year's, and no trustworthy audit either way.
Sprint 69 raised the cost: a partial rollover now signs some rooms' children out
and not others, with nothing recording which.

### The correction

`src/lib/repo/rollover.ts` → `performRollover`, one `BEGIN IMMEDIATE` over the
whole thing, with the school and classes **re-read inside it** and the preview
recomputed there — the page's preview stays informational, the action's is
transactional. `archiveClass` already honoured an outer transaction, so it
participates rather than committing around it, and a test now pins that. The
audit row is written inside the transaction: exactly once on success, never on
failure. A thrown failure rolls back and the action returns an inline
`ROLLOVER_FAILED` with the retry path intact, not a 500.

**Corrected during acceptance.** That message ended *"if it keeps happening your
account contact can look at it"* — a support promise this product cannot keep.
The programme contact is the school-side person for quotes and invoices, there
is no technical support destination in the build, and a failed rollover
deliberately writes no audit row or diagnostic, so there would be nothing to
look at even if there were somewhere to send them. It now ends: *"Try again. If
it still does not work, leave the school year as it is — your classes, rosters
and codes carry on unchanged, and you can roll over later."* True because of the
rollback the tests prove: stopping costs nothing. The test forbids `account
contact`, `can look at it`, `support`, `we will look/investigate/fix`,
`reported`, `within N hours`, `logged` and `diagnostic`, and fails against the
old wording. No behaviour changed, so the destructive exercise was not repeated;
the corrected message was read through the live form at both widths.

### Failing-before

A SQLite trigger counts archives and raises `ABORT` on the second, so the first
class is archived and rotated before the failure. Against the pre-fix sequence,
**3 of 4 fail**:

```
× rolls back the archives and codes already written
    AssertionError: expected 1 to be +0     ← the counter survived the abort,
                                              proving an independent commit
- Room 4 … "archived_at": null, "join_code": "ACORN-BADGER-208"
+ Room 4 … "archived_at": "2026-…", "join_code": "BUTTON-HERON-775"
```

One room archived and re-credentialled, three untouched, year unchanged, no
audit. The test asserts the fixture has at least two classes to archive, so
"after the first write" cannot be vacuous.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      737 passed (21 files)   — up from 733
build      ✓ Compiled successfully
```

### Browser

Demo file-copied first so restoration is exact. Trigger installed on it, and the
rollover driven through the **live form** at 1280×800 and 768×1024:
`errorPage false`, inline recovery message, retry button unobscured, still
"Moving from 2025-2026", no overflow. Database after: no class archived, no code
rotated, school still `2025-2026`, `year.rolled` audits **0**, and the trigger's
own counter **0** — even that rolled back. Failure removed, same button pressed
again: all four classes archived with rotated codes, `year_ends_on` unmoved,
school on `2026-2027`, subscription and retention untouched, exactly one audit
row. Demo then restored from the file copy and verified column by column, with
no test trigger left in the schema.

### Where to push hardest

1. **The page preview can still be stale by design.** An administrator can see
   "4 classes archived" and the transaction act on 3 if someone archives one
   meanwhile. The result message reports what happened, not what was predicted —
   but nobody is told the numbers differed.
2. **`ROLLOVER_FAILED` is one message for every failure mode**, and **failures
   write no audit row at all**. That is deliberate — a school cannot act on a
   lock timeout — but a repeatedly failing rollover leaves nothing to read, and
   there is no support channel in this build to read it. The message now points
   nowhere, which is honest and is also the whole remedy on offer.
3. **File-copying the demo database out from under a running dev server leaves
   the process reading a deleted inode.** It happened during this sprint's
   browser run: the file was correctly restored while the server kept serving
   the rolled-over school until I restarted it. `reset.ts` warns about this and
   truncates through SQLite instead. Verifying a restore with `node` proves the
   file, not the process.
4. **The rollover is the only multi-write action wrapped this way.**
   `archiveClassAction` still calls `recordAudit` outside `archiveClass`'s
   transaction, so a failure between them leaves an archive with no audit row.
   Much narrower, same shape, not fixed here.
5. **The atomicity test's failure injection is a trigger on `archived_at`.** It
   proves the class loop is covered; it does not exercise a failure landing
   between `setAcademicYear` and `recordAudit`. Those are inside the same
   transaction by construction, but by construction is not by test.
6. **Nothing retries automatically.** If the cause is transient, the
   administrator presses the button again, and there is no queue or backoff.
