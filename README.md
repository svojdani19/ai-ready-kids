# AI Ready Kids

An annual school-subscription platform that gives students in **grades 2–4**
rehearsed practice at the decisions AI actually puts in front of them, and
gives their school something honest to report about it. The assessed program is
twenty-seven authored missions written and reading-levelled for that band, and
so are the check-ins, the nine-skill evidence and the school report.

It opens with **First Look**, an introduction for a class that has not been told
what AI is: six authored sessions in two tracks, of which a class runs the three
written for its grade — a grades 1–2 track, or a grades 3–5 track. A grade 1 or
grade 5 class can be created and taught First Look, and that is what it gets;
First Look records no skill evidence by design.

It is not an AI tutor, a chatbot, a coding course, or detection software. There
is no generative model anywhere in the request path: every word a child can
read was written by a person and ships with the build.

---

## Run it

```bash
npm install
npm run db:reset
npm run dev
```

Then open **http://localhost:3210**. No API keys, no `.env`, no Docker, no
database server. Persistence is SQLite through Node's built-in `node:sqlite`,
so there is no native module to compile either.

Requires Node 22 or newer (developed on 24).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3210 |
| `npm run db:reset` | Rebuild the demo data (safe to run while `dev` is going) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest, 151 tests |
| `npm run build` | Production build |
| `npm run verify` | All four, in order |

---

## Demo paths

The landing page has a **Demo** section with one-click entry for each role, and
the same three buttons appear on the sign-in page. Everything below is
fictional: no real school, staff member or child appears anywhere in this
repository.

| Role | How to get in | What you land in |
| --- | --- | --- |
| **Student** | Landing page → *Open the student demo* | Amina A., Grade 3: 7 of 9 missions finished, 7 badges, 8 of 9 skills demonstrated |
| **Student (real route)** | `/join` → class code **`MAPLE-HERON-317`** → tap a name | The flow a child actually uses. Codes are case- and punctuation-insensitive: `maple heron 317` works |
| **Teacher** | Landing page → *Open the teacher demo* | Amara Okafor, Room 12: 23 students, nine missions assigned, certification complete |
| **Administrator** | Landing page → *Open the administrator demo* | Rosa Delgado, Instructional Technology: 4 classes, 90 students, a full year of data, renewal due |
| **Family** | `/family/four-doors` | Printable take-home. No account, nothing to sign into |

Staff can also sign in by email with no password: `a.okafor@brightwood.demo`,
`r.delgado@brightwood.demo`, and the rest are listed on `/signin`.

Other class codes: `ACORN-208` (Grade 2), `HERON-455` (Grade 4), `CEDAR-361`
(Grade 3).

### Worth looking at specifically

- `/teacher/classroom/sprocket-wants-to-know` — **Classroom Mode**, the
  projector experience. Arrow keys drive it; `1`/`2`/`3` reveal what any branch
  does and `Esc` returns to the list; `N` toggles your notes. On a touch board,
  the branch switcher does all of that without a keyboard.
- `/teacher/missions/the-very-sure-answer` — every scene, every branch and
  every coach note in one page, before you assign anything.
- `/admin/report` — the annual report, with CSV and JSON export.
- `/admin/data` — what is collected, what is refused, when it deletes.
- `/privacy` — the public data model.

---

## The curriculum

### First Look — the introduction

Six sessions for a class that has not been told what AI is, in two grade tiers
that cover the same three ideas. A class runs one tier.

| Track | Grades | Sessions |
| --- | --- | --- |
| **Early** | 1–2 | The Guessing Machine · You Have Met It Already · Who Does the Thinking? |
| **Upper** | 3–5 | Where the Guesses Come From · Spot the AI · Who Is in Charge Here |

The three ideas are what every core mission already assumed a child had: that
AI is a program which produces what usually comes next, that it is already
inside ordinary tools rather than being a robot in a film, and that a person
decides when it is used and is answerable for the result.

**First Look records no skill evidence.** A comprehension check answered on the
board is not a demonstrated safety skill, and the roster reports only the nine
skills the core missions rehearse. Finishing a session earns a badge and
nothing else. `validateMission` refuses a First Look choice that carries
evidence, and `tests/foundations.test.ts` proves it end to end through the real
repository.

