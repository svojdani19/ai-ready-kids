/**
 * How to run a session.
 *
 * Every mission already ships a discussion guide: what it teaches, what to
 * watch for, what to ask afterwards, what to say when a child says the
 * predictable wrong thing. None of that told a teacher how to *run the twenty
 * minutes* — when children are on devices, when they are not, what the adult
 * is doing while they play, and what to do when eight of them finish four
 * minutes before the rest.
 *
 * The printable guide header has claimed "X minutes independent, 15 minutes
 * debrief" since sprint 12 without anywhere describing that shape. This is that
 * description, authored once and shared by every surface that references it, so
 * the run sheet on a mission page and the guidance page cannot drift apart.
 *
 * Two shapes, because the product has two kinds of session and they are taught
 * differently. First Look is led from the board and produces no skill evidence;
 * a core mission is played independently and does.
 */

export interface SessionStep {
  /** Minutes this step takes. Sums to the shape's total. */
  minutes: number;
  label: string;
  /** What the adult is doing. Second person, concrete. */
  teacher: string;
  /** What the children are doing. */
  children: string;
}

export interface SessionShape {
  id: "first-look" | "core-mission";
  name: string;
  /** Which sessions this shape covers, in a teacher's words. */
  applies: string;
  /** Total including debrief. */
  totalMinutes: string;
  steps: SessionStep[];
  /** The single sentence that matters most about this shape. */
  keyPoint: string;
}

export const SESSION_SHAPES: SessionShape[] = [
  {
    id: "first-look",
    name: "A First Look session",
    applies:
      "The six First Look sessions, in a grades 1–2 tier and a grades 3–5 tier. Run these before any core mission with a class that has not been taught what AI is.",
    totalMinutes: "20 to 25 minutes",
    steps: [
      {
        minutes: 3,
        label: "Ask before you tell",
        teacher:
          "Ask the room what they think a computer is doing when it answers a question. Take three answers and write them where everyone can see. Do not correct any of them yet.",
        children: "Answering out loud. Some will say the computer is thinking, or alive, or looking things up. All three are useful to have on the board.",
      },
      {
        minutes: 10,
        label: "Walk the session on the board",
        teacher:
          "Open Classroom Mode and step through the scenes together, stopping at each choice. Ask for hands before you tap. Read the response aloud even when the class chose well.",
        children: "Watching one screen, deciding together, hearing why an answer was reasonable or why there was a safer move.",
      },
      {
        minutes: 5,
        label: "Come back to the board",
        teacher:
          "Return to the three answers you wrote at the start. Ask which ones the session changed, and which ones were closer than the class first thought.",
        children: "Revising their own first answer out loud. This is the part that makes the session stick.",
      },
      {
        minutes: 5,
        label: "Name the one idea",
        teacher:
          "Close with the single idea the session carries, in your own words, and leave it visible for the week.",
        children: "Hearing it said plainly once, not summarized five ways.",
      },
    ],
    keyPoint:
      "Nobody needs a device. First Look is a conversation with a screen in front of it, and it works with one board and no logins at all.",
  },
  {
    id: "core-mission",
    name: "A core mission session",
    applies:
      "All 27 core missions, grades 2–4. Each is 7 to 9 minutes of independent play, and the debrief is where the learning is consolidated.",
    totalMinutes: "25 to 30 minutes",
    steps: [
      {
        minutes: 3,
        label: "Set the situation, not the answer",
        teacher:
          "Read the mission's setup line from the guide. Say what the child in the story is about to face. Do not tell the class what the right choice is, and do not warn them that there is a trick.",
        children: "Listening. They should go in genuinely unsure, because a child who has been told the answer practices nothing.",
      },
      {
        minutes: 9,
        label: "They play; you circulate",
        teacher:
          "Walk the room. Watch the choices, not the speed. The guide's 'what to watch for' list is what you are looking for — say nothing about it yet, just note who did what.",
        children: "Playing alone, at their own pace. There is no timer, no score and no leaderboard, so there is nothing to rush for.",
      },
      {
        minutes: 3,
        label: "Land the finishers",
        teacher:
          "Children finish several minutes apart. Have the same thing ready every time so it is a routine and not an improvisation — the take-home page to read, or the badge screen to look at.",
        children: "The early finishers have somewhere to be. Nobody is waiting and watching the slow ones.",
      },
      {
        minutes: 15,
        label: "Debrief the whole class",
        teacher:
          "Work through the guide's debrief questions. Ask children who chose differently to say why, and treat a rethink choice as a normal thing that happened, never as an error to name a child for.",
        children: "Hearing that other people chose otherwise and why. This is the part that transfers to a situation the mission never showed them.",
      },
    ],
    keyPoint:
      "The debrief is longer than the mission on purpose. The screen supplies a shared situation; the conversation is what turns it into a habit.",
  },
];

