# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 37 — P1: the activity contained the hazard

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-37.md`](2026-08-27-sprint-37.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight. Sprint 17 closed the eight legacy
  forced-award scenes as a rule in `validateMission`. Sprints 18 to 21 worked
  through the original nine; every one of the 27 missions has been read, and 26
  had findings. Sprints 22-23 are the second pass over the reporting layer,
  sprint 24 the assessment layer, sprint 25 the educator orientation. Sprints
  26-30 audit what the product permits and promises, 31-32 walk ordinary school
  workflows, 33-34 build the migration path and its gate, 35 removed an
  instruction that would have destroyed children's records, 36 traced the first
  shared scene. **Sprint 37 removes a teacher activity that required projecting
  photographs of real children in order to teach why that is sensitive.**

### What changed

1. **The extension for The Filter That Wanted More said "Project three classroom
   photos you have taken. As a group, list everything in each background that
   could identify the school."** In a mission about what a picture gives away,
   that put real children's faces, names on cubbies and work, uniforms,
   timetables and school signage on a projector — and a projected screen can be
   photographed off the wall. It also required sourcing and uploading images and
   sat outside whatever media-consent arrangements a school has with families.
2. **It is now zero-prep and self-supplying.** Three invented photos are
   authored in the product as `guide.extensionCards`, described rather than
   shown, so a teacher reads them aloud or projects them with nothing to source.
   It works with no device at all, in about ten minutes — 411 words, roughly
   three minutes read aloud.
3. **The clues are graded, and the third one is the point.** Photo 1 plants a
   strong clue (a `BRIGHTWOOD FALL FAIR` banner and a bus route), Photo 2 a weak
   one (a `CENTRAL LEAGUE U9` shirt), and **Photo 3 is clean and still not
   ready** — a plain wall, nothing in the background, two children in frame and
   only one of them asked. Without Photo 3 the activity collapses into
   background-spotting and teaches that a tidy picture is a safe picture, the
   exact misconception this mission's guide already warns teachers to head off.
4. **Every card separates what a picture suggests from what it proves**, and
   answers a third question about audience. The room replies by hand signal and
   **nothing is written down about any child**.
5. **It says not to substitute real photographs, with the reason attached** —
   "these three exist so that you never have to, and a picture on a projector
   can be photographed off the wall."
6. `ExtensionCard` is an **optional** field on `DiscussionGuide`, so the other
   twenty-six missions are untouched. It renders in the printable guide and the
   mission detail page.

### Already verified — please do not redo

- Typecheck, lint, **471 tests** (up from 463), Turbopack production build.
- Eight new assertions, all confirmed to **fail against the old extension and
  pass against the new** by stashing the content and re-running: no instruction
  to photograph or project one's own classroom and nothing sending a teacher to
  a camera roll; three cards with every field populated; the read-aloud path;
  the do-not-substitute rule and its reason; suggests-versus-proves on all three
  cards with clues of differing strength; a clean-background card still refused
  on audience and permission grounds; hand signals with nothing recorded; and no
  real school named.
- **Browser-checked at 1280×800 and 768×1024**, on the discussion guide and the
  mission detail page: no horizontal overflow, all three cards inside the
  content column, nothing clipped, 16px body text.
- **The mission graph, evidence, scenes and student data are untouched.**

### Where this is most likely still wrong

- **`the-class-photo` has the same defect, unmitigated, and is not fixed.** Its
  extension reads "Take a photo of your own classroom, project it, and have the
  class hunt the background for anything they would not publish. Names on trays,
  timetables, a rota with home details." This sprint was scoped to one mission.
  **It should be the next one.** `what-the-camera-sees` is the mitigated case —
  empty room, before school, never a live feed, never children in frame, a
  prepared image offered instead — but still asks for a real school interior.
  Both are now pinned by a test: that set must equal exactly those two, so it
  can shrink but not grow.
- **The rest of the 27 guides have not been read for this defect class.** Two of
  the first three checked had it, which is not a reassuring base rate.
- **Twenty-six of twenty-seven missions still have untraced shared scenes** —
  sprint 36.
- **The new guards are string assertions against authored copy.** They catch
  this shape of instruction, not every way to ask for a real photograph.
- **Prose goes stale silently** — sprint 35.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings** that
  predate sprint 35 and are unrelated to this work.
- **Only one previous schema shape is recognised** — sprint 34. **No
  down-migrations.**
- **Rollover is one school at a time**, and bulk reassignment does not exist.
- **The route and action inventory is still not complete.**
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Every mission has been read once. None has been read twice.**
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
