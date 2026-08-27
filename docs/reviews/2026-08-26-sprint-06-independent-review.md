# Independent review of Sprint 06 — 26 August 2026

Reviewer: Claude Code, at the user's request. Sprint 06 was authored by Codex.
This is a second opinion on that sprint, not a replacement for
[`2026-08-26-sprint-06.md`](2026-08-26-sprint-06.md).

**Method.** Read the diff against `HEAD` (`7f35acf`). Traced every scene's
tone, evidence award and non-looping exit count across all nine missions by
walking the authored graph. Seeded a throwaway database under the new content
and compared its evidence distribution against the one on disk. Played the
changed decision in the real player at 768×1024 and compared branches in
Classroom Mode at 1280×800. Ran `npm run verify`, and ran the Turbopack build
three times to test the stated reason for the bundler change.

**Verdict.** The pedagogy is right and well executed. The evidence hierarchy it
introduces does not reach the evidence data, so the original complaint is
substantively unfixed. One infrastructure change appears unnecessary.

---

## Confirmed good

- **The diagnosis is correct and the prose fix is strong.** *"A clue, not
  proof"* is a better headline than anything it replaced, and *"Odd shadows can
  happen in real pictures, and made-up pictures can have perfect shadows"* is
  the actual insight, stated plainly.
- **Scope discipline.** The content diff touches Mission 5 and one shared label.
  Nothing else in the curriculum moved.
- **No stale references.** *Sharp Eyes* survives only inside prose in
  `LATEST.md`, correctly, as a description of what was replaced. The old skill
  labels appear nowhere. The badge id and skill id were both left alone, so no
  stored record was orphaned.
- **The benchmark already agreed.** Both transfer items for `verify.synthetic`
  were already provenance items — `pre-5` asks *"Who filmed this, and was
  anybody actually there?"*, and `post-5` puts artefact inspection (*"Listen
  again to see if the voice sounds right"*) in the distractor slot. Sprint 06
  brought the mission into line with a benchmark that was already correct,
  which is the right direction of travel.
- **The extension replacement is the best single change in the sprint.** Asking
  children to guess real-versus-generated from appearance trains the exact
  habit the mission argues against. Replacing it with source questions over
  familiar classroom images fixes a contradiction, not just a wording.
- **Renders correctly.** Verified at 768×1024 (student, *ALMOST / A clue, not
  proof*) and 1280×800 (Classroom Mode branch compare: A *Safe choice*,
  B *Partly there*).

---

## Finding 1 — the new hierarchy never reaches the evidence data

**The demotion of the two artefact answers changes what a child reads. It
changes nothing a teacher sees.**

Scene `s5` has exactly one non-looping exit. Its other two options are
`rethink`, which loop back by design. That single exit awards
`verify.synthetic: demonstrated`. Because evidence is sticky and every
completer must pass through `s5`, **every child who finishes Mission 5 earns
full synthetic-media evidence regardless of what they chose at `s3`.**

Measured, not argued:

- A fresh seed under the new content produces **65 of 65** Mission 5 attempts
  at `demonstrated`, `0` developing — byte-identical to the distribution before
  the sprint.
- Played live: a student who chose `s2/c2` (*what kind of penguin is it?*),
  then `s3/c3` (the demoted layout clue), then a wrong answer at `s5` before
  being funnelled into its only exit, finished with
  `{"verify.synthetic":"demonstrated"}`.

That child never once chose provenance reasoning where a real alternative
existed. The teacher's class page will nonetheless report them as having
*"Checked who made or saw a picture or voice"*.

So the sentence that opened the sprint — *Mission 5 awarded full synthetic-media
evidence for pixel clues* — is still true. The award simply moved from `s3`
to `s5`.

### This is not Sprint 06's bug, and it is bigger than Mission 5

The pattern is systemic and predates this sprint. Across the nine missions
there are **nine scenes with a single non-looping exit, and all nine award
`demonstrated`.** Walking every mission taking the *weakest* available option
at every decision still earns the mission's primary skill in **all nine cases**:

