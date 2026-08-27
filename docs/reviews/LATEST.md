# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 21 — the last mission, and what the whole pass found

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-21.md`](2026-08-27-sprint-21.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine.
  **Every one of the 27 missions has now been read by a person. Twenty-six had
  findings; only The Art Show Label came back clean.**

### What changed

Both findings are about the four doors — the mission's central artefact, which a
wall poster, three other missions and a shared art asset all point at.

1. **The first card scored arithmetic and called it strategy.** The card said
   only *seven plus eight*, and the full-credit feedback asserted a learner state
   the story never established: *"you already know this one, or you nearly do"*.
   Reaching for a tool was a retry because *"you can do seven plus eight"*. For a
   child with dyscalculia, a working-memory difference, maths anxiety or an
   agreed calculator arrangement, that records them below mastery for their
   numeracy rather than their strategy selection. The mission also contradicted
   its own final reflection, which says the right door moves as the learner does.
   **The state is now in the story** — worked it out yesterday, nearly back today
   — so thinking it out is right *for where you are today*. And there is a second
   full-credit answer: **ask for a hint, or use whatever you have agreed with the
   teacher**, because an agreed accommodation is an arrangement, not a shortcut.
2. **The taxonomy overlapped and the activity logged children.** THINK IT OUT /
   LOOK IT UP / ASK A PERSON / **USE A TOOL** — but looking something up uses a
   tool, and so is a calculator, a book, or software that reads a page aloud.
   Door four is now **ASK AN AI TOOL**, with Ms. Okafor saying out loud that it
   means the tools the school allows, that a tool can help at any door, and that
   the doors are about where an answer comes from rather than what you hold. The
   doors also stack now: a tool that names a source sends you through the second
   door to read it. And the extension — *"keep a door tally for a week, each time
   a student gets stuck they mark which door they used"* — was a running record
   of which children need help and what they reach for. It is now an anonymous,
   teacher-authored scenario sort with nothing written down.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **327 tests**, Turbopack build.
- A **sweep over every mission's extension**: no classroom activity may
  accumulate per-child help-seeking over time. Noticing in the moment is what
  `lookFor` is for and stays fine. This is the first sweep here to come back
  empty, which is still worth having — it applies to every extension written
  from now on.
- All guards from sprints 10 to 20 unchanged and still passing.
- Four Doors checked in the browser at the teacher preview.

### Where this is most likely still wrong

**The pass is complete and the number is 26 of 27.** Two conclusions from it,
both of which should shape whatever comes next:

- **The defects were not randomly distributed.** Five were inclusion failures —
  scoring a child's family, a classmate's talent, a hand's writing, a familiar
  adult's character, a second grader's arithmetic. Every one read plausibly as a
  sentence and failed the moment somebody asked which child it fails. That
  question is now four items on the checklist and it should have been the first.
- **Guides described intent; scenes did the teaching.** More than once a
  discussion guide stated the right principle while the scenes taught the
  opposite, and the evidence awards followed the scenes. Reviewing by reading
  setups would have passed those missions.

Still open:

- **Every mission has been read once. None has been read twice**, and the find
  rate did not fall as the pass went on. Do not treat one read as clearance.
- **Nothing checks what a wrong answer costs a child.** The evidence model is
  well tested for integrity — no forced awards, no coached mastery — and not at
  all for whether the honest answer is reachable by every child.
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
  Sprint 19's path defect could exist in any of them.
- **Sweeps need to be narrow enough to mean one thing** — sprint 20's quota
  guard took three attempts, tripping on `twenty-three people` and on legitimate
  copy about counting sources.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **Stickiness keeps aggregate demonstration rates near 95%.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
