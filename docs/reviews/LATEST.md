# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 28 — the authored graph was enforced by the browser

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-28.md`](2026-08-27-sprint-28.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  sprint 25 the educator orientation. Every body of authored content has been
  read once. **Sprints 26-28 audit what the product *permits*: a staff-side
  hole, student impersonation, and now the authored graph itself — which was
  being enforced by a React component.**

### What changed

1. **The authored graph was enforced by the browser.** The server checked that a
   submitted scene and choice existed *somewhere in the mission* and appended
   whatever it was handed; nothing compared the scene against the one the stored
   path leads to. `completeAttempt` took the caller's word that a mission was
   finished. So a direct caller could post the strongest option at every
   decision in any order — skipping every story beat and every authored
   correction — collect a full set of `demonstrated` evidence, mark it complete
   and take the badge. Teacher evidence and the annual report would describe a
   mission nobody played. This is the premise of every content sprint and the
   first line of the product description, and nothing checked it.
2. **The check-in had the same terminal defect.** `completeBenchmark` marked a
   form finished with **zero responses** — counting that child into the cohort
   and scoring every unanswered item incorrect — and a completed form could
   still be written to afterwards.
3. **The invariants now live in the repository, not the action.** Two pure
   functions — `expectedDecisionSceneId` and `hasReachedEnding` — and
   `recordDecision` refuses a scene that is not the expected one or any write to
   a completed attempt; `completeAttempt` refuses unless the path reaches an
   ending; `saveBenchmarkResponse` refuses a finished form; `completeBenchmark`
   requires one valid answer for every authored item.
4. **`removeStudentAction` authorised the class and deleted the student.** The
   two ids were never checked against each other, so a teacher could pass their
   own class id with any student id they knew and permanently delete that child
   — from a colleague's class or another school — while the audit named the
   wrong class. `deleteStudentFromClass` is scoped by both ids and returns
   whether a row went; the action refuses a mismatch **before** the audit.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **393 tests**, Turbopack build.
- Twelve new tests assert the attack rather than its absence: posting every
  strong choice in reverse accepts at most one and then refuses to complete;
  finishing from the opening scene is refused; empty and partial check-ins are
  refused; a completed check-in locks against revision.
- Delete tests: same-class succeeds, a colleague's student is refused with
  nothing changed, an unknown id reports failure, and the action's body must
  check `removed` before `recordAudit`.
- **Six existing tests failed when the invariants landed and were rewritten to
  walk the mission, not loosened.** There are `playTo` and `playToEnd` helpers
  now. One — "keeps demonstrated sticky once earned unaided elsewhere" — had
  been posting the same choice at the same scene twice, so the claim in its name
  is tested for the first time.

### Where this is most likely still wrong

- **A test that constructs an impossible state proves nothing.** Six here had
  been green for twenty-eight sprints while fabricating attempts no child could
  make. The fabrication *was* the missing rule, written down and passing. When
  an invariant lands and tests go red, ask first whether they described
  something a user could actually do.
- **Existence is not sequence**, the sibling of sprint 27's *existence is not
  entitlement*. Every check asked whether a thing was real; none asked whether
  it was next.
- **No route audit is complete.** Three sprints have each found what they were
  pointed at. **Nobody has enumerated every route and action and asked, for
  each, what it checks and what it acts on.** That enumeration is the obvious
  next piece of work and it has not been done.
- **`simulateAttempt` in the seed still writes paths directly**, bypassing
  `recordDecision`. Demo data only, and it means seeded paths are not themselves
  proof of anything.
- **`enterDemo("student")` still writes a student session directly** — sprint 27.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Marketing prose is still mostly untested** — sprint 26.
- **Every mission has been read once. None has been read twice.**
- **Nothing checks what a wrong answer costs a child** — sprint 20.
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
