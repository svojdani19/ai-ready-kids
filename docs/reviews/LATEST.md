# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 26 — the privacy promise had no code behind it

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-26.md`](2026-08-27-sprint-26.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  sprint 25 the educator orientation. Every body of authored content has been
  read once. **Sprint 26 is the first pass over what the product *permits*, and
  it found a live authorization hole.**

### What changed

Not a copy defect. A live authorization hole, and the most serious thing found
in this repository.

1. **Two routes took an administrator to a named roster.** The product says an
   administrator sees aggregate figures only and that a teacher sees their own
   roster. Neither was enforced: `requireStaff` accepts both roles, and every
   teacher page and action checked only `school_id`. The class name on
   `/admin/classes` linked into `/teacher/class/[classId]`, and the teacher
   overview had an explicit branch handing an administrator **every class in
   the school** with an Open class button. That page renders each child's name
   beside their individual per-skill evidence.
2. **Any teacher with another class's id could read and mutate it.**
   `requireOwnClass` — the guard on adding students, removing students and
   changing assignments — allowed any staff member in the school. A guessable
   URL and three callable server actions. This is the worse half: a link is not
   a permission model.
3. **The rule is now a pure function**, `canTeachClass` in
   `src/lib/auth/access.ts`: same school, role teacher, teacher of record.
   Administrators are excluded **explicitly rather than by not being linked** —
   a role check in one page loader is not a promise. `requireTeacher` redirects
   administrators off both roster-bearing pages, the teacher overview lists only
   own classes, the admin link is gone, and `createClassAction` no longer lets a
   teacher create a class assigned to a colleague. What an administrator may do
   with a class lives in a separate `canAdministerClass` that cannot express
   access to a roster or to evidence.
4. **The District plan sold three things that do not exist.** Roster sync via
   Clever or ClassLink, district rollup reporting and single sign-on are all
   deliberately deferred per the README. They moved out of the feature list into
   a dashed "Not in this build" block, the plan selector says *"Choosing
   District does not enable anything"*, and two more future-tense claims — class
   codes "replaced by roster sync and SSO in a district deployment", on the
   class page and the privacy page — now say neither is built.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **364 tests**, Turbopack build.
- Seven assertions on the rule itself, as a pure function: owner in, colleague
  out, **administrator out**, other school out, missing class refused, no role
  both administers and teaches.
- Three that guard the wiring, because the rule existing is not the same as
  every path using it: `/admin/classes` must not contain `/teacher/class/`;
  both roster pages must call `requireTeacher()` and not `requireStaff()`; each
  mutating action must go through `requireOwnClass`, whose check must be
  `canTeachClass` and must not be the old `school_id` comparison.
- Verified in the running app: as administrator, `/teacher/class/cls_room12`
  redirects to the school overview. As Ms. Okafor, a colleague's `cls_room4`
  returns 404 and her own class renders normally.
- No student fields added.

### Where this is most likely still wrong

- **Only the class-scoped surfaces were audited.** Classroom Mode, the mission
  library and the orientation are staff-level by design and show no student
  data, but nobody has walked every route asking who may reach it. Twenty-five
  sprints looked at what the product says and teaches; this was the first to
  look at what it permits, and it stopped at the routes the finding named.
- **Applying "a promise is a test case" to one promise is not applying it to
  the promises.** Sprint 23 asserted the suppression thresholds and left the
  sentence beside them — administrators see aggregates only — with nothing
  behind it. When a page makes several claims, enumerate them.
- **Access control had been tested as "same school" throughout**, which is a
  fact about the schema. Nothing asked what a *role* may do, because roles had
  never been the unit of the question.
- **Marketing prose is still mostly untested.** Three claims now have tests.
  A claim without a test is a claim nobody has checked.
- **The instrument still cannot support growth or transfer claims** — sprint 24.
- **The orientation is ungated by design** — sprint 25, and reopening it
  reopens the naming.
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
