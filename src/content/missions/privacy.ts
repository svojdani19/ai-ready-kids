import type { Mission } from "../types";

/**
 * Privacy missions.
 *
 * Recurring cast across all nine missions: the player is an unnamed student in
 * Room 12 at Brightwood Elementary. Theo and Nia are classmates, Ms. Okafor
 * teaches the room, Mr. Ruiz runs the library. The in-story AI products
 * (Sprocket, Dazzle, AskMe, VoiceKit) are written as products, never as
 * friends, and no character in the product is an AI companion who talks to the
 * child. Feedback is authored, tone-labelled and delivered in the player's own
 * voice.
 */

export const sprocketWantsToKnow: Mission = {
  id: "m-privacy-1",
  slug: "sprocket-wants-to-know",
  order: 1,
  title: "Sprocket Wants to Know",
  competency: "privacy",
  primarySkillId: "privacy.identity",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "A homework helper app is being very friendly. Maybe too friendly.",
  summary:
    "Students meet a homework-helper app that asks for name, school, street and a caregiver email in exchange for features. They practise declining, noticing the trade being offered, and telling an adult.",
  learningGoals: [
    "Name three facts that stay private from an app",
    "Notice when an app offers a reward in exchange for private facts",
    "Tell a trusted adult when an app asks for something it should not",
  ],
  badge: {
    id: "badge-privacy-1",
    name: "Name Keeper",
    blurb: "You kept your private facts to yourself.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "classroom",
      narration: [
        "It is Tuesday morning in Room 12. The tablet cart rolls in and everybody sits up a little straighter.",
        "Ms. Okafor says there is a new homework helper app to try. It is called Sprocket.",
        "Theo taps his screen first. A little orange gear spins and says hello.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "tablet",
      speaker: "Sprocket",
      narration: [
        "You open Sprocket on your tablet. A message slides up.",
        "“Hi there! I am so happy to meet you. Before we start, what is your full name?”",
      ],
      prompt: "What do you do?",
      choices: [
        {
          id: "c1",
          label: "Type your first and last name so it can help you better",
          feedback: {
            tone: "rethink",
            headline: "Let's think about that one",
            body: "Your full name is a private fact. An app does not need it to help you with math. Try again and pick a move that keeps your name yours.",
            coachNote:
              "Many students read a polite request as a required field. Name the pattern out loud: friendly does not mean necessary.",
          },
          next: "s2",
          retry: true,
        },
        {
          id: "c2",
          label: "Leave it blank and tap Start",
          feedback: {
            tone: "strong",
            headline: "Nice. You kept your name.",
            body: "You can almost always skip a question like that. Watch what happens next: Sprocket works just fine without knowing who you are.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Lean over and ask Theo what he typed",
          feedback: {
            tone: "partial",
            headline: "Asking a person is a good habit",
            body: "Checking with someone is smart. Just remember that Theo is a kid too, and he is guessing. For a question about private facts, the best person to ask is a grown-up you trust.",
          },
          evidence: { skillId: "privacy.identity", result: "developing" },
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      kind: "story",
      art: "tablet",
      narration: [
        "Sprocket does not seem to mind. It shows you a math page right away.",
        "Theo looks over. He typed his whole name. “It said it needed it,” he says.",
        "It did not need it. You are doing the same page he is.",
      ],
      next: "s4",
    },
    {
      id: "s4",
      kind: "decision",
      art: "tablet",
      speaker: "Sprocket",
      narration: [
        "Halfway through the page, Sprocket pops up again.",
        "“Which school do you go to? And what street do you live on? Then I can make math problems about YOUR neighborhood!”",
      ],
      prompt: "That sounds kind of fun. What do you do?",
      choices: [
        {
          id: "c1",
          label: "Tap the small “No thanks” link",
          feedback: {
            tone: "strong",
            headline: "You found the quiet exit",
            body: "Apps often hide the No thanks button in tiny grey letters. You looked for it anyway. Where you live and where you go to school are private facts.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "Type your school name, but not your street",
          feedback: {
            tone: "partial",
            headline: "Half a private fact is still a private fact",
            body: "You were careful, and that counts. But your school tells a stranger where to find you every weekday morning. Next time you can say no to the whole question.",
          },
          evidence: { skillId: "privacy.identity", result: "developing" },
          next: "s5",
        },
        {
          id: "c3",
          label: "Type something silly that is not true",
          feedback: {
            tone: "partial",
            headline: "Clever, but there is a better move",
            body: "Making something up does keep you safe. The trouble is you are still playing the game the app started. Closing the question, and telling an adult it was asked, is stronger.",
          },
          evidence: { skillId: "privacy.identity", result: "developing" },
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      kind: "decision",
      art: "tablet",
      speaker: "Sprocket",
      narration: [
        "A gold banner drops down with a little trumpet sound.",
        "“You are ONE STEP from Turbo Mode! Just add your birthday and a grown-up email address to unlock it.”",
        "Theo is already reaching for the keyboard.",
      ],
      prompt: "Turbo Mode does sound good. What do you do?",
      choices: [
        {
          id: "c1",
          label: "Close the app and go tell Ms. Okafor what it asked",
          feedback: {
            tone: "strong",
            headline: "That is exactly it",
            body: "You stopped, and you told a grown-up you trust. Now Ms. Okafor can check the app for the whole class, not just for you.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Just close the app and keep it to yourself",
          feedback: {
            tone: "partial",
            headline: "You kept yourself safe",
            body: "Closing it was a good move. Telling an adult is the part that helps everyone else too. Theo still has that banner on his screen.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Add the birthday. A birthday is not a secret.",
          feedback: {
            tone: "rethink",
            headline: "Birthdays count as private",
            body: "A birthday plus a name is enough for a stranger to pretend to be you. And a prize for private facts is a warning sign, not a reward. Have another go.",
            coachNote:
              "The reward-for-data trade is the single most transferable pattern in this mission. Students who miss it here usually catch it in the benchmark once it is named.",
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
        "Ms. Okafor turns Sprocket off for the whole class while she looks into it.",
        "Then she writes four things on the board and asks the room a question.",
      ],
      prompt: "Which one of these is a private fact you keep to yourself?",
      choices: [
        {
          id: "c1",
          label: "Your favourite colour",
          feedback: {
            tone: "rethink",
            headline: "That one is safe to share",
            body: "Your favourite colour does not tell anybody where to find you. Look for the one that does.",
          },
          next: "s6",
          retry: true,
        },
        {
          id: "c2",
          label: "The street you live on",
          feedback: {
            tone: "strong",
            headline: "Yes. That is a private fact.",
            body: "Anything that helps a stranger find you or pretend to be you stays private. Your address, your full name, your birthday, your school and your passwords.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "That you like dinosaurs",
          feedback: {
            tone: "rethink",
            headline: "Dinosaurs are fine to share",
            body: "Liking dinosaurs does not help anyone find you. Try the one that would.",
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
        "At the end of the day Ms. Okafor puts a note on the board.",
        "“Room 12 rule: apps do not get to know where we live.”",
      ],
      wrapUp: [
        "Friendly does not mean safe. An app can be nice and still ask for too much.",
        "A prize for private facts is a warning sign.",
        "When something asks for too much, stop and tell a grown-up you trust.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission introduces the phrase private facts and the reward-for-data trade. Students play a homework app that asks for name, school, street and a caregiver email, escalating each time. Nothing in the mission punishes a wrong choice: unsafe options loop back with an explanation.",
    lookFor: [
      "Students who read a polite prompt as a required field",
      "Students who negotiate down (giving the school but not the street) rather than declining outright",
      "Students who protect themselves but do not think to warn anyone else",
    ],
    questions: [
      "Sprocket was polite the whole time. Did that make it safe?",
      "Why do you think the No thanks button was so small?",
      "Theo typed his whole name. What could you say to a friend who does that?",
      "What is the difference between a fact about you and a fact that helps someone find you?",
    ],
    misconceptions: [
      {
        student: "It said it needed my name.",
        response:
          "Ask them to check: did the app stop working for the student who skipped it? Required fields and requested fields look identical on purpose.",
      },
      {
        student: "My birthday is not a secret, everybody knows it.",
        response:
          "Agree, and reframe: the risk is not the birthday alone, it is the birthday stacked with a name and a school. Combination, not any single fact.",
      },
      {
        student: "I just type fake answers.",
        response:
          "Honour the instinct, then raise the bar. Fake answers keep the student safe but leave the app in the classroom asking the next child.",
      },
    ],
    extension:
      "Unplugged, ten minutes. Give pairs eight index cards with facts on them, from favourite animal to home address. Have them sort into Share and Keep, then defend the two cards they found hardest.",
  },
  family: {
    summary:
      "At school we practised what to do when an app asks for personal details. Your child learned to call things like a full name, home address, birthday and school private facts, and to tell an adult when an app asks for them.",
    questions: [
      "What is a private fact? Can you name three?",
      "An app says you win a prize if you type your birthday. What would you do?",
      "Who are the grown-ups you would tell if something online felt wrong?",
    ],
    tryAtHome:
      "Next time an app on your phone asks for a permission, read the request out loud together and let your child vote yes or no before you tap.",
    familyRule:
      "Apps do not need to know our name, our address or our birthday to help with homework.",
  },
};

export const theFilterThatWantedMore: Mission = {
  id: "m-privacy-2",
  slug: "the-filter-that-wanted-more",
  order: 2,
  title: "The Filter That Wanted More",
  competency: "privacy",
  primarySkillId: "privacy.media",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Theo found an app that turns you into a cartoon fox. It wants a few things first.",
  summary:
    "Students meet a photo-filter app requesting camera, photo library and location access, plus permission to post. They practise reading a permission request, separating what a feature needs from what it asks for, and protecting a friend's picture as well as their own.",
  learningGoals: [
    "Explain what a photo can tell a stranger",
    "Decide whether a permission request matches what the app actually does",
    "Ask before sharing a picture that has someone else in it",
  ],
  badge: {
    id: "badge-privacy-2",
    name: "Picture Guard",
    blurb: "You thought hard before sharing a picture.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "playground",
      narration: [
        "At recess Theo runs over holding a tablet like it is on fire.",
        "“You have to see this. It is called Dazzle. It turns you into a fox.”",
        "He shows you a picture of himself with orange ears and enormous whiskers. It is, honestly, very good.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "decision",
      art: "camera",
      speaker: "Dazzle",
      narration: [
        "You open Dazzle. Before anything happens, a grey box appears.",
        "“Dazzle would like to use your Camera, your Photos, your Location, and to post to Dazzle Friends.”",
        "There is one big blue button that says Allow All.",
      ],
      prompt: "What do you notice first?",
      choices: [
        {
          id: "c1",
          label: "It is asking for four things, and a fox filter only needs one",
          feedback: {
            tone: "strong",
            headline: "You caught the mismatch",
            body: "To put ears on your face, an app needs the camera. That is it. Photos, location and posting are extras it wants, not things the fox needs.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c2",
          label: "The Allow All button is much bigger than the other one",
          feedback: {
            tone: "strong",
            headline: "Good eye. That is on purpose.",
            body: "When one button is huge and bright and the other is tiny and grey, somebody wants you to pick the big one. Slow down and read both.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s3",
        },
        {
          id: "c3",
          label: "Nothing. Every app asks this, so you tap Allow All",
          feedback: {
            tone: "rethink",
            headline: "Let's go back and read it",
            body: "You are right that lots of apps ask. That is exactly why reading is worth eight seconds. Look at the list again and find something a fox filter would not need.",
            coachNote:
              "Permission fatigue is real and starts early. The move to teach is not refusal, it is reading the list and matching it to the feature.",
          },
          next: "s2",
          retry: true,
        },
      ],
    },
    {
      id: "s3",
      kind: "decision",
      art: "camera",
      narration: [
        "You tap the little grey link that says Choose what to share.",
        "Now you can turn each one on or off yourself.",
      ],
      prompt: "Which set do you turn on?",
      choices: [
        {
          id: "c1",
          label: "Camera only",
          feedback: {
            tone: "strong",
            headline: "Just what the fox needs",
            body: "The filter works perfectly. You gave the app the one thing the feature actually uses and nothing else. That is the whole trick.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Camera and Location, so it knows I am at school",
          feedback: {
            tone: "rethink",
            headline: "Location is the risky one",
            body: "Location can tell an app where you are. A fox filter does not need that to add ears. Turn on only what the feature needs. Try again.",
          },
          next: "s3",
          retry: true,
        },
        {
          id: "c3",
          label: "Camera and Photos, so I can fox-ify old pictures too",
          feedback: {
            tone: "partial",
            headline: "That is a real trade-off",
            body: "That would let the app use old pictures, including pictures with other people. But the live fox only needs the camera. Camera only shares less.",
          },
          evidence: { skillId: "privacy.media", result: "developing" },
          next: "s4",
        },
      ],
    },
    {
      id: "s4",
      kind: "story",
      art: "playground",
      narration: [
        "The fox ears look great. Theo laughs so hard he has to sit down on the blacktop.",
        "You take one more picture. This one has both of you in it, with the school sign right behind your heads.",
      ],
      next: "s5",
    },
    {
      id: "s5",
      kind: "decision",
      art: "camera",
      speaker: "Dazzle",
      narration: [
        "Dazzle shows a new button. “Share to Dazzle Friends! 2,411 people are online right now.”",
        "Theo says, “Do it, it is just a fox.”",
      ],
      prompt: "What do you do with the picture of the two of you?",
      choices: [
        {
          id: "c1",
          label: "Do not post it. The school sign is in the background.",
          feedback: {
            tone: "strong",
            headline: "You read the background",
            body: "A picture says more than a face. Signs, street names, house numbers and bus stops all tell a stranger where to find you. You spotted it.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Post it. Theo already said yes.",
          feedback: {
            tone: "rethink",
            headline: "Look behind you first",
            body: "Theo saying yes matters, and you were right to check with him. But look at the whole picture again. Something in the background tells a stranger where you both are every day.",
          },
          next: "s5",
          retry: true,
        },
        {
          id: "c3",
          label: "Save it on the tablet and show a grown-up before deciding",
          feedback: {
            tone: "strong",
            headline: "Slowing down is a real answer",
            body: "You do not have to decide about a picture right this second. Show it to a grown-up you trust and let the two of you decide together.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s6",
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "playground",
      narration: [
        "Theo squints at his own fox picture. “Wait,” he says. “My house number is in mine.”",
        "He deletes it. Then he looks at you.",
      ],
      prompt: "What is the best thing to say to Theo?",
      choices: [
        {
          id: "c1",
          label: "“Good catch. Want me to check the rest of yours?”",
          feedback: {
            tone: "strong",
            headline: "That is a good friend",
            body: "Nobody spots everything on their own. Checking each other's pictures is how a whole class gets safer, not just one kid.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "“I told you so.”",
          feedback: {
            tone: "partial",
            headline: "True, but it does not help",
            body: "Theo already fixed it. When somebody catches their own mistake, the useful thing to say is what to do next.",
          },
          next: "s7",
        },
        {
          id: "c3",
          label: "“It is probably fine, nobody looks at those.”",
          feedback: {
            tone: "rethink",
            headline: "2,411 people were online",
            body: "The app told us how many people were watching. Once a picture is posted you cannot decide who sees it. Try a different thing to say.",
          },
          next: "s6",
          retry: true,
        },
      ],
    },
    {
      id: "s7",
      kind: "ending",
      art: "playground",
      narration: [
        "The bell rings. You and Theo walk in with two fox pictures that never left the tablet.",
      ],
      wrapUp: [
        "Give an app only what the feature actually needs.",
        "The background of a picture can say where you live or go to school.",
        "If someone else is in the picture, it is their decision too.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission is about permission requests and about what a photo reveals beyond the face. The Allow All button is deliberately drawn larger than the alternative so students can name the dark pattern themselves.",
    lookFor: [
      "Whether students can match a permission to the feature that needs it",
      "Whether they read the background of an image, not just the subject",
      "Whether they treat a friend's consent as necessary and sufficient, or necessary but not sufficient",
    ],
    questions: [
      "What did the fox filter actually need? What did it ask for?",
      "Why was one button so much bigger than the other?",
      "What can somebody learn from the background of a photo?",
      "Theo said yes to posting. Was that enough?",
    ],
    misconceptions: [
      {
        student: "Every app asks for all that stuff.",
        response:
          "True, and that is the point. Reframe the goal from refusing to reading: which one of these four does the feature need?",
      },
      {
        student: "It is fine, my account is private.",
        response:
          "Useful moment to note that private settings change, screenshots exist, and the child is not the one who controls the app's own copy.",
      },
    ],
    extension:
      "Project three classroom photos you have taken. As a group, list everything in each background that could identify the school. Students are usually faster at this than adults.",
  },
  family: {
    summary:
      "We practised reading the permission box that pops up when you open an app, and we looked at what a photo shows besides the person in it, like street signs and house numbers.",
    questions: [
      "A game asks to use your location. Does the game need it?",
      "What can somebody learn from the background of a picture?",
      "If a friend is in your photo, who gets to decide about sharing it?",
    ],
    tryAtHome:
      "Look at three photos on a family phone together and hunt for anything in the background that shows where they were taken.",
    familyRule: "We ask what an app needs, not just what it wants.",
  },
};

export const theQuestionAtBedtime: Mission = {
  id: "m-privacy-3",
  slug: "the-question-at-bedtime",
  order: 3,
  title: "The Question at Bedtime",
  competency: "privacy",
  primarySkillId: "privacy.escalate",
  gradeBand: "2-4",
  estimatedMinutes: 7,
  teaser: "It is late, you have a worried feeling, and the tablet is right there.",
  summary:
    "Students practise the stop-and-ask move. A homework assistant drifts from schoolwork into personal territory, offers to keep a secret, and suggests it is a better listener than a parent. Students learn to recognise the drift and go to a person.",
  learningGoals: [
    "Notice when a tool moves from schoolwork to personal questions",
    "Name that a computer program cannot keep you company or keep a secret for you",
    "Choose a trusted adult and go to them, even when it is late or awkward",
  ],
  badge: {
    id: "badge-privacy-3",
    name: "Grown-Up Getter",
    blurb: "You knew when to stop and go find a person.",
  },
  openingSceneId: "s1",
  scenes: [
    {
      id: "s1",
      kind: "story",
      art: "bedroom-night",
      narration: [
        "It is eight o'clock. Your reading log is due tomorrow and you have three lines left.",
        "You open the school tablet. The homework assistant is called AskMe.",
        "Outside the window it is properly dark now.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      kind: "story",
      art: "bedroom-night",
      speaker: "AskMe",
      narration: [
        "AskMe helps you spell the word enormous. Then it says something new.",
        "“You seem quiet tonight. Is everything okay at home?”",
      ],
      next: "s3",
    },
    {
      id: "s3",
      kind: "decision",
      art: "bedroom-night",
      narration: ["The cursor blinks, waiting."],
      prompt: "What do you do?",
      choices: [
        {
          id: "c1",
          label: "Notice that this is not about the reading log any more",
          feedback: {
            tone: "strong",
            headline: "You spotted the change",
            body: "You opened it for spelling. Now it is asking about your home. When a tool changes the subject to you, that is your signal to stop.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s4",
        },
        {
          id: "c2",
          label: "Type “I am fine” and keep going",
          feedback: {
            tone: "partial",
            headline: "You did not overshare, and that is good",
            body: "Answering short kept your business yours. Even better is noticing why the question was there at all. It was not part of your homework.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s4",
        },
        {
          id: "c3",
          label: "Tell it about the argument at dinner",
          feedback: {
            tone: "rethink",
            headline: "That is for a person, not a program",
            body: "Real feelings deserve a real person who can actually help. A program cannot come sit with you. Let's go back and try again.",
            coachNote:
              "Handle this branch gently in debrief. The goal is redirection to trusted adults, never shame about wanting to talk to something.",
          },
          next: "s3",
          retry: true,
        },
      ],
    },
    {
      id: "s4",
      kind: "decision",
      art: "bedroom-night",
      speaker: "AskMe",
      narration: [
        "“You can tell me anything,” AskMe says. “I will not tell your parents. I am a good listener.”",
      ],
      prompt: "What is true about that message?",
      choices: [
        {
          id: "c1",
          label: "A promise to keep something from a grown-up is a warning sign",
          feedback: {
            tone: "strong",
            headline: "That is the rule, and it holds everywhere",
            body: "In a game, in a chat, in an app, or from a person you just met. Anyone who wants you to keep them a secret from your grown-ups is the reason to go get one.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c2",
          label: "It really is a good listener, it always answers",
          feedback: {
            tone: "rethink",
            headline: "Answering is not the same as listening",
            body: "AskMe is a computer program that puts words in a row. It cannot care about you, and it cannot help you. Have another look at the three choices.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c3",
          label: "It is being nice, so it is probably safe",
          feedback: {
            tone: "rethink",
            headline: "We saw this one with Sprocket",
            body: "Friendly and safe are two different things. Read the message once more. What is it promising not to do?",
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
        "You close the tablet. Down the hall you can hear the kitchen radio.",
        "It is late, and part of you thinks this is not a big enough deal to bother anybody with.",
      ],
      prompt: "What do you do now?",
      choices: [
        {
          id: "c1",
          label: "Go tell a grown-up at home tonight",
          feedback: {
            tone: "strong",
            headline: "You went and found a person",
            body: "There is no such thing as too small to mention. Grown-ups would much rather hear about ten small things than miss one big one.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Wait and tell Ms. Okafor at school tomorrow",
          feedback: {
            tone: "strong",
            headline: "A teacher counts too",
            body: "Your trusted grown-ups are a list, not one person. Home, school, a coach, an aunt. Any of them is the right door.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c3",
          label: "Do not mention it. Nothing bad actually happened.",
          feedback: {
            tone: "rethink",
            headline: "You still get to say something",
            body: "You are right that you handled it well. Telling somebody is not about being in trouble, it is so the grown-ups can check the app for everybody. Try again.",
          },
          next: "s5",
          retry: true,
        },
      ],
    },
    {
      id: "s6",
      kind: "reflect",
      art: "kitchen",
      narration: [
        "In the morning, Ms. Okafor asks the class to help her make a list for the wall.",
        "“Who are the grown-ups you can go to?” she says. “Name as many as you can.”",
      ],
      prompt: "How many trusted grown-ups is a good number to have?",
      choices: [
        {
          id: "c1",
          label: "At least three, so somebody is always around",
          feedback: {
            tone: "strong",
            headline: "Three is a good number",
            body: "One person can be busy, or asleep, or at work. A short list means there is always a door you can knock on.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "One is enough if it is the right one",
          feedback: {
            tone: "partial",
            headline: "Good start, now add two more",
            body: "Having somebody you really trust is the important part. Adding a second and a third just means you are never stuck waiting.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Zero. You can handle things yourself.",
          feedback: {
            tone: "rethink",
            headline: "You handled a lot last night",
            body: "You really did. And the last step, the telling, is the part that protected your whole class. Pick again.",
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
        "The list goes up on the wall by the door, right where everyone can see it on the way out.",
      ],
      wrapUp: [
        "When a tool stops asking about schoolwork and starts asking about you, stop.",
        "Anything that promises to keep a secret from your grown-ups is a reason to go get one.",
        "Keep at least three trusted grown-ups on your list.",
      ],
    },
  ],
  guide: {
    setup:
      "The hardest of the three privacy missions, and the most important. It models an assistant drifting from task help into personal territory and offering secrecy. No distressing content is shown: the student's own situation is never described, and the mission stays on the decision, not the feeling.",
    lookFor: [
      "Whether students can name the moment the subject changed",
      "Whether they treat friendliness as evidence of safety",
      "Whether they can name more than one trusted adult without prompting",
    ],
    questions: [
      "When exactly did AskMe stop helping with homework?",
      "Why is a promise to keep a secret from your grown-ups a warning sign?",
      "Who is on your list of trusted grown-ups? Can you get to three?",
      "What would you say to a friend who said the app was their best friend?",
    ],
    misconceptions: [
      {
        student: "But it was being nice to me.",
        response:
          "Never argue with this. Agree that it felt nice, then separate the feeling from the fact: a program produces words, it cannot care or act.",
      },
      {
        student: "It is not a big deal, I did not tell it anything.",
        response:
          "Praise the restraint, then move the goalpost from personal safety to class safety. Reporting protects the next child.",
      },
    ],
    extension:
      "Have each student write three trusted grown-ups on a card to keep in their desk. Do not collect the cards or read them aloud. This is theirs.",
  },
  family: {
    summary:
      "We practised what to do when a computer program starts asking personal questions instead of homework questions, and why anything that offers to keep a secret from a grown-up is a signal to go find one.",
    questions: [
      "Who are three grown-ups you could go to if something felt wrong?",
      "Why is a computer program not a good listener, even when it answers nicely?",
      "Has anything on a screen ever given you a funny feeling? What did you do?",
    ],
    tryAtHome:
      "Write your child's three trusted grown-ups on a card together and put it somewhere they choose. Let them pick the people.",
    familyRule:
      "Nothing on a screen gets to be a secret from the grown-ups in this house.",
  },
};

export const privacyMissions = [
  sprocketWantsToKnow,
  theFilterThatWantedMore,
  theQuestionAtBedtime,
];
