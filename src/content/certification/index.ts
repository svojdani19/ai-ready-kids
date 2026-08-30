import type { CertificationModule } from "../types";

/**
 * "AI Ready Educator: Foundations" — a five module, roughly forty minute
 * orientation for classroom teachers. It is deliberately short, text-only and
 * printable, because the realiztic slot for this is a staff meeting or a prep
 * period, not a summer institute.
 *
 * Called an orientation rather than a certification, everywhere, on purpose.
 * The checks after each module are not gated: a teacher can answer every one
 * of them incorrectly and still finish. That is a reasonable design for adult
 * professional learning in a low-stakes tool, and it means the only thing the
 * system knows is that somebody read five modules and answered five questions.
 * Reporting that as "certified" would tell a principal their staff understood
 * the material, which is a claim the data cannot carry. The artefact is a
 * certificate of completion and the metric is completion.
 */
export const CERTIFICATION_MODULES: CertificationModule[] = [
  {
    id: "cert-1",
    order: 1,
    title: "What grades 1 to 5 actually need",
    minutes: 7,
    body: [
      "Six to eleven year olds are not going to be taught their way out of encountering AI. They meet it on a sibling's tablet, on a parent's phone, in a video game, in a smart speaker in someone else's kitchen, and in a search box that now answers the question instead of helping them learn from it. The question is not whether they will use it. It is whether the first time they meet a request for their address, or a confident wrong answer, is the first time they have thought about it.",
      "That is the whole design brief for this program: practice before exposure. The curriculum is 27 authored missions, three for each of the nine skills, so a child meets the same decision in three different situations rather than once.",
      "Before any of that there is First Look: six short sessions, in a grades 1 and 2 tier and a grades 3 to 5 tier, for a class that has not been told what AI is. Every mission in the core curriculum assumes three things a child already has. That AI is a program which produces what usually comes next. That it is already inside ordinary tools rather than being a robot in a film. And that a person decides when it is used and is answerable for the result. Those three were assumed and never taught until First Look existed, which meant a mission about declining a request for a home address could be played by a child who thought the app asking was alive.",
      "First Look records no skill evidence, deliberately. A six year old answering a comprehension question on the board has not demonstrated a safety skill in the sense the nine skills mean, so no competency figure moves and no competency total includes it — the report says only what the core missions can actually support. It does record that the child opened and finished the session, which counts as completed work on the class page, and a First Look run on the board with nobody signed in records nothing about any individual at all.",
      "The shape of each encounter is deliberate: a specific situation first, then the decision rule named out loud, then the same rule met again somewhere new. That is a sequence to teach with, not a claim about what a seven year old is capable of. Plenty of children this age reason perfectly well in the abstract, and the repetition is there so they get practice applying a rule rather than because they cannot hold one.",
      "What this age band can genuinely do is impressive. Grade 1 can tell you that a program which fills in the next word has never met their cat, and grade 5 can watch a tool invent a school swimming team and say why. They can distinguish a fact about themselves from a fact that locates them. They can hold the idea that a confident voice proves nothing. They can tell you which of four kinds of help fits a problem. An abstract warning on its own is thin material to work from at any age, and thinner still about a situation nobody has ever met, which is why every mission is a story with a decision in it.",
    ],
    keyPoints: [
      "Practice before exposure, not after an incident",
      "First Look first: six sessions, two grade tiers, for a class that has not been told what AI is",
      "27 missions, three per skill: the same decision met in three different situations",
      "Start concrete, name the rule out loud, then meet it again somewhere new",
      "The goal is a decision habit, not fear of technology",
    ],
    check: {
      question: "A colleague suggests waiting until fifth grade, when students actually get accounts. What is the strongest response?",
      options: [
        { id: "a", label: "Students already encounter AI outside school, so the practice needs to come first", correct: true },
        { id: "b", label: "Fifth grade is too late for any technology instruction", correct: false },
        { id: "c", label: "Younger students learn abstract rules more easily", correct: false },
      ],
      explanation:
        "Exposure is not controlled by the school's account policy. Children meet these systems in homes, cars and other people's devices well before a district issues them a login, so the rehearsal has to precede the account.",
    },
  },
  {
    id: "cert-2",
    order: 2,
    title: "Student data and the tools in your room",
    minutes: 8,
    body: [
      "The practical risk in an elementary classroom is rarely dramatic. It is a free app, adopted quickly because it solved a real problem on a hard week, that quietly collects more than it needs. Under FERPA the school stays responsible for education records even when a vendor holds them, and under COPPA a vendor collecting personal information from a child under thirteen needs verifiable consent, which schools can give for educational use only in limited circumstances.",
      "None of that requires you to become a lawyer. It requires three habits. Check whether a tool is on your district's approved list before students touch it. Notice what the tool asks students to type. Report it when a tool asks for something it does not need.",
      "The most useful thing you can model is the last one. When you tell a class that you turned an app off because it asked for their addresses, you have taught the lesson better than any mission can.",
    ],
    keyPoints: [
      "The common failure is a well-meant quick adoption, not a malicious vendor",
      "Approved list first, then watch what students are asked to type",
      "Reporting a bad request out loud teaches the class more than a slide does",
    ],
    check: {
      question: "A free reading app asks each student for a full name, birthday and home ZIP code at sign-up. What is the right first move?",
      options: [
        { id: "a", label: "Have students enter initials instead and continue", correct: false },
        { id: "b", label: "Stop, and check the district approved list before students use it", correct: true },
        { id: "c", label: "Let students use it but skip the birthday field", correct: false },
      ],
      explanation:
        "Field-level workarounds still put the class in a tool nobody has vetted. The check belongs before use, and the request itself is worth reporting so the next classroom does not repeat it.",
    },
  },
  {
    id: "cert-3",
    order: 3,
    title: "Teaching verification without teaching cynicism",
    minutes: 8,
    body: [
      "There is a failure mode at the other end of this work, and it is worth naming early. A student who concludes that nothing can be known and everything is fake has not become a critical thinker. They have become unreachable, and they are harder to teach than the student who believes the first answer.",
      "The move that avoids it is to always pair doubt with a destination. Never stop at that might not be true. Always continue with so where would we find out. Every verification mission in this program ends at a source, not at a shrug.",
      "The second thing to protect is the student's self-image as a detector. Synthetic media is getting better every year, and a curriculum built on spotting six fingers will expire. Teach provenance as the durable skill: who made this, who saw it happen, does it match what I know first-hand. Artefact-spotting is a bonus, not the lesson.",
    ],
    keyPoints: [
      "Pair every doubt with a destination: where would we find out",
      "Provenance outlasts artefact-spotting",
      "Universal cynicism is a failure of the unit, not a success",
    ],
    check: {
      question: "A student announces that all photos online are fake now. What is the best response?",
      options: [
        { id: "a", label: "Agree, since generated images are now very common", correct: false },
        { id: "b", label: "Correct them and move on with the lesson", correct: false },
        { id: "c", label: "Ask them how they could find out whether one specific photo is real", correct: true },
      ],
      explanation:
        "Blanket disbelief is as unhelpful as blanket belief and cannot be argued away. Redirecting to a specific, answerable question gives the student a method instead of a posture.",
    },
  },
  {
    id: "cert-4",
    order: 4,
    title: "Protecting learning ownership",
    minutes: 8,
    body: [
      "Over-reliance in elementary school almost never looks like cheating. It looks like a child who believes that homework is a product to be handed in, meeting a tool that produces exactly that product. The belief comes first, and it is one we teach accidentally every time completion is what gets praised.",
      "The practical intervention is small and repeatable. Ask the class what the assignment is for before it starts. If the answer is practice, then the practice has to happen in the student's own handwriting or their own mouth, and a tool's job is to check afterwards. If the answer is producing a thing, a tool may legitimately help make it.",
      "Give students a sentence for asking well. Give me a hint, not the answer. Ask me a question about it. Tell me if my first step is right. Children who have these sentences use tools better than children who have a ban, because a ban ends the moment they are unsupervised.",
    ],
    keyPoints: [
      "Over-reliance follows from believing homework is a product, not from laziness",
      "Name what the task is for before it starts",
      "Teach request sentences; bans stop working the moment nobody is watching",
    ],
    check: {
      question: "Which classroom policy is most likely to build durable learning ownership?",
      options: [
        { id: "a", label: "No AI tools may be used for any homework", correct: false },
        { id: "b", label: "Name the purpose of each task, and teach students to ask for hints rather than answers", correct: true },
        { id: "c", label: "Allow AI tools only for students who finish early", correct: false },
      ],
      explanation:
        "A prohibition transfers no skill and is unenforceable at home. Naming the purpose gives students a rule they can apply themselves, which is the only kind that survives being unsupervised.",
    },
  },
  {
    id: "cert-5",
    order: 5,
    title: "Talking with families",
    minutes: 7,
    body: [
      "Families arrive at this topic from very different places. Some are worried and want the school to ban everything. Some use these tools daily at work and find the worry overblown. Both groups respond well to the same thing: a specific description of what their child practiced, and one question to ask at dinner.",
      "That is why every mission in this program ships with a one page take-home in plain language, and why none of them require a parent account. Adding an account is a data collection decision, and for a take-home sheet it is not a trade worth making.",
      "One caution on wording. Avoid telling families the school will keep their child safe from AI, which is a promise no school can keep. What the school can say honestly is that their child has practiced specific decisions and can name what to do. That claim is true, it is checkable, and it holds up at a board meeting.",
    ],
    keyPoints: [
      "Lead with what the child practiced and one question to ask",
      "No parent account required, because collecting one is not worth the trade",
      "Promise practiced decisions, never protection",
    ],
    check: {
      question: "A caregiver asks whether this program will keep their child safe from AI. What is the most honest answer?",
      options: [
        { id: "a", label: "Yes, students who complete every mission are protected", correct: false },
        { id: "b", label: "No, and the school should not be responsible for this at all", correct: false },
        { id: "c", label: "No school can promise that, but your child has practiced specific decisions and can tell you what they are", correct: true },
      ],
      explanation:
        "Safety guarantees are unkeepable and cost credibility the first time something happens. A claim about practiced, demonstrable decisions is both accurate and more reassuring, because families can verify it themselves at home.",
    },
  },
];

export const CERTIFICATION_TITLE = "AI Ready Educator: Foundations";
export const CERTIFICATION_MINUTES = CERTIFICATION_MODULES.reduce(
  (total, m) => total + m.minutes,
  0,
);
