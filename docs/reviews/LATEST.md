# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 73 — the curriculum never told a child what AI was

- **Reviewed against:** HEAD `c65026b` plus this sprint's commit
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-73.md`](2026-08-29-sprint-73.md)

### The gap

Mission 1 hands a child a tablet, has a homework app say hello, and asks whether
to type their full name into it. That assumes the child already knows the thing
saying hello is a program producing what usually comes next, that AI is not a
robot in a film, and that a person — not the app — is deciding. Twenty-seven
missions, an annual benchmark and a five-module educator orientation, and none
of the three was ever taught. A seven year old who thinks Sprocket is alive can
still pick the safe answer, and the roster records `privacy.identity`
demonstrated; what they learned is that one cartoon gear is untrustworthy.

Separately, class creation refused any grade but 2, 3 and 4, so a grade 1 or
grade 5 teacher could not create a class at all.

### What was built

**First Look** — six sessions in `src/content/foundations/`, two grade tiers
teaching the same three ideas. Early (grades 1–2) starts inside the children's
own heads: the class finishes "peanut butter and ___", works out *why* they
could, then meets a program doing the same from millions of sentences. Upper
(grades 3–5) replaces a folk theory with a mechanism: Room 20 asks the school's
writing helper about the Brightwood swimming team, Brightwood has no pool, and
the answer arrives in two seconds with a coach, a practice night and a trophy.
The line the session is built around is a student's: *it did not look wrong, it
looked like every other answer.*

Grades widened to 1–5 in class creation and routing. The twenty-seven core
missions still say `2-4` on every library card, preview and printable guide,
because that is the band they are written for.

### The decision that shaped the integration

**First Look records no skill evidence, anywhere.** A six year old answering a
comprehension question on a projector is not the same act as a child declining
to give an app their street address under an offer of Turbo Mode, and a column
headed "demonstrated this skill" cannot mean both. So the evidence rule inverts
for this segment: `validateMission` normally flags a strong choice recording
nothing, and for `segment: "foundation"` it flags any choice recording anything.

Followed through rather than left implicit: `MISSIONS` still means the assessed
spine and every interleaving test still runs against exactly those twenty-seven;
`ALL_SESSIONS` is the new name for "anything a child can open"; `offeredBy` is
unchanged, so no class looks as though it missed opportunities it was never
given; the school report gained a `segment` **column** in both the screen table
and the CSV rather than a suffix a spreadsheet would lose; and the
administrator's "every mission in use" became "every **core** mission in use",
because no school runs both grade tracks.

### Classroom review — eight findings, all fixed in this sprint

Driven at 1280×800 and 768×1024 as a grade 2 student, a grade 3 student, the
teacher and the administrator. The one worth reading first: **the printable
discussion guide said "Primary skill recorded:" on a session that records
nothing** — the sheet a teacher prints, keeps and plans from, and so the place a
false claim would have survived longest. Also: the player headed a First Look
session "Mission 2" while the tile said FIRST LOOK 2; session numbering ran 1–6
across both tracks, so a grade 5 class got sessions 4–6 and a printable footer
reading "Session 6 of 3"; narration said "points at four things" above three
options; the family take-home filed a First Look session under a competency
heading; the two track columns collided at 768; one 25-word sentence, one over
the tier cap.

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      790 passed (24 files)   — up from 760
build      ✓ Compiled successfully
```

`tests/foundations.test.ts` is new: 30 tests covering structural validity, the
records-nothing rule at three levels (content, validator, and end to end through
the real repository), per-band reading caps, per-track numbering, self-limiting
unplugged extensions and a blanket-distrust check.

### Where to push hardest

1. **The grade claim now runs ahead of the core content, deliberately.** A
   grade 5 class can be created and assigned missions written for grades 2–4.
   Every teacher-facing surface says `2-4`, and the review records this as left
   on purpose — but a reviewer should decide whether saying it is enough, or
   whether grade 5 should be gated until upper-grade variants of the twenty-seven
   exist.
2. **`competency` and `primarySkillId` are reused on foundation sessions** to
   mean "leads into" rather than "assessed as". The types document it, the UI
   relabels it, and nothing records against it — but it is one field doing two
   jobs, which is the shape of thing that drifts.
3. **The badge wall filters by the class's grade.** A child moved between classes
   mid-year could hold a badge whose tile the wall would otherwise hide; there is
   a fallback for exactly that, and it deserves a second read.
4. **The upper-track cast is new.** Room 20, Mr. Alvarez, Priya and Dev. Nothing
   enforces cast consistency across the product, so this is convention only.
5. **No test compares the two tiers against each other.** Coverage of the three
   ideas is asserted through the `competency` field, which is a proxy for the
   idea rather than the idea itself.
6. **The benchmark is untouched.** First Look teaches nothing the nine skills
   measure, so the fall and spring windows still compare the same thing — worth
   confirming that is the right call rather than a gap.
