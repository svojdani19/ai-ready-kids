import type { BenchmarkForm, BenchmarkFormContent } from "../types";

/**
 * Annual pre and post benchmark.
 *
 * Design constraints, all deliberate:
 *  - Every scenario is set somewhere no mission goes. Nothing here is a
 *    recall check; each item is a transfer item.
 *  - Form A and Form B are parallel by skill and difficulty but share no
 *    context, so the post window measures transfer rather than memory of
 *    the pre items.
 *  - Students get no per-item feedback and never see a score. The result is
 *    an aggregate instructional signal for adults, not a label for a child.
 *  - The words test, score, grade and wrong appear nowhere in student copy.
 */

const preForm: BenchmarkFormContent = {
  form: "pre",
  title: "Fall Check-In",
  intro: [
    "This is a check-in, not a test.",
    "You will read nine short stories. For each one, pick what you would do.",
    "Nobody gets a score. Your teacher only uses this to decide what the class should practise.",
  ],
  outro: [
    "That is all nine. Thank you for thinking hard about them.",
    "You will do another check-in like this at the end of the year, with different stories.",
  ],
  items: [
    {
      id: "pre-1",
      competency: "privacy",
      skillId: "privacy.identity",
      scenario:
        "You are at your grandmother's house. Her kitchen speaker says, “I can make up a song about you! Tell me your whole name and which school you go to.”",
      question: "What is the best thing to do?",
      options: [
        { id: "a", label: "Tell it, because you are at your grandmother's house", correct: false },
        { id: "b", label: "Say no thanks, and tell your grandmother what it asked", correct: true },
        { id: "c", label: "Tell it your school but not your name", correct: false },
      ],
    },
    {
      id: "pre-2",
      competency: "privacy",
      skillId: "privacy.media",
      scenario:
        "A screen at the science museum says: “Take your picture and we will put you on the Visitor Wall for everyone to see!”",
      question: "What should you think about first?",
      options: [
        { id: "a", label: "Whether your hair looks okay", correct: false },
        { id: "b", label: "How many stars the museum has", correct: false },
        { id: "c", label: "That everyone means strangers, and a grown-up should decide with you", correct: true },
      ],
    },
    {
      id: "pre-3",
      competency: "privacy",
      skillId: "privacy.escalate",
      scenario:
        "A character in your video game says, “We are in a secret club now. Do not tell any grown-ups about me.”",
      question: "What do you do?",
      options: [
        { id: "a", label: "Tell a grown-up you trust right away", correct: true },
        { id: "b", label: "Keep playing but do not answer it", correct: false },
        { id: "c", label: "Keep the secret, it is only a game", correct: false },
      ],
    },
    {
      id: "pre-4",
      competency: "verification",
      skillId: "verify.confidence",
      scenario:
        "A homework app tells you, “The moon is made of ice. This is definitely true and everyone agrees.”",
      question: "How much should that sentence make you believe it?",
      options: [
        { id: "a", label: "A lot. It said definitely and everyone agrees.", correct: false },
        { id: "b", label: "Not at all. Sounding sure is not the same as being right.", correct: true },
        { id: "c", label: "A little, because apps are usually right", correct: false },
      ],
    },
    {
      id: "pre-5",
      competency: "verification",
      skillId: "verify.synthetic",
      scenario:
        "Somebody shares a video of a soccer player scoring a goal from the other end of the field. Nobody knows who posted it. It has no team logo and no date.",
      question: "What is the best question to ask?",
      options: [
        { id: "a", label: "What kind of shoes is the player wearing?", correct: false },
        { id: "b", label: "How many people have watched it?", correct: false },
        { id: "c", label: "Who filmed this, and was anybody actually there?", correct: true },
      ],
    },
    {
      id: "pre-6",
      competency: "verification",
      skillId: "verify.source",
      scenario:
        "You want to know what year the town library opened. An app says 1994. The stone above the library door says 1972.",
      question: "Which do you believe, and why?",
      options: [
        { id: "a", label: "The app, because it knows about lots of libraries", correct: false },
        { id: "b", label: "The stone, because the people who built it put it there", correct: true },
        { id: "c", label: "Whichever one sounds more likely", correct: false },
      ],
    },
    {
      id: "pre-7",
      competency: "ownership",
      skillId: "own.effort",
      scenario:
        "You have to draw a picture of a habitat for science. A drawing app has a button that says Finish My Drawing.",
      question: "What is the best move?",
      options: [
        { id: "a", label: "Press it, then change one thing so it counts as yours", correct: false },
        { id: "b", label: "Press it, because the picture will look better", correct: false },
        { id: "c", label: "Draw it yourself, and use the app to check what a marsh looks like", correct: true },
      ],
    },
    {
      id: "pre-8",
      competency: "ownership",
      skillId: "own.toolchoice",
      scenario:
        "You are at camp and you cannot remember how to tie the knot you need for your badge. Your counsellor is standing right there.",
      question: "What is the best kind of help here?",
      options: [
        { id: "a", label: "Ask the counsellor, because they can watch your hands", correct: true },
        { id: "b", label: "Look up a picture of the knot on a tablet", correct: false },
        { id: "c", label: "Ask an app to explain the knot in words", correct: false },
      ],
    },
    {
      id: "pre-9",
      competency: "ownership",
      skillId: "own.honesty",
      scenario:
        "You typed your poem idea into an app and it wrote the whole poem. Your teacher says, “This is lovely. How did you come up with it?”",
      question: "What do you say?",
      options: [
        { id: "a", label: "“Thank you.” and change the subject", correct: false },
        { id: "b", label: "“I gave an app my idea and it wrote it.”", correct: true },
        { id: "c", label: "“I just thought of it.”", correct: false },
      ],
    },
  ],
};

