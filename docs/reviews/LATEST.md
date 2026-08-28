# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 40 — P1: the last real-classroom photograph, and the wrong lesson with it

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-40.md`](2026-08-28-sprint-40.md)
- **Review trail:** sprints 01–16 read and fixed the curriculum; 17 closed the
  legacy forced-award scenes as a `validateMission` rule; 18–21 finished the
  original nine, so all 27 missions have been read and 26 had findings; 22–25
  are the reporting, assessment and orientation layers; 26–30 audit what the
  product permits and promises; 31–32 walk ordinary school workflows; 33–34
  build the migration path and its gate; 35 removed an instruction that would
  have destroyed children's records; 36 traced the first shared scene; 37–38
  removed two teacher activities requiring photographs of real children and 39
  corrected a wording slip in the second. **Sprint 40 closes the class: the
  third and last such activity is gone, and the guard that tracked them is now
  empty.**

### What changed

1. **`what-the-camera-sees` still asked a teacher to photograph their own empty
   classroom before school and project it.** "Empty" and "before school" remove
   faces and nothing else — names on work, reading and support groups,
   collection arrangements, timetables and school identifiers are all still on
   the walls, and an empty room is the state in which that paperwork is *most*
   visible. It needed sourcing, prep and media-policy judgement, and a projected
   image can be re-photographed.
2. **It also taught the wrong skill.** Comparing a messy wall with a tidy one
   teaches *tidy the wall*. This mission's goals are telling a preview from a
   live stream **by reading what the screen says**, knowing that once live each
   moment goes out before it can be checked, and turning a feature off rather
   than managing it. A tidy live frame is still unchecked. The activity was
   training the control the mission exists to deny.
3. **Three authored screens replace it**, zero prep, on the existing
   `ExtensionCard` path, in a fictional domestic room matching the mission's own
   setting, using the mission's own on-screen strings verbatim. Screen 1: the
   room as it is, `PREVIEW — ONLY YOU CAN SEE THIS`, clues graded (badge and
   street sign strong, a band poster deliberately harmless). Screen 2: the same
   room tidied, **still PREVIEW** — the words did not change when the room did,
   and tidying fixed this frame and not the next. Screen 3: **the same wall,
   same angle, same everything**, `LIVE — 8 PLAYERS CAN SEE THIS NOW`, with the
   door starting to open at the edge of frame.
4. **Screens 2 and 3 are the pair.** The frame is identical, so a child cannot
   answer by looking harder at the room — only the status line moved. Screen 3's
   opening door is the little brother from scene `s3`, so activity and story
   teach the same beat.
5. **Four prompts, kept apart and named in the instructions**, mapping onto the
   mission's four learning goals: what the picture gives away, what the words
   prove about who is receiving it right now, why tidying cannot fix the next
   moment, and whether turning the feature off is safer. Hand signals, nothing
   written down about any child.
6. **The prohibition covers both improvisations**: do not point a camera at
   anything, do not use a photo of your own room, school, students or families,
   and **do not open a live feature to demonstrate one** — with the
   re-photographing reason attached.
7. One optional field, `control?`, rendered as "The next moment:". No new
   format, no second renderer. It sits beside sprint 38's `consent?`, and a test
   asserts which missions carry which rather than leaving it to convention.

### Already verified — please do not redo

- Typecheck, lint, **485 tests** (up from 478), Turbopack production build.
- 635 words, about five minutes read aloud, leaving five for discussion. No
  device required.
- **The guard is empty.** The set of missions whose extension asks for a real
  classroom photograph has gone from two, to one, to `[]`, and the test now
  asserts the empty set so nothing can reintroduce the instruction.
- Nine assertions, all confirmed to **fail against the old extension and pass
  against the new** by stashing the content and re-running.
- One older assertion was **superseded and rewritten, not deleted**: it pinned
  the previous mitigations (*never a live feed*, *never a fresh photo with
  children in it*, *prepared image*), which were careful handling of a
  photograph that no longer exists. It now asserts no camera is involved at all.
- **Both teacher surfaces browser-checked at 1280×800 and 768×1024**: no
  horizontal overflow, all three cards inside the content column, nothing
  clipped, four definition rows per card at every size.
- **Scenes, mission graph, evidence, student fields and the authored-choice
  design are untouched.**

### Where this is most likely still wrong — best places to push

- **The defect class is closed only as far as the guard can see.** The regex
  catches "photograph/take/project your own classroom". An activity could ask
  for real material in wording it never matches — student work, a family photo,
  a real timetable — and **the other twenty-four guides have not been read for
  this class.** Three of three checked had some version of it.
- **`extensionCards` now has two optional mission-specific rows** (`consent?`,
  `control?`). A third would be a signal the type is becoming a grab-bag and
  wants a general "extra rows" shape instead.
- **All the new content guards are string assertions against authored copy.**
  They pin these fixes, not the underlying properties.
- **Twenty-six of twenty-seven missions still have untraced shared scenes** —
  sprint 36 traced one and the defect reached the evidence record.
- **Prose goes stale silently** — sprint 35.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings**
  predating sprint 35, unrelated to this work.
- **Only one previous schema shape is recognised** — sprint 34. No
  down-migrations.
- **Rollover is one school at a time**; bulk reassignment does not exist.
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
