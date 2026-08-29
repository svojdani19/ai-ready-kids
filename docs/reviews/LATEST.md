# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 68 — rotation invalidated the way in, not the people already inside

- **Reviewed against:** HEAD `53a5d6e`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-68.md`](2026-08-29-sprint-68.md)

### The defect

Rotation is the recovery action the product recommends by name, and it was half
an answer:

| Credential | After rotation |
| --- | --- |
| A new join with the old code | rejected |
| A half-finished join grant | rejected — the grant carries the code |
| **A student session already issued** | **still worked** |

`{ kind: "student", studentId }` recorded who was signed in and nothing about
how they got in, so `currentStudent` had nothing to compare against the class's
current code. A browser that entered through a leaked code stayed inside for the
rest of the twelve-hour lifetime — after the administrator had done exactly what
the product told them to do, while three surfaces said *"the old code stops
working immediately."*

### The correction

One field, in the signed HttpOnly cookie and nowhere else: a student session
carries the normalised join code that authorised it. No column, no student data
field, no telemetry.

- `chooseStudent` issues with `grant.code` — the code the verified grant
  carries, already re-checked against the class above it.
- `enterDemo("student")` issues against the demo class's current code.
- `currentStudent` compares the bound code to the class's current one and
  returns `null` on mismatch. Archive/entitlement checks and the twelve-hour
  lifetime are untouched; `currentStaff` is unchanged.
- **Legacy tokens fail closed.** `decodeSession` requires a non-empty `code` on
  a student token, so a token from an older build decodes to `null`. Stated
  rather than smoothed over: **student sessions from before this commit are
  rejected and those children rejoin once.** No seamless migration is claimed.

Copy aligned in five places (shared boundary, admin Classes note, both
`class.code_rotated` audit details, README): *"rejected on the next request that
uses it… a browser already signed in with it is asked to rejoin the next time it
loads a page"*, plus the limit said out loud — rotation cannot reach a page
already on a screen.

### Evidence

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      717 passed (19 files)   — up from 706
build      ✓ Compiled successfully
```

**Failing-before, behaviourally.** `tests/session-binding.test.ts` drives the
real `currentStudent` with a mocked cookie jar and a seeded fixture behind
`globalThis.__airkDb`. Removing only the comparison line: *"is valid before its
own class code rotates, and invalid after"* fails — `currentStudent()` returns
the student and classroom after rotation, which is the defect exactly.

**Browser** — recorded per width, and claimed only where actually driven:

- **Student join → rotate → recover at 1280×800**, and again **at 768×1024**.
  The tablet run was added during acceptance: the first pass drove the flow only
  at desktop and checked the tablet layout for copy alone, which did not prove
  the recovery path on the Chromebook layout these children use. At 768×1024 the
  child reached `/student` (*"Hello, Elias"*, 16 of 18 missions, badge strip),
  the code was rotated underneath, and navigating landed on `/join` with
  `serverError:false`, no stale name/missions/badges, no horizontal overflow, and
  the **Go** button visible, in viewport and unobscured (`elementFromPoint` at
  its centre returns the button). The rejoin screen was then used at that width
  and returned the child to the roster.
- **Administrator rotation at 1280×800** — pressed **New code** on Room 4,
  confirmed, and read the corrected audit entry on `/admin/data`.
- **Administrator rotation at 768×1024**, driven separately during acceptance —
  and it **found a defect** (below). Confirmation panel rendered in full with
  both **Change the code** and **Cancel** visible, in viewport and unobscured by
  `elementFromPoint`; confirming changed Room 4's code visibly in the table to
  `DRAGON-ASPEN-818` with no server error and no document overflow (the wide
  table has its own `overflow-x: auto` container); `/admin/data` showed the
  corrected audit entry at that width.
- **Copy at both widths** on `/admin/classes`, `/privacy`, `/admin/data` —
  recorded as copy-only, which is not evidence that an interaction on the same
  page works at that width.

Demo restored after each run, with counts re-confirmed unchanged.

### The defect the tablet administrator run found

Opening the confirm dialog rather than reading the source for it surfaced two
rotation claims this sprint's own sweep had missed: the admin confirm question
said *"stop working straight away"* and the teacher one named *"anybody halfway
through joining"* alone. Two failures at once — the **immediacy claim under
different words**, which is why a grep for `stops working immediately` walked
past them, and **no mention of student sessions**, making the administrator's
last screen before confirming the least accurate description of what confirming
does. Both now carry the same wording as the note and the audit entry, and
`tests/data-inventory.test.ts` → *"aligns the rotation confirmations a staff
member actually reads"* reads both questions, forbids both immediacy phrasings
and requires the sessions clause. It fails against the pre-correction files.

Gate re-run after the fix — the figures above are post-fix.

### Where to push hardest

1. **The binding is a code, not a version counter.** Rotating twice back to the
   same value would revalidate an old session. Vanishingly unlikely with this
   generator, but it is a real difference between "code equality" and "version
   monotonicity", and closing it means a database column this sprint was told
   not to add.
2. **Containment is per request, not real time.** A rendered page survives until
   the child navigates. The copy now says so; if a reviewer thinks a school
   would still read "rejected on the next request" as stronger than it is, that
   is worth pushing on.
3. **My alignment sweeps are greps, and greps miss paraphrase.** The confirm
   questions escaped this sprint's own sweep by saying "straight away" instead of
   "immediately". Two tests now pin those two strings, which does nothing about
   the third paraphrase nobody has written yet. The durable fix would be routing
   every rotation claim through the shared constant the way `DELETION_SCOPE` and
   `CLASS_CODE_BOUNDARY` already are — these two are still inline strings,
   because the confirm question interpolates a class name and I did not want to
   reshape `ConfirmAction`'s API inside an acceptance correction.
4. **The one-time rejoin.** Every pre-existing student session is invalidated. In
   a local demonstration that costs nothing; a deployment would owe teachers
   advance notice, and nothing in the product delivers that notice.
5. **`enterDemo` reads the class code at issue time; `chooseStudent` uses the
   grant's.** They are equivalent today because the grant is re-verified against
   the class immediately before. If that re-verification ever moves, the two
   issuers stop agreeing.
6. **Nothing shortens the twelve-hour session.** Rotation now bounds a leaked
   code to "until the next request", which is a real improvement and is not the
   same as short-lived sessions or SSO.