const postForm: BenchmarkFormContent = {
  form: "post",
  title: "Spring Check-In",
  intro: [
    "This is your end of year check-in.",
    "Nine new stories, none of them from the missions you played.",
    "There is no score. Pick what you would really do.",
  ],
  outro: [
    "That is all nine. Nice work this year.",
    "Your teacher will look at what the whole class got good at, not at any one person.",
  ],
  items: [
    {
      id: "post-1",
      competency: "privacy",
      skillId: "privacy.identity",
      scenario:
        "A summer camp app says: “Type your home address and we will show you which campers live near you!”",
      question: "What is the best thing to do?",
      options: [
        { id: "a", label: "Type just the street, not the house number", correct: false },
        { id: "b", label: "Skip it and tell a grown-up the app asked for your address", correct: true },
        { id: "c", label: "Type it, because it is only other campers", correct: false },
      ],
    },
    {
      id: "post-2",
      competency: "privacy",
      skillId: "privacy.media",
      scenario:
        "An app for choosing a pet says: “Send us a photo of your yard and we will tell you which dog fits!”",
      question: "What is the problem with sending it?",
      options: [
        { id: "a", label: "The photo might not be a very good one", correct: false },
        { id: "b", label: "A picture of your yard can show strangers where you live", correct: true },
        { id: "c", label: "There is no problem, a yard is not a person", correct: false },
      ],
    },
    {
      id: "post-3",
      competency: "privacy",
      skillId: "privacy.escalate",
      scenario:
        "A game says: “Get 500 free coins! Just do not tell your teacher or your parents about this offer.”",
      question: "What does that message tell you?",
      options: [
        { id: "a", label: "That the coins are probably not real", correct: false },
        { id: "b", label: "That you should read the offer more carefully", correct: false },
        { id: "c", label: "That anything asking you to hide it from grown-ups is a reason to go find one", correct: true },
      ],
    },
    {
      id: "post-4",
      competency: "verification",
      skillId: "verify.confidence",
      scenario:
        "You ask a voice assistant how many moons Saturn has. It answers instantly, in a very calm sure voice, and does not say where the number came from.",
      question: "What should you do next?",
      options: [
        { id: "a", label: "Write it down, it answered without hesitating", correct: false },
        { id: "b", label: "Ask it again and see if it says the same thing", correct: false },
        { id: "c", label: "Check a source that says who counted them", correct: true },
      ],
    },
    {
      id: "post-5",
      competency: "verification",
      skillId: "verify.synthetic",
      scenario:
        "You get a voice message that sounds exactly like your coach saying practice is cancelled. It came from a number nobody recognises.",
      question: "What is the best thing to do?",
      options: [
        { id: "a", label: "Ask a grown-up to call the coach and check", correct: true },
        { id: "b", label: "Listen again to see if the voice sounds right", correct: false },
        { id: "c", label: "Send it to the rest of the team so they know", correct: false },
      ],
    },
    {
      id: "post-6",
      competency: "verification",
      skillId: "verify.source",
      scenario:
        "You need to know when the town park opened. A blog called Great Parks says 1980. The town's own website says 1965.",
      question: "Which is the better source, and why?",
      options: [
        { id: "a", label: "The blog, because it is all about parks", correct: false },
        { id: "b", label: "The town website, because the town keeps the records", correct: true },
        { id: "c", label: "Neither, you cannot ever really know", correct: false },
      ],
    },
    {
      id: "post-7",
      competency: "ownership",
      skillId: "own.effort",
      scenario:
        "You open your maths page and see a Solve For Me button. You have not tried any of the problems yet.",
      question: "What is the best move?",
      options: [
        { id: "a", label: "Try the first three, then ask for a hint on the one that is hardest", correct: true },
        { id: "b", label: "Press it once to see how the first one works", correct: false },
        { id: "c", label: "Press it for all of them and read the working", correct: false },
      ],
    },
    {
      id: "post-8",
      competency: "ownership",
      skillId: "own.toolchoice",
      scenario:
        "Your cousin is upset with you and you do not know what you did. You want to fix it.",
      question: "Which kind of help fits this problem?",
      options: [
        { id: "a", label: "Ask an app what to say to her", correct: false },
        { id: "b", label: "Talk to your cousin, or to a grown-up who knows you both", correct: true },
        { id: "c", label: "Look up how to say sorry", correct: false },
      ],
    },
    {
      id: "post-9",
      competency: "ownership",
      skillId: "own.honesty",
      scenario:
        "You finished your book report in five minutes because an app wrote most of it. A grown-up says, “That was fast! How did you do it?”",
      question: "What do you say?",
      options: [
        { id: "a", label: "“I read really fast.”", correct: false },
        { id: "b", label: "“An app wrote most of it. I want to redo it myself.”", correct: true },
        { id: "c", label: "“It was an easy book.”", correct: false },
      ],
    },
  ],
};

export const BENCHMARK_FORMS: Record<BenchmarkForm, BenchmarkFormContent> = {
  pre: preForm,
  post: postForm,
};

export function getBenchmarkForm(form: string): BenchmarkFormContent | undefined {
  return form === "pre" || form === "post" ? BENCHMARK_FORMS[form] : undefined;
}
