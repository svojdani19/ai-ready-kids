# Working on AI Ready Kids

## The standing requirement

**Every sprint ends with a classroom review.** Build, then review, then fix,
then call it done. The checklist is `docs/classroom-review.md` and it is not
optional: a sprint that produces features and no review, or a review that
produces findings and no fixes, is not finished.

Write each review to `docs/reviews/<date>-sprint-NN.md`. Say what was found,
what was changed, and what was deliberately left and why.

The review has three parts, all of which must be run: **teacher-led group
instruction** on a projector, **independent grade 2–4 use** on a Chromebook and
a tablet, and the cross-cutting pass covering developmental appropriateness,
instructional clarity, privacy, accessibility, cultural inclusion and teacher
workload.

## What this product is for

Judge every feature against this, not against engagement:

> Does this help a seven to ten year old build calibrated trust and safe habits
> around AI, and prepare them to use it responsibly later?

Entertaining them is not the goal. Teaching them where a button lives is not
the goal. Teaching them to distrust everything is a failure, not a success.

## Rules that are not up for renegotiation

- **No generative model in the request path.** Every word a child can read is
  authored and shipped with the build. The fictional AI characters are scripts.
- **No new student fields.** If a sprint wants a column on `students` beyond
  display name and avatar, the answer is almost certainly no. A column that
  exists eventually gets filled in.
- **No behavioural telemetry and no risk scores.** Not time-on-task, not idle
  timers, not readiness bands. The unit of reporting is "which of the nine
  skills has this student demonstrated".
- **Administrators see aggregates only.** There is no route that shows an
  administrator a named student's answers, and adding one is a product change,
  not a feature request.
- **Unsafe branches always loop back.** A `rethink` choice offers another go
  and records no evidence. `tests/content.test.ts` enforces this.

## Before you commit

```bash
npm run verify   # typecheck, lint, tests, production build
```

Content changes are covered by structural tests: reachability, termination,
feedback coverage, retry-on-unsafe, skill coverage and reading level. If you
add a mission, those run against it automatically.
