# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 81 — an annual subscription that granted perpetual use

- **Reviewed against:** HEAD `834632d`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-30-sprint-81.md`](2026-08-30-sprint-81.md)

### The finding

Sprint 49's subscription gate refuses classroom **writes** after the term ends,
and that was treated as the whole of enforcement. Every authored teaching route
asked only `requireStaff`, so a signed-in teacher at a school whose term ended a
year ago could still open the mission library, read every branch of all 27
missions, print the discussion guides, run Classroom Mode on a projector and take
the educator orientation — all of which the plans page sells **per year**.

**Classroom Mode is what makes this more than an oversight.** It records nothing,
so no write ever happens and the write gate never fires. The product's primary
use in front of a class ran indefinitely on one year's fee. An annual
subscription that grants perpetual use of the thing it sells is not an annual
subscription.

Found while reading those routes: **`/teacher/guides/[slug]` had no
authentication call of its own at all**, relying entirely on the teacher layout's
`requireStaff` — a redirect in a sibling component rather than a check on its own
data path. Never exploitable; not what the other eight pages do.

### The correction

One resolver, `requireOpenCurriculum`, called first in six page components. It
authenticates before anything else — a signed-out visitor never learns whether
the school exists, let alone whether it has paid — then applies the same
`instructionClosed` rule the write gate uses, failing closed on both non-active
states and on a staff row whose school cannot be read at all.

It returns a result rather than redirecting, so the page keeps its URL and a
renewal or a date correction puts the teacher back on the page they were on. Six
routes gated: mission library, mission detail, printable guides, Classroom Mode,
orientation, and "how to run a session" — the last not in the finding's list, and
gated because it is the same kind of authored content.

**The boundary is ownership, not leverage.** Open and untouched: the teacher and
administrator dashboards, class history, reports, exports, retention, deletion,
staff administration, sign-out, and **an orientation certificate already earned** —
that last deliberately, because it is the reader's and not the vendor's. Both
refusal messages say in those words that renewing is never a condition for
reaching the school's own records.

The two states never borrow each other's claim: `lapsed` says a term ended and
offers renewal; `needs-configuration` says outright *"This is not an expiry"* and
asks for the dates to be corrected. Recovery is role-appropriate — an
administrator gets `/admin/program`, a teacher gets a person rather than a link
that would bounce them — and a route back to the reader's own dashboard is always
there. Child-facing copy is untouched.

### Where I did not do what was asked

**Family take-homes are not gated.** `/family/[slug]` takes no session at all: 33
statically prerendered pages, linked from the public demo, whose own file comment
says *"Public by design: no account, no login."* Gating it for a signed-in teacher
would block one reader of a page the whole internet can fetch, be defeated by a
private window, and turn 33 static pages dynamic to do it. That is the appearance
of an entitlement boundary, not one. If family sheets are meant to be paid
content, the change is that they stop being public — a product decision with a
real cost to caregivers. Recorded as the first known gap rather than quietly
satisfied.

### Acceptance

`tests/instruction-entitlement.test.ts`, 40 tests, running the **real page
components** with a real signed session. Two mechanisms carry the claim: the tree
is actually **rendered** (a page returning `<CurriculumClosed/>` returns a
function that has not run — an unrendered walk would pass just as happily if the
page had returned the whole mission library), and **props are read, not just
children** (`ClassroomPage` passes the entire authored mission as a prop, which a
children-only walk cannot see).

Six routes × two closed states each prove their own reason's panel, never the
other's title, and none of six distinctive authored strings read from the content
modules. Plus: the boundary day, signed-out redirect before disclosure,
role-appropriate recovery, records staying open, reopening in the same request,
no billing language in the mission player, and no second live region.

**Mutation-checked four ways, one at a time:** removing the Classroom Mode gate
fails exactly 2; treating `needs-configuration` as open fails 10; letting it
borrow the lapsed copy fails 8; adding a new ungated `/teacher/new-thing`
page fails 2, naming the file.

The inventory enumerates every `page.tsx` under `/teacher` **from disk** — each
gated or listed in `OPEN_BY_DESIGN` with its reason, never both, every exemption
still authenticating, and the gate required before the component's first `return`.

### Evidence

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      912 passed (32 files)
build      ✓ Compiled successfully
```

