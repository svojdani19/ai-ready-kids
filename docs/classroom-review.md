# The classroom review

**Standing requirement.** No sprint on AI Ready Kids is complete until a
classroom-centered product and UI review has been run *and its findings have
been fixed*. A review that produces a list and no commits has not been done.

The order matters: build, then review, then fix, then declare the sprint
finished. Reviewing at the end of a sprint and deferring the fixes to the next
one defeats the purpose, because the defects this review catches are exactly
the ones that never feel urgent — a target that is four pixels too small, a
paragraph a seven year old cannot decode, a screen nobody can read from the
back row.

## The question every feature has to answer

> Does this help a seven to ten year old build **calibrated trust** and **safe
> habits** around AI, and prepare them to use it responsibly later?

Three ways a feature can fail that question while looking finished:

- **It entertains instead of teaching.** Engaging is necessary; it is not the
  goal. If the fun part and the learning part can be separated, children will
  separate them.
- **It teaches tool operation instead of judgement.** "Where the settings
  button lives" expires in a year. "Ask who would actually know" does not.
- **It teaches avoidance instead of calibration.** A child who concludes that
  everything on a screen is a lie has not been made safer, only less reachable.
  Every doubt we raise must be paired with a destination.

## Part 1 — Teacher-led group instruction

Run the feature on a projector or interactive board. Stand at the back of the
room, or at least the back of your office.

- [ ] **Legible from the back.** Body text scales with the viewport, not a
      fixed pixel size. Read it from roughly four metres away.
- [ ] **Teacher preview and control.** The teacher can see what is coming
      before the class does, and can move at the room's pace rather than the
      software's. No forced timings, no autoplay.
- [ ] **Branch reveal.** In a group, "what would have happened if we picked B?"
      is the highest-value question in the room. The teacher can answer it
      without a child having to choose wrongly on purpose.
- [ ] **Whole-class prompts.** There is something for the room to do together —
      hands up, turn and talk, a vote — that needs no student devices.
- [ ] **Transitions are obvious.** Where we are, what is next, and how to get
      back. A teacher losing their place in front of thirty children is the
      failure mode to design against.
- [ ] **Notes stay off the board.** Anything written for the teacher is hidden
      by default and toggles away in one keystroke.
- [ ] **Driveable without a mouse.** Arrow keys and space at minimum. A teacher
      facilitating from the front should not have to hunt for a small target.
- [ ] **Driveable without a keyboard.** Run the whole flow by tap alone. Many
      interactive boards have no keyboard attached, so any capability that
      exists only behind a keystroke does not exist in those rooms.
- [ ] **Controls that mean different things look different.** Two rows of A/B/C
      buttons that do unrelated jobs will be confused under classroom pressure.
- [ ] **Nothing is recorded.** Group instruction is teaching, not assessment.
      What a room shouts out is not data about any child in it.

## Part 2 — Independent grade 2–4 use

Run the same feature on a Chromebook and a tablet, at 1366×768 and 768×1024.

- [ ] **Reading load.** Short sentences, common words, no abbreviations, no
      parentheticals. Read every new sentence aloud; if you stumble, a child
      will.
- [ ] **Narration support.** Any screen with a substantial passage offers
      read-aloud. Check the densest screen, not the friendliest one.
- [ ] **Targets are at least 44px.** Including navigation, not just the big
      obvious buttons. Measure; do not eyeball.
- [ ] **No confusing states.** Every state says what happened and what to do
      next. No dead ends, no unlabelled spinners, no screen a child can reach
      and not leave.
- [ ] **Nothing consequential happens on one tap.** Anything a child cannot
      undo — recording an answer, finishing a measurement, leaving a screen —
      takes a deliberate second action, with the first showing a clear selected
      state. Accidental taps are the normal case at this age, not the edge one.
- [ ] **Nothing advances before it is saved.** Break the network and try it.
      A child must never move on while their work is still in flight, and a
      failure must leave them where they are, with what they chose still on
      screen and one obvious way to retry. School wifi drops; silent data loss
      in an assessment is undetectable afterwards.
