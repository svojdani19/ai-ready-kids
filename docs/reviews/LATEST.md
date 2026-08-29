# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 75 — the switch that decides what children are offered, committed apart from its record

- **Reviewed against:** HEAD `96f67c5`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-75.md`](2026-08-29-sprint-75.md)

### The finding

`setBenchmarkWindowAction` wrote `schools.benchmark_window` and audited
afterwards, as two commits. That setting decides immediately and school-wide
whether children may start or resume the fall form, the spring form, or neither.
A failing audit insert could leave a window opened, closed or switched with no
record of who did it — children into an assessment outside its administration
period, a mid-form class unable to resume, or a cohort moved between forms in a
way that contaminates the fall-to-spring comparison.

### The correction

Validation **and** the lapsed-subscription refusal stay above the transaction.
`setBenchmarkWindow` and its audit are wrapped in `auditedWrite`. The failure
message states that children are offered exactly what they were, and that the
attempt started no child, stopped no child and moved nobody between forms — and
does not claim the attempt was recorded, because the rollback takes the audit
row with it. `setBenchmarkWindow(` joins the consequential-write guard as one
new entry; the expected wrapped-action proof now names ten.

### Proof

Each transition on **its own fresh fixture**, so they cannot mask each other:

- **closed → fall** — the child is still offered nothing, **and the real
  exported `submitCheckInAnswer`, called as that signed-in child**, returns
  `{ ok: false, error: "That check-in is not open." }` and writes no benchmark
  row. The consequence is exercised, not mocked; the admin session is restored
  afterwards.
- **fall → closed** — an *incomplete* fall record stays `{ form: "pre",
  resuming: true }` and byte-identical, with its saved option intact.
- **fall → spring** — fall stays the only eligible form.

**Retry:** school row differs in `benchmark_window` and nothing else;
eligibility becomes exactly `pre: true, post: false`; **opening a window starts
nobody** (no benchmark row, all tables byte-identical); one new audit whose
detail matches the success message; other school untouched. Invalid values and a
lapsed term keep their own refusals and write nothing.

**Mutation checks, one at a time:** removing `auditedWrite` fails all four
behaviour tests *and* both guard tests; removing only the audit spec fails five;
weakening the **unchanged-offer** clause and weakening the
**no-child-moved/stopped** clause each fail the message test independently.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      810 passed (26 files)   — up from 802
build      ✓ Compiled successfully
```

### Browser

Trigger armed in place, no file swapping. Closed → Fall window open at both
widths: no error page, message readable and within the viewport, **Closed stays
selected after the rerender and a hard refresh**, page still describes check-ins
as closed, retry usable, no overflow. **Student-facing:** joined Room 12 as a
child — `/student` shows no check-in card and no check-in link, and
`/student/checkin/pre` lands back on `/student` with no actionable form. Trigger
dropped; demo verified on disk and in the running process.

### Where to push hardest

1. **`setAssignmentAction` is now the closest call left out.** It decides which
   missions a class is offered — the same kind of thing, one class at a time
   rather than school-wide. Ten configuration actions remain unwrapped, all
   additive or cosmetic single-row writes; whether that line is still in the
   right place after two sprints of moving it is worth challenging.
2. **Atomicity is not reversibility.** The switch and its record now agree, but
   an accidentally-opened window cannot be undone once a class has started
   answering. Nothing in this sprint addresses that.
3. **The student-facing browser check confirms absence, not refusal.** It shows
   no card and no route; the *endpoint* refusal is proved in the integration
   test, where the real `submitCheckInAnswer` is called as the child.
4. **Failures still write nothing**, consistent with sprints 70–74.
5. **The guard reads source text** and would miss a write reached through an
   alias or a helper.