### The three competencies

Three competencies, three named skills each, three missions per skill.
Twenty-seven missions, seven to nine minutes apiece, reading-levelled for
grades 2–4. The table below names the first mission for each skill.

| Competency | Skills | Missions |
| --- | --- | --- |
| **Privacy and Personal Information** | withholds identifying information · evaluates photo, camera and location requests · stops and involves a trusted adult | Sprocket Wants to Know · The Filter That Wanted More · The Question at Bedtime |
| **Verification and Evidence** | separates confident delivery from accuracy · spots indicators of synthetic media · checks a claim against an authoritative source | The Very Sure Answer · The Penguin on the Playground · Two Answers, One Truth |
| **Learning Ownership** | attempts the task before asking · chooses think / look up / ask a person / use AI · reports assistance accurately | The Homework That Did Itself · Four Doors · The Spelling Test Surprise |

All twenty-seven share a cast and a setting — Room 12 at Brightwood Elementary,
Theo, Ms. Okafor, Mr. Ruiz — so a class builds continuity across the year. The
upper First Look track is set one room along, in Room 20 with Mr. Alvarez, so a
fifth grader is not asked to identify with the younger room.

### Content model

A mission is a finite graph of authored scenes (`src/content/types.ts`):

```
Mission → Scene[] → Choice[] → Feedback + Evidence + next
```

Rules the structure enforces, checked by `tests/content.test.ts` on every
shipped mission:

- Every scene is reachable from the opening and every path terminates.
- Every choice carries authored feedback. There is no generated text.
- Every `rethink` (unsafe) choice **loops back and records no evidence**, so a
  child is never locked into an unsafe path and never penalised for exploring.
- Every `strong` choice records evidence against a skill that exists — except
  in First Look, where the rule inverts and **no** choice may record anything.
- No student-facing sentence runs longer than 32 words. First Look is capped
  tighter still: 14 words in the grades 1–2 tier, 24 in grades 3–5.
- Both benchmark forms are balanced by competency and share no scenario with
  any mission, so the spring window measures transfer rather than recall.

Coach notes are authored per choice and are shown only to teachers, in the
mission preview and in Classroom Mode's hideable notes strip. A component test
asserts a student never sees one.

---

## The four experiences

**Student.** Joins with a class code and taps their own name — no password, no
account. A competency map, not a score. Missions resume where they were left.
Check-in answers take two deliberate taps — one to select, one to confirm — so a
stray finger on a trackpad cannot silently record an answer a child never meant.
Nothing advances until the server has confirmed the save: on a dropped school
network the child stays put with their answer intact and a calm *Try again*,
because assessment data that vanishes quietly is worse than a save that fails
loudly. Mission decisions work the same way — the authored feedback appears at
once, but the way forward waits until the choice is recorded.

The same holds at the end. A badge is not claimed until completion is written:
the ending reads *Saving your badge…* first, and the ways out of the mission
only open once it is recorded. Finishing a check-in waits visibly too, keeps all
nine answers on failure, and routes onward only after the completion marker
succeeds. Retries are idempotent.

Coming back works too. A part-finished check-in resumes at the first story
without an answer; one where every answer is saved but the completion marker
never landed opens straight on a *Let's finish saving* screen, which says the
answers are safe and asks for nothing but the final tap.
Badges are flat: nine of them, all equal, no streaks, no timers, no points, no
leaderboard. Read-aloud is available on every dense screen using the browser's
own speech synthesis (playback only — no microphone is ever requested).

**Teacher.** Preview every branch before assigning. Completion and demonstrated
skills per student. A printable discussion guide and a family take-home for
each mission. **Classroom Mode** for teaching a mission on a projector or
interactive board. A five-module, ~38-minute micro-certification with a
printable certificate.

**Administrator.** School-level trends only — there is no route in the product
that shows an administrator a named student's answers. Fall-to-spring benchmark
growth on matched students. Staff and class management, retention controls with
real deletion, an audit log, a subscription placeholder, and an exportable
annual report.

**Family.** A one-page take-home per mission: what was practiced, three
questions to ask, one thing to try, and one sentence worth keeping. Public
links, no parent account, nothing to submit.

### Classroom Mode

