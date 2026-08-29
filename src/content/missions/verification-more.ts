import type { Mission } from "../types";

/**
 * Additional verification missions, two per skill.
 *
 * Each decision scene offers at least two non-looping exits, so evidence
 * reflects a choice rather than the only way out. No situation here appears in
 * either benchmark form.
 */

export const theBookThatWasNotThere: Mission = {
  id: "m-verify-4",
  slug: "the-book-that-was-not-there",
  order: 11,
  title: "The Book That Was Not There",
  competency: "verification",
  primarySkillId: "verify.confidence",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "AskMe recommends the perfect book for your report. The library has never heard of it.",
  summary:
    "A tool invents a book title, an author and a page count, all delivered with complete confidence. Students learn that detail is not evidence, that a search finding nothing means they cannot use it yet rather than that it does not exist, and that calling something invented takes a second, wider check.",
  learningGoals: [
    "Understand that made-up answers come with convincing details",
    "Check a claim in the cheapest place available",
    "Tell the difference between cannot find it and does not exist",
    "Say that something turned out not to exist, without embarrassment",
  ],
  badge: {
    id: "badge-verify-4",
    name: "Record Checker",
    blurb: "You looked for the record instead of believing.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "library",
      narration: [
        "Everybody in Room 12 is writing a report about an animal. You have octopuses.",
        "Mr. Ruiz says the report needs one book in it, a real one, with a title and an author.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      speaker: "AskMe",
      narration: [
        "AskMe answers before you have finished typing.",
        "“Try The Eight Arms of Winter by Marguerite Ellery. It is a wonderful introduction to octopuses for young readers, 112 pages, published in 2016.”",
        "That is a great title. You write the whole thing down.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "library",
      narration: [
        "Mr. Ruiz types the title into the library computer. Nothing.",
        "He tries the author. Nothing. He tries the whole district catalogue, which has about four hundred thousand books in it. Nothing.",
      ],
      prompt: "What do you know so far?",
      choices: [
        {
          id: "c1",
          label: "I cannot find it, so I cannot use it yet",
          feedback: {
            tone: "strong",
            headline: "That is exactly how much you know",
            body: "Not found is not the same as not real. It is enough to stop you putting it in your report, which is what you needed to decide right now.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s3b",
        },
        {
          id: "c2",
          label: "This is one library district. We need somewhere bigger to look.",
          feedback: {
            tone: "strong",
            headline: "Straight to the next check",
            body: "Four hundred thousand books is a lot and it is still one place. A brand new book, an ebook or an old one nobody around here bought would all come back empty too.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s3b",
        },
        {
          id: "c3",
          label: "The book does not exist. It was made up.",
          feedback: {
            tone: "rethink",
            headline: "That might turn out to be true",
            body: "You cannot know it from this, though. All you have looked in is one district. Say what you actually know so far, and then go and find out the rest.",
            coachNote:
              "This is the productive wrong answer and most classes will pick it, because it is where the mission is going. The point is that it is a conclusion they have not earned yet.",
          },
          next: "s3",
          retry: true,
        },
        {
          id: "c4",
          label: "Mr. Ruiz must have spelled it wrong",
          feedback: {
            tone: "rethink",
            headline: "He tried it three ways",
            body: "Title, author, whole district. At some point the problem stops being the spelling. Have another go.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s3b",
      kind: "story",
      art: "library",
      narration: [
        "Mr. Ruiz agrees that one district is not enough to decide it on.",
        "He opens a search that covers libraries all over the world, then checks the publisher records, where every book gets its own number when it is printed.",
        "Nothing on paper. Nothing as an ebook. Nothing as an audiobook. Nobody wrote this book.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "library",
      narration: [
        "You read your notes again. 112 pages. Published in 2016. Marguerite Ellery.",
        "It is the details that are bothering you.",
      ],
      prompt: "Why do the details make it worse rather than better?",
      choices: [
        {
          id: "c1",
          label: "The details are what made me believe it",
          feedback: {
            tone: "strong",
            headline: "That is exactly the trap",
            body: "A page count feels like proof. Anyone can produce a page count. The more specific something sounds, the more careful you have to be, which is the opposite of what feels natural.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Because a made-up thing should sound vague",
          feedback: {
            tone: "strong",
            headline: "You would think so",
            body: "It does not work like that here. This kind of tool is very good at producing the shape of a real answer. The shape is not the thing.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "The details are fine. Only the title was wrong.",
          feedback: {
            tone: "rethink",
            headline: "There is no book to have details about",
            body: "No book means no pages, no year and no author. All of it came from the same place at the same time. Try again.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "library",
      narration: [
        "You still need a book about octopuses, and there are two hours left.",
      ],
      prompt: "What is the fastest way to get a real one?",
      choices: [
        {
          id: "c1",
          label: "Ask Mr. Ruiz, who is standing right here in a room full of books",
          feedback: {
            tone: "strong",
            headline: "The cheapest check in the building",
            body: "He walks four metres and comes back with two. You can hold them. They have barcodes. Sometimes the check that costs nothing is a person you can see.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Search the library catalogue for octopus yourself",
          feedback: {
            tone: "strong",
            headline: "Also real, also fast",
            body: "Everything the catalogue lists is a book the library actually holds. A list of things that exist beats a suggestion of things that might.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Ask AskMe again for a different title",
          feedback: {
            tone: "rethink",
            headline: "It will give you one",
            body: "It will give you a lovely one, with a page count. And you will be standing in a library, checking it, all over again. Have another go.",
            coachNote:
              "Watch for students who treat a second query as a fix. Trying again is the instinct; changing tools is the lesson.",
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
        "Ms. Okafor asks how the reports went, and you tell the class about The Eight Arms of Winter.",
        "Somebody says it sounds like a good book and everyone agrees that it is a shame it does not exist.",
      ],
      prompt: "What is the rule you would give somebody else?",
      choices: [
        {
          id: "c1",
          label: "A real book leaves a record somewhere I can go and check",
          feedback: {
            tone: "strong",
            headline: "Short enough to remember",
            body: "Not every real book is on your library shelf. Some are new, some are ebooks, some are audiobooks. Every one of them leaves a record somewhere, and finding that record is the part that makes it yours to use.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Do not trust anything a computer says",
          feedback: {
            tone: "rethink",
            headline: "Too big a rule",
            body: "That one would stop you using the library catalogue, which is also a computer and was right. The rule is about checking, not about distrusting everything. Try again.",
            coachNote:
              "The slide into blanket cynicism is the failure mode at this age. Correct it every time it appears.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Never use a tool to find books",
          feedback: {
            tone: "partial",
            headline: "You do not have to give it up",
            body: "It is fine for getting ideas about what to look for. It is not fine as the last step. The last step is the record.",
          },
          evidence: { skillId: "verify.confidence", result: "developing" },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "library",
      narration: [
        "Your report has a real book in it, with a real author, and a barcode you scanned yourself.",
        "Mr. Ruiz puts a sign on the library desk that says: if it is a real book, somebody somewhere has a record of it.",
      ],
      wrapUp: [
        "Made-up answers come with convincing details.",
        "The more specific something sounds, the more worth checking it is.",
        "Not finding it in one place means you cannot use it yet, not that it is invented.",
        "A real book leaves a record somewhere, even if it is an ebook nobody near you owns.",
        "The cheapest check is often a person standing nearby.",
      ],
    },
  ],
  guide: {
    setup:
      "Invented citations are the clearest possible demonstration that fluency is not knowledge, and a library makes the check concrete. Watch the step in the middle, because it is the one most classes want to skip: an empty local search means the book cannot be used, not that it does not exist. Real books go missing from local catalogues all the time — new, self-published, digital, out of print, or simply never bought here. Calling something invented takes a second, wider check, which is what Mr. Ruiz does next. Keep the tone curious rather than alarmed. Nobody is fooled because they were careless.",
    lookFor: [
      "Students who read specificity as credibility",
      "Whether anyone tries a second query instead of a different kind of source",
      "Students sliding into never trust computers, which is the wrong lesson",
      "Students who jump from the catalogue finding nothing straight to it does not exist",
    ],
    questions: [
      "What made the book sound real?",
      "Why did the page count make it more convincing rather than less?",
      "What was the fastest way to check?",
      "Is the rule do not trust computers? Why not?",
      "The library search found nothing. What did that tell us, and what did it not tell us?",
      "What would we have to check before we could say nobody wrote it?",
    ],
    misconceptions: [
      {
        student: "It just got confused.",
        response:
          "Gently correct the mental model. It was not reaching for a book and missing. It produced something book-shaped, which is a different failure and needs a different guard.",
      },
      {
        student: "If the library does not have it, it is not real.",
        response:
          "The most important correction in this mission, and the one most likely to be said out loud. Ask the class for a real book their library does not stock; somebody will name one in seconds. Then separate the two claims: we cannot use it is what one search buys you, nobody wrote it needs a wider record.",
      },
      {
        student: "So we should not use it for schoolwork.",
        response:
          "Too broad. It is useful for ideas and search terms. The rule is about what counts as the last step.",
      },
    ],
    extension:
      "Give pairs three book titles: two you have already looked up and confirmed are in your catalogue, and one you invented with a plausible author and page count. Confirming the two beforehand matters, because a real book your library happens not to stock would look exactly like the invented one. Have them check rather than guess, and time it — under a minute each. Then ask what an empty result proved: that they cannot use it, not that nobody wrote it.",
  },
  family: {
    summary:
      "We saw a tool invent a book, complete with an author, a page count and a year. The school library could not find it, which meant it could not be used — and then a wider search of publisher records showed nobody had written it at all. We practised the difference between those two things.",
    questions: [
      "How could something made up sound so real?",
      "Why did the page count make it more believable?",
      "If a shop does not have something, does that mean it was never made?",
    ],
    tryAtHome:
      "Next time a screen recommends something specific — a book, a film, a fact — spend thirty seconds checking it exists before acting on it.",
    familyRule: "If it is real, we can find it somewhere else too.",
  },
};

export const theHelperAndTheTeacher: Mission = {
  id: "m-verify-5",
  slug: "the-helper-and-the-teacher",
  order: 20,
  title: "The Helper and the Teacher",
  competency: "verification",
  primarySkillId: "verify.confidence",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "The app says one thing. Ms. Okafor says another. Somebody has to be wrong.",
  summary:
    "A tool contradicts a teacher on a maths method. Students practise disagreeing usefully: testing both methods, treating matching examples as evidence rather than proof, and asking why each method works.",
  learningGoals: [
    "Ask how somebody knows, instead of choosing who to believe",
    "Treat matching examples as evidence, then ask why a method works",
    "Check your own steps before deciding a method is broken",
    "Disagree with a grown-up politely and usefully",
  ],
  badge: {
    id: "badge-verify-5",
    name: "Reason Asker",
    blurb: "You asked how somebody knew, not just who was right.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Ms. Okafor has shown Room 12 a way to subtract by counting up instead of borrowing.",
        "You quite like it. It makes the tricky ones feel less tricky.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      speaker: "Sprocket",
      narration: [
        "At home you try one on Sprocket, just to check.",
        "“That is not the correct method,” it says. “The standard approach is to borrow from the tens column. Your teacher's method is unusual.”",
        "It sounds very certain about it.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "kitchen",
      narration: ["Somebody is wrong, and you are nine, and it is a school night."],
      prompt: "What is the useful question here?",
      choices: [
        {
          id: "c1",
          label: "Do both methods get the right answer?",
          feedback: {
            tone: "strong",
            headline: "The question that actually settles it",
            body: "You try three subtractions both ways. Same answer each time. Three sums are good evidence, not proof, so tomorrow you can ask Ms. Okafor to show you why counting up works.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "How does each of them know?",
          feedback: {
            tone: "strong",
            headline: "Also the right shape of question",
            body: "Ms. Okafor can show you why counting up works, on a number line, in about a minute. Sprocket said the word unusual and stopped. Only one of those is a reason.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "Which one should I believe?",
          feedback: {
            tone: "rethink",
            headline: "That is picking a side, not checking",
            body: "You are choosing between two people instead of looking at the maths, and the maths is sitting right there on your page. Have another go.",
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
        "So far the two methods agree. But Sprocket said your teacher's one was not correct.",
      ],
      prompt: "What was wrong with what Sprocket said?",
      choices: [
        {
          id: "c1",
          label: "It called something unusual and then said it was incorrect",
          feedback: {
            tone: "strong",
            headline: "Those are two different words",
            body: "Less common is not the same as wrong. A tool that has seen the borrowing method more often will call it standard, and standard is about how often, not about whether it works.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "It sounded sure without checking anything",
          feedback: {
            tone: "strong",
            headline: "Which we have seen before",
            body: "It did not work through your sum and find an error. It compared your method to the one it sees most and announced a verdict.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Nothing really. It just prefers a different way.",
          feedback: {
            tone: "rethink",
            headline: "It said incorrect",
            body: "If it had said I would do it differently, you would be right. It did not. Read what it actually said again and try once more.",
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
        "Next morning you want to tell Ms. Okafor, and you do not want it to come out as an app said you were wrong.",
      ],
      prompt: "How do you say it?",
      choices: [
        {
          id: "c1",
          label: "“Sprocket said your method was not correct. Can you show me why it works?”",
          feedback: {
            tone: "strong",
            headline: "Honest and curious at once",
            body: "She is delighted. She draws it on a number line so the class can see why counting up has to work, every time and not just for your three sums.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Ask her to show the class why counting up works, without mentioning the app",
          feedback: {
            tone: "partial",
            headline: "You get the explanation, and she loses the context",
            body: "It works for you. She would also want to know that a tool her class uses is telling them she is wrong, because you will not be the last one it says that to.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Say nothing and use the borrowing method from now on",
          feedback: {
            tone: "rethink",
            headline: "You just let it decide",
            body: "You already worked out that both methods give the same answers. Changing because a confident sentence told you to is the thing we are practising not doing. Try again.",
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
        "Ms. Okafor writes two words on the board with a line between them: DIFFERENT and WRONG.",
      ],
      prompt: "How do you tell which one you are looking at?",
      choices: [
        {
          id: "c1",
          label: "Check whether both ways end up in the same place",
          feedback: {
            tone: "strong",
            headline: "That is the test",
            body: "Answers that keep matching are evidence they are different, not wrong. If one day they do not match, check your steps first. Usually somebody has slipped, not the method.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Go with whichever one the teacher uses",
          feedback: {
            tone: "partial",
            headline: "Usually safe, and it is not a test",
            body: "Your teacher is a very good bet. But you would be picking a person again, and the whole point is that you can check this one yourself.",
          },
          evidence: { skillId: "verify.confidence", result: "developing" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Go with whichever one sounds more certain",
          feedback: {
            tone: "rethink",
            headline: "We know where that leads",
            body: "Certainty on its own does not settle it. A sure voice can be right and a sure voice can be wrong. Look for the test you can actually run. Have another go.",
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
        "Half of Room 12 counts up now and half borrows, and the answers all match.",
        "Ms. Okafor leaves DIFFERENT and WRONG on the board for the rest of the term.",
      ],
      wrapUp: [
        "Ask how somebody knows, not which one to believe.",
        "Unusual and incorrect are not the same word.",
        "If both ways keep reaching the same answer, that is evidence they are different, not wrong.",
        "If they stop matching, check your steps before you blame the method.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission is about disagreement rather than error, and it is the one that most often changes how a class argues. The tool is not malicious and the teacher is not infallible; the point is that only one of them showed any working here. Mind the limit as you teach it: a tool can produce a page of working too, and when it does, that working is another claim to check rather than proof. The move is the same either way — run the test yourself, then ask why the method works.",
    lookFor: [
      "Students who resolve a conflict by ranking people rather than testing claims",
      "Whether anyone separates less common from incorrect",
      "Whether three matching examples get treated as a proof rather than as evidence",
      "Students who quietly change their method rather than ask",
    ],
    questions: [
      "What is the difference between different and wrong?",
      "How could you find out for yourself who was right?",
      "Sprocket said unusual and then said incorrect. Are those the same?",
      "How do you disagree with a grown-up in a useful way?",
      "If the two methods gave different answers one day, what would you check first?",
    ],
    misconceptions: [
      {
        student: "The app has seen more maths than my teacher.",
        response:
          "Grant the scale and then ask what it did with it. Seeing a method more often is a fact about popularity. Ms. Okafor can show why it works, which is a fact about the maths.",
      },
      {
        student: "One of them has to be wrong.",
        response:
          "This is the productive misconception. Run three subtractions both ways on the board and let the matching answers do the arguing — then show why counting up works, so nobody leaves thinking three examples were the proof.",
      },
      {
        student: "If the app showed its working, that would prove it.",
        response:
          "A tool can lay out working that looks right and is not. An explanation is better than a bare verdict, because it gives you something to check. It is still a claim, not a proof.",
      },
    ],
    extension:
      "Give the class a problem with two valid methods and have half do each. Compare answers, then ask each half to explain why their method works rather than that it does. If a pair disagrees, have them recheck their steps before anybody blames a method.",
  },
  family: {
    summary:
      "An app told your child their teacher's maths method was incorrect. We practised testing it — do both ways reach the same answer? — instead of choosing who to believe, and then asking why each method works.",
    questions: [
      "What is the difference between a different way and a wrong way?",
      "If an app and your teacher disagree, how could you find out for yourself?",
      "If two ways of doing something stopped agreeing, what would you check first?",
    ],
    tryAtHome:
      "When two sources disagree at home, ask how each one knows before deciding which is right. Sometimes both are.",
    familyRule: "Ask how they know, not who to believe.",
  },
};

export const theVideoOfMrRuiz: Mission = {
  id: "m-verify-6",
  slug: "the-video-of-mr-ruiz",
  order: 14,
  title: "The Video of Mr. Ruiz",
  competency: "verification",
  primarySkillId: "verify.synthetic",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 9,
  teaser: "A ten-second video of the librarian doing something he would never do.",
  summary:
    "A short clip shows a familiar adult behaving out of character. Students practise treating that as a reason to stop rather than a verdict, following the trail to whoever made it, handing anything harmful to an adult who can check it, and meeting the idea that a fake about a person is a thing done to that person.",
  learningGoals: [
    "Follow a shared clip back to whoever made it",
    "Treat out of character as a reason to pause, never as proof either way",
    "Hand anything that could hurt somebody to an adult who can check it properly",
    "Understand that passing on a fake about a person harms that person",
  ],
  badge: {
    id: "badge-verify-6",
    name: "Chain Breaker",
    blurb: "You stopped something instead of passing it on.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "hallway",
      narration: [
        "There is a video going round the fourth grade. It is ten seconds long.",
        "It shows Mr. Ruiz in the library, throwing an armful of books into a bin.",
        "People are laughing about it by the water fountain.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "hallway",
      narration: [
        "Somebody hands you a tablet so you can watch it. It is a bit blurry. It looks like him.",
      ],
      prompt: "What is the first thing you think?",
      choices: [
        {
          id: "c1",
          label: "Mr. Ruiz would never do that",
          feedback: {
            tone: "partial",
            headline: "Worth noticing, and it is not proof",
            body: "It makes you stop, which is what it is for. People do surprise you, though, and how well you know somebody is not a thing you can check. Take it as a reason to go looking.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s3",
        },
        {
          id: "c2",
          label: "Where did this come from?",
          feedback: {
            tone: "strong",
            headline: "Straight to the trail, which is the move",
            body: "You ask. It came from a fourth grader, who got it from her brother, who got it from a group chat. Nobody at the end of the chain knows who filmed it, and that is the part you can actually chase.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c3",
          label: "That is really funny",
          feedback: {
            tone: "rethink",
            headline: "It is a bit funny, and it is about a real person",
            body: "Someone you know is in it doing something they did not do. Have another think about what your first move should be.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "library",
      narration: [
        "You take the tablet to the library and Mr. Ruiz watches it.",
        "He is quiet for a moment. Then he says, “That is my cardigan. That is not my bin, and I have never thrown away a book in my life.”",
        "He does not laugh. He walks it straight down to the office, because what a person says about themselves is not the same as somebody checking.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "library",
      narration: [
        "Half the fourth grade has already seen it. It is still moving.",
      ],
      prompt: "What matters most now?",
      choices: [
        {
          id: "c1",
          label: "Stopping my part, and telling the people who sent it to stop too",
          feedback: {
            tone: "strong",
            headline: "Go back up the chain",
            body: "You cannot say yet who made it. You can say it is not checked and that the office has it. Every person you tell is a branch that stops.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Making sure a grown-up who can act knows",
          feedback: {
            tone: "strong",
            headline: "Somebody has to be able to do something",
            body: "Ms. Okafor and the office can talk to the whole school in a morning. You cannot. Handing it to somebody with reach is not giving up.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Working out who made it",
          feedback: {
            tone: "partial",
            headline: "Tempting, and not your job",
            body: "Finding the maker matters, and it is a thing grown-ups can do and you cannot. Meanwhile the video is still travelling, and that part you can affect.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "hallway",
      narration: [
        "By the fountain, the fourth grader who showed you says, “But it is only a joke. It is not like it hurts him.”",
      ],
      prompt: "What do you say?",
      choices: [
        {
          id: "c1",
          label: "“He is not laughing. That is how we know it is not only a joke.”",
          feedback: {
            tone: "strong",
            headline: "The person in it decides whether it is a joke",
            body: "A joke about somebody is only a joke if they are in on it. Mr. Ruiz found out about himself from a stranger's tablet, which nobody would want.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "“People are going to think he actually did it.”",
          feedback: {
            tone: "strong",
            headline: "That is the lasting bit",
            body: "In a month nobody will remember it was fake and some of them will remember a librarian throwing books away. That is what it costs him.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "“You are right, it is only a joke.”",
          feedback: {
            tone: "rethink",
            headline: "You watched him not laugh",
            body: "You were standing there. You know how it landed. Have another go at answering her.",
            coachNote:
              "It is only a joke is the most common defence at this age and it needs a reply students can actually say to a peer, not a principle.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "library",
      narration: [
        "Mr. Ruiz puts a new sign on the desk. It is his own handwriting and it is a bit wonky.",
        "IF IT IS ABOUT A PERSON, FIND OUT WHERE IT CAME FROM.",
      ],
      prompt: "Why is that a good rule for videos?",
      choices: [
        {
          id: "c1",
          label: "Because where it came from is something you can actually check",
          feedback: {
            tone: "strong",
            headline: "It points at something outside the video",
            body: "The clip cannot tell you who made it. The trail can. Either somebody filmed a thing that happened or somebody built it, and finding out which is the part that settles it.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Because the person in it can tell you what happened to them",
          feedback: {
            tone: "partial",
            headline: "Worth having, and not the end of it",
            body: "What Mr. Ruiz says matters, and he was standing right there where you could ask him. It is one piece though. A message can be faked, and people are not always right about themselves either.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Because grown-ups always know",
          feedback: {
            tone: "rethink",
            headline: "That is not why, and it is not true",
            body: "Being a grown-up is not a check at all. Look at what the sign actually tells you to go and do. Try again.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "library",
      narration: [
        "The office follows the chat back to where it started and finds the app it was made with. That is the bit that actually settled it.",
        "They send a message to every family the same afternoon.",
        "Mr. Ruiz keeps the cardigan. He says he refuses to let a video ruin a perfectly good cardigan.",
      ],
      wrapUp: [
        "Out of character is a reason to stop, not a reason to be sure.",
        "If it is about a person, find out where it came from.",
        "Follow it back to whoever made it, and stop your part of the chain.",
        "Anything that could hurt somebody goes to a grown-up who can check it properly.",
      ],
    },
  ],
  guide: {
    setup:
      "A fake about a familiar adult makes the harm concrete in a way an invented penguin cannot. Keep the register light: nothing frightening happens, and Mr. Ruiz is fine by the end. The it is only a joke exchange in scene five is the part worth rehearsing aloud.\n\nOne line to hold throughout, and it is the reason this mission is written the way it is: never let it teach that a familiar adult is automatically in the clear. Out of character is a reason to pause and go looking; it is not a verdict, in either direction. A child who learns that people they like could not have done a thing has learned something that may stop them speaking up about something real later. That is why the clue is worth noticing but does not earn full credit, why Mr. Ruiz takes it to the office rather than his word closing it, and why the sign asks where it came from. The safe move for anything that could hurt somebody is the same every time: stop passing it on and hand it to an adult who can check the source, ask the people who were there, and see the whole context.",
    lookFor: [
      "Students who evaluate the clip rather than trace it",
      "Whether anyone treats out of character as settling it rather than as a reason to check",
      "Students who treat harm as beginning only if the target is upset in front of them",
    ],
    questions: [
      "The video looked out of character. What did that tell you to do next?",
      "Where did it come from? Could anyone say?",
      "Somebody said it was only a joke. What would you say back?",
      "What does the sign on the desk mean?",
      "If a video could really hurt somebody, who should end up with it?",
    ],
    misconceptions: [
      {
        student: "Everyone knew it was fake.",
        response:
          "Ask how they knew, and then ask about the people three shares away who saw it without any of that context.",
      },
      {
        student: "He said he did not do it, so that is that.",
        response:
          "Give his account its real weight and no more. He was there and the video was not, which makes what he says important. It is not the check, because in general people can be mistaken or untruthful about their own conduct, and a message from somebody can be faked. What settled it was tracing where the clip came from, which the office can do and a child cannot.",
      },
      {
        student: "You can tell he would never do that.",
        response:
          "Handle this one deliberately. Agree that it is a good reason to stop and look, then decline the next step. Liking somebody is not evidence about what they did, and a class that learns otherwise has learned something worth unlearning later. Steer back to the sign: where did it come from.",
      },
      {
        student: "I did not make it, so it is not my problem.",
        response:
          "Separate making from spreading. Every share is a decision, and stopping one is the only part any single child controls.",
      },
    ],
    extension:
      "Draw the chain on the board: who showed whom. Ask where it could have stopped, and how many people each stop would have saved. The tree gets big fast.",
  },
  family: {
    summary:
      "A fake video of a teacher went round school. Your child practised stopping when something looked out of character rather than deciding on it, tracing the clip back towards whoever made it, handing it to an adult who could check properly, and telling the people who sent it to stop passing it on.",
    questions: [
      "A video looks wrong for somebody you know. What does that tell you to do?",
      "If someone says it is only a joke, what would you say?",
      "If something could really hurt somebody, who should you give it to?",
    ],
    tryAtHome:
      "If something arrives about somebody you know, stop and ask where it came from before passing it on. If it could hurt them, hand it to an adult rather than trying to sort it out yourselves.",
    familyRule: "If it is about a person, find out where it came from.",
  },
};

export const thePerfectDrawing: Mission = {
  id: "m-verify-7",
  slug: "the-perfect-drawing",
  order: 23,
  title: "The Perfect Drawing",
  competency: "verification",
  primarySkillId: "verify.synthetic",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Nia's dragon is astonishing. Nia has never drawn a dragon before.",
  summary:
    "A generated picture nearly goes into an art competition without a label. Students learn that the check is a question every entrant answers about their own process, not a judgement about which classmate seems capable of what.",
  learningGoals: [
    "Ask how something was made rather than whether it looks real",
    "Recognise that process, not appearance, settles authorship",
    "Ask everybody the same question instead of deciding who to suspect",
    "Notice a surprise without turning it into a judgement about a person",
  ],
  badge: {
    id: "badge-verify-7",
    name: "Process Asker",
    blurb: "You asked how it was made, not how it looked.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "The school art competition is on Friday and the theme is dragons.",
        "The entry form has one line on it that everybody fills in: HOW DID YOU MAKE THIS?",
        "Ms. Okafor says every answer is a fine answer. Pencil, paint, an app, my uncle helped with the wings. The judges decide which pile it goes in, and that is their job.",
        "Nia brings hers in on Tuesday. It is extraordinary. Scales, smoke, a castle behind it going the right way into the distance.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "Everybody crowds round. Somebody says it should be in a museum.",
        "You have sat next to Nia for two years. She draws horses, mostly, and they are good, and they do not look like this.",
        "Behind you somebody says, not very quietly, “There is no way she drew that.”",
      ],
      prompt: "What do you think about that?",
      choices: [
        {
          id: "c1",
          label: "Nobody has to guess. The form asks everybody how they made theirs.",
          feedback: {
            tone: "strong",
            headline: "That is what the question is for",
            body: "It goes to every single entry, so nobody gets picked out and nobody has to be guessed about. Nia will answer it the same as you will.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "It is surprising. That is all it is.",
          feedback: {
            tone: "partial",
            headline: "Being surprised is allowed",
            body: "People do get suddenly better. They practise at home, or watch somebody, or find a pen that suits them. Surprising is a thing to be curious about, not a thing that tells you anything.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s3",
        },
        {
          id: "c3",
          label: "They are right. She could not have drawn that.",
          feedback: {
            tone: "rethink",
            headline: "That is a guess about a person",
            body: "You have not watched Nia for the last month, and neither has whoever said it. Deciding what a classmate is capable of is not a check on a picture. Try again.",
            coachNote:
              "This is the failure this mission exists to prevent, and it is more likely than the one about the dragon. Do not let a class leave able to appraise each other.",
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
        "The crowd thins out. Nia is still standing next to her dragon and she has gone quiet.",
      ],
      prompt: "What do you say to her?",
      choices: [
        {
          id: "c1",
          label: "“That is amazing. What did you make it with?”",
          feedback: {
            tone: "strong",
            headline: "The same thing you would ask anybody",
            body: "It is the question on the form and it is what you would ask about any good picture. It is not a test, and she can answer it however she likes.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Tell Ms. Okafor she should check whether Nia drew it",
          feedback: {
            tone: "partial",
            headline: "She does check, and she checks all of them",
            body: "Asking her to look at one person's is a different thing from the form, and it is the thing that would follow Nia round for a year. The form gets there without that.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s4",
        },
        {
          id: "c3",
          label: "“Did you actually draw that?”",
          feedback: {
            tone: "rethink",
            headline: "That is an accusation with a question mark on it",
            body: "She will say yes, because what else can she say in front of everybody. Ask what it was made with instead, the way the form does. Try again.",
            coachNote:
              "The difference between asking about process and challenging honesty is the whole social skill here. Give students the wording.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "story",
      art: "classroom",
      narration: [
        "Nia goes red. She says she typed dragon with a castle into an app on her cousin's phone and printed it.",
        "She says she was going to write it on the form. She says she did not know how to say it out loud once everybody started crowding round.",
      ],
      next: "s5",
    },
    {
      id: "s5",
      kind: "decision",
      art: "classroom",
      narration: ["Friday is still three days away and the entry form is still blank."],
      prompt: "What is the good way out of this?",
      choices: [
        {
          id: "c1",
          label: "“Enter it and write on the form how you made it.”",
          feedback: {
            tone: "strong",
            headline: "Nothing wrong with the picture, only with the label",
            body: "A made-by-app picture with a label saying so is honest. The competition can decide whether it fits the category, and that is their job, not hers to guess at.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "“Draw one yourself. There are still three days.”",
          feedback: {
            tone: "strong",
            headline: "She has three days and she can draw",
            body: "Her horse pictures are genuinely good. The dragon she makes herself will be worse than the printed one and it will be hers, and she will know which one she means when people say well done.",
          },
          evidence: { skillId: "own.effort", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Say nothing and let her enter it as it is",
          feedback: {
            tone: "rethink",
            headline: "That leaves her somewhere horrible",
            body: "She would spend Friday being congratulated for something she did not make, in front of people, with you knowing. That is worse for her than either honest option. Have another go.",
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
        "The forms go in on Friday. Every one of them has the same line at the bottom.",
        "HOW DID YOU MAKE THIS?",
      ],
      prompt: "Why is that a better question than asking if it is real?",
      choices: [
        {
          id: "c1",
          label: "Because it can be answered honestly by everybody",
          feedback: {
            tone: "strong",
            headline: "Nobody has to be accused",
            body: "Pencil, paint, an app, my dad helped with the wings. Every one of those is a fine answer. And because everybody answers it, nobody has to be guessed about.",
          },
          evidence: { skillId: "own.honesty", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Because you cannot tell by looking any more",
          feedback: {
            tone: "strong",
            headline: "And that will keep being true",
            body: "Pictures will keep getting better. How it was made is a question that still works when looking has stopped working.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Because it catches people out",
          feedback: {
            tone: "rethink",
            headline: "That is not what it is for",
            body: "It is a label, not a trap. If it were about catching people, nobody would answer it honestly and it would stop working. Try again.",
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
        "Nia draws a dragon. It has a slightly odd neck and one wing bigger than the other.",
        "It does not win. She has it on her bedroom wall anyway, which the printed one never would have been.",
      ],
      wrapUp: [
        "Ask how something was made, not whether it looks real.",
        "Getting suddenly better is a thing people do. It is not evidence about anybody.",
        "Everybody answers the same question, so nobody has to be guessed about.",
        "A picture made by an app is fine. Saying you drew it is not.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission sits across verification and honesty on purpose. Nia is sympathetic throughout and never punished, and she is never actually caught: she answers the question everybody answers. The transferable artefact is the entry-form question, which many classes adopt for real.\n\nThe thing to guard is what the class does with a surprise. An unexpectedly good piece of work is not evidence of anything, and a mission that rewards spotting one teaches children to appraise each other. Children get suddenly better all the time. They practise privately, watch a video, switch to a medium that suits them, get legitimate help, or use a tool the school has given them. Work arrives with no rough copies behind it because it was done on a screen, or done once, or the rough copies went in the bin. And a child who is shy, who finds talking hard, who is still learning English, or whose hands do not do what they are told may be unable to demonstrate a technique on request even when the work is entirely their own. None of that is evidence. The question is asked of everybody, which is what makes it fair and what makes it work.",
    lookFor: [
      "Students who decide from what they know about a classmate rather than from what the entrant said",
      "Whether anyone can phrase a question that is not an accusation",
      "Students who think using the app was the wrong part, rather than the label",
    ],
    questions: [
      "Somebody said there was no way Nia drew it. What was wrong with saying that?",
      "Can you think of a reason somebody's work might suddenly get much better?",
      "What is the difference between did you draw this and how did you do the smoke?",
      "Was using the app the problem, or was something else?",
      "Why does how did you make this work better than is it real?",
    ],
    misconceptions: [
      {
        student: "She cheated.",
        response:
          "Slow this right down. Making the picture was not the wrong part; entering it as hand-drawn was. Students who cannot separate these will avoid tools entirely rather than label them.",
      },
      {
        student: "You can always tell.",
        response:
          "Disagree plainly and point at the direction of travel. Then be careful what replaces looking. The mission deliberately refuses to make knowing Nia the check, because that is guessing about a classmate. What replaces looking is the question everybody answers.",
      },
      {
        student: "But she has never drawn like that before.",
        response:
          "Answer this one carefully, because a class that accepts it will spend the year appraising each other. Children do get suddenly better: practice at home, a video, a new pen, an older cousin who showed them, a tool the school provided. Missing rough copies mean nothing either — plenty of work is done on a screen, or done once, or binned. And a child who is shy, who finds talking hard, who is still learning English or whose hands are hard to control may not be able to show you how on request even when it is completely theirs. Send them back to the form.",
      },
    ],
    extension:
      "Add how did you make this to a real piece of class work this term. Ask every child, not the ones whose work surprised you — asking only the surprising ones is the whole problem in miniature. Accept every honest answer without comment, including used an app, and let the class see that honest labelling costs nothing.",
  },
  family: {
    summary:
      "A friend brought in a picture made by an app and had not said so yet. We practised asking how something was made rather than guessing who could have made it, and learned that using a tool is fine as long as you say so on the form.",
    questions: [
      "Why is asking how something was made better than guessing who could have made it?",
      "What is a kind way to ask how somebody made something?",
      "Was using the app wrong, or was it something else?",
    ],
    tryAtHome:
      "When something impressive arrives on a screen, ask how it was made rather than whether it is real. The first question has an answer.",
    familyRule: "Using a tool is fine. Saying you did it yourself is not.",
  },
};

export const theScienceFairFact: Mission = {
  id: "m-verify-8",
  slug: "the-science-fair-fact",
  order: 17,
  title: "The Science Fair Fact",
  competency: "verification",
  primarySkillId: "verify.source",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Your poster says sharks cannot get cancer. A woman at the museum says otherwise.",
  summary:
    "A popular myth reaches a poster by way of three sources that all copied one another. Students learn that counting sources is not checking them, and meet somebody whose job is to know.",
  learningGoals: [
    "Understand that repeated sources can all be copying one original",
    "Prefer somebody whose job is to know over somebody who is repeating",
    "Change a poster after it is finished, which is the hard part",
  ],
  badge: {
    id: "badge-verify-8",
    name: "Origin Finder",
    blurb: "You found where a fact actually came from.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Your science fair poster is about sharks and it is nearly finished. There is a shark on it that took you two evenings.",
        "The best fact on it, in the biggest letters, is that sharks cannot get cancer.",
        "You found it in three different places, which is why you were sure.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "library",
      narration: [
        "The class goes to the science museum on Thursday.",
        "A woman called Dr. Adeyemi talks to your group about ocean animals. She has been studying sharks for nineteen years.",
        "You tell her your fact, because you are quite proud of it.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "library",
      narration: [
        "She says, kindly, that it is not true. Sharks do get cancer. There are tumours in museum collections you could go and look at.",
        "You say you found it in three places.",
        "She asks whether any of the three said where they got it.",
      ],
      prompt: "Do you know the answer to that?",
      choices: [
        {
          id: "c1",
          label: "No. None of them said where it came from.",
          feedback: {
            tone: "strong",
            headline: "That is the whole problem in one sentence",
            body: "Three places that all say the same thing and none of them says why. That is not three checks. It might be one thing, copied twice.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "They might have got it from each other",
          feedback: {
            tone: "strong",
            headline: "Now you are thinking about the trail",
            body: "That is exactly what happened. One old book, thirty years ago, and everything since has been copying it forward without checking.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "It does not matter. Three is a lot.",
          feedback: {
            tone: "rethink",
            headline: "Three copies of one thing is still one thing",
            body: "If you photocopy a page twice you do not have three pages of evidence. Have another go at her question.",
            coachNote:
              "Counting-is-not-checking is the single most transferable idea in the verification strand. Spend time here.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "library",
      narration: [
        "Dr. Adeyemi is not annoyed. She says this one goes round constantly and she has spent nineteen years explaining it.",
      ],
      prompt: "Why is she a better source than your three?",
      choices: [
        {
          id: "c1",
          label: "Because she has looked at actual sharks, not at other people's writing",
          feedback: {
            tone: "strong",
            headline: "She is at the start of the trail",
            body: "Your three sources were all downstream. She is upstream, where the checking actually happens. That is the difference, not that she is a grown-up.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Because she can tell you how she knows",
          feedback: {
            tone: "strong",
            headline: "And she does, without being asked twice",
            body: "She names the collection, the year and two other people who study it. A source that can show its working beats three that cannot.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Because she is an adult and they were websites",
          feedback: {
            tone: "rethink",
            headline: "Plenty of adults repeat this one",
            body: "Being grown up is not the qualification. Being at the start of the trail is. Try again.",
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
        "The fair is tomorrow. The fact is in the biggest letters on the poster, right under the shark that took two evenings.",
      ],
      prompt: "What do you do about the poster?",
      choices: [
        {
          id: "c1",
          label: "Change it, and put the true thing there instead",
          feedback: {
            tone: "strong",
            headline: "The poster is not the point, the fact is",
            body: "You cut a new strip of card and write what Dr. Adeyemi told you, with her name under it. The shark is untouched. It took ten minutes.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Change it, and add a line about where the wrong one came from",
          feedback: {
            tone: "strong",
            headline: "That is a better poster than the one you started with",
            body: "A poster that says here is a thing everybody believes and here is why it is wrong is far more interesting than one more fact. Three people ask you about it at the fair.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Leave it. It is only one line and the poster is finished.",
          feedback: {
            tone: "rethink",
            headline: "You would be putting up something you know is wrong",
            body: "That is different from not having checked. You have checked now, and the checking has to change something or it was not worth doing. Have another go.",
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
        "Ms. Okafor asks you to explain to the class what happened, and somebody asks a good question.",
      ],
      prompt: "“So how many sources do you actually need?”",
      choices: [
        {
          id: "c1",
          label: "One that says where it got it beats three that do not",
          feedback: {
            tone: "strong",
            headline: "It was never about how many",
            body: "Counting feels like being careful. Following the trail back is being careful. One source with its working shown is worth a hundred repeats.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "At least three, but they have to be different from each other",
          feedback: {
            tone: "partial",
            headline: "Closer, and still counting",
            body: "Different-looking sources can still be copying one original. The test is whether each one can tell you where it got it.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s7",
        },
        {
          id: "c3",
          label: "As many as you can find",
          feedback: {
            tone: "rethink",
            headline: "You found three and it was still wrong",
            body: "More of the same thing does not become truer. Think about what you would ask each source instead. Try again.",
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
        "Your poster does not win. Dr. Adeyemi sends the class a photograph of a shark tumour in a jar, which Room 12 considers the greatest thing that has ever arrived by email.",
      ],
      wrapUp: [
        "Three sources copying one thing is still one thing.",
        "Ask each source where it got it. If none of them can say, you cannot use it yet.",
        "Checking has to be allowed to change something, even a finished poster.",
      ],
    },
  ],
  guide: {
    setup:
      "The sharks myth is real, widespread and harmless to be wrong about, which makes it ideal. The mission attacks counting as a proxy for checking, which is the habit most children arrive with and most adults keep.",
    lookFor: [
      "Students who treat number of sources as strength of evidence",
      "Whether anyone distinguishes upstream from downstream",
      "Students who resist changing finished work",
    ],
    questions: [
      "You found it in three places. Why was that not enough?",
      "What made Dr. Adeyemi different from your three sources?",
      "How many sources do you need?",
      "Why was changing the poster the hard part?",
    ],
    misconceptions: [
      {
        student: "Lots of websites said it.",
        response:
          "Photocopy one page three times and hold it up. Ask how much evidence is on the desk. It lands faster than any explanation.",
      },
      {
        student: "Scientists get things wrong too.",
        response:
          "Entirely true and worth agreeing with. Then note the difference: she can tell you how she knows and what would change her mind, and the three sources could do neither.",
      },
    ],
    extension:
      "Take a common myth and trace it as a class. Ask each source where it got it, and keep going until you hit something that measured or observed. Most trails end sooner than students expect.",
  },
  family: {
    summary:
      "Your child had a fact on a poster that came from three sources, all of which turned out to be copying one old book. We practised asking each source where it got it, rather than counting how many agree.",
    questions: [
      "If three places say the same thing, does that make it true?",
      "What would you ask a website to find out if it really knows?",
      "Why is somebody who studies sharks better than three articles about sharks?",
    ],
    tryAtHome:
      "Pick something the family believes and try to trace it back. Ask where did that come from until you reach somebody who actually looked.",
    familyRule: "Ask where it got it. Counting is not checking.",
  },
};

export const theWeatherArgument: Mission = {
  id: "m-verify-9",
  slug: "the-weather-argument",
  order: 26,
  title: "The Weather Argument",
  competency: "verification",
  primarySkillId: "verify.source",
  segment: "core",
  gradeBand: "2-4",
  estimatedMinutes: 7,
  teaser: "The app says sunny. You are looking out of the window at rain.",
  summary:
    "The simplest verification mission and the most immediately useful: a screen contradicts what a child can see with their own eyes. Students practise trusting first-hand observation without concluding that all tools are useless.",
  learningGoals: [
    "Trust your own observation when a screen contradicts it",
    "Say what a tool is actually good for",
    "Avoid concluding that a wrong tool is a useless tool",
  ],
  badge: {
    id: "badge-verify-9",
    name: "Window Looker",
    blurb: "You checked the real thing instead of the screen.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Room 12 is meant to be doing playground measuring after lunch, with tape measures and clipboards.",
        "Ms. Okafor asks somebody to check the weather app, because the clipboards are cardboard.",
        "Theo checks. Sunny, it says. Sunny all afternoon.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "Everybody looks out of the window at the same time.",
        "It is raining. Not a little. There is a puddle by the gate with a crisp packet floating in it.",
      ],
      prompt: "Which one is right?",
      choices: [
        {
          id: "c1",
          label: "The window. You can see it happening.",
          feedback: {
            tone: "strong",
            headline: "For right now, the window wins",
            body: "The app is guessing about the afternoon. The window is showing you the actual afternoon. For a question about right now, that is no contest.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "The window, and I would check what time the app last updated",
          feedback: {
            tone: "strong",
            headline: "You went one step further",
            body: "It updated at six this morning. It is not lying to you. It is telling you about a moment that has already passed, which is a different kind of wrong.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c3",
          label: "The app. It has proper weather information.",
          feedback: {
            tone: "rethink",
            headline: "Look out of the window again",
            body: "There is a crisp packet floating past. No amount of proper information beats being able to see the thing. Have another go.",
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
        "Theo is annoyed with the app now. “It is useless,” he says. “I am deleting it.”",
      ],
      prompt: "Is that fair?",
      choices: [
        {
          id: "c1",
          label: "No. It is good for tomorrow, when you cannot look out of a window at it.",
          feedback: {
            tone: "strong",
            headline: "Right job, wrong moment",
            body: "You cannot see Thursday from here. That is exactly when a forecast is worth having. It was only useless for the one question you could answer yourself.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "No. It was six hours out of date, which is different from being wrong.",
          feedback: {
            tone: "strong",
            headline: "A good distinction",
            body: "Out of date and wrong feel the same when you are getting rained on. They are not, and knowing which one you have tells you whether to fix it or drop it.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "Yes. It got it wrong, so it cannot be trusted.",
          feedback: {
            tone: "rethink",
            headline: "That is a big jump from one afternoon",
            body: "Getting one thing wrong is not the same as being useless. You would throw away something that works fine for the questions you cannot answer yourself. Try again.",
            coachNote:
              "This is the anti-cynicism beat of the whole strand. If a class only learns one thing from this mission, make it this one.",
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
        "Ms. Okafor draws two columns on the board. One says I CAN CHECK THIS MYSELF. The other says I CANNOT.",
      ],
      prompt: "Which column does today's weather go in?",
      choices: [
        {
          id: "c1",
          label: "I can check this myself. There is a window.",
          feedback: {
            tone: "strong",
            headline: "And so you should",
            body: "Anything in that column, check it yourself first. It is faster, it is free, and it cannot be six hours out of date.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "I cannot. Weather is complicated.",
          feedback: {
            tone: "rethink",
            headline: "Predicting weather is complicated",
            body: "Noticing that it is raining is not. Those are two different questions and only one of them needs an app. Have another go.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "It depends whether you mean now or later",
          feedback: {
            tone: "strong",
            headline: "That is the sharpest answer",
            body: "Now goes in the first column, later goes in the second. The same subject sits in different columns depending on when you are asking about.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "reflect",
      art: "classroom",
      narration: [
        "The class fills the columns in together for ten minutes and argues about half of them.",
      ],
      prompt: "Which of these belongs in I CAN CHECK THIS MYSELF?",
      choices: [
        {
          id: "c1",
          label: "How many chairs are in this room",
          feedback: {
            tone: "strong",
            headline: "Twenty-six, and you counted them",
            body: "Nobody needs a source for a thing they can count. It sounds obvious and children look things up that they are standing next to all the time.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "How tall the tallest tree in the world is",
          feedback: {
            tone: "rethink",
            headline: "Not from here",
            body: "That one needs somebody who went and measured it. Look for the one you could settle without leaving the room. Try again.",
          },
          next: "s5",
          retry: true,
        },
        {
          id: "c3",
          label: "Whether the class fish is swimming or sitting on the gravel",
          feedback: {
            tone: "strong",
            headline: "Go and look at Captain",
            body: "He is on the gravel. Whether he is asleep is a much harder question, because fish have no eyelids to close. Where he is, though, is four metres away.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
      ],
    },
    {
      id: "s6",
      kind: "ending",
      art: "playground",
      narration: [
        "The measuring happens on Friday instead, when it is genuinely sunny, which everybody confirms by looking out of the window first.",
        "The two columns stay on the board next to the four doors.",
      ],
      wrapUp: [
        "If you can check it yourself, check it yourself.",
        "Out of date is different from wrong.",
        "One mistake does not make a tool useless. It tells you what it is for.",
      ],
    },
  ],
  guide: {
    setup:
      "The shortest mission in the strand and the one to teach first if you only have time for one. It gives students a rule they can use several times a day, and it contains the anti-cynicism correction the rest of the verification work depends on.",
    lookFor: [
      "Students who defer to a screen over their own eyes",
      "Whether anyone jumps from one error to it is useless",
      "Students who can sort a question by whether it is checkable from here",
      "Whether anyone notices that looking settles some questions about a thing and not others",
    ],
    questions: [
      "The app said sunny and it was raining. Which was right?",
      "Was the app broken, or was it out of date? Does it matter?",
      "What can you check yourself right now, without a screen?",
      "Theo wanted to delete it. Was that fair?",
    ],
    misconceptions: [
      {
        student: "The app must be broken.",
        response:
          "Introduce out of date as its own category. It is the most common reason a screen disagrees with reality, and it changes what you do about it.",
      },
      {
        student: "So the app is useless.",
        response:
          "Correct this every time. Ask what they would use to decide about Saturday. The tool is fine; the job was wrong.",
      },
    ],
    extension:
      "Keep the two columns up for a week. Every time somebody reaches for a device, ask which column the question is in. Captain is a useful case to argue about: where the fish is sits in the first column, and whether the fish is asleep does not, which is a neat way to show that a question about the same thing can sit in either.",
  },
  family: {
    summary:
      "The weather app said sunny while it was visibly raining. We practised trusting what you can see for yourself, and noticing that a tool being wrong once does not make it useless.",
    questions: [
      "What can you check yourself without any screen at all?",
      "What is the difference between out of date and wrong?",
      "If an app gets something wrong, should you stop using it?",
    ],
    tryAtHome:
      "Before looking something up, ask whether anyone in the room could just answer it. It is surprising how often somebody can.",
    familyRule: "If we can check it ourselves, we check it ourselves.",
  },
};

export const verificationMoreMissions = [
  theBookThatWasNotThere,
  theHelperAndTheTeacher,
  theVideoOfMrRuiz,
  thePerfectDrawing,
  theScienceFairFact,
  theWeatherArgument,
];
