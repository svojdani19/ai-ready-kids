# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 20 — a mission that scored a child's family

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-20.md`](2026-08-27-sprint-20.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. **Sprints 18 to 20 work through the original nine: eight
  read now, eight with findings, one to go.**

### What changed

1. **"The Very Sure Answer" swapped one authority shortcut for two.** Its retry
   for "computers do not make mistakes" was headlined *"Calculators do not"* —
   telling a seven-year-old one kind of computer is infallible, which is the
   same confidence error rewrapped. And its full-credit fact-check said *"the
   book has an author, and the author is a person who studied fish"*, which does
   not follow from a name on a cover. Execution is now separated from
   verification: **"A calculator does exactly the sum you type"**, and type the
   wrong sum and it hands you a perfect answer to the wrong question. Mastery
   now comes from a source answerable for the claim — the science site that
   names the aquarium and the study — and the book is `partial`: *"a name on a
   cover says somebody wrote it, not that they study fish or that they checked
   this bit."*
2. **"The Question at Bedtime" scored a child's family.** Its reflection asked
   *how many trusted grown-ups is a good number*, awarding `demonstrated` for
   **at least three** and `developing` for one genuinely trusted adult; the
   wrap-up, extension and family sheet all required three. Three names guarantee
   nothing about availability — and worse, that measured family size and called
   it a skill. A child in foster care, an unstable home, or a household where an
   adult is the problem answered honestly, scored lowest, and was then asked to
   write the shortfall on a card at their desk. The family rule compounded it:
   *"nothing on a screen gets to be a secret from the grown-ups in this house"*
   is unsafe wherever a caregiver is the harm. **The count is gone.** The scene
   now asks *"What do you do if you tell somebody, and nothing happens?"*, with
   full credit for **tell somebody else, keep going until somebody does
   something** and **tell somebody at school — it does not depend on anything at
   home**. One trusted person is `partial`, the right first move. The card is
   two lines, one filled in is fine, nothing collected or read out, school route
   on the board first.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **321 tests**, Turbopack build.
- The quota guard is a **sweep across every mission**: no choice recording
  `demonstrated` may use quota wording about trusted adults, and no scene prompt
  may ask a child how many they have.
- Four phrases added to the brittle-absolutes ban list: `calculators do not`,
  `the author is a person who studied`, `at least three trusted`,
  `so somebody is always around`.
- All guards from sprints 10 to 19 unchanged and still passing.
- Both missions checked in the browser at the teacher preview.

### Where this is most likely still wrong

- **One of the original nine still has no systematic read.** Eight read, eight
  with findings. Nothing in the legacy set has come back clean.
- **Nothing checks what a wrong answer costs a child.** The evidence model is
  well tested for integrity — no forced awards, no coached mastery — and not at
  all for whether the honest answer is available to every child. Sprint 20's
  defect worked *through* that model: a child in foster care answered truthfully,
  was recorded at `developing`, and it flowed to a teacher dashboard as a
  competency gap. The pipeline was doing exactly what it was built to do. The
  only place to catch that is the content, by reading the strong choices and
  asking who cannot pick one.
- **Inclusion defects are five in six sprints.** All five read plausibly as
  sentences and fail the moment you ask which child they fail.
- **Sweeps need to be narrow enough to mean one thing.** The quota guard took
  three attempts: `at least three` is legitimate in The Science Fair Fact about
  counting sources, `twenty-three people` matched `three people`, and `putting
  two adults in touch` matched as a quota.
- **Shared scenes remain unswept.** Sprint 19's path defect could exist in any
  of the twenty-six missions that have not been traced branch by branch.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **Stickiness keeps aggregate demonstration rates near 95%.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