The teacher-led facilitation experience, and the piece most products in this
space skip. It differs from the student player in three deliberate ways:

1. **It records nothing.** A group lesson is instruction, not assessment.
2. **The teacher can reveal any branch**, including the ones that loop back.
   In a group the most valuable question is "what would have happened if we
   picked B?", and a child should not have to answer wrongly on purpose.
3. **Type is sized for the back of a room**, scaling with the viewport rather
   than sitting at a fixed size.

It also carries a pre-flight plan screen, a hands-up tally that is cleared on
every scene change and never leaves the browser, hideable coach notes, keyboard
driving, and a paced debrief built from the mission's discussion questions.

While a branch is open, a **branch switcher** keeps every other branch one tap
away, so a teacher on a touch-only board can compare A, B and C without leaving
the decision. It is kept visually and verbally distinct from the hands-up tally:
one changes what the room is reading, the other counts votes.

---

## Post-sprint classroom review

**Standing requirement, documented in `docs/classroom-review.md`.** Every sprint
ends with a classroom-centered product and UI review, and the findings are fixed
before the sprint is called complete.

The review has three parts: **teacher-led group instruction** (projector
legibility, teacher preview and control, branch reveal, whole-class prompts,
transitions, driving without a mouse), **independent student use across every
grade the product touches, 1 to 5** (reading
load, narration, 44px targets, no confusing states, keyboard and touch, calm
feedback, no addictive mechanics), and a cross-cutting pass covering
developmental appropriateness, instructional clarity, privacy, accessibility,
cultural inclusion and teacher workload.

Every feature is judged against the actual goal — building calibrated trust and
safe habits, and preparing children for later responsible use — rather than
against engagement or tool familiarity.

Reviews are recorded in `docs/reviews/`. The first is
[`docs/reviews/2026-08-26-sprint-01.md`](docs/reviews/2026-08-26-sprint-01.md),
which is what produced Classroom Mode, its sticky launch control, the two-step
check-in answering rule, the 44px touch-target pass, read-aloud in the
check-in, and seven bug fixes. Sprint 02's review
([`docs/reviews/2026-08-26-sprint-02.md`](docs/reviews/2026-08-26-sprint-02.md))
added the touch-board branch switcher and made every student save complete
before the child moves on. Sprint 03's
([`docs/reviews/2026-08-26-sprint-03.md`](docs/reviews/2026-08-26-sprint-03.md))
extended that to the last step of both flows, so nothing is claimed or exited
before it is recorded. Sprint 04's
([`docs/reviews/2026-08-26-sprint-04.md`](docs/reviews/2026-08-26-sprint-04.md))
added interrupted-session recovery and a visible keyboard focus ring on the
check-in options.

---

## Privacy model

The strongest protection available here is not collecting the data.

**Held about a student:** a display name (first name, last initial), an assigned
animal avatar, their class, which authored choices they tapped, which check-in
options they selected, and open/complete timestamps. That is the entire list.

**Has no column in the schema:** surnames, dates of birth, addresses, phone
numbers, student email, photographs, audio, video, location, IP geolocation,
device fingerprints, time-on-task, idle timers, keystroke timing, risk scores,
readiness bands, personality inferences, advertising identifiers, third-party
analytics.

These are absent from `src/lib/db/schema.ts`, not merely hidden from the UI — a
column that exists eventually gets filled in. `tests/access-control.test.ts`
asserts the `students` table has exactly five columns and that no telemetry or
scoring table exists.

Other load-bearing decisions:

- **Children cannot type free text anywhere.** Every student input is a tap on
  an authored option, so there is nothing a child could disclose for us to store.
- **No camera, microphone, ads or trackers.** The product requests no device
  permission at any point.
- **Teachers see their roster; administrators see aggregates.** Groups below
  five students are reported as "too few to report", in the product and in every
  export, the way state report cards handle small cells.
- **Deletion is a date, not a paragraph.** The admin sets a retention window and
  sees the resulting deletion date per class before clicking anything. Deleting
  removes the roster, every attempt, both check-ins and that class's assignments
  in one operation; rows are removed, not flagged. Every configuration change and
  deletion writes an audit entry.
