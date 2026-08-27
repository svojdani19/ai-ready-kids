# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 19 — a scene that could not be true on every path

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-19.md`](2026-08-27-sprint-19.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. **Sprints 18 and 19 work through the original nine: six
  read now, six with findings, three to go.**

### What changed

1. **"The Homework That Did Itself" awarded honesty for a false report.** Its
   one strong disclosure was *"Sprocket gave me a hint on number two and I did
   the rest"* — but scene four also offered, at full credit, *keep number two's
   answer and redo the other five*. On that path no hint existed; the tool
   supplied the answer and the child kept it, and the mission recorded
   `own.honesty` demonstrated for calling it a hint. Walking the graph, only one
   of four combinations reaching that scene made its sentence true. **Scene four
   now branches**: clearing the page routes to the shared report, keeping the
   answer routes to its own. Keeping is `partial` — allowed, and less of the
   practice. On the kept-answer report the accurate sentence earns mastery and
   the old strong line is the partial: *"hint is the wrong word... calling it a
   hint makes the help sound smaller than it was."* Neither strong option in the
   shared report says "hint" at all. The offered example is now stated to be
   unworked, which is what makes the report honest.
2. **"The Spelling Test Surprise" put spelling in the hand.** The story says the
   child handwrote every word five times, and the mission then explained the
   failure as *"my hand never learned it"*, planned that *"the words go in when
   your hand writes them"*, and had the family sheet require *"the practice has
   to happen in their handwriting"*. The story contradicts its own explanation,
   and the explanation is false in a way that lands worst on children who type,
   dictate, use assistive technology or have dysgraphia. What was missing was
   **recall** — producing the letters without the answer in view. The strong
   answer is now *"I copied every word. I never once wrote one without looking"*,
   the plan is cover-then-attempt-then-check in **any** modality ("out loud,
   typed, on a whiteboard, with letter tiles, whatever you and your grown-up
   have agreed"), and "messy is the evidence" became "every crossing-out is a
   word you tried before you knew".

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **315 tests**, Turbopack build.
- Six new guards, plus four phrases added to the brittle-absolutes ban list:
  `my hand never learned it`, `when your hand writes them`, `in their
  handwriting`, `messy is the evidence`.
- The path guard asserts that the clearing choices share a `next` and the
  keeping choice does not, that no strong option in the shared report contains
  "hint", and that calling a kept answer a hint is `partial` wherever it appears.
- All guards from sprints 10 to 18 unchanged and still passing.
- Both missions checked in the browser at the teacher preview, including the new
  branch and its two reporting scenes.

### Where this is most likely still wrong

- **Three of the original nine still have no systematic read.** Six read, six
  with findings. Nothing in the legacy set has come back clean.
- **Shared scenes are the unswept surface.** Sprint 19's finding needed two
  scenes held together — an action in one, a sentence in the next — and the
  mission reads as correct anywhere you stop. `validateMission` walks the graph
  for reachability and evidence rules; it cannot check that a disclosure is
  *true* on the paths reaching it, and nothing can short of tracing branches by
  hand. Every mission with a shared reporting or reflection scene is worth this
  treatment; none of the other twenty-six has had it.
- **Inclusion defects are now four in five sprints** — familiar-adult
  exoneration, peer profiling, practice-makes-recall, and spelling-lives-in-the-
  hand. All four were written warmly and none was visible from the sentence
  alone. Each needed the question *who does this fail?*
- **Teacher-facing copy promises timelines it cannot support.**
- **Seven shapes to hunt:** a correct choice resting on a reason that will not
  hold; an ending that acts out the error; a state never made observable; anyone
  treated as safe because of who they are; a check that runs through a person;
  escalation that ends at telling somebody; and a verdict wider than what was
  actually checked.
- **No general guard against factual error exists or can.**
- **Stickiness keeps aggregate demonstration rates near 95%.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
