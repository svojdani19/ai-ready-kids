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
- [ ] **Every evidence-awarding scene has at least two ways out.** If a scene
      has one exit, every child who finishes takes it, so taking it records
      completion rather than skill. Enforced by `validateMission`, but check the
      spirit too: the second exit has to be genuinely defensible, not a decoy.
- [ ] **A guard for a shape is written as a shape.** Banning the four exact
      phrases you found pins those four. If the finding is a pattern — a public
      correction, an unearned conclusion, an escalation that stops — express it
      over `MISSIONS` so it can catch the instance you have not read yet.
- [ ] **Teacher guidance never corrects one child in public.** Read every
      coach note and misconception response as instructions a real teacher will
      follow literally. Advice to interrupt a belief publicly, or to respond to
      one child's low number in front of the room, singles out a child for
      something that usually tracks a learning difference or what is happening
      at home. Say it privately, or normalise the range without naming anybody.
- [ ] **No promised timelines.** "It stops being hard surprisingly quickly",
      "the habit sets in within days", "practise four nights and you will know
      them" — the content cannot keep these. For the child they fail, the
      promise converts into evidence that something is wrong with them. Say
      what practice does, then say that how much and how fast differ, and give
      the child who is still stuck somewhere to go.
- [ ] **A check that runs through a person is checked for who it
      disadvantages.** When the answer depends on knowing somebody, on how they
      behave under scrutiny, or on what they can demonstrate on request, ask who
      that fails. Shy children, children who find talking hard, children still
      learning the language, disabled children and children with less at home
      all lose on that kind of test, and never because they did anything wrong.
      Prefer a question every person is asked the same way.
- [ ] **Suppression counts the people who contributed, not the people who
      could have.** A rate over one child in a school of thirty is a disclosure
      however many are enrolled, and in a grade 2-4 school somebody can usually
      work out who. Check what the threshold is applied to, and deduplicate
      across groups before applying it. Suppress the raw counts beside the rate:
      "1 of 1" says exactly what the percentage would have.
- [ ] **A structural change sweeps the documents that describe the structure.**
      Tripling the curriculum and reordering it left the educator module still
      telling teachers it was nine situations, for eleven sprints. When the
      shape of the product changes, grep the guide, the orientation, the
      marketing copy and the benchmark for the old shape.
- [ ] **The metric matches what the system actually knows.** If a check is not
      gated, completion is what happened and completion is what gets reported.
      Naming it certification tells a principal their staff understood the
      material, when the only fact held is that buttons were pressed.
- [ ] **A fix in one place is swept everywhere that logic lives.** When a
      rationale is removed from a mission, search the benchmark, the
      certification modules and the marketing copy for it too. A belief scored
      as correct in an assessment is worse than one taught in a mission: the
      mission can be corrected, while the item marks a child down for not
      holding it and then reports that as evidence.
- [ ] **The instrument's claims match what it can support.** One item per
      skill, forms nobody piloted, and no equating means the output is the
      difference between two authored check-ins — not growth, not transfer.
      Name the fields for what they are, because a field called `growthPoints`
      reintroduces the overclaim in the next surface somebody writes.
- [ ] **A privacy statement addressed to a child is still a privacy
      statement.** "Your teacher only uses this" has to be true of every adult
      who can reach the result, including through reports and exports.
- [ ] **Every promise is a test case, not the one being edited.** Sprint 23
      asserted the suppression thresholds and left the sentence beside them —
      administrators see aggregates only — with no code behind it at all. When
      a page makes several claims, enumerate them and check each one, because
      the one you are looking at is the one least likely to be wrong.
- [ ] **A secret's size is part of its security.** Enforcing a credential
      correctly and the credential being worth anything are separate questions,
      and fixing one reads as having fixed both. When a sprint hardens the path
      to a secret, ask in the same breath how many values it has and what one
      guess costs. Sprint 27 made the class code enforceable while it was still
      13,500 values wide.
- [ ] **A date the product shows has a job behind it.** Do not call something
      scheduled, or say data disappears on a date, unless something runs. If
      the mechanism exists but nothing triggers it in this build, say that in
      the product, in the words a school will read.
- [ ] **An exported server action is a route.** Read every one against what
      the product claims, including the ones nothing calls. Unreferenced makes
      a mutation more suspicious, not less: nothing exercises it, no test
      covers it, and no browser check can see it. `replayMission` was wired to
      no button and deleted a child's badge and evidence.
