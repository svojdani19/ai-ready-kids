# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 34 — P0 follow-up: the schema gate

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-34.md`](2026-08-27-sprint-34.md)
- **Review trail:** sprints 01–16 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 15 fixed content defects in ten of them, two per sprint.
  Sprint 16 read the remaining eight; all eighteen have been read and seventeen
  had findings. Sprint 17 closed the eight legacy forced-award scenes as a rule
  in `validateMission`. Sprints 18 to 21 worked through the original nine; every
  one of the 27 missions has now been read, and 26 had findings. Sprints 22-23
  are the second pass over the reporting layer, sprint 24 the assessment layer.
  sprint 25 the educator orientation. Every body of authored content has been
  read once. Sprints 26-30 audit what the product permits and promises, 31-32
  walk ordinary school workflows. Sprint 33 added the migration path sprint 32
  needed. **Sprint 34 fixes the gate in front of it: sprint 33 could not tell an
  existing unversioned database from a brand-new file, which is exactly what the
  old `db:reset` produced.**

### What changed

1. **`storedVersion` returned `null` for two different states.** No `meta`
   table, meaning a new file — and `meta` present with no `schema_version` row.
   **The pre-sprint-33 `db:reset` produced the second**: it ran `DELETE FROM meta
   WHERE key <> 'session_key'`, so a database reset with it holds every table
   and every row and no recorded version. Sprint 33 read that as new, applied
   `CREATE TABLE IF NOT EXISTS` (no columns), stamped version 2, and returned a
   database that claimed to be current and failed on the first sprint-32 column.
   A second route reaches the same state: a **sprint 32** database had the v2
   shape while `SCHEMA_VERSION` still said `"1"`, so a reset in that window left
   a v2 file with no version either.
2. **`classifySchema` inspects `sqlite_master` and the actual columns before the
   schema is applied**, returning `empty`, `versioned`, `unversioned` or
   `unrecognised`. Recognition is positive rather than by elimination: v1
   requires `schools.benchmark_window` **and** the absence of the sprint-32
   columns; v2 requires all four of them. A `versioned` result also validates
   that the claimed version matches the shape present.
3. **An `unversioned` database is assigned the version its shape actually has**
   and migrated forward like any other.
4. **Everything else fails closed.** The file is untouched, the handle closed,
   and the error names what was found and what to do — take a copy first since
   it is one file, run the newer build rather than downgrading, otherwise
   restore a backup or reset if it is demo data. Refusing to open leaves the
   data where it is; stamping leaves something that claims to be fine and is not.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **456 tests**, Turbopack build.
- The fixture builder now takes the version to write, and **`null` reproduces
  the old reset state** — complete v1 data, `session_key` retained exactly as
  that command left it, no `schema_version`.
- Covered: that state classified as `{ unversioned, version: 1 }` by its shape
  and migrated with every record intact and **a query on a new column working**;
  a sprint-32-shaped database with the version deleted recognised as version 2;
  an empty file still stamped latest; a partial schema refused; malformed
  versions refused rather than coerced (`two`, `2.5`, `-1`, `" "`, `0`, `2abc`);
  a version above `LATEST_VERSION` refused with newer-build guidance; and a
  database claiming version 2 with version 1 columns refused **with the file
  checked afterwards to confirm nothing was written on the way out**.
- The conservative retention backfill and every student and privacy constraint
  are unchanged.
- Outside the suite: the old reset state built by hand and opened through
  `openDatabase` came up at version 2 with the session key, roster and evidence
  intact; a malformed file produced the refusal and was left alone.

### Where this is most likely still wrong

- **A sentinel answering two questions is how this happened.** `null` meant both
  "absent" and "nothing there". Sprint 33 correctly replaced an unconditional
  write with a read, then implemented the read as a function that could not tell
  two states apart — and the state it missed was described in that sprint's own
  review text while its test inserted `'1'` every time.
- **Only one previous shape is recognised**, the v1 fixture. Anything older
  fails closed, which is correct — this build has no evidence about those files
  — but there is no upgrade path from before it.
- **No down-migrations.** Forward only; a rollback means restoring the file.
- **Every other test still builds its database from the current schema.** Only
  `tests/migration.test.ts` starts from an older shape.
- **Rollover is one school at a time**, and bulk reassignment does not exist.
- **The route and action inventory is still not complete.**
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Marketing prose is still mostly untested** — sprint 26.
- **Every mission has been read once. None has been read twice.**
- **Shared scenes remain untraced** in twenty-six of twenty-seven missions.
- **Teacher-facing copy promises timelines it cannot support.**
- **No general guard against factual error exists or can.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
