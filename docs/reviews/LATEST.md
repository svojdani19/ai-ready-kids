# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 06 — provenance over pixel-hunting

- **Status:** complete in the working tree; commit pending
- **Full review:** [`2026-08-26-sprint-06.md`](2026-08-26-sprint-06.md)
- **Independent review:**
  [`2026-08-26-sprint-06-independent-review.md`](2026-08-26-sprint-06-independent-review.md)
- **Files touched:** `src/content/missions/verification.ts`,
  `src/content/missions/privacy.ts`, `src/content/competencies.ts`,
  `src/lib/domain/missionPath.ts`, `tests/content.test.ts`, and the review
  handoff files

### What changed

1. **Visual artefacts are now partial evidence.** In the suspicious penguin
   picture, a missing shadow and a reversed playground layout trigger a pause
   and a source check; they no longer earn the same full evidence as the child
   knowing first-hand that it did not snow.
2. **The measured skill now matches the durable behaviour.** *Trail Checker*
   and the shared competency label reward checking who made or witnessed media,
   replacing the detector identity implied by *Sharp Eyes*.
3. **The teacher extension practises provenance.** It no longer asks children
   to classify unlabeled real and generated images by appearance.
4. **A forced answer no longer inflates the report.** The voice-check scene has
   only one safe exit, so it now teaches the action without awarding evidence.
   The mission's result comes from earlier decisions with real alternatives.
5. **The newest copy is easier and more accurate.** Student copy no longer uses
   three editing terms, and the family note no longer claims the story proved
   who made the untraceable photo.

### Already verified — please do not redo

- Lint, typecheck and 154 tests pass. The default Turbopack build passes
  repeatedly in Claude's local session; an independent webpack build also
  produces all 28 routes.
- Independent player at 768×1024: revised partial feedback and **Keep going**
  are visible together; no horizontal overflow.
- Classroom Mode at 1280×800: comparison controls, feedback and all teacher
  controls fit in one viewport; no horizontal overflow.
- No browser-console errors, data changes or new child input.

### Where this is most likely still wrong

- **Source hierarchy in Mission 6.** The plaque is treated as the closest source
  and then corroborated by office records. Review whether the wording still
  overstates what a plaque alone proves for grades 2–4.
- **Badge migration.** Seeded demo data stores the same badge ID, so the renamed
  label renders correctly. A future external export contract should keep IDs,
  not cache display names.
- **Evidence aggregation remains permissive elsewhere.** Mission 5's forced
  answer no longer records evidence, but Claude found the same pattern in eight
  other missions. The next integrity sprint needs a product-wide rule for
  first-choice versus coached evidence, plus seed and reporting verification.

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only.
