# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 51 — correction to sprint 50: a cookie write in a Server Component

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-49.md`](2026-08-28-sprint-49.md), sprint 51
  section.

### The defect

`src/app/join/[classId]/page.tsx` is a Server Component and its lapsed branch
called `await clearJoinGrant()` → `cookies().delete()`. **Next 16.3.3 refuses a
cookie write outside a Server Action or Route Handler**, so a child who simply
**refreshed or revisited** the roster after their school lapsed got a 500
instead of the sentence written for them.

**Reproduced before fixing:** a plain GET with a valid grant rendered *"This page
couldn't load"* with `ERROR 2891558010@E1180`, and the dev server logged the
matching digest at `clearJoinGrant (session.ts:98)` from `ChooseStudentPage
(join/[classId]/page.tsx:42)`.

**Why my check missed it:** I walked pressing a name — a Server Action, where the
write *is* allowed — and then a roster request **after the grant was already
cleared**, so the lapsed branch never ran. The one sequence that mattered, stale
grant still held plus a plain GET, was exactly the one I did not walk.

### The fix

`src/app/join/closed/route.ts` — a Route Handler that clears the grant and
redirects to `/join?closed=1`. The page redirects there rather than writing the
cookie itself; the handler reads no state and makes no decision. `chooseStudent`
is unchanged and still clears its own grant, because a Server Action may.
**The sprint-50 restore fix is untouched.**

### Already verified — please do not redo

- Typecheck, lint, **577 tests** (up from 574), Turbopack production build, which
  lists the new route as `ƒ /join/closed`.
- Three cases added, twenty-four in the file, **four confirmed to fail against
  the sprint-50 page**. The first asserts the **property, not the symptom**: no
  cookie write of any kind in the roster Server Component — not
  `clearJoinGrant`, not `cookies()`, not a set/delete on the join cookie.
- **The previously missing sequence, at 1280×800 and again at 768×1024**, from a
  fresh grant each time: correct code while active → roster with **23 names**;
  school lapsed with the page open, **no name tapped**; direct navigation to that
  exact roster URL. Both sizes: **no error page**, landed on `/join?closed=1`,
  child message shown, **zero names**, **grant cookie gone**, no overflow.
- Then at desktop: `/student` redirected to `/join` — **no session created** —
  and `/join/cls_room12` redirected with zero names. **Audit 16 before, 16
  after**: no audit row, no throttle event.
- Demo data restored: renewal 2026-09-01, four active classes, 16 audit rows.

### Where this is most likely still wrong

- **Runtime context is not carried by the type system.** `clearJoinGrant()`
  compiles identically in a page, an action and a handler; only some of them run.
  The new test covers this one file. No general guard exists against the same
  mistake elsewhere, and the codebase has other cookie helpers
  (`writeSession`, `writeJoinGrant`, `clearSession`) that would fail the same way
  if called from a component.
- Everything under sprints 49 and 50 below still stands.

---

## Sprint 50 — correction to sprint 49: two acceptance misses

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-49.md`](2026-08-28-sprint-49.md), with the
  sprint 50 correction appended.

### 1. The second half of joining bypassed the gate

`findClassByCode` checked the term; **`chooseStudent` did not** — and my own
inventory classified it as *"resumes an existing session"*. It does not resume
one, **it creates one**, from a join grant that lasts ten minutes. A child who
typed a correct code minutes before the term ended still held a valid grant,
`/join/[classId]` still rendered the roster by name, and pressing a name wrote a
fresh session without asking again. **Checking the first step of a two-step flow
is checking half of it** — and the inventory test that existed to prevent this
was satisfied, because what it checks is a sentence I wrote and the sentence was
wrong.

- `chooseStudent` is now **gated**, reclassified with what it does.
- The term is rechecked **after** the grant, class and code validate — so a
  refusal cannot leak that a class exists — and **before any session write**. A
  test asserts that ordering by index, not merely that the call is present.
- `/join/[classId]` checks **before reading the roster**, not just before
  rendering it: a closed class does not hand out a class list.
