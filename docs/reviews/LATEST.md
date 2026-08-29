# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 76 — the switch that decides which mission a class may open

- **Reviewed against:** HEAD `2f2d262`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-76.md`](2026-08-29-sprint-76.md)

### The finding

`setAssignmentAction` mutated and then audited as two commits. Assigning exposes
an authored mission to children; unassigning withdraws one that may be
half-finished. A failing audit left either outcome unrecorded, and `AssignToggle`
got an uncaught error instead of a state a teacher could act on.

**The brief's second half was right too.** Both repository calls are idempotent
— `INSERT … ON CONFLICT DO NOTHING`, and a `DELETE` whose change count was
discarded — so a double-tap or a stale tab wrote a **"mission assigned" audit
entry for a mission the class already had**.

### The correction

Validity, ownership and the lapsed-term refusal stay above the transaction; the
change and its audit are wrapped in `auditedWrite`. Both repository functions now
**return whether a row changed**, and `auditedWrite`'s audit callback may return
`null` for "no-op, record nothing" — the write stays inside the transaction, only
the record is conditional.

**No-op behaviour, defined not invented:** assigning what is already assigned
returns **no error** (the class is in the requested state, and the switch should
show it) and writes **no audit**. No fabricated event, no false failure.

Failure message, through the existing toggle path: *"That did not save. Room 12
is offered exactly the same missions as before, no child's saved mission work or
badge has changed, and nothing was written to the audit log. It is safe to try
again."* `assignMission(` and `unassignMission(` join the guard; the expected
wrapped-action proof rises to eleven by exactly this action.

### Proof — the child endpoints, not the assignment row

Every access state is exercised through the real exported `beginMission` /
`submitDecision` as the signed-in child, with the teacher session restored after.
Failed assign: snapshot exact, the child still cannot open it, no attempt row.
Failed unassign: still assigned, and a **half-finished attempt is byte-identical
and still continuable** — the next `submitDecision` returns `{ ok: true }`.
Retry assign: one audit, no attempt created, **the child can now open it**. Retry
unassign: the child's work survives byte-identical and `beginMission` refuses.
**Replay preserved** — withdrawing a finished mission still leaves it openable
under the replay rule. No-ops write nothing and return no error. Unknown mission,
cross-owner and lapsed term each write nothing.

**Mutation checks, one at a time:** `auditedWrite` removed → 5 behaviour tests
and both guard tests; `mission.assigned` broken alone → 3; `mission.unassigned`
broken alone → 2; no-op audit made unconditional → both no-op tests;
**unchanged-offer** and **saved-work/badge** clauses each → the message test.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      822 passed (27 files)   — up from 810
build      ✓ Compiled successfully
```

### A gap I found and deliberately did not fix

The brief asked for an archived-class refusal test. **There is no such refusal.**
`requireOwnActiveClass` is named "active" but checks ownership and the term only
— never `archived_at` — so assigning to an archived class succeeds, while
`createStudent` refuses one outright. No child is exposed (sprint 69 closed
student sessions on archive), so it is a consistency gap rather than an access
hole, and fixing it is an authorization change deserving its own sprint. Rather
than assert a refusal that does not exist, the test **records the actual
behaviour** under a name that says so.

### Browser

Trigger armed in place, no file swapping. Toggling **The Study Group** for Room
12 at both widths: switch rolls back to `Assign`, message readable and within the
viewport, retry usable, no overflow, and the switch is still `Assign` with no
residual alert after a **hard refresh**. Database after: Room 12 still on 21
assignments, 6 audit rows, **0** `mission.assigned`. **Child-facing:** no Study
Group card, no link, and `/student/play/the-study-group` lands back on `/student`.
Trigger dropped; demo verified on disk and in the running process.

### A flake caught by the gate, and fixed

One full-suite run failed in `checkin-player` → *"offers Try again…"*. It did not
reproduce (5 clean file runs, 3 clean full runs), but it is the **same race
sprint 62 fixed one line lower**: the rejection is handled inside the async
`startTransition`, so the synchronous `getByRole("button", { name: "Try again" })`
could run while the label was still "Next". Changed to `findByRole`; 8
consecutive clean runs. Test-only, no production code. Recorded rather than
re-run-until-green — a gate that passes on the second try has not passed.

### Where to push hardest

1. **The archived-class inconsistency** — named above, unfixed by choice. If the
   reviewer thinks it belongs in this sprint rather than its own, that is a fair
   push.
2. **A no-op returns success**, so a teacher cannot tell "I changed it" from "it
   was already so". That is the honest trade against reporting a failure that did
   not occur, but it is a UX decision made here rather than asked about.
3. **Eight configuration actions still audit outside a transaction.**
   `addStudentAction` is the closest call left.
4. **The dev server had stopped mid-sprint and I restarted it.** The database
   file was untouched — I only add and drop triggers now — and I verified counts
   after the restart before continuing, precisely because sprint 73 found a
   silent re-seed after a file-copy restore.
5. **The guard reads source text** and would miss a write reached through an
   alias or a helper.
