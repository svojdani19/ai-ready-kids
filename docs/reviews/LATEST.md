# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 39 — P1 correction: Photo 1 made the retake sound sufficient

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-38.md`](2026-08-28-sprint-38.md), with the sprint 39 correction appended
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 16 read and fixed the eighteen newer missions. Sprint 17 closed
  the eight legacy forced-award scenes as a rule in `validateMission`. Sprints
  18 to 21 worked through the original nine; all 27 have been read, and 26 had
  findings. Sprints 22-23 are the reporting layer, 24 the assessment layer, 25
  the educator orientation. Sprints 26-30 audit what the product permits and
  promises, 31-32 walk ordinary school workflows, 33-34 build the migration path
  and its gate, 35 removed an instruction that would have destroyed children's
  records, 36 traced the first shared scene, 37 removed a teacher activity that
  required projecting photographs of real children. **Sprint 38 clears the
  second and more direct instance of that defect, which sprint 37 found and left
  standing.**

### The correction (sprint 39)

Photo 1's audience line read *"Not ready, and not because of anybody in it."*
Written to mean "the chart is what blocks **this** version", it tells a
seven-year-old that the unasked children are irrelevant and makes taking the
chart down sound like the whole fix — contradicting the three-part rule inside
the card meant to introduce it. Now:

> Not ready, for two reasons. The chart alone stops this version, so take it
> down and photograph them again. That fixes the wall and it is not the whole
> job: after the retake, all twenty-three still have to be asked about the exact
> place it is going.

The consent line ties to the chart instead of floating free: *"Nobody has been
asked yet. That question does not go away when the chart comes down."* The
phrase is gone from the content and from all review prose. A regression test
asserts Photo 1's audience names **both** blockers, says necessary-but-not-
sufficient in as many words, points at the exact audience, and that the phrase
appears on no card in any mission — confirmed to fail against the old wording.
**478 tests.** Photos 2 and 3, the mission graph, evidence, scenes and student
fields are untouched.

### What sprint 38 changed

1. **`the-class-photo`'s extension said "Take a photo of your own classroom,
   project it, and have the class hunt the background for anything they would
   not publish. Names on trays, timetables, a rota with home details."** More
   direct than sprint 37's defect: that one asked for photographs and left the
   contents to chance, this one **named the sensitive material as the target**.
   In a mission about consent and limited audiences it put a real room's actual
   student and routine information on a shared screen — a family-restricted
   child's arrangements, who collects whom, a support timetable, a reading-group
   placement — and a projected screen can be photographed off the wall.
2. **Three authored cards, staged so the order is the lesson**, reusing sprint
   37's `ExtensionCard` structure and renderer. Photo 1: a readable chart headed
   `WHO GOES HOME WITH WHO` — not ready for two reasons: the chart alone stops
   this version, and taking it down is necessary but not sufficient, because
   after the retake all twenty-three still have to be asked. Photo 2: same class next morning, chart gone,
   all twenty-three asked one at a time about the school news page, all twenty-
   three said yes — ready, for that page, because that is the exact thing they
   were asked about. Photo 3: **that same clean photo** proposed for a cousin
   outside the school and a forty-person group chat — not ready.
3. **Photo 3 is the point. Nothing about the picture changes between 2 and 3 and
   the answer changes anyway**, so a child cannot resolve it by looking harder
   at the image. It lands on two misconceptions this guide already lists: "It is
   already going online, so sending it changes nothing" and "Ravi is not in this
   one, so I can send it." Card 2 says **"asked, one at a time, and answered"**
   and explicitly **"Not nobody objected"**.
4. **Each card keeps four questions apart**: what the background suggests, what
   it proves, whether everyone in it was asked, and whether it is ready for
   *this* audience. Hand signals, nothing written down about any child.
5. **The prohibition names the old target**: not your own room, your students,
   their families, or your school's real charts, lists and timetables — with the
   projector-photographing reason attached.
6. One optional field, `consent?`, added to the existing `ExtensionCard` and
   rendered as "Everyone in it:". No new format and no second renderer. It is
   optional because only some missions teach consent as a step separate from
   background, and a test asserts that split.

### Already verified — please do not redo

- Typecheck, lint, **477 tests** (up from 471), Turbopack production build.
- 502 words, about four minutes read aloud, leaving roughly six for discussion.
  No device needed.
- Six new assertions, all confirmed to **fail against the old extension and pass
  against the new** by stashing the content and re-running: the three stages
  individually, the no-real-photo rule with its reason, the three questions
  named and kept apart, hand signals with nothing recorded, and distinctness
  from the Filter cards.
- **The guard has shrunk from two missions to one, as required.** The set whose
  extension asks for a real classroom photograph is now exactly
  `["what-the-camera-sees"]`.
- **Browser-checked on both teacher surfaces at 1280×800 and 768×1024**: no
  horizontal overflow, all three cards inside the content column, nothing
  clipped, and four definition rows per card at every size, confirming the new
  consent line renders everywhere.
- **Mission graph, evidence, scenes and student fields untouched.**

### Where this is most likely still wrong — best places to push

- **`what-the-camera-sees` is the last case the guard knows about**, and it is
  the mitigated one: empty room, before school, never a live feed, never
  children in frame, a prepared image offered instead. It still asks a teacher
  to photograph a real school interior. Smaller than the two now fixed, but it
  is the remaining instance.
- **The other twenty-four guides have not been read for this defect class.**
  Three of the first three checked had some version of it. That base rate has
  not improved, and the guard only catches this *shape* of instruction — an
  activity could ask for real material in wording the regex never sees.
- **Twenty-six of twenty-seven missions still have untraced shared scenes** —
  sprint 36 traced one and found the defect reached the evidence record.
- **All the new content guards are string assertions against authored copy.**
  They pin the fix, not the property.
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
