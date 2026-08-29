# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 69 — archiving was bookkeeping, not a boundary

- **Reviewed against:** HEAD `6ae0159`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-69.md`](2026-08-29-sprint-69.md)

### The defect

Archiving dropped a cohort out of the licensed-seat count and refused new code
entry, and did nothing to a student session already issued. `currentStudent`
loaded the student, loaded the class, compared the session's bound code — sprint
68's fix — and handed back an **archived** classroom. Every student page and
instructional action trusts that resolver, so a child with a live twelve-hour
cookie kept the roster-linked experience and kept recording authored work after
the class was "finished". Both `archiveClassAction` and `rolloverYearAction`
were affected.

Commercially: a school archives a cohort to free seats while signed-in devices
carry on using the product.

### The correction

`currentStudent` refuses an archived class, closing every student page and
mutation on the next request. That alone would leave a restore inside the
twelve hours reviving every pre-archive session, so `archiveClass` issues a
**new join code in the same transaction** — no schema field, the existing
credential lifecycle doing the revocation. Sessions and grants stay invalid
across a restore; everyone rejoins with the current code.

Both archive paths go through that one function. Archiving an already-archived
class is a no-op — no second code, no moved timestamp — and the read and write
share one `BEGIN IMMEDIATE`. Staff sessions, restore's seat cap, subscription
rules, records, year-end and deletion dates are untouched.

### Evidence

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      733 passed (20 files)   — up from 718
build      ✓ Compiled successfully
against 6ae0159 → 6 of 11 behaviour tests fail, plus all 4 copy tests
```

Failing-before is behavioural through the real `currentStudent`: a valid student
session stayed valid after archive. The preservation test compares JSON dumps of
every table and every class column except `archived_at` and `join_code`.

**Browser.** A single browser profile holds one `airk_session` cookie, so the
student and administrator sessions cannot be live in it together; the two halves
were driven as separate passes, **both at both widths**, and are recorded as
such.

- *Student device, 1280×800 and 768×1024:* joined, chose a child, `/student`
  rendered; class archived underneath; navigating landed on `/join` with no
  server error, no stale name/missions/badges, no overflow. Class then
  **restored** with the old cookie still present — still `/join`, `reactivated:
  false`. The old code was refused at the join form; the new code returned the
  child to the roster.
- *Administrator, 768×1024 and 1280×800, real UI throughout:* **Archive** on
  Room 12 (control unobscured by `elementFromPoint`), corrected confirmation read
  in full, confirmed; row became `Room 12 Archived` and the code changed
  (`COMET-UMBRELLA-604` tablet, `COMET-JACKET-540` desktop); `/admin/data` showed
  the corrected audit entry; **Restore** driven at both widths, with the code
  correctly staying rotated.

Demo restored exactly: Room 12 `MAPLE-HERON-317`, unarchived, test audit rows
removed, counts and the seeded six audit actions re-confirmed.

### Where to push hardest

1. **The archive in the student browser pass was performed by the repository
   transaction, not by clicking Archive**, because one cookie jar cannot hold a
   student and an administrator at once. The administrator pass drives the real
   button and proves it calls the same thing; if a reviewer wants one continuous
   run, it needs two browser profiles and I did not set that up.
2. **Revocation is code rotation, not session invalidation.** There is no session
   store, so "invalidate this child's session" is only expressible as "change the
   credential it was bound to". That covers archive and rotation; it could not
   express signing out one child while the class carries on.
3. **A restore always costs a rejoin.** Archive by mistake, restore immediately,
   and every child still goes back to the join screen with a new code. The
   confirmation now says so before committing, but it is a real operational cost
   a school might not want.
4. **Containment is per request.** A rendered page survives until the child
   navigates. Copy says so; nothing pushes to a connected browser.
5. **`generateJoinCode` is now called on every archive, including a rollover that
   archives many classes at once.** It scans all codes per call and retries on
   collision. Fine at four classes; nobody has looked at it for a district-sized
   rollover.