| Mission | Skill earned by a child who reasons badly throughout |
| --- | --- |
| Sprocket Wants to Know | `privacy.identity` |
| The Filter That Wanted More | `privacy.media` |
| The Question at Bedtime | `privacy.escalate` |
| The Very Sure Answer | `verify.confidence`, `verify.source` |
| The Penguin on the Playground | `verify.synthetic` |
| Two Answers, One Truth | `verify.source` |
| The Homework That Did Itself | `own.effort` |
| Four Doors | `own.toolchoice` |
| The Spelling Test Surprise | `own.honesty` |

**This is the downstream reporting assumption that was missed.** The class page
says skills are counted *"from the choices they made"*. The school report calls
its section *"Competencies demonstrated"* and describes it as the share of
possible skill demonstrations achieved. For every mission's primary skill, that
number is arithmetically identical to *completed the mission* — which the
teacher already reads in the adjacent column. It is not a second signal.

### Suggested direction, not a patch

The clean rule is: **a scene with only one non-looping exit cannot be
evidence.** Every completer picks it by construction, so it measures
attendance. Evidence should come only from scenes where the child had a real
alternative and declined it. That would leave Mission 5 discriminating at `s2`
and `s3`, which is exactly where Sprint 06 put the pedagogy.

It is enforceable in `validateMission` and would fail loudly on all nine scenes
today, so it should be a deliberate decision rather than a quiet fix. I have
made no code change; this is the reviewer's recommendation.

---

## Finding 2 — three words above the reading level, in new copy

The developmental question was asked directly, so: the *structure* is sound and
the *vocabulary* slips in three places, all newly introduced.

- **"That mismatch is worth checking."** *Mismatch* is a tier-2 academic word.
  Nothing else in nine missions asks a seven year old to parse it.
- **"a real photo can also be flipped or cropped."** *Cropped* is editing
  jargon. A child who does not know it loses the whole clause, which is the
  clause carrying the argument.
- The crossed contrast in *"Odd shadows can happen in real pictures, and
  made-up pictures can have perfect shadows"* is the hardest sentence in the
  corpus. It is also the most important one, so it earns its difficulty — but it
  asks a child to hold two counterexamples at once to defeat a heuristic, which
  is a lot at this age. Worth reading aloud to an actual eight year old before
  it ships to one.

Concrete alternatives in the register the rest of the corpus uses: *"That looks
wrong for our playground, so it is worth checking."* and *"a real photo can be
turned around or have its edges cut off."*

The existing reading-level test would not catch any of these: it caps sentence
length at 32 words and says nothing about vocabulary. That gap is worth naming
even if nobody closes it, because it is why three hard words landed in a sprint
that verified green.

---

## Finding 3 — the bundler change looks unnecessary

`build` was switched from Turbopack to `--webpack` because Turbopack
*"repeatedly failed on its local CSS worker port"*.

I could not reproduce it. Turbopack built cleanly **three times out of three**,
exit 0 each time, including with the dev server running on 3210 — which is the
most likely source of the original port contention.

Both bundlers work, so nothing is broken either way. But this permanently moves
the project off Next 16's default bundler on the strength of a transient local
failure, and the divergence is the kind that is discovered much later by
somebody debugging a build difference. Keeping `build:turbo` as an escape hatch
was sensible; my recommendation is to invert them — Turbopack as the default,
webpack as the documented fallback — or, if webpack stays the default, to say
in `package.json` or the README why.

It is also, as the sprint author noted, unrelated to a content sprint.

---

## Housekeeping

`docs/reviews/2026-08-26-sprint-05.md` was swept into commit `7f35acf` by a
`git add -A` in my own Sprint 04 handoff commit. Codex's Sprint 05 work is
therefore recorded under a Claude commit message. Nothing was lost or altered;
noting it so the history is not misread later.

## Standing constraints — all intact

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Sprint 06 touches none of these, and the extension change
strengthens the authored-practice niche rather than diluting it.
