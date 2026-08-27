# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 27 — the class code protected nothing

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-27.md`](2026-08-27-sprint-27.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  sprint 25 the educator orientation. Every body of authored content has been
  read once. **Sprints 26 and 27 audit what the product *permits*. Sprint 26
  found a staff-side hole; sprint 27 found student impersonation, which is
  worse.**

### What changed

1. **The class code protected nothing.** `findClassByCode` validated the code
   and threw it away. `/join/[classId]` rendered every child's name and avatar
   to anyone holding a class id, and **`chooseStudent` took any student id in
   the database and wrote that child's session** — no grant, and no check that
   the student was even in the class whose roster had been shown. A direct URL
   listed a school's children; a direct action call logged in as any of them.
2. **Entering the code now writes a signed, expiring, class-bound grant**,
   reusing the session HMAC. Ten minutes, `httpOnly`, its own cookie.
   `/join/[classId]` refuses unless the grant names that exact class.
   `chooseStudent` verifies the grant itself rather than trusting the page that
   rendered the buttons — grant present, student in that class, class not
   archived — and **spends the grant** before writing the session.
3. **Mission and check-in availability were UI, not rules.** The play page and
   all four mission actions accepted any shipped slug, so an unassigned mission
   could be opened by URL and real evidence recorded into it. Worse:
   `nextBenchmarkFor` offered the spring form **the moment the fall one was
   completed**, with no window state and no date anywhere, while the admin
   pages, plans page and report all called them fall and spring windows. A
   child could take both back to back and the report presented the difference
   as a year's change.
4. **Both are rules now**, in `src/lib/domain/eligibility.ts`, shared by page
   loaders and actions. `missionAccessFor` returns assigned / replay / denied,
   with replay a **documented exception** so withdrawing an assignment does not
   delete access to completed work. `canTakeBenchmark` opens a form only when
   the school's window names it and it is unfinished. **The window is real
   state**: `schools.benchmark_window` is `closed | pre | post`, default closed,
   with an administrator control and an audit entry. The old window-blind
   `nextBenchmarkFor` is deleted, not deprecated.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **381 tests**, Turbopack build.
- The grant is asserted at the token layer beside the session tamper cases:
  round-trip, wrong key, **class swapped after signing**, expiry at the boundary
  both ways, session-token-as-grant and the reverse, malformed input.
- The eligibility rules are asserted directly, including the one that was the
  whole defect: `canTakeBenchmark({ window: "pre", form: "post" })` is false and
  `nextBenchmarkFor(finishedPre, "pre")` is null.
- Wiring assertions: both join surfaces read the grant, `chooseStudent` checks
  `class_id` and spends it, both student pages call the rules, and **each of the
  six student actions goes through `requirePlayableMission` or
  `requireOpenCheckIn`**.
- Verified in the app: `/join/cls_room12` with no grant redirects; a Room 12
  grant does not open Room 4; as the demo student, `/student/checkin/post` and
  an unassigned mission URL both redirect to `/student`.
- No new student fields. No passwords. No telemetry.

### Where this is most likely still wrong

- **Existence is not entitlement, and that was the shape of every check here.**
  Does this class exist, is it in my school, is this a real student, a shipped
  mission, a valid form. Not one asked whether the caller was entitled to it.
  Two sprints have each found what they were pointed at; **nobody has enumerated
  every route and asked who may reach it.**
- **`enterDemo("student")` still writes a student session directly**, bypassing
  the grant. It is an explicit demo button and the mechanism the whole demo
  rests on, but it is there.
- **Commercial framing was load-bearing on state that did not exist.** "Fall and
  spring windows" is what makes an annual subscription and an annual report
  coherent, and nothing was behind it. Same class of defect as sprint 25's
  "certified" — a word doing work the system could not support. That one was
  fixed by changing the word; this one was worth keeping, so the state got built.
- **The instrument is still unequated with one item per skill** — sprint 24.
  Real windows make the time separation true; they do not make the forms
  parallel.
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
