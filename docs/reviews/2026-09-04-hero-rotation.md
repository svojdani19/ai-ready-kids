# 2026-09-04 — the hero quoted a mission it was not connected to

**Date:** 2026-09-04
**Scope:** the landing page. One new content module, one new client component,
one new test file, four owner-requested copy changes. No schema, no field, no
child-facing text authored on a marketing page.

## What was asked for

Two things, in order: *"have the hero image on the landing page cycle through
other prompts"*, then a run of copy edits to the sections below it.

## The defect the first request exposed

The hero card was a still, and its words were **typed into `page.tsx` by hand**:

```tsx
<p>“Hi there! Before we start, what is your full name?”</p>
<div>Type your first and last name so it can help you better</div>
<div>Leave it blank and tap Start ✓</div>
```

Those lines are a paraphrase of `m-privacy-1`, scene `s2`. The mission actually
reads *"Hi there! I am so happy to meet you. Before we start, what is your full
name?"* — so the front page was already quoting a version of the scene that no
longer existed, and nothing failed. A marketing page that quotes the product by
copying it is a page that drifts, silently, in the direction of whatever was
true the day somebody typed it.

It also argued the wrong thing. The section immediately below says the program
is three competencies; the hero showed privacy, three times a day, forever.

## The correction

**`src/content/hero.ts`** derives the panels from `MISSIONS`. Which three
missions are featured is an editorial choice and is written down; every word
inside a panel — the scene, the moment, the question, both answers, the mission
number, the competency name and the lane colour — is read out of the mission.

The featured three are one per competency and, deliberately, three different
scenes:

| | Mission | Competency | Scene |
| --- | --- | --- | --- |
| 1 | Sprocket Wants to Know | Keep It Private | tablet |
| 2 | The Penguin on the Playground | Check It Out | playground |
| 3 | The Practice That Got Skipped | Own Your Thinking | kitchen |

The module **fails closed** on all of it: an unknown slug, a mission with no
decision scene, a scene missing either a tempting answer or one that shows the
skill, two panels from the same competency, or two panels drawing the same
illustration each throw at import with the cause named. The last one is the
request itself expressed as a guard — a hero that redraws the same tablet three
times is not a rotation.

**`src/components/marketing/HeroScenes.tsx`** holds the mechanics and the lane
colours and no product copy at all. It advances every 8 seconds and stops on
hover, on keyboard focus, on the Pause control, and entirely when the reader's
system asks for reduced motion. Every panel stays reachable by its own button,
named for its mission rather than numbered, so a stopped carousel is a working
one.

## The copy changes

| Was | Now |
| --- | --- |
| "Three things, practiced nine ways" | "The Fundamentals" |
| "9 missions" eyebrow on each competency card | removed |
| "See all 27 missions →" | "See All the Missions →" |
| "What this means for your school" | "What this is, and what this is not" |
| — | new opening paragraph: "AI Ready Kids is not another prompt tool. It is the tool BEFORE the prompt…" |
| the two paragraphs that followed it | removed — the new one says what they said |
| the purple "No chatbot, ever" callout in the hero | moved verbatim into the first inset box beside that heading |

The last two came after the first pass and are the reason the section reads as
one claim now rather than three overlapping ones. The chatbot promise did not
lose a word; it moved from a coloured box in the hero to the top of the list of
what this is and is not, which is where a reader looking for it now goes.

## Acceptance evidence

`tests/hero-rotation.test.tsx`, **14 tests**, in two halves: the panels are read
out of the curriculum, and the motion can be stopped.

**Mutation-checked seven ways**, each breaking one thing:

| Mutation | Result |
| --- | --- |
| rotation never starts | 3 fail: moves on by itself, pause, hover |
| Pause ignored | 1 fail, exactly the pause test |
| reduced-motion ignored | 1 fail, exactly that test |
| hover ignored | 1 fail, exactly that test |
| moment taken from the first narration line, not the last | 1 fail, naming `sprocket-wants-to-know` and quoting both strings |
| feature a mission whose scene is drawn `tablet` like panel 1 | import throws: *"The featured missions share an illustration (tablet, playground, tablet)"* |
| type the Sprocket quote back into `page.tsx` | 1 fail: *"is hard-coded again"* |

Two of those are worth reading twice. The **shared-illustration** mutation is the
user's actual request, encoded: it cannot be undone quietly. The **hard-coded
quote** mutation is the original defect, and it now fails.

One mutation missed its intended target and is recorded rather than tidied:
substituting *The Homework That Did Itself* was meant to trip the illustration
guard and tripped an earlier one instead — that mission offers no `rethink`
answer, so there is no tempting move to contrast. The guard fired correctly, for
a different reason, and a second mutation was run to prove the illustration
check specifically.

## Verification

```
typecheck  ✓
lint       0 errors, 2 pre-existing warnings (unused imports on the privacy page)
tests      1098 passed (39 files), was 1084 (38)
build      ✓ Compiled successfully, 60 static pages
```

**Browser, at 1280×800 and 768×1024.** All three panels render with their own
illustration, lane colour and answers; the card is **545px on every panel**, so
the rotation causes no layout shift; no horizontal overflow at either width; the
competency cards are equal height with the counts removed; no console errors.
Pause was exercised live — held for 9.5s, then resumed and advanced.

Two accessibility fixes came out of measuring rather than looking: the panel
buttons were 12×12px and are now padded to **28×28** with the dot still drawn at
12, and the Pause control is padded to a 24px target. Both are WCAG 2.5.8.

**One honest limit on the browser pass.** The preview pane was hidden for part of
it, which makes screenshots return a stale frame and blocks scroll input. Above
the fold was verified visually; the sections below it were verified from the
accessibility tree, the rendered text and measured geometry, not from a picture.

## Demo data

Untouched — the only page opened was the marketing home page, which reads
nothing. Swept afterwards across all 12 `_at` columns:

```
schools.created_at, users.created_at, classes.created_at, classes.archived_at,
students.created_at, assignments.assigned_at, attempts.started_at,
attempts.completed_at, benchmarks.started_at, benchmarks.completed_at,
certifications.completed_at, audit_log.created_at
```

Zero rows dated 2026-08-30 or later. Audit log 6, assignments 65, students 90,
classes 4 — the seeded state the last three sprints recorded.

## Known gaps

- **The featured three are an editorial list.** The guards check the *shape* of
  the selection — one per competency, three illustrations, both answer tones
  present — not that these are the three a school buyer should see. Nothing
  fails if a worse mission is substituted for a better one.
- **The new opening paragraph overlaps the one after it.** "Schools and families
  alike build with students rather than respond to engagement failures" and
  "Teachers and families build that with them rather than watching for it" now
  sit two paragraphs apart. Both were kept because only the first was asked for;
  the second is a candidate for cutting.
- **The fade is untested.** The rotation is JavaScript and is covered; the
  crossfade is one CSS class relying on the global `prefers-reduced-motion` rule
  in `globals.css`, and no test asserts that rule still covers it.
- **`aria-roledescription="carousel"` is announced unevenly** across screen
  readers. There is deliberately no live region — an auto-advancing one
  interrupts a reader mid-sentence — which means a screen reader user learns the
  panel changed only by returning to it.
- **The dwell is 8 seconds for everyone.** Long enough to read a decision and two
  answers at an adult pace; it is not adjustable, and a slower reader's only
  option is Pause.
