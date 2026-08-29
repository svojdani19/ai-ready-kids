# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 66 — a risk conclusion is not a security control, and "complete" was two different lists

- **Reviewed against:** HEAD `f9dc70c`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-66.md`](2026-08-29-sprint-66.md)

### Defect 1 — three surfaces dismissed unauthorised access

Home: *"A first name and a last initial is the entire student record. Nothing to
reset, nothing worth stealing."* Admin → Classes: *"exactly as much security as
this data warrants."* Privacy: *"the security is proportionate to that."*

All three are conclusions about risk rather than descriptions of a control, and
all three sat on a product that correctly calls the same records **education
records under FERPA**. They also understated the reach, which I verified in code
rather than inferring:

- `src/app/join/[classId]/page.tsx` renders every child in the class by name and
  avatar to any holder of a valid grant.
- `chooseStudent` in `src/app/actions/auth.ts` writes a **student session** for
  any listed child — badges, finished missions, per-skill evidence.

Replaced by `CLASS_CODE_BOUNDARY` in `src/content/data-inventory.ts`, used on
all three surfaces: a code is **shared classroom access, not proof of who is
using it**; anyone with it can see that roster, choose any child on it, and open
that child's progress; it reaches one class and no further; rotate it when it
travels. `CLASS_CODE_POSTURE` names the deployment posture once — enough for a
**supervised pilot or local demonstration**, explicitly **not production access
control**. The accurate existing statements (no password, no recovery flow,
roster sync and SSO not built) are kept.

### Defect 2 — two absolute inventories, neither matching the schema

`/admin/data` said *"The complete list. There is nothing held back"* over six
items; `/privacy` said *"Everything we hold about a student"* over a **different**
six. Against the 18 columns of the three student-linked tables (`students` 5,
`attempts` 7, `benchmarks` 6): the admin list accounted for **4**, the public
list for **7**. Both omitted `attempts.evidence_json` (the derived per-skill
judgement), the check-in timestamps, `students.created_at` and every id/FK; the
admin list also omitted `students.class_id`.

Both pages now read one module. `tests/data-inventory.test.ts` parses
`SCHEMA_SQL` and fails when any column of any student-linked table is unclaimed,
so `ALTER TABLE` breaks the build until the new column is described. Scope is
stated on both pages instead of assumed — student-linked rows plus, on the admin
page only, the class and staff records they hang from; explicitly **not** the
school's account settings or the audit log.

### Evidence

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      690 passed (17 files)   — up from 678
build      ✓ Compiled successfully
revert 4 page files → 6 of 12 new tests fail (every copy assertion)
```

Browser on :3210 — `/`, `/privacy`, `/admin/data`, `/admin/classes` at 1280×800
and 768×1024. All eight: banned phrases absent, boundary and posture present,
the previously-omitted facts rendered, no horizontal overflow.

### Where to push hardest

1. **Six of the twelve new tests cannot fail-before, and I say so in the
   review.** The schema-coverage assertions had nothing to check before this
   sprint, because no list was schema-linked. The evidence that the defect was
   real is the column count (4/18 and 7/18), not those tests.
2. **The coverage test is only as good as `STUDENT_LINKED_TABLES`.** It is a
   hand-maintained list of three table names. A future table with a `student_id`
   foreign key that nobody adds to that constant is invisible to the test —
   deriving it from the FK declarations in `SCHEMA_SQL` would close that, and I
   did not.
3. **`SURROUNDING_RECORD` is grouped, not enumerated.** Its entries name tables
   (`classes`, `assignments`, `users`) rather than columns, and no test enforces
   coverage there. That is deliberate — those are not student records and the
   heading does not claim column-completeness for them — but it is a weaker
   guarantee sitting next to a stronger one on the same panel.
4. **The limitation is now a commercial fact on a buyer-facing page.** A
   district administrator reading `/privacy` is told that anyone with a class
   code can open any listed child's progress, and that this build suits a
   supervised pilot rather than a production rollout. That is the honest
   position and it may cost deals. The alternative was a security claim the code
   did not support.
5. **Nothing was fixed about the access model itself.** Class codes remain the
   only student credential. If the reviewer's next finding is "then build roster
   sync", that is a build, not a copy sprint, and should be scoped as one.