- Both paths **clear the join grant** on refusal, so a refused child is not left
  holding a credential to retry the stale page, and redirect to `/join?closed=1`
  with the child-safe sentence. **No session, no audit row, no record that a
  child tried**, and the attempt is not fed to the code throttle — it was not a
  wrong guess.

### 2. Lapsed Restore crashed instead of refusing

`restoreClassAction` resolved the class with `ownActiveClass` **before** its try
block, so the lapse escaped as an error page while archive and rotate returned
the sentence. Those two were rewritten by wrapping the whole body; this one
already had a try for the licence refusal, so the resolver stayed above it. The
resolver is now inside an encompassing try, the `RestoreExceedsLicenceError`
handling is preserved unchanged within it, and `asExpectedError` converts the
lapse. A test asserts the try opens *before* the resolver in **all three**
actions, so the next one cannot drift.

### Already verified — please do not redo

- Typecheck, lint, **574 tests** (up from 566), Turbopack production build.
- Eight cases added, twenty-one in the file, **seven confirmed to fail against
  the sprint-49 code** — including `routes every gated action through the gate`,
  which now fails for `chooseStudent` as it should have all along.
- **Stale grant, end to end at 1280×800:** correct code while active → roster
  with 23 names; school lapsed with the page open; pressing a name landed on
  `/join?closed=1` with the child's sentence; `/student` then redirected to
  `/join` — **no session written** — and `/join/cls_room12` redirected with
  **zero names rendered**.
- **Lapsed Restore at 1280×800 and 768×1024:** no crash, refusal announced in
  the row, class still archived, focus visible, **audit count unchanged at 16
  before and after**, no overflow.
- Demo data restored: renewal 2026-09-01, four active classes, 16 audit rows.
- One new assertion tripped on its own first draft by matching the import path
  `domain/subscription` and a comment containing "renew" — sprint 44's lesson
  re-learned, so it strips comments and imports before scanning child-facing
  copy.

### Where this is most likely still wrong

- **The inventory's descriptions are hand-written and carry the safety
  property.** The test can only check that an action *is* classified, not that
  the sentence about it is true. That is what failed here, and it can fail
  again — the descriptions want reading against behaviour, not against names.
- Everything listed under sprint 49 below still stands: no grace period,
  Classroom Mode still opens for a lapsed school, the UTC boundary, and nothing
  reconciling the term against an actual agreement.

---