- [ ] **A foreign key is not an authorization check.** It proves a row exists.
      It does not prove the user is a teacher, that the student is on this
      roster, or that either belongs to this school. Where an id arrives from a
      form, resolve it and check what it is.
- [ ] **Existence is not sequence.** Checking that a scene, a choice, an item
      or a form is real is not checking that it is *next*. Where the product
      claims an authored order — and this one's entire safety case rests on
      that — the server derives the expected step from stored state and refuses
      anything else. A player component enforcing it is a suggestion.
- [ ] **Invariants live at the boundary, not in the caller.** An action is one
      caller. Put the rule in the repository or the domain function every path
      goes through, then the next surface somebody adds inherits it instead of
      having to remember it.
- [ ] **A test that constructs an impossible state proves nothing.** When a new
      invariant turns tests red, ask first whether they were describing
      something a user could actually do. Six here had been green for
      twenty-eight sprints while fabricating attempts no child could make —
      the fabrication was the missing rule, written down and passing.
- [ ] **Existence is not entitlement.** Nearly every check in this product
      asked whether a record exists — a real class, a real student, a shipped
      mission, a valid form — and none asked whether the caller was entitled to
      it. That reads like authorization until somebody types a URL. For each
      check, say out loud which one it is.
- [ ] **A credential has to leave something behind.** If the product tells
      families that a code protects something, entering it must produce a
      signed, scoped, expiring grant that the next page and the next action
      each verify for themselves. A code checked and discarded protects
      nothing, and the page rendering the buttons is not the endpoint.
- [ ] **Commercial framing needs state behind it.** "Fall and spring windows"
      is what makes an annual subscription coherent, and there was no field, no
      date and no rule anywhere behind it. Where a word is load-bearing,
      either build what it names or stop using it.
- [ ] **Ask what a role may do, not what a record belongs to.** Access control
      here was tested as "same school" throughout, which is a fact about the
      schema. Authorization is a fact about people: which role, acting on whose
      class, may read a roster and which may only manage the class as an
      object. A link removed is not a permission; server actions are public
      endpoints whatever the UI renders.
- [ ] **A promise in the prose is a test case.** Where the product tells a
      school what it will not show, assert that against the code that decides.
      A sentence in an export is a commitment, and it is the kind that goes
      stale silently when the calculation underneath it changes.
- [ ] **A correctness fix does not carry a privacy fix with it.** Changing what
      a number means changes who it identifies. Re-read the guard in the same
      breath as the arithmetic.
- [ ] **Every reported number states what it divided by.** A rate over "the
      students who met this skill" and a rate over "the class" are different
      claims, and only one of them is usually true. Check the denominator in
      the code, not in the doc comment — a comment that disagrees with its
      implementation is itself a finding.
- [ ] **A metric that only moves one way cannot recommend anything.** Sticky
      lifetime evidence saturates by design, so it can say what a child has
      ever done and never what a class needs next. If a surface makes an
      instructional claim, check that the number behind it can fall.
- [ ] **No activity accumulates a record of children.** Read every extension
      as a thing a teacher will actually run for a week. A tally of who got
      stuck, how often, and what they reached for is behavioural tracking, and
      paper does not make it something else. Noticing in the moment is fine;
      keeping a register is not. Prefer anonymous, teacher-authored sorts and
      votes where nothing is written down.
- [ ] **A category the child must pick from means one thing.** Overlapping
      labels turn a decision routine into a vocabulary test — if a book, a
      calculator and an AI system are all "a tool", the choice is not about
      strategy any more. Name the route precisely, say what can be used at all
      of them, and say whether they can be combined in sequence.
- [ ] **Status copy describes the state, not a history it cannot know.** Check
      every way a status can be produced before writing a sentence about how
      the child got there. `developing` arrives from a first-go partial choice
      and from a coached recovery, and the page cannot tell them apart — so
      "you worked these out after a Try again" told a child who chose
      thoughtfully that they had needed correcting.
- [ ] **A sentinel answers one question, not two.** `null` meaning both
      "absent" and "nothing there" is how sprint 34's defect worked: an
      existing database with no version row read identically to a brand-new
      file. Where a value has to distinguish more than two situations, give it
      a type that can, and let the compiler insist every case is handled.
- [ ] **Unrecognised state fails closed.** Refusing to open a file leaves the
      data where it is and lets a person look at it. Guessing, stamping, or
      half-applying leaves something that claims to be fine and is not. Say
      what was found and what to do about it, starting with taking a copy.
