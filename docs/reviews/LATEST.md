# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 65 — the subscription notices promised a freeze the gate never applied

- **Reviewed against:** HEAD `cf0d312`
- **Repository:** <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-29-sprint-65.md`](2026-08-29-sprint-65.md)

### The defect

The lapsed staff notice ended *"Nothing has been deleted and nothing is hidden.
Everything the school already has stays here and stays readable."* — a claim
about the entire store for the entire duration of the lapse. The term gate
covers instructional and classroom writes only:

- `runScheduledPurge` (`src/lib/domain/purge.ts`) has **no subscription check**;
  a due cohort is deleted by the next run regardless of term state.
- `deleteClassDataAction` and `setRetentionAction` are on the gate's **ALLOWED**
  list.

So the notice could be on screen while `npm run purge` deleted a cohort that
night. The Program & plan note carried the softer form of the same claim, and
`admin/page.tsx` held a **second, drifted copy** of the unverified-term
paragraph with its own version of the deletion promise.

### The correction

One shared constant stating the causal fact:

> This does not itself delete or hide anything. Records still inside the
> school's retention window remain available, along with reports and exports,
> and the retention schedule the school configured and the administrator's own
> deletion controls carry on as before.

Appended to both `LAPSED_STAFF_BODY` and `UNVERIFIED_STAFF_BODY`, with the
needs-configuration distinctions intact around it (*"This is not an expiry —
nothing has ended"* before, *"Ask your account contact to correct the
subscription dates"* after). The admin overview now renders the shared constant
instead of its own paragraph. The Program note adds *"What it does not do is
suspend retention: the schedule you configured carries on, so a class already
past its deletion date is still deleted on time."*

`LAPSED_WRITE_REFUSAL` keeps *"Nothing has been changed."* — transactionally
true of the rejected write. Child copy unchanged and still billing-free.

### Correction during acceptance

My first version of that Program note ended *"a class already past its deletion
date is still **deleted on time**."* — a promise about a schedule this build
does not run. `admin/data/page.tsx` has always said the opposite: nothing here
runs the purge on a timer, a deployment schedules `npm run purge`, and until it
runs, records past the date are still present. I had replaced one unsupported
claim with another on the same subject.

Corrected to keep **due** and **deleted** as separate facts and name the actor:

> …so a class past its deletion date **stays due**, and it is deleted **the next
> time your deployment runs the purge job**. Pausing neither brings that forward
> nor holds it back, and nothing in this build runs the job on a timer, so due
> is not yet deleted.

The shared subscription constants needed no change — they speak of the schedule
*carrying on*, never of when a deletion happens. Retention behaviour untouched.
`tests/subscription-lapse.test.ts` → *"claims no deletion timeline this build
does not run"* forbids `deleted on time` / `deleted on schedule`, requires the
four mechanism phrases, and forbids any timeline phrase in the shared bodies. It
fails on the pre-correction file.

### Evidence

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings
tests      678 passed (16 files)   — up from 669
build      ✓ Compiled successfully
stash 3 source files      → 4 failures  (failing-before, copy correction)
stash program/page.tsx    → 1 failure   (failing-before, timeline correction)
```

Browser on :3210 — `/admin` and `/admin/program`, lapsed and
needs-configuration, at 1280×800 and 768×1024. All eight combinations: banned
claims absent, causal + retention-window + schedule sentences present, no
`Invalid Date`/`NaN`, raw stored `soon` never echoed, no horizontal overflow.
The acceptance correction was re-checked scoped to Program & plan at both
widths: `deleted on time` absent, all four mechanism phrases present, no
`Invalid Date`/`NaN`, no overflow.
Demo restored (plan `school`, 120 seats, retention 12, 2025-2026 /
2025-08-25 → 2026-06-12, term → 2026-09-01, 4 classes, 90 students, 884
attempts, 6 audit rows).

### Where to push hardest

1. **Two of the six new tests pass before the fix.** The behaviour tests
   (`runScheduledPurge` still deletes; retention + `deleteClass` still work
   while `assertClassSubscriptionActive` throws) do not fail-before, because the
   product was already right and only the copy was wrong. They exist to force a
   future behaviour change to confront the copy in the same commit. If that is
   not a good enough reason to keep them, say so.
2. **The gap itself is unfixed, deliberately.** A scheduled purge can delete a
   cohort while the term is paused. The Program note now says this out loud
   rather than hiding it. Whether retention *should* be suspended by a lapse is
   a product decision this sprint did not take.
3. **Other surfaces may still carry global reassurance.** This sprint cleared
   the subscription notices and the Program renewal note. Sprint 64 cleared the
   Data page's academic-date branch. The pattern — a feature-local notice making
   a whole-system promise — is worth sweeping for elsewhere.
4. **The refusal/notice boundary.** *"Nothing has been changed"* is now allowed
   only in the refusal constants. Check that distinction holds in the rendered
   product, not just in the constants file.
5. **Other timeline claims.** The acceptance correction found one sentence
   promising a run time the build does not schedule. The same question is worth
   asking of every surface that mentions deletion, rollover or check-in windows:
   does the copy name a *state* the product can guarantee, or an *event* that
   depends on somebody's cron?
