# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 33 — P0: the upgrade destroyed the data it was upgrading

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-33.md`](2026-08-27-sprint-33.md)
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
  walk ordinary school workflows. **Sprint 33 is a P0 fix for a defect sprint 32
  created: it added four required columns with no migration, so an existing
  database failed on first use and the README said to delete it.**

### What changed

1. **Sprint 32 added four columns and nothing migrated them.** `openDatabase`
   ran `CREATE TABLE IF NOT EXISTS` — which creates missing tables and does
   nothing about missing columns — then wrote `schema_version = 1`
   **unconditionally, without ever reading it**. An existing database claimed to
   be current and failed on the first query touching a new column. The README
   said to delete `data/airk.db`: every roster, attempt, skill record, badge and
   check-in, and a direct contradiction of the retention story on the privacy
   page.
2. **There is a migration path now.** `src/lib/db/migrations.ts` holds an
   ordered list. The opener **reads** the stored version first, stamps a
   brand-new file at the latest version so nothing migrates a current schema,
   and runs each pending migration **in its own transaction with the version row
   written inside it** — so a failure rolls the columns and the version back
   together and stops. Idempotent by construction.
3. **`db:reset` preserves `schema_version`.** It had been deleting it, harmless
   only while the opener rewrote the version regardless; with real migrations
   that would make the next open mistake an old database for a new one. The
   README now says reset is demo data and not an upgrade path.
4. **The backfill records nothing, deliberately.** Nothing in the old schema
   says when a school year ended, and `school_year` is a label, not a date. The
   renewal date is available and is exactly the wrong answer — sprint 32 existed
   to stop it being used for this. Guessing early deletes a child's records
   before the school's window elapsed; guessing late holds them past the policy.
   So the migration carries the **year label** forward and leaves every date
   empty, and **retention treats empty as blocked, not due**: null due date,
   never eligible, purge skips it. An administrator supplies the real dates on
   Program & plan, which backfills that year's cohorts.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **448 tests**, Turbopack build.
- New `tests/migration.test.ts` built on `tests/fixtures/v1-schema.sql` — the
  **literal** pre-sprint-32 schema extracted from the commit before it, so the
  test cannot drift into asserting the current shape. The fixture holds one of
  everything, linked, and is opened through the ordinary `openDatabase` path.
- Covered: columns added and version advanced; **every record and link survives**
  including `path_json` and `evidence_json`; the year label carried forward with
  dates empty and `year_ends_on !== term_renews_on`; retention blocked with the
  purge deleting nothing in 2099; re-running a no-op; **a forced failure rolling
  back with the version still 1 and the column gone**; a fresh database stamped
  without migrating; a demo reset keeping the version.
- Outside the suite: a hand-built v1 database opened through
  `openSeededDatabase` came up at version 2 with data intact, and the running
  app showed "Not set — Nothing is deleted until you do" and backfilled four
  classes when the dates were supplied.

### Where this is most likely still wrong

- **A version that is stamped rather than checked is worse than none.**
  `schema_version` existed the whole time and was written without ever being
  read, which is what let an out-of-date database claim to be current.
- **Every test builds its database from the current schema**, so none of them
  had ever seen an old one. That is sprint 32's blind spot one layer down: that
  sprint asked "is this correct the second time" about the calendar; this asks
  it about the schema. Any future schema change needs a migration *and* a test
  starting from the previous shape.
- **No down-migrations.** Forward only; a rollback means restoring the file,
  which is why the README says to back it up.
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
