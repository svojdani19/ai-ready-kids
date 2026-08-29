import type { Mission } from "../types";

/**
 * First Look — early track, grades 1 and 2.
 *
 * Written for a child who has never been told what AI is, and who may be
 * reading at a first-grade level or not yet reading independently at all.
 * Sentences are short enough for a teacher to read aloud one line at a time,
 * and the whole segment is built to be run on a projector with the class
 * answering together before anybody plays it on a device.
 *
 * These sessions record no evidence. A first grader saying "the machine has
 * not met my cat" is a comprehension check, not a demonstrated safety skill,
 * and putting it in the same column as a child declining a request for their
 * street address would make the teacher's roster mean two different things.
 * The three ideas here — what a guessing machine is, where one already sits
 * in an ordinary day, and who is doing the thinking — are what the twenty-seven
 * core missions assume a child already has.
 *
 * Cast is the product's own: Room 12 at Brightwood Elementary, Ms. Okafor
 * teaching, Theo and Nia as classmates. Nothing here is a companion character
 * and no scripted AI ever addresses the child directly.
 */

export const theGuessingMachine: Mission = {
  id: "f-early-1",
  slug: "the-guessing-machine",
  order: 1,
  title: "The Guessing Machine",
  segment: "foundation",
  track: "early",
  competency: "verification",
  primarySkillId: "verify.confidence",
  gradeBand: "1-2",
  estimatedMinutes: 7,
  teaser: "The whole class knows the next word. So does a computer. Find out why.",
  bigIdea: "AI is a computer program that fills in what usually comes next.",
  summary:
    "The first session of the programme, for a class that has not been told what AI is. Students see that they themselves fill in a familiar word from having heard it often, then meet a program that does the same thing from millions of sentences. It closes on the part that matters most later: the program has never met them.",
  learningGoals: [
    "Say in their own words that AI fills in what usually comes next",
    "Explain that it learned that from lots and lots of examples",
    "State that the program has never met them and has no feelings",
  ],
  badge: {
    id: "badge-foundation-early-1",
    name: "Word Filler",
    blurb: "You worked out how a guessing machine guesses.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "It is Monday in Room 12. Ms. Okafor holds up a big card.",
        "The card says: Peanut butter and ____.",
        "Every single hand goes up. Theo is waving both of his.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "Ms. Okafor does not ask for the word yet.",
        "She asks a harder question first.",
      ],
      prompt: "How did the whole class know the next word?",
      choices: [
        {
          id: "c1",
          label: "We have heard those words together lots of times",
          feedback: {
            tone: "strong",
            headline: "That is exactly it",
            body: "You have heard peanut butter and jelly again and again. So your brain filled in the rest.",
            coachNote:
              "This is the whole session in one line. Say it back to the class in their words and keep it on the board.",
          },
          next: "s3",
        },
        {
          id: "c2",
          label: "We read Ms. Okafor's mind",
          feedback: {
            tone: "rethink",
            headline: "Not quite",
            body: "Nobody read a mind. Something else put the word in your head. Think about how many times you have heard it.",
          },
          next: "s2",
          retry: true,
        },
        {
          id: "c3",
          label: "Jelly is the tastiest word",
          feedback: {
            tone: "partial",
            headline: "Fun answer",
            body: "A word being tasty is not why it popped up so fast. You have heard it a lot. That is the reason.",
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
        "Ms. Okafor opens a program on the big screen.",
        "She says it has read millions of sentences.",
        "It fills in what usually comes next. People call it AI.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "tablet",
      narration: [
        "Ms. Okafor types four words and stops.",
        "The cat sat on the ____.",
      ],
      prompt: "What do you think the program will put?",
      choices: [
        {
          id: "c1",
          label: "Mat, because that is what usually comes next",
          feedback: {
            tone: "strong",
            headline: "Good thinking",
            body: "It has seen those words together a lot. So it fills in mat.",
          },
          next: "s5",
        },
        {
          id: "c2",
          label: "It will go and ask a cat",
          feedback: {
            tone: "rethink",
            headline: "There is no cat in there",
            body: "The program is not going anywhere. It is filling in a word. Have another go.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "A word nobody has ever written before",
          feedback: {
            tone: "partial",
            headline: "The other way round",
            body: "It picks words it has seen many times. New words are the ones it puts last.",
          },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "story",
      art: "tablet",
      narration: [
        "The program puts mat. The class cheers.",
        "Then Ms. Okafor says something surprising.",
        "This program has never met a cat. It has never sat on a mat.",
      ],
      next: "s6",
    },
    {
      id: "s6",
      kind: "decision",
      art: "classroom",
      narration: [
        "Nia puts her hand up. She has a question about her own cat.",
        "Her cat is called Pickle.",
      ],
      prompt: "Does the guessing machine know that Nia's cat is called Pickle?",
      choices: [
        {
          id: "c1",
          label: "No. It has never met Nia or her cat",
          feedback: {
            tone: "strong",
            headline: "You have got it",
            body: "It fills in words. It has not met Nia. It does not have feelings about her either.",
          },
          next: "s7",
        },
        {
          id: "c2",
          label: "Yes, if it guesses enough times",
          feedback: {
            tone: "rethink",
            headline: "Guessing more does not help",
            body: "Trying again does not teach it about Nia. It is not learning her by guessing. Have another go.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Only if somebody typed Pickle into it",
          feedback: {
            tone: "partial",
            headline: "Sharp thinking",
            body: "Words get in there when a person puts them in. Hold on to that. It comes back later this year.",
            coachNote:
              "This answer is the bridge to the privacy missions. Name it out loud rather than moving straight on.",
          },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "classroom",
      narration: [
        "At home time Ms. Okafor writes one line on the board.",
        "A guessing machine fills in what usually comes next.",
      ],
      wrapUp: [
        "AI is a computer program that fills in what usually comes next.",
        "It learned that from lots and lots of examples.",
        "It has never met you, and it does not have feelings.",
      ],
    },
  ],
  guide: {
    setup:
      "Run this before anything else in the programme, including the check-in. It assumes no prior knowledge whatsoever and does not use the word artificial once. The move it makes is to start inside the children's own heads: they complete a familiar phrase, notice why they could, and only then meet a program doing the same thing at a much larger scale. Play it on the board first with the class answering together.",
    lookFor: [
      "Children who describe the program as alive, awake or watching",
      "Children who assume it must be right because it was fast",
      "Children who spot that words only get in when a person puts them in",
    ],
    questions: [
      "How did you know the word was jelly?",
      "The program has never met a cat. So how did it put mat?",
      "What is something the guessing machine could not possibly know about you?",
      "Is filling in the next word the same as knowing the answer?",
    ],
    misconceptions: [
      {
        student: "It is alive. It talks.",
        response:
          "Do not argue with the feeling, redirect to evidence. Ask what it would take to know something is alive, and what the program actually did on screen: it put one word after four words.",
      },
      {
        student: "It knows everything.",
        response:
          "Ask what it would have to have read to know your class's lunch order. Nobody wrote that down for it, so there is nothing for it to fill in from.",
      },
      {
        student: "So it is always right.",
        response:
          "Keep this one short at this age. Usually comes next is not the same as true, and the next two sessions build on that rather than settling it here.",
      },
    ],
    extension:
      "Unplugged, ten minutes, no devices. Read out the first half of six very familiar phrases and let the class finish each one together. Then read out three made-up ones nobody has heard before and let them notice that the room goes quiet. Ask why the quiet happened. Use only phrases from books the class has read; do not use anything about a child's own home or family.",
  },
  family: {
    summary:
      "This week we found out what AI actually is. Your child learned that a guessing machine is a computer program that fills in what usually comes next, after reading an enormous number of examples, and that it has never met them.",
    questions: [
      "What does a guessing machine do?",
      "Peanut butter and what? How did you know?",
      "Can a guessing machine know our pet's name?",
    ],
    tryAtHome:
      "Say the first half of a phrase your family says often and let your child finish it. Then ask how they knew.",
    familyRule: "A guessing machine fills in what usually comes next. It has not met us.",
  },
};

export const youHaveMetItAlready: Mission = {
  id: "f-early-2",
  slug: "you-have-met-it-already",
  order: 2,
  title: "You Have Met It Already",
  segment: "foundation",
  track: "early",
  competency: "privacy",
  primarySkillId: "privacy.media",
  gradeBand: "1-2",
  estimatedMinutes: 7,
  teaser: "Theo thinks AI is a robot with red eyes. Room 12 goes looking for the real thing.",
  bigIdea: "You have already met AI. It is inside things you use every day.",
  summary:
    "Second First Look session. Students find out that AI is not a robot in a film but something already inside ordinary things: the keyboard that finishes a word, the app that picks the next video, the sticker that puts ears on a face. They practise noticing which things take in a picture or a voice.",
  learningGoals: [
    "Name three everyday things with a guessing machine inside",
    "Say that AI is not the same as a robot in a film",
    "Notice when a thing is taking in a picture, a voice or words",
  ],
  badge: {
    id: "badge-foundation-early-2",
    name: "Spotter",
    blurb: "You found the guessing machines hiding in an ordinary day.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Theo draws a robot with red eyes and big metal arms.",
        "He says that is AI.",
        "Ms. Okafor smiles. She says there is one in the room right now.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "Everybody looks around. Nobody sees a robot.",
        "Ms. Okafor points at some things in the room instead.",
      ],
      prompt: "Which of these has a guessing machine inside?",
      choices: [
        {
          id: "c1",
          label: "The keyboard that finishes your word before you type it",
          feedback: {
            tone: "strong",
            headline: "Yes, that is one",
            body: "It fills in what usually comes next. That is the same trick from last time.",
          },
          next: "s3",
        },
        {
          id: "c2",
          label: "The video app that picks what plays next",
          feedback: {
            tone: "strong",
            headline: "That is one too",
            body: "It guesses what people like you watched next. Then it plays that.",
          },
          next: "s3",
        },
        {
          id: "c3",
          label: "The coat hook by the door",
          feedback: {
            tone: "rethink",
            headline: "A hook just hangs there",
            body: "A hook does not fill anything in. Look for something that guesses. Have another go.",
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
        "Ms. Okafor writes a list on the board.",
        "The keyboard that finishes words. The app that picks the next video.",
        "The sticker that puts cat ears on your face. The speaker that answers you.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "camera",
      narration: [
        "Nia looks at the list. She notices something.",
        "Two of those need to take something in first.",
      ],
      prompt: "What does the cat ears sticker need before it can work?",
      choices: [
        {
          id: "c1",
          label: "It needs to take in a picture of your face",
          feedback: {
            tone: "strong",
            headline: "You spotted it",
            body: "The camera has to see your face first. Then the ears go on.",
          },
          next: "s5",
        },
        {
          id: "c2",
          label: "Nothing. The ears are just always there",
          feedback: {
            tone: "rethink",
            headline: "Something has to look first",
            body: "The ears land on top of a face. Something had to find the face. Have another go.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "It needs you to hold still",
          feedback: {
            tone: "partial",
            headline: "Close",
            body: "Holding still helps a bit. But the big thing is that a camera is looking at you.",
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
        "Ms. Okafor draws an arrow going in and an arrow going out.",
        "Something goes in. A guess comes out.",
        "For the sticker, a picture of you goes in.",
      ],
      next: "s6",
    },
    {
      id: "s6",
      kind: "decision",
      art: "classroom",
      narration: [
        "Theo has one more question.",
        "He wants to know how you can tell.",
      ],
      prompt: "How can you find out if a thing has a guessing machine inside?",
      choices: [
        {
          id: "c1",
          label: "Ask a grown-up who knows how it was set up",
          feedback: {
            tone: "strong",
            headline: "Best move",
            body: "A grown-up can find out how it was set up. You do not have to work it out alone.",
          },
          next: "s7",
        },
        {
          id: "c2",
          label: "See if it answers you very fast, any time of day",
          feedback: {
            tone: "partial",
            headline: "That is a real clue",
            body: "Fast answers at any hour are worth noticing. A clue is not the same as knowing. Ask as well.",
          },
          next: "s7",
        },
        {
          id: "c3",
          label: "See if it says please and thank you",
          feedback: {
            tone: "rethink",
            headline: "Polite words are easy to put in",
            body: "Anything can be given nice words. That does not tell you what is inside. Have another go.",
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
        "Theo adds one thing to his robot drawing.",
        "He draws a tablet next to it, with a little arrow going in.",
      ],
      wrapUp: [
        "AI is not only a robot in a film. It is inside things you already use.",
        "Something goes in, and a guess comes out.",
        "If you want to know what is inside a thing, ask a grown-up.",
      ],
    },
  ],
  guide: {
    setup:
      "Children arrive with AI meaning a robot from a film, which is the single biggest barrier to them noticing it in the tools they actually touch. This session replaces the robot picture with an in-and-out picture: something goes in, a guess comes out. That in-arrow is what the privacy missions later build on, so draw it and leave it on the wall.",
    lookFor: [
      "Children who only count something as AI if it has a face or a voice",
      "Children who miss that a filter or a sticker needs a camera looking first",
      "Children who treat politeness as proof of anything",
    ],
    questions: [
      "What goes in, and what comes out?",
      "Which things in our classroom take in a picture or a voice?",
      "Theo drew a robot. What would you draw instead now?",
      "Who would you ask if you wanted to know what was inside an app?",
    ],
    misconceptions: [
      {
        student: "It is not AI, it is just my tablet.",
        response:
          "Agree that it is a tablet, then ask what the tablet did. Finishing your word before you typed it is the guessing, whatever the box around it is called.",
      },
      {
        student: "It is watching me all the time.",
        response:
          "Do not confirm and do not dismiss. Say what is actually known: some things take a picture in when you open them, and the way to find out about a particular one is to ask an adult who set it up.",
      },
      {
        student: "The robot in the film is real.",
        response:
          "Separate the two without making anyone wrong. Films invent robots; the guessing machines in this room have no arms and no eyes, and one of them is inside a keyboard.",
      },
    ],
    extension:
      "Unplugged, ten minutes, no devices switched on. Draw two columns on the board: goes in, comes out. Call out six everyday things and fill the columns together as a class. Use only things every child has access to at school. Do not take a photograph, open a camera or a filter, or ask any child to describe the devices in their home.",
  },
  family: {
    summary:
      "This week we found out that AI is not only a robot in a film. Your child learned to notice guessing machines in ordinary things, and that some of them take in a picture or a voice before they work.",
    questions: [
      "What goes in, and what comes out?",
      "Which things at home finish your words for you?",
      "What does the cat ears sticker need before it works?",
    ],
    tryAtHome:
      "Pick one app you both use and work out together what goes in and what comes out. Say the two arrows out loud.",
    familyRule: "Before we use a new thing, we ask what goes in.",
  },
};

export const whoDoesTheThinking: Mission = {
  id: "f-early-3",
  slug: "who-does-the-thinking",
  order: 3,
  title: "Who Does the Thinking?",
  segment: "foundation",
  track: "early",
  competency: "ownership",
  primarySkillId: "own.effort",
  gradeBand: "1-2",
  estimatedMinutes: 7,
  teaser: "Theo's tower gets built for him. It is a very good tower. Something is missing.",
  bigIdea: "A guessing machine can do a job for you. The learning still has to happen in your head.",
  summary:
    "Third and last First Look session for grades 1 and 2. Using a block tower rather than schoolwork, students see the difference between a job being finished and a person having learned something. It closes on the two questions the core programme keeps asking: what is this for, and who is doing the thinking.",
  learningGoals: [
    "Say that a finished job and a learned skill are not the same thing",
    "Name one time it is fine to be given the answer, and one time it is not",
    "State that a person decides when a guessing machine is used",
  ],
  badge: {
    id: "badge-foundation-early-3",
    name: "Own Two Hands",
    blurb: "You worked out where the learning has to happen.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "Room 12 is building block towers. Theo's keeps falling over.",
        "A big kid walks past and builds it for him in ten seconds.",
        "It is a very good tower. Theo stares at it.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "classroom",
      narration: [
        "Ms. Okafor comes over and looks at the tower.",
        "She asks Theo one question.",
      ],
      prompt: "Can Theo build that tower again tomorrow, on his own?",
      choices: [
        {
          id: "c1",
          label: "No, because he did not do it this time",
          feedback: {
            tone: "strong",
            headline: "That is the whole idea",
            body: "The tower got built. The building did not go into Theo's hands.",
          },
          next: "s3",
        },
        {
          id: "c2",
          label: "Yes, because he watched it happen",
          feedback: {
            tone: "partial",
            headline: "Watching helps a bit",
            body: "Watching gives you an idea. Your hands still have to try it. That part has not happened yet.",
          },
          next: "s3",
        },
        {
          id: "c3",
          label: "Yes, because the tower is finished",
          feedback: {
            tone: "rethink",
            headline: "Finished is not the same as learned",
            body: "The tower is done. The question was about Theo tomorrow. Have another go.",
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
        "Ms. Okafor says a guessing machine can do the same thing.",
        "You ask it, and out comes a finished answer.",
        "The job gets done. The learning is a different question.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "desk-test",
      narration: [
        "She writes two jobs on the board.",
        "One is learning to tie your shoes. One is finding out what time the library opens.",
      ],
      prompt: "Which one is fine to just be told the answer to?",
      choices: [
        {
          id: "c1",
          label: "What time the library opens",
          feedback: {
            tone: "strong",
            headline: "Good call",
            body: "You are not trying to learn a skill there. You just need the time.",
          },
          next: "s5",
        },
        {
          id: "c2",
          label: "Tying your shoes",
          feedback: {
            tone: "rethink",
            headline: "Your fingers have to do that one",
            body: "Being told does not tie the shoes. That one only works if you practise. Have another go.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "Both of them, if you are in a hurry",
          feedback: {
            tone: "partial",
            headline: "Being in a hurry is real",
            body: "Sometimes you really are in a hurry. Just notice which one you are giving away.",
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
        "Theo knocks his tower down on purpose.",
        "He says he wants to do it himself this time.",
        "It falls over twice. The third one stands up.",
      ],
      next: "s6",
    },
    {
      id: "s6",
      kind: "decision",
      art: "classroom",
      narration: [
        "Nia asks who decides when the guessing machine gets used.",
        "Ms. Okafor puts the question to the class.",
      ],
      prompt: "Who decides when a guessing machine is used at school?",
      choices: [
        {
          id: "c1",
          label: "The grown-ups here, and then you and me",
          feedback: {
            tone: "strong",
            headline: "Yes",
            body: "School rules come first. After that you still choose, every single time.",
          },
          next: "s7",
        },
        {
          id: "c2",
          label: "The guessing machine decides",
          feedback: {
            tone: "rethink",
            headline: "It does not decide anything",
            body: "It fills in what comes next. It cannot pick when to be used. Have another go.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c3",
          label: "Whoever gets to the tablet first",
          feedback: {
            tone: "partial",
            headline: "That is how it feels sometimes",
            body: "Being first is not the same as being allowed. The rule comes before the race.",
          },
          next: "s7",
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "classroom",
      narration: [
        "Theo's third tower is a bit wobbly.",
        "He built it. He can build it again tomorrow.",
      ],
      wrapUp: [
        "A job can be finished without you learning anything.",
        "Some jobs are fine to be told. Some you have to do yourself.",
        "People decide when a guessing machine gets used. It never decides that.",
      ],
    },
  ],
  guide: {
    setup:
      "The last of the three First Look sessions, and the one that makes the rest of the year make sense. It stays out of schoolwork on purpose: a block tower lets a six or seven year old see the difference between a finished job and a learned skill without anybody feeling accused of cheating. Keep the tower language when you come back to this in the learning-ownership missions.",
    lookFor: [
      "Children who equate a finished piece of work with having learned",
      "Children who cannot yet name a task where being told is perfectly fine",
      "Children who describe the tool as choosing, deciding or wanting",
    ],
    questions: [
      "The tower was finished. What was missing?",
      "Name a job where being told the answer is completely fine.",
      "Name a job where being told would spoil it.",
      "Who decides when we use a guessing machine in this room?",
    ],
    misconceptions: [
      {
        student: "The big kid was being kind.",
        response:
          "Agree, and keep it agreed. Nobody in this story did anything wrong. The question is only about where the building ended up, and it is worth saying that out loud so no child hears an accusation.",
      },
      {
        student: "So using it is cheating.",
        response:
          "Not what the session says, and worth correcting now rather than in year three. Looking up the library opening time is not cheating. The rule is about which jobs you are trying to learn.",
      },
      {
        student: "The machine wants to help me.",
        response:
          "Return to session one. It fills in what usually comes next; it has no wants. Helpful is a thing people do with it, not a thing it feels.",
      },
    ],
    extension:
      "Unplugged, ten minutes, no devices. Sort eight jobs into two hoops on the floor: fine to be told, and have to do it myself. Use school jobs everybody shares, like tying laces, learning a number bond, finding the date, or carrying a tray. Do not ask children to name something they personally find hard.",
  },
  family: {
    summary:
      "This week we talked about the difference between a job being finished and a person having learned something. Your child used a block tower to see it, and practised naming which jobs are fine to be told the answer to.",
    questions: [
      "What is a job you would rather do yourself?",
      "What is a job you are happy to just be told?",
      "The tower was finished. What was missing?",
    ],
    tryAtHome:
      "Next time your child asks you for an answer, ask them first whether this is a telling job or a doing job. Then answer either way.",
    familyRule: "We ask whether this is a telling job or a doing job.",
  },
};

export const earlyFoundations: Mission[] = [
  theGuessingMachine,
  youHaveMetItAlready,
  whoDoesTheThinking,
];
