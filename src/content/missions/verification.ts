import type { Mission } from "../types";

export const theVerySureAnswer: Mission = {
  id: "m-verify-1",
  slug: "the-very-sure-answer",
  order: 2,
  title: "The Very Sure Answer",
  competency: "verification",
  primarySkillId: "verify.confidence",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "AskMe gives you an answer. It sounds extremely sure. It is also wrong.",
  summary:
    "Students receive a confident, well-formatted, false answer about goldfish memory, then watch the same tool give a different answer to the same question. They learn to separate how sure something sounds from whether it is true.",
  learningGoals: [
    "Explain that a confident tone is not evidence",
    "Notice when a tool gives two different answers to the same question",
    "Say what you would need to see to actually believe a claim",
  ],
  badge: {
    id: "badge-verify-1",
    name: "Sure Is Not True",
    blurb: "You noticed that sounding certain proves nothing.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Room 12 has a goldfish named Captain. He lives on the shelf by the window and he is, most days, the calmest one in the room.",
        "For science, everybody has to write one true fact about their class pet.",
        "Nia says goldfish forget everything after three seconds. You are not sure that is right.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      speaker: "AskMe",
      narration: [
        "You type the question into AskMe.",
        "“Goldfish have a memory span of exactly three seconds. This is a well established scientific fact, confirmed by researchers.”",
        "It is written in a neat paragraph. It does not sound unsure at all.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "tablet",
      narration: ["Your pencil is over the paper."],
      prompt: "Does the way that answer sounds tell you it is true?",
      choices: [
        {
          id: "c1",
          label: "No. Sounding sure and being right are different things.",
          feedback: {
            tone: "strong",
            headline: "That is the big idea of this mission",
            body: "AskMe can sound sure when it is right and when it is wrong. That means the confident tone is not evidence. You still need something you can check.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Not by itself, but it did say researchers confirmed it",
          feedback: {
            tone: "partial",
            headline: "You went looking for a reason, which is the right instinct",
            body: "Naming researchers is a better sign than sounding sure, so you were reaching for the correct thing. It is still the answer talking about itself. Anybody can type the word researchers.",
          },
          evidence: { skillId: "verify.confidence", result: "developing" },
          next: "s4",
        },
        {
          id: "c2b",
          label: "Yes. It said researchers confirmed it.",
          feedback: {
            tone: "rethink",
            headline: "Which researchers?",
            body: "It did not name any. A tool can write the word researchers without anybody having researched anything. Have another go.",
            coachNote:
              "Unnamed authority is the tell. Students find hunting for the missing name more concrete than abstract scepticism.",
          },
          next: "s3",
          retry: true,
        },
        {
          id: "c3",
          label: "Probably. It is a computer, and computers do not make mistakes.",
          feedback: {
            tone: "rethink",
            headline: "A calculator does exactly the sum you type",
            body: "Which is not the same as being right. Type the wrong sum and it hands you a perfect answer to the wrong question. AskMe is different again: it puts likely words together, and nothing here shows it checked anything. Try again.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "story",
      art: "tablet",
      speaker: "AskMe",
      narration: [
        "Theo types the exact same question into his tablet, word for word.",
        "“Goldfish can remember things for up to five months. The three second myth is not true.”",
        "Same question. Same app. A completely different answer. Both written like they are certain.",
      ],
      next: "s5",
    },
    {
      id: "s5",
      kind: "decision",
      art: "tablet",
      narration: ["You and Theo stare at the two screens."],
      prompt: "What have you just learned?",
      choices: [
        {
          id: "c1",
          label: "At least one of those answers is wrong, and it cannot tell which",
          feedback: {
            tone: "strong",
            headline: "Exactly right",
            body: "They cannot both be true, but AskMe sounded equally sure both times. The tone did not help you choose. Now you need evidence you can check.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "The second one is right because it came later",
          feedback: {
            tone: "rethink",
            headline: "Later does not mean better",
            body: "It is not thinking harder the second time. It is just producing another answer. You still need something outside the app. Pick again.",
          },
          next: "s5",
          retry: true,
        },
        {
          id: "c3",
          label: "You should ask it a third time and use the answer it gives twice",
          feedback: {
            tone: "partial",
            headline: "Creative, but it does not work",
            body: "A wrong answer can show up ten times in a row. Voting between guesses just gives you a popular guess. You need a source from outside.",
          },
          evidence: { skillId: "verify.confidence", result: "developing" },
          next: "s6",
        },
      ],
    },
    {
      id: "s6",
      kind: "decision",
      art: "library",
      narration: [
        "Mr. Ruiz is in the library with a whole shelf of animal books, and there is a science site the school subscribes to.",
        "He says the useful question is not which one looks best. It is which one would have had to get it right.",
      ],
      prompt: "What would actually settle this?",
      choices: [
        {
          id: "c1",
          label: "The school's science site, because it says where the page came from",
          feedback: {
            tone: "strong",
            headline: "You found somebody answerable for it",
            body: "The page names the aquarium that keeps the fish and the study they did. Goldfish remember things for months, and the three seconds was a myth all along. You could go back and find the same page tomorrow.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Ask Mr. Ruiz which one is right",
          feedback: {
            tone: "strong",
            headline: "Asking a person works",
            body: "Mr. Ruiz does not just tell you, he shows you where he looked. That is even better, because now you can do it yourself next time.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Look it up in a book about fish and see who wrote it",
          feedback: {
            tone: "partial",
            headline: "Halfway. Now find out who they are.",
            body: "A name on a cover says somebody wrote it, not that they study fish or that they checked this bit. Turn to the back: this one says where the author works and lists where the facts came from. That is the part that counts.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s7",
        },
        {
          id: "c4",
          label: "Write down the answer you like better and move on",
          feedback: {
            tone: "rethink",
            headline: "You are one step away",
            body: "You already spotted that one of them is wrong. Do not stop there. There is a whole library ten steps down the hall. Try again.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "reflect",
      art: "classroom",
      narration: [
        "Ms. Okafor writes a sentence on the board and leaves a blank in the middle.",
        "“Sounding sure is not the same as ________.”",
      ],
      prompt: "What could go in the blank? More than one thing fits.",
      choices: [
        {
          id: "c1",
          label: "being right",
          feedback: {
            tone: "strong",
            headline: "That is the shortest one",
            body: "Say it any time a screen tells you something in a very confident voice. Sounding sure is not the same as being right.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s8",
        },
        {
          id: "c1b",
          label: "having checked",
          feedback: {
            tone: "strong",
            headline: "That one says how it went wrong",
            body: "Nothing had been looked up. A very sure voice came out of an app that had not been anywhere, and that is the part you can go and do something about.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s8",
        },
        {
          id: "c2",
          label: "being fast",
          feedback: {
            tone: "rethink",
            headline: "Close, but not the point",
            body: "Speed was never the problem. The problem was believing something because of how it sounded. Try again.",
          },
          next: "s7",
          retry: true,
        },
        {
          id: "c3",
          label: "being polite",
          feedback: {
            tone: "rethink",
            headline: "That was the privacy lesson",
            body: "Good memory, wrong mission. This one is about believing things. Have another go.",
          },
          next: "s7",
          retry: true,
        },
      ],
    },
    {
      id: "s8",
      kind: "ending",
      art: "classroom",
      narration: [
        "Your science fact goes up on the board: Captain the goldfish can remember things for months.",
        "Underneath it, in smaller letters, you write where you found out.",
      ],
      wrapUp: [
        "An AI answer can sound sure and still be wrong.",
        "If an answer names no source, you cannot see who checked it.",
        "When answers disagree, check a source outside the tool.",
      ],
    },
  ],
  guide: {
    setup:
      "The core misconception this mission attacks is that fluent, well-formatted output signals accuracy. The same tool contradicts itself in front of the student, which does more work than any explanation.",
    lookFor: [
      "Students treating confident phrasing or the word researchers as evidence",
      "Students who assume a computer cannot be wrong because a calculator does what it is told",
      "Students who treat a named author as evidence, without asking who the author is",
      "Students who resolve a contradiction by preference rather than by evidence",
    ],
    questions: [
      "AskMe gave two different answers. How sure did each one sound?",
      "It said researchers confirmed it. What was missing?",
      "What is the difference between a calculator and a tool like AskMe?",
      "A calculator gave the right answer to the wrong sum. Whose mistake was that?",
      "The book had an author's name on it. What else would you want to know?",
      "What would it take to make you believe a fact about goldfish?",
    ],
    misconceptions: [
      {
        student: "Computers do not make mistakes.",
        response:
          "Draw the distinction, and then draw the second one, because the first is not enough on its own. A calculator does exactly the arithmetic it is handed, which is a different thing from answering the question correctly: wrong sum, wrong units, wrong assumption, and it returns a flawless wrong answer. A language tool is different again — it assembles likely words, and nothing in what it hands you shows a check having happened. Neither of them checks whether the child asked the right thing.",
      },
      {
        student: "It is in a book, so it is true.",
        response:
          "A name on a cover means somebody wrote it, and nothing more. Ask two follow-ups every time: who is this person in relation to this subject, and where did they say they got it? A book that answers both is worth more than three that answer neither, and one that answers neither is in the same position as the app.",
      },
      {
        student: "It said it was confirmed, so somebody checked.",
        response:
          "Have the class look for a source they can identify. If the answer does not show one, the class has no check it can repeat. This transfers directly to the benchmark items.",
      },
    ],
    extension:
      "Give the class a real, harmless myth (bats are blind, we use ten percent of our brains) and race to find one checkable source that settles it. Name the person or organisation responsible for the information.",
  },
  family: {
    summary:
      "We learned that a confident AI answer can still be wrong. Your child watched the same tool give two different answers to the same question, then went and found a source that says where its information came from.",
    questions: [
      "How can you tell if something on a screen is true?",
      "If a computer sounds really sure, does that mean it is right?",
      "Who would have had to get that right, and where would they have written it down?",
    ],
    tryAtHome:
      "Pick a fact your family is not sure about and find one source that names the person or organisation responsible for the information.",
    familyRule: "Sounding sure is not the same as being right.",
  },
};

export const thePenguinOnThePlayground: Mission = {
  id: "m-verify-2",
  slug: "the-penguin-on-the-playground",
  order: 5,
  title: "The Penguin on the Playground",
  competency: "verification",
  primarySkillId: "verify.synthetic",
  gradeBand: "2-4",
  estimatedMinutes: 9,
  teaser: "There is a photo of a penguin behind the slide. And a voice message that sounds like Ms. Okafor.",
  summary:
    "Students examine a shared image and an audio clip that may be AI generated. They practise following the trail back to a maker or witness, using odd details as reasons to pause rather than proof, and — hardest of all — reporting exactly what they established, when one of the two turns out to be settled and the other does not.",
  learningGoals: [
    "List questions to ask about a surprising picture",
    "Check a picture against what it actually claims, including when",
    "Notice that a voice can be copied, and check where a message should have come from",
    "Say exactly what you found out, and no more than that",
  ],
  badge: {
    id: "badge-verify-2",
    name: "Trail Checker",
    blurb: "You checked who made it and who saw it.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "playground",
      narration: [
        "Before the bell, a picture is going around the third grade.",
        "It shows a penguin standing behind the big slide on the school playground. In the picture it is snowing.",
        "Somebody has typed underneath it: PENGUIN AT BRIGHTWOOD THIS MORNING!!!",
        "Six people have already sent it to six other people.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "playground",
      narration: [
        "Theo holds up the tablet. “A penguin! At OUR school!”",
      ],
      prompt: "What is the first thing you want to know?",
      choices: [
        {
          id: "c1",
          label: "Did anybody actually see it? Who took the picture?",
          feedback: {
            tone: "strong",
            headline: "The best first question",
            body: "Nobody can name who took it. It came from a friend of a friend of somebody's cousin. That gives you no trail to follow yet.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "What kind of penguin is it?",
          feedback: {
            tone: "partial",
            headline: "Good curiosity, wrong order",
            body: "That is a great science question for later. First find out whether there was a penguin at all.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Nothing. It is a photo, so it happened.",
          feedback: {
            tone: "rethink",
            headline: "Photos can be made now",
            body: "A computer can draw a picture of anything, anywhere, and make it look like a photograph. So a photo is a claim, not proof. Try again.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "decision",
      art: "playground",
      narration: [
        "You look at the picture properly this time, close up.",
        "The slide is on the wrong side of the sandbox. The penguin has no shadow, even though everything else does. And the message says this morning, and this morning it was sixty degrees and you were out there at break.",
      ],
      prompt: "Which of these is the strongest clue?",
      choices: [
        {
          id: "c1",
          label: "It says this morning, and this morning there was no snow",
          feedback: {
            tone: "strong",
            headline: "You checked it against what it claims",
            body: "Somebody typed a time on it, so now there is something to test. You were out at break and there was no snow, which settles the words underneath the picture. Where the picture itself came from is still nobody.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "The penguin has no shadow",
          feedback: {
            tone: "partial",
            headline: "A clue, not proof",
            body: "A real picture can have a strange shadow. A made-up picture can have a normal-looking shadow. This clue means pause and ask who took the picture or saw it happen.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s4",
        },
        {
          id: "c3",
          label: "The slide is on the wrong side",
          feedback: {
            tone: "partial",
            headline: "Your local knowledge helps",
            body: "That looks wrong for our playground, so it is worth checking. But a real photo can be turned around or have its edges cut off. Use the clue to pause, then ask who made the picture or who was there.",
          },
          evidence: { skillId: "verify.synthetic", result: "developing" },
          next: "s4",
        },
      ],
    },
    {
      id: "s4",
      kind: "story",
      art: "hallway",
      narration: [
        "Then it gets stranger. A voice message goes around too.",
        "It sounds like Ms. Okafor. It says, “Class, no homework tonight because of the penguin.”",
        "It really does sound like her. The voice, the way she says class, all of it.",
      ],
      next: "s5",
    },
    {
      id: "s5",
      kind: "decision",
      art: "hallway",
      narration: ["Theo is already putting his reading log back in his bag."],
      prompt: "What do you do about the voice message?",
      choices: [
        {
          id: "c1",
          label: "Walk to Room 12 and ask Ms. Okafor if she said it",
          feedback: {
            tone: "strong",
            headline: "Go to the actual person",
            body: "She did not send it. For a homework message from your own teacher, standing in front of her settles it, because she is the person it is supposed to have come from.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Check the class page, where homework actually gets posted",
          feedback: {
            tone: "strong",
            headline: "You checked where it should have come from",
            body: "Tonight's homework is on the class page, same as every night. A message that turns up somewhere else, saying a thing you would like to hear, is worth holding up against the place it was supposed to arrive.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Believe it. You would know her voice anywhere.",
          feedback: {
            tone: "rethink",
            headline: "That is what makes copied voices tricky",
            body: "You are not bad at recognising her. The copy is genuinely good. That is why the check has to be asking her, not listening harder. Try again.",
            coachNote:
              "Say plainly that being fooled by a good fake is not a failure of attention. Otherwise students conclude they simply need to listen harder.",
          },
          next: "s5",
          retry: true,
        },
        {
          id: "c4",
          label: "Send it to three more people to see what they think",
          feedback: {
            tone: "rethink",
            headline: "That is how it got to you",
            body: "Every person who passes it on makes it look more real. Passing it along is not checking it. Pick again.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "decision",
      art: "classroom",
      narration: [
        "Ms. Okafor is not angry. She is interested.",
        "“Nobody is in trouble,” she says. “But somebody in this building believes there is a penguin outside. What should we do?”",
      ],
      prompt: "What do you suggest?",
      choices: [
        {
          id: "c1",
          label: "“Ms. Okafor did not send the homework message. Nobody knows where the picture came from.”",
          feedback: {
            tone: "strong",
            headline: "Two things, said separately",
            body: "You found out two different amounts, so you say two different things. The homework is settled. The picture is not, and saying so is more use to somebody than guessing either way.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Tell them the whole thing is fake",
          feedback: {
            tone: "partial",
            headline: "You know that about one of them",
            body: "It stops the homework message, which matters. Nobody has found out where the picture came from though. Calling it fake is a guess, and it is the same mistake as believing it, pointing the other way.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Just delete it and say nothing",
          feedback: {
            tone: "partial",
            headline: "Good for you, quiet for everyone else",
            body: "You will not spread it, which matters. But the six people who sent it are still telling six more.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s7",
        },
        {
          id: "c4",
          label: "Make a better fake to show how easy it is",
          feedback: {
            tone: "rethink",
            headline: "Understandable, but it backfires",
            body: "Now there are two fakes going round and nobody knows which is which. The fix for a confusing thing is not another confusing thing. Try again.",
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
        "The class makes a poster with three questions on it and tapes it above the tablet cart.",
        "Who made this? Who saw it happen? Does it match what I know?",
        "Nobody ever finds out where the penguin picture came from. Ms. Okafor writes UNKNOWN beside it on the board and leaves it up all week, which Theo finds far more annoying than an answer would have been.",
      ],
      wrapUp: [
        "A picture is a claim, not proof. Computers can draw anything.",
        "Check a picture against what it says about itself. Words underneath it can be wrong on their own.",
        "A voice can be copied. Ask the real person, and check where the message should have come from.",
        "Say exactly what you found out. Unknown is a real answer and it beats a guess.",
        "Checking it and then staying quiet still leaves it travelling.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission deliberately teaches process over pixel-hunting. Artefacts like missing shadows do help, but generators improve; the durable moves are asking who made it, who witnessed it, and whether it matches what it claims about itself.\n\nThe two artefacts are deliberately not resolved to the same degree, and that is the hard part to teach. The voice message is settled: Ms. Okafor did not send it, and tonight's homework is on the class page where it always is. The picture is never settled at all — nobody traces it, and the mission ends with UNKNOWN written on the board. Children will want to collapse the two into \"it was all fake\", and that is the same error as believing it, pointed the other way. What the caption claimed can be disproved, because somebody typed a time on it. Where the picture came from cannot, because nobody knows. Hold the class to reporting exactly what was found.",
    lookFor: [
      "Students who rely only on visual artefacts and would be beaten by a better fake",
      "Students who treat familiarity with a voice as proof",
      "Students who verify privately but do not correct the chain",
      "Students who collapse the picture and the voice message into one verdict",
      "Whether anyone can say unknown out loud without treating it as a failure",
    ],
    questions: [
      "What was the very first question worth asking about the penguin picture?",
      "Which clue would still work if the picture had been made better?",
      "Ms. Okafor's voice sounded exactly right. What did you check instead?",
      "What did we actually find out about the picture? What did we not?",
      "Nobody found out about the penguin. Is that a failure?",
    ],
    misconceptions: [
      {
        student: "I can always tell when a picture is fake.",
        response:
          "Gently disprove it. The point of the mission is that provenance beats inspection, precisely because detection gets harder every year.",
      },
      {
        student: "So the penguin picture was fake.",
        response:
          "The most likely sentence in the debrief and the one to slow down. What was disproved is the words typed under it, because they named a morning with no snow in it. The picture itself was never traced to anybody. It might be a computer's, or a real penguin somewhere else entirely with a caption stuck on it. Not knowing is where the mission ends on purpose.",
      },
      {
        student: "If it is fake, it does not matter, it is just a penguin.",
        response:
          "Point at the second half: the voice message changed what a student did about homework. Fakes have consequences that are not about the picture.",
      },
    ],
    extension:
      "Use four images already in a school newsletter, textbook or classroom display. For each one, ask only: who made it, who saw it, and where could we check? Do not ask students to guess real or fake from appearance.",
  },
  family: {
    summary:
      "We looked at a surprising photo with no clear source and a copied voice message. Your child practised asking who made it and who actually saw it, and practised the harder half: the voice message was settled, the picture never was, and saying so exactly is better than deciding.",
    questions: [
      "How could a picture look real but not be real?",
      "If you got a message in a voice you know, how could you check it was really them?",
      "If you found out about one thing and not the other, what would you tell people?",
    ],
    tryAtHome:
      "If a surprising picture or video comes into the family chat, pause and ask together: who made this, and who saw it happen?",
    familyRule: "A picture is a claim, not proof. We ask who made it.",
  },
};

export const twoAnswersOneTruth: Mission = {
  id: "m-verify-3",
  slug: "two-answers-one-truth",
  order: 8,
  title: "Two Answers, One Truth",
  competency: "verification",
  primarySkillId: "verify.source",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "AskMe says the school was built in 1908. The plaque by the front door disagrees.",
  summary:
    "Two dates disagree, and neither of them is wrong. Students learn to work out what a question is actually asking before deciding which answer loses, to read what a source says rather than how official it looks, and to find the record whose job it is to hold that particular fact.",
  learningGoals: [
    "Work out exactly what a question is asking before answering it",
    "Read what a source says, rather than trusting how official it looks",
    "Reconcile two answers before deciding that one of them is wrong",
    "Find the record whose job it is to hold a particular fact",
    "Write down where an answer came from",
  ],
  badge: {
    id: "badge-verify-3",
    name: "Question Sorter",
    blurb: "You worked out the question before you picked the answer.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Room 12 is making a poster about the history of Brightwood Elementary for the hundredth day of school.",
        "Your job is one sentence: the year the school was built.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      speaker: "AskMe",
      narration: [
        "AskMe answers immediately.",
        "“Brightwood Elementary School was built in 1908 and is one of the oldest schools in the district.”",
        "Nia writes it down. It is a good sentence. It would look great on a poster.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "story",
      art: "hallway",
      narration: [
        "On the way to lunch you pass the front doors, where there is a small brass plaque you have walked past nine hundred times.",
        "BRIGHTWOOD ELEMENTARY SCHOOL. ERECTED 1961.",
        "You stop in the hallway with your lunch box in your hand.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "hallway",
      narration: [
        "Two answers. 1908 and 1961.",
        "You are about to decide which one is wrong.",
      ],
      prompt: "Before you pick one, what is worth noticing?",
      choices: [
        {
          id: "c1",
          label: "The plaque says ERECTED. That is about a building.",
          feedback: {
            tone: "strong",
            headline: "You read the actual words",
            body: "Erected means somebody put a building up. A school is a name and a lot of people as well as walls, and those do not have to start in the same year.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "They might both be true, about two different things",
          feedback: {
            tone: "strong",
            headline: "That is the thing to check first",
            body: "A school can start in one place in one year and move into a new building later. Nothing you have read so far says these two answers are even about the same question.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Nobody has said which year the poster wants",
          feedback: {
            tone: "partial",
            headline: "Worth asking, and you can get quite far yourself",
            body: "The year the school was built is two questions in one coat, and asking Ms. Okafor which one she meant is a fair move. The words on the plaque already tell you a lot too.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s5",
        },
        {
          id: "c4",
          label: "The plaque wins. It is old and official and it is right there.",
          feedback: {
            tone: "rethink",
            headline: "Looking official is not a reason",
            body: "A plaque can be put up years afterwards, by anybody, and it can be wrong, and it can be answering a narrower question than yours. Read what this one actually says before you decide it beats anything. Try again.",
            coachNote:
              "Deference to an official-looking object is the failure this mission is really about, and it is more common than believing the app. Name it out loud.",
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
        "Mrs. Delgado in the office keeps the district's building records in a grey cabinet, and she is delighted anybody has asked.",
        "Brightwood Elementary opened in 1908, in a wooden building on Cedar Street.",
        "The building you are standing in went up in 1961, after the old one burned down.",
      ],
      prompt: "So who was wrong?",
      choices: [
        {
          id: "c1",
          label: "Nobody. They were answering different questions.",
          feedback: {
            tone: "strong",
            headline: "That is what the records show",
            body: "1908 is right about the school. 1961 is right about the building. The disagreement was never between them, it was inside your question.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "My sentence was. It never said which one I meant.",
          feedback: {
            tone: "strong",
            headline: "The question was the broken part",
            body: "Once you decide whether you mean the school or the building, both answers stop fighting. Most arguments about facts are this, wearing a disguise.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "AskMe got lucky. It never knew about the fire.",
          feedback: {
            tone: "partial",
            headline: "Fair, and half of it",
            body: "It happened to be right about 1908 and it was never answering the other question at all. It is still worth noticing that the records are what let you tell.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s6",
        },
        {
          id: "c4",
          label: "The plaque was, because the school really started in 1908",
          feedback: {
            tone: "rethink",
            headline: "The plaque never said that",
            body: "It says ERECTED 1961, and the building did go up in 1961. You are still trying to pick a winner. Look for the answer that lets both of them be right. Try again.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "decision",
      art: "classroom",
      narration: [
        "Your sentence ends up being two. Brightwood Elementary opened in 1908. The building we are in went up in 1961, after a fire.",
        "Ms. Okafor asks you to add one more line underneath.",
      ],
      prompt: "What should the extra line say?",
      choices: [
        {
          id: "c1",
          label: "Where you found the answer",
          feedback: {
            tone: "strong",
            headline: "Now anybody can check you",
            body: "The office building records, for both dates. Writing down where an answer came from is what makes it useful to other people, and it is the difference between a fact and a rumour.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "How sure you are",
          feedback: {
            tone: "rethink",
            headline: "We know how that goes",
            body: "This whole unit has been about how little sureness is worth. Put something on the poster that another person could go and check. Try again.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Your name",
          feedback: {
            tone: "partial",
            headline: "Nice, but not the important part",
            body: "Your name says who wrote it. What a reader needs is where you got it, so they can look for themselves.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "hallway",
      narration: [
        "The poster goes up by the front doors, about two metres from the plaque, which turns out to have been telling the truth about a narrower question than anybody was asking it.",
      ],
      wrapUp: [
        "Work out what the question is before you decide which answer is wrong.",
        "Read what a source actually says. Erected is not the same as founded.",
        "Two answers that disagree might be answering two different questions.",
        "Find the record whose job it is to keep that particular fact.",
        "Always write down where the answer came from.",
      ],
    },
  ],
  guide: {
    setup:
      "The conflict in this mission is not real, and that is the whole design. 1908 and 1961 are both correct: the school opened in 1908 and the present building went up in 1961 after a fire. Nothing has to lose.\n\nThat matters because the obvious lesson here — believe the official-looking object over the app — is not a reliable one. Plaques get installed years later, by people who were not there, and they answer whatever narrow question somebody chose to engrave. This one is accurate and it is still not an answer to \"when was the school built\", because that phrase is two questions in one coat. The move to teach, in order: work out what is actually being asked, read what each source actually says, find the record whose job it is to keep that fact, and only then decide whether anybody is wrong. Most of the time nobody is.\n\nExpect the class to want a winner. The retry in scene four exists for exactly that, and so does the one in scene five, which offers the chance to pick the app instead.",
    lookFor: [
      "Students who defer to the plaque because it looks official, without reading it",
      "Whether anyone notices that erected and founded are different claims",
      "Students who insist on picking a winner after the records reconcile both",
      "Whether citing a source feels like a chore or like the point",
    ],
    questions: [
      "The year the school was built. What are the two questions hiding in that?",
      "The plaque says ERECTED. What does that word actually claim?",
      "Who was wrong, in the end?",
      "Where would you go for a fact about a building in this district?",
      "What is the difference between a fact and a rumour?",
    ],
    misconceptions: [
      {
        student: "The internet knows more, so it is more likely right.",
        response:
          "Separate breadth from proximity. Ask the class to name a fact they know that no website knows, such as who sits behind them.",
      },
      {
        student: "If two sources say it, it is true.",
        response:
          "Point out that repeated sources can all be copying one wrong original. Counting is not checking.",
      },
      {
        student: "The plaque was there, so it knows.",
        response:
          "The one to answer carefully, because it sounds like good thinking. A plaque is an object somebody made, at some point, with a sentence somebody chose. It was not necessarily made in the year it names, or by anybody who was present, and this one answers a question about a building. Being physical and being engraved are not the same as being right, and neither is being screwed to a wall.",
      },
    ],
    extension:
      "Send pairs to find a dated object somewhere in the building: a plaque, a dedication, a trophy, a mural signature. For each one, have them write down the exact words and then answer two questions — what does this actually claim, and what does it not tell us? A trophy dated 1994 says a team won something; it says nothing about when the hall was built.",
  },
  family: {
    summary:
      "Two answers about our school disagreed — 1908 and 1961 — and it turned out both were right, about different things. We practised working out what a question is actually asking before deciding somebody is wrong, and reading what a source says rather than trusting how official it looks.",
    questions: [
      "How old is our house? Does that mean the building, or how long we have been here?",
      "If two people give different answers, how could they both be right?",
      "Why should you write down where you found an answer?",
    ],
    tryAtHome:
      "Find something in your home with a date on it — a coin, a stamped label, a photograph — and work out together what the date actually refers to. It is almost never the thing you first assume.",
    familyRule: "Work out the question before deciding who is wrong.",
  },
};

export const verificationMissions = [
  theVerySureAnswer,
  thePenguinOnThePlayground,
  twoAnswersOneTruth,
];
