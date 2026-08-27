# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 18 — verdicts wider than the checking

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-18.md`](2026-08-27-sprint-18.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. **Sprint 18 begins on the original nine: four read now,
  four with findings, five to go.**

### What changed

Both findings are the same shape, and the sharpest yet: the mission asserts a
conclusion its own story has not earned, then awards mastery for repeating it.

1. **"The Penguin on the Playground" never established the picture was fake.**
   The photo carried no date, yet "it did not snow yesterday" earned
   `demonstrated` — first-hand knowledge of yesterday cannot settle an undated
   image. Ms. Okafor was asked only about the *voice*, and the mission then
   treated the *picture* as confirmed fake, collapsing two artefacts checked to
   completely different depths into one verdict. The image now carries a claim
   (PENGUIN AT BRIGHTWOOD THIS MORNING), so the snow check tests something real
   — and its feedback says what it bought: the caption, not the origin. The
   voice gains its durable half, the class page where homework actually gets
   posted, which also gives that scene a second exit so it records evidence
   instead of relying on the sprint 06 sole-exit exemption. The correction is
   now two sentences saying two different amounts, "tell them the whole thing is
   fake" is `partial`, and **the picture is never resolved**: Ms. Okafor writes
   UNKNOWN on the board and leaves it there.
2. **"Two Answers, One Truth" was built on a conflict that does not exist.**
   1908 and 1961 are compatible — a school opens, and decades later moves into a
   new building — but the mission said "they cannot both be right", claimed the
   plaque "was put there by the people who built it", and generalised into a
   league table ending "First-hand beats repeated. The plaque beats the blog."
   It was rewarding deference to an official-looking object. Scene four now asks
   what is worth noticing before picking, and the full-credit answers are that
   ERECTED is a claim about a building and that both might be true about
   different things. **"The plaque wins. It is old and official" is the retry.**
   The district building records settle it, because that is the record whose job
   it is. The hierarchy is gone; the badge is now Question Sorter.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **309 tests**, Turbopack build.
- Six new guards, plus five phrases added to the brittle-absolutes ban list:
  `first-hand beats repeated`, `the plaque beats the blog`,
  `put there by the people who built it`, `they cannot both be right`,
  `asking the real person is the check`.
- **Two existing tests were rewritten, not extended**, because both pinned
  something that had become wrong: the penguin voice scene was asserted to have
  exactly one exit recording nothing (the sprint 06 workaround, pinned as though
  it were a design), and the coached-completion test asserted an exact choice-id
  path through a restructured scene. The second is re-pointed at the outcome it
  cares about.
- All guards from sprints 10 to 17 unchanged and still passing.
- Both missions checked in the browser at the teacher preview.

### Where this is most likely still wrong

- **Five of the original nine still have no systematic read.** Four read, four
  with findings. Nothing in the legacy set has come back clean.
- **The guide is not the mission.** The penguin mission's guide stated the
  correct principle in plain words — provenance beats inspection — while its
  scenes did the opposite and its evidence awards followed the scenes. Anyone
  reviewing by reading setups and misconception responses would have passed it.
  Read what the child does and what it records.
- **Checklist items only work where they are applied.** Both findings this
  sprint match the item sprint 13 added ("the ending does not act out the
  error"), which had only ever been applied to missions being read for something
  else. The original nine have never been swept against the accumulated list.
- **Guards that pin strings pin only what you were looking at**, and two guards
  this sprint had to be rewritten because they pinned a limitation as a design.
  When a fix removes the reason a test existed, delete the test rather than
  bending it.
- **Teacher-facing copy promises timelines it cannot support.**
- **Seven shapes to hunt:** a correct choice resting on a reason that will not
  hold; an ending that acts out the error; a state never made observable;
  anyone treated as safe because of who they are; a check that runs through a
  person; escalation that ends at telling somebody; and **a verdict wider than
  what was actually checked.**
- **No general guard against factual error exists or can.**
- **Stickiness keeps aggregate demonstration rates near 95%.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
