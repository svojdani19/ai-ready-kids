# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 17 — the forced-award scenes, closed as a rule

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-17.md`](2026-08-27-sprint-17.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. **Sprint 17 closes the eight legacy forced-award scenes, open
  since sprint 06, as a rule in `validateMission` rather than as eight edits.**

### What changed

1. **No scene may award evidence through its only exit.** Eight scenes in the
   original nine missions had one non-retry way out and still recorded
   `demonstrated`. Every child who finished took that choice, so the record said
   they had completed the scene, not that they could do the thing — and the
   teacher dashboard could not tell the difference. **The remedy is a rule in
   `validateMission`**, the mirror of one already there: a sole exit was allowed
   to omit evidence precisely because it cannot distinguish reasoning from
   compliance; the missing half said it must. Adding it turned six missions red.
   Each scene then got a second genuinely correct exit, preferring a contextual
   distinction — Sprocket's now asks which fact you would not add to a first
   name the tool already has, and both *school* and *street* are independently
   right. Sixteen assertions check demonstrated-when-first and
   developing-after-correction per scene, through the real `recordDecision`.
2. **The Filter That Wanted More now establishes approval before minimisation.**
   It went straight to the permission box on an unknown app on a school tablet,
   and awarded mastery for "a fox filter only needs the camera". A strange app
   can need the camera and still be one nobody approved. Approval is now its own
   scene, first; reading the permission list is the `partial`; "Theo already has
   it" is the retry. The posting decision no longer turns on the background — a
   clean wall does not make two children's faces safe for an open feed — and the
   ending no longer claims the pictures "never left the tablet", which nothing
   in the story could show. They are deleted, the app is closed, and what cannot
   be known is said out loud.
3. **A fourth public-correction instance, and why the guard missed it.** Sprint
   16 banned four exact strings. This sprint found "Interrupt immediately and
   publicly" and "out loud, for the whole room" in a mission I had not read. The
   guard now matches the shape — a correcting verb near a public setting — and
   found it immediately.
4. **A rendering defect.** The teacher preview and the screen-reader string both
   join headline to body with a full stop, and six authored headlines already
   ended in punctuation, rendering as "yes to it.." and "though?.". Fixed in the
   renderer via `endSentence`, not in the content.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **303 tests**, Turbopack build.
- The forced-award rule is enforced by `validateMission`, which
  `tests/content.test.ts` runs against every mission — so it applies to missions
  written from now on, not only to the eight that existed.
- Sixteen per-scene assertions in `tests/evidence-integrity.test.ts` cover both
  halves of the coaching rule for every formerly-forced scene.
- The public-correction sweep now matches a pattern rather than four literals.
- Every choice headline is checked to survive being joined to its body.
- All guards from sprints 10 to 16 unchanged and still passing.
- Checked in the browser: the new approval scene, the rewritten posting scene
  and ending, and the headline join.

### Where this is most likely still wrong

- **Seven of the original nine missions still have no systematic read.** Sprint
  17 read two of them properly and touched five more only where a forced-award
  scene happened to live. That is not coverage. This is now the largest gap, and
  the eighteen Sprint 09 missions averaged a finding each.
- **Guards that pin strings pin only what you were looking at.** Sprint 16's
  public-correction guard was one sprint old and already too literal to catch a
  fourth instance. Where a finding is a shape, express it over `MISSIONS`.
- **Sweeps have now found two defects nobody was looking for** — the escalation
  sweep in sprint 16, the forced-award rule here. Prefer them to pins.
- **Teacher-facing copy promises timelines it cannot support** — "the habit sets
  in about two rounds faster than expected", "the first-column reaches drop off
  within days". Harmless to children, mildly dishonest to teachers.
- **Six shapes to hunt:** a correct choice resting on a reason that will not
  hold; an ending that acts out the error the feedback warned against; a state
  the child reasons about that was never made observable; anyone treated as safe
  because of who they are; a check that runs through a person; and escalation
  that ends at telling somebody.
- **No general guard against factual error exists or can.**
- **Stickiness keeps aggregate demonstration rates near 95%.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
