# 2026-09-05 — the same evidence, in an order a school can read

**Baseline:** `8ee7bfc`, preserved. No commit was reset, reverted, rebased or
reconstructed, and the diff was swept for accidental reversions before commit.
**Scope:** four required corrections, then a hierarchy pass over every public,
teacher and administrator surface. No feature added or removed.

## The four corrections

**1. The sharing promise was broader than the truth.** "No information sharing,
ever" invited a school to read "nobody else can see this". That is false, and the
product's own privacy page says so at length: anyone holding a class code can
open any listed student's progress. The heading is now **"No third-party
sharing, ever"** — the noun narrowed, the adverb kept so the three promises stay
a set — and the body names what it covers: analytics, advertising networks,
generative models, outside providers, sale. The class-code card was **not**
restored; the fact it carried now appears in the privacy page's new overview,
under "Who can see it".

**2. Orientation terminology.** Two user-facing surfaces still said
certification: the public demo card ("certification complete") and, worse, the
button a teacher presses to finish — **"Complete the certification"**. Both say
orientation now. Every accurate use survives untouched: the printable
certificate of completion, and the sentences that explicitly deny certifying
competence.

**3. The demonstration term was not annual.** A fixed renewal date expired once
and took the whole demo down; the repair floated the renewal and left the start
at 18 August 2025, so by today the school showed a term of **two years and
eighteen days** while the plans page sold one subscription per school year. The
fix for a stale date had created a false one. The whole term now slides — the
most recent 18 August on or before today, and the same day a year later. The
seeded attempt history keeps its own fixed anchor, because it belongs to the
2025-26 academic year and would drift out of it if it followed the invoice.

Rollover and renewal stay separate concepts, and the administrator's Program &
plan page now says so explicitly rather than leaving a reader to infer it.

**4. Visible polish.** `ttraveled` corrected in both places, as *traveled* — the
product writes *behavior* and *recognize*, so it is American throughout; one
stray *recognises* went the same way. The sweep of edited surfaces also found
the root metadata still describing children as "thrust into prompts and language
models", the phrase the homepage was told to lose. Same plain language now.

## What moved, page by page

| Surface | Before | After |
| --- | --- | --- |
| Homepage | opener in product language | what it does, and the three habits |
| How it works | four authored-content cards, two repeating the site-wide chatbot promise | three, in school language; orientation described here in full |
| For your school | five points per audience | three, chosen as the three that seat asks first |
| Plans | three prose sections, eight paragraphs | two-sentence summary, four labelled disclosures |
| Annual check-ins | opened by arguing with a recall quiz | opens with the outcome; the limitation stated once, calmly |
| Privacy | seven sections of enumeration | four plain answers, then the same enumeration |
| Teacher overview | "chosen unaided" | "demonstrated independently"; next step is a button naming the mission |
| Class page | `23 / 17` under "Fall / spring" | each window labelled beside its own figure |
| Mission library | full summary, learning goals, four text links | one sentence, status, Classroom Mode button; the rest behind a label |
| Running a session | three session shapes first | four-step quick start first; "If this happens" |
| Admin overview | opened explaining aggregation | opens with the annual jobs nobody else reminds you of |
| Admin classes | 200-word code note at the foot | five-line warning beside the buttons, full boundary one click below |
| Program & plan | three dates, no distinction named | the distinction named once, with its consequence |
| Data & retention | schema enumeration first | plain summary, then controls, then the enumeration |
| Annual report | opened with a participation table | three-line summary a district reviewer can quote |

**Classroom Mode was not touched.** No explanatory copy was added to the live
board experience, and it carries no disclosures at all.

## Progressive disclosure

One shared `<Disclosure>`, native `<details>`: keyboard operable, announced as
expandable, opened by find-in-page, working without JavaScript. A print rule
forces every one of them open, so nothing folded away disappears from a report a
district files — verified in the served stylesheet.

**Nothing that must be read before acting is inside one.** Archive, delete and
code-rotation consequences are in the confirmations, next to the button. The
class-code warning sits beside the rotation controls with the full boundary
below it, not inside it.

## Corrections found by the work itself

**The report claimed to suit a family newsletter.** It is a dense technical
document. No family-readable summary exists, so the claim is gone rather than
the claim being made true by assertion.

**The admin overview said "The 2025-2026 subscription renews 18 August 2027".**
Two different years in one clause, and a direct product of correcting the term.
A subscription belongs to a term, not to an academic-year label.

