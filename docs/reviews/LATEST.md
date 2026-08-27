# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 31 — the dashboard invented a history, and June was impossible

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-31.md`](2026-08-27-sprint-31.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  sprint 25 the educator orientation. Every body of authored content has been
  read once. Sprints 26-30 audit what the product permits and promises.
  **Sprint 31 closes the "wrong-answer cost" item open since sprint 20, and
  fixes the first workflow defect found here: a teacher who owned a class could
  not be offboarded without deleting a child's records.**

### What changed

1. **The student page invented a history.** It said of every skill in the second
   list *"You worked these out after a Try again"*. `developing` also arrives
   **directly from first-go partial choices that continue with no retry at all**
   — "Lean over and ask Theo", "Type your school name, but not your street" — so
   a child who made a thoughtful partly-safe choice was told they had needed
   correcting. It now describes the state and never the route: **"You made a
   good start on these. Each one moves up when you get it first go in a new
   story."** The empty state was false in the same direction and now points at
   the badge the child did earn.
2. **The teacher's legend was already right**, which is the striking part: *"a
   partly-right choice, or the safe answer reached after a Try again"*. Only the
   child was told the invented version. The audit found one more in the school
   report, which named only the retry route; it names both now.
3. **A teacher who owned a class could not be offboarded.** `removeStaffAction`
   refused and said to "reassign or archive it first" — there was no reassign,
   and the count included archived classes so archiving did not clear it either.
   The only ways out were deleting every class they had ever owned, rosters and
   records included, or leaving the account live, which in a build where staff
   sign in with a known email and no password keeps a former employee's roster
   access.
4. **`reassignClass` moves a class and keeps everything else** — roster,
   attempts, check-ins, assignments and **the join code**, so no child is told a
   new one because an adult left. Same ownership invariant as `createClass`, so
   nothing can become ownerless or cross-school by being moved. Administrator-
   only action, per-row control on the classes page, and the offboarding block
   now **names** the blocking classes with advice that is true.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **428 tests**, Turbopack build.
- The evidence tests prove the old sentence was **false** rather than asserting
  the new one is nicer: a walk taking a first-go partial, checking the path has
  exactly one step at that scene — no retry — while the record reads
  `developing`. Plus copy assertions on all three surfaces, including that the
  teacher legend stays accurate.
- Offboarding: a move keeps the join code and roster, the old owner loses
  `canTeachClass` and the new owner gains it, an **archived** class moves, an
  administrator and a nonexistent user are both refused with the owner
  unchanged, a missing class is refused, and a teacher becomes removable once
  their classes have moved **with the child's records still there**.
- Verified in the app: Room 4 moved from Danny Whitfield to Lucas Brennan with
  the same code, 21 students and 9 assignments; the dropdown excludes the
  current owner.

### Where this is most likely still wrong

- **An open item phrased as a general worry does not get closed.** "Nothing
  checks what a wrong answer costs a child" sat in this handoff for eleven
  sprints. It was never going to be closed by auditing the model — the model,
  the roll-up and the teacher legend were all correct — because the defect was
  one sentence on the page a child reads. Somebody had to read the actual
  sentence against the actual data paths.
- **This was the first workflow defect found here.** Thirty sprints asked
  whether the product is honest and whether it is safe. None asked whether it is
  *usable* on an ordinary Tuesday in June. Walk the routine operations —
  somebody leaves, somebody arrives, a class changes hands.
- **Bulk reassignment does not exist.** One class at a time, each confirmed,
  which is the right default for an operation that changes who can see
  children's names — but a teacher with four classes takes four moves.
- **The route and action inventory is still not complete.**
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30, stated in the README.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Marketing prose is still mostly untested** — sprint 26.
- **Every mission has been read once. None has been read twice.**
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children** — and
  sprint 31 rewrote it, so that is now more true rather than less.

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
