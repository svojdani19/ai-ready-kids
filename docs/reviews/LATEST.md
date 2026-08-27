# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 29 — an action nobody called deleted a child's badge

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-29.md`](2026-08-27-sprint-29.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  sprint 25 the educator orientation. Every body of authored content has been
  read once. **Sprints 26-29 audit what the product *permits*: a staff-side
  hole, student impersonation, the authored graph, and now the exported actions
  themselves. The inventory has found something every time it has been run.**

### What changed

1. **An exported action nobody called deleted a child's work.** The player, the
   README and several review records promise that replaying a finished mission
   records nothing — *"your badge stays, and nothing you tap now gets
   recorded"*. `replayMission` called `requirePlayableMission`, which a
   completed mission passes **by design** (sprint 27 made replay a deliberate
   exception), then `resetAttempt`, which drops the whole row: completion, path,
   evidence and the badge. If the assignment had since been withdrawn the child
   lost access to the mission too. No button called it; it was exported from a
   `"use server"` module, which makes it a public endpoint anyway. **Deleted**,
   with `resetAttempt` left in the repository for tests and for any future
   support tool — which would have to be an authorised adult operation with
   confirmation and audit.
2. **The class owner was taken on trust.** `createClassAction` read `teacherId`
   from the form and passed it through; the foreign key proves a row exists and
   nothing more. An administrator could create a class in their school owned by
   a user from **another school**, and `listClassesForTeacher` then handed that
   outsider the class on their overview — name, join code, counts, aggregate
   evidence — while `canTeachClass` denied them the class page. Contradictory
   half-access nobody would go looking for. The action was also reachable by any
   teacher, which sprint 26 half-fixed by restricting *who they could name*
   rather than *whether they could call it*.
3. **Fixed in three places**: the action is behind `requireAdmin` and resolves
   the owner (exists, `role === "teacher"`, same school); **`createClass`
   enforces the same rule** so no other caller can create a cross-school owner;
   and `listClassesForTeacher` is scoped by school as well as teacher.
4. **Found while verifying:** the admin nav still had a "→ Teacher view" link,
   which has bounced administrators straight back since sprint 26 made those
   pages teachers-only. A permission change left dead navigation behind and no
   test noticed, because no test reads navigation.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **401 tests**, Turbopack build.
- No student action may reference `resetAttempt` at all, and a completed mission
  survives a full replay and a direct write attempt with identical
  `completed_at`, path and evidence.
- Ownership covered end to end: same-school teacher succeeds; an administrator
  as owner is refused; a user from another school is refused (with a real second
  school inserted, because the foreign key was the only thing checking anything
  here); a nonexistent id is refused; a cross-school listing returns nothing.
- A wiring assertion that the action uses `requireAdmin`, not `requireStaff`,
  and validates both role and school.
- Class creation checked end to end in the browser.

### Where this is most likely still wrong

- **The inventory is still not complete.** It has now found something twice
  running. It is done when somebody has read every exported action and every
  route against what the product claims — not when the last finding is fixed.
- **An exported server action is a route**, and being unreferenced makes a
  mutation *more* suspicious, not less: nothing exercises it, no test covers it,
  and no browser check can see it. `replayMission` was invisible to every method
  used in this repository so far, and its own access check passed correctly.
- **A foreign key is not an authorization check.** Third instance of the same
  shape: sprint 26 trusted `school_id` alone, sprint 28 trusted that a student
  id and a class id belonged together, sprint 29 trusted that a user id was a
  teacher here.
- **A permission change can leave dead navigation behind**, and nothing here
  reads navigation.
- **`simulateAttempt` writes seed paths directly**, and **`enterDemo("student")`
  writes a student session directly**.
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
