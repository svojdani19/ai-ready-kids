# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 67 — a deletion right the code does not grant, and an assurance nothing enforced

- **Reviewed against:** HEAD `ab5d258`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-67.md`](2026-08-29-sprint-67.md)

### Defect 1 — "A school can delete everything at any time"

`/privacy` promised whole-school erasure. Tracing every `DELETE FROM` in the
repository, the self-service surface is: **classes** (cascading to roster,
assignments, attempts, check-ins), **students**, **attempts**, **assignments**,
and **users** via `removeStaffAction` — which refuses while the person owns any
class, refuses your own account, and refuses the last administrator. Nothing
deletes the `schools` row, the remaining `users`/`certifications`, `audit_log`,
`meta` or the account settings. `resetDatabase` empties the tables and
**re-seeds demo data** from `scripts/reset-db.ts`; no file under `src/app`
references it.

Replaced by `DELETION_SCOPE`, rendered on `/privacy` and `/admin/data`: the
class cascade and the staff rule stated exactly, then — *"Nothing in this build
deletes the school record and its settings, the staff accounts that remain,
their orientation answers, or the audit log. There is no whole-school or account
erasure control in this demonstration — not self-service, and not by any other
route the product offers."* No support contact, ticket, backup behaviour or
timeline invented in its place; a test forbids each. `/for-schools` and the
README are aligned.

### Defect 2 — "Nothing here names a student"

The `assignments` entry carried that assurance while `assignments.note` was an
unconstrained `TEXT` column, `assignMission` accepted and wrote a `note`, and the
demo seed wrote *"Do this one together on the rug…"* into it. The promise held
only because no form called the parameter.

The write surface is reduced rather than documented: `assignMission` has no
`note` parameter, the `INSERT` writes literal `NULL` for `note` and `due_on`, the
conflict clause is `DO NOTHING`, and the seed writes no note. **No note UI was
added.** Both columns stay — dropping them is a migration that would erase
values an existing database may hold — so the inventory says they are unused,
that an older database may still hold a staff-typed note, and that a child
cannot put text there or anywhere else because there is no free-text input in
the student experience at all.

### Evidence

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      706 passed (18 files)   — up from 693
build      ✓ Compiled successfully
against ab5d258 → 8 of 12 new tests fail (both defects)
```

Two tests are grounded in statements rather than prose: one parses every
`DELETE FROM` in `src/` and `scripts/` and asserts the table set is exactly
`{assignments, attempts, classes, students, users}`; the other deletes a demo
class and asserts roster, attempts, benchmarks, the class row and its
assignments are gone while the audit log, staff rows and school row are
untouched.

### Correction during acceptance — the cascade test could not fail

The second of those counted survivors **after** the delete with
`WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)`. The cascade
removes the students first, so the inner select was empty and the count was zero
whether or not orphaned attempt or benchmark rows survived. The claim most in
need of evidence had a verification path guaranteed to agree with it.

Corrected: student ids are **captured before** `deleteClass` and the
after-queries run against those literal ids; the before-state is asserted
non-zero so the test cannot pass by deleting nothing from nothing; the class row
and its assignments are asserted gone; and `PRAGMA foreign_keys` is asserted to
be `1` rather than assumed.

Failing-before for the *test logic*: a second test builds the orphan state in a
throwaway fixture — foreign keys off **on that connection only**, students and
class row deleted directly, attempts left behind — and shows the old query
returns **0** while the corrected query returns the full before-count.
Production foreign keys are untouched.

**The stronger test found nothing.** It passes against unchanged code, so the
cascade does remove attempts and benchmarks; no deletion behaviour and no buyer
copy changed. The defect was in the evidence, not the product.

Browser on :3210 — `/privacy` and `/admin/data` at 1280×800 and 768×1024. All
four: banned claims absent, cascade/staff/no-erasure lines present, unused-column
and legacy-database sentences present, no horizontal overflow.

The local demo database held four notes from the old seed; cleared with a
targeted `UPDATE assignments SET note = NULL` so the demo matches the new seed.
No migration added, no other row touched.

### Where to push hardest

1. **Four of the thirteen new tests pass before the fix, and I say so.** The
   `DELETE FROM` inventory, the `resetDatabase` containment check, the cascade
   test and null-after-write pin code that was already correct — the copy was
   what disagreed. They exist so a future change to the delete surface has to
   confront the copy in the same commit. The cascade test in that list is the
   corrected one; its first version could not have failed at all.
2. **The `DELETE FROM` parser is a regex over source text.** It would miss a
   deletion expressed another way — a raw `db.exec` built by string
   concatenation, an `ON DELETE CASCADE` reaching further than expected, or a
   future ORM call. It checks the statements that exist today, not the concept.
3. **`assignments.note` still exists and may hold data.** I removed the write
   paths and cleared the demo, but any database carried over from before this
   commit keeps whatever was written. The inventory says so; nothing deletes it.
4. **The remaining deployment gaps are real and unfixed:** no account erasure at
   all, an audit log that outlives the records it describes and cannot be
   deleted, and `npm run reset-db` sitting one shell command away for anyone with
   the filesystem. The product now describes these accurately rather than
   contradicting them, which is not the same as solving them.
5. **The same audit is worth running on the other verbs.** This sprint checked
   "delete" against the `DELETE` statements. "Export", "archive", "reassign" and
   "rotate" all have buyer-facing copy that has never been traced to the code the
   same way.