- [ ] **A schema change ships with a migration.** `CREATE TABLE IF NOT EXISTS`
      creates missing tables and does nothing about missing columns, so a new
      column without a migration is an existing database that stops working.
      The version must be **read** before it is written: one that is stamped
      rather than checked is worse than none, because it makes an out-of-date
      database claim to be current.
- [ ] **A migration never guesses a date that could delete something early.**
      Where the old data cannot say, record nothing and block the operation
      until an adult supplies it. Unknown is not the same as due.
- [ ] **It still works the second time.** Run the year forward. A product sold
      annually needs a second cohort, an archived year, and an August in which
      last year's classes are finished and this year's do not exist yet. Every
      test here ran against one seeded school year for thirty-one sprints, and
      the passage of time had simply never happened.
- [ ] **Two ideas are not sharing one field.** Where the interface describes
      something the code does not store — the last day of school when the
      column holds an invoice date, ownership when it holds school membership —
      the two usually coincide in the demo and diverge in a real school. Read
      the label, then read the column it comes from.
- [ ] **The routine school operations work.** Somebody leaves in June, somebody
      arrives in September, a class changes hands. Walk those through as a real
      administrator would. A product can be honest and safe and still make an
      ordinary Tuesday impossible without deleting a child's records.
- [ ] **Every child can give the full-credit answer.** Read the strong choices
      and ask who cannot honestly pick one. A child in foster care, an unstable
      home, or a household where an adult is the problem must not be recorded
      at `developing` for answering truthfully. This matters more here than in
      ordinary content, because the evidence model reports it: a scored answer
      a child cannot give turns their circumstances into what a dashboard shows
      as a skill gap. Never score the size of a child's support network, and
      always leave a route that does not run through home.
- [ ] **Nobody is exonerated by category.** Check every place the content
      implies a person is safe, honest or in the clear because of who they are
      — a familiar adult, a teacher, a friend, a parent. Warmth in a mission
      makes this easy to write and hard to see. A child who learns that people
      they like could not have done a thing has learned something that may stop
      them speaking up later, and that outweighs whatever the mission was
      teaching.
- [ ] **The reason that earns credit is the durable one.** It is not enough
      for the right choice to win; check *why* it wins. A correct answer
      resting on a wrong reason — a technical claim that will not hold, a
      conclusion the evidence does not reach — teaches the reason, not the
      answer. Ask what happens to the child's rule when the reason fails.
- [ ] **Walk every path into a shared scene.** Where several choices lead to
      the same next scene, check that what earns mastery there is *true* for
      each of them. A disclosure scene is the usual place this breaks: a child
      who kept an answer and a child who took a hint cannot honestly say the
      same sentence, and the graph will happily let them. Reachability tests
      will not catch it. Trace the branches by hand.
- [ ] **The verdict is no wider than what was checked.** Where a mission
      settles one thing, make sure it does not quietly claim the neighbouring
      thing too. Two artefacts checked to different depths get reported
      separately, in the words that were actually earned, and "we could not
      find out" is a legitimate place for a mission to end.
- [ ] **The guide is not the mission.** A discussion guide can state the right
      principle while the scenes teach the opposite, and the evidence awards
      follow the scenes. Read what the child does and what it records, not what
      the setup says the mission is about.
- [ ] **The ending does not act out the error.** Read the resolution as a
      story. A mission can teach one thing in its feedback and the opposite in
      what the characters go on to do.
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
- [ ] **The instructions are re-read when the capability changes.** Adding a
      safe way to do something does not remove the old advice about doing it
      the unsafe way. When a sprint adds a capability, grep for every sentence
      that told somebody to work around its absence, and delete each one.
      Prose is not documentation of the code, it is part of the product, and it
      goes stale silently.
- [ ] **An activity never requires the hazard it teaches about.** The tell is a
      preparation step: when a lesson asks the teacher to *bring* the material,
      ask what the material is. Real student photos, real names, real
      schedules and real work do not go on a projector to demonstrate why they
      are sensitive. Author the material instead — invented cards cost a few
      hundred words and remove the sourcing, the consent question and the
      exposure at once, and let the clues be graded and one case be a clean
      decoy, which real material never reliably is.
- [ ] **Runtime context is part of an API's contract, and types do not carry
      it.** A cookie write, a redirect, a revalidation: each is legal in some
      contexts and not others, and the same call compiles identically in all of
      them. When moving a call between a Server Action, a Server Component and a
      Route Handler, check what that context permits — and walk the path that
      actually runs it, in the state that triggers it. Two passes that both
      avoid the defect are the same pass twice, not coverage.
