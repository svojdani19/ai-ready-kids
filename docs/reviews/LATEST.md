# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 10 — evidence integrity and interleaved practice

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-26-sprint-10.md`](2026-08-26-sprint-10.md)
- **Review trail:** sprints 01–10 in this directory. Sprint 09 tripled the
  curriculum to 27 missions; sprint 10 fixes two defects that review found in it.

### What changed

1. **Coached answers no longer report as independent.** `recordDecision` and
   `simulateAttempt` both downgrade a `demonstrated` result to `developing`
   when the child reaches it on a scene they had already answered — that is,
   after the authored Try again explanation. `demonstrated` stays sticky once
   earned unaided anywhere, so the record is still evidence of what a child can
   do rather than an average.
2. **Assignment order is interleaved, not blocked.** Missions were ordered in
   skill triplets, so a class assigned the first nine got *only privacy*, and
   the first eighteen covered 6 of 9 skills and 2 of 3 competencies. They now
   run in three passes of nine, rotating through the competencies, so every
   prefix a teacher might assign is balanced and the three encounters with a
   skill sit nine missions apart.
3. **Reporting language matches the rule** on the teacher class page, the
   teacher overview and the school report. The student view now shows a second,
   warmly framed list — *Things you are getting the hang of* — so needing the
   explanation reads as partway there rather than as nothing.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **232 tests**, Turbopack build.
- **New suite `tests/evidence-integrity.test.ts`** walks a retry-first path
  through **all 27 missions** using the real `recordDecision`, and asserts that
  no skill is reported demonstrated unless the stored path contains an unaided
  strong choice for it. A first-try walk is asserted to still demonstrate.
- Ordering asserted directly: every competency inside the first three missions,
  all nine skills inside the first nine, encounters exactly nine apart, and
  every assignable prefix balanced across competencies.
- Reseeded. Among completers, primary-skill demonstration moved off 100% into
  the mid-90s, with `developing` now present in all nine skills.

### Where this is most likely still wrong

- **Stickiness is doing a lot of work.** With three missions per skill and
  `demonstrated` sticky, one unaided success out of three encounters is enough.
  That is the specified rule and it keeps aggregate rates high. Whether a
  teacher reads 95% as "nearly all my class can do this unaided" is worth
  challenging.
- **The eight legacy forced-award scenes remain.** Sprint 09's new missions all
  have two or more non-looping exits; the original nine do not. Those scenes
  now interact with the coaching rule in a way nobody has traced.
- **Interleaving was not checked against how teachers actually assign.** The
  order assumes sequential assignment. A teacher who assigns by competency, or
  cherry-picks, gets none of this benefit.
- **The new student "getting the hang of" list is untested with children.** It
  is intended to keep a downgrade encouraging. It could equally read as a
  second-class list.
- **Content, not mechanics.** Sprint 09 added eighteen missions in one pass.
  Their scenarios, feedback wording and reading level have had one automated
  check and no human read.

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
