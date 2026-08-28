# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 44 — P1: the certification claim that lived in the chrome

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-28-sprint-44.md`](2026-08-28-sprint-44.md)
- **Review trail:** sprints 01–25 built and corrected the curriculum, reporting,
  assessment and orientation layers — 25 is where the five modules were renamed
  an *educator orientation*; 26–30 audit what the product permits and promises;
  31–32 walk ordinary school workflows; 33–34 build the migration path and its
  gate; 35–41 fix teacher-facing and content defects; 42–43 make the paid
  entitlement the vendor's number and enforce it at both enrolment and
  restoration. **Sprint 44 removes the last place the product still claimed to
  certify teachers.**

### What changed

1. **The shared site header told buyers teachers could "Preview, assign,
   discuss, certify".** The checks in those five modules are **ungated** — a
   teacher can answer every one wrong and still receive a certificate of
   completion — so the only fact held is that pages were opened and questions
   answered. "Certify" claimed competence the data cannot support, and
   contradicted the approach page, the annual report and the certificate itself,
   all of which had already been corrected.
2. **The blurb now reads "Preview, assign, discuss, prepare"**, matching the
   destination section's *"5-module educator orientation… with a printable
   certificate of completion"*.
3. **A sweep of every buyer-facing surface found nothing else.** The remaining
   uses are accurate and deliberately kept: "certificate of completion", the
   compliance denials on the privacy, report and data pages, and the disclaimers
   "rather than certifying competence" and "does not certify".
4. **The checks are not gated and the orientation is not broadened.** Gating them
   to justify a word would be letting marketing copy drive pedagogy; the copy
   changes to match the product instead.

### Why the guard missed it

The existing test scanned `CERTIFICATION_MODULES` and `CERTIFICATION_TITLE` —
**the offering's own content constants**, where the word had already been
removed. The claim was in a shared layout component that no content test had
reason to open. The blurbs also render **only at desktop width**; the mobile menu
shows labels without them, so the sentence was invisible at 768px and below.

### Already verified — please do not redo

- Typecheck, lint, **513 tests** (up from 501), Turbopack production build.
- The new guard reads the header, the footer and every page under `(site)`. Per
  file it strips comments, imports and code identifiers, **collapses whitespace
  before scanning** (the privacy page's compliance denial wraps across two source
  lines, and a line-based scan read the tail as a bare claim), removes the allowed
  accurate phrases, and fails on any `certif` left standing.
- **The accurate phrases are asserted positively too**, so a future sweep cannot
  pass by deleting honest copy: "certificate of completion" and "educator
  orientation" on for-schools, and the compliance denial on privacy.
- Plus a blurb test: no `certif`, still mentions preview and assign, says prepare
  or orient. Both the file scan and the blurb test confirmed to **fail against
  the old header** by stashing it.
- **Browser-checked at 1280×800:** menu opens, `aria-expanded` toggles, four
  items with blurbs, Teachers reads correctly, no overflow, nothing clipped, all
  links tabbable and visible with `focus-visible` styling, Escape closes.
- **Browser-checked at 768×1024:** mobile menu renders labels without blurbs,
  grouped correctly, no overflow, nothing clipped, legible.
- **No child-data or authored-curriculum change.** Nothing here reaches student
  records.

### Where this is most likely still wrong — best places to push

- **Escape leaves focus on a hidden element.** With the desktop menu open and a
  link focused, Escape closes the menu but focus stays on that link — still in
  the DOM, no longer visible — so a keyboard user pressing Escape then Tab
  resumes from somewhere they cannot see. Focus should return to the trigger.
  Pre-existing and unrelated to the copy defect, so reported rather than folded
  into a copy-only sprint.
- **The guard is a word list on a file list.** It catches `certif` on nine
  surfaces. It cannot catch a different overclaim ("accredited", "validated",
  "assessed"), and it cannot catch one made in a component not on the list.
- **No other marketing claim has been checked against product behaviour since
  sprint 26.** Two of the claims audited then were false; this one survived that
  audit too.
- **Lapsed-subscription enforcement remains documented and unbuilt** — it needs a
  lifecycle decision and an action-inventory audit, not a copy patch. Nothing
  switches off at renewal and the program page says so.
- **Nothing reconciles the entitlement against an actual agreement** — sprint 42.
  Only enrolment and restoration are metered — sprint 43.
- **Twenty-four mission guides have not been read for the real-material defect
  class** — sprints 37–41. **Twenty-six missions have untraced shared scenes** —
  sprint 36.
- **`src/app/(site)/privacy/page.tsx` has two unused-import lint warnings**,
  unrelated to this work.
- **Only one previous schema shape is recognised** — sprint 34. No
  down-migrations.
- **The route and action inventory is still not complete.**
- **`enterDemo("student")` writes a student session directly**, and
  **`simulateAttempt` writes seed paths directly**.
- **The limiter is per process** — sprint 30.
- **The instrument is still unequated with one item per skill** — sprint 24.
- **Every mission has been read once. None has been read twice.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