Browser, both widths and both states plus recovery. **1280×800 lapsed:** all six
protected routes fetched in one pass, each 200 with the panel and no authored
content; seven record-owning routes in the same pass, none blocked. **1280×800
needs-configuration:** the unverified title, *"This is not an expiry"*, one `h1`
and **one** live region; administrator and teacher recovery each verified.
**768×1024:** both states on library and guide, `overflow: false`. **Recovery:**
with the original dates back, the guide and library render in full at both widths
with no restart or reseed.

**Demo data restored exactly** — term dates compared byte-for-byte against the
values recorded before the first change; attempts 1078, students 90, classes 4,
audit log 6, benchmarks 129, assignments 65, and zero rows dated today anywhere,
checked by sweeping every `*_at` column of every table.

### Where to push hardest

1. **Family take-homes**, above. Settle whether they are paid content before
   anything else here.
2. **The gate is per-page, six times over** — the same shape as the `archived_at`
   checks sprints 76 and 79 added one at a time, and the same objection: an
   intent-aware resolver would be durable. The inventory test stands in for it,
   and a test is not a mechanism.
3. **The inventory only walks `/teacher`.** `/admin` is exempt wholesale on the
   reasoning that it holds no curriculum — true today, an assumption, not an
   invariant.
4. **A page-level test that forgets `globalThis.__airkDb = db` reads the
   developer's real `data/` directory.** The first run of this suite did exactly
   that. It only read, and the counts confirm it, but a test that mutated would
   have written to real demo data, and nothing in the harness prevents it.

---

## Sprint 80 — session one taught a definition session two contradicts

- **Reviewed against:** HEAD `f1532f6`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-30-sprint-80.md`](2026-08-30-sprint-80.md)

### The finding

First Look session one told a class that has never been told what AI is:
*"AI is a computer program that fills in what usually comes next."* That sentence
sat in the big idea, a learning goal, the board narration, the wrap-up, the
family summary and the family rule — six places. Session two, a week later,
correctly calls a video recommendation, a face filter and a smart speaker AI.
None of them fills in a word.

To a six year old that is a contradiction, and what survives it is **AI =
autocomplete** — a category every later mission then builds on and none of them
fits. The example was never the problem; a next-word predictor is the right first
encounter. The defect is that an example was given the grammar of a definition.

### The correction

Category first, example second, everywhere: *"An AI program finds patterns in
lots and lots of examples and uses them to make a guess. This one guesses a
word."* The board, the wrap-up cards, the family rule and the three learning
goals all now separate what generalises from what was met. Session two says
outright that it *"guesses more than just words"* and adds *"One guesses a word.
One guesses what you will like. One guesses where your face is."*; its callback
changed from *"the same trick from last time"* to *"Guessing words is one kind of
guess."*

**The widened category needed a floor**, so a new misconception answers *"So
everything on a screen is AI"* by contrasting a calculator following a written
rule with a guessing machine working from patterns — *"Fast is not the test;
guessing from examples is."* The upper track's *"An AI tool produces what usually
follows"* was scoped the same way, as were the foundations overview and the
educator orientation, which asserted the narrow version **to teachers**.

One line was left deliberately: the choice label *"Mat, because that is what
usually comes next"* is a child predicting one word, not defining a category.

### Acceptance

`tests/first-look-concept.test.ts`, 13 tests, flattening everything a child hears
and everything an adult reads so a categorical definition cannot hide in a corner
nobody asserted on: an `it.each` over all six sessions in both tiers; the example
still teaching patterns, "likely", the limit and no personal knowledge; session
two reading as expansion; the not-everything-is-AI guard; the upper-track
scoping; both adult surfaces. **Mutation-checked twice** — restoring the old big
idea fails 2 tests, deleting session two's expansion line fails 1.

### The guardrails caught me three times

My first draft broke the grades 1–2 rules the repo already enforces: a 16-word
sentence against the cap of 14, and two 3-sentence narration paragraphs against
the cap of 2. Lint caught `const module = …` in the new test. Writing a more
accurate sentence made it a harder sentence, and the age caps are the reason the
result is still readable to a six year old.

### Evidence

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      872 passed (31 files)
build      ✓ Compiled successfully
```