## Sprint 49 — P1: the term that ended and changed nothing

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-49.md`](2026-08-28-sprint-49.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers; 26–30 audit what the product permits and
  promises; 31–32 walk ordinary school workflows; 33–34 build the migration path
  and its gate; 35–41 fix teacher-facing and content defects; 42–43 make the paid
  seat count the vendor's number and enforce it at enrolment and restoration; 44
  removed the last certification overclaim; 45–48 gave the navigation, Classroom
  Mode and the shared confirmation control keyboard exits, focus recovery and an
  honest pending state. **Sprint 49 makes the subscription term itself real — a
  gap this file had carried as "documented and unbuilt" for three sprints.**

### What changed

1. **`term_renews_on` changed labels and nothing else.** Every classroom and
   student write succeeded after it, and Program & plan admitted it: *"Nothing
   switches off automatically in this build."* An entitlement that never ends is
   not an entitlement.
2. **One rule, in `src/lib/domain/subscription.ts`.** The school is active
   **through** the renewal date and lapsed on the next calendar day, matching the
   product's own wording. Date-only: `YYYY-MM-DD` compared as strings, `now`
   injected everywhere and reduced to its **UTC** calendar date, because a
   deployment that lapses at a different moment depending on the host's `TZ` is a
   bug nobody can reproduce. An empty renewal date never lapses a school.
3. **Enforced on the shared resolvers**, not in the pages that render the
   buttons — `requirePlayableMission`, `requireOpenCheckIn`,
   `requireOwnActiveClass`, `ownActiveClass`. One door, so a stale tab or a
   direct server-action call cannot write. Ownership and term stay separate
   questions: a teacher's own class is still theirs, and they still cannot change
   it.
4. **Blocked**: mission start/resume/record, check-in answers and completion,
   joining by class code, class creation and lifecycle, roster changes, code
   rotation, assignment changes, check-in windows, year rollover.
5. **Open, deliberately**: read-only pages, the annual report and all three
   exports, the renewal request, sign-out, school profile, staff administration,
   retention settings, the academic dates retention is calculated from,
   deliberate deletion, and the orientation. **A school still owns its records.**
6. **Expected errors, not crashes.** The gate throws — a shared resolver can,
   without every caller remembering — and the actions that render a result catch
   it and return `{ error }`. Seven actions moved from `void` to
   `{ error?: string }`; `AssignToggle` also **reverts its optimistic switch**,
   since a toggle left flipped after a refusal says a mission is assigned when it
   is not.
7. **Visible before effort is wasted.** Staff get one `role="status"` notice in
   the shared shell — a standing condition, not an emergency — naming what is
   paused, what remains, and where to renew. Children get *"Your class isn't open
   right now. Ask your teacher."* and nothing about money. **No control lies**:
   the student home drops "Up next" and the check-in, and mission tiles render as
   tiles rather than links. The false admission is replaced.

### Already verified — please do not redo

- Typecheck, lint, **566 tests** (up from 553), Turbopack production build.
- Thirteen new cases with **no clock** — every date injected: active on 31 Aug
  and on the renewal day, lapsed on 2 Sep, 23:59:59 active and 00:00:00 next day
  not; empty date never lapses; each school measured against its own term.
- **Zero writes on refusal**, proved by snapshotting every table and comparing
  after two refused attempts. No audit row, no flag, no counter — a refusal is
  not an event about a child.
- **The action inventory test**: every exported action across all four action
  files must appear in the gated or allowed map with a written reason, failing on
  an unclassified action *and* on a classified one that no longer exists; then
  each gated body must reach a guard and each allowed one must not. **A new
  mutation cannot silently bypass the gate.**
- Two existing ownership tests now accept the gated resolver names **and
  additionally assert the gated variant delegates to the ownership one**, so the
  looser regex cannot be met by a helper that skipped the check.
- **Browser-checked at 1280×800 and 768×1024** with the demo school lapsed: the
  notice with a working renewal link and no overflow; code rotation and archiving
  returning **expected refusals, not error pages**, with the database unchanged
  and **no audit row written**; a **correct** class code refused at `/join` with
  the child's sentence; a session opened before the lapse still signed in with 16
  badges, every finished mission readable, **zero links into the player**; the
  annual report with Print/CSV/JSON all present and the **renewal request
  succeeding**. Demo data restored.
- **Niche and privacy boundary unchanged**: authored grades 2–4 practice, no
  chatbot, no child free text, no new student fields, no telemetry, no risk
  scoring, aggregate-only admin reporting. **No schema change.**

### Where this is most likely still wrong — best places to push

- **No grace period or warning before the date.** The transition is a cliff on
  one morning; a real deployment would want "renews in 14 days" escalating in the
  shell. That is a product decision about tone, not a mechanism.
- **A lapsed school's teachers can still open Classroom Mode**, which records
  nothing by design so it is not a write. Arguably correct — teaching from a plan
  already bought — but it is a judgement call worth a second opinion.
- **Nothing reconciles the term against an actual agreement** — sprint 42.
  Renewal is a vendor edit to the row.
- **The UTC boundary** can sit a few hours off a school's local midnight. Fixing
  it properly needs a school timezone, which is a new field and was out of scope.
- **The overlay pattern still has candidates**: the student mission player's
  full-screen states and the read-aloud control — sprints 45–48.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **The certification guard is a word list on a file list** — sprint 44.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings**,
  unrelated to this work.
- **Only one previous schema shape is recognised** — sprint 34. No
  down-migrations.
- **The route and action inventory is now complete for the lapse gate**, but not
  for authorization generally.
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Every mission has been read once. None has been read twice.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
