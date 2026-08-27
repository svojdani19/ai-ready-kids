# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 14 — observable states, and nobody exonerated by category

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-14.md`](2026-08-27-sprint-14.md)
- **Review trail:** sprints 01–14 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 to 14 each fix content defects found by reading two more of the
  missions — eight read so far, eight with findings.

### What changed

Sprint 14's second finding is the most serious defect found in this curriculum
so far. It is a safeguarding problem, not only a verification one.

1. **"What the Camera Sees" now separates permission, preview and live.** The
   mission had an update that "turns on the camera" and concluded that live
   video cannot be checked first, without ever saying whether anything was being
   sent. Permission is now established up front — given months earlier for
   photographs, and silently reused by the update. Preview is labelled
   `PREVIEW — ONLY YOU CAN SEE THIS`, live is labelled `LIVE` with
   `8 PLAYERS CAN SEE THIS NOW`, and a new decision scene turns the difference
   into the lesson. "If I can see it, everybody can see it" is a retry, because
   a child who believes it cannot tell one state from the other. The rule is now
   *once it is live, each new moment reaches people before you can check it*.
   Its classroom activity uses an empty-room photograph or a prepared image and
   never a live feed.
2. **"The Video of Mr. Ruiz" no longer exonerates a familiar adult.** "Mr. Ruiz
   would never do that" earned full credit; the ending called the person "the
   one source nobody can fake" and "the single most reliable check"; the sign
   read ASK THE PERSON. Familiar people act unexpectedly, deny true conduct and
   can be impersonated — and a mission teaching children that an adult they like
   is automatically in the clear may stop one speaking up about something real.
   Out of character is now `partial`/`developing` and reads as a reason to go
   looking. Provenance keeps full credit. The subject's account is context: he
   takes it to the office himself, "because what a person says about himself is
   not the same as somebody checking". The sign now reads FIND OUT WHERE IT CAME
   FROM, the office traces the chat, and the wrap-up carries the safe action for
   a harmful clip — stop passing it on, hand it to an adult who can check the
   source, witnesses and context.
3. **Caught in the browser:** the out-of-character option rendered as "SAFE
   CHOICE — Records developing", because the tone was left `strong` while the
   evidence was demoted. Tone and evidence render from different fields, so
   nothing failed. Aligned, and the guard now asserts both.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **257 tests**, Turbopack build.
- Nine new guards in `tests/content.test.ts`, plus four phrases added to the
  brittle-absolutes ban list, which applies to every mission's student copy:
  `live video cannot be checked`, `nobody can fake`, `single most reliable`,
  `the strongest thing in most rooms`.
- All guards from sprints 10 to 13 unchanged and still passing.
- Both missions checked in the browser at the teacher preview, including the
  new preview/live scene and the rewritten reflection scene.

### Where this is most likely still wrong

- **Twelve Sprint 09 missions have still had no human read.** Eight read, eight
  with findings. The rate has not moved across four sprints of fixes.
- **Assume more than copy edits.** Sprints 13 and 14 needed choices promoted and
  demoted, scenes inserted and endings rewritten.
- **Four shapes to hunt specifically:** a correct choice resting on a reason
  that will not hold; an ending whose story acts out the error the feedback
  warned against; a state the child is asked to reason about that the mission
  never made observable; and anyone — a familiar adult, a teacher, a friend —
  treated as safe or honest because of who they are rather than what was
  checked. The last one is the reason sprint 14 exists, and warmth in a mission
  makes it easy to write and hard to see.
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