/** The three rooms this actually gets run in. */
export const ROOM_SETUPS = [
  {
    setup: "One device each",
    guidance:
      "The intended shape. Everyone plays at once, you circulate, and the debrief follows immediately while it is fresh.",
  },
  {
    setup: "A few devices, or a rotation",
    guidance:
      "Run the mission as a station across a morning and hold the debrief once, at the end, with everyone. Do not debrief the first group in front of the group that has not played yet — you would be handing them the answer.",
  },
  {
    setup: "One board and no devices",
    guidance:
      "Run any session in Classroom Mode as a whole-class decision. Children still practice choosing and justifying; what is lost is the individual record, so nothing appears on the roster for that session.",
  },
];

/** What happens in a real room, and what to do. */
export const WHEN_THINGS_HAPPEN = [
  {
    situation: "A child finishes in four minutes",
    response:
      "They rushed, or they read quickly — both happen. Ask them to tell you what the child in the story decided and why. If they cannot, they can replay it; the replay changes nothing they have already earned.",
  },
  {
    situation: "A child is stuck and asking you what to pick",
    response:
      "Turn it back once: 'what would happen if you did?' If they are still stuck, tell them there is no wrong turn they cannot undo here, and let them choose. A guessed choice is still a decision to discuss.",
  },
  {
    situation: "A child is upset by the situation in a mission",
    response:
      "Stop that child's session. Nothing is lost by stopping and nothing is recorded as a failure. Sit with the specific thing that landed badly rather than the mission as a whole, and tell the family what came up if it seems to come from outside school.",
  },
  {
    situation: "A child wants to redo one they have finished",
    response:
      "Let them. Replay is read-only: the badge stays, the record stays, and nothing they tap the second time is recorded. Say so out loud, because a child who thinks they can lose a badge will not explore.",
  },
  {
    situation: "The class wants to argue about a choice",
    response:
      "This is the best thing that can happen. Let it run and keep it about the decision rather than about who chose it. Then ask what would have to be different for the other choice to be right.",
  },
];

/**
 * Said plainly because the alternative is a teacher inventing a rule.
 *
 * Each of these is a thing the product deliberately does not do, and a teacher
 * who does it anyway undoes the design.
 */
export const NOT_THIS = [
  "Do not tell the class the safe choice before they play. The practice is the choosing.",
  "Do not read a child's choices out to the room, or compare two children's screens. Their evidence is for you and their family, not for an audience.",
  "Do not treat a rethink choice as a wrong answer. It is authored to be a normal step, and every one of them offers a way back.",
  "Do not add a timer, a race or a points chart on top of the mission. There is none in the product on purpose.",
  "Do not ask children to type anything about themselves, on paper or elsewhere, as an extension. Nothing in this product asks a child for personal information, and an activity that does undoes that.",
];

/**
 * What a session leaves behind, per shape.
 *
 * Written from the code rather than from intention. A First Look session does
 * create an attempt record and does count as completed work; what it does not
 * produce is skill evidence, because a comprehension answer on the board is
 * not a demonstrated safety skill. The educator orientation used to say First
 * Look "records nothing on the roster", which was wrong about the first half.
 */
export const WHAT_IS_RECORDED = [
  {
    shape: "A First Look session",
    recorded:
      "That the child opened and finished it, which counts toward completed work on your class page. No skill is marked demonstrated, so it moves no competency figure and appears in no competency total.",
  },
  {
    shape: "A core mission",
    recorded:
      "Which authored choices the child tapped, and a per-skill judgment of demonstrated or developing worked out from those choices. That is the evidence on your roster and in the family take-home.",
  },
  {
    shape: "Any session run on the board only",
    recorded:
      "Nothing about any individual child, because nobody signed in. A whole-class session is teaching, not assessment.",
  },
];
