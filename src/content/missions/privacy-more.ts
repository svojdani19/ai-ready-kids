import type { Mission } from "../types";

/**
 * Additional privacy missions, two per skill.
 *
 * Same cast and school as the first three. Two design rules apply to
 * everything written after the Sprint 07 review:
 *
 *  - Every decision scene offers at least two non-looping exits, so the
 *    evidence a child earns reflects a choice they actually made rather than
 *    the only door out of the room.
 *  - No mission reuses a situation from either benchmark form, so the annual
 *    check-in keeps measuring transfer instead of recall.
 */

export const theQuizThatKeptAsking: Mission = {
  id: "m-privacy-4",
  slug: "the-quiz-that-kept-asking",
  order: 10,
  title: "The Quiz That Kept Asking",
  competency: "privacy",
  primarySkillId: "privacy.identity",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Which forest animal are you? Six questions in, it stops being about animals.",
  summary:
    "A personality quiz collects the answers people use to prove who they are: a first pet, a first teacher, a street name. Students learn that a fun format can still be a collection form, and that the questions get more personal the further in you go.",
  learningGoals: [
    "Notice when a game starts asking questions a game does not need",
    "Name the facts that grown-ups use to prove who you are",
    "Stop partway through something fun and tell a grown-up, which is the hard part",
  ],
  badge: {
    id: "badge-privacy-4",
    name: "Quiz Quitter",
    blurb: "You stopped a fun thing when it turned nosy, and said so.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "tablet",
      narration: [
        "Indoor recess. Rain is going sideways past the window and the tablet cart is out.",
        "Nia has found a quiz called Which Forest Animal Are You. Half of Room 12 is doing it.",
        "The first question is what is your favourite weather. You pick snow.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      narration: [
        "Question two is whether you would rather climb or swim. Question three is your favourite snack.",
        "This is a good quiz. Theo got badger and he is delighted about it.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "tablet",
      narration: [
        "Question four looks different.",
        "“What was the name of your first pet? What street did you live on when you were small?”",
      ],
      prompt: "What do you notice?",
      choices: [
        {
          id: "c1",
          label: "A forest animal quiz does not need to know my old street",
          feedback: {
            tone: "strong",
            headline: "You spotted the turn",
            body: "The first three questions were about you having fun. These two are about you. A quiz can change what it is halfway through, and this one just did.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "These are harder questions than the other ones",
          feedback: {
            tone: "partial",
            headline: "They are harder, and that is a clue",
            body: "You have to dig for these answers, because they are the kind of thing only you would know. That is exactly why somebody might want them.",
          },
          evidence: { skillId: "privacy.identity", result: "developing" },
          next: "s4",
        },
        {
          id: "c3",
          label: "Nothing. It is just being thorough.",
          feedback: {
            tone: "rethink",
            headline: "Read the two questions again",
            body: "Ask yourself what a pet's name has to do with badgers or otters. When the answer is nothing, the question is there for another reason. Have another go.",
            coachNote:
              "The turn from playful to personal is the whole mechanism. Students who miss it here usually catch it when you read the six questions aloud in order.",
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
      speaker: "Ms. Okafor",
      narration: [
        "Ms. Okafor is at the whiteboard. She writes three things and taps them.",
        "“Grown-ups get locked out of things all the time,” she says. “When that happens, somebody asks them a question only they would know. Your first pet. Your first teacher. The street you grew up on.”",
      ],
      next: "s5",
    },
    {
      id: "s5",
      kind: "decision",
      art: "classroom",
      narration: ["The quiz is still open on your tablet, waiting."],
      prompt: "So why does that matter for a quiz about badgers?",
      choices: [
        {
          id: "c1",
          label: "Those answers are like a spare key. A quiz should not hold one.",
          feedback: {
            tone: "strong",
            headline: "That is a very good way to say it",
            body: "A spare key is fine at your grandmother's house and not fine taped to the front door. It is the same key. What changes is who is holding it.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Because somebody could pretend to be me",
          feedback: {
            tone: "strong",
            headline: "Yes, and that is the whole worry",
            body: "Not that a stranger learns you had a hamster called Bug. That they can use it to convince somebody else that they are you.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "It does not really. Quizzes are just for fun.",
          feedback: {
            tone: "rethink",
            headline: "The quiz can be fun and still keep the answers",
            body: "Both things are true at once. You had a nice time with questions one to three, and questions four and five are still being written down somewhere. Pick again.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "decision",
      art: "tablet",
      narration: [
        "There is a Skip button under the question, small and grey.",
        "There is also a big cheerful one that says Keep Going, 80% done!",
        "Eighty per cent is quite far. You would like to know what animal you are.",
      ],
      prompt: "What do you do?",
      choices: [
        {
          id: "c1",
          label: "Close it and go tell Ms. Okafor what it asked for",
          feedback: {
            tone: "strong",
            headline: "That is the move that helps everybody",
            body: "Nobody chose this quiz for Room 12. Once something asks for spare keys, a grown-up needs to know, because it is asking the whole class the same thing.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Close the whole thing, even though you are nearly done",
          feedback: {
            tone: "partial",
            headline: "You kept yourself safe",
            body: "Walking away at eighty per cent is a real thing to be able to do. Telling somebody is the part that helps the twenty-two people still tapping.",
          },
          evidence: { skillId: "privacy.identity", result: "developing" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Tap Skip and carry on to the end",
          feedback: {
            tone: "partial",
            headline: "You kept the two answers, and not much else",
            body: "Skipping one question does not make the rest of it safe. It already showed you what it is after, and it is still going. This one is worth closing, not steering around.",
          },
          evidence: { skillId: "privacy.identity", result: "developing" },
          next: "s7",
        },
        {
          id: "c4",
          label: "Answer them. You are so close to the end.",
          feedback: {
            tone: "rethink",
            headline: "That is what the big button is for",
            body: "Eighty per cent done, one more step, nearly there. All of that is there to make stopping feel like losing. Have another go.",
            coachNote:
              "Two things to name here. The sunk-cost pull of the eighty-per-cent button, which children feel strongly and rarely have a word for. And the belief that skipping one field makes a service safe — students who pick Skip usually think they have solved it.",
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
        "Ms. Okafor turns the quiz off for the whole class while she looks into who made it.",
        "Theo is briefly outraged, on the grounds that he was going to be a badger.",
        "She adds a line under the trusted grown-ups list: some questions are spare keys.",
      ],
      wrapUp: [
        "A quiz can start out fun and turn nosy partway through.",
        "First pet, first teacher, old street: those are spare keys, not fun facts.",
        "When something asks for a spare key, close it and tell a grown-up you trust.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission is about security questions, which children meet years before they own an account that uses them. The quiz is genuinely fun for three questions, which is the point: the format does not change when the purpose does. The default it teaches is stop and tell. Once a tool nobody approved asks for account-recovery facts, closing it and telling an adult is the answer, and steering around the question by skipping it is not.",
    lookFor: [
      "Students who judge a request by how the app feels rather than by what it asked",
      "Students who treat skipping a field as having solved it",
      "Whether anyone names the sunk-cost pull of the eighty-per-cent button",
      "Students who can explain why a pet's name matters more than a favourite colour",
    ],
    questions: [
      "Which questions were about the quiz, and which were about you?",
      "Why does a grown-up get asked about their first pet when they are locked out?",
      "The button said eighty per cent done. Why put that there?",
      "Somebody skips the two questions and finishes the quiz. Are they safe now?",
      "What is a spare key you would never tape to a front door?",
    ],
    misconceptions: [
      {
        student: "But it was a real quiz, it gave me an animal.",
        response:
          "Agree completely, then separate the two jobs it was doing. The quiz worked. It also collected. Both can be true, and the second one does not need the first to stop.",
      },
      {
        student: "I skipped it, so it is fine now.",
        response:
          "The most likely wrong lesson from this mission, and worth heading off directly. Skipping one field does not change what the tool is for, and it carries on collecting everything else. Once something has shown a collection motive, the decision is about the tool, not about that one question.",
      },
      {
        student: "My pet's name is not a secret, my friends know it.",
        response:
          "Correct, and the risk is not secrecy. It is that a stranger holding that fact and a name can use the pair of them to convince some other service that they are the student.",
      },
    ],
    extension:
      "Unplugged, ten minutes, using cards you hand out already written — students do not write these themselves. Six per table: four ordinary quiz questions such as favourite weather or climb or swim, and two spare keys such as the name of a first pet or the street somebody lived on when they were small. Tables sort them into Fun and Spare Key. Say this once, out loud, before you start: we are sorting the questions, and nobody writes or says their own answers to them. If a student volunteers a real pet name anyway, move on without repeating it.",
  },
  family: {
    summary:
      "We looked at a fun quiz that started asking for things like a first pet's name and an old street. Those are the questions grown-ups get asked when they are locked out of an account, so we called them spare keys. When something asks for one, the answer is to close it and tell a grown-up, not to skip that question and carry on.",
    questions: [
      "What kinds of question are spare keys? Just the kinds — not your answers.",
      "A quiz says you are eighty per cent finished. Why would it tell you that?",
      "If a quiz asks for a spare key, what should you do about the whole quiz?",
    ],
    tryAtHome:
      "Next time a quiz or a game asks something personal, read the question out loud together and ask what it has to do with the game.",
    familyRule: "Some questions are spare keys. We do not hand those out.",
  },
};

export const theStudyGroup: Mission = {
  id: "m-privacy-5",
  slug: "the-study-group",
  order: 19,
  title: "The Study Group",
  competency: "privacy",
  primarySkillId: "privacy.identity",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Everyone in the reading group is friendly. One question is about your bus.",
  summary:
    "A moderated class study space mixes a helper tool with real classmates. Students practise the difference between facts about them and facts about where they will be, and learn why a routine needs extra care: a school, a route and a finishing time together make a place somebody could wait.",
  learningGoals: [
    "Tell the difference between a fact about you and a fact about where you will be",
    "Notice that a routine puts a place and a time together",
    "Answer a friendly question without answering the risky part of it",
  ],
  badge: {
    id: "badge-privacy-5",
    name: "Route Keeper",
    blurb: "You kept your comings and goings to yourself.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Room 12 has a reading group that meets on the tablets on Thursdays.",
        "There is a helper called AskMe that suggests words, and there are eight actual children typing in a shared list.",
        "This week you are all reading the same book about a lighthouse.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      narration: [
        "Somebody called J has joined from another class. J likes the lighthouse book too and knows a lot about lighthouses.",
        "J asks what everybody's favourite part was. That is easy. You say the storm chapter.",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "tablet",
      narration: [
        "A few minutes later J asks something else.",
        "“Which bus do you take home? I think we might be on the same one.”",
      ],
      prompt: "What is different about this question?",
      choices: [
        {
          id: "c1",
          label: "It is about where I will be, not about me",
          feedback: {
            tone: "strong",
            headline: "That is exactly the difference",
            body: "Your favourite chapter is a fact about you. Your bus is a fact about where you stand, at the same time, every single day. Those are not the same kind of thing.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "I do not actually know who J is",
          feedback: {
            tone: "strong",
            headline: "Also worth noticing",
            body: "J might be exactly who J says. You still do not know, and a question about your route is not one you answer while you are unsure.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c3",
          label: "Nothing. It is a friendly question.",
          feedback: {
            tone: "rethink",
            headline: "It is friendly, and it is still about your route",
            body: "Friendly and safe are different things, and we have met that before. Look at what the question is actually asking for. Try again.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "tablet",
      narration: [
        "Theo has already typed the number of his bus. He looks at you and shrugs. “It is just a bus.”",
      ],
      prompt: "What do you type?",
      choices: [
        {
          id: "c1",
          label: "“I am not going to say. What was your favourite part?”",
          feedback: {
            tone: "strong",
            headline: "You said no and kept the conversation",
            body: "You did not have to be rude or make a scene. You declined the risky half and handed back the friendly half. That is a real skill and grown-ups are bad at it.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Nothing at all. Just leave the question sitting there.",
          feedback: {
            tone: "partial",
            headline: "Silence works",
            body: "You are never obliged to answer. It is a little easier on you, though, if you have a sentence ready, because otherwise the question just sits there feeling awkward.",
          },
          evidence: { skillId: "privacy.identity", result: "developing" },
          next: "s5",
        },
        {
          id: "c3",
          label: "The bus number, since Theo already said it",
          feedback: {
            tone: "rethink",
            headline: "Theo answering does not answer for you",
            body: "His route is his to give away. Yours is still yours. Two children on the same bus is twice as useful to somebody as one. Have another go.",
            coachNote:
              "The peer-precedent move is the strongest pull in this mission. Watch who follows Theo without pausing.",
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
        "At the end of the session you are walking out with Theo.",
        "He is not worried. You are not sure whether this counts as a thing to tell somebody about.",
      ],
      prompt: "Does this count?",
      choices: [
        {
          id: "c1",
          label: "Tell Ms. Okafor, and mention that Theo answered",
          feedback: {
            tone: "strong",
            headline: "You covered your friend too",
            body: "Ms. Okafor can find out who J is, which is a thing a grown-up can do and you cannot. And she now knows Theo's route is out there.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Tell Ms. Okafor about the question, but leave Theo out of it",
          feedback: {
            tone: "partial",
            headline: "Good, and half the picture",
            body: "You are being loyal, which is decent of you. But Theo is the one who actually gave something away, and leaving that out is the part she most needs.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Say nothing. Nobody got hurt.",
          feedback: {
            tone: "rethink",
            headline: "Nothing has happened yet",
            body: "That is the moment to say something, not the moment to wait. Telling early is cheap. Telling late is not. Try again.",
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
        "Ms. Okafor thanks you and closes the shared list while she checks it.",
        "Then she asks the room a question, in the way she does when she wants everybody thinking.",
      ],
      prompt: "Which one of these tells somebody exactly where to find you, and when?",
      choices: [
        {
          id: "c1",
          label: "Where you are at the same time every day",
          feedback: {
            tone: "strong",
            headline: "That is the one with a place and a time in it",
            body: "Your school, your route and your finishing time add up to a spot and an hour to be there. Bus stops, walking routes, practice nights. That is why routines get extra care.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "What you look like",
          feedback: {
            tone: "partial",
            headline: "Yours to keep, and it does not say where",
            body: "A picture of you is private and stays private. On its own it does not say where to wait. Pictures often carry a place inside them though, which is a whole mission of its own.",
          },
          evidence: { skillId: "privacy.identity", result: "developing" },
          next: "s7",
        },
        {
          id: "c3",
          label: "What you like reading",
          feedback: {
            tone: "rethink",
            headline: "That one is fine to share here",
            body: "Books are a lovely thing to have in common with somebody. Nobody can wait for you at a book. Look for the answer that gives somebody a place and a time.",
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
        "The reading group runs again the next Thursday, with the shared list checked and Mr. Ruiz sitting in.",
        "Everybody still argues about the storm chapter.",
      ],
      wrapUp: [
        "A fact about you is different from a fact about where you will be.",
        "Your school, your route and your finishing time add up to a place somebody could wait.",
        "Your photos, your face and the rest of your details are still yours to keep.",
        "You can say no to half a question and still be friendly.",
      ],
    },
  ],
  guide: {
    setup:
      "The distinction here is subtle and worth slowing down for: children are taught not to share their address, and then share their bus route without blinking. Both answer the same question. Nothing frightening happens in this mission and J is never revealed to be anyone; the lesson is the pause, not a villain. Handle the last scene with care: the point is that a routine puts a place and a time together, not that other details are safe by comparison. A child who leaves thinking a photo is fine as long as they hold back the bus has learned the opposite of the photo and camera missions.",
    lookFor: [
      "Students who protect an address but volunteer a routine",
      "Whether anyone follows Theo's answer without pausing",
      "Students who report the question but protect a friend by omission",
      "Students who conclude other details are fine to share as long as they hold back a route",
    ],
    questions: [
      "Which of J's questions were fine, and which one was not?",
      "What is the difference between a fact about you and a fact about where you are?",
      "Theo answered first. Did that change anything about your answer?",
      "What could you say that is friendly and still says no?",
      "What do your school, your route and your finishing time add up to together?",
    ],
    misconceptions: [
      {
        student: "It is only a bus number.",
        response:
          "Push on the word only. A bus number plus a school plus a finishing time is a place and a time. Build it up out loud and let the class see it assemble.",
      },
      {
        student: "So photos are fine, as long as I do not say my bus.",
        response:
          "Head this one off before it settles. Nothing in this mission makes a photo safe to hand out. Routines get named here because they carry a time as well as a place; everything else is still private.",
      },
      {
        student: "J was probably just a kid.",
        response:
          "Probably true, and irrelevant to the decision. The move is the same whether or not J is who they say, which is why it is a good move.",
      },
    ],
    extension:
      "As a class, list everything about a normal Tuesday that is a routine rather than a fact. Ask which ones a stranger could learn from watching the school gate, and which ones would have to be told.",
  },
  family: {
    summary:
      "We practised the difference between a fact about you, like your favourite book, and a fact about where you will be, like which bus you take. Both kinds can be private. The second kind is the one that tells somebody where to wait, and when.",
    questions: [
      "What is the difference between telling someone your favourite food and telling them your bus?",
      "Somebody friendly online asks where you wait after school. What could you say?",
      "If your friend answered first, does that change what you should do?",
    ],
    tryAtHome:
      "Name your family's routines out loud together — the same park on Saturdays, the same walk home. Talk about which ones you would not post.",
    familyRule: "We do not tell people where we will be.",
  },
};

export const theClassPhoto: Mission = {
  id: "m-privacy-6",
  slug: "the-class-photo",
  order: 13,
  title: "The Class Photo",
  competency: "privacy",
  primarySkillId: "privacy.media",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Room 12 is going on the school website. Ravi does not want to be in it.",
  summary:
    "A class photo is about to be published. Students practise reading a picture for what it reveals, meet the harder idea that one person can decline something the group wants, and learn that agreeing to one audience is not agreeing to every audience.",
  learningGoals: [
    "Read a photo for what it shows besides faces",
    "Understand that being in a picture is a choice each person makes",
    "Support somebody who says no, even when the group is keen",
    "Know that permission is for one place and one audience, and does not travel",
  ],
  badge: {
    id: "badge-privacy-6",
    name: "Fair Framer",
    blurb: "You made sure everyone in the picture agreed to be there.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "The school website is getting a page about the hundredth day of school, and Room 12 gets a photo on it.",
        "Everybody is arranged on the carpet in three rows. Theo is holding up the poster you made.",
        "Ms. Okafor takes four pictures so that somebody is not blinking in all of them.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "She puts the best one on the board so everyone can see it before it goes anywhere.",
        "It is a nice photo. Twenty-three faces, one poster, and the classroom behind you.",
      ],
      prompt: "Before it goes on the website, what is worth checking?",
      choices: [
        {
          id: "c1",
          label: "Whether anything in the room gives away something private",
          feedback: {
            tone: "strong",
            headline: "Good instinct",
            body: "There is a chart on the wall behind row three with everybody's home reading times on it. Small, but readable if you make the picture bigger.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "Whether everybody in it is happy to be in it",
          feedback: {
            tone: "strong",
            headline: "That is the other half",
            body: "A photo of twenty-three people is twenty-three decisions. Most will say yes without thinking. One might not, and that one counts just as much.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Whether everybody looks good in it",
          feedback: {
            tone: "rethink",
            headline: "Kind, but not the risk",
            body: "Nobody being caught mid-sneeze is a nice thing to check. It is not the thing that matters once a picture is on the internet. Try again.",
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
        "Ms. Okafor covers the reading chart with a sheet of paper and takes the photo again.",
        "Then Ravi puts his hand up. He is in the back row and he says, quietly, that he does not want to be on the website.",
        "He does not say why. He looks like he would rather not have said anything at all.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "classroom",
      narration: [
        "There is a pause. Somebody near the front says, “But then we cannot do it.”",
      ],
      prompt: "What is the right thing here?",
      choices: [
        {
          id: "c1",
          label: "Ravi does not have to explain. Take one without him in it.",
          feedback: {
            tone: "strong",
            headline: "No reason required",
            body: "A no about your own picture is a complete answer on its own. Ms. Okafor takes a second photo with Ravi holding the camera, and it is honestly the better one.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Ask Ravi why, so the class can understand",
          feedback: {
            tone: "partial",
            headline: "Kindly meant, and it puts him on the spot",
            body: "Twenty-two people waiting for your reason is a lot of pressure to say yes under. He can tell you if he wants to. He should not have to.",
          },
          evidence: { skillId: "privacy.media", result: "developing" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Use it anyway. He is only one person out of twenty-three.",
          feedback: {
            tone: "rethink",
            headline: "It is his face, not the group's",
            body: "Counting does not work here. Twenty-two yeses do not add up to permission for the twenty-third person. Have another go.",
            coachNote:
              "Some students will have a real reason a photo cannot be published. Never probe. This scene exists so that a no needs no explanation.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "playground",
      narration: [
        "At lunch, Theo has the photo on his tablet and is about to send it to his cousin.",
        "“It is going on the website anyway,” he says.",
      ],
      prompt: "Is that the same thing?",
      choices: [
        {
          id: "c1",
          label: "No. Everybody agreed to the school page, not to his cousin.",
          feedback: {
            tone: "strong",
            headline: "Permission was for one thing",
            body: "Twenty-two people said yes to a page on the school website. Nobody asked them about a cousin. A yes is for a particular place and a particular audience, and it does not stretch to cover the next one.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Tell him to ask Ms. Okafor before he sends either photo",
          feedback: {
            tone: "strong",
            headline: "That is who the question belongs to",
            body: "She is the one who asked everybody in the first place, and she is answerable for where it goes. Neither photo leaves the school without her, and that is not you being difficult.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Check whether Ravi is in the one he is sending",
          feedback: {
            tone: "partial",
            headline: "Worth asking, and not the whole answer",
            body: "Ravi is not the only one who agreed to a school page and nothing else. Take him out and there are still twenty-two people who were never asked about a cousin.",
          },
          evidence: { skillId: "privacy.media", result: "developing" },
          next: "s6",
        },
        {
          id: "c4",
          label: "It is only his cousin, so it is probably fine",
          feedback: {
            tone: "rethink",
            headline: "It starts with one cousin",
            body: "Every picture that goes a long way started with somebody sending it to one person they trusted. Think about who agreed to what. Try again.",
            coachNote:
              "Watch for students who solve this by removing Ravi. That reasoning turns one person's objection into the only thing standing in the way, when in fact nobody in the photo agreed to this.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "ending",
      art: "classroom",
      narration: [
        "The photo that goes up has twenty-two children, one poster, a blank wall, and a slightly blurry thumb in the corner that is Ravi's.",
        "He says the thumb is the best part.",
        "Theo asks Ms. Okafor about his cousin anyway. She says the photo is for the school page, and that his cousin is welcome to look at the page like anybody else.",
      ],
      wrapUp: [
        "A photo shows the room as well as the faces.",
        "Everybody in a picture gets to decide, and nobody has to give a reason.",
        "Saying yes to one place is not saying yes to everywhere.",
        "A school can take its own page down. It cannot gather up copies people already saved.",
      ],
    },
  ],
  guide: {
    setup:
      "Two ideas run together here: what a photograph reveals, and whose permission it needs. The second is harder, because it asks a class to give up something they want for one person who will not explain. Ravi's reason is deliberately never given. Keep the last decision on permission rather than on technology. A school page can be downloaded, screenshotted and passed on like anything else, and taking the page down does not undo those copies; what makes the page different is that the class agreed to it, for that audience, through somebody answerable for it.",
    lookFor: [
      "Students who check faces but not the room",
      "Whether anyone asks Ravi to justify himself",
      "Students who treat a school publication and a personal share as the same act",
      "Students who solve it by removing Ravi, as though he were the only one who had to agree",
    ],
    questions: [
      "What was in the room that should not have been in the photo?",
      "Ravi did not say why. Did he need to?",
      "Twenty-two people said yes. Why was that not enough?",
      "What is different about the school putting a photo up and Theo sending one?",
      "Twenty-two people said yes to the website. What exactly did they say yes to?",
    ],
    misconceptions: [
      {
        student: "He is ruining it for everybody.",
        response:
          "Address this one directly and warmly, because it will be thought even if it is not said. Reframe: the class found a way to have the photo and keep Ravi comfortable, which is a better outcome than either alone.",
      },
      {
        student: "It is already going online, so sending it changes nothing.",
        response:
          "Do not settle this with technology, because the technology does not settle it. A web page can be saved, screenshotted and passed on, and taking the page down does not collect those copies back. What changes is permission: the class agreed to a school page, for that audience, through a teacher who is answerable for it. Nobody agreed to a cousin's phone.",
      },
      {
        student: "Ravi is not in this one, so I can send it.",
        response:
          "Catch this one, because it sounds like the lesson and is the opposite of it. Ravi's no was his own. The other twenty-two agreed to a school page and were never asked about anything else. Removing the person who objected does not create permission from the people who did not.",
      },
    ],
    extension:
      "Take a photo of your own classroom, project it, and have the class hunt the background for anything they would not publish. Names on trays, timetables, a rota with home details. They will find more than you expect.",
  },
  family: {
    summary:
      "We looked at a class photo before it was published and practised three things: reading the background for private information, remembering that every person in a picture gets to decide about their own face, and noticing that agreeing to one place is not agreeing to everywhere. A photo cleared for a school page has not been cleared for a group chat.",
    questions: [
      "What can somebody learn from the background of a photo?",
      "If one person in a picture says no, what should happen?",
      "A photo was fine for one place. Does that make it fine everywhere?",
    ],
    tryAtHome:
      "Before the next family photo goes anywhere, ask everyone in it. Let the youngest person's no count exactly as much as anyone else's.",
    familyRule: "Everyone in the picture gets a say, and no reason is needed.",
  },
};

export const whatTheCameraSees: Mission = {
  id: "m-privacy-7",
  slug: "what-the-camera-sees",
  order: 22,
  title: "What the Camera Sees",
  competency: "privacy",
  primarySkillId: "privacy.media",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "A game wants to show your room to everyone playing. Your room says a lot.",
  summary:
    "A game reuses a camera permission for a new live feature. Students practise auditing what a space reveals, learn to tell a preview from a live stream by what the screen says, and meet the rule that once a stream is live each new moment reaches viewers before it can be reviewed.",
  learningGoals: [
    "List what a bedroom or kitchen reveals about a family",
    "Tell a preview apart from a live stream by reading what the screen says",
    "Understand that once a stream is live, each new moment goes out before you can check it",
    "Turn a feature off rather than trying to manage it",
  ],
  badge: {
    id: "badge-privacy-7",
    name: "Room Reader",
    blurb: "You looked at your room the way a stranger would.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "bedroom-night",
      narration: [
        "Saturday morning. The game is called Star Barn and you build things in it with people from anywhere.",
        "You gave it the camera months ago, for taking a picture of your barn to put on your profile.",
        "There is an update. A banner says Show Your Space! Let your friends see where you build!",
        "It does not ask you anything. It already has the camera, so it just starts using it.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "bedroom-night",
      narration: [
        "A window opens in the corner with your room in it. Underneath it says PREVIEW — ONLY YOU CAN SEE THIS.",
        "Next to the window there is a button that says GO LIVE.",
      ],
      prompt: "Before you touch anything, look at the picture. What is in there?",
      choices: [
        {
          id: "c1",
          label: "The window, and you can see the street through it",
          feedback: {
            tone: "strong",
            headline: "You checked the edges",
            body: "A window can show a tree, a bit of fence, the house opposite. Somebody who already knows the area could work out which street from very little.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s2b",
        },
        {
          id: "c2",
          label: "The school jumper on the back of the chair, with the badge on it",
          feedback: {
            tone: "strong",
            headline: "That badge is a name and a town",
            body: "A school badge tells somebody which school. Which school tells them which town, and where you are every weekday morning.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s2b",
        },
        {
          id: "c3",
          label: "Just me and a wall. There is nothing in it.",
          feedback: {
            tone: "rethink",
            headline: "Look properly, right to the corners",
            body: "There is more in the picture than you think. Rooms are full of things you stopped noticing because you see them every day. Have another go.",
            coachNote:
              "Habituation is the real difficulty. Children genuinely cannot see their own rooms. The unplugged extension fixes this faster than any explaining.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s2b",
      kind: "decision",
      art: "bedroom-night",
      narration: [
        "You point the tablet at a blank bit of wall instead. The little window follows.",
        "Theo is playing too. He types: I cannot see your room. Have you not gone live yet?",
      ],
      prompt: "What does that tell you?",
      choices: [
        {
          id: "c1",
          label: "Nobody has seen it yet. The preview is only on my screen.",
          feedback: {
            tone: "strong",
            headline: "That is worth being sure about",
            body: "A picture of you on your own screen is not the same as a picture other people are getting. The tablet is showing you what it would send. It has not sent it.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "It has not started, so the choice is still mine",
          feedback: {
            tone: "partial",
            headline: "And this is the moment it is cheapest",
            body: "Right now deciding costs you nothing at all. Once that button is pressed, the deciding is over for every moment after it.",
          },
          evidence: { skillId: "privacy.media", result: "developing" },
          next: "s3",
        },
        {
          id: "c3",
          label: "If I can see it, everybody can see it",
          feedback: {
            tone: "rethink",
            headline: "Not yet, and it is worth being exact",
            body: "Being nervous of every camera is not the same as knowing what one is doing. Read what it says under the window again. Try again.",
            coachNote:
              "Do not let this settle as every camera you can see yourself in is already public. A child who believes that has no way to tell a safe screen from a live one, and will guess.",
          },
          next: "s2b",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "bedroom-night",
      narration: [
        "You press GO LIVE to see what happens. PREVIEW changes to LIVE, and next to it: 8 PLAYERS CAN SEE THIS NOW.",
        "Theo types: nice wall.",
        "Then your little brother comes in to ask something, walks right through the shot, and stops to wave at the camera.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "bedroom-night",
      narration: [
        "He is in it. He did not agree to anything. He does not even know the game exists.",
        "By the time you spot him on your own screen, eight people have already got him on theirs.",
      ],
      prompt: "What does that tell you about being live?",
      choices: [
        {
          id: "c1",
          label: "Once it is live, each moment goes out before I can check it",
          feedback: {
            tone: "strong",
            headline: "That is the whole problem",
            body: "A photo you can look at, think about and delete. A live window has already sent this second while you are still looking at it. There is no draft.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "I would have to keep watching the background the whole time",
          feedback: {
            tone: "partial",
            headline: "True, and that is a lot of work",
            body: "You would be guarding a camera instead of playing a game. When keeping something safe takes constant attention, that is usually a sign to turn it off.",
          },
          evidence: { skillId: "privacy.media", result: "developing" },
          next: "s5",
        },
        {
          id: "c3",
          label: "I should just tell him to stay out of my room",
          feedback: {
            tone: "rethink",
            headline: "He is four",
            body: "That is not going to hold, and it is not really his job. Think about the feature rather than about your brother. Try again.",
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
        "In the settings there is a switch called Show Your Space, and it is on.",
        "Turning it off means the little window goes away. The rest of the game works exactly the same.",
      ],
      prompt: "What do you do?",
      choices: [
        {
          id: "c1",
          label: "Turn it off, and tell a grown-up the game added it",
          feedback: {
            tone: "strong",
            headline: "Off, and reported",
            body: "You said yes to the camera once, for a photo of your barn. The update used that yes for something else without asking. A grown-up should know, because it will have done that to other children too.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Turn it off and carry on playing",
          feedback: {
            tone: "partial",
            headline: "You are safe, and quiet",
            body: "Your camera is off, which is the main thing. The update is still switched on for everybody who did not notice it.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Leave it on but point the tablet at the ceiling",
          feedback: {
            tone: "rethink",
            headline: "You are still guarding a camera",
            body: "One knock and it is pointing at the room again. A switch that is off does not need watching. Have another go.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "ending",
      art: "kitchen",
      narration: [
        "The barn still gets built. Nobody who plays Star Barn learns anything about your street, your school or your brother.",
        "Your brother is a bit disappointed. He liked waving.",
      ],
      wrapUp: [
        "Rooms are full of things you stopped noticing.",
        "A preview on your own screen is not the same as other people getting it. Read what the screen says.",
        "Once it is live, each new moment reaches people before you can check it.",
        "If keeping a feature safe takes constant watching, turn it off instead.",
      ],
    },
  ],
  guide: {
    setup:
      "The new idea here is that going live removes the pause. Children handle photographs reasonably well by this age because a photo can be looked at first; streaming takes that away, and the mission is built so they discover it rather than being told. Two things are worth being exact about, because the vague version of this lesson does harm. First, seeing yourself on a screen does not mean anybody else is getting it — the mission labels PREVIEW and LIVE so the class learns to look rather than to guess, and a child who believes every self-view is already public has no way to tell one from the other. Second, the game never asks for the camera in this story: it was given months earlier for photographs, and the update quietly reuses it. That reuse is worth naming out loud.",
    lookFor: [
      "Students who cannot see their own room, which is normal and not carelessness",
      "Whether anyone names the difference between a photo and a live feed",
      "Students who manage a risky feature instead of switching it off",
      "Students who conclude that seeing themselves on screen means it has already gone out",
    ],
    questions: [
      "What is in your room that you have stopped seeing?",
      "What is the difference between a photo and a live camera?",
      "The little brother walked in. Whose fault was that, and what does it tell us?",
      "When is turning something off better than being careful with it?",
      "How could you tell whether it had started sending or not?",
      "Star Barn already had the camera. What had you actually said yes to?",
    ],
    misconceptions: [
      {
        student: "I would just be careful.",
        response:
          "Take it seriously rather than dismissing it, then add time. Careful for five minutes is easy. Careful for an hour, while playing, is not, and the feature runs the whole time.",
      },
      {
        student: "If I can see myself, everyone can see me.",
        response:
          "Correct this one carefully rather than letting it stand as a safe assumption. It is not true, and a child who believes it cannot tell a preview from a stream and will end up guessing. Send them back to the words on the screen: preview, live, how many people. Looking is the skill.",
      },
      {
        student: "Only my friends can see it.",
        response:
          "Ask who counts as a friend in a game with strangers in it, and who else is in the room at their end.",
      },
    ],
    extension:
      "Before school, photograph your empty classroom from where a tablet usually sits. Project that picture — never a live feed, and never a fresh photo with children in it — and have the class list everything a stranger could learn from it. Take a second empty-room picture after they tidy the walls and compare the lists. If your school has a prepared image for this, use that instead. Nothing in this activity turns a camera on in front of the class.",
  },
  family: {
    summary:
      "We looked at a game feature that shows your room to other players. Your child practised reading a room the way a stranger would, learned to check whether a camera window is a preview or already live, and learned that once it is live each new moment reaches people before you can check it.",
    questions: [
      "What could somebody learn from seeing your bedroom?",
      "How can you tell whether a camera is only showing you, or sending to other people?",
      "Who else in our house might walk past a camera without knowing?",
    ],
    tryAtHome:
      "Stand where a tablet usually sits and look at what is behind it. Windows, uniforms, post on the side, a calendar. Move anything you would not show a stranger.",
    familyRule: "Cameras stay off unless we all know they are on.",
  },
};

export const theSleepoverScreen: Mission = {
  id: "m-privacy-8",
  slug: "the-sleepover-screen",
  order: 16,
  title: "The Sleepover Screen",
  competency: "privacy",
  primarySkillId: "privacy.escalate",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "You are at Sam's house. The tablet there does not have the same rules.",
  summary:
    "Students practise the hardest version of stopping and asking: doing it in someone else's home, where the rules are different, the grown-up is not yours, and speaking up feels rude.",
  learningGoals: [
    "Recognise that your rules travel with you",
    "Name a trusted grown-up in a house that is not yours",
    "Say something uncomfortable without accusing anybody",
  ],
  badge: {
    id: "badge-privacy-8",
    name: "Guest Rule Keeper",
    blurb: "You kept your rules in somebody else's house.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "kitchen",
      narration: [
        "You are at Sam's house for the first time. It has smelled like toast since you arrived and there is an enormous grey cat.",
        "Sam's grown-up is called Bea. She has been very nice and has already made you eat two pieces of toast.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "tablet",
      narration: [
        "Sam has a tablet with an app you have not seen before, where you make cartoon people and they talk to you.",
        "Sam's cartoon person asks for your name so it can put you in the story too.",
        "Sam types your name in before you say anything. “It is fine,” he says. “I always do this.”",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "tablet",
      narration: ["The cartoon person waves and says your name back to you."],
      prompt: "This is not your house and these are not your rules. Now what?",
      choices: [
        {
          id: "c1",
          label: "My rules came with me. They do not stay at my house.",
          feedback: {
            tone: "strong",
            headline: "That is the idea this whole mission is about",
            body: "Rules about you belong to you, not to a building. Different house, same rules, and you did not do anything wrong by having them.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Sam is allowed, so probably it is fine here",
          feedback: {
            tone: "partial",
            headline: "Sam's family decides for Sam",
            body: "They really do, and that is not the same as deciding for you. What his family allows is about him. Your name is still yours.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s4",
        },
        {
          id: "c3",
          label: "Say nothing. It would be rude to make a fuss as a guest.",
          feedback: {
            tone: "rethink",
            headline: "Being a guest is not the same as having no rules",
            body: "You can be polite and still say something. Those are not opposites, though they feel like it when you are nine. Try again.",
            coachNote:
              "This is the crux. Children will not risk seeming rude in an unfamiliar house. Give them the sentence in scene five and rehearse it.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "tablet",
      narration: [
        "The app asks another one. “What school do you go to? I will make your classroom!”",
        "Sam's fingers are already on the keys.",
      ],
      prompt: "What do you say to Sam?",
      choices: [
        {
          id: "c1",
          label: "“Do not put my school in. Put in a made-up one.”",
          feedback: {
            tone: "strong",
            headline: "Clear, quick, no argument",
            body: "Sam types Banana Academy and thinks it is the funniest thing that has ever happened. You got what you needed and nobody felt told off.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "“I would rather not do this one. Can we play something else?”",
          feedback: {
            tone: "strong",
            headline: "You can just leave the game",
            body: "You do not have to negotiate every question. Changing the activity is allowed, and Sam's enormous cat is right there being far more interesting.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Let him type it and hope it does not matter",
          feedback: {
            tone: "rethink",
            headline: "You already know this one",
            body: "Your school is where you are every weekday morning. It did not stop being that because you are sitting on somebody else's carpet. Have another go.",
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
        "Bea comes in with a bowl of grapes and asks what you two are up to.",
        "You have a chance to say something. She is not your grown-up, and you have known her for four hours.",
      ],
      prompt: "Do you say anything?",
      choices: [
        {
          id: "c1",
          label: "“The app keeps asking for our names and schools. Is that okay?”",
          feedback: {
            tone: "strong",
            headline: "A question, not a complaint",
            body: "Bea sits down and looks at it properly. She says she had no idea it did that and she is glad you said. Asking is much easier than accusing, and it works better.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Say nothing now, and tell your own grown-up when you get home",
          feedback: {
            tone: "partial",
            headline: "That is a real option and it counts",
            body: "Telling later is much better than never. The only thing you lose is tonight: Sam keeps playing it after you have gone to sleep.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Nothing at all. It is her house and her tablet.",
          feedback: {
            tone: "rethink",
            headline: "She would want to know",
            body: "Almost every grown-up would rather be told about something on a tablet in their own house than not. You are not telling her off. Pick again.",
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
        "On Monday, Ms. Okafor asks how everyone's weekend was, and you end up telling the room about it.",
        "Somebody asks the question you were hoping somebody would ask.",
      ],
      prompt: "“What if the grown-up in the other house says it is fine?”",
      choices: [
        {
          id: "c1",
          label: "Then I still do not have to. I can say no and go home and tell mine.",
          feedback: {
            tone: "strong",
            headline: "Exactly right, and worth saying out loud",
            body: "Another family's yes is not your yes. You are allowed to be the only person in the room with that rule, and you are allowed to tell your own grown-up afterwards.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Then it is probably fine, because a grown-up said so",
          feedback: {
            tone: "rethink",
            headline: "Careful with that one",
            body: "Grown-ups are usually right and they are not automatically right about you. Your own rules still travel with you. Try again.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Then I would ask them to check with my grown-up first",
          feedback: {
            tone: "strong",
            headline: "That is a very grown-up move",
            body: "Putting two adults in touch with each other takes the whole thing off your shoulders, which is where it should not have been anyway.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "classroom",
      narration: [
        "Bea texts your grown-up a photo of the cat asleep on Sam's tablet, which she says is the safest that tablet has been all year.",
      ],
      wrapUp: [
        "Your rules travel with you. They do not stay at your house.",
        "Another family's yes is not your yes.",
        "Asking a question is easier than making an accusation, and it works better.",
      ],
    },
  ],
  guide: {
    setup:
      "The hardest escalation is the one that risks seeming rude in somebody else's home. Bea is warm and reasonable throughout, on purpose: the difficulty is social, not scary. No adult in this mission is a threat.",
    lookFor: [
      "Students who treat house rules as belonging to a building rather than to themselves",
      "Whether anyone can produce a sentence that is polite and still says no",
      "Students who defer entirely to another family's adult",
    ],
    questions: [
      "Whose rules were they, yours or your house's?",
      "What could you say that is polite and still says no?",
      "Sam's family lets him. Why does that not decide it for you?",
      "Who could you tell if the grown-up there said it was fine?",
    ],
    misconceptions: [
      {
        student: "It would be rude.",
        response:
          "Name the fear rather than arguing with it, then hand over the exact wording. A question — is that okay? — is not rude in any house, and children need the sentence more than the principle.",
      },
      {
        student: "Their grown-up said yes, so it is allowed.",
        response:
          "Distinguish permission for their child from permission for yours. Then note that the child can ask the two adults to talk, which removes them from the middle.",
      },
    ],
    extension:
      "Role-play in pairs, thirty seconds each: one is a guest, one is a host with a tablet. The guest has to decline without making it awkward. Swap. Collect the best sentences on a card for the wall.",
  },
  family: {
    summary:
      "We practised keeping our own rules in somebody else's house, which is much harder than keeping them at home. Your child practised a polite sentence that still says no, and asking a question rather than making a complaint.",
    questions: [
      "If you are at a friend's house and they play something you are not allowed, what could you say?",
      "Whose rules are your rules — yours, or our house's?",
      "Who could you tell if a grown-up somewhere else said something was fine?",
    ],
    tryAtHome:
      "Agree one sentence your child can use at any house, and practise it until it is boring. Something like: I am not allowed that one, can we do something else?",
    familyRule: "Our rules come with us wherever we go.",
  },
};

export const itHappenedToTheo: Mission = {
  id: "m-privacy-9",
  slug: "it-happened-to-theo",
  order: 25,
  title: "It Happened to Theo",
  competency: "privacy",
  primarySkillId: "privacy.escalate",
  gradeBand: "2-4",
  estimatedMinutes: 7,
  teaser: "Nothing happened to you. Theo told you something, and now you have to decide.",
  summary:
    "The bystander mission. A friend discloses that an app asked them for personal details and asks you not to tell. Students practise the hardest case: acting for somebody else, without betraying them.",
  learningGoals: [
    "Recognise that a promise to stay quiet is not always one to keep",
    "Bring a friend along rather than reporting behind their back",
    "Say what happened without making a friend feel in trouble",
  ],
  badge: {
    id: "badge-privacy-9",
    name: "Good Backup",
    blurb: "You helped a friend without going behind their back.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "playground",
      narration: [
        "Theo waits until you are at the far end of the playground, by the fence where nobody goes.",
        "He tells you that last night an app asked him where he lives, and he typed it.",
        "Then he says, “Do not tell anyone. Please.”",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "playground",
      narration: [
        "He looks like he has been carrying this since breakfast.",
      ],
      prompt: "What is the first thing you say?",
      choices: [
        {
          id: "c1",
          label: "“You are not in trouble. Thanks for telling me.”",
          feedback: {
            tone: "strong",
            headline: "Start there, always",
            body: "He is expecting to be told off. He is not going to hear anything else until he knows he is not about to be. This one sentence buys you the whole conversation.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "“Why did you do that? You know the rule.”",
          feedback: {
            tone: "rethink",
            headline: "He does know the rule",
            body: "That is why he waited until you were by the fence. Telling him off now teaches him not to tell anybody next time. Have another go.",
            coachNote:
              "The response to a disclosure sets whether there is ever a second one. Worth naming to the whole class.",
          },
          next: "s2",
          retry: true,
        },
        {
          id: "c3",
          label: "“What exactly did it ask for?”",
          feedback: {
            tone: "partial",
            headline: "Useful, and a bit early",
            body: "You will want to know. But he is braced for a telling-off, so getting that out of the way first will get you a much better answer.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      kind: "decision",
      art: "playground",
      narration: [
        "Now the hard bit. He asked you not to tell anyone, and you think somebody needs to know.",
      ],
      prompt: "What do you do about the promise?",
      choices: [
        {
          id: "c1",
          label: "“I think we should tell Ms. Okafor. I will come with you.”",
          feedback: {
            tone: "strong",
            headline: "With him, not about him",
            body: "You are not breaking a promise behind his back. You are asking him to change his mind and offering to stand next to him while he does. That is a completely different thing.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Keep the promise. You said you would.",
          feedback: {
            tone: "rethink",
            headline: "Some promises should not hold",
            body: "A promise to keep quiet about something that could hurt your friend is one of them. You are allowed to say you have changed your mind. Try again.",
          },
          next: "s3",
          retry: true,
        },
        {
          id: "c3",
          label: "Tell Ms. Okafor yourself, quietly, without telling Theo",
          feedback: {
            tone: "partial",
            headline: "Right destination, wrong route",
            body: "Somebody does need to know, so you have that part right. Doing it without telling him means he finds out he cannot trust you, and next time he tells nobody at all.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s4",
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "classroom",
      narration: [
        "Theo says yes, eventually, on the condition that you do the talking for the first bit.",
        "Ms. Okafor is at her desk sorting reading folders.",
      ],
      prompt: "How do you start?",
      choices: [
        {
          id: "c1",
          label: "“Theo wants to tell you about an app. He is not in trouble, is he?”",
          feedback: {
            tone: "strong",
            headline: "You asked the question he was afraid of",
            body: "She says no, of course not, and means it. Now he can talk. You handed it over without handing him over.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "“Theo typed his address into an app last night.”",
          feedback: {
            tone: "partial",
            headline: "Accurate, and it lands like a report",
            body: "Everything you said is true. It just arrives as an announcement about him rather than something he came to say, and he is standing right there.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Wait for Theo to start on his own",
          feedback: {
            tone: "rethink",
            headline: "He asked you to do the first bit",
            body: "That was the deal, and it is the only reason he came. Two children standing silently at a desk is not going to end well. Have another go.",
          },
          next: "s4",
          retry: true,
        },
      ],
    },
    {
      id: "s5",
      kind: "story",
      art: "classroom",
      narration: [
        "Ms. Okafor listens to the whole thing without interrupting once.",
        "Then she asks Theo to show her the app. She tells him he did exactly the right thing by telling somebody.",
        "She says she will speak to his grown-up, so he does not have to do that part on his own.",
        "Theo looks about four kilograms lighter.",
      ],
      next: "s6",
    },
    {
      id: "s6",
      kind: "reflect",
      art: "playground",
      narration: ["Afterwards, out by the fence again, Theo asks you something."],
      prompt: "“Would you have told her even if I said no?”",
      choices: [
        {
          id: "c1",
          label: "“Yes. But I would have told you first that I was going to.”",
          feedback: {
            tone: "strong",
            headline: "Honest, and still a good friend",
            body: "That is the whole answer. Some things get told. Nobody finds out afterwards that you went around them. Theo says fair enough, and means it.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "“No, I would have kept it.”",
          feedback: {
            tone: "rethink",
            headline: "That is not quite true, is it",
            body: "You already decided it needed telling. Saying otherwise now is kind for about a day and then it is a thing you told him that was not so. Try again.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "“I do not know.”",
          feedback: {
            tone: "partial",
            headline: "Safe, and he asked a real question",
            body: "You are allowed not to know things. This one you did know, though, and he is asking because he wants to understand where your line is.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "classroom",
      narration: [
        "The app comes off the school's approved list on Wednesday.",
        "Theo tells you, weeks later and completely out of nowhere, that he is glad you did not just keep it.",
      ],
      wrapUp: [
        "Start with: you are not in trouble.",
        "Go with your friend, not behind them.",
        "Some promises should not be kept, and you say so out loud first.",
      ],
    },
  ],
  guide: {
    setup:
      "Every other privacy mission puts the child in the situation. This one puts them next to it, which is where they will most often actually be. The skill is social rather than technical, and it is the one most likely to matter this term.",
    lookFor: [
      "Students whose first instinct is to tell a friend off",
      "Whether anyone distinguishes going with a friend from going behind them",
      "Students who would keep a harmful promise out of loyalty",
    ],
    questions: [
      "Why did Theo wait until you were by the fence?",
      "What is the difference between telling on somebody and going with them?",
      "Which promises should not be kept?",
      "What would make you tell a friend something like this?",
    ],
    misconceptions: [
      {
        student: "Telling is snitching.",
        response:
          "Meet this head on; it is deeply felt at this age. Distinguish getting somebody into trouble from getting somebody out of it, and note that the route matters as much as the destination.",
      },
      {
        student: "I promised, so I have to.",
        response:
          "Give explicit permission to un-promise. The rule is that you say so first, so nobody is surprised. Children rarely believe they are allowed to do this until an adult says it.",
      },
    ],
    extension:
      "Ask the class to write the first sentence they would want to hear if they had to tell somebody they had done something wrong online. Collect them without names. The list is almost always some version of you are not in trouble.",
  },
  family: {
    summary:
      "We practised what to do when a friend tells you something worrying and asks you not to tell. Your child practised starting with you are not in trouble, and going with a friend to a grown-up instead of behind their back.",
    questions: [
      "If a friend told you something worrying and said do not tell, what would you do?",
      "What is the difference between telling on someone and going with them?",
      "What would you want somebody to say first if you had made a mistake?",
    ],
    tryAtHome:
      "Tell your child, plainly, that they will not be in trouble for telling you about something online. Then say it again in a month, because it only works if they believe it.",
    familyRule: "You will never be in trouble for telling us.",
  },
};

export const privacyMoreMissions = [
  theQuizThatKeptAsking,
  theStudyGroup,
  theClassPhoto,
  whatTheCameraSees,
  theSleepoverScreen,
  itHappenedToTheo,
];
