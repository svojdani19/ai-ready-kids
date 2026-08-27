# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 15 — checks that run through a person

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-15.md`](2026-08-27-sprint-15.md)
- **Review trail:** sprints 01–15 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 each fix content defects found by reading two more of the
  missions — ten read so far, ten with findings.

### What changed

1. **"The Perfect Drawing" no longer teaches peer profiling as evidence.** Its
   whole verification arc ran through what the child knew about Nia: "this does
   not match anything else she has made" earned `demonstrated`, "she probably
   practised" was a forced retry, and asking for rough drafts earned credit on
   the claim that real drawings leave a trail. None of that is provenance.
   Children improve fast, learn privately, change media, get legitimate help,
   use assistive tools, and bin their drafts — and the scene that asked Nia to
   demonstrate her technique assumed an honest artist would happily perform on
   request, which fails shy, autistic, multilingual and motor-disabled children
   first. **The universal process question is now the starting norm in scene
   one**, before the surprising entry exists. Concluding a classmate could not
   have made something is the retry; being surprised is `partial`; the only
   full-credit answer is that the form asks everybody, so nobody has to be
   guessed about. Disclosed tool use is still fine.
2. **"The Sleepover Screen" now completes operationally, not just socially.**
   Inventing a school earned full credit while the child's real name was
   already in the app — *substitute a detail and keep playing* as the privacy
   remedy. Closing the app is now the full-credit move and the made-up school
   is `partial`, with the note that it is something to agree with a caregiver
   in advance rather than improvise. Telling Bea earned mastery and changed
   nothing; the full-credit sentence now says what went in and asks for it to
   be removed, and a new scene shows Bea closing the app, deleting the
   character, saying she cannot tell what the app kept, and messaging the
   child's own grown-up. "I can say no and go home" is replaced by an action a
   seven-year-old can start: put the tablet down, be somewhere else in the
   house, ask to ring your grown-up, and never explain first.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **265 tests**, Turbopack build.
- Eight new guards in `tests/content.test.ts`, plus three phrases added to the
  brittle-absolutes ban list, which applies to every mission's student copy:
  `real drawings leave a trail`, `real work leaves a trail`,
  `she will show you, happily`.
- All guards from sprints 10 to 14 unchanged and still passing.
- Both missions checked in the browser at the teacher preview, including the
  restructured opening and decision scene of the drawing mission and the new
  operational scene in the sleepover mission.

### Where this is most likely still wrong

- **Ten Sprint 09 missions have still had no human read.** Ten read, ten with
  findings. The rate has not moved across five sprints of fixes.
- **Assume more than copy edits.** The last three sprints needed choices
  promoted and demoted, scenes inserted, endings rewritten, and in sprint 15 a
  mission restructured so its opening carried the norm.
- **Five shapes to hunt specifically:** a correct choice resting on a reason
  that will not hold; an ending whose story acts out the error the feedback
  warned against; a state the child reasons about that the mission never made
  observable; anyone treated as safe or honest because of who they are; and
  **a check that runs through a person** — knowing them, watching how they
  behave under scrutiny, asking them to demonstrate on request. The last one is
  now two instances in two sprints, and it fails shy, disabled, multilingual
  and less-resourced children first.
- **Escalation that ends at telling somebody.** Sprint 15 found one mission
  where speaking to a pleasant adult was the whole safety action. Worth
  checking the others: does anything actually stop, get removed, or reach the
  child's own caregiver?
- **No general guard against factual error exists or can.** The bans are
  literal phrases.
- **The eight legacy forced-award scenes remain**, and their interaction with
  the coaching rule is still untraced.
- **Stickiness keeps aggregate demonstration rates near 95%.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