- **That class cascade, plus removing a staff member who owns no classes, is the
  whole self-service deletion surface.** Nothing in this build deletes the school
  record, the remaining staff accounts and their orientation answers, or the
  audit log, and there is no account-erasure workflow. `npm run reset-db` is a
  developer script that empties the tables and re-seeds demo data; it is not
  reachable from the product and is not an erasure path. The privacy page used
  to say a school could "delete everything at any time", which was never true of
  this code.
- **Reporting shows demonstrated competencies, never labels.** There is no
  overall score for a child anywhere in the product.

**On FERPA and COPPA.** Mission and check-in records are education records under
FERPA, held and deleted by the school on its own schedule. Because the product
collects no personal information beyond a display name a teacher chose, and
gives a child no way to disclose any, the COPPA surface is deliberately small.
This is an accurate description of how the software is built. It is not a legal
opinion and AI Ready Kids claims no compliance certification.

---

## Architecture

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind CSS 4 ·
`node:sqlite` · Vitest.

```
src/
  content/        Missions, benchmark forms, certification, competencies.
                  Pure data — no imports from lib or app.
  lib/
    db/           Schema, connection, demo seed, reset
    repo/         Data access, one module per aggregate. Server-only.
    domain/       Pure logic: evidence, benchmark scoring, retention,
                  mission-path walking and content validation
    auth/         Signed-cookie sessions; token logic split out to be testable
  components/     Design system, original SVG art, staff and student widgets
  app/            Routes. Server Components by default; Server Actions for
                  every mutation
docs/             The classroom review checklist and recorded reviews
tests/            92 tests
```

**Why `node:sqlite`.** Real persistence with no native module to compile, no
database server to run and nothing to configure. `openDatabase(path)` is
exported separately from the process singleton so every test file gets its own
isolated database.

**Server Actions validate everything.** A submitted decision is re-checked
against the shipped content before it is written, and staff actions verify the
target class belongs to the caller's school. The browser can only ever ask to
record something that exists in the authored graph.

**Evidence is sticky.** Once a student demonstrates a skill, a later weaker
answer does not downgrade it. This is a record of what a child can do, not an
average, and a replay of a finished mission records nothing at all.

**Design.** A warm paper-and-ink palette with flat surfaces and solid offset
shadows — deliberately not the gradient-and-glass house style. All illustration
is original inline SVG. Student surfaces use chunky "sticker" controls with 4px
ink borders; adult dashboards use hairline borders, tabular numerals and a calm
neutral palette. System font stacks throughout, so the build needs no network
and no font files.

---

## Testing

```bash
npm test
```

151 tests across eight files:

- **`content.test.ts`** — structural safety review of all nine missions:
  reachability, termination, feedback coverage, retry-on-unsafe, evidence
  validity, skill coverage, reading level. Plus benchmark balance, form pairing,
  transfer-scenario enforcement and the rule that no student-facing check-in copy
  frames the check-in as a graded test.
- **`student-journey.test.ts`** — join by code (case, spacing, punctuation,
  bad codes), roster shape, a full mission walk-through, resume, sticky evidence,
  badge award, replay, both check-in windows and per-competency scoring.
- **`teacher-journey.test.ts`** — class creation and unique codes, roster
  add/remove with cascade, assign/unassign idempotency, cohort summaries,
  next-teaching-focus, started-versus-completed, and the certification flow.
- **`admin-journey.test.ts`** — report assembly, matched-only growth,
  null-not-zero before the spring window, export contains no identifiers,
  small-cell suppression, CSV escaping, retention arithmetic, cascading deletes
  and audit entries.
- **`access-control.test.ts`** — session signing and five tamper cases,
  content validation of submitted ids, school scoping, and the schema assertions
  that keep the student record minimal.
- **`mission-player.test.tsx`** — the real player component under React
  Testing Library: authored feedback, unsafe choices looping back, coach notes
  never reaching a student, the polite live region, badge award, replay recording
  nothing, and keyboard operation. Plus completion integrity: the badge is not
  claimed while the save is in flight, no exit exists until it lands, a failure
  keeps the wrap-up and offers a retry without claiming the badge, and a replay
  is immediate and write-free.
