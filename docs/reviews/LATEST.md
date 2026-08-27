# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 22 — the dashboard was making a claim it could not support

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-22.md`](2026-08-27-sprint-22.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. **Sprint 22 is
  the first finding about the reporting layer rather than the content, and the
  first of the second pass.**

### What changed

Twenty-one sprints asked whether the missions tell children the truth. This one
asked whether the dashboard tells teachers the truth, and it did not.

1. **The recommendation ran on a metric that only goes up.** `mergeEvidence`
   treats `demonstrated` as sticky, which is right for the claim the student and
   roster labels make — *shown unaided at least once*. But sprint 10 tripled the
   curriculum so each skill is met three times, and a lifetime maximum cannot
   tell **"shown once, then coached twice"** from **"shown independently every
   time"**. The teacher card took that saturated number, called it *Suggested
   next focus*, and printed a percentage of the class.
2. **The rate divided by the wrong denominator.** `demonstratedRate` was
   documented as the share of students *with a completed opportunity* and
   implemented as `demonstrated / studentIds.length` — every enrolled student.
   A skill one student of thirty had met and shown read as **3%**, not 100% of
   those who practised it, and `nextTeachingFocus` picked the lowest rate, so
   early in a sequence it reliably selected the **least-assigned** skill. A
   teacher acting on it reteaches a lesson the class never had.
3. **Two views now, named separately.** Lifetime is unchanged and still sticky.
   Opportunity is new: one entry per completed mission that recorded a result,
   oldest first, with counts and `latest` — **a later coached result is visible
   and does not erase the earlier success.** `demonstratedRate` divides by
   `withOpportunity`, which the type exposes so every surface can state it; the
   competency rate had the same defect and got the same fix.
4. **The suggestion ranks on `independentRate`** — independent choices over
   total encounters — because unlike the lifetime figure it can fall. The card
   reads *"Chosen first go 78 of the 109 times it has come up, across 23
   students"*, and it selects a different skill from the saturated metric. When
   no skill has comparable coverage it changes its own heading to **Next
   unpractised skill** and says outright that this is coverage, not competence.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **335 tests**, Turbopack build.
- Eight new tests in `tests/teacher-journey.test.ts` cover unequal coverage,
  demonstrate-then-coached, saturation, ordering, and per-encounter counting.
  One of them asserts on purpose that the two children are **identical** under
  the lifetime view, so nobody re-collapses the two.
- No new student fields, no telemetry, no per-child prediction. Everything is
  computed from authored attempts and assignments that already existed.
- Both surfaces checked in the browser: the teacher card and the per-skill
  transfer line on the class page.

### Where this is most likely still wrong

- **The rest of the reporting layer has not had this treatment.** The admin
  roll-up, the school report and the CSV export consume these numbers and
  inherit the fix, but nobody has read them for claims of their own. The
  benchmark roll-up is a separate calculation and is untouched.
- **A comment that disagrees with its implementation is a finding.** That is how
  this one was visible in the code the whole time: the doc comment on
  `demonstratedRate` described a different calculation from the one three lines
  below it. I have not been treating comments as claims to check.
- **Watch for the honest thing being promoted downstream.** The student labels,
  roster legend and export suppression were all careful about stickiness. One
  surface took the same number and made it a recommendation. That is the usual
  shape of this defect.
- **Every mission has been read once. None has been read twice**, and the find
  rate did not fall as the pass went on.
- **Nothing checks what a wrong answer costs a child.** Still true from sprint
  20, and separate from this: the evidence model is tested for integrity, not
  for whether the honest answer is reachable by every child.
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
