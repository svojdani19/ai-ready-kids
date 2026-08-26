import type { Mission } from "../types";

export const theHomeworkThatDidItself: Mission = {
  id: "m-own-1",
  slug: "the-homework-that-did-itself",
  order: 7,
  title: "The Homework That Did Itself",
  competency: "ownership",
  primarySkillId: "own.effort",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "You asked for help with one word problem. Sprocket did all six.",
  summary:
    "Students practise the difference between a hint and an answer. Sprocket over-helps, and students learn to ask for a smaller kind of help and to try first.",
  learningGoals: [
    "Tell the difference between a hint and an answer",
    "Try a problem before asking for help",
    "Ask for the smallest help that gets you unstuck",
  ],
  badge: {
    id: "badge-own-1",
    name: "Hint Asker",
    blurb: "You asked for a nudge instead of the answer.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "kitchen",
      narration: [
        "Six word problems. You are stuck on number two, the one about how many crates of oranges fit in a van.",
        "You have read it three times. The words keep sliding around.",
        "Sprocket is open in the other window.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "tablet",
      narration: ["You type: “I am stuck on number two.”"],
      prompt: "Before you press enter, is there anything you want to add?",
      choices: [
        {
          id: "c1",
          label: "Add: “Give me a hint, not the answer.”",
          feedback: {
            tone: "strong",
            headline: "That one sentence changes everything",
            body: "Sprocket says: try drawing the crates. You draw eight boxes, and suddenly the problem is easy. You solved it. Sprocket just pointed.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "Add: “Show me a problem like it so I can compare.”",
          feedback: {
            tone: "strong",
            headline: "Also a great kind of help",
            body: "An example you work through yourself leaves the thinking with you. That is the test for good help.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Press enter as it is",
          feedback: {
            tone: "partial",
            headline: "Let's see what happens",
            body: "Being stuck and saying so is genuinely a good first step. Watch what Sprocket decides that means.",
          },
          evidence: { skillId: "own.effort", result: "developing" },
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "tablet",
      speaker: "Sprocket",
      narration: [
        "Sprocket does not stop at number two.",
        "It fills in all six answers, neatly, with little green checkmarks beside each one. It even writes the sentences in your kind of words.",
        "The whole page is finished. You have been at the table for four minutes.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "kitchen",
      narration: [
        "The page looks perfect. It is also nine o'clock and you are tired.",
      ],
      prompt: "What do you do?",
      choices: [
        {
          id: "c1",
          label: "Clear the answers and do the five you had not tried yet",
          feedback: {
            tone: "strong",
            headline: "You took your homework back",
            body: "Numbers one, three and five you get right on your own. Number four takes ages. That struggle is the part that stays in your head.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Keep number two's answer and redo the other five yourself",
          feedback: {
            tone: "strong",
            headline: "Fair trade",
            body: "You asked for help on the one you were stuck on and kept the rest. That is exactly the deal you want with any tool.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Hand it in as it is. The answers are right.",
          feedback: {
            tone: "rethink",
            headline: "Right answers, but whose?",
            body: "Homework is not a delivery of correct answers. It is practice, and practice only counts if your brain does it. Have another go.",
            coachNote:
              "Watch for the framing that homework is a product to be delivered. That belief, not laziness, drives most over-reliance at this age.",
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
        "Your grown-up looks over at the table. “How is it going?”",
      ],
      prompt: "What do you say?",
      choices: [
        {
          id: "c1",
          label: "“Sprocket gave me a hint on number two and I did the rest.”",
          feedback: {
            tone: "strong",
            headline: "Clear and true",
            body: "Saying what help you used is not confessing. It is the information a grown-up needs to help you properly.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "“Fine.”",
          feedback: {
            tone: "partial",
            headline: "True, but thin",
            body: "Nothing wrong with fine. But if you say which part was hard, somebody can actually help with that part tomorrow.",
          },
          evidence: { skillId: "own.honesty", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "“I did it all by myself.”",
          feedback: {
            tone: "rethink",
            headline: "That part is not quite right",
            body: "You did do most of it, and that is worth saying out loud. Leaving out the hint means nobody knows you needed one. Try again.",
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
        "In the morning Ms. Okafor asks the class a question she says she will keep asking all year.",
        "“After you use a tool, who did the thinking?”",
      ],
      prompt: "What is the test for good help?",
      choices: [
        {
          id: "c1",
          label: "Good help leaves the thinking with me",
          feedback: {
            tone: "strong",
            headline: "That is the whole rule",
            body: "A hint, an example, a question back. All of those leave the thinking with you. A finished answer takes it away.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Good help gets the page done fastest",
          feedback: {
            tone: "rethink",
            headline: "Fast was not the goal",
            body: "You finished in four minutes last night and learned nothing. Speed is not the measure here. Pick again.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Good help gives the right answers",
          feedback: {
            tone: "rethink",
            headline: "The answers were right",
            body: "Every single one. And you still could not do number four this morning. Try the other one.",
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
        "You get number four right on the board, in front of everybody, without any help at all.",
        "It takes you a while. Nobody minds.",
      ],
      wrapUp: [
        "Ask for a hint, not the answer.",
        "Try it first, even badly. The trying is the part that sticks.",
        "Good help leaves the thinking with you.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission separates help from answers. The tool over-delivers without being asked, which mirrors real behaviour and keeps blame off the student. The phrase to keep all year is: good help leaves the thinking with you.",
    lookFor: [
      "Students who see homework as a product to hand in rather than practice",
      "Whether students can request a smaller kind of help unprompted",
      "Students who omit assistance when reporting, without intending to deceive",
    ],
    questions: [
      "What is the difference between a hint and an answer?",
      "Sprocket did all six. Who asked it to?",
      "How did it feel to get number four right on the board?",
      "What would you type next time to get help without getting the answer?",
    ],
    misconceptions: [
      {
        student: "The answers were right, so the homework was right.",
        response:
          "Restate the purpose of practice. It helps to ask what the homework was for, rather than whether it was correct.",
      },
      {
        student: "I did not ask it to do all of them.",
        response:
          "Completely true, and worth validating. Then move to what the student does with an over-generous answer, which is the part they control.",
      },
    ],
    extension:
      "Build a class anchor chart of hint sentences: give me a clue, ask me a question about it, show me a similar one, tell me if my first step is right.",
  },
  family: {
    summary:
      "We practised asking for a hint instead of an answer, and noticing when a tool does too much. The phrase we used was: good help leaves the thinking with you.",
    questions: [
      "What is the difference between a hint and an answer?",
      "What could you say to get help without getting the whole answer?",
      "Tell me about a time something was hard and you kept going.",
    ],
    tryAtHome:
      "Next time homework gets hard, try being the hint-giver. Ask a question back instead of explaining, and see if it gets them unstuck.",
    familyRule: "We ask for hints, not answers.",
  },
};

export const fourDoors: Mission = {
  id: "m-own-2",
  slug: "four-doors",
  order: 8,
  title: "Four Doors",
  competency: "ownership",
  primarySkillId: "own.toolchoice",
  gradeBand: "2-4",
  estimatedMinutes: 9,
  teaser: "Four problems, four doors. Think it out, look it up, ask a person, or use AI.",
  summary:
    "A deliberate strategy-selection mission. Students face four different problems and choose among thinking, looking it up, asking a person and using an AI tool, learning that each door is right for a different job.",
  learningGoals: [
    "Name four different ways to get unstuck",
    "Match a problem to the kind of help it needs",
    "Recognise problems where only a person will do",
  ],
  badge: {
    id: "badge-own-2",
    name: "Door Chooser",
    blurb: "You matched the problem to the right kind of help.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "four-doors",
      narration: [
        "Ms. Okafor tapes four paper doors to the front board.",
        "Door one: THINK IT OUT. Door two: LOOK IT UP. Door three: ASK A PERSON. Door four: USE A TOOL.",
        "“Every time you get stuck this year,” she says, “you are picking one of these. Today we practise picking on purpose.”",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "four-doors",
      narration: [
        "First problem, on a card: seven plus eight.",
      ],
      prompt: "Which door?",
      choices: [
        {
          id: "c1",
          label: "Think it out",
          feedback: {
            tone: "strong",
            headline: "Right door",
            body: "You already know this one, or you nearly do. Reaching for a tool here would cost you the fact you were about to remember.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "Use a tool",
          feedback: {
            tone: "rethink",
            headline: "Save the tool for harder things",
            body: "You can do seven plus eight. Every time you look up something you nearly know, it gets a little harder to remember next time. Try again.",
          },
          next: "s2",
          retry: true,
        },
        {
          id: "c3",
          label: "Ask a person",
          feedback: {
            tone: "rethink",
            headline: "A person would just wait for you",
            body: "Ms. Okafor would smile and say try it. Which is a hint that this one is yours. Pick again.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "decision",
      art: "four-doors",
      narration: [
        "Second card: how tall is the tallest tree in the world?",
      ],
      prompt: "Which door?",
      choices: [
        {
          id: "c1",
          label: "Look it up",
          feedback: {
            tone: "strong",
            headline: "A fact you can check",
            body: "This is a plain, settled fact that somebody has measured. Go to a source that says who measured it. That is a look-it-up problem.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Think it out",
          feedback: {
            tone: "rethink",
            headline: "You cannot think your way to a measurement",
            body: "No amount of thinking will tell you how tall a tree in California is. Somebody has to have gone and measured it. Try again.",
          },
          next: "s3",
          retry: true,
        },
        {
          id: "c3",
          label: "Use a tool",
          feedback: {
            tone: "partial",
            headline: "It would give you a number",
            body: "It might even be right. But a look-it-up source shows you who measured it, and an AI tool usually does not. For plain facts, prefer the door that names its source.",
          },
          evidence: { skillId: "own.toolchoice", result: "developing" },
          next: "s4",
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "four-doors",
      narration: [
        "Third card, and this one is different: my best friend has been ignoring me for two days and I do not know why.",
      ],
      prompt: "Which door?",
      choices: [
        {
          id: "c1",
          label: "Ask a person",
          feedback: {
            tone: "strong",
            headline: "Only a person can do this one",
            body: "This needs somebody who knows you, knows your friend, and can actually be there. No tool can do any of those three things.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Use a tool",
          feedback: {
            tone: "rethink",
            headline: "It would write you something",
            body: "It would sound kind, and it would not know your friend, or you, or what happened on Tuesday. Real feelings go through the person door. Try again.",
            coachNote:
              "This is the highest-value item in the mission. Note which students route social and emotional problems to a tool, and follow up individually.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "Think it out",
          feedback: {
            tone: "partial",
            headline: "A good start, not the whole answer",
            body: "Thinking about what might have happened is worth doing. Then you still have to talk to somebody, because you cannot guess your way into another person's head.",
          },
          evidence: { skillId: "own.toolchoice", result: "developing" },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "four-doors",
      narration: [
        "Fourth card: I have written my animal report and I want to know if my beginning is boring.",
      ],
      prompt: "Which door?",
      choices: [
        {
          id: "c1",
          label: "Use a tool, and ask it what is unclear rather than to rewrite it",
          feedback: {
            tone: "strong",
            headline: "The right job for this door",
            body: "Asking what is confusing gives you something to fix. Asking it to rewrite the paragraph gives you a paragraph that is not yours.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Ask a person",
          feedback: {
            tone: "strong",
            headline: "Also a good door",
            body: "A reader who knows you will tell you where they got bored, which is the most useful thing anybody can tell a writer.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Use a tool and let it write a better beginning",
          feedback: {
            tone: "rethink",
            headline: "Then it is not your report",
            body: "You would hand in a first line you did not write and could not have written. Feedback yes, replacement no. Have another go.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "four-doors",
      narration: [
        "Ms. Okafor takes the doors down and asks one last thing.",
        "“Is there any door that is always the right one?”",
      ],
      prompt: "What do you say?",
      choices: [
        {
          id: "c1",
          label: "No. It depends on what kind of problem it is.",
          feedback: {
            tone: "strong",
            headline: "That is the point of the whole mission",
            body: "Four doors, four kinds of problem. The skill is not avoiding any door. It is picking on purpose instead of by habit.",
          },
          evidence: { skillId: "own.toolchoice", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Yes, thinking it out is always best",
          feedback: {
            tone: "rethink",
            headline: "Not for the tree",
            body: "You cannot think your way to a measurement, and you cannot think your way into your friend's head either. Try again.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Yes, asking a person is always best",
          feedback: {
            tone: "rethink",
            headline: "Not for seven plus eight",
            body: "People are the right door for a lot, and not for everything. Some things are yours to do. Pick again.",
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
        "The four doors go up on the wall next to the trusted grown-ups list, and they stay there all year.",
      ],
      wrapUp: [
        "Think it out for things you nearly know.",
        "Look it up for plain facts, from a source that names who checked.",
        "Ask a person for anything about people.",
        "Use a tool for feedback, not for replacement.",
      ],
    },
  ],
  guide: {
    setup:
      "The strategy-selection mission. Rather than teaching students to avoid AI, it teaches them to route deliberately. The card about the friend who is ignoring them is the item worth watching most closely.",
    lookFor: [
      "Students who route every problem to the same door",
      "Students who send a social problem to a tool",
      "Students who can distinguish feedback from replacement in the writing item",
    ],
    questions: [
      "Which door do you reach for first, without thinking?",
      "Why can a tool not help with the friend who is ignoring you?",
      "What is the difference between asking for feedback and asking for a rewrite?",
      "Can you think of a problem for each of the four doors from this week?",
    ],
    misconceptions: [
      {
        student: "The tool door is the cheating door.",
        response:
          "Push back. Blanket avoidance is not the goal and does not survive contact with the world. Route deliberately instead.",
      },
      {
        student: "Looking it up and using a tool are the same thing.",
        response:
          "Anchor on sourcing. A look-it-up source names who checked; an AI answer usually does not. That is the practical difference.",
      },
    ],
    extension:
      "Keep a door tally for a week. Each time a student gets stuck they mark which door they used. Review the pattern together on Friday.",
  },
  family: {
    summary:
      "We practised choosing between four ways of getting unstuck: think it out, look it up, ask a person, and use a tool. Each one is right for a different kind of problem.",
    questions: [
      "What are the four doors? Can you remember all of them?",
      "Which door is right for a problem about a friend?",
      "Which door do you reach for first without thinking?",
    ],
    tryAtHome:
      "Next time anybody in the house gets stuck on something, say the four doors out loud and pick one on purpose.",
    familyRule: "We pick how to get help on purpose, not by habit.",
  },
};

export const theSpellingTestSurprise: Mission = {
  id: "m-own-3",
  slug: "the-spelling-test-surprise",
  order: 9,
  title: "The Spelling Test Surprise",
  competency: "ownership",
  primarySkillId: "own.honesty",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "All week the practice sentences were easy. On Friday there is no tablet.",
  summary:
    "The consequence mission. A week of AI-written practice sentences leaves the student unable to spell the words on test day. Students practise noticing when help has replaced learning and saying so plainly.",
  learningGoals: [
    "Notice when help has replaced the learning",
    "Say plainly what help was used, without shame",
    "Choose a different plan for next week",
  ],
  badge: {
    id: "badge-own-3",
    name: "Straight Talker",
    blurb: "You noticed what the help replaced, and said so.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "kitchen",
      narration: [
        "All week the spelling homework has been the same: write a sentence for each of the ten words.",
        "All week you have typed the word into AskMe and asked it for a sentence, then copied the sentence onto the line.",
        "It took about six minutes a night. The handwriting is yours. Every sentence was correct.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "desk-test",
      narration: [
        "Friday. Tablets in the cart, folders away, pencils out.",
        "Ms. Okafor says the first word: “Enormous.”",
        "You know what it means. You have written it five times this week. You have absolutely no idea how it starts.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "desk-test",
      narration: ["The paper stays blank for a long six seconds."],
      prompt: "What just happened?",
      choices: [
        {
          id: "c1",
          label: "The sentences got written, but you never practised the words",
          feedback: {
            tone: "strong",
            headline: "You worked out exactly what happened",
            body: "The homework got finished. The practice did not happen. Those are two different things, and only one of them was the point.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "You are just bad at spelling",
          feedback: {
            tone: "rethink",
            headline: "That is not what happened",
            body: "You did not get a chance to be good or bad at it. You never actually practised. There is a real difference, and it matters. Try again.",
            coachNote:
              "Students commonly convert a strategy problem into a fixed self-belief. Interrupt that here, out loud, for the whole room.",
          },
          next: "s3",
          retry: true,
        },
        {
          id: "c3",
          label: "The test is unfair because you cannot use the tablet",
          feedback: {
            tone: "rethink",
            headline: "Think about what the test is for",
            body: "It is not checking whether the words can be spelled. It is checking whether you can spell them. Have another go.",
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
        "After the test Ms. Okafor sits down next to you. She is not cross. She looks curious.",
        "“That was a rough one,” she says. “What happened this week?”",
      ],
      prompt: "What do you tell her?",
      choices: [
        {
          id: "c1",
          label: "“I had AskMe write the sentences, so I never practised the words.”",
          feedback: {
            tone: "strong",
            headline: "That took some nerve",
            body: "Now she knows the real problem. She can help you with a spelling plan instead of guessing that you did not care. Telling the truth about help is useful information, not a confession.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "“I did the homework every night, I promise.”",
          feedback: {
            tone: "partial",
            headline: "True, and it leaves out the important half",
            body: "You did do it every night. If she does not know how, she cannot help you fix it. Try adding the part about how.",
          },
          evidence: { skillId: "own.honesty", result: "developing" },
          next: "s5",
        },
        {
          id: "c3",
          label: "“I do not know. I guess I forgot them.”",
          feedback: {
            tone: "rethink",
            headline: "You do know",
            body: "You worked it out two minutes ago at your desk. Saying it out loud is the part that changes next week. Try again.",
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
        "Monday night. Ten new words on the sheet. The tablet is right there, same as always.",
      ],
      prompt: "What is your plan this week?",
      choices: [
        {
          id: "c1",
          label: "Write your own sentences first, then check the spelling",
          feedback: {
            tone: "strong",
            headline: "Now the tool is in the right place",
            body: "You do the thinking, then a tool checks the work. Same tablet, completely different job. Your sentences are worse than AskMe's, and they are teaching you the words.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Do it all by yourself and never use the tablet again",
          feedback: {
            tone: "partial",
            headline: "Braver than you need to be",
            body: "You do not have to swear off the tool. The problem was never the tablet, it was which job you gave it. Checking your work is a fine job for it.",
          },
          evidence: { skillId: "own.effort", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Ask AskMe for the sentences again, but read them carefully this time",
          feedback: {
            tone: "rethink",
            headline: "Reading is not practising",
            body: "You read them carefully all last week too. The words go in when your hand writes them and your brain picks the letters. Try again.",
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
        "Theo leans over on Friday. His sheet is covered in his own crossed-out attempts.",
        "“Mine look terrible,” he says.",
      ],
      prompt: "What do you say to him?",
      choices: [
        {
          id: "c1",
          label: "“Mine too. That is what practising looks like.”",
          feedback: {
            tone: "strong",
            headline: "Messy is the evidence",
            body: "A page with crossings-out is a page where somebody was learning. A perfect page can mean anything at all.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "“You should get AskMe to do it, it looks way better.”",
          feedback: {
            tone: "rethink",
            headline: "You know how that week ended",
            body: "It looked better and it taught you nothing. Do not send your friend down the same road. Pick again.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Say nothing",
          feedback: {
            tone: "partial",
            headline: "A missed chance",
            body: "Theo is worried his messy page means he is bad at this. You know something that would help him. Saying it costs nothing.",
          },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "desk-test",
      narration: [
        "This Friday, Ms. Okafor says “enormous” and your pencil moves straight away.",
        "E-N-O-R-M-O-U-S. It was in there the whole time. You just had to be the one to put it there.",
      ],
      wrapUp: [
        "Finishing the homework and doing the learning are two different things.",
        "Saying what help you used lets somebody actually help you.",
        "Do the thinking first, then let a tool check it.",
      ],
    },
  ],
  guide: {
    setup:
      "The consequence mission, and the one to schedule last. It shows a delayed cost, which is the hardest thing about over-reliance to teach, because the cost never arrives on the night the shortcut is taken. Keep the tone free of blame throughout: the teacher character is curious, never cross.",
    lookFor: [
      "Students who convert a strategy problem into a fixed belief about themselves",
      "Students who over-correct into refusing tools entirely",
      "Whether students can describe assistance accurately without treating it as a confession",
    ],
    questions: [
      "The homework was finished every night. What did not happen?",
      "Why is it useful for a teacher to know what help you used?",
      "What is a good job to give a spelling tool? What is a bad one?",
      "Theo's page was messy. What did that actually mean?",
    ],
    misconceptions: [
      {
        student: "So we are not allowed to use it.",
        response:
          "Explicitly reject that reading. Scene five gives the tool a legitimate job, checking after the thinking. Name the sequence, not a ban.",
      },
      {
        student: "I am just bad at spelling.",
        response:
          "Interrupt immediately and publicly. The student has no evidence either way, because the practice never happened.",
      },
    ],
    extension:
      "Show two work samples, one flawless and one with visible corrections. Ask which student learned more, and how anybody could tell.",
  },
  family: {
    summary:
      "We looked at what happens when a tool does the practice for you. Your child saw a week of AI-written spelling sentences lead to a hard test day, and made a new plan: do the thinking first, then let the tool check.",
    questions: [
      "What is the difference between finishing homework and learning something?",
      "What is a good job to give a spelling helper? What is a bad one?",
      "Why is a messy page with crossings-out sometimes a good sign?",
    ],
    tryAtHome:
      "Ask what the homework is for before it starts. If the answer is practice, the practice has to happen in their handwriting.",
    familyRule: "We do the thinking first, then let a tool check it.",
  },
};

export const ownershipMissions = [
  theHomeworkThatDidItself,
  fourDoors,
  theSpellingTestSurprise,
];
