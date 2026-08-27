# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 36 — P1: Sprocket s6 asserted something no child had done

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-36.md`](2026-08-27-sprint-36.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer,
  sprint 25 the educator orientation. Sprints 26-30 audit what the product
  permits and promises, 31-32 walk ordinary school workflows, 33-34 build the
  migration path and the gate in front of it, 35 removed an instruction that
  would have destroyed children's records. **Sprint 36 is the first traced
  shared scene: a scene that recorded skill evidence off a premise the child's
  own path contradicted.**

### What changed

1. **`Sprocket Wants to Know` / `s6` opened "Sprocket already knows your first
   name".** It does not, on any route a child can take. `s2` is the only scene
   where the name is at stake: the full-credit exit is "leave it blank and tap
   Start", the other non-retry exit is "ask Theo what he typed", and the one
   choice that types a name is a **retry** that loops back and cannot reach
   `s6`. `s3`, `s4` and `s5` are common to both routes and none supplies a name.
   So the premise was false on **both** live paths, not only the clean one. The
   scene then awarded `privacy.identity` demonstrated on feedback reasoning from
   it, which turned a contradicted premise into a competency claim about a child.
   The line almost certainly came from `s3`, where **Theo** types his full name.
2. **The premise is now an explicit hypothetical**, in the prompt as well as the
   narration so a skimmed class still gets it: "Imagine an app already knows a
   kid's first name." Framed as "a kid", not "you" — true on every route, and it
   does not rewrite `s2`'s safe choice into having shared something.
3. **School and street now teach stacking, not identification.** "Somebody knows
   where one particular child is" and "nearly a doorstep" both overclaimed: a
   first name plus a school does not pick out one child. The copy now says each
   detail narrows the field — "now it is only the kids at that one school", "the
   list of kids it could be gets very short" — which is durable and survives a
   child objecting that lots of kids share a name.
4. **Dinosaurs stay the public contrast**, now on the same axis: they make the
   group no smaller and add no place.
5. **Sprint 17's safeguard is intact.** Two non-retry exits, both demonstrated,
   one retry that loops, and the copy still tells the child both school and
   street are right so neither exit is a trick.

### Already verified — please do not redo

- Typecheck, lint, **463 tests** (up from 461), Turbopack production build.
- **Every route into `s6` traced by hand and tabulated in the review.**
- The assertion that pinned the false history is gone. Two tests replace it, and
  both were confirmed to **fail against the old content and pass against the
  new** by stashing the content file and re-running: the prompt is explicitly
  hypothetical and never claims the app holds what the child withheld; exactly
  two non-retry exits remain; the copy teaches narrowing and contains no
  `one particular child`, `knows where/who`, `nearly a doorstep` or `exactly
  where`; and the dinosaur option is still a retry carrying no evidence.
- **Projector (Classroom Mode):** all three branches revealed at Decision 4 of
  4 — school and street render as SAFE CHOICE, dinosaurs as LOOPS BACK, nothing
  truncated on the board.
- **Tablet (768×1024), played as a child:** the route the false premise
  contradicted, `s2/c2 → s4/c1 → s5/c1 → s6/c1`, ending with the Name Keeper
  badge and a stored attempt recording
  `{"privacy.identity":"demonstrated","privacy.escalate":"demonstrated"}`. A
  clean first-go path records demonstrated; the coached-retry downgrade is
  applied by `recordDecision` and exercised against this scene in
  `tests/evidence-integrity.test.ts`.
- **No open chat, no free text, no student field, no unrelated content sweep.**
  `s2`'s safe choice, `s3`'s "Theo typed his whole name", and `s4/c2` are all
  untouched.

### Where this is most likely still wrong

- **Twenty-six of twenty-seven missions still have untraced shared scenes.**
  This is the first one traced. The defect class is now demonstrated to exist
  and to reach the evidence record, so the remaining twenty-six are the highest
  known content risk in the product.
- **The new guards are string assertions against authored copy.** They catch the
  specific overclaims found here and the shape of the fix; they cannot tell that
  some other scene's premise is false.
- **Prose goes stale silently** — sprint 35. Most marketing and help copy is
  still untested.
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
