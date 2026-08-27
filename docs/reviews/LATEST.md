# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 25 — certifying five button clicks

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-25.md`](2026-08-27-sprint-25.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  **Sprint 25 read the educator orientation, the last body of authored content
  that had never been reviewed. Every body of content has now been read once.**

### What changed

1. **The product certified five button clicks.** `completeCertificationAction`
   checks only that every module has *some* saved answer, so a teacher can
   answer all five checks wrongly and unlock the artefact. That is deliberate —
   the teacher page says there is no pass mark — and the printed document was
   careful too. Everything in between was not: the admin dashboard said
   *"Educators certified"*, the staff page *"Certified"*, the plans page sold an
   *"educator micro-certification"*. A principal reading "3 of 4 certified"
   concludes their staff understood the material; the system knows five buttons
   were clicked.
2. **It is an orientation now, everywhere.** I took the rename rather than
   gating the checks, because the non-gating is a deliberate product decision
   with its rationale already written into the UI, and turning adult
   professional learning into a quiz that withholds a certificate is a change to
   what the product *is* — the school's call, not a review finding's. The metric
   is "Orientation completed", the dashboard hint reads *"5 modules read and
   answered. Not a competence check."*, and **the certificate itself** now
   states that it is not an assessment of understanding and certifies no
   competence.
3. **Module 1 gave teachers a false inventory.** *"The curriculum is nine
   situations"* — the product has 27 missions, three per skill. Sprint 09
   tripled it and sprint 10 interleaved it, and neither touched the one document
   that tells a teacher what they are teaching. A teacher would have planned
   nine one-off stories and never learned that the repetition is the method.
4. **And an overclaimed rationale.** *"Children at this age are concrete
   thinkers"* and *"concrete situations transfer better than stated rules"* — a
   universal about every seven-to-ten-year-old and a causal claim about
   transfer, neither supported, and the fourth time some version of "children
   of this age are X" has had to come out. Replaced with the method as a
   sequence: concrete situation, rule named out loud, met again somewhere new —
   *"a sequence to teach with, not a claim about what a seven year old is
   capable of."*

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **354 tests**, Turbopack build.
- **A sweep** over the offering's own content and `CERTIFICATION_TITLE`: the
  words certified and certification may not appear in either.
- **A behavioural assertion that a teacher answering every check wrongly still
  completes.** It asserts the design rather than complaining about it, and it is
  what keeps the naming honest — if somebody later gates the checks, that test
  fails and the naming decision gets revisited deliberately rather than sliding.
- The completion record must carry no score, pass, correct, grade or result
  field, so the word cannot change back on the strength of a field nobody
  discussed.
- Module 1 must state 27 missions and three per skill; no module may say
  children of this age *are* concrete thinkers, use "far better", or claim
  concrete situations transfer better than rules.
- Admin dashboard and staff page checked in the browser.

### Where this is most likely still wrong

- **The missions were reviewed to death and everything around them was not.**
  Four sprints running, the defect was outside the missions: the roll-up that
  reports on them (22, 23), the instrument that assesses them (24), the document
  that explains them (25). Each carried something the missions had already been
  corrected for. That is the pattern to carry into any further review.
- **A structural change did not sweep the documents describing the structure.**
  Sprint 09 tripled the curriculum, sprint 10 reordered it, and the educator
  module still said "nine situations" eleven sprints later. Nothing in the
  process looked.
- **Nothing verifies marketing copy against product behaviour.** The plans,
  approach and for-schools pages describe the product in prose no test reads.
- **The orientation is ungated by design and stays that way.** If it should
  certify competence, that is a deliberate decision: gate the checks, allow
  unpenalised retries, give misconception-specific feedback, and validate
  correctness in the completion action.
- **The instrument still cannot support growth or transfer claims** — open from
  sprint 24 and not fixable by writing.
- **Nothing verifies the privacy prose against the code that implements it** —
  open from sprint 23.
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
