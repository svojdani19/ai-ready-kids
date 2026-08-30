import type { Mission } from "../types";

/**
 * First Look — upper track, grades 3 to 5.
 *
 * The same three ideas as the early track, pitched for a child who reads
 * independently and who has probably already used a tool with a guessing
 * machine in it without being told that is what it was. A ten year old given
 * the grade 1 script hears it as babyish and stops listening, which is why
 * this exists as a separate tier rather than as a longer version.
 *
 * Cast: Brightwood Elementary again, but Room 20 rather than Room 12, with
 * Mr. Alvarez teaching and Priya and Dev as classmates. Room 12 is the second
 * to fourth grade room the core missions are set in, and a fifth grader
 * recognizing the younger room as not theirs is the point of the split.
 *
 * These sessions record no evidence, for the same reason the early ones do
 * not: they check that an idea landed, and the nine skills are about decisions
 * made under pressure. The core missions are where those get demonstrated.
 */

export const whereTheGuessesComeFrom: Mission = {
  id: "f-upper-1",
  slug: "where-the-guesses-come-from",
  order: 1,
  title: "Where the Guesses Come From",
  segment: "foundation",
  track: "upper",
  competency: "verification",
  primarySkillId: "verify.confidence",
  gradeBand: "3-5",
  estimatedMinutes: 10,
  teaser: "Room 20 asks a tool about a swimming team that does not exist. It answers anyway.",
  bigIdea:
    "An AI tool works from patterns in a huge number of examples. A writing tool uses them to produce what usually follows, which is why it can be smooth, fast and wrong at the same time.",
  summary:
    "The first upper-track First Look session, for a class that has used AI tools without being told how they work. Students find out that the output is assembled from patterns in an enormous amount of writing rather than looked up in a checked list, and see a confident, detailed, completely invented answer about their own school.",
  learningGoals: [
    "Explain that AI tools work from patterns in examples, and that a writing tool uses them to produce what usually follows a prompt",
    "Give a reason why a confident answer can still be invented",
    "Say that nothing inside an answer settles whether the answer is right",
  ],
  badge: {
    id: "badge-foundation-upper-1",
    name: "Pattern Reader",
    blurb: "You worked out where an AI tool's answers actually come from.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Room 20 has used the school's writing helper for a month. Nobody has ever asked how it works.",
        "Mr. Alvarez puts the question on the board: where do its words come from?",
        "Dev says it looks them up. Priya says it just knows things. Neither of them sounds sure.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "tablet",
      narration: [
        "Mr. Alvarez says the answer is stranger than either guess.",
        "The tool was built by running it over an enormous amount of writing that people made.",
      ],
      prompt: "So what is it doing when it answers you?",
      choices: [
        {
          id: "c1",
          label: "Working out what usually follows, and putting that",
          feedback: {
            tone: "strong",
            headline: "That is the mechanism",
            body: "It produces text that fits the pattern of what came before. That is a different job from finding out what is true.",
            coachNote:
              "Keep the phrase what usually follows. Every verification mission this year leans on it.",
          },
          next: "s3",
        },
        {
          id: "c2",
          label: "Reading it off a list of facts that a teacher checked",
          feedback: {
            tone: "rethink",
            headline: "There is no checked list in there",
            body: "Nobody sat down and approved a list of answers for it. What it has is patterns from writing. Have another go.",
          },
          next: "s2",
          retry: true,
        },
        {
          id: "c3",
          label: "Searching the internet while you wait",
          feedback: {
            tone: "partial",
            headline: "Some tools do search as well",
            body: "Worth knowing, and worth asking about any tool you use. Underneath, the part writing the sentences is still filling in what usually follows.",
          },
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "tablet",
      narration: [
        "Mr. Alvarez types a question onto the big screen.",
        "Tell me about the Brightwood Elementary swimming team.",
        "Brightwood has no pool. It has never had a swimming team.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "tablet",
      narration: [
        "The answer arrives in about two seconds.",
        "It names a coach, a practice night and a trophy the team won last spring.",
        "Priya laughs. Dev has gone quiet.",
      ],
      prompt: "Why did it produce all of that?",
      choices: [
        {
          id: "c1",
          label: "Because that is what usually follows a question shaped like that",
          feedback: {
            tone: "strong",
            headline: "Yes",
            body: "School team answers usually have a coach, a night and a trophy in them. It produced the shape. Nothing checked whether the team exists.",
          },
          next: "s5",
        },
        {
          id: "c2",
          label: "Because it decided to lie",
          feedback: {
            tone: "rethink",
            headline: "Lying needs knowing",
            body: "To lie you have to know the truth and choose against it. This produced a pattern. Have another go.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "Because somebody somewhere wrote it down wrongly",
          feedback: {
            tone: "partial",
            headline: "That does happen",
            body: "Wrong writing does go in, and it does come back out. Here there was nothing about Brightwood at all, and it still filled the shape.",
          },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "story",
      art: "classroom",
      narration: [
        "Mr. Alvarez asks the class what was wrong with the answer, apart from being invented.",
        "Priya says it did not look wrong. It looked like every other answer they had ever got.",
        "He writes her sentence on the board word for word.",
      ],
      next: "s6",
    },
    {
      id: "s6",
      kind: "decision",
      art: "desk-test",
      narration: [
        "Dev asks the practical question. How are you meant to tell?",
      ],
      prompt: "You are looking at an answer on the screen. What tells you whether it is right?",
      choices: [
        {
          id: "c1",
          label: "Nothing inside the answer. You check it against something else",
          feedback: {
            tone: "strong",
            headline: "That is the durable rule",
            body: "The wording is produced the same way whether it is right or invented. So the check has to come from outside it.",
          },
          next: "s7",
        },
        {
          id: "c2",
          label: "How certain it sounds",
          feedback: {
            tone: "rethink",
            headline: "Certainty is produced too",
            body: "The swimming team answer sounded as certain as any other. Sounding sure is worth noticing, and it is not the check. Have another go.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "How much detail it gives",
          feedback: {
            tone: "partial",
            headline: "Detail is worth noticing",
            body: "Lots of detail can mean there was a lot to go on. It can also mean a lot got filled in. It does not settle it either way.",
          },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "story",
      art: "library",
      narration: [
        "At lunchtime Dev goes to the library and asks Mr. Ruiz about the swimming team.",
        "Mr. Ruiz laughs and shows him the sports board. Track, basketball, cross country. No swimming.",
        "That took eleven seconds and it settled it.",
      ],
      next: "s8",
    },
    {
      id: "s8",
      kind: "ending",
      art: "classroom",
      narration: [
        "Mr. Alvarez leaves Priya's sentence on the board all week.",
        "It did not look wrong. It looked like every other answer.",
      ],
      wrapUp: [
        "AI tools work from patterns in a huge number of examples. A writing tool uses them to produce what usually follows the words you gave it.",
        "That is why an invented answer can look exactly like a right one.",
        "The check comes from outside the answer, and it is often quick.",
      ],
    },
  ],
  guide: {
    setup:
      "Run this before any other session with a class in grades 3 to 5, whatever they have already used. Most of them have met a tool like this and have a folk theory about it — usually that it looks things up, or that it knows things. This session replaces the folk theory with a mechanism they can reason from: it produces what usually follows. If you can, run the invented-question demonstration live with whatever tool your school already licenses, using your own school's name.",
    lookFor: [
      "Students who describe the tool as lying, tricking or making things up on purpose",
      "Students who treat confident phrasing or heavy detail as a quality signal",
      "Students who assume a wrong answer means a wrong page went in somewhere",
    ],
    questions: [
      "What is the difference between producing what usually follows and finding out what is true?",
      "The swimming team answer had a coach, a night and a trophy. Why those three things?",
      "Priya said it did not look wrong. What would looking wrong even mean here?",
      "Dev settled it in eleven seconds. What made that check a good one?",
    ],
    misconceptions: [
      {
        student: "So it lies.",
        response:
          "Push on what lying requires. A liar knows the truth and chooses against it; this produced the shape of a school team answer with nothing behind it. The distinction matters because it predicts when the tool will be wrong, and lying does not.",
      },
      {
        student: "It only gets things wrong about small stuff like our school.",
        response:
          "Half right, and worth developing rather than correcting. Thin subjects are where invention is easiest to catch, which is exactly why the school demonstration works. It is not a promise about everything else.",
      },
      {
        student: "Then you can never trust any of it.",
        response:
          "That is not the lesson and it is the failure mode to watch for. The point is that the check comes from outside the answer, and Dev's check took eleven seconds. Distrusting everything is as unusable as trusting everything.",
      },
    ],
    extension:
      "Unplugged, fifteen minutes. In pairs, write three questions about your school that an outsider could not possibly know the answer to, then write what a made-up but convincing answer would contain. Compare across the room: the shapes will match. Use only school facts that are already on a public noticeboard, and nothing about any individual student or staff member.",
  },
  family: {
    summary:
      "This week we found out how AI tools actually produce their answers. They work from patterns in an enormous number of examples; a writing tool uses those patterns to produce what usually follows what you typed. Your child saw a tool invent a detailed, confident description of a school swimming team that has never existed.",
    questions: [
      "What is a writing tool actually doing when it answers you?",
      "Why can a made-up answer look exactly like a right one?",
      "If the answer itself cannot tell you, what can?",
    ],
    tryAtHome:
      "Ask a tool you already use about something only your family would know, such as a street on your walk to school. Read the answer together and count what it got right.",
    familyRule: "The check comes from outside the answer.",
  },
};

export const spotTheAi: Mission = {
  id: "f-upper-2",
  slug: "spot-the-ai",
  order: 2,
  title: "Spot the AI",
  segment: "foundation",
  track: "upper",
  competency: "privacy",
  primarySkillId: "privacy.media",
  gradeBand: "3-5",
  estimatedMinutes: 10,
  teaser: "Room 20 says they have not used AI all day. Then they count.",
  bigIdea:
    "AI is already in an ordinary day, and every use of it has something going in as well as something coming out.",
  summary:
    "Second upper-track First Look session. Students audit an ordinary school morning and find the guessing machines they did not notice, then work out what each one takes in. It ends on the case that matters later: what you can do when you cannot tell whether a person or a program produced something.",
  learningGoals: [
    "Identify AI in tools that have no face, voice or robot in them",
    "Name what a given tool takes in as well as what it gives back",
    "Describe a workable move when you cannot tell who produced something",
  ],
  badge: {
    id: "badge-foundation-upper-2",
    name: "Morning Audit",
    blurb: "You found the guessing machines in an ordinary day.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Mr. Alvarez asks how many times the class used AI before lunch.",
        "Dev says zero. Most of the room agrees with him.",
        "Mr. Alvarez asks them to walk through the morning anyway, one thing at a time.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "He lists four things from the morning on the board.",
        "The spell checker that rewrote Priya's whole sentence. The pencil sharpener.",
        "The photo app that grouped everyone's pictures by face. The wall clock.",
      ],
      prompt: "Which of those had a guessing machine in it?",
      choices: [
        {
          id: "c1",
          label: "The spell checker that rewrote the whole sentence",
          feedback: {
            tone: "strong",
            headline: "Found one",
            body: "Fixing a letter is a rule. Rewriting a whole sentence means something worked out what usually follows.",
          },
          next: "s3",
        },
        {
          id: "c2",
          label: "The photo app that grouped pictures by face",
          feedback: {
            tone: "strong",
            headline: "Found one",
            body: "Something looked at every picture and decided which faces matched. That is a guess, made over and over.",
          },
          next: "s3",
        },
        {
          id: "c3",
          label: "The pencil sharpener",
          feedback: {
            tone: "rethink",
            headline: "No guessing in there",
            body: "A sharpener does the same thing to every pencil. Look for something that produced a different result for different people. Have another go.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "tablet",
      narration: [
        "By the end of the list Room 20 has found six.",
        "Mr. Alvarez draws two arrows on the board: one going in, one coming out.",
        "He says the interesting one is almost always the arrow going in.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "tablet",
      narration: [
        "Priya's video app queues up a next video she likes, every time.",
        "She wants to know how it manages that.",
      ],
      prompt: "What is going in, for that to come out?",
      choices: [
        {
          id: "c1",
          label: "What she watched before, and what people like her watched",
          feedback: {
            tone: "strong",
            headline: "That is the in-arrow",
            body: "It has a record of what she watched and how long she stayed. That is what the guess is built from.",
          },
          next: "s5",
        },
        {
          id: "c2",
          label: "Nothing. It picks at random from everything",
          feedback: {
            tone: "rethink",
            headline: "Random would not fit her so well",
            body: "A random pick would miss most of the time. Something about Priya is going in. Have another go.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "Only the one video she just finished",
          feedback: {
            tone: "partial",
            headline: "Part of it",
            body: "The last video counts. So does everything before it, and that is the part people tend to forget.",
          },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "story",
      art: "hallway",
      narration: [
        "Dev brings up the case that has been bothering him.",
        "A message went round the fifth grade last week and nobody knew who wrote it.",
        "It could have been a person. It could have been produced. It read fine either way.",
      ],
      next: "s6",
    },
    {
      id: "s6",
      kind: "decision",
      art: "hallway",
      narration: [
        "Mr. Alvarez says this is the honest hard case, and he is not going to pretend otherwise.",
        "You often cannot tell from the writing itself.",
      ],
      prompt: "So what is the move when you cannot tell?",
      choices: [
        {
          id: "c1",
          label: "Check with the person or place it says it came from, a way you already know works",
          feedback: {
            tone: "strong",
            headline: "That is the one that holds up",
            body: "Going back to the source on a route you already trust works whether a person or a program produced the words.",
          },
          next: "s7",
        },
        {
          id: "c2",
          label: "Look for spelling mistakes, because a program would not make any",
          feedback: {
            tone: "rethink",
            headline: "Both can spell, and both can slip",
            body: "People write neatly and programs write messily, often enough that this tells you very little. Have another go.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Read it again and see if any sentence feels odd",
          feedback: {
            tone: "partial",
            headline: "Worth a read, not a verdict",
            body: "An odd sentence is a reason to slow down. It is not who sent it. Take the odd feeling to somebody who can check.",
          },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "story",
      art: "classroom",
      narration: [
        "Mr. Alvarez adds the six to a chart by the door, with the in-arrow next to each one.",
        "He says the class can add to it whenever they spot another.",
        "By Friday there are eleven.",
      ],
      next: "s8",
    },
    {
      id: "s8",
      kind: "ending",
      art: "classroom",
      narration: [
        "Dev crosses out his zero from Monday.",
        "He writes eleven, and then a question mark after it.",
      ],
      wrapUp: [
        "AI is already in an ordinary day, in things with no face and no voice.",
        "Every one of them has something going in as well as something coming out.",
        "When you cannot tell who produced something, go back to the source a way you trust.",
      ],
    },
  ],
  guide: {
    setup:
      "The audit is the whole lesson, so give it time and let the class argue about the borderline cases — a plain spell checker is a rule, a rewrite is a guess, and working out which is which is exactly the reasoning you want. The in-arrow introduced here is what the privacy missions build on all year: a tool that gives you something back has taken something in first.",
    lookFor: [
      "Students who only count something as AI if it talks or has a face",
      "Students who can name the output but not what the tool took in",
      "Students reaching for surface tells — spelling, tone, speed — as proof of who wrote something",
    ],
    questions: [
      "Which one on our list surprised you most?",
      "Pick any tool on the chart. What goes in?",
      "The spell checker fixed a letter and then rewrote a sentence. Are those the same kind of thing?",
      "What would you actually do about a message with no name on it?",
    ],
    misconceptions: [
      {
        student: "You can always tell. AI writing sounds weird.",
        response:
          "Test it rather than debating it. Read out two short paragraphs, one written by you and one produced by whatever tool the school licenses, and take a vote. The vote splitting is the argument.",
      },
      {
        student: "If it does not have a camera, nothing goes in.",
        response:
          "Widen what counts as going in. What you typed, what you clicked, how long you stayed and what you skipped are all inputs, and none of them involve a camera.",
      },
      {
        student: "So I should not use any of it.",
        response:
          "Not the goal, and say so plainly. The chart by the door exists so the class can use these things knowing what they are, which is the opposite of avoiding them.",
      },
    ],
    extension:
      "Unplugged, fifteen minutes. Build the class chart on paper: tool, what goes in, what comes out. Keep it to tools the whole class shares at school. Do not photograph anything, do not open a camera or a face-grouping feature to demonstrate it, and do not ask students to list the apps or devices in their homes.",
  },
  family: {
    summary:
      "This week we audited an ordinary school morning and found eleven things with AI inside them, none of which look like robots. Your child practiced naming what each tool takes in, not just what it gives back.",
    questions: [
      "How many did your class find in the end?",
      "Pick something we use at home. What goes into it?",
      "What would you do about a message when you cannot tell who wrote it?",
    ],
    tryAtHome:
      "Choose one app you both use and work out its in-arrow together. What did it have to know about you to do that?",
    familyRule: "Anything that gives us something back has taken something in.",
  },
};

export const whoIsInChargeHere: Mission = {
  id: "f-upper-3",
  slug: "who-is-in-charge-here",
  order: 3,
  title: "Who Is in Charge Here",
  segment: "foundation",
  track: "upper",
  competency: "ownership",
  primarySkillId: "own.toolchoice",
  gradeBand: "3-5",
  estimatedMinutes: 10,
  teaser: "Room 20 gets a study helper for a week. Mr. Alvarez writes three questions before anyone opens it.",
  bigIdea:
    "A tool does a job. A person is answerable for the result, decides when it is used, and can stop at any point.",
  summary:
    "The last First Look session, and the handover into the core program. Room 20 trials a study tool for a week under three standing questions: what is it for, what goes in, and who checks what comes out. Students practice naming who is answerable for a piece of work and what to do when a tool asks for something a lesson does not need.",
  learningGoals: [
    "Name who is answerable for work that a tool helped produce",
    "State the three questions to ask before using a tool for schoolwork",
    "Stop and involve an adult when a tool asks for something the task does not need",
  ],
  badge: {
    id: "badge-foundation-upper-3",
    name: "In Charge",
    blurb: "You worked out who is actually answerable for the work.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Room 20 has a study helper on trial for one week. Nobody has opened it yet.",
        "Mr. Alvarez writes three questions on the board first.",
        "What is it for. What goes in. Who checks what comes out.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "tablet",
      narration: [
        "He starts with the first one. Priya says it is for doing your homework.",
        "Mr. Alvarez says that is a description of what it can do, not what it is for.",
      ],
      prompt: "What is a better answer to what is it for?",
      choices: [
        {
          id: "c1",
          label: "It depends on the job. We decide that each time",
          feedback: {
            tone: "strong",
            headline: "That is the answer",
            body: "The same tool can explain a step, check spelling or write the whole thing. What it is for is a decision, and it is yours.",
          },
          next: "s3",
        },
        {
          id: "c2",
          label: "It is for whatever it is best at",
          feedback: {
            tone: "partial",
            headline: "Half of it",
            body: "What it is good at matters. What you are trying to learn matters more, and only you know that part.",
          },
          next: "s3",
        },
        {
          id: "c3",
          label: "It is for finishing work faster",
          feedback: {
            tone: "rethink",
            headline: "Faster is not a purpose",
            body: "Speed is a side effect. Finishing faster is no use if the thing you were meant to learn did not happen. Have another go.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "desk-test",
      narration: [
        "Dev tries it on a science question about why ice floats.",
        "The answer that comes back is clear, well oorganized and three paragraphs long.",
        "He copies the middle paragraph onto his page.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "desk-test",
      narration: [
        "Mr. Alvarez collects the science pages on Thursday.",
        "One of them has a sentence in it that is not true.",
        "It is Dev's page.",
      ],
      prompt: "Who is answerable for the sentence on Dev's page?",
      choices: [
        {
          id: "c1",
          label: "Dev, because it is his page and he put it there",
          feedback: {
            tone: "strong",
            headline: "Yes, and that does not make him a cheat",
            body: "He chose to put it on the page without checking it. That is the whole of what went wrong, and it is fixable.",
            coachNote:
              "Say the second half out loud. Students hear answerable as in trouble unless you separate them explicitly.",
          },
          next: "s5",
        },
        {
          id: "c2",
          label: "The tool, because the tool wrote it",
          feedback: {
            tone: "rethink",
            headline: "A tool cannot answer for anything",
            body: "It produced text. It cannot be asked what it meant, and it will not be there on Thursday. Have another go.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "Mr. Alvarez, because he chose the tool for the class",
          feedback: {
            tone: "partial",
            headline: "He is answerable for that choice",
            body: "Choosing the tool is his. What went on the page is Dev's. Two different jobs, and both of them are real.",
          },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "story",
      art: "classroom",
      narration: [
        "Dev checks the sentence in the science book and finds the tool had it backwards.",
        "He rewrites the paragraph and adds a line at the bottom saying what he used.",
        "Mr. Alvarez says the line at the bottom is the part he wants everyone to copy.",
      ],
      next: "s6",
    },
    {
      id: "s6",
      kind: "decision",
      art: "tablet",
      narration: [
        "On Friday the study helper puts up a new box.",
        "Sign in with your own email address to keep your work between sessions.",
        "The trial has three days left. Nobody has signed in to anything.",
      ],
      prompt: "What do you do?",
      choices: [
        {
          id: "c1",
          label: "Stop, leave it, and tell Mr. Alvarez what it asked for",
          feedback: {
            tone: "strong",
            headline: "Stop and tell is the move",
            body: "He can find out for the whole class, and take it to the school. That is more than you could do alone.",
          },
          next: "s7",
        },
        {
          id: "c2",
          label: "Skip the box and carry on without saving",
          feedback: {
            tone: "partial",
            headline: "You kept yourself out of it",
            body: "Skipping was fine for you. The box is still on everybody else's screen, and nobody has told an adult it is there.",
          },
          next: "s7",
        },
        {
          id: "c3",
          label: "Type it in, since an email address is not a secret",
          feedback: {
            tone: "rethink",
            headline: "The trial did not need one",
            body: "A week of science practice does not need an account. A request that does not fit the job is the thing to notice. Have another go.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "story",
      art: "classroom",
      narration: [
        "Mr. Alvarez pauses the trial that afternoon and takes the box to the office.",
        "On Monday he tells Room 20 what he found out and what the school decided.",
        "The three questions stay on the board for the rest of the year.",
      ],
      next: "s8",
    },
    {
      id: "s8",
      kind: "ending",
      art: "classroom",
      narration: [
        "Priya asks what happens now that First Look is finished.",
        "Mr. Alvarez says the missions start next week, and the three questions come with them.",
      ],
      wrapUp: [
        "A tool does a job. A person is answerable for what ends up on the page.",
        "Ask what it is for, what goes in, and who checks what comes out.",
        "You can stop at any point, and telling an adult helps more than the class than just you.",
      ],
    },
  ],
  guide: {
    setup:
      "The handover session. Everything after this is the core program, and the three questions on the board are what carry across, so write them somewhere permanent. The one place to slow down is Thursday's science page: students hear answerable as in trouble, and if that lands the rest of the year gets quieter and less honest. Say explicitly that Dev did nothing that makes him a cheat.",
    lookFor: [
      "Students who locate responsibility in the tool rather than in a person",
      "Students who hear answerable as an accusation and go quiet",
      "Students who protect themselves from a bad request without telling anyone",
    ],
    questions: [
      "What is the difference between what a tool can do and what it is for?",
      "Dev's page had a wrong sentence on it. What exactly was the mistake?",
      "Why does the line at the bottom of the page matter?",
      "The trial did not need an email address. How would you know that?",
    ],
    misconceptions: [
      {
        student: "Dev cheated.",
        response:
          "Correct this directly and immediately, because the rest of the year depends on it. He used a tool the school gave him and did not check the output. The fix is checking, and he did it.",
      },
      {
        student: "The tool should be responsible, it made the mistake.",
        response:
          "Ask what being responsible would mean here. It cannot be asked what it meant, cannot be corrected and will not be in the room. Responsibility has to land somewhere it can actually do something.",
      },
      {
        student: "Telling a teacher is telling on people.",
        response:
          "Separate reporting a person from reporting a request. Nobody in this story did anything wrong. The email box was on every screen, and one child telling an adult is what got it looked at.",
      },
    ],
    extension:
      "Unplugged, fifteen minutes. Give groups four short task cards — practice times tables, find the opening hours of the town pool, write a birthday message, learn to spell six words — and have them decide for each whether a tool is the right help, and who would check the result. Do not ask students to describe schoolwork they have actually used a tool for; the point is the decision, not a confession.",
  },
  family: {
    summary:
      "This week we finished the introduction and set up the three questions the class will use all year: what is it for, what goes in, and who checks what comes out. Your child also practiced what to do when a tool asks for something the task does not need.",
    questions: [
      "What are the three questions on your class board?",
      "If a tool helps with your homework, who is answerable for the page?",
      "What would you do if an app asked you to sign in with an email address?",
    ],
    tryAtHome:
      "Next time your child uses any tool for schoolwork, ask the three questions together before they start. It takes about a minute.",
    familyRule: "The tool does a job. We are answerable for the result.",
  },
};

export const upperFoundations: Mission[] = [
  whereTheGuessesComeFrom,
  spotTheAi,
  whoIsInChargeHere,
];