**A phone-width overflow, and one that was not there.** `/admin/data` genuinely
overflowed a 390px viewport by 176px: `<fieldset>` carries an implicit
`min-width: min-content`, so the retention options refused to shrink inside a
grid item. `/admin/staff` and `/teacher/missions` appeared to overflow and did
not — `documentElement.scrollWidth` reports the widest scrollable descendant
even when it scrolls inside its own box, and the staff table does. Measuring
`body.scrollWidth` instead told the truth. The mission-library overflow was
real and mine: a fourth tag on a row that could not wrap.

## Verification

```
typecheck  ✓
lint       0 errors, 0 warnings   (was 2 warnings)
tests      1437 passed (42 files)  (was 1437 → from 1084 at the baseline)
build      ✓ Compiled successfully
```

**Browser, at 1280×800, 768×1024 and 390×844.** Twenty-two routes measured for
horizontal overflow at every width, comparing `body.scrollWidth` against the
viewport: **all clean**. Reviewed: homepage, approach, curriculum, for-schools,
plans, demo, check-ins, privacy, join, family; the student map signed in as a
seeded child; a mission's decision, its choices and its coach notes through the
teacher preview; teacher overview, class, mission library, session guide,
orientation and Classroom Mode; every administrator destination and the
printable report.

**Four new test files, each mutation-checked:**

| File | Tests | A mutation it catches |
| --- | --- | --- |
| `subscription-term` | 232 | either shipped date defect: 76 and 145 assertions fail |
| `orientation-terminology` | 79 | the demo card or the button reclaiming certification |
| `editorial-baseline` | 21 | any of the last nine commits' decisions being undone |
| plus retargeted guards | — | see below |

`editorial-baseline` is the anti-reversion guard the brief asked for: three
promises and no class-code card, the rotating hero with its pause and
reduced-motion exit, curriculum cards with no teaser or badge, no footer blurb,
short demo highlights, every marketing lede under 55 words, and the site-wide
terminology — 27 core missions for grades 2 to 4, six First Look sessions in two
tracks with three to a class, and First Look recording no skill evidence. It
caught the curriculum lede at 57 words on the way in.

**Three guards were retargeted rather than deleted**, each because the copy it
pinned had legitimately moved:

- the "certificate of completion" phrase left `for-schools` when the orientation
  moved to How it works; the guard now looks across every buyer-facing page,
  because the requirement is that the site says it, not that one file does;
- the archiving consequences moved from a page description into the
  confirmation an administrator reads with their finger on the button, so the
  guard reads the confirmation;
- the class-code boundary is now rendered from `CLASS_CODE_BOUNDARY` instead of
  a hand-written second copy, so its guard uses `renderedCopy` — the helper
  written for exactly that case. That duplicate had already drifted from the
  module, down to carrying its own typo.

Each was mutation-checked after retargeting, and each still fails when the fact
is removed.

**Demo data untouched.** Audit log 6, assignments 65, students 90, classes 4,
attempts 1078, benchmarks 129 — the seeded state, before and after. Zero rows
dated 2026-08-30 or later across all twelve `_at` columns. Signing in as
administrator, teacher and student writes nothing, which was checked rather than
assumed; no mission was played, and the one decision reviewed was read through
the teacher preview for that reason.

## Known limitations

- **The educator orientation was not shortened.** Five modules of essay-length
  body copy, and the brief asked for it. Every module, check, saving behaviour
  and completion record is intact and the terminology is corrected, but the
  prose is the length it was. It is the largest remaining item.
- **The seeded attempt history runs past its own school year.** Attempts span
  late August 2025 to late August 2026 while the recorded year ends 12 June
  2026. That predates this work and is not what the term fix was about;
  correcting it means regenerating a year of fictional history, which would
  change the demo school on the next reset. Recorded rather than quietly fixed.
- **One test run reported a single failure that has not reproduced** in five
  subsequent full runs and was not identified before it vanished. It is recorded
  because it happened, not because it is understood.
- **The plain-language summaries are summaries.** The privacy overview and the
  data page's opening paragraphs are hand-written above enumerations that are
  derived from the schema. Nothing keeps them in step but a reader; the
  enumerations remain the source of truth and say so.
- **`editorial-baseline` guards decisions, not taste.** It will not notice a
  hero lede that is short and bad.
