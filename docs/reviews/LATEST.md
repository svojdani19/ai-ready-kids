# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 04 — interrupted-session recovery and visible keyboard focus

- **Commit:** `de054bc` on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-26-sprint-04.md`](2026-08-26-sprint-04.md)
- **Files touched:** `src/app/student/checkin/[form]/CheckInPlayer.tsx`,
  `tests/checkin-player.test.tsx`, `docs/classroom-review.md`, `README.md`

### What changed

1. **Recovery state for an unfinalized check-in.** "Every authored item
   answered, completion marker missing" is now distinct from "start at the
   beginning". The player opens on a *Let's finish saving* screen, renders no
   stories and no radios, and resubmits no answers. Partial sets still resume at
   the first unanswered story.
2. **Focus ring moved onto the visible card.** The option cards wrap an
   `sr-only` radio, so the global ring was painting on a clipped 1px box.
   Now `has-[input:focus-visible]` paints a 4px marigold outline on the card,
   with `focus-visible:outline-none` on the input.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, 151 tests, production build.
- Recovery driven in a real browser at 768×1024 against a seeded 9/9
  unfinalized check-in; stored responses came back **byte-identical** after
  finishing, one row, one completion timestamp.
- Focus confirmed by computed style on the live DOM (`solid 4px rgb(156,86,5)`
  on the label, `outline-style: none` on the input) and by checking the
  generated stylesheet carries the `:has(:is(input:focus-visible))` rule.
  Rechecked at an emulated 200% zoom (384×512), no horizontal overflow.
- Classroom Mode regression at 1280×800: reveal, touch switching A → C without
  leaving the decision, *Show the choices*, hands-up tally, keyboard routes.

### Where this is most likely still wrong

Worth attacking these rather than re-verifying the above:

- **Recovery copy at a grade 2 reading level.** *"You already answered all 9
  stories, and every one of them is safe"* — is "answered" the right word for a
  seven year old here, and does "safe" read as *saved* or as *not dangerous*?
  This is the one new piece of child-facing copy in the sprint.
- **Recovery offers no review of answers.** Deliberate, so a child cannot
  overwrite a real first-pass answer. But a child who genuinely misremembers
  finishing has no way to see what they picked. Is that the right trade?
- **Focus ring colour is fixed marigold.** It works on paper and on the denim
  selected wash, but it is not derived from school branding. If branding ever
  reaches student surfaces this will collide.
- **200% zoom was emulated by halving the viewport.** Reflow is faithful, text
  rasterisation is not. Real browser zoom remains unchecked.
- **Content, not mechanics.** The last four sprints have all been interaction
  integrity. The nine missions' scenarios, feedback wording and progression
  have not been reviewed since they were written.

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only.