- **`checkin-player.test.tsx`** — the two-step answering rule: a first tap
  selects and saves nothing, Next stays disabled until something is chosen,
  changing a mind before confirming saves only the last pick, Back restores the
  saved answer and discards unconfirmed edits, resume lands on the first
  unanswered story, and no score is ever shown. Plus save resilience: a held-open
  save keeps the child on the story, a rejected or dropped save never advances
  and never loses the pick, Try again resends and then advances, and the last
  story cannot finish on a failed save. Plus finalisation: it waits visibly,
  never routes away on failure, keeps every answer, ignores extra taps, and
  finishes on a later retry. Plus interrupted-session recovery: a 9/9 unfinalized
  check-in opens on the finishing screen and rewrites nothing, a partial set
  still resumes at the first unanswered story, and a failure followed by a
  remount finishes cleanly. Plus keyboard focus: Tab reaches the group, the ring
  is painted on the visible card rather than the clipped input, and it stays
  distinct from the selected state.
- **`classroom-mode.test.tsx`** — branch comparison on a touch board: the
  switcher appears with the feedback, switches branches by click alone without
  leaving the scene, marks the live branch pressed, sets rather than toggles,
  returns to the list, keeps the question visible, still answers number keys and
  Escape, stays distinct from the hands-up tally, names every control by its
  effect, and records nothing.

Verified in the browser at 1280×800 and 1366×768 (projector and classroom
laptop), 890×762 and 768×1024 (tablet portrait) across student, teacher and
administrator surfaces, with every student-facing control measured against the
44px minimum.

---

## Assumptions

- **One school per deployment.** The schema carries `school_id` throughout and
  the queries are scoped, but the UI assumes a single school. District rollup is
  a real change, not a config flag.
- **Teachers enter rosters by hand.** Reasonable for a pilot, not for a
  district; see roster sync below.
- **The school year is `2025–2026`** and the demo sits just after it ends, so
  renewal is due and the annual report is ready to export.
- **Class codes are the whole student security model.** Proportionate to what
  sits behind them — a child's own progress list. Single sign-on would replace
  them in production and is not built here. The code is generated with
  `randomInt` from two distinct words plus three digits — a little over three
  and a half million combinations, up from 13,500 — and entry is rate limited
  with progressive backoff. **That limiter is per process and in memory**: it
  holds a counter and a timestamp, keyed by forwarded address, stores nothing
  about anybody, and forgets everything on restart. A real deployment does this
  at the edge; a single Node process behind one load balancer is not a rate
  limit. A teacher can rotate a code from the class page. A student
  session carries the normalized code that authorized it, inside the signed
  HttpOnly cookie and nowhere else, and `currentStudent` compares it to the
  class's current code — so rotation rejects outstanding join grants *and*
  sessions already issued under the old code, each on its next request. It
  cannot reach a page already rendered on a screen. Student session tokens from
  builds before this binding carry no code and are rejected: those children are
  asked to rejoin once.
- **A class belongs to its teacher.** `canTeachClass` in
  `src/lib/auth/access.ts` is the only rule that grants access to a roster or
  to individual evidence, and it requires the requesting user to be the teacher
  of record. Administrators are excluded by the rule rather than by not being
  linked, because the product promises them aggregate figures. What an
  administrator may do with a class — create, rename, archive, delete, set
  retention — is class identity and lives in `canAdministerClass`.
- **Read-aloud uses the browser's voice.** Quality varies by platform. Recorded
  narration per mission is the right answer and is a content job.
- **The academic year and the subscription term are different fields.** A
  school carries `academic_year`, `year_starts_on` and `year_ends_on` alongside
  `term_starts_on` and `term_renews_on`, and every class snapshots its cohort's
  `year_ends_on` at creation. **Retention counts from the cohort's own year
  end, never from the renewal date** — they are three months apart in the seed
  on purpose, because a seed where they coincided would hide the difference.
  An administrator rolls the school forward from Program & plan; the preview
  states what will be archived, the new year's dates, that check-ins close, and
  that no existing deletion date moves.
