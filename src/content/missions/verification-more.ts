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
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "AskMe recommends the perfect book for your report. The library has never heard of it.",
  summary:
    "A tool invents a book title, an author and a page count, all delivered with complete confidence. Students learn that detail is not evidence, and that the easiest check is often a person standing ten metres away.",
  learningGoals: [
    "Understand that made-up answers come with convincing details",
    "Check a claim in the cheapest place available",
    "Say that something turned out not to exist, without embarrassment",
  ],
  badge: {
    id: "badge-verify-4",
    name: "Shelf Checker",
    blurb: "You went and looked instead of believing.",
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
      prompt: "What has happened here?",
      choices: [
        {
          id: "c1",
          label: "The book does not exist. It was made up.",
          feedback: {
            tone: "strong",
            headline: "That is the answer, and it is a strange one",
            body: "It did not find a wrong book. It produced a title, an author, a page count and a year for a book nobody has ever written. All of it sounded exactly like a real book.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Maybe the library just does not have it",
          feedback: {
            tone: "partial",
            headline: "A fair first thought",
            body: "That is a sensible guess and worth ruling out, which Mr. Ruiz just did with four hundred thousand books. When nothing anywhere has heard of it, the guess runs out.",
          },
          evidence: { skillId: "verify.confidence", result: "developing" },
          next: "s4",
        },
        {
          id: "c3",
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
          label: "If a book is real, you can hold it. Go and check.",
          feedback: {
            tone: "strong",
            headline: "Short enough to remember",
            body: "Real books have shelves. Real facts have somebody who checked them. The check is the part that makes it yours to use.",
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
            body: "It is fine for getting ideas about what to look for. It is not fine as the last step. The last step is the shelf.",
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
        "Mr. Ruiz puts a sign on the library desk that says: if it is a real book, we can find it.",
      ],
      wrapUp: [
        "Made-up answers come with convincing details.",
        "The more specific something sounds, the more worth checking it is.",
        "The cheapest check is often a person standing nearby.",
      ],
    },
  ],
  guide: {
    setup:
      "Invented citations are the clearest possible demonstration that fluency is not knowledge, and a library makes the check physical: the book is either on a shelf or it is not. Keep the tone curious rather than alarmed. Nobody is fooled because they were careless.",
    lookFor: [
      "Students who read specificity as credibility",
      "Whether anyone tries a second query instead of a different kind of source",
      "Students sliding into never trust computers, which is the wrong lesson",
    ],
    questions: [
      "What made the book sound real?",
      "Why did the page count make it more convincing rather than less?",
      "What was the fastest way to check?",
      "Is the rule do not trust computers? Why not?",
    ],
    misconceptions: [
      {
        student: "It just got confused.",
        response:
          "Gently correct the mental model. It was not reaching for a book and missing. It produced something book-shaped, which is a different failure and needs a different guard.",
      },
      {
        student: "So we should not use it for schoolwork.",
        response:
          "Too broad. It is useful for ideas and search terms. The rule is about what counts as the last step.",
      },
    ],
    extension:
      "Give pairs three book titles, two real and one you invented with a plausible author and page count. Have them check the catalogue rather than guess. Time it: the check takes under a minute.",
  },
  family: {
    summary:
      "We saw a tool invent a book, complete with an author, a page count and a year, then discovered no library anywhere had it. We practised checking in the cheapest place available.",
    questions: [
      "How could something made up sound so real?",
      "Why did the page count make it more believable?",
      "Where is the quickest place to check whether a book exists?",
    ],
    tryAtHome:
      "Next time a screen recommends something specific — a book, a film, a fact — spend thirty seconds checking it exists before acting on it.",
    familyRule: "If it is real, we can find it somewhere else too.",
  },
};

export const theHelperAndTheTeacher: Mission = {
  id: "m-verify-5",
  slug: "the-helper-and-the-teacher",
  order: 12,
  title: "The Helper and the Teacher",
  competency: "verification",
  primarySkillId: "verify.confidence",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "The app says one thing. Ms. Okafor says another. Somebody has to be wrong.",
  summary:
    "A tool contradicts a teacher on a maths method. Students practise disagreeing usefully: asking how somebody knows rather than picking a side, and discovering that two different answers can both be right.",
  learningGoals: [
    "Ask how somebody knows, instead of choosing who to believe",
    "Notice when two answers are different rather than wrong",
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
            body: "You try three subtractions both ways. Both give the same answers, every time. They are two roads to one place, which means neither one is wrong.",
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
        "So both methods work. But Sprocket said your teacher's one was not correct.",
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
            body: "She is delighted. She draws it on a number line for the whole class and says this is the best question anybody has asked her this week.",
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
            body: "Same answer every time means different. A different answer means one of them is wrong, and then you go and find out which.",
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
            body: "Certainty is the one thing that tells you nothing at all. Look for the test you can actually run. Have another go.",
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
        "If both ways reach the same answer, they are different, not wrong.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission is about disagreement rather than error, and it is the one that most often changes how a class argues. The tool is not malicious and the teacher is not infallible; the point is that only one of them can show its working.",
    lookFor: [
      "Students who resolve a conflict by ranking people rather than testing claims",
      "Whether anyone separates less common from incorrect",
      "Students who quietly change their method rather than ask",
    ],
    questions: [
      "What is the difference between different and wrong?",
      "How could you find out for yourself who was right?",
      "Sprocket said unusual and then said incorrect. Are those the same?",
      "How do you disagree with a grown-up in a useful way?",
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
          "This is the productive misconception. Run three subtractions both ways on the board and let the matching answers do the arguing.",
      },
    ],
    extension:
      "Give the class a problem with two valid methods and have half do each. Compare answers, then ask each half to explain why their method works rather than that it does.",
  },
  family: {
    summary:
      "An app told your child their teacher's maths method was incorrect. We practised testing it — do both ways reach the same answer? — instead of choosing who to believe.",
    questions: [
      "What is the difference between a different way and a wrong way?",
      "If an app and your teacher disagree, how could you find out for yourself?",
      "What does it mean when something sounds very certain?",
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
  gradeBand: "2-4",
  estimatedMinutes: 9,
  teaser: "A ten-second video of the librarian doing something he would never do.",
  summary:
    "A short clip shows a familiar adult behaving out of character. Students practise following the trail to whoever made it, and meet the idea that a fake about a person is a thing done to that person.",
  learningGoals: [
    "Follow a shared clip back to whoever made it",
    "Notice when something is out of character for somebody you know",
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
            tone: "strong",
            headline: "You know him",
            body: "He re-covers paperbacks with sticky-back plastic for fun. Knowing somebody well is a real check, and it is one no stranger who made this could have.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "Where did this come from?",
          feedback: {
            tone: "strong",
            headline: "Straight to the trail",
            body: "You ask. It came from a fourth grader, who got it from her brother, who got it from a group chat. Nobody at the end of the chain knows who filmed it.",
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
        "He does not laugh.",
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
          label: "Telling the people who sent it to me that it is not real",
          feedback: {
            tone: "strong",
            headline: "Go back up the chain",
            body: "Every person you tell is a branch that stops. You cannot catch all of it and you can stop your part, which is the only part that was ever yours.",
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
            headline: "The person in it decides",
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
        "IF IT IS ABOUT A PERSON, ASK THE PERSON.",
      ],
      prompt: "Why is that a good rule for videos?",
      choices: [
        {
          id: "c1",
          label: "Because the person is the one source nobody can fake",
          feedback: {
            tone: "strong",
            headline: "They were there and the video was not",
            body: "You can copy a face, a voice, a cardigan. You cannot copy the actual person standing in front of you saying that never happened.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Because it is polite",
          feedback: {
            tone: "partial",
            headline: "It is polite, and it is more than that",
            body: "Being decent about it matters. It is also the single most reliable check available, which is why the rule is on a sign rather than in a manners lesson.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Because grown-ups always know",
          feedback: {
            tone: "rethink",
            headline: "Not always, but about themselves, yes",
            body: "He is not right because he is a grown-up. He is right because it was supposed to be him. Try again.",
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
        "The office sends a message to every family the same afternoon.",
        "Mr. Ruiz keeps the cardigan. He says he refuses to let a video ruin a perfectly good cardigan.",
      ],
      wrapUp: [
        "Knowing somebody well is a real check.",
        "Follow it back to whoever made it, and stop your part of the chain.",
        "If it is about a person, ask the person.",
      ],
    },
  ],
  guide: {
    setup:
      "A fake about a familiar adult makes the harm concrete in a way an invented penguin cannot. Keep the register light: nothing frightening happens, and Mr. Ruiz is fine by the end. The it is only a joke exchange in scene five is the part worth rehearsing aloud.",
    lookFor: [
      "Students who evaluate the clip rather than trace it",
      "Whether anyone recognises out of character as evidence",
      "Students who treat harm as beginning only if the target is upset in front of them",
    ],
    questions: [
      "What did you know about Mr. Ruiz that the video did not?",
      "Where did it come from? Could anyone say?",
      "Somebody said it was only a joke. What would you say back?",
      "What does the sign on the desk mean?",
    ],
    misconceptions: [
      {
        student: "Everyone knew it was fake.",
        response:
          "Ask how they knew, and then ask about the people three shares away who saw it without any of that context.",
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
      "A fake video of a teacher went round school. Your child practised tracing it back to whoever made it, using what they already knew about the person, and telling the people who sent it that it was not real.",
    questions: [
      "How could you tell a video of someone you know is not real?",
      "If someone says it is only a joke, what would you say?",
      "What does asking the person actually mean?",
    ],
    tryAtHome:
      "If something arrives about somebody you know, ask them before passing it on. It takes a message and it settles it.",
    familyRule: "If it is about a person, ask the person.",
  },
};

export const thePerfectDrawing: Mission = {
  id: "m-verify-7",
  slug: "the-perfect-drawing",
  order: 15,
  title: "The Perfect Drawing",
  competency: "verification",
  primarySkillId: "verify.synthetic",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Nia's dragon is astonishing. Nia has never drawn a dragon before.",
  summary:
    "A generated picture is entered in an art competition as hand-drawn. Students practise asking about process rather than appearance, and learn that the check for a picture is the same as for a fact: who made it, and how.",
  learningGoals: [
    "Ask how something was made rather than whether it looks real",
    "Recognise that process, not appearance, settles authorship",
    "Raise a concern about a friend without accusing them",
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
        "Nia brings hers in on Tuesday. It is extraordinary. Scales, smoke, a castle behind it going the right way into the distance.",
        "Everybody crowds round. Somebody says it should be in a museum.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "You have sat next to Nia for two years. She draws horses, mostly, and they are good, and they do not look like this.",
      ],
      prompt: "What are you actually noticing?",
      choices: [
        {
          id: "c1",
          label: "This does not match anything else she has made",
          feedback: {
            tone: "strong",
            headline: "You noticed a jump, not a flaw",
            body: "You are not saying it looks fake. You are saying it does not follow from anything, and people's drawing usually follows from what they drew last month.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "The castle is drawn better than the dragon",
          feedback: {
            tone: "partial",
            headline: "That is looking at the picture",
            body: "It might mean something and it might not. Some people are better at buildings. The stronger clue is about Nia, not about the paper.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Nothing. She probably practised.",
          feedback: {
            tone: "rethink",
            headline: "Maybe, and that is checkable",
            body: "If she practised there will be earlier tries, because nobody arrives at this in one go. Have another think about what you noticed.",
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
        "You could say nothing. She is your friend and Friday is three days away.",
      ],
      prompt: "If you say something, what do you ask?",
      choices: [
        {
          id: "c1",
          label: "“How did you do the smoke? I want to learn it.”",
          feedback: {
            tone: "strong",
            headline: "A question about process, and a kind one",
            body: "If she drew it, she will show you, happily, for ten minutes. If she did not, the question lands somewhere else entirely. Either way you did not accuse anybody.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "“Do you have the first tries? I love seeing rough ones.”",
          feedback: {
            tone: "strong",
            headline: "Asking for the working",
            body: "Real drawings leave a trail: smudges, a bin full of dragons with wrong necks. A picture with no history behind it is worth a question.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "“Did you actually draw that?”",
          feedback: {
            tone: "rethink",
            headline: "That is an accusation with a question mark on it",
            body: "She will say yes, because what else can she say in front of everybody. Ask about how it was made instead. Try again.",
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
        "She says she was going to say. She says she did not know how to say it once everybody started crowding round.",
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
        "Ms. Okafor adds one line to the entry form for everybody, not just Nia.",
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
            body: "Pencil, paint, an app, my dad helped with the wings. Every one of those is a fine answer. The question stops being a trap and starts being a label.",
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
        "Real work leaves a trail of earlier tries.",
        "A picture made by an app is fine. Saying you drew it is not.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission sits across verification and honesty on purpose. Nia is sympathetic throughout and never punished; she gets caught by kindness rather than by a rule. The transferable artefact is the entry-form question, which many classes adopt for real.",
    lookFor: [
      "Students who inspect the image instead of asking about process",
      "Whether anyone can phrase a question that is not an accusation",
      "Students who think using the app was the wrong part, rather than the label",
    ],
    questions: [
      "What did you notice, and was it about the picture or about Nia?",
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
          "Disagree plainly and point at the direction of travel. The mission deliberately gives the strongest clue as knowledge of Nia, not inspection of the paper.",
      },
    ],
    extension:
      "Add how did you make this to a real piece of class work this term. Accept every honest answer without comment, including used an app, and let the class see that honest labelling costs nothing.",
  },
  family: {
    summary:
      "A friend entered a picture made by an app as her own drawing. We practised asking how something was made rather than whether it looks real, and learned that using a tool is fine as long as you say so.",
    questions: [
      "How could you tell a picture was not drawn by hand?",
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
        "Your poster does not win either. Dr. Adeyemi sends the class a photograph of a shark tumour in a jar, which Room 12 considers the greatest thing that has ever arrived by email.",
      ],
      wrapUp: [
        "Three sources copying one thing is still one thing.",
        "Ask each source where it got it. If none of them can say, you have nothing.",
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
  order: 18,
  title: "The Weather Argument",
  competency: "verification",
  primarySkillId: "verify.source",
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
            headline: "First-hand beats forecast, every time",
            body: "The app is guessing about the afternoon. The window is showing you the actual afternoon. There is no contest and it is worth saying out loud.",
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
          label: "Whether the class fish is awake",
          feedback: {
            tone: "strong",
            headline: "Go and look at Captain",
            body: "He is awake. He is always awake. The point stands: the answer is four metres away and no screen is faster than that.",
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
      "Keep the two columns up for a week. Every time somebody reaches for a device, ask which column the question is in. The first-column reaches drop off within days.",
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