- [ ] **An inventory is only as good as its descriptions.** A test that
      compares a hand-written classification against the code can only check
      that something was classified, not that the sentence is true. Where a
      description carries a safety property, read it against the behaviour, not
      the name — and in a multi-step flow give every step its own answer, since
      the gate belongs at the write and not at the entrance.
- [ ] **Where the output is the interface, reading it is the test.** Verifying
      that a mechanism holds is not the same as verifying that the program says
      something coherent about it. Run the command and read every line together:
      a correct block under an incorrect all-clear is still a lie. A transcript
      pasted into a review is a claim, and deserves the same scepticism as any
      other — especially your own.
- [ ] **A shared shell has more than one reader, and a recovery route is only
      recovery if the reader can take it.** Check any call to action against the
      audience as well as the condition: a link gated by role is a dead end for
      everyone else. And when new copy is added beside old copy, the old copy is
      part of the new message — read the whole box, not the sentence you wrote.
- [ ] **When a rule says "we will not invent X", check whether the fallback
      invents not-X.** Refusing to act on missing data is a decision; so is
      continuing to act on it. A default that looks like restraint — "we won't
      assume it lapsed" — may be asserting the opposite with equal force. If
      neither answer is verifiable, say so as a third state.
- [ ] **When checking copy against a mechanism, the unit is the branch.**
      Grouping strings by what they *say* hides the fact that they answer to
      different conditions: two sentences making the same claim can be true for
      one `if` and false for another on the same page. Trace each string back to
      the branch that renders it before clearing it.
- [ ] **On a broken-state screen, write a description, not reassurance.**
      "Nothing has been deleted, nothing has changed" calms the reader and makes
      two factual claims — one about the past you cannot check, one about scope
      that may contradict a mechanism still running. Say exactly what is
      blocked, what still proceeds, and keep claims about the past out of it.
- [ ] **When a value is narrowed on its way to a component, ask what the
      component inferred from the width it used to have.** Sanitising a bad
      value to `null` can collapse two states a screen was distinguishing —
      "never recorded" and "unreadable" — and the sentence it then produces is
      still grammatical, so nothing fails. Carry the status explicitly rather
      than letting a component re-derive cause from a cleaned value.
- [ ] **A fix for old records needs a fixture written the way the old code wrote
      them.** Building the test from the new invariants exercises a database
      that could only exist after the fix, and the legacy shape never appears.
      Ask what the broken writer actually stored, then construct that.
- [ ] **An Invalid Date is worse than no date, and a cooperative sentinel is
      worse than a refusing one.** A missing value announces itself and trips the
      emptiness checks you already wrote; `new Date("2026-13-45")` passes them,
      renders as text, and compares false against everything — so it looks like
      a schedule while answering "never" to the one question that matters.
      Validate into `null`, never into a value that participates.
- [ ] **A string comparison is not a date comparison.** Lexicographic order on
      unvalidated text silently picks a winner, and the winner flatters whichever
      side the malformed value happens to sort on. Validate the shape before
      comparing, and ask which way a bad value would fail — one direction is
      found in a day, the other runs for years.
- [ ] **When output is derived from a shared object, audit the object, not the
      view.** A page renders a chosen subset; an export serialises everything.
      Fixing what the screen shows leaves the download untouched, and a comment
      asserting a property of the rendering path is not a guarantee about the
      export path. Ask what is *in* the object, then what each surface does
      with it.
- [ ] **Make the invalid state unrepresentable, and let the compiler find the
      callers.** A guard protects the paths you remember; a type protects the
      ones you do not. Where a stored value can be meaningless, do not hand
      callers a number with no way to know — discriminate the result so the
      absent case has no field to read, and follow the type errors. That list is
      longer and more honest than the one you would have written.
- [ ] **Ask which columns feed something irreversible.** The danger of a value
      is not how likely it is to be wrong but what happens when it is. Trace
      every unconstrained field into the operations it drives, and validate
      hardest where the result cannot be undone — deletion, purge, cascade. A
      wrong number that leaks revenue and a wrong number that destroys a child's
      records have the same shape and are not the same bug.
- [ ] **`??` on an entitlement lookup is a grant with a default's syntax.** For
      any limit, quota or permission read from data, ask what an unrecognised
      value produces. A coalescing default answers "when we cannot tell what
      you bought, assume the most generous option". Fail closed instead, and use
      a value that cannot be confused with unlimited.
