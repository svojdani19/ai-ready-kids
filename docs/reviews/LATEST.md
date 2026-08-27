# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 11 — content accuracy and activity safety

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-11.md`](2026-08-27-sprint-11.md)
- **Review trail:** sprints 01–11 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it;
  sprint 11 fixes two content defects found by reading two of the missions.

### What changed

1. **Fact and opinion, stated accurately.** "The Question With No Answer" said
   February had been "settled by somebody measuring", called an AI answer "the
   average opinion", and said confidence about a local question was
   "impossible". A fact is now defined as checkable against evidence, a rule or
   a record; February uses the calendar rule; the tool is described as
   assembling a general answer from patterns about a school it was never told
   anything about. The core lesson — local facts inform a judgement the child
   still has to make — is unchanged.
2. **The quiz mission no longer rewards carrying on.** Skipping the two
   account-recovery questions and finishing an unapproved quiz used to score
   full credit. Closing it and telling an adult is now the only `strong`
   answer; closing silently or skipping the field are `partial`. Its extension
   used to have children invent and swap security questions, which invites them
   to write the real answers — it now uses prewritten cards and says out loud
   that nobody supplies their own. The family prompt asks for categories, not
   examples, and a broken point of view in a teacher note is fixed.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **236 tests**, Turbopack build.
- Four new guards in `tests/content.test.ts` pin both fixes: the recovery-
  question scene's single `strong` choice and its escalation evidence, the ban
  on any extension asking students to author or swap security questions, the
  calendar-rule definition of a fact, and the absence of "average opinion" and
  "impossible" from student copy.
- Sprint 10's evidence and interleaving work is unchanged and still asserted:
  the retry-first walk across all 27 missions, and the ordering properties.
- Teacher preview checked in the browser; the corrected hierarchy renders as
  one Safe choice and two Partly there.

### Where this is most likely still wrong

- **Sixteen Sprint 09 missions have still had no human read.** Two were read
  and both had findings. Assume the rest do too. This is the highest-value
  place to look next, and it is not something the suite can do.
- **No general guard against factual error exists, or can.** The new tests pin
  four specific claims. Nothing stops the next mission asserting something
  false.
- **The eight legacy forced-award scenes remain**, and their interaction with
  the coaching rule is still untraced.
- **Stickiness keeps aggregate demonstration rates near 95%.** Whether a
  teacher reads that number the way it is meant is a question for a teacher.
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
