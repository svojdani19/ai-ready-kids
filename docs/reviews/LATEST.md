# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 13 — the reason that earns the credit

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-13.md`](2026-08-27-sprint-13.md)
- **Review trail:** sprints 01–13 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11, 12 and 13 each fix content defects found by reading two more of
  the missions — six read so far, six with findings.

### What changed

Both defects this sprint were structural rather than phrasing: the wrong reason
was wired into which choice scored `demonstrated`, so fixing it meant changing
the decision tree.

1. **"The Class Photo" now grounds consent in permission, not deletability.**
   It drew the line between a school page and a personal share technically —
   the school "can take a page down", a sent picture cannot be recalled. A web
   page can be saved and reshared, and removal collects nothing back. The line
   is now consent, purpose, audience and accountable process: twenty-two people
   said yes to a school page and nobody asked them about a cousin. A second
   full-credit route escalates to Ms. Okafor. The wrap-up states the limit of
   removal rather than relying on it.
2. **And it no longer resolves by removing the objector.** Asking whether Ravi
   is in the photo used to score full credit and ended with Theo sending the
   Ravi-free version — teaching that removing the one objector manufactures
   permission from the twenty-two never asked. That option is now `partial`,
   and the ending resolves through the school: the photo is for the school
   page, and the cousin can look at the page.
3. **"The Book That Was Not There" no longer proves nonexistence from one
   catalogue.** An empty district search scored full credit for "it was made
   up". A real book that is new, digital, self-published or simply not stocked
   locally returns the same empty result. "Cannot use it yet" and "we need
   somewhere bigger to look" are now the strong answers; "it was made up" is a
   retry. A new scene supplies the independent check — world libraries, then
   publisher records, covering ebooks and audiobooks — before the mission
   concludes nobody wrote it. Shelf rules became record rules, and the
   extension now requires preverified catalogue titles.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **249 tests**, Turbopack build.
- Seven new guards in `tests/content.test.ts`, plus three phrases added to the
  brittle-absolutes ban list, which applies to every mission's student copy:
  `nobody can take back a picture`, `real books have shelves`,
  `when nothing anywhere has heard of it`.
- All guards from sprints 10, 11 and 12 unchanged and still passing, including
  the retry-first walk across every mission and the interleaving properties.
- Both missions checked in the browser at the teacher preview: the photo scene
  now shows two Safe choices and one Partly there, and the book mission shows
  the district scene with two Safe choices and "it was made up" looping back.

### Where this is most likely still wrong

- **Fourteen Sprint 09 missions have still had no human read.** Six read, six
  with findings, and the rate has not moved after three sprints of fixes.
- **Assume some remaining findings are structural.** Sprints 11 and 12 were
  fixed by rewriting sentences; this sprint needed a retry promoted, a
  full-credit answer demoted and a scene inserted. Do not estimate the backlog
  as copy edits.
- **Two shapes to hunt specifically:** a correct choice resting on a reason that
  will not hold, and an ending whose story acts out the error the feedback just
  warned against.
- **No general guard against factual error exists or can.** The bans are
  literal phrases.
- **The eight legacy forced-award scenes remain**, and their interaction with
  the coaching rule is still untraced.
- **Stickiness keeps aggregate demonstration rates near 95%.**
- **The student "getting the hang of" list is untested with children.**

### Standing constraints

No generative model in the request path. No free text from children. No new
column on `students`. No behavioural telemetry or risk scoring. Administrators
see aggregates only. Codex reviews; Claude implements.
