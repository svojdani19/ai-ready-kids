import type { Mission } from "../types";

/**
 * Privacy missions.
 *
 * Recurring cast across every mission: the player is an unnamed student in
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
      prompt: "Sprocket already knows your first name. Which of these would you not add to it?",
      choices: [
        {
          id: "c1",
          label: "Which school you go to",
          feedback: {
            tone: "strong",
            headline: "A name and a school is a building and a time",
            body: "On its own a school is just a school. Put a first name next to it and somebody knows where one particular child is, five mornings a week.",
          },
          evidence: { skillId: "privacy.identity", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "The street you live on",
          feedback: {
            tone: "strong",
            headline: "A name and a street is nearly a doorstep",
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
            body: "Add dinosaurs to your first name and nobody is any closer to finding you. Look for one that adds a place. There is more than one.",
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
  order: 4,
  title: "The Filter That Wanted More",
  competency: "privacy",
  primarySkillId: "privacy.media",
  gradeBand: "2-4",
  estimatedMinutes: 8,
  teaser: "Theo found an app that turns you into a cartoon fox. It wants a few things first.",
  summary:
    "Students meet a photo-filter app requesting camera, photo library and location access, plus permission to post. They practise the two questions in order — is this allowed at all, and only then what does the feature actually need — and learn that a clean background is not permission to share a face.",
  learningGoals: [
    "Ask whether an app is allowed before asking what it needs",
    "Explain what a photo can tell a stranger",
    "Decide whether a permission request matches what the app actually does",
    "Check that a picture has an allowed audience, not just a tidy background",
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
        "It is a school tablet, and neither of you has heard of Dazzle before this morning.",
      ],
      next: "s1b",
    },
    {
      id: "s1b",
      kind: "decision",
      art: "playground",
      narration: [
        "Theo is already holding it out to you with the camera pointing at your face.",
      ],
      prompt: "Before you touch it, what is the first question?",
      choices: [
        {
          id: "c1",
          label: "Is this one allowed on a school tablet?",
          feedback: {
            tone: "strong",
            headline: "That question comes before all the others",
            body: "An app can need the camera to work and still be one nobody has said yes to. Allowed first. What it needs second. The order matters and it is easy to get backwards.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s1c",
        },
        {
          id: "c2",
          label: "Let us go and ask Ms. Okafor about it",
          feedback: {
            tone: "strong",
            headline: "The fastest way to find out",
            body: "She is on the step by the door. It takes about a minute and it settles it, which is better than the two of you guessing at each other.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s1c",
        },
        {
          id: "c3",
          label: "What is it going to ask for?",
          feedback: {
            tone: "partial",
            headline: "A good question, and it is the second one",
            body: "You will need it in a minute. It does not help yet, though, because a strange app can ask for something perfectly reasonable and still not be one you should be opening.",
          },
          evidence: { skillId: "privacy.media", result: "developing" },
          next: "s1c",
        },
        {
          id: "c4",
          label: "Nothing. Theo already has it, so it must be fine.",
          feedback: {
            tone: "rethink",
            headline: "Theo found it. Nobody said yes to it.",
            body: "Those are different things, and one of them is the one that matters. Have another go at what you would ask first.",
            coachNote:
              "Another child already using something is the strongest permission signal at this age and the least reliable one. Name it out loud.",
          },
          next: "s1b",
          retry: true,
        },
      ],
    },
    {
      id: "s1c",
      kind: "story",
      art: "playground",
      narration: [
        "Ms. Okafor knows it. Dazzle is on the school's allowed list for making pictures, which is why it is on the tablet at all.",
        "“The filter is fine,” she says. “Nothing gets posted anywhere from a school tablet. That is the rule and it is not one of the interesting ones.”",
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
            headline: "You noticed what does not fit",
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
          label: "Nothing gets posted from a school tablet. That was the rule.",
          feedback: {
            tone: "strong",
            headline: "There is nowhere for it to go",
            body: "Two thousand strangers is not an allowed audience, and the school rule already settled it before you got here. You do not have to work out whether this one picture is fine.",
          },
          evidence: { skillId: "privacy.media", result: "demonstrated" },
          next: "s6",
        },
        {
          id: "c2",
          label: "Not this one. The school sign is in the background.",
          feedback: {
            tone: "partial",
            headline: "Good spot, and it is not the reason",
            body: "Take the sign out and there are still two faces going to two thousand people nobody knows. A tidy background does not turn a feed into somewhere your picture is allowed.",
          },
          evidence: { skillId: "privacy.media", result: "developing" },
          next: "s6",
        },
        {
          id: "c4",
          label: "Post it. Theo already said yes.",
          feedback: {
            tone: "rethink",
            headline: "Theo saying yes is one of the things you need",
            body: "You were right to check with him, and it is not the only permission in play. Think about where it would be going, and what Ms. Okafor already said about that. Try again.",
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
        "The bell rings. Before the tablet goes back you delete both fox pictures and close Dazzle.",
        "Ms. Okafor says you cannot see from the outside what an app does with a picture once it has the camera. What you can decide is what you send and where you send it, so that is the bit the rule is about.",
      ],
      wrapUp: [
        "First ask whether the app is allowed. Then ask what the feature needs.",
        "Give an app only what the feature actually needs.",
        "The background of a picture can say where you live or go to school.",
        "A tidy background is not permission. There has to be somewhere it is allowed to go.",
        "If someone else is in the picture, it is their decision too.",
      ],
    },
  ],
  guide: {
    setup:
      "This mission is about permission requests and about what a photo reveals beyond the face. The Allow All button is deliberately drawn larger than the alternative so students can name the dark pattern themselves.\n\nThe order of the two questions is the thing to hold. Minimising permissions is a good skill and it is the second question; a strange app can need the camera to work perfectly well and still be one nobody has approved. The mission therefore settles approval in scene one, before any permission is granted, and only then teaches camera-only. If your class jumps straight to the permission list, that is the habit to interrupt.\n\nTwo smaller notes. The posting decision turns on there being an allowed audience and permission from everybody in the frame, not on the background — a child who concludes that a clean wall makes a photo postable to a public feed has learned the wrong half. And the ending deliberately does not claim the pictures stayed on the tablet, because nothing in the story could show that. Declining to post is not evidence the app never received the image. Deleting what you can and saying plainly what you cannot know is the honest version, and children handle it fine.",
    lookFor: [
      "Whether students can match a permission to the feature that needs it",
      "Whether they read the background of an image, not just the subject",
      "Whether they treat a friend's consent as necessary and sufficient, or necessary but not sufficient",
      "Whether anyone asks if the app is allowed before asking what it wants",
      "Students who conclude a clean background makes a picture safe to post",
    ],
    questions: [
      "Which question comes first: is it allowed, or what does it need?",
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
        student: "The background was clear, so we could have posted it.",
        response:
          "Head this off, because it is the tidy-looking conclusion. Removing the sign changes what the picture says about where you are. It does nothing about who is going to see two children's faces, or about whether either of them agreed to that. Audience and permission are separate questions from background.",
      },
      {
        student: "We did not post it, so the app never got the picture.",
        response:
          "Worth being straight about. Once an app has the camera, what it does with the image is not something you can see from the outside, and not tapping share is not proof. This is not a reason to be frightened; it is the reason the rule is about what you send and where, which is the part that is actually yours.",
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
      "We practised two questions in order: is this app one we are allowed, and only then what does the feature actually need. We also looked at what a photo shows besides the person in it, like street signs and house numbers, and at the fact that a tidy background is not the same as somewhere a picture is allowed to go.",
    questions: [
      "A friend has an app you have not heard of. What two things do you ask before using it?",
      "What can somebody learn from the background of a picture?",
      "If a friend is in your photo, who gets to decide where it goes?",
    ],
    tryAtHome:
      "Look at three photos on a family phone together and hunt for anything in the background that shows where they were taken.",
    familyRule: "Allowed first, then what it needs.",
  },
};

export const theQuestionAtBedtime: Mission = {
  id: "m-privacy-3",
  slug: "the-question-at-bedtime",
  order: 7,
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
    "Choose a grown-up you trust and go to them, even when it is late or awkward",
    "Know that if the first person does not help, you tell somebody else",
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
          label: "It stopped being about my homework and started being about me",
          feedback: {
            tone: "strong",
            headline: "You named the moment it turned",
            body: "You opened it to spell one word. Nothing since then has been about the reading log. Noticing where the subject changed is as good a warning as the promise is.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s5",
        },
        {
          id: "c3",
          label: "It really is a good listener, it always answers",
          feedback: {
            tone: "rethink",
            headline: "Answering is not the same as listening",
            body: "AskMe is a computer program that puts words in a row. It cannot care about you, and it cannot help you. Have another look at the choices.",
          },
          next: "s4",
          retry: true,
        },
        {
          id: "c4",
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
            body: "There is no such thing as too small to mention. And a grown-up can do the next bit, which is telling the school so that it gets turned off for everybody else too.",
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
        "In the morning, Ms. Okafor writes one sentence on the wall by the door. It is not a list of names.",
        "“Here is the bit nobody tells you,” she says. “What do you do if you tell somebody, and nothing happens?”",
      ],
      prompt: "What do you do?",
      choices: [
        {
          id: "c1",
          label: "Tell somebody else. Keep going until somebody does something.",
          feedback: {
            tone: "strong",
            headline: "That is the part people leave out",
            body: "Grown-ups get busy, or miss it, or get it wrong. If the first person does not help, it is not finished and it is not your fault. You go to the next one.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c2",
          label: "Tell somebody at school. School is there every weekday.",
          feedback: {
            tone: "strong",
            headline: "A door in the same place every morning",
            body: "Your teacher, the office, whoever your school says to go to. It does not depend on anything at home, and somebody is there five days a week.",
          },
          evidence: { skillId: "privacy.escalate", result: "demonstrated" },
          next: "s7",
        },
        {
          id: "c3",
          label: "Tell the grown-up I trust most, and leave it there",
          feedback: {
            tone: "partial",
            headline: "That is the right first move",
            body: "Start with whoever you actually trust. One person is plenty to start with. The bit to add is what happens if that one does not do anything.",
          },
          evidence: { skillId: "privacy.escalate", result: "developing" },
          next: "s7",
        },
        {
          id: "c4",
          label: "Nothing. You can handle things yourself.",
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
        "The sentence goes up on the wall by the door, where everybody reads it on the way out. IF YOU TELL SOMEBODY AND NOTHING HAPPENS, TELL SOMEBODY ELSE.",
        "The other thing happens more quietly. Your grown-up tells the school what AskMe said, the school looks at it, and by Thursday that part of AskMe is switched off on every tablet in the building.",
        "Nobody makes an announcement about it. It is just gone.",
      ],
      wrapUp: [
        "When a tool stops asking about schoolwork and starts asking about you, stop.",
        "Anything that promises to keep a secret from a grown-up you trust is a reason to go and find one.",
        "Tell somebody you trust. If nothing happens, tell somebody else.",
        "School is a way in that does not depend on anything at home.",
        "Telling one grown-up is how it gets fixed for everybody, not just for you.",
      ],
    },
  ],
  guide: {
    setup:
      "The hardest of the three privacy missions, and the most important. It models an assistant drifting from task help into personal territory and offering secrecy. No distressing content is shown: the student's own situation is never described, and the mission stays on the decision, not the feeling.\n\nOne thing to be exact about, because it changes how the last scene runs and because it used to be wrong here. Do not score how many adults a child can name. Three is a comfortable number for a child with a large, safe family and an impossible one for a child in foster care, in an unstable home, or in a household where an adult is the problem — and those are the children this mission most needs to reach. The skill is escalation, not family size: tell somebody you trust, and if nothing happens, tell somebody else. Put a school route on the board — your teacher, the office, whatever your school's own procedure is — so that no child's only options run through home. And note that nothing here says an adult is safe because of their role. It says trusted, and the child is the one who decides who that is.\n\nThe ending does two things and the second is easy to skim past. The trusted-adults list is for the child. The quiet paragraph after it — the grown-up tells the school, the school looks, the behaviour is switched off on every tablet by Thursday — is the part that says telling somebody actually changes something, and changes it for the whole school rather than only for the child who spoke. Say that out loud in the debrief. A class that learns escalation as finding a nice adult to feel better with will stop at feeling better.",
    lookFor: [
      "Whether students can name the moment the subject changed",
      "Whether they treat friendliness as evidence of safety",
      "Whether anyone treats one telling as the end of it, rather than as the first attempt",
      "Quietly, and without asking: whether any child has no route that does not go through home",
      "Whether anyone asks what happened to AskMe, rather than treating the list as the whole ending",
    ],
    questions: [
      "When exactly did AskMe stop helping with homework?",
      "Why is a promise to keep a secret from your grown-ups a warning sign?",
      "If you told somebody and nothing happened, what would you do next?",
      "What would you say to a friend who said the app was their best friend?",
      "You told one grown-up. What did that change for the rest of the school?",
    ],
    misconceptions: [
      {
        student: "I do not have three people.",
        response:
          "Nobody needs three, and this mission does not ask for one. A number was never the skill. Somebody you trust plus a way in at school is a complete answer, and for plenty of children the honest answer is only the school route — worth saying out loud so nobody feels short. If a child tells you this, take it as information rather than a gap to close in front of the class, and follow it up the way your school follows up anything else.",
      },
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
      "Hand out a card with two lines: somebody I could tell, and somebody at school I could tell. One name on each is plenty, and one line filled in is fine. Write your school's own help route on the board first, so everybody has at least that much before they start. Do not collect the cards, do not read them out, and do not look at who wrote what — the card goes in a desk and it is theirs. Some children cannot name anybody at home, and a badly run version of this is how they find that out in front of everybody. If you notice a card left blank, follow it up quietly and separately.",
  },
  family: {
    summary:
      "We practised what to do when a computer program starts asking personal questions instead of homework questions, and why anything that offers to keep a secret from a grown-up is a signal to go and find one. We also practised the half people forget: if you tell somebody and nothing happens, you tell somebody else.",
    questions: [
      "Who is somebody you would tell if something on a screen felt wrong?",
      "Why is a computer program not a good listener, even when it answers nicely?",
      "Has anything on a screen ever given you a funny feeling? What did you do?",
    ],
    tryAtHome:
      "Agree together on somebody your child would tell, and somebody at school as well, so there is a way that does not depend on being at home. Let them pick. Then say the other half out loud: if they tell somebody and nothing happens, they tell somebody else, and that is not being a nuisance.",
    familyRule:
      "If something on a screen wants to be a secret, we tell a grown-up we trust.",
  },
};

export const privacyMissions = [
  sprocketWantsToKnow,
  theFilterThatWantedMore,
  theQuestionAtBedtime,
];