Browser, both widths, driven rather than inferred: **1280×800** and **768×1024**
both render the corrected copy with `overflow: false`, and Classroom Mode was
stepped through part by part — part 3, part 5 and **part 7's board line and all
four wrap-up cards** — plus session two's expansion list. **Demo data restored
exactly:** the one incomplete attempt row my student-side check created was the
only row dated today anywhere in the database (checked by sweeping every `*_at`
column of every table) and was deleted; attempts back to 1078, audit log 6.

### Where to push hardest

1. **Nothing stops the next categorical sentence.** The tests pin four phrasings
   that exist; a fifth, worded differently, passes. A mechanical rule requiring
   the category before any example — the way the word and sentence caps already
   work — would be durable. This is a denylist.
2. **The 27 core missions were not audited for this.** They assume the category
   rather than defining it, which is why they were out of scope — but "assume"
   is exactly the state First Look was invented to fix.
3. **Session three was read, not swept.** It carries no definition, but the
   sweep was driven by the two sessions the finding named.
4. **No child has read any of this.** The claim that a more accurate sentence is
   still age-appropriate rests on a word cap, not a classroom.

---

## Sprint 79 — a parked class could still lose a child permanently

- **Reviewed against:** HEAD `39878a5`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-30-sprint-79.md`](2026-08-30-sprint-79.md)

### The finding

`removeStudentAction` accepted an archived class: `requireOwnActiveClass` checks
ownership and the subscription term, never `archived_at`. A teacher calling the
exported action from a stale tab or a direct request could **permanently delete
one child** out of a parked cohort, cascading to every attempt, check-in and
badge. That contradicts the archive promise, the retention schedule and the
administrator-deletion path at once, and it is invisible — nobody is looking at a
parked class, so a school's history and exports quietly stop matching the year
they describe. This is the destructive member of the group named at the end of
sprint 76.

### The correction

After the owned, active-term class resolves and **before** `auditedWrite`: refuse
with *"That class is archived. Restore the class before removing a student from
it."* `requireOwnActiveClass` is not widened, and rename and rotate semantics are
untouched.

### Acceptance

Three tests through the real exported action with a real teacher session:
refusal leaves the class, the child, the roster, **their attempts and check-ins**,
all attempts, all benchmarks and every audit row byte-identical with zero
`roster.removed`; with a `roster.removed` trigger **armed** the archived message
still wins, proving the refusal is above the transaction; and after
`restoreClass` the same removal succeeds with its existing atomic cascade and
exactly one audit. Badges and skill evidence live in the attempt rows, which are
covered. Removing the refusal fails all three, and moving it inside
`auditedWrite` also fails all three.

### The gate was unreliable, and this is what it was

Twice I called intermittent failures "contention"; once I raised the timeout on
an unverified inference and withdrew it. This time I captured the error first —
`Error: Test timed out in 5000ms` — on tests that are a few synchronous
`createStudent` calls and cannot race. Then tested each hypothesis:

- dev server competing → stopped it: **worse**, 4 of 5 runs failed
- fork oversubscription → `maxForks: 4`: **no help**, 5 of 5 failed
- machine overload → load 3.9 on 8 cores, not enough
- fixture cost → measured: open 6ms, seed 130ms, not it
- **fsync stalls** → `PRAGMA synchronous = OFF` on throwaway test databases:
  **10 of 10 clean**

The schema uses WAL, which fsyncs every commit, and this suite commits
constantly. A test database is deleted moments after creation, so durability is
all that is given up; every transaction, lock and rollback behaves as in
production. **No timeout was raised and no production code touched** — the 5s
default stands, so a real hang still fails.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      859 passed (30 files) × 10 consecutive runs at the default 5s timeout
build      ✓ Compiled successfully
```

No browser rerun: no rendered UI changed.

### Where to push hardest

1. **`renameStudentAction` and `rotateJoinCodeAction` still accept an archived
   class.** Neither destroys anything, which is why they are not here — but
   neither has been audited for the parked-then-restored reasoning.
2. **The refusal is per-action for the third time.** A resolver that took the
   caller's intent — read, reversible write, destructive write — would be the
   durable shape. That is a refactor, not a correction, and it should be someone's
   deliberate decision rather than my drift.
