# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 30 — the credential was 13,500 values wide

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-30.md`](2026-08-27-sprint-30.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  sprint 25 the educator orientation. Every body of authored content has been
  read once. **Sprints 26-30 audit what the product *permits* and what it
  promises. Sprint 30 widens the class code from 13,500 values to 3.6 million,
  throttles guessing, allows rotation, and gives the retention date the job it
  never had.**

### What changed

1. **The class code was cheaply enumerable.** Sprint 27 made possession
   enforceable — grant, binding, expiry, spend-on-use — and never looked at the
   credential itself: **one word from a list of fifteen plus three digits,
   13,500 values, from `Math.random`**, checked by a public unthrottled action
   that searches every active class. One hit hands over a roster and then any
   child's session. It is now two distinct words plus three digits from a
   64-word list, drawn with `randomInt` — **3.6 million** — and still three
   chunks a child reads off a board, case- and punctuation-insensitive.
2. **Guessing costs something now.** Five free attempts, then doubling backoff
   to a sixty-second ceiling, cleared when somebody gets in. Deliberately not a
   profile: an in-memory counter and timestamp, nothing in the database, nothing
   surviving a restart, no identifier of a child near it. **Per process, which
   is exactly as good as one process** — the README says a deployment does this
   at the edge.
3. **Codes rotate.** A teacher can change one from the class page without
   deleting the class. The grant carries the code it was issued against, so
   rotating invalidates outstanding grants immediately, including one held
   mid-join. Audited.
4. **The retention date had no mechanism.** The page said "Scheduled purge" and
   "Deletes on", the privacy page said "deletion is a date", and the only thing
   that deleted anything was an administrator clicking a button — `eligibleNow`
   changed a label. **Both halves fixed**: `runScheduledPurge` deletes every
   class past its date with each roster, attempt and check-in and writes an
   audit entry, idempotent, comparing **dates in UTC**, entry point `npm run
   purge`. And the copy stopped calling it automatic: "Deletion due", "Due on",
   and a note saying *"Nothing in this build runs it on a timer... until it
   runs, records past the date are still here."*

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **419 tests**, Turbopack build.
- Credential: entropy and format, 200 draws essentially never colliding, no
  repeated word, still typeable. Throttle: free allowance, progressive backoff,
  block expiry, forgiveness on success, bucket isolation, nothing persisted, and
  exactly one "did not match" message so a guess never learns which kind of
  wrong it was. Rotation: class survives, roster survives, old grant unusable,
  missing class refused.
- Purge boundaries: nothing the day before, everything **at one minute past
  midnight UTC on the day**, cascades checked through attempts and check-ins,
  the audit entry, and a repeat run that deletes nothing and adds no audit
  noise. Plus a copy assertion that the page says "Deletion due" and does not
  say "Scheduled purge" or "when it disappears".
- Checked in the browser: a wrong code throttles after five tries with a
  distinct message, and `maple heron 317` still opens Room 12.

### Where this is most likely still wrong

- **Enforcing a credential correctly and the credential being worth anything
  are separate questions**, and fixing one reads as having fixed both. Sprint 27
  hardened every path to the class code while it was 13,500 values wide, because
  the finding was about possession and I audited possession. When a sprint
  hardens the path to a secret, ask in the same breath how large the secret is.
- **The limiter is per process.** Correct for this build, insufficient for a
  deployment, stated in the README rather than papered over.
- **Fifth instance of a word doing work the system could not support** —
  "certified" (25), "aggregates only" (26), "fall and spring windows" (27),
  "scheduled purge" (30). Two were fixed by changing the word, two by building
  the state. The test each time is which the product actually needs.
- **The route and action inventory is still not complete.** Three sprints
  running it has found something.
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Marketing prose is still mostly untested** — sprint 26.
- **Every mission has been read once. None has been read twice.**
- **Nothing checks what a wrong answer costs a child** — sprint 20.
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
