import type { Mission } from "../types";

/**
 * Additional learning-ownership missions, two per skill.
 *
 * Every decision scene offers at least two non-looping exits. No situation
 * here appears in either benchmark form.
 */

export const theStoryThatWasNotMine: Mission = {
  id: "m-own-4",
  slug: "the-story-that-was-not-mine",
  order: 12,
  title: "The Story That Was Not Mine",
  competency: "ownership",
  primarySkillId: "own.effort",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "The app wrote a better story than yours. That is the problem, not the good news.",
  summary:
    "A writing tool produces a polished story from a child's idea. Students practice wanting their own worse version, and learn to ask for help with a stuck part rather than a finished whole.",
  learningGoals: [
    "Notice when help has replaced the part you wanted to do",
    "Ask for help with the stuck bit only",
    "Value your own rougher work for the right reason",
  ],
  badge: {
    id: "badge-own-4",
    name: "Own Words",
    blurb: "You kept the story yours, bumps and all.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "kitchen",
      narration: [
        "The writing homework is a story about somebody who finds something they should not have found.",
        "You have an idea you actually like. A boy finds a door in the back of a wardrobe at his grandmother's house, and the door is warm.",
        "You have written four lines. The fifth one will not come.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      speaker: "Sprocket",
      narration: [
        "You type your idea into Sprocket and ask for help with what happens next.",
        "It gives you the whole story. Six paragraphs. There is a bit where the door hums when it rains that is genuinely better than anything you were going to think of.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "kitchen",
      narration: [
        "It is a good story. It is better than the one you were going to write.",
        "That is exactly what is bothering you and you are not sure why.",
      ],
      prompt: "Why does the good version feel wrong?",
      choices: [
        {
          id: "c1",
          label: "Because the fun bit was going to be working out what was behind the door",
          feedback: {
            tone: "strong",
            headline: "It took the interesting part",
            body: "You did not want a story about a warm door. You wanted to find out what was behind it by writing until you knew. That is gone now, and it was the whole point.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Because I could not have written it",
          feedback: {
            tone: "strong",
            headline: "And handing it in would say that you did",
            body: "That is a real reason and it is worth being honest about. Somebody will read it and think this is what you can do, and then next week they will find out.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "It does not feel wrong. It is just a better story.",
          feedback: {
            tone: "rethink",
            headline: "Better at what, though?",
            body: "It is better writing. It is worse homework, because the homework was for you to do the thinking. Have another go.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "kitchen",
      narration: [
        "You could ask again, differently. You are still stuck on line five.",
      ],
      prompt: "What is a better thing to ask for?",
      choices: [
        {
          id: "c1",
          label: "“Ask me three questions about the door.”",
          feedback: {
            tone: "strong",
            headline: "Questions, not answers",
            body: "Is it warm all the time? Does anyone else know? What is on the other side of that wall in the room next door? By question three you have stopped needing Sprocket.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "“Give me five words that might be in this story.”",
          feedback: {
            tone: "strong",
            headline: "Ingredients, not a meal",
            body: "Hinge. Draught. Hum. Coat. Chalk. You still have to build something out of them, which means the building is still yours.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "“Write it again but make it sound more like a nine year old.”",
          feedback: {
            tone: "rethink",
            headline: "That is the same thing wearing your clothes",
            body: "It would still be its story with your voice painted on, which is arguably worse. Ask for something that leaves you with work to do. Try again.",
            coachNote:
              "Make-it-sound-like-me is the most common request students invent. It feels like a compromise and it is not one.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "kitchen",
      narration: [
        "You write the rest yourself. It takes forty minutes and there is a bit in the middle that goes wrong and has to be crossed out.",
        "What is behind the door turns out to be your own kitchen, but at night, with nobody in it.",
      ],
      prompt: "How do you feel about it, honestly?",
      choices: [
        {
          id: "c1",
          label: "It is worse than the app's, and I like it more",
          feedback: {
            tone: "strong",
            headline: "Both of those are true at once",
            body: "The ending is yours. You did not know it was going to be the kitchen until you wrote your way there, and that surprise is not available in a story somebody hands you.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "A bit disappointed. The other one had the humming door.",
          feedback: {
            tone: "partial",
            headline: "That is an honest answer",
            body: "You are allowed to think it was a good line. Nothing stops you writing your own humming door next time, and next time you will know you can.",
          },
          evidence: { skillId: "own.effort", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "I should have just used the good one",
          feedback: {
            tone: "rethink",
            headline: "Read your ending again",
            body: "Your own kitchen at night with nobody in it. Sprocket did not think of that, because it does not know your kitchen. Have another go.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "classroom",
      narration: [
        "Ms. Okafor reads a few out. She stops after yours and asks the room how you got to the kitchen.",
        "You explain about the three questions.",
      ],
      prompt: "What is the rule you would write on the wall?",
      choices: [
        {
          id: "c1",
          label: "Ask for questions, not answers",
          feedback: {
            tone: "strong",
            headline: "Four words, and it works for everything",
            body: "Math, stories, science, arguments with your sister. A question hands the thinking back. An answer keeps it.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Never use it for writing",
          feedback: {
            tone: "rethink",
            headline: "You did use it, and it helped",
            body: "The three questions came from Sprocket. The rule is about what you ask for, not about staying away. Try again.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Write your own ending even if it is worse",
          feedback: {
            tone: "strong",
            headline: "That is the harder half of it",
            body: "Worse and yours is the deal. It gets better the more of them you write, and it only gets better if you keep taking it.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "classroom",
      narration: [
        "The wall next to the four doors gets one more card, in your handwriting.",
        "ASK FOR QUESTIONS, NOT ANSWERS.",
      ],
      wrapUp: [
        "Notice when help has taken the interesting part.",
        "Ask for questions, words or an example. Not the finished thing.",
        "Say what you asked for. Nobody minds, and then it is not a secret.",
        "Worse and yours beats better and somebody else's.",
      ],
    },
  ],
  guide: {
    setup:
      "Writing is where over-reliance is most tempting and hardest to detect, because a good story leaves no wrong answers behind. The mission works by making the generated version genuinely better, so the argument cannot rest on quality.",
    lookFor: [
      "Students who cannot articulate why a better story feels wrong",
      "Whether anyone invents make it sound like me as a compromise",
      "Students who need permission to prefer their own rougher work",
      "Whether anyone says what they asked for, rather than only being careful about what they asked for",
    ],
    questions: [
      "The app's story was better. Why was that a problem?",
      "What is the difference between asking for questions and asking for answers?",
      "What did you find out by writing that you could not have been told?",
      "Is worse and yours always better? When is it not?",
      "You asked it for three questions. Who should know that, and why is it fine that they do?",
    ],
    misconceptions: [
      {
        student: "But it was a better story.",
        response:
          "Agree immediately and completely, then change the measure. The homework was not to produce a good story; it was to do the thinking. Two different things were being judged.",
      },
      {
        student: "I only used it for ideas.",
        response:
          "Take this seriously rather than doubting it, and get specific. Three questions is ideas. Six paragraphs is not. The line is whether work remained.",
      },
    ],
    extension:
      "Give the class a first line and have everyone write for eight minutes with no tools. Read four aloud without names. Ask what each writer found out while writing that they did not know at the start.",
  },
  family: {
    summary:
      "A writing app produced a better story than your child's from their own idea. We practiced asking for questions instead of answers, and finishing it themselves.",
    questions: [
      "Why might a better story still be the wrong thing to hand in?",
      "What could you ask for instead of the whole answer?",
      "What did you find out by writing it yourself?",
    ],
    tryAtHome:
      "When your child is stuck, ask them three questions about their idea instead of suggesting what happens next. It is harder for you and better for them.",
    familyRule: "Ask for questions, not answers.",
  },
};

export const thePracticeThatGotSkipped: Mission = {
  id: "m-own-5",
  slug: "the-practice-that-got-skipped",
  order: 21,
  title: "The Practice That Got Skipped",
  competency: "ownership",
  primarySkillId: "own.effort",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 7,
  teaser: "Times tables. A calculator. Nobody is watching. Friday is a long way away.",
  summary:
    "The quiet version of over-reliance: no dramatic shortcut, just a small one taken every night. Students learn to ask what a task is for before deciding what help is allowed.",
  learningGoals: [
    "Ask what a piece of work is for before starting it",
    "Recognize that a small shortcut repeated is a large one",
    "Choose the slower option when nobody would know",
  ],
  badge: {
    id: "badge-own-5",
    name: "Slow Way Taker",
    blurb: "You did it the long way when nobody was watching.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "kitchen",
      narration: [
        "Twenty times-table questions a night, every night, until Friday.",
        "There is a calculator on the tablet, on the phone, on the microwave and, for some reason, on the television.",
        "It takes four minutes with one and about twenty without.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "kitchen",
      narration: [
        "Nobody has said you cannot. Nobody is in the room. The answers will be right either way.",
      ],
      prompt: "What is the question worth asking first?",
      choices: [
        {
          id: "c1",
          label: "What is this homework actually for?",
          feedback: {
            tone: "strong",
            headline: "Always this question first",
            body: "If it is for producing twenty correct answers, a calculator is perfect. If it is for you knowing seven eights without stopping, a calculator does nothing at all.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "Would I be allowed if I asked?",
          feedback: {
            tone: "partial",
            headline: "Useful, and it is about permission",
            body: "Asking is a decent test and it puts somebody else in charge of it. The stronger question is about what the work is for, because you can answer that one yourself.",
          },
          evidence: { skillId: "own.effort", result: "developing" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Will anybody find out?",
          feedback: {
            tone: "rethink",
            headline: "That is a question about getting caught",
            body: "It is not really about the math at all. Ask something that would give you the same answer even if nobody ever checked. Try again.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "kitchen",
      narration: [
        "It is for knowing them. That is why it is twenty a night instead of a hundred on Thursday.",
        "You do the first five the slow way. Seven eights takes you nine seconds and you get it wrong the first time.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "kitchen",
      narration: [
        "Nine seconds. Times twenty. Every night. And you got one wrong.",
      ],
      prompt: "Is being slow and getting one wrong a bad sign?",
      choices: [
        {
          id: "c1",
          label: "No. Slow now is how it gets fast later.",
          feedback: {
            tone: "strong",
            headline: "That is what practice is",
            body: "Nobody starts fast. Spending the nine seconds is what makes it shorter. How much shorter, and how quickly, is different for everybody, and it does not move at all if you skip it.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "No. Getting one wrong is how I found out I did not know it.",
          feedback: {
            tone: "strong",
            headline: "The wrong one is the useful one",
            body: "A calculator would have hidden that. You would have gone to Friday not knowing that seven eights was the one you did not have.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Yes. I should be faster than that by now.",
          feedback: {
            tone: "rethink",
            headline: "By when, though?",
            body: "This is night one of five. Being slow on night one is not a problem, it is night one. Have another go.",
            coachNote:
              "Some students read their own slowness as a fixed limit, and that belief is what makes the calculator feel reasonable. Take it privately, never in front of the class, and take it seriously: a child who says it every week may be telling you something true about how they learn.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "kitchen",
      narration: [
        "It is Wednesday. You are tired, it is late, and the calculator is right there where it always is.",
        "One night out of five is not very many.",
      ],
      prompt: "What do you do tonight?",
      choices: [
        {
          id: "c1",
          label: "Do ten the slow way and stop, rather than twenty the fast way",
          feedback: {
            tone: "strong",
            headline: "Half the practice is still practice",
            body: "Ten real ones beat twenty that go through a calculator and out again. Tell somebody you did ten, and that is a true and useful thing to have said.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Do them slowly anyway, even though it is late",
          feedback: {
            tone: "strong",
            headline: "That is the whole habit",
            body: "The nights you do not feel like it are the ones that decide whether this works. It is not a heroic thing. It is twenty minutes.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c4",
          label: "Do them slowly, and tell Ms. Okafor they are still really hard",
          feedback: {
            tone: "strong",
            headline: "That is the bit most people leave out",
            body: "Practicing and it still being hard is worth saying out loud. Some people need a lot more of it, or a different way in, and she cannot help with what she does not know about.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Use the calculator tonight and be strict tomorrow",
          feedback: {
            tone: "rethink",
            headline: "Wednesday-you said that about Tuesday",
            body: "One night is fine. One night is also what it always is. Look at the option that keeps some practice rather than none. Try again.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "desk-test",
      narration: [
        "Friday. No tablets, no microwave, no television.",
        "Seven eights comes out of your mouth before you have decided to say it, which is a strange feeling.",
      ],
      prompt: "What made the difference?",
      choices: [
        {
          id: "c1",
          label: "The nine seconds on Monday",
          feedback: {
            tone: "strong",
            headline: "That is where it came from",
            body: "Not Friday. Monday, when it was slow and annoying and nobody was watching and you did it anyway.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Knowing what the homework was for",
          feedback: {
            tone: "strong",
            headline: "That is what made the rest possible",
            body: "Once you knew it was for knowing them, the calculator stopped being a shortcut and became a way of skipping the point. It was not a hard choice after that.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Luck",
          feedback: {
            tone: "rethink",
            headline: "You practiced four nights",
            body: "Give yourself the credit. Something specific happened and it was not luck. Have another go.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "classroom",
      narration: [
        "Ms. Okafor asks the class what the times-table homework was for.",
        "Half the room says to get twenty right. Half says to know them. She leaves that hanging for a moment before she says anything.",
      ],
      wrapUp: [
        "Ask what the work is for before you decide what help is allowed.",
        "Getting one wrong is how you find out which one you do not know.",
        "Ten done properly beats twenty that went through a calculator.",
        "If you practice and it is still hard, tell somebody. That is not a reason to skip it.",
      ],
    },
  ],
  guide: {
    setup:
      "There is no dramatic moment in this mission on purpose. Over-reliance at this age is usually a small shortcut taken quietly, five nights running, with nobody involved. The question what is this for is the artefact worth keeping.\n\nTwo cautions. First, the story shows one child for whom four nights was enough, and that is a story rather than a promise. Recall speed varies enormously, and a child with dyscalculia, a working-memory difference, ADHD or real anxiety about math can practice properly for a fortnight and still be slow. If this mission leaves such a child believing that only people who skipped the practice stay slow, it has done them harm. Say out loud that practice makes it better, that how fast is different for everybody, and that still finding it hard after real practice is information for a teacher rather than a verdict. Second, some children have a calculator or another tool by agreement, as an accommodation. This mission is not about them, and it is worth saying so before you start rather than leaving them to work it out.",
    lookFor: [
      "Students who evaluate by whether they would be caught",
      "Whether anyone reads their own slowness as a fixed limit",
      "Students who can accept doing less rather than doing it faster",
      "Students who practice properly and still find it hard, who need help rather than encouragement",
    ],
    questions: [
      "What was this homework for? How could you tell?",
      "Why is getting one wrong useful?",
      "Is ten done slowly better than twenty done fast? Why?",
      "What is the difference between a shortcut and skipping the point?",
      "If you practice all week and it is still hard, what should you do?",
    ],
    misconceptions: [
      {
        student: "The answers were right either way.",
        response:
          "Agree, then ask what was being measured. Correct answers were never the product; a child who can do it was. Keep separating output from purpose.",
      },
      {
        student: "I am just slow at times tables.",
        response:
          "Answer it, and answer it privately rather than in front of the class. Nine seconds on night one is not a limit, it is night one, and the belief is what makes the calculator feel reasonable. But listen as well as correcting: a child who says this after genuinely practicing may be right that something is harder for them than for the people around them, and that is a thing to look into rather than a thing to talk them out of.",
      },
    ],
    extension:
      "At the start of the next three tasks you set, ask the class what it is for before anybody begins. Accept for practice and for making a thing as different answers with different rules.",
  },
  family: {
    summary:
      "We practiced asking what a piece of homework is for before deciding what help is allowed. If it is practice, the practice has to happen in your child's own head.",
    questions: [
      "What is your math homework for?",
      "Why is getting one wrong actually useful?",
      "Is ten done properly better than twenty done quickly?",
    ],
    tryAtHome:
      "Ask what is this for at the start of homework rather than checking it at the end. It settles most arguments about help before they start.",
    familyRule: "If it is for practice, the practice has to happen.",
  },
};

export const theGroupProject: Mission = {
  id: "m-own-6",
  slug: "the-group-project",
  order: 15,
  title: "The Group Project",
  competency: "ownership",
  primarySkillId: "own.toolchoice",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Four of you, one poster, and somebody suggests the app just does the whole thing.",
  summary:
    "Choosing how to get help becomes a group decision, where the fastest option is also the one that leaves three people with nothing to do. Students practice routing work to people first.",
  learningGoals: [
    "Consider what a tool takes away from other people, not just from you",
    "Find a job for everybody in the group, including yourself",
    "Disagree with a group plan without stalling it",
  ],
  badge: {
    id: "badge-own-6",
    name: "Team Router",
    blurb: "You gave the work to the people who could do it.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Four of you have a poster about the water cycle: you, Theo, Sam and Nia.",
        "Nia can draw. Sam explains things to people until they understand. Theo has neat handwriting and strong opinions about layout.",
        "There are forty minutes.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "Theo says the fastest thing is to have the app write all the labels and make the picture, and then they just print it.",
        "It is not a silly idea. It would take about six minutes.",
      ],
      prompt: "What is wrong with the fast plan?",
      choices: [
        {
          id: "c1",
          label: "Then Nia does not draw and Sam does not explain anything",
          feedback: {
            tone: "strong",
            headline: "It empties the group",
            body: "You would have a poster and four people with nothing to have done. There are four of you so that four people end up having done something, and there is more than one job in a poster.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "We would not learn the water cycle",
          feedback: {
            tone: "strong",
            headline: "The poster is not the point",
            body: "The poster goes on a wall for two weeks. The water cycle is meant to end up in four heads, and printing does not put it there.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Nothing. Forty minutes is not very long.",
          feedback: {
            tone: "rethink",
            headline: "Forty minutes is plenty for four people",
            body: "That is ten minutes each if you split it, and you have somebody who can draw sitting right there. Have another think.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "decision",
      art: "classroom",
      narration: [
        "Theo is not being lazy. He genuinely thinks it is the sensible option and he would like you to agree.",
      ],
      prompt: "How do you disagree without stopping everything?",
      choices: [
        {
          id: "c1",
          label: "“Nia, could you do the drawing? It would be better than a printed one.”",
          feedback: {
            tone: "strong",
            headline: "You gave the work away instead of arguing",
            body: "Nia is already reaching for a pencil. You did not have to win a debate with Theo, because the plan changed underneath it.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "“Can we try it ourselves for ten minutes, and use the app if we are stuck?”",
          feedback: {
            tone: "strong",
            headline: "A deadline nobody can argue with",
            body: "Theo agrees instantly, because ten minutes is nothing. By minute nine Sam is halfway through explaining evaporation and nobody mentions the app again.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "“That is basically cheating.”",
          feedback: {
            tone: "rethink",
            headline: "Now you are having an argument instead of a poster",
            body: "Theo will defend himself, everyone will pick a side, and eleven minutes will be gone. Find a way to move the work rather than judge it. Try again.",
            coachNote:
              "Redirecting a group is a genuine leadership skill and most children only know how to object. Collect the sentences that worked.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "classroom",
      narration: [
        "Twenty minutes in. The drawing is good. The labels are Theo's neat handwriting.",
        "Nobody in the group can remember the word for water going up out of a lake.",
      ],
      prompt: "Which door is this one?",
      choices: [
        {
          id: "c1",
          label: "Look it up. It is a plain fact with a proper name.",
          feedback: {
            tone: "strong",
            headline: "Straight to look it up",
            body: "Evaporation. Six seconds. This is exactly what looking things up is for and nobody needed to agonise about it.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Ask another group, or Ms. Okafor",
          feedback: {
            tone: "strong",
            headline: "Also fine, and slightly slower",
            body: "It works and it costs somebody else's attention. For a single word with a fixed answer, looking it up is the cheaper door.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Think harder until somebody remembers",
          feedback: {
            tone: "rethink",
            headline: "You cannot think your way to a word you never knew",
            body: "You have been round the table twice. Nobody has it. That is a look-it-up problem, not a think-it-out one. Try again.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "classroom",
      narration: [
        "Five minutes left. Sam is not happy with his explanation of why clouds form and wants to redo it.",
      ],
      prompt: "What kind of help does Sam need?",
      choices: [
        {
          id: "c1",
          label: "A person to listen while he says it out loud",
          feedback: {
            tone: "strong",
            headline: "He needs an audience, not information",
            body: "You listen. He gets tangled at the same place twice, hears himself do it, and fixes it. Nothing was looked up and it is now the best bit on the poster.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "The app, to write a better version of what he means",
          feedback: {
            tone: "rethink",
            headline: "He knows what he means",
            body: "That is not what is missing. He needs to hear it, and a written paragraph cannot do that for him. Have another go.",
          },
          next: "s5",
          retry: true,
        },
        {
          id: "c3",
          label: "More time. Ask if the group can finish it tomorrow.",
          feedback: {
            tone: "partial",
            headline: "Reasonable, and probably not available",
            body: "Sometimes the right answer is more time. With five minutes left and an audience sitting next to him, there is a faster one in the room.",
          },
          evidence: { skillId: "own.toolchoice", result: "developing" },
          next: "s6",
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "four-doors",
      narration: [
        "The four paper doors are still on the wall from earlier in the year.",
        "Ms. Okafor asks the group which doors they used.",
      ],
      prompt: "What is different about choosing doors in a group?",
      choices: [
        {
          id: "c1",
          label: "In a group, ask a person usually means somebody at your own table",
          feedback: {
            tone: "strong",
            headline: "The person door gets much wider",
            body: "On your own, asking a person means finding one. In a group there are three sitting next to you, and they are the fastest door in the room.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "You have to agree on the door, not just pick one",
          feedback: {
            tone: "strong",
            headline: "That is the harder part",
            body: "Four people can want four different doors. Getting the group to try one for ten minutes is a bigger skill than knowing which door is right.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Nothing. The doors are the same.",
          feedback: {
            tone: "rethink",
            headline: "Look at who was sitting at your table",
            body: "One of them could draw and one could explain. That changes which door is fastest. Try again.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "classroom",
      narration: [
        "The poster has a hand-drawn cloud, one looked-up word, Theo's handwriting and Sam's explanation, which is the bit everybody stops to read.",
        "Theo says the printed one would have been neater. He also says he does not mind.",
      ],
      wrapUp: [
        "A tool that does everything leaves your group with nothing.",
        "In a group, the fastest door is usually the person next to you.",
        "Ten minutes of trying it ourselves is a plan nobody can argue with.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission extends strategy selection into a social setting, where the efficient choice is also the one that hollows out the group. Theo is reasonable throughout: the point is not that he is wrong to suggest it, but that the group has better options sitting at its own table.\n\nThe group in the story arrives with four neat talents, which is convenient for a story and rarely true of a table. Watch for the child who concludes they have nothing to bring. The move is to start from the jobs the work needs — reading it out, checking the spelling, timekeeping, deciding the order, holding the ruler — rather than from what anybody is known to be good at. Every one of those is a real job, and a group that allocates jobs finds one for everybody.",
    lookFor: [
      "Students who evaluate a tool only by what it costs them personally",
      "Whether anyone can redirect a group without turning it into a debate",
      "Students who route a social or explanatory task to a tool",
      "Students who conclude they have nothing to contribute because they have no obvious talent",
    ],
    questions: [
      "What would the fast plan have cost the group?",
      "How do you disagree with a group plan without stopping everything?",
      "Which door was right for the word nobody knew?",
      "What did Sam actually need, and why could a tool not give it to him?",
    ],
    misconceptions: [
      {
        student: "It would have been a better poster.",
        response:
          "Probably true, and worth conceding fast. Then ask what four people were for. The measure is what the group ends up able to do, not what ends up on the wall.",
      },
      {
        student: "Using it once means we did not do the work.",
        response:
          "Push back on all-or-nothing. They looked up one word and made everything else. That is what good use looks like.",
      },
    ],
    extension:
      "Before the next group task, have each group list the jobs the task needs rather than what each person is good at, then decide together who takes which. Listing jobs first matters: asking children to declare what they bring leaves anyone who cannot name something sitting in front of a blank line. Then ask which jobs a tool could do, and whether doing them would leave anybody with nothing.",
  },
  family: {
    summary:
      "In a group project, the fastest option was to let an app make the whole poster. We practiced noticing that this would leave three people with nothing to do, and giving work to the person who could do it.",
    questions: [
      "If an app could do the whole group project, what would be lost?",
      "How do you disagree with a group without stopping everything?",
      "Who is the fastest person to ask when you are stuck at a table with friends?",
    ],
    tryAtHome:
      "When something needs doing together, ask who here can already do this before reaching for a device.",
    familyRule: "In a group, ask the people first.",
  },
};

export const theQuestionWithNoAnswer: Mission = {
  id: "m-own-7",
  slug: "the-question-with-no-answer",
  order: 24,
  title: "The Question With No Answer",
  competency: "ownership",
  primarySkillId: "own.toolchoice",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Some questions do not have an answer waiting somewhere. They have yours.",
  summary:
    "Students meet questions that no source can settle: what makes a good friend, whether a rule is fair, what they think. They learn to recognize a question that is theirs to answer, and that a confident reply to one is a warning sign.",
  learningGoals: [
    "Tell a fact question from an opinion question",
    "Recognize that some questions are yours to answer",
    "Notice when a tool answers confidently about something it was never told",
  ],
  badge: {
    id: "badge-own-7",
    name: "Own Opinion",
    blurb: "You answered the question that was yours to answer.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Room 12 is writing about a rule they would change at school, and why.",
        "Ms. Okafor says there is no right answer to this one, which several people find deeply annoying.",
        "You are writing about the rule that you cannot go on the field when it is muddy.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      speaker: "AskMe",
      narration: [
        "You ask AskMe what the fairest school rule to change would be.",
        "It answers straight away, with three paragraphs, about homework policies in general.",
        "It is confident, tidy and has nothing at all to do with your school, your field or your mud.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "tablet",
      narration: ["It sounded like an answer. It arrived like an answer."],
      prompt: "What is actually wrong with it?",
      choices: [
        {
          id: "c1",
          label: "It cannot know. It has never been to my school.",
          feedback: {
            tone: "strong",
            headline: "There is nothing for it to know",
            body: "It was never told about your school, your field or your mud. It made a general answer that sounds right. What you think is in your head, and nothing has been in there.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "It answered a question I did not ask",
          feedback: {
            tone: "strong",
            headline: "It swapped your question for a general one",
            body: "You asked about your school. It answered about schools. That is a smaller question dressed as a bigger one, and it happens constantly.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "It is a bit boring",
          feedback: {
            tone: "rethink",
            headline: "It is boring, and that is not the problem",
            body: "A brilliantly written answer would have exactly the same thing wrong with it. Think about what it could possibly know. Try again.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "classroom",
      narration: [
        "Ms. Okafor puts three questions on the board.",
        "How many days in February. Whether the mud rule is fair. What the tallest mountain is.",
      ],
      prompt: "Which one is different from the other two?",
      choices: [
        {
          id: "c1",
          label: "The mud rule. The other two have answers somebody checked.",
          feedback: {
            tone: "strong",
            headline: "Two facts and one opinion",
            body: "A fact is something you can check. February you check against the calendar rule. The mountain you check against somebody's measurement. The mud rule has no rule and no measurement behind it.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "The mud rule. It depends on who you ask.",
          feedback: {
            tone: "strong",
            headline: "That is a good test",
            body: "If reasonable people can disagree and both be reasonable, it is an opinion question. February does not work like that no matter who you ask.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "February, because it changes in leap years",
          feedback: {
            tone: "rethink",
            headline: "Still a fact though",
            body: "Leap years follow a rule, and a rule is something anybody can look up and check. Look for the one where two sensible people could disagree forever. Have another go.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "classroom",
      narration: [
        "You start again with a blank page. It is harder than the three tidy paragraphs were.",
      ],
      prompt: "What could actually help you here?",
      choices: [
        {
          id: "c1",
          label: "Ask Theo and Sam what they think and argue about it",
          feedback: {
            tone: "strong",
            headline: "Other people are the tool for this",
            body: "Sam thinks the rule is fine because of the corridors. You had not thought about the corridors. Your answer gets better by meeting somebody who disagrees.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Find out why the rule exists in the first place",
          feedback: {
            tone: "strong",
            headline: "A fact question hiding inside an opinion question",
            body: "The caretaker tells you it is about the corridor floor and somebody falling last winter. Now your opinion is about something real instead of about mud.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Ask AskMe again, more specifically this time",
          feedback: {
            tone: "rethink",
            headline: "It still has not been to your school",
            body: "A better prompt does not create knowledge that does not exist anywhere. Look for something that can actually tell you about your field. Try again.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "classroom",
      narration: [
        "Your piece ends up saying the rule should stay but the field should have a path, which is not what you thought when you started.",
        "Ms. Okafor asks the class what they learned about questions.",
      ],
      prompt: "What does a confident answer to an opinion question tell you?",
      choices: [
        {
          id: "c1",
          label: "That whatever answered it is not really answering my question",
          feedback: {
            tone: "strong",
            headline: "Confident about something it was never told",
            body: "For a fact, sounding sure proves nothing. For a question about your school, it had nothing to go on at all. Sounding sure anyway is the clearest signal there is.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "That it is making a general answer out of patterns",
          feedback: {
            tone: "strong",
            headline: "That is what it is built to do",
            body: "It puts together words that usually go together when people write about school rules. That is a general answer. Yours has a path in it, because you talked to a caretaker.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "That it knows more than me about fairness",
          feedback: {
            tone: "rethink",
            headline: "Nobody knows more than you about what you think",
            body: "That is the one subject where you are the only expert in the world. Have another go.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "four-doors",
      narration: [
        "A fifth card goes up beside the four doors. It is not a door. It is a small mirror somebody found in the art cupboard.",
        "Underneath it, Ms. Okafor has written: SOME QUESTIONS ARE YOURS.",
      ],
      wrapUp: [
        "A fact can be checked against evidence, a rule or a record. An opinion cannot.",
        "If sensible people can disagree, the question is yours to answer.",
        "A tool can sound sure about your school without ever being told anything about it.",
      ],
    },
  ],
  guide: {
    setup:
      "The most philosophically ambitious mission in the set, and grades 2 to 4 handle it better than adults expect. The working definition it uses is that a fact can be checked against evidence, a rule or a record — the calendar rule for February, a measurement for the mountain — while an opinion has none of those behind it. That matters for the second half, where a tool answers confidently about a school it was never told anything about.",
    lookFor: [
      "Students who accept a general answer to a specific question",
      "Whether anyone finds the fact question hidden inside the opinion",
      "Students who defer to a tool on questions about their own values",
    ],
    questions: [
      "What are the three ways of checking a fact? Give an example of each.",
      "How can you tell an opinion question?",
      "What was the fact hiding inside the question about the mud?",
      "Who is the only expert on what you think?",
    ],
    misconceptions: [
      {
        student: "It gave a good answer though.",
        response:
          "Ask what it was a good answer to. It was a decent general piece about school rules, assembled from the patterns in how people write about them, and it was not an answer to the question that was set. It had been told nothing about this school.",
      },
      {
        student: "It could work it out if it thought harder.",
        response:
          "There is nothing to work out from. It has no information about your field, your corridors or last winter unless somebody types it in. Adding those facts changes what it can help with, and still does not make the judgment for you.",
      },
      {
        student: "So opinions cannot be wrong.",
        response:
          "Careful here. Opinions can be badly informed, which is why the caretaker mattered. Better facts make better opinions; they just do not settle them.",
      },
    ],
    extension:
      "Sort twelve questions into fact, opinion, and both together. The both pile is the interesting one and it is where most real questions live.",
  },
  family: {
    summary:
      "We practiced telling a fact from an opinion. A fact can be checked against evidence, a rule or a record. An opinion has none of those, so it is yours to make — and a tool that sounds sure about your school has been told nothing about it.",
    questions: [
      "What are three ways you could check a fact? A rule, a record, or somebody measuring.",
      "What is a question nobody can look up for you?",
      "If an app has never been to your school, how can it sound so sure about it?",
    ],
    tryAtHome:
      "At dinner, ask a question with no right answer and let everybody disagree. Notice that it gets more interesting rather than less.",
    familyRule: "Some questions are ours to answer.",
  },
};

export const theArtShowLabel: Mission = {
  id: "m-own-8",
  slug: "the-art-show-label",
  order: 18,
  title: "The Art Show Label",
  competency: "ownership",
  primarySkillId: "own.honesty",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 7,
  teaser: "There is a small card next to every piece. Yours has to say how you made it.",
  summary:
    "Labeling help becomes ordinary rather than confessional. Students practice describing exactly what assistance they used, discover that everyone used some, and see that an accurate label costs nothing.",
  learningGoals: [
    "Describe help accurately rather than vaguely",
    "Notice that everyone gets help of some kind",
    "Understand that a label protects you rather than exposing you",
  ],
  badge: {
    id: "badge-own-8",
    name: "Label Writer",
    blurb: "You wrote down exactly what help you used.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "The corridor art show is on Thursday and every piece gets a small white card next to it.",
        "The card has your name, the title, and a line that says HOW I MADE THIS.",
        "Ms. Petrov says the last line is the interesting one and she is not moving on it.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "Your piece is a collage of a storm. You cut it out yourself. You did look up photographs of clouds on the tablet to copy the shapes from.",
      ],
      prompt: "What goes on the card?",
      choices: [
        {
          id: "c1",
          label: "“Cut and glued by me. I copied cloud shapes from photos I looked up.”",
          feedback: {
            tone: "strong",
            headline: "That is a good label",
            body: "It says what you did and what you used, in one sentence, with no apology in it. Somebody reading it knows exactly what they are looking at.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "“Cut and glued by me.”",
          feedback: {
            tone: "partial",
            headline: "True, and it leaves out the clouds",
            body: "Nobody would call that a lie. It is just less useful than the whole thing, and the whole thing does not cost you anything.",
          },
          evidence: { skillId: "own.honesty", result: "developing" },
          next: "s3",
        },
        {
          id: "c3",
          label: "“All my own work.”",
          feedback: {
            tone: "rethink",
            headline: "That phrase is doing a lot of hiding",
            body: "It sounds like the safest thing to write and it is the least accurate. Try saying what actually happened instead.",
            coachNote:
              "All my own work is the phrase to retire. It invites a binary answer to a question that is never binary.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "classroom",
      narration: [
        "You go and read what other people have put, because obviously you do.",
        "Theo: my sister showed me how to do the shading. Sam: I traced the outline from a book and painted the rest. Nia: I drew it three times and this is the third one.",
        "Every single card has something on it.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "classroom",
      narration: ["Nobody's card says all my own work. Not one."],
      prompt: "What does that tell you?",
      choices: [
        {
          id: "c1",
          label: "Everybody gets help. Saying so is normal, not a confession.",
          feedback: {
            tone: "strong",
            headline: "That is the whole reason for the cards",
            body: "When every card has something on it, saying what you used stops being an admission. It is just a description, like the title.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "The cards make it safe to say",
          feedback: {
            tone: "strong",
            headline: "That is what a label does",
            body: "If nobody had to write one, the person who volunteered it would look like the only one who needed help. The card protects you by asking everybody.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "That most people did not really do their own work",
          feedback: {
            tone: "rethink",
            headline: "Read Nia's card again",
            body: "She drew it three times. That is not less her work, it is obviously more. Getting help and doing your own work are not opposites. Have another go.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "hallway",
      narration: [
        "On Thursday a grown-up you do not know stops in front of your storm and reads the card.",
        "She says, “So which bit is the copied part?”",
      ],
      prompt: "What do you say?",
      choices: [
        {
          id: "c1",
          label: "Point at the clouds and explain how you changed the shapes",
          feedback: {
            tone: "strong",
            headline: "You can talk about your own work",
            body: "She asks two more questions and you answer both, because you know what you did. That is what the card bought you: nothing to be caught out about.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "“The cloud shapes. Everything else is mine.”",
          feedback: {
            tone: "strong",
            headline: "Short and completely accurate",
            body: "You do not owe anybody a long explanation. Knowing the answer quickly is the point, and you did.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Go a bit red and say it is not that copied really",
          feedback: {
            tone: "rethink",
            headline: "You already wrote it down",
            body: "It is on the card. Nobody is accusing you of anything, and there is nothing to shuffle about. Try again.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "classroom",
      narration: [
        "Ms. Petrov asks whether the cards should stay for the next show.",
        "Somebody says they were embarrassing at first and then they were not.",
      ],
      prompt: "Why did they stop being embarrassing?",
      choices: [
        {
          id: "c1",
          label: "Because everybody had to write one",
          feedback: {
            tone: "strong",
            headline: "Shared beats voluntary",
            body: "A rule that applies to everybody takes the shame out of it. That is why it works here and why it would not work if only some people had to.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Because nothing bad happened to anybody who wrote one",
          feedback: {
            tone: "strong",
            headline: "That is what made it stick",
            body: "The first time you say what help you used and nobody minds, you find out it was safe. Nobody can be told that. They have to do it once.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Because people put less on their cards than the truth",
          feedback: {
            tone: "rethink",
            headline: "That is not what happened",
            body: "Nia wrote that she drew it three times, which she did not have to say at all. The cards got more honest, not less. Have another go.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "hallway",
      narration: [
        "The cards stay. Ms. Okafor borrows the idea for writing and Mr. Ruiz puts one on the library display.",
        "Yours says: cut and glued by me, cloud shapes copied from photos, one cloud entirely invented and honestly the best one.",
      ],
      wrapUp: [
        "Say what help you used, exactly, not vaguely.",
        "Everybody gets help. Writing it down makes that normal.",
        "A label means nobody can catch you out, because you already said.",
      ],
    },
  ],
  guide: {
    setup:
      "The lightest mission in the ownership strand and possibly the most useful, because it turns disclosure into routine. The mechanism is that everyone writes a card. Voluntary disclosure singles out the honest child; universal disclosure does not.",
    lookFor: [
      "Students who default to all my own work",
      "Whether anyone can describe help specifically rather than generally",
      "Students who read other people's cards and relax visibly",
    ],
    questions: [
      "What is the difference between all my own work and saying what you did?",
      "Every card had something on it. What did that tell you?",
      "Why would a card only for some people not work?",
      "What would your card say for the last thing you made?",
    ],
    misconceptions: [
      {
        student: "Writing it down makes it look like I cheated.",
        response:
          "This is the fear that stops disclosure. Point at the wall of cards. It looks like cheating only when one person does it, which is precisely why everybody does.",
      },
      {
        student: "Tracing means it is not mine.",
        response:
          "Separate technique from authorship. Sam traced an outline and painted everything else. The label describes the work; it does not disqualify it.",
      },
    ],
    extension:
      "Put HOW I MADE THIS on the next piece of work in any subject. Read a few aloud without comment. The habit sets in about two rounds faster than expected.",
  },
  family: {
    summary:
      "Every piece in the art show had a card saying how it was made. Your child practiced describing help exactly, and saw that everybody had used some kind of help.",
    questions: [
      "What would your card say about the last thing you made?",
      "Why is saying what help you used easier when everybody does it?",
      "Does getting help mean it is not your work?",
    ],
    tryAtHome:
      "Ask how did you make this rather than did you do this yourself. The first question has an interesting answer and the second one only has two.",
    familyRule: "We say what help we used. Everybody uses some.",
  },
};

export const theReadingLog: Mission = {
  id: "m-own-9",
  slug: "the-reading-log",
  order: 27,
  title: "The Reading Log",
  competency: "ownership",
  primarySkillId: "own.honesty",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Twenty minutes a night, signed. Some nights it was twenty. Some nights it was not.",
  summary:
    "A record that only the child can verify. Students practice being accurate when nobody can check, and learn that a log is a message to somebody who wants to help rather than a score.",
  learningGoals: [
    "Be accurate in a record nobody else can check",
    "Understand who a log is actually for",
    "Correct something you already wrote down",
  ],
  badge: {
    id: "badge-own-9",
    name: "True Record",
    blurb: "You wrote down what really happened.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "kitchen",
      narration: [
        "The reading log has a box for every night. Minutes, book, and a grown-up's initials.",
        "Monday you read for twenty-five minutes because the chapter would not stop.",
        "Tuesday you read for about four, and then you were asleep.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "kitchen",
      narration: [
        "It is Wednesday morning and both boxes are empty. Nobody in the world knows what happened on Tuesday except you.",
      ],
      prompt: "What do you write for Tuesday?",
      choices: [
        {
          id: "c1",
          label: "Four minutes, and the name of the book",
          feedback: {
            tone: "strong",
            headline: "You wrote what happened",
            body: "Four is a real number about a real Tuesday. Twenty would have been a number about nothing at all.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "Four minutes, and add that you fell asleep",
          feedback: {
            tone: "strong",
            headline: "Even more useful",
            body: "Now Ms. Okafor knows it was not that you would not read. It was that Tuesday is your late night. Those need completely different help.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Twenty. It is only one night and it evens out with Monday.",
          feedback: {
            tone: "rethink",
            headline: "Monday was already twenty-five",
            body: "You are allowed to have both numbers. Averaging in your head turns a record of what happened into a record of what should have. Try again.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "decision",
      art: "classroom",
      narration: [
        "Theo's log has twenty in every single box for three weeks. Exactly twenty. Every night.",
        "He says it is easier and it is basically true.",
      ],
      prompt: "What is the problem with basically true?",
      choices: [
        {
          id: "c1",
          label: "Nobody can tell which nights were real, including him",
          feedback: {
            tone: "strong",
            headline: "It stops being information",
            body: "Three weeks of identical numbers tell you nothing about any night. He has filled in a form rather than kept a record.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "If reading gets hard, nobody will know to help him",
          feedback: {
            tone: "strong",
            headline: "That is the cost, and it arrives later",
            body: "The log is how somebody notices. A perfect one is invisible, which is fine right up until the week he needs somebody to notice.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "Nothing. He probably does read most nights.",
          feedback: {
            tone: "rethink",
            headline: "He probably does",
            body: "And the log now cannot tell anybody which nights, including the ones where something went wrong. Have another think about what it is for.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "classroom",
      narration: [
        "Ms. Okafor collects the logs on Friday. She is not counting minutes. She has a highlighter and she is looking for patterns.",
      ],
      prompt: "Who is the log actually for?",
      choices: [
        {
          id: "c1",
          label: "For somebody who wants to help, not for marking",
          feedback: {
            tone: "strong",
            headline: "That changes everything about it",
            body: "She highlights three Tuesdays in a row and asks what happens on Tuesdays. Nobody is in trouble. Somebody just noticed, which is what it was for.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "For me, so I can see what I actually did",
          feedback: {
            tone: "strong",
            headline: "That is the other half",
            body: "You are the first person who reads it. A log with real numbers tells you something about your own week that you would not have noticed.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "For proving I did the homework",
          feedback: {
            tone: "rethink",
            headline: "Then twenty every night is the right answer",
            body: "Which is exactly why that cannot be what it is for. Look at what she is doing with the highlighter. Try again.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "classroom",
      narration: [
        "Theo has gone quiet. He says he has written twenty everywhere for three weeks and he cannot exactly un-write it.",
      ],
      prompt: "What do you tell him?",
      choices: [
        {
          id: "c1",
          label: "“Start writing real ones from today. You do not have to fix the old ones.”",
          feedback: {
            tone: "strong",
            headline: "Forward is enough",
            body: "Nobody needs three weeks of archaeology. The next box is the one that matters, and it is the only one he can do anything about.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "“Tell Ms. Okafor. She will not be cross.”",
          feedback: {
            tone: "strong",
            headline: "And she is not",
            body: "She says thank you for telling me and asks what a normal Tuesday looks like. The conversation he was dreading takes about ninety seconds.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "“Just keep going. Changing now looks worse.”",
          feedback: {
            tone: "rethink",
            headline: "It gets harder every week he waits",
            body: "Three weeks is much easier to say out loud than ten. Look for the option that lets him start being accurate today. Have another go.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "classroom",
      narration: [
        "Ms. Okafor changes the log. She adds a box at the bottom of each week that says WHAT GOT IN THE WAY.",
      ],
      prompt: "Why would that make people more honest, not less?",
      choices: [
        {
          id: "c1",
          label: "Because now there is somewhere to put the real reason",
          feedback: {
            tone: "strong",
            headline: "A form that expects a bad week gets a true one",
            body: "Swimming on Tuesdays. Baby crying. Book was boring. If there is nowhere to write those, the only way to fill in the form is to invent minutes.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Because it shows the log is not about being perfect",
          feedback: {
            tone: "strong",
            headline: "The box itself says that",
            body: "A form with a space for what went wrong is telling you that things going wrong is expected. That is permission, and people take it.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "It would not. People would still put twenty.",
          feedback: {
            tone: "rethink",
            headline: "Theo did not",
            body: "The next Friday his log has a four, an eleven and swimming on Tuesdays written at the bottom. Try again.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "classroom",
      narration: [
        "Room 12's logs stop looking tidy and start looking like real weeks: a twenty-five, a four, a nothing, a forty-two on the Saturday somebody could not put a book down.",
        "Ms. Okafor says they are the most useful ones she has had in nine years.",
      ],
      wrapUp: [
        "Write what happened, especially when nobody could check.",
        "A record with the same number every night is not information.",
        "You do not have to fix the old boxes. Start with the next one.",
      ],
    },
  ],
  guide: {
    setup:
      "Self-reported records are the most common place children practice honesty, and the incentives point the wrong way. The mission's real move is in scene six: a form that has nowhere to put a bad week is a form that will be filled in falsely, and that is a design problem rather than a character one.",
    lookFor: [
      "Students who average in their head to reach the expected number",
      "Whether anyone can say who the log is for",
      "Students who believe a past false entry cannot be moved on from",
    ],
    questions: [
      "Who reads the reading log, and what for?",
      "What does twenty every night tell somebody?",
      "Theo could not un-write three weeks. What could he do?",
      "Why does a box for what got in the way make people more honest?",
    ],
    misconceptions: [
      {
        student: "It is basically true.",
        response:
          "Ask what basically is doing. Then ask which specific night the number describes. Records are about particular nights, and basically has none.",
      },
      {
        student: "If I write four I will get in trouble.",
        response:
          "This belief is the cause of every inflated log, and only repeated experience shifts it. Respond to low numbers calmly and privately, when you hand logs back or one to one — never by drawing the class's attention to a particular child's four, however kindly it is meant. Reading minutes track what is happening at home more than they track effort, and a child whose week was hard for reasons they cannot say should not have it noticed out loud. Normalize the range in general terms instead: say that this week's logs have fours and forties in them and that both are useful.",
      },
    ],
    extension:
      "Audit your own forms. Any record a child fills in that has no space for a bad week is asking to be filled in falsely. Add the box and see what changes within a fortnight.",
  },
  family: {
    summary:
      "We talked about reading logs and being accurate when nobody can check. A log is a message to somebody who wants to help, not a score, and a real four is more useful than an invented twenty.",
    questions: [
      "Who do you think reads your reading log?",
      "Is it better to write four minutes or twenty? Why?",
      "What got in the way this week?",
    ],
    tryAtHome:
      "Sign the log for what actually happened, including the short nights. If your child sees a four accepted calmly once, the log becomes true.",
    familyRule: "We write down what really happened.",
  },
};

export const ownershipMoreMissions = [
  theStoryThatWasNotMine,
  thePracticeThatGotSkipped,
  theGroupProject,
  theQuestionWithNoAnswer,
  theArtShowLabel,
  theReadingLog,
];