- **Archiving is an access boundary, not only a bookkeeping flag.** It used to
  drop a cohort out of the licensed-seat count and refuse new code entry while
  doing nothing to a student session already issued, so a child with a live
  cookie kept using the product for up to twelve hours after the class was
  "finished" — through a year rollover included. `currentStudent` now refuses an
  archived class, and `archiveClass` issues a new join code in the same
  transaction so restoring cannot revive pre-archive sessions. Both the manual
  archive and the rollover go through that one function, and archiving an
  already-archived class is a no-op. The credential changes; the roster,
  attempts, check-ins, teacher, year-end and deletion date do not.
- **Schema changes ship as migrations, not as "delete the database".**
  `src/lib/db/migrations.ts` holds an ordered list; `openDatabase` reads the
  stored `schema_version`, applies whatever is pending, and writes the new
  version **inside the same transaction** as the change, so a failure rolls both
  back and the process stops rather than leaving a half-migrated file. Bump
  `SCHEMA_VERSION` and add an entry whenever the shape changes: `CREATE TABLE IF
  NOT EXISTS` creates missing tables and does nothing at all about missing
  columns, so a schema change without a migration is an existing database that
  stops working. `npm run db:reset` is **demo data only** — it truncates and
  re-seeds so a running dev server survives it, and it is not an upgrade path.
  Back up `data/airk.db` before upgrading anyway; it is one file.
- **A migrated database has no academic dates, on purpose.** Nothing in the old
  schema recorded when a school year ended, and "2025-2026" is a label rather
  than a date — districts finish in May, June or July. Guessing early would
  delete a child's records before the school's own window elapsed, so retention
  is **blocked** for those cohorts and the administrator records the real dates
  on Program & plan, which backfills them.
- **Retention deletes when the job runs, not when the date arrives.** The
  product shows when a class becomes *due*, and `npm run purge` deletes
  everything past its date with each roster, attempt and check-in, writing an
  audit entry. It is idempotent and compares dates in UTC. Nothing in this build
  runs it on a timer — a deployment schedules it — and the administrator page
  says so rather than implying a cron nobody wrote.
- **Prices on the landing page are illustrative**, and the District card
  separates what the build does from what a district deployment would need.
  Roster sync, single sign-on and multi-school rollup appear there under "Not
  in this build" rather than in the feature list, because a feature list is
  read as a list of features. Selecting District in the administrator area
  changes a label and enables nothing.

## Deliberately deferred

Everything here is a production integration, not a missing feature:

- **Roster sync — Clever, ClassLink, Google Classroom.** The data model is
  shaped for it: classes own students, students carry an opaque id, and nothing
  depends on how a roster arrived. Needs an external id column, a sync job and
  conflict handling for mid-year moves.
- **SSO — SAML or OIDC, Google Workspace for Education, Clever Instant Login.**
  `src/lib/auth/` is the only thing that changes; every route already asks a
  session for a user and a role. The email-only sign-in exists so a local
  reviewer needs no credentials, and is not production authentication.
- **Billing.** The plan page records an intent and writes an audit entry. It
  takes no card details, stores no billing identifiers and calls no payment
  processor. Schools buy on a purchase order, so the real flow is quote → PO →
  invoice, which is an account-team workflow before it is software.
- **Production hosting.** SQLite on a local disk suits one school on one box.
  Multi-school hosting wants Postgres; the repository layer is the seam, and the
  domain logic is already pure functions over plain objects.
- **Backups and soft delete.** Deletion here is immediate and final. Production
  wants a grace period and a restore path — but note that a grace period is a
  privacy trade-off, not a free win, and should be a district decision.
- **Rate limiting, CSRF hardening, audit export, email.** Standard production
  work, none of it load-bearing for evaluating the product.
- **Accessibility audit with real users.** The build meets WCAG AA contrast, is
  keyboard operable, honors reduced motion and has been screen-reader
  smoke-tested. It has not been tested with children who use assistive
  technology, which is the only test that actually counts.

## Next steps for a district deployment

1. Roster sync and SSO, in that order — they remove the two biggest sources of
   teacher setup work.
2. Postgres behind the existing repository interface, then multi-school and
   district rollup reporting.
3. Record professional narration for all nine missions and both check-in forms.
4. Run the accessibility audit with students who use assistive technology, and
   a reading-level review with a literacy specializt.
5. Pilot with two or three schools across a full year and publish the benchmark
   growth honestly, including where it did not move.
