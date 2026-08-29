# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 77 — a teacher's guide to running a session

- **Reviewed against:** HEAD `a12032a`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-77.md`](2026-08-29-sprint-77.md)

### The gap

Every session shipped a discussion guide — what it teaches, what to watch for,
debrief questions, misconceptions, an unplugged extension — and nothing that told
a teacher **how to run the twenty minutes**. The printable guide header has
asserted *"N minutes independent, 15 minutes debrief"* for many sprints with that
shape described nowhere.

### What was built

`src/content/session-guide.ts`, one authored source read by three surfaces.
**Two shapes**, because the product has two kinds of session: a **First Look**
session led from the board (3/10/5/5, no device needed) and a **core mission**
played independently then debriefed (3/7–9/3/15), each step saying what *you* do
and what *they* do. Plus **room setups** (one device each, a rotation, board
only), **what to do when the room does what rooms do** (the four-minute finisher,
the stuck child, the upset child, the redo, the argument), **five things not to
do** — each undoing a deliberate product decision — and **what each kind of
session leaves behind**.

New page `/teacher/how-to-run-a-session`, in the nav and linked from the
overview; a **run sheet** on each mission page and on the **printable** guide,
using that session's own `estimatedMinutes` and picking the shape from its own
`segment`. The printed header's claim is now explained directly beneath it.

### A false claim it exposed

Writing "what each session records" meant checking. Orientation said *"First Look
records nothing on the roster."* Traced: a finished First Look **does** create an
attempt row and **does** raise `missionsCompleted`; it moves **no** competency
figure. Wrong in the first half, right in the second. Corrected to say First Look
records **no skill evidence**, while recording that the child opened and finished
it — and that a board-only run with nobody signed in records nothing about any
individual.

### Evidence

11 tests tying copy to content and to behaviour: the stated 6 / 27 / `1-2` /
`3-5` / `2-4` / 7–9 are read from the content, so a content change that breaks
the prose fails; the 15-minute debrief is asserted against the printed header's
own source; steps sum within their advertised totals; and **the recording claims
are checked against a real report build**. Overclaim guards forbid `certifi`,
`compliance`, `guarantee`, `WCAG`/`fully accessible`, `contact us/support` and
`evidence-based`/`research shows`/`proven to` across every string and the page.

**Mutation-checked one at a time:** restoring the old orientation sentence fails
only the orientation test; changing the debrief to 4 minutes fails only the
header-agreement and sums tests.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      836 passed (28 files)   — up from 825
build      ✓ Compiled successfully
```

Browser at both widths, no overflow: both shapes render; the class-photo mission
shows **8 min** (its own estimate, not the generic 9); a First Look mission shows
the board-led shape at 10 min; the printable guide carries the run sheet. No demo
data changed.

### Where to push hardest

1. **The timings are authored judgement, not measured.** Nobody has run a stopwatch
   on 3/9/3/15 in a real classroom, and the page claims nobody has — but a school
   will read them as tested.
2. **No evidence base is cited because none was consulted.** The guidance reflects
   the product's design and ordinary classroom practice. If a buyer expects
   research backing, this does not provide it.
3. **First Look counts toward the completion rate.** This sprint fixed the
   *description*; whether a board-led comprehension session should count as
   completed work alongside a core mission is an open product question.
4. **The run sheet substitutes minutes by step index** (`i === 1`). Reorder or
   insert a step and that goes stale silently; a named step id would be sturdier.
5. **Sprint 76's carry-over stands:** only `setAssignmentAction` refuses an
   archived class; `renameStudentAction`, `removeStudentAction` and
   `rotateJoinCodeAction` have not been audited for the same parked-then-restored
   reasoning.

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
tests      825 passed (27 files)   — up from 810
build      ✓ Compiled successfully
```

### A lifecycle hole, found here and fixed during acceptance

There was no archived-class refusal: `requireOwnActiveClass` reads ownership and
the subscription term but never `archived_at`, so a teacher could change an
archived class's missions through the public server action.

**My first assessment was wrong.** I called it harmless because an archived class
"has nobody in it" — true only *while* archived. Sprint 69 closes the student
**sessions**; the **roster, attempts and assignments remain stored** and the class
can be restored, so a mission changed while a cohort is parked goes live the
moment somebody restores it, with nobody having decided that after the restore.

Corrected in `setAssignmentAction` only, after validity/ownership/term and
**before** `auditedWrite`: *"That class is archived. Restore it before changing
its missions."* `requireOwnActiveClass` is deliberately not widened. The pinning
test is replaced by four real ones — assign refused, unassign refused with a
child's half-finished attempt byte-identical, refused **above the transaction**
(the archived message wins even with the audit trigger armed), and assigning
succeeds again after `restoreClass`. Removing the refusal fails all four; moving
it inside `auditedWrite` also fails all four.

### Browser### Browser

Retained from the pre-correction run — this is a server-action boundary change
and an archived class renders no assignment control, so no new pass was needed.
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

1. **Only `setAssignmentAction` refuses an archived class.** Every other
   classroom mutation still goes through `requireOwnActiveClass`, which does not
   read `archived_at`. `renameStudentAction`, `removeStudentAction` and
   `rotateJoinCodeAction` are the ones to audit next — the same parked-then-
   restored reasoning may or may not apply to each, and I have not checked.
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
