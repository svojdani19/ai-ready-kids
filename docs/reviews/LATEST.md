# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 16 — the last eight, and the first guard that found something

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-16.md`](2026-08-27-sprint-16.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  **Sprint 16 read the remaining eight. All eighteen have now been read, and
  seventeen had findings.** Sprint 15's handoff said ten remained; it was
  eight — a subtraction error, corrected here.

### What changed

Two findings were systemic — each appeared in more than one mission, and
neither was visible one mission at a time.

1. **Teacher guidance told teachers to correct a child publicly.** The Practice
   That Got Skipped said to "interrupt it publicly" when a child calls
   themselves slow at times tables; The Reading Log said to respond to a low
   number "with curiosity in front of the class". Both single out one child for
   something that usually tracks a learning difference or what is happening at
   home. Both now say to do it privately, and the reading log offers the
   alternative: normalise the range without naming anybody.
2. **The slow-recall mission promised an outcome it cannot deliver.** Practise
   four nights and recall becomes automatic; the nine seconds "turns into one
   second"; any child claiming to be slow gets interrupted. For a child with
   dyscalculia, a working-memory difference or maths anxiety, that converts a
   fortnight of real practice into evidence something is wrong with them.
   Practice now makes it shorter, "how much shorter, and how quickly, is
   different for everybody", and a fourth full-credit choice was added: **do
   them slowly, and tell Ms. Okafor they are still really hard.** The setup
   names the conditions and says out loud that children with a calculator by
   agreement are not who this mission is about.
3. **Six further mission fixes.** The Group Project's extension asked children
   to declare what they bring, exposing anyone who cannot name a talent — it now
   allocates the jobs the task needs. It Happened to Theo told an adult and
   never dealt with the address already typed in. The Weather Argument asserted
   that the class fish "is always awake", which is false and, on the mission's
   own terms, in the wrong column. The Science Fair Fact's "you have nothing"
   became "you cannot use it yet", matching sprint 13. The Story That Was Not
   Mine promised your own work "stops being worse surprisingly quickly", and
   never taught saying what you asked for. The Art Show Label had no findings.
4. **A sweep found a ninth mission.** The escalation finding was written as a
   guard over every mission whose primary skill is `privacy.escalate`, and it
   failed on **The Question at Bedtime** — one of the original nine, and the one
   its own guide calls the most important. An assistant offers a child secrecy
   from their parents; the child tells a grown-up; the mission ends with a
   poster and **nothing happens to the app**. Its own misconception response
   already said "reporting protects the next child" — the story never delivered
   it. It now does: the school looks, and by Thursday that part of AskMe is
   switched off on every tablet in the building.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **273 tests**, Turbopack build.
- Eight new guards, two of which are **curriculum-wide sweeps** rather than
  mission-specific pins — the first content guards here that generalise:
  no mission's teacher guidance may address one child's shortfall publicly, and
  every escalation mission must show something stopped, removed or handed on
  plus somebody outside the room told. The second one is what found The
  Question at Bedtime.
- Five phrases added to the brittle-absolutes ban list: `he is always awake`,
  `turns into one second`, `stops being worse surprisingly quickly`,
  `first-hand beats forecast, every time`.
- All guards from sprints 10 to 15 unchanged and still passing.
- Checked in the browser: the new fourth choice in the practice mission, and
  the rewritten ending of The Question at Bedtime.

### Where this is most likely still wrong

- **The original nine missions have never had a systematic read.** This is now
  the largest gap. Sprint 16 touched one of them only because a sweep tripped
  over it, and one accidental hit is not coverage. Eighteen of eighteen Sprint
  09 missions have been read; zero of nine legacy missions have.
- **The eight legacy forced-award scenes**, and their untraced interaction with
  the coaching rule. Oldest open item in the repository, and it lives in those
  same nine missions.
- **Write findings as sweeps where they generalise.** Sprint 16's escalation
  guard discovered a mission nobody was looking at. Most guards here pin a known
  defect; a sweep can find an unknown one. When a finding is about a shape
  rather than a sentence, try to express it over `MISSIONS`.
- **Teacher-facing copy promises timelines it cannot support** — "the habit sets
  in about two rounds faster than expected", "the first-column reaches drop off
  within days", "see what changes within a fortnight". Harmless to children,
  mildly dishonest to teachers, deliberately not fixed this sprint.
- **Six shapes to hunt:** a correct choice resting on a reason that will not
  hold; an ending that acts out the error the feedback warned against; a state
  the child reasons about that was never made observable; anyone treated as
  safe because of who they are; a check that runs through a person; and
  escalation that ends at telling somebody.
- **No general guard against factual error exists or can.**
- **Stickiness keeps aggregate demonstration rates near 95%.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