- [ ] **A limit and its label must come from the same source.** Two independent
      expressions about one fact will disagree, and each can look defensible
      alone — a ternary needs a final branch, a lookup needs a fallback. It is
      the pair that lies. Derive the display name and the enforced limit from
      one map, and make a missing key fail both.
- [ ] **A price with two numbers in it needs two enforcements.** "One classroom,
      up to thirty students" is a conjunction, and it is easy to enforce only
      the half that is simple to count. For every public plan claim, name each
      quantity it promises and find the code that refuses when it is exceeded —
      then bind the words and the limit together in a test, or one of them will
      move alone.
- [ ] **A stored fact that nothing reads means nothing.** For any field the
      product sells on — a term, a seat count, a plan, a window — ask what
      refuses when it is exceeded or expires. If the answer is "a label
      changes", the promise is not real. And an honest admission in the
      interface is not a substitute for the behaviour: a documented gap becomes
      furniture faster than a hidden one.
- [ ] **A control must be able to do what its label says.** Check every button
      that stays live during an async operation: can Cancel still cancel, can
      Undo still undo? A control that cannot is worse than its absence, because
      it converts the moment a user reconsiders into false reassurance. When an
      operation becomes uncancellable, say so and take the control away — a
      disabled button still reads as one that might come back.
- [ ] **Covering the screen is a visual act; the tab order does not know about
      paint.** Any `fixed inset-0` overlay needs modal semantics, focus kept
      inside it, and focus handed back to whatever opened it. The gap is
      invisible to whoever built it — you cannot see focus land on a control the
      overlay is covering — so it has to be tested, not looked at.
- [ ] **Accessibility does not inherit across a breakpoint.** A responsive
      variant is a separate implementation. When a keyboard, focus or labelling
      fix lands on one side of a media query, check the other: the question is
      not whether it was in scope, but whether it is now worse by comparison.
      The same control must not be operable at one width and not at another.
- [ ] **A dismissal says where focus went.** For anything closable — menu,
      overlay, two-step confirm, dialog — ask not only "is it shut?" but "where
      is the user now?". Escape should return focus to the control that opened
      it; every other close should leave focus where the user put it. A close
      that hides the focused element strands keyboard and switch users, and is
      invisible to anyone testing with a mouse.
- [ ] **Shared chrome is copy, and a claim retired in a feature can survive in
      the navigation.** When a sprint removes a word, sweep the header, footer
      and marketing pages, not only the module that prompted it — and point the
      regression test at the surfaces a buyer reads rather than the constants
      that were already fixed. Desktop-only copy escapes review twice over.
- [ ] **A limit enforced at creation misses every path that reactivates.**
      Archive/restore, move, merge, transfer and import all put records into an
      active state without creating them. When a rule is added at one of these
      boundaries, list the others and check each: metering one side of a pair is
      metering nothing.
- [ ] **A commercial figure is owned by the vendor and enforced by the code.**
      If a customer can edit it, it cannot go on an invoice; if nothing reads it,
      it is a caption. Ask of any entitlement, quota or plan field: who writes
      it, what refuses when it is exceeded, and could both parties point at it a
      year later and agree what it meant.
- [ ] **A mitigation must not become the curriculum.** When an activity is made
      safe by constraining it — use an empty room, tidy the wall first, take it
      before school — check what the constraint teaches. If students see the
      mitigation, it is part of the lesson whether or not it was meant to be,
      and it can quietly train the opposite of the mission's skill.
- [ ] **Specificity about a hazard is not safety from it.** The strongest form
      of the activity-contains-the-hazard defect looks like the most thorough
      version of the lesson: an author naming exactly what to look for — "names
      on trays, timetables, a rota with home details" — reads as rigour and is
      the sentence that turns the activity into the exposure. Ask what the
      teacher has to produce, not how carefully the prose describes it.
- [ ] **A shared scene is checked against every path into it.** List the
      predecessors, then read the scene once per predecessor. Any sentence
      about what has already happened — what an app knows, what the child
      said, what was agreed — has to be true on all of them, or be framed as a
      hypothetical. This matters most where the scene records evidence, because
      that turns a click into a claim about a child.
- [ ] **No instruction routes a routine task through a destructive one.**
      Rotating a credential, correcting a name, reopening a form: these happen
      in ordinary weeks. If the answer the product gives is "delete it and make
      a new one", that is a data-loss defect wearing the costume of a help
      note — doubly so when the delete button is on the same screen.