- [ ] **Coming back works.** Close the tab mid-flow and reopen it, including
      after a failed save. A child must land where their work actually left
      off — never earlier, and never anywhere that invites them to redo or
      overwrite something already stored.
- [ ] **Nothing is claimed before it is recorded.** Badges, "all done", streak-
      free congratulations of any kind: if it asserts that something was
      written down, it does not appear until it was. Check the last step of
      every flow, not just the middle ones — completion is where a lost write
      costs the most and shows the least.
- [ ] **The exits are gated too.** A gate that holds the work but leaves an
      ungated way off the screen is not a gate. Check every link and button on
      the completion screen, including any inherited from a layout — and make
      sure a child is still never trapped, via persistent navigation rather
      than via the action that would lose their work.
- [ ] **Keyboard and touch both work.** Tab order follows the reading order;
      focus is visible; focus moves with the content when the content changes.
- [ ] **Focus is visible on the thing the child can see.** Any control whose
      real input is visually hidden — a card wrapping an `sr-only` radio or
      checkbox — must paint its focus ring on the visible element. Tab into it
      and look; do not infer it from the markup. The focused state must also
      stay distinct from the selected state when a control is both.
- [ ] **Feedback is calm.** No buzzers, no red X, no shame. A wrong choice
      explains and offers another go.
- [ ] **No addictive mechanics.** No streaks, countdowns, points-per-second,
      loss framing, leaderboards or anything that rewards returning rather than
      learning.
- [ ] **Reduced motion is honoured**, and the page is usable at 200% zoom.

## Part 3 — Applies to every review

- [ ] **Every factual claim in student copy is true.** Not plausible, not
      close enough for the age — true. A simplification a child will carry for
      years is a claim, so check the ones that sound like throwaway examples.
      No automated suite can do this; somebody has to read it.
- [ ] **Copy that is true of this case is also true as a rule.** Children
      generalise the sentence, not the situation. Watch for rankings that
      dismiss one private fact to elevate another, for a handful of examples
      described as proof, and for "always" and "never" and "nothing at all"
      where the honest word is "usually" or "not on its own".
- [ ] **The activity does not contain the hazard.** Read every extension and
      family prompt as a seven year old would follow it literally. An exercise
      about personal information must never ask a child to supply their own,
      and a lesson about declining must not award full credit for continuing.
- [ ] **Developmental appropriateness.** Concrete before abstract. A situation
      a child could actually be in, not a principle they are asked to accept.
      Warm without being babyish: this age group notices being talked down to.
- [ ] **Instructional clarity.** Can a teacher say, in one sentence, what this
      screen teaches? Can a child?
- [ ] **Technical durability.** Claims about permissions, sources and AI
      behaviour are scoped to what the child can observe in the scenario. The
      lesson teaches a checkable decision rule, not an absolute that will stop
      being true when an app, device or model changes.
- [ ] **Privacy.** Did this sprint add a field, a log, a timing, an export or
      an inference? If so, justify it against data minimisation or remove it.
      New columns are the thing to be suspicious of.
- [ ] **Accessibility.** Contrast at least 4.5:1 for body text, semantic
      headings and landmarks, real labels on every control, live regions for
      anything that changes without navigation.
- [ ] **Cultural inclusion.** Names and situations span more than one kind of
      family and household. Say "a grown-up you trust", not "your mum and dad".
      Check that nothing assumes a device, a bedroom or a car at home.
- [ ] **Teacher workload.** Count the clicks from "I want to teach this" to
      "it is on the board". If a step exists only to satisfy the software, cut
      it.

## Recording a review

Write the review to `docs/reviews/<date>-sprint-NN.md` using the same
structure: what was reviewed, what was found, what was changed, and what was
deliberately left. Findings that were not fixed must say why, so the next
sprint inherits the decision rather than rediscovering the defect.
