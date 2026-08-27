# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 24 — the benchmark was scoring a belief the missions removed

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-24.md`](2026-08-27-sprint-24.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer. **Sprint 24 is the assessment
  layer, and it found the missions' own retired reasoning being scored as
  correct.**

### What changed

1. **The plaque rationale came back as a scored item.** Sprint 18 removed *"the
   plaque, because it was put there by the people who built it"* from Two
   Answers, One Truth. Benchmark pre-6 was scoring the identical reasoning as
   **correct**: *"The stone, because the people who built it put it there"*,
   with the same ambiguous referent. That is worse than the mission version was
   — a mission teaches and can be corrected; an item marks a child down for not
   holding the belief and reports it as evidence. Pre-6 is replaced with a bus
   timetable against a poster, mirroring post-6's reasoning and its exact
   distractor kinds.
2. **Two pairs asked for different things across windows.** Pre-4 asked a child
   to rate their belief while post-4 asked for an action; pre-5 asked for the
   best *question* while post-5 asked for the best *thing to do*. A difference
   between the windows could therefore be a difference in task demand rather
   than in the child. Both pre items now ask for actions, with distractors
   mirroring their pairs.
3. **The framing was not earned, and cannot be by writing.** The module claimed
   the forms are "parallel by skill and difficulty" and measure "transfer".
   Nothing has been piloted or equated, and **each skill carries one item**, so
   one response moves a competency by 33.3 points. That needs several reviewed
   items per skill and a pilot, which this sprint cannot produce — so the fix is
   the narrow label, applied everywhere at once. `growthPoints` is renamed
   **`pointsDifference`** on the domain object, every human-facing label follows
   (dashboard, report, CSV column, class page, marketing), and the public
   benchmark page states the limit outright.
4. **The child was told an incomplete truth.** *"Your teacher only uses this"*
   was not accurate — cohort results reach school leaders through reports, the
   certification dashboard and the export. Both forms now say *"Nobody gets a
   score, and nobody sees your answers"* followed by *"Adults at your school
   only see results for whole groups"*, with the part that matters to a child
   first.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **348 tests**, Turbopack build.
- **A benchmark-content sweep** now enforces the mission-side rule outside
  missions: no item may treat an inscription, an object's age or apparent
  officialness as source authority, and no correct option may rest on proximity.
- **A pairing sweep**: every pre item's post pair must ask the same kind of
  move, with the same option count and reading load within twelve words. That is
  what would have caught pre-4 and pre-5.
- One item per skill per form is asserted, so the constraint the honest labels
  rest on lives in the tests rather than only in a comment.
- Both intros must say nobody sees your answers and that adults see group
  results, and must not say "your teacher only uses this".
- The public benchmark page checked in the browser.

### Where this is most likely still wrong

- **The instrument still cannot support growth or transfer claims.** No amount
  of copywriting changes that. It needs several independently reviewed items per
  skill and a pilot that equates the forms. The labels are now honest; the
  instrument is unchanged.
- **The certification content has never been read against the checklist**, and
  it is the last body of authored content that has not. Given sprint 24, assume
  it repeats something the missions have already been corrected not to say.
- **A content fix has to be swept everywhere that logic lives.** Sprint 18 fixed
  a rationale in a mission and nobody checked whether it lived elsewhere. It did
  — in the instrument that measures whether children learned the lesson.
- **Three sprints running, the defect was outside the missions**, and all three
  said something the missions had already been corrected not to say. The
  missions got twenty-one sprints of attention; the things that report on and
  assess them got none until somebody looked.
- **Nothing verifies the privacy prose against the code that implements it**,
  beyond specific assertions. Still open from sprint 23.
- **Every mission has been read once. None has been read twice.**
- **Nothing checks what a wrong answer costs a child** — open from sprint 20.
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