- [ ] **A reassurance is a claim about the whole system, not about the
      feature that prints it.** "Nothing has been deleted" written on a
      subscription notice is a promise about every deletion path in the
      product — the scheduled purge, the admin delete button, the retention
      schedule — and a term gate can only speak for the writes it blocks. Say
      causally what this state does and does not do ("this does not itself
      delete or hide anything"), and let the other paths keep their own copy.
      The test for it: name every mechanism that could falsify the sentence,
      and check the gate actually covers each one.

- [ ] **A date the product computes is not an event the product performs.**
      "Due on June 12" is a state the code can guarantee; "deleted on June 12"
      is an event that depends on a job somebody else schedules. Copy that
      collapses the two tells an administrator a cohort is gone when a missed
      cron has left it sitting there. Name the actor and the trigger — "deleted
      the next time your deployment runs the purge job" — wherever the product
      cannot promise the clock.

- [ ] **A risk conclusion is not a security control.** "Nothing worth
      stealing", "as much security as this data warrants", "proportionate" —
      each of these replaces a description of what an attacker reaches with an
      assurance that it does not matter. Read them against what the code
      actually hands out: here, a class code returned a roster of children's
      names and a session as any one of them. Describe the boundary and the
      mitigation, and let the buyer draw the conclusion.
- [ ] **An absolute inventory has to be generated or tested, never written.**
      Two pages each said "the complete list" over two different lists, and
      neither matched the schema. If the word "every" is on a buyer-facing page,
      something in CI must fail when a column is added — otherwise the claim
      decays silently at the next migration, and the surface that decays is the
      one a school reads before signing.

- [ ] **Removing a risk conclusion means removing it, not narrowing it.** The
      replacement for "nothing worth stealing" was "enough for a supervised
      pilot where an adult is in the room" — the same judgement with
      qualifiers, and the qualifiers were not controls. Say what the build is
      and who decides the rest; a deployment posture the vendor grades is still
      a vendor assurance.
- [ ] **An inventory entry must describe what the code does with a field, not
      what the field is for.** A column written by an INSERT and read by
      nothing was documented as existing "so an administrator can see when a
      record entered the system". Trace each field to a route or a calculation
      before writing its purpose; where there is neither, that absence is the
      honest entry.

- [ ] **A rights claim is checked against the statements, not the prose.** "A
      school can delete everything at any time" is a claim about which DELETEs
      exist. Enumerate them — including what only a developer script can reach —
      and write the copy from that list. The same method applies to export,
      archive and every other verb a buyer might rely on.
- [ ] **An assurance nothing enforces is a defect, not a description.**
      "Nothing here names a student" was true only because no form happened to
      call a parameter that wrote arbitrary text into an unconstrained column.
      Where the promise matters, close the write path so the schema enforces it;
      where a column must stay, say it is unused and that an older database may
      hold values, rather than promising what its contents will be.

- [ ] **A test that queries through the thing it deleted proves nothing.**
      Counting child rows with `WHERE parent_id IN (SELECT id FROM parents
      WHERE ...)` after the parent is gone returns zero by construction, so an
      orphan survives the cascade *and* the assertion. Capture the ids before
      the destructive call and query against those literals, and assert the
      before-state is non-zero so the test cannot pass by deleting nothing from
      nothing.

- [ ] **Revoking a credential must reach the sessions it already bought.**
      Rotating a class code invalidated new joins and half-finished grants but
      not sessions already issued, because the session recorded *who* was signed
      in and not *what let them in*. When a product names an action as the
      recovery for a leak, enumerate every artefact that action has to
      invalidate, and check each one — a credential store that only guards the
      front door leaves everyone already inside.
- [ ] **Containment copy must name the moment, not the feeling.** "Stops working
      immediately" implies real-time control no server-rendered app has. Say
      when the check actually runs — "rejected on the next request" — and say
      plainly what it cannot reach, such as a page already open on a screen.

- [ ] **A flow is verified at a width only if it was driven at that width.**
      Checking a page's copy at 768×1024 and driving its interaction at 1280×800
      is two different pieces of evidence, and reporting them together reads as
      one. Say which width each run used, and never summarise "checked at both"
      unless both were exercised end to end.

## Recording a review

Write the review to `docs/reviews/<date>-sprint-NN.md` using the same
structure: what was reviewed, what was found, what was changed, and what was
deliberately left. Findings that were not fixed must say why, so the next
sprint inherits the decision rather than rediscovering the defect.
