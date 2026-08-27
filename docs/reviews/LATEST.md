# Latest sprint — ready for independent review

This file is the handoff point. It is rewritten at the end of every sprint and
always describes the most recent one, so a reviewer arriving cold knows what
changed, what has already been checked, and where the weak spots are most
likely to be.

---

## Sprint 12 — general rules, not local truths

- **Commit:** on `main` — <https://github.com/svojdani19/ai-ready-kids>
- **Full review:** [`2026-08-27-sprint-12.md`](2026-08-27-sprint-12.md)
- **Review trail:** sprints 01–12 in this directory. Sprint 09 tripled the
  curriculum to 27 missions. Sprint 10 fixed two mechanism defects found in it.
  Sprints 11 and 12 each fix content defects found by reading two more of the
  missions — four missions read so far, four with findings.

### What changed

1. **"The Study Group" no longer ranks private facts.** Its reflection scene
   asked which fact was "most useful to a stranger" and answered by calling
   faces "not much use" and books "lead nowhere". A child reads a hierarchy as
   permission for everything below the top of it, which contradicts the photo
   and camera missions. The question is now a test the child can apply —
   *which one tells somebody exactly where to find you, and when* — routines
   win because they carry a time as well as a place, and faces are explicitly
   still theirs to keep.
2. **"The Helper and the Teacher" no longer teaches brittle verification.**
   Three matching sums were treated as proof; a single mismatch condemned a
   method; certainty "tells you nothing at all"; and the guide claimed only a
   teacher can show working. Matching examples are now evidence, and the
   teacher's number line supplies the reason. A mismatch routes to *check your
   steps first*. Certainty "on its own does not settle it". An AI explanation
   is described as a further claim to check — better than a bare verdict, still
   not proof.
3. **Mission counts unhardcoded.** The guide footer read "Mission 19 of 9" and
   the teacher dashboard said "N of 9 missions assigned", both left over from
   the nine-mission curriculum. Found during browser verification; both now
   derive from `MISSIONS.length`.

### Already verified — please do not redo

- `npm run verify` green: typecheck, lint, **242 tests**, Turbopack build.
- Six new guards in `tests/content.test.ts`, plus five phrases added to the
  brittle-absolutes ban list, which applies to every mission's student copy:
  `most useful thing a stranger`, `most useful thing for a stranger`,
  `is not much use`, `lead nowhere`, `tells you nothing at all`.
- Sprint 11's four guards and sprint 10's evidence and interleaving assertions
  are unchanged and still passing.
- Both missions checked in the browser at the teacher preview and the printable
  guide; footer now reads "Mission 20 of 27".

### Where this is most likely still wrong

- **Fourteen Sprint 09 missions have still had no human read.** Four have been
  read across sprints 11 and 12, and all four had findings. Treat that as a
  rate. This is the single highest-value place to look, and no test can do it.
- **The failure mode has a shape now:** copy that is true of the case in front
  of the child but false as the general rule they will carry away. Rankings
  that dismiss, examples called proof, absolutes where "usually" is the honest
  word. Look for that shape specifically.
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
