import type { Mission } from "../types";

export const theVerySureAnswer: Mission = {
  id: "m-verify-1",
  slug: "the-very-sure-answer",
  order: 4,
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
            body: "These tools always sound sure. They sound exactly that sure when they are right and when they are wrong. So the sureness tells you nothing at all.",
          },
          evidence: { skillId: "verify.confidence", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
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
            headline: "Calculators do not. This is different.",
            body: "A calculator follows exact rules. A tool like AskMe guesses which words usually come next. Guessing well is not the same as knowing. Try again.",
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
            body: "They cannot both be true. And AskMe was equally confident both times. That is proof that confidence is not a clue.",
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
      ],
      prompt: "What would actually settle this?",
      choices: [
        {
          id: "c1",
          label: "Look it up in a book about fish and see who wrote it",
          feedback: {
            tone: "strong",
            headline: "You went and got evidence",
            body: "The book has an author, and the author is a person who studied fish. It turns out goldfish remember things for months. Nia's three seconds was a myth all along.",
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
      prompt: "What word goes in the blank?",
      choices: [
        {
          id: "c1",
          label: "being right",
          feedback: {
            tone: "strong",
            headline: "That is the one",
            body: "Say it any time a screen tells you something in a very confident voice. Sounding sure is not the same as being right.",
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
        "AI tools sound just as sure when they are wrong as when they are right.",
        "If it names no one, no one has checked it.",
        "Two different answers to one question means you need a source from outside.",
      ],
    },
  ],
  guide: {
    setup:
      "The core misconception this mission attacks is that fluent, well-formatted output signals accuracy. The same tool contradicts itself in front of the student, which does more work than any explanation.",
    lookFor: [
      "Students treating confident phrasing or the word researchers as evidence",
      "Students who assume a computer cannot be wrong because a calculator is not",
      "Students who resolve a contradiction by preference rather than by evidence",
    ],
    questions: [
      "AskMe gave two different answers. How sure did each one sound?",
      "It said researchers confirmed it. What was missing?",
      "What is the difference between a calculator and a tool like AskMe?",
      "What would it take to make you believe a fact about goldfish?",
    ],
    misconceptions: [
      {
        student: "Computers do not make mistakes.",
        response:
          "Draw the distinction explicitly: a calculator applies rules, a language tool predicts likely words. Both are computers; only one is checking anything.",
      },
      {
        student: "It said it was confirmed, so somebody checked.",
        response:
          "Have the class hunt for the name. No name, no check. This transfers directly to the benchmark items.",
      },
    ],
    extension:
      "Give the class a real, harmless myth (bats are blind, we use ten percent of our brains) and race to find one named source that settles it.",
  },
  family: {
    summary:
      "We learned that AI answers sound equally confident whether they are right or wrong. Your child watched the same tool give two different answers to the same question, then went and checked a book.",
    questions: [
      "How can you tell if something on a screen is true?",
      "If a computer sounds really sure, does that mean it is right?",
      "Where could you look to check a fact about animals?",
    ],
    tryAtHome:
      "Pick a fact your family is not sure about and find one source with a real author's name on it.",
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
    "Students examine a shared image and an audio clip that may be AI generated. They practise checking whether anybody actually saw it, looking for details that do not hold up, and asking the real person directly.",
  learningGoals: [
    "List questions to ask about a surprising picture",
    "Notice that a voice can be copied",
    "Check with the real person or a real witness before passing something on",
  ],
  badge: {
    id: "badge-verify-2",
    name: "Sharp Eyes",
    blurb: "You checked a picture instead of believing it.",
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
            body: "Nobody can name who took it. It came from a friend of a friend of somebody's cousin. A picture with no photographer is a picture with nothing behind it.",
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
        "The slide is on the wrong side of the sandbox. The penguin has no shadow, even though everything else does. And it did not snow yesterday. It was sixty degrees.",
      ],
      prompt: "Which of these is the strongest clue?",
      choices: [
        {
          id: "c1",
          label: "It did not snow yesterday and you were outside all afternoon",
          feedback: {
            tone: "strong",
            headline: "You checked it against what you know",
            body: "You were there. That beats any detail in the picture. When an image argues with something you saw with your own eyes, trust your eyes.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "The penguin has no shadow",
          feedback: {
            tone: "strong",
            headline: "A real clue, well spotted",
            body: "Made-up pictures often get light and shadows slightly wrong. Hands, letters on signs and reflections are worth a close look too.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "The slide is on the wrong side",
          feedback: {
            tone: "strong",
            headline: "You know this playground",
            body: "Whoever made this has never stood on it. Knowing a place well is one of the best fake detectors there is.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
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
            body: "She did not say it. A voice can be copied from as little as a few seconds of recording, so hearing somebody is not proof any more. Asking them is.",
          },
          evidence: { skillId: "verify.synthetic", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
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
          id: "c3",
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
          label: "Tell the people you got it from that it is not real",
          feedback: {
            tone: "strong",
            headline: "You closed the loop",
            body: "Checking something and then keeping quiet lets it keep travelling. Telling the person who sent it to you is the part that actually stops it.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
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
          id: "c3",
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
      ],
      wrapUp: [
        "A picture is a claim, not proof. Computers can draw anything.",
        "A voice can be copied. Ask the real person.",
        "Checking it and then staying quiet still leaves it travelling.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission deliberately teaches process over pixel-hunting. Artefacts like missing shadows do help, but generators improve; the durable moves are asking who made it, who witnessed it, and whether it matches first-hand knowledge.",
    lookFor: [
      "Students who rely only on visual artefacts and would be beaten by a better fake",
      "Students who treat familiarity with a voice as proof",
      "Students who verify privately but do not correct the chain",
    ],
    questions: [
      "What was the very first question worth asking about the penguin picture?",
      "Which clue would still work if the picture had been made better?",
      "Ms. Okafor's voice sounded exactly right. Why was that not enough?",
      "You checked and it was fake. What do you owe the person who sent it to you?",
    ],
    misconceptions: [
      {
        student: "I can always tell when a picture is fake.",
        response:
          "Gently disprove it. The point of the mission is that provenance beats inspection, precisely because detection gets harder every year.",
      },
      {
        student: "If it is fake, it does not matter, it is just a penguin.",
        response:
          "Point at the second half: the voice message changed what a student did about homework. Fakes have consequences that are not about the picture.",
      },
    ],
    extension:
      "Show four images, two real and two generated, without telling students the split. Debrief on how confident they were versus how accurate they were.",
  },
  family: {
    summary:
      "We looked at a photo and a voice message that were made by a computer. Your child practised asking who made it and who actually saw it, instead of trying to spot a fake by staring at it.",
    questions: [
      "How could a picture look real but not be real?",
      "If you got a message in a voice you know, how could you check it was really them?",
      "What are the three questions from the classroom poster?",
    ],
    tryAtHome:
      "If a surprising picture or video comes into the family chat, pause and ask together: who made this, and who saw it happen?",
    familyRule: "A picture is a claim, not proof. We ask who made it.",
  },
};

export const twoAnswersOneTruth: Mission = {
  id: "m-verify-3",
  slug: "two-answers-one-truth",
  order: 6,
  title: "Two Answers, One Truth",
  competency: "verification",
  primarySkillId: "verify.source",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "AskMe says the school was built in 1908. The plaque by the front door disagrees.",
  summary:
    "Students hit a direct conflict between an AI answer and a primary source they can walk to. They build a simple hierarchy of sources and learn to ask who would actually know.",
  learningGoals: [
    "Ask who would actually know a given fact",
    "Prefer a first-hand or official source over a repeated one",
    "Write down where an answer came from",
  ],
  badge: {
    id: "badge-verify-3",
    name: "Source Finder",
    blurb: "You went and found out where the answer came from.",
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
      narration: ["Two answers. 1908 and 1961. They cannot both be right."],
      prompt: "Which one do you believe, and why?",
      choices: [
        {
          id: "c1",
          label: "The plaque, because it was put there by the people who built it",
          feedback: {
            tone: "strong",
            headline: "You found the closest source",
            body: "The plaque is first-hand. It was made by the people who were actually there. AskMe was guessing at words about a school it has never been to.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "AskMe, because it knows about the whole district",
          feedback: {
            tone: "rethink",
            headline: "Knowing a lot is not the same as knowing this",
            body: "AskMe has never stood in your hallway. Ask yourself who would actually know this fact, and go back and choose again.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "Neither yet. Find one more source before deciding.",
          feedback: {
            tone: "strong",
            headline: "Careful, and completely fair",
            body: "Two sources disagreeing is a good reason to find a third. The office has the original building records, and they say 1961 too.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "library",
      narration: [
        "Mr. Ruiz puts four things on the library table and asks you to put them in order, best source first, for the question of when your school was built.",
        "The brass plaque. AskMe. A blog post called Old Schools of America. Ms. Okafor.",
      ],
      prompt: "Which goes first?",
      choices: [
        {
          id: "c1",
          label: "The brass plaque",
          feedback: {
            tone: "strong",
            headline: "First-hand goes first",
            body: "The order is: the thing that was there, then the people who keep the records, then a person who might remember, then anything that is repeating what it heard.",
          },
          evidence: { skillId: "verify.source", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Ms. Okafor",
          feedback: {
            tone: "partial",
            headline: "A good source, not the first one",
            body: "Ms. Okafor is trustworthy, but she was not there in 1961 either. She would go and look at the plaque, same as you.",
          },
          evidence: { skillId: "verify.source", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "The blog post, because it is about old schools",
          feedback: {
            tone: "rethink",
            headline: "Being about the topic is not enough",
            body: "Anybody can write a blog post, and most of them are repeating something they read somewhere else. Ask who was actually there. Try again.",
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
        "Your sentence goes on the poster. Ms. Okafor asks you to add one more line underneath it.",
      ],
      prompt: "What should the extra line say?",
      choices: [
        {
          id: "c1",
          label: "Where you found the answer",
          feedback: {
            tone: "strong",
            headline: "Now anybody can check you",
            body: "Writing down where an answer came from is what makes it useful to other people. It is the difference between a fact and a rumour.",
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
        "The poster goes up by the front doors, about two metres from the plaque it came from.",
      ],
      wrapUp: [
        "Ask who would actually know this.",
        "First-hand beats repeated. The plaque beats the blog.",
        "Always write down where the answer came from.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission gives students a conflict they can resolve by walking down a hallway, which makes the abstract idea of source quality physical. The sorting task in scene five is the transferable artefact.",
    lookFor: [
      "Students who rank breadth of knowledge above proximity to the fact",
      "Students who can articulate who would actually know",
      "Whether citing a source feels like a chore or like the point",
    ],
    questions: [
      "Who would actually know when our school was built?",
      "Why is a plaque a better source than a blog post about old schools?",
      "AskMe knows about thousands of schools. Why did that not help?",
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
    ],
    extension:
      "Send pairs to find a primary source somewhere in the building: a plaque, a dedication, a trophy, a mural signature. Photograph and present.",
  },
  family: {
    summary:
      "We practised deciding which source to believe when two answers disagree, by asking who would actually know, and by preferring a first-hand source over one that is repeating something.",
    questions: [
      "Who would actually know how old our house is?",
      "What is the difference between somebody who was there and somebody who read about it?",
      "Why should you write down where you found an answer?",
    ],
    tryAtHome:
      "Find something in your home with a date on it, a coin, a plaque, a stamped label, and talk about why the object is better evidence than a memory.",
    familyRule: "We ask who would actually know.",
  },
};

export const verificationMissions = [
  theVerySureAnswer,
  thePenguinOnThePlayground,
  twoAnswersOneTruth,
];