3. **I have been quoting green gates from lucky runs.** The suite was failing
   roughly 70% of full runs before this sprint and I reported "856 passed" from
   the runs that happened to pass. The number was true and the impression it gave
   was not.
4. **The fixture is still expensive.** fsync removal bought margin, not
   cheapness; each fixture still seeds a whole demo school.

---

## Sprint 78 — a persisted identifier is data, not prose

- **Reviewed against:** HEAD `49363a1`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-30-sprint-78.md`](2026-08-30-sprint-78.md)

### The finding

The American-English conversion in commit `6c6bfb7` swept four **stored machine
identifiers** along with the prose: `class.restore_blocked_by_licence`, its
`_config` variant, `roster.blocked_by_licence` and its `_config` variant all
became `_license`. Those values live in `audit_log.action` in a school's own
database, so an existing database keeps the old spelling while new events use
the new one — one event type, two taxonomies, nothing recording why.

I noticed the risk and shipped it anyway, reasoning that the UI does not query
by action name. That was wrong: not querying it today is a property of the
current feature set, not of the data. An export, a migration, a support query or
any later reporting feature would see both.

### The correction

All four restored, 18 occurrences across five files plus one stale comment. **The
prose beside them stays American** — that split is the point: the key is data,
the sentence a school reads is prose. No rendered message, detail or label
changed, and neither the broader copy conversion nor the in-memory TypeScript
renames were reverted.

### Compatibility: nothing to reconcile, nothing rewritten

Schema, migrations and seed reference `blocked_by_lic` **not at all**, so no
migration was needed. The demo database holds `benchmark.opened` ×2,
`class.created`, `program.activated`, `report.exported`, `retention.updated` —
**zero** rows matching `_license`, **zero** matching `_licence`. No history
existed to preserve and none was touched; had a `_license` row existed it would
have been left in place and documented, not deleted.

### Coverage

`tests/audit-event-keys.test.ts`, 10 tests, driven **through the real refusal
paths** rather than source text — a source assertion would still pass if the
value were rewritten on the way to the database. `addStudentAction` covers both
roster keys (over-license and malformed-license), `restoreClassAction` covers the
class key; the two class keys already had real-path coverage in
`audited-writes.test.ts`, the roster keys had source-text only.

**Mutation-checked one key at a time:** re-normalizing each single `action:`
value fails 2–3 tests and no others.

### The voice sprint's timeout change is withdrawn

`49363a1` raised `testTimeout` to 20s on my claim that three intermittent
failures were timeouts. **I never saw the error text** — I inferred it from
durations of 5.0–5.4s. Tested this sprint at the original 5s: four consecutive
clean runs idle, and two full suites run **concurrently** (the load present when
it first appeared) both clean at 846/846. Could not reproduce, so the increase is
unjustified and is reverted. A 4× global timeout on an unproven hypothesis is how
a real race gets masked.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      856 passed (30 files) × 3 consecutive runs at the default 5s timeout
build      ✓ Compiled successfully
```

No browser pass: no rendered copy changed. Sprint 76's browser evidence stands.
Also fixed the duplicated `## Browser## Browser` heading in the Sprint 76 review
and `### Browser### Browser` here.

### Where to push hardest

1. **The rule is a test, not a mechanism.** Nothing stops a future action
   inventing a fifth key spelled however it likes. A stored-key registry the
   actions had to draw from would be durable; this pins the four that exist.
2. **No other stored identifier is pinned.** A dozen other `audit_log.action`
   values — `class.archived`, `year.dates_set`, `data.deleted` — have no
   protection from the same kind of sweep. They survived that conversion only by
   containing no British spelling.
3. **I shipped this knowing the risk.** The commit message for `6c6bfb7` names
   the split explicitly and ships anyway. Worth asking why I recorded the concern
   rather than acting on it, because the reasoning that let it through — "nothing
   queries it" — will look equally plausible next time.
4. **The suite still runs close to its 5s default**, ~2.7s for the heaviest
   fixture. Unproven as a cause of anything; the fix if it recurs is cheaper
   fixtures, not a wider ceiling.

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

### Browser

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
