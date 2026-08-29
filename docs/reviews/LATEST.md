# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 73 — the same operation, transactional on one path and not the other

- **Reviewed against:** HEAD `c65026b`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-73.md`](2026-08-29-sprint-73.md)

### The finding

Sprint 71 made the **administrator's** code rotation atomic with its audit and
left `rotateJoinCodeAction` — the **teacher's** rotation — untouched. Same
repository call, same credential consequence, same audit action, and it is the
path teachers use most. Two more of the same shape were also unwrapped, both
irreversible: `removeStudentAction` (deletes a child's row, cascading to every
attempt and check-in) and `removeStaffAction` (deletes an account, cascading to
their certification). A lost audit there means records gone with no answer to
"who removed them, and when".

### The correction

Each wraps its mutation and audit in `auditedWrite` and returns a calm inline
error naming what did not change — student removal says **"no records were
deleted"** explicitly. The mismatched-pair refusal keeps its own message, since
nothing was attempted.

**A structural guard replaces sprint 71's list.** It keys on the *repository
call* — `deleteClass(`, `deleteStudentFromClass(`, `deleteUser(`,
`rotateJoinCode(`, `archiveClass(`, `restoreClass(`, `setAcademicDates(` — so
any exported action that performs one and audits must use `auditedWrite`. A new
destructive action is caught without anyone updating a list, which is precisely
how the teacher rotation had been missed. A companion test asserts the sweep
finds the eight actions that exist, so an empty sweep cannot pass silently.

### Evidence

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      799 passed (24 files)   — up from 760
build      ✓ Compiled successfully
```

Reverting `removeStudentAction` to mutate-then-audit fails three behaviour tests
**and the structural guard**. Each audit was then broken **on its own** — never
in a batch — and each fails exactly its own two tests. Retry tests assert the
mutation, not its precondition: rotation requires a changed `join_code` with
every other column identical; student removal captures the child's id before the
delete and checks their attempts by that literal id.

Browser: trigger armed in place, the teacher's rotation driven through the real
class page at both widths — no error page, code still `MAPLE-HERON-317`, inline
message within the viewport, retry usable, no overflow.

### Correction to earlier sprints' demo-restore claims

The demo's counts no longer match what sprints 70–72 recorded (884/134/53); they
are now 1078/129/65, which is **exactly what a fresh seed produces today**.
`data/airk.db` was rewritten at 10:26 — when I restarted the dev server during
sprint 70's acceptance correction. My sprint-70 file-copy restore captured the
main file without the pages the running server still held in its WAL, so the
restarted process read the database as empty and re-seeded it. Sprint 70's own
review warned that verifying a restore with `node` proves the file and not the
process; this is that hazard going further than I described.

The demo is currently correct — clean current-content seed, original join codes,
2025-2026 calendar, term and retention intact, nothing archived, six seeded audit
actions. Nothing was lost (gitignored fictional data). But "demo restored
exactly, 884/134/53" in sprints 70, 71 and 72 stopped being true of the file at
10:26, and those reviews now say so. No sprint since 70 has used file-copying;
71, 72 and 73 all arm and drop triggers in place.

### Where to push hardest

1. **Twelve configuration actions still audit outside a transaction** —
   `updateSchoolAction`, `setRetentionAction`, `addTeacherAction`,
   `reassignClassAction`, `createClassAction`, `addStudentAction` and the rest.
   Each is a single-row write that cannot leave a half-finished state, which is
   why they are not here, and the guard deliberately does not flag them — keying
   it on "any write" would make it a list again. Whether that line is in the
   right place is worth challenging.
2. **The guard reads source text.** A consequential write reached through an
   alias or a helper would not be seen, and it cannot know that a repository
   function became destructive later.
3. **I found the demo drift myself, late.** It had been wrong since 10:26 and I
   verified "restored exactly" twice after that without noticing, because I
   compared against numbers I had written down rather than against what the seed
   produces. Checking a restore against its generator, not against a note, is the
   durable fix.
4. **Failures still write nothing**, consistent with sprints 70–72.
5. **One more source-position test was replaced** (`access-control`'s
   `if (!removed)` before `recordAudit`). That is the fifth such replacement;
   worth confirming each landed stronger, not quieter.
