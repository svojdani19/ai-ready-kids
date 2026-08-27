# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 35 — P1: the help note that told an administrator to delete a class

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-35.md`](2026-08-27-sprint-35.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer,
  sprint 25 the educator orientation. Every body of authored content has been
  read once. Sprints 26-30 audit what the product permits and promises, 31-32
  walk ordinary school workflows, 33-34 build the migration path and the gate in
  front of it. **Sprint 35 removes an instruction that would have destroyed
  children's records to do a job sprint 30 had already made safe.**

### What changed

1. **The admin Classes page told administrators that a code "can be regenerated
   by deleting and recreating a class".** False since sprint 30, which gave the
   teacher of record a **New code** control that rotates the code, invalidates
   outstanding join grants immediately and keeps everything else. The README
   documented it correctly; this page had never been updated. The sentence sat
   on the same page as **Delete data**, which permanently removes the roster,
   every attempt, the evidence, the badges and both check-ins — so the product's
   written instruction, given to the one role holding the delete button, was to
   erase children's records to perform a routine security task. Codes for
   seven-to-ten-year-olds get projected and read aloud; needing a new one is a
   Tuesday, not an incident.
2. **Administrators can now rotate a code from the Classes page.**
   `rotateJoinCodeAsAdminAction` reuses the same `rotateJoinCode` repository
   function as the teacher control, so the same generator and the same
   grant-invalidating behaviour, scoped through the existing `ownClass` guard.
   A class credential is class configuration, not a child's record, so this is
   inside the role as sprint 26 drew it.
3. **`ownClass` now delegates to `canAdministerClass`** instead of repeating the
   school comparison inline. One rule, written once.
4. **The control sits in the Code column**, beside the code it replaces, because
   that cell is where the new one appears and distributing it is the next thing
   the administrator does. Its confirmation names what stops and then what does
   not — "the class, its teacher, the roster, assignments, mission history,
   badges and both check-ins are not touched" — because the control immediately
   to its right destroys every item in that list.
5. **Audited as `class.code_rotated`, naming the class and no child.** The note
   at the foot of the page is rewritten to point at **New code** and to say
   plainly that deleting a class is never the way to change its code.

### Already verified — please do not redo

- Typecheck, lint, **461 tests** (up from 456), Turbopack production build.
- A repository-wide grep for delete-and-recreate advice returns nothing outside
  this directory's own history and one code comment.
- Rotation changes the join code **and nothing else**: the class row is compared
  field by field rather than spot-checked, and the roster, assignments, every
  attempt row and every benchmark row are compared whole, after a mission is
  played to completion so there is something to preserve. Badges are derived
  from completed attempts rather than stored, so an intact attempt row is what
  keeps a child's badge.
- A grant issued against the old code is valid before the rotation and no longer
  matches the class's code after it. A cross-school administrator is refused,
  and a teacher at this school is not made an administrator by this rule.
- The action goes through `ownClass`, reaches no roster, and `ownClass` goes
  through `canAdministerClass`. The page no longer carries the stale advice.
- **Live on the dev server:** Room 12 rotated through the UI from
  `MAPLE-HERON-317` to `VELVET-OCTOPUS-101`; 23 students, 366 attempts, 43
  benchmarks and 18 assignments unchanged, other classes untouched, audit row
  naming the class only. The retired code was then refused at `/join` with the
  ordinary "That code did not match a class", and the new code reached Room 12's
  find-your-name page with all 23 names.
- **No curriculum change, no student field, no new administrator access to a
  named roster.** The sprint-26 test that keeps the Classes page from linking
  into the teacher class page still passes.

### Where this is most likely still wrong

- **Prose goes stale silently.** Adding a safe way to do something does not
  remove the old advice about doing it the unsafe way, and no test fails when it
  lingers. Sprint 30 updated the README and the teacher page and missed the one
  surface where following the stale advice was worst. Two of the five new tests
  are string assertions against page copy, which is a blunt instrument; most
  marketing and help prose is still untested.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings** that
  predate this sprint and are unrelated to it. Left for a sprint whose scope
  includes that file.
- **`/join`'s placeholder is the literal `MAPLE-HERON-317`**, now a retired code
  in the demo data. It illustrates the shape of a code rather than naming a live
  one, so it was left alone.
- **Only one previous schema shape is recognised** — sprint 34. **No
  down-migrations.**
- **Rollover is one school at a time**, and bulk reassignment does not exist.
- **The route and action inventory is still not complete.**
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Every mission has been read once. None has been read twice.**
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
