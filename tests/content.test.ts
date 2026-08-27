import { describe, expect, it } from "vitest";
import { MISSIONS, MISSION_BY_SLUG } from "@/content/missions";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { CERTIFICATION_MODULES, CERTIFICATION_TITLE } from "@/content/certification";
import { ALL_SKILLS, COMPETENCIES, SKILL_BY_ID } from "@/content/competencies";
import { simulateAttempt } from "@/lib/db/seed";
import { validateMission } from "@/lib/domain/missionPath";
import { endSentence } from "@/lib/domain/sentence";

/**
 * The product's central safety claim is that a child cannot reach unauthored
 * content, an unexplained outcome or a dead end. These tests are how that
 * claim stays true as content is edited.
 */
describe("mission content integrity", () => {
  it("ships at least six playable missions across three competencies", () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(MISSIONS.map((m) => m.competency)).size).toBe(3);
    for (const competency of COMPETENCIES) {
      expect(MISSIONS.filter((m) => m.competency === competency.id).length).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(MISSIONS.map((m) => [m.slug, m] as const))(
    "%s is structurally valid",
    (_slug, mission) => {
      expect(validateMission(mission)).toEqual([]);
    },
  );

  it("gives every choice feedback and every unsafe choice another go", () => {
    for (const mission of MISSIONS) {
      for (const scene of mission.scenes) {
        for (const choice of scene.choices ?? []) {
          expect(choice.feedback.headline.length).toBeGreaterThan(0);
          expect(choice.feedback.body.length).toBeGreaterThan(0);
          if (choice.feedback.tone === "rethink") {
            expect(choice.retry).toBe(true);
            expect(choice.evidence).toBeUndefined();
          }
        }
      }
    }
  });

  it("only records evidence against skills that exist", () => {
    for (const mission of MISSIONS) {
      expect(SKILL_BY_ID[mission.primarySkillId]).toBeDefined();
      for (const scene of mission.scenes) {
        for (const choice of scene.choices ?? []) {
          if (choice.evidence) expect(SKILL_BY_ID[choice.evidence.skillId]).toBeDefined();
        }
      }
    }
  });

  it("covers all nine skills with at least one mission each", () => {
    const covered = new Set(
      MISSIONS.flatMap((m) =>
        m.scenes.flatMap((s) => (s.choices ?? []).map((c) => c.evidence?.skillId)),
      ).filter(Boolean),
    );
    for (const skill of ALL_SKILLS) expect(covered.has(skill.id)).toBe(true);
  });

  it("gives every mission a discussion guide and a family take-home", () => {
    for (const mission of MISSIONS) {
      expect(mission.guide.questions.length).toBeGreaterThanOrEqual(3);
      expect(mission.guide.misconceptions.length).toBeGreaterThanOrEqual(2);
      expect(mission.family.questions).toHaveLength(3);
      expect(mission.family.familyRule.length).toBeGreaterThan(10);
    }
  });

  it("uses unique slugs, ids, orders and badges", () => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    expect(unique(MISSIONS.map((m) => m.slug))).toBe(true);
    expect(unique(MISSIONS.map((m) => m.id))).toBe(true);
    expect(unique(MISSIONS.map((m) => m.badge.id))).toBe(true);
    expect(unique(MISSIONS.map((m) => String(m.order)))).toBe(true);
    expect(Object.keys(MISSION_BY_SLUG)).toHaveLength(MISSIONS.length);
  });

  it("keeps all student-facing sentences short enough to read aloud at grade 3", () => {
    for (const mission of MISSIONS) {
      for (const scene of mission.scenes) {
        const studentStrings = [
          ...scene.narration.map((text, index) => ({
            label: `narration ${index + 1}`,
            text,
          })),
          ...(scene.prompt ? [{ label: "prompt", text: scene.prompt }] : []),
          ...(scene.wrapUp ?? []).map((text, index) => ({
            label: `wrap-up ${index + 1}`,
            text,
          })),
          ...(scene.choices ?? []).flatMap((choice) => [
            { label: `choice ${choice.id}`, text: choice.label },
            { label: `feedback headline ${choice.id}`, text: choice.feedback.headline },
            { label: `feedback body ${choice.id}`, text: choice.feedback.body },
          ]),
        ];

        for (const item of studentStrings) {
          const sentences = item.text.split(/(?<=[.?!])\s+/).filter(Boolean);
          for (const sentence of sentences) {
            expect(
              sentence.split(/\s+/).length,
              `${mission.slug}/${scene.id}/${item.label}: "${sentence}"`,
            ).toBeLessThanOrEqual(32);
          }
        }
      }
    }
  });

  it("avoids brittle technical absolutes in student-facing guidance", () => {
    const studentCopy = MISSIONS.flatMap((mission) =>
      mission.scenes.flatMap((scene) => [
        ...scene.narration,
        scene.prompt ?? "",
        ...(scene.wrapUp ?? []),
        ...(scene.choices ?? []).flatMap((choice) => [
          choice.label,
          choice.feedback.headline,
          choice.feedback.body,
        ]),
      ]),
    )
      .join(" ")
      .toLowerCase();

    // These phrases turn a useful habit into a false claim about every app,
    // permission model or AI product. Keep the rule observable and durable.
    for (const overclaim of [
      "ai tools always sound sure",
      "exactly where you are, all day",
      "photos means every picture",
      "if it names no one, no one has checked it",
      "an ai tool usually does not",
      // Ranking one private fact by dismissing another is how a privacy
      // lesson turns into permission to share everything else.
      "most useful thing a stranger",
      "most useful thing for a stranger",
      "is not much use",
      "lead nowhere",
      // Certainty is insufficient evidence, not meaningless evidence.
      "tells you nothing at all",
      // Taking a page down does not recall the copies already made, so the
      // difference between publishing and sharing is never technical recall.
      "nobody can take back a picture",
      // Absence of a local record is not evidence of global absence.
      "real books have shelves",
      "when nothing anywhere has heard of it",
      // A self-view is not automatically a broadcast, and a child who believes
      // it is has no way to tell a preview from a live stream.
      "live video cannot be checked",
      // No source is unfakeable, and a person's account of themselves is
      // context rather than proof.
      "nobody can fake",
      "single most reliable",
      "the strongest thing in most rooms",
      // Missing drafts and sudden improvement are not provenance, and an
      // honest child cannot be relied on to perform a technique on request.
      "real drawings leave a trail",
      "real work leaves a trail",
      "she will show you, happily",
      // A fish has no eyelids, so looking does not settle whether it is asleep.
      "he is always awake",
      // Practice makes it better; how fast is not a promise the content can make.
      "turns into one second",
      "stops being worse surprisingly quickly",
      // First-hand observation wins for a question about right now, not always.
      "first-hand beats forecast, every time",
      // Source quality is not a fixed league table, and an object is not
      // first-hand because it looks official.
      "first-hand beats repeated",
      "the plaque beats the blog",
      "put there by the people who built it",
      "they cannot both be right",
      // A subject's denial is context, not a universal proof about a recording.
      "asking the real person is the check",
      // Spelling is not stored in the hand. The child in that story handwrote
      // every word and still could not spell one.
      "my hand never learned it",
      "when your hand writes them",
      "in their handwriting",
      "messy is the evidence",
      // A calculator executes; it does not verify that you asked the right
      // thing. And a name on a cover is not a credential.
      "calculators do not",
      "the author is a person who studied",
      // Naming three adults guarantees nothing, and some children cannot.
      "at least three trusted",
      "so somebody is always around",
    ]) {
      expect(studentCopy).not.toContain(overclaim);
    }

    expect(studentCopy).not.toMatch(/\bmismatch\b|\bflipped\b|\bcropped\b/);
  });

  it("treats visual artefacts as reasons to pause, not proof of a fake", () => {
    const mission = MISSION_BY_SLUG["the-penguin-on-the-playground"];
    const clueScene = mission.scenes.find((scene) => scene.id === "s3")!;
    const firstHandChoice = clueScene.choices!.find((choice) => choice.id === "c1")!;
    const artefactChoices = clueScene.choices!.filter((choice) =>
      ["c2", "c3"].includes(choice.id),
    );

    expect(firstHandChoice.feedback.tone).toBe("strong");
    expect(firstHandChoice.evidence?.result).toBe("demonstrated");
    for (const choice of artefactChoices) {
      expect(choice.feedback.tone).toBe("partial");
      expect(choice.evidence?.result).toBe("developing");
      expect(choice.feedback.body.toLowerCase()).toMatch(/pause|check/);
      expect(choice.feedback.body.toLowerCase()).not.toMatch(/mismatch|flipped|cropped/);
    }

    // The voice scene used to have a single exit and therefore recorded
    // nothing, under the sole-exit exemption sprint 06 introduced. It now has
    // two genuinely different checks — the person the message claims to come
    // from, and the channel it should have arrived on — so it can record
    // evidence honestly. Both must be there, because asking the subject alone
    // is context for a routine instruction, not a universal proof of a fake.
    const voiceScene = mission.scenes.find((scene) => scene.id === "s5")!;
    const exits = voiceScene.choices!.filter((choice) => !choice.retry);
    expect(exits).toHaveLength(2);
    expect(exits.map((c) => c.label.toLowerCase()).join(" ")).toMatch(/ask ms\. okafor/);
    expect(exits.map((c) => c.label.toLowerCase()).join(" ")).toMatch(/class page/);
    for (const exit of exits) expect(exit.evidence?.result).toBe("demonstrated");
  });

  it("does not turn a coached Mission 5 opening into demonstrated evidence", () => {
    // A weak simulated learner takes the partial exits — the science question
    // at s2, an artefact clue at s3 — and never independently reaches the
    // provenance answer. The mission's primary skill must come out developing.
    // Nothing in the mission may quietly upgrade that.
    const mission = MISSION_BY_SLUG["the-penguin-on-the-playground"];
    const result = simulateAttempt(mission, () => 0.1, 0);

    expect(result.evidence["verify.synthetic"]).toBe("developing");
  });
});

describe("the curriculum does not teach a hazard while teaching the lesson", () => {
  it("makes stopping and telling the strongest move when a tool asks for recovery facts", () => {
    const mission = MISSION_BY_SLUG["the-quiz-that-kept-asking"];
    const decision = mission.scenes.find((scene) => scene.id === "s6")!;

    // The only full-credit answer is closing it and telling an adult. Skipping
    // the field and carrying on is at most partway there, because steering
    // around one question does not change what the tool is collecting.
    const strong = decision.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong).toHaveLength(1);
    expect(strong[0].evidence).toEqual({
      skillId: "privacy.escalate",
      result: "demonstrated",
    });
    expect(strong[0].label.toLowerCase()).toMatch(/tell|ms\. okafor/);

    const carriesOn = decision.choices!.find((c) => /skip/i.test(c.label))!;
    expect(carriesOn.feedback.tone).toBe("partial");
    expect(carriesOn.evidence?.result).toBe("developing");
  });

  it("never asks students to supply their own recovery facts in an activity", () => {
    for (const mission of MISSIONS) {
      const extension = mission.guide.extension.toLowerCase();
      // An activity that has children invent security questions invites them
      // to write down the real answers. Cards are handed out, not authored.
      const invitesOwnAnswers =
        /write .{0,40}(quiz )?questions as a class/.test(extension) ||
        /swap with another table/.test(extension);
      expect(invitesOwnAnswers, `${mission.slug} extension`).toBe(false);
    }

    const quiz = MISSION_BY_SLUG["the-quiz-that-kept-asking"];
    expect(quiz.guide.extension.toLowerCase()).toContain(
      "nobody writes or says their own answers",
    );
    // The family sheet asks for kinds of question, never for examples.
    expect(quiz.family.questions.join(" ").toLowerCase()).toContain("not your answers");
  });
});

describe("the curriculum is accurate about facts and about AI", () => {
  const factOpinion = MISSION_BY_SLUG["the-question-with-no-answer"];
  const studentCopy = factOpinion.scenes
    .flatMap((scene) => [
      ...scene.narration,
      scene.prompt ?? "",
      ...(scene.wrapUp ?? []),
      ...(scene.choices ?? []).flatMap((c) => [c.label, c.feedback.headline, c.feedback.body]),
    ])
    .join(" ")
    .toLowerCase();

  it("defines a fact as checkable against evidence, a rule or a record", () => {
    expect(studentCopy).toContain("calendar rule");
    expect(factOpinion.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ")).toMatch(
      /evidence, a rule or a record/i,
    );
    // February is settled by a rule, never by measuring it.
    expect(studentCopy).not.toContain("settled by somebody measuring");
  });

  it("describes AI output as generated from patterns, not as an average opinion", () => {
    expect(studentCopy).not.toContain("average opinion");
    expect(studentCopy).toMatch(/patterns|words that usually go together/);
    // It has no way to know the child's school unless told. That is different
    // from it being impossible for it to say anything.
    expect(studentCopy).not.toContain("it is impossible");
    expect(studentCopy).toMatch(/never told|nothing to go on|has never been to my school/);
  });
});

describe("one private fact is never ranked by dismissing another", () => {
  const studyGroup = MISSION_BY_SLUG["the-study-group"];

  it("asks which choice gives a place and a time, not which fact is worth most", () => {
    const reflect = studyGroup.scenes.find((scene) => scene.id === "s6")!;
    // The question is a test the child can apply, not a league table of
    // private facts. "Which is most useful to a stranger" invites the
    // inference that everything below the top of the list is fine to hand out.
    expect(reflect.prompt!.toLowerCase()).toMatch(/where to find you|place and a time/);
    expect(reflect.prompt!.toLowerCase()).not.toContain("most useful");

    const routine = reflect.choices!.find((c) => /same time every day/i.test(c.label))!;
    expect(routine.feedback.tone).toBe("strong");
    expect(routine.feedback.body.toLowerCase()).toMatch(/place|spot/);

    // The face option is partway there because it carries no time, and the
    // copy must still say it is the child's to keep.
    const face = reflect.choices!.find((c) => /what you look like/i.test(c.label))!;
    expect(face.feedback.tone).toBe("partial");
    expect(face.feedback.body.toLowerCase()).toMatch(/private|yours/);
  });

  it("states the contextual rule rather than a ranking in the wrap-up", () => {
    const wrapUp = studyGroup.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ");
    // School plus route plus finishing time is what makes a predictable place.
    expect(wrapUp.toLowerCase()).toMatch(/school, your route and your finishing time/);
    // And other details are not left looking safe by comparison.
    expect(wrapUp.toLowerCase()).toMatch(/still yours to keep/);
  });
});

describe("verification is evidence-shaped, not brittle", () => {
  const helper = MISSION_BY_SLUG["the-helper-and-the-teacher"];
  const studentCopy = helper.scenes
    .flatMap((scene) => [
      ...scene.narration,
      scene.prompt ?? "",
      ...(scene.wrapUp ?? []),
      ...(scene.choices ?? []).flatMap((c) => [c.label, c.feedback.headline, c.feedback.body]),
    ])
    .join(" ")
    .toLowerCase();

  it("treats matching examples as evidence and sends the child for a reason", () => {
    // Three matching sums do not prove a method. They earn the question.
    expect(studentCopy).toMatch(/evidence, not proof/);
    expect(studentCopy).not.toMatch(/which means neither one is wrong/);
    // The teacher's number line is what finishes the job.
    expect(studentCopy).toMatch(/why counting up (works|has to work)/);
  });

  it("sends a mismatch to the steps before it condemns the method", () => {
    const test = helper.scenes.find((scene) => scene.id === "s6")!;
    const strong = test.choices!.find((c) => c.feedback.tone === "strong")!;
    expect(strong.feedback.body.toLowerCase()).toMatch(/check your steps/);
    expect(strong.feedback.body.toLowerCase()).not.toMatch(
      /a different answer means one of them is wrong/,
    );
    const wrapUp = helper.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/check your steps before you blame the method/);
  });

  it("says certainty is insufficient rather than meaningless", () => {
    expect(studentCopy).toMatch(/certainty on its own does not settle it/);
    expect(studentCopy).not.toMatch(/tells you nothing at all/);
  });

  it("does not claim an AI tool cannot show working", () => {
    const guide = `${helper.guide.setup} ${helper.guide.misconceptions
      .map((m) => `${m.student} ${m.response}`)
      .join(" ")}`.toLowerCase();
    expect(guide).not.toMatch(/only one of them can show its working/);
    // An AI explanation is a further claim to check, not proof and not absent.
    expect(guide).toMatch(/claim to check|claim, not a proof/);
  });
});

describe("permission is scoped, not recalled", () => {
  const photo = MISSION_BY_SLUG["the-class-photo"];

  it("distinguishes school publication from personal sharing by consent, not by deletability", () => {
    const decision = photo.scenes.find((scene) => scene.id === "s5")!;
    const strong = decision.choices!.filter((c) => c.feedback.tone === "strong");
    const strongCopy = strong
      .map((c) => `${c.label} ${c.feedback.headline} ${c.feedback.body}`)
      .join(" ")
      .toLowerCase();

    // The reason must be who agreed to what, for which audience, through whom.
    expect(strongCopy).toMatch(/agreed|permission|yes to/);
    expect(strongCopy).toMatch(/audience|cousin/);
    // One full-credit route is escalation: the teacher owns the decision.
    expect(strong.some((c) => c.evidence?.skillId === "privacy.escalate")).toBe(true);
    // And never the technical claim that a school page can simply be recalled.
    expect(strongCopy).not.toMatch(/take a page down|can take it down/);
  });

  it("does not let removing the one objector stand in for the other consents", () => {
    const decision = photo.scenes.find((scene) => scene.id === "s5")!;
    const checkRavi = decision.choices!.find((c) => /ravi/i.test(c.label))!;
    // Asking whether Ravi is in it is a good instinct and an incomplete answer:
    // the other twenty-two agreed to a school page and nothing else.
    expect(checkRavi.feedback.tone).toBe("partial");
    expect(checkRavi.evidence?.result).toBe("developing");
    expect(checkRavi.feedback.body.toLowerCase()).toMatch(/twenty-two|never asked/);

    const guide = photo.guide.misconceptions.map((m) => m.student.toLowerCase()).join(" ");
    expect(guide).toMatch(/ravi is not in this one/);
  });

  it("states the limit of taking a page down in the wrap-up", () => {
    const wrapUp = photo.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/saying yes to one place is not saying yes to everywhere/);
    expect(wrapUp).toMatch(/cannot gather up copies/);
  });
});

describe("absence of local evidence is not evidence of absence", () => {
  const book = MISSION_BY_SLUG["the-book-that-was-not-there"];

  it("concludes cannot use it yet from one catalogue, not it does not exist", () => {
    const decision = book.scenes.find((scene) => scene.id === "s3")!;
    const strong = decision.choices!.filter((c) => c.feedback.tone === "strong");
    const strongCopy = strong.map((c) => c.label).join(" ").toLowerCase();
    expect(strongCopy).toMatch(/cannot use it yet/);
    expect(strongCopy).toMatch(/somewhere bigger|one library district/);

    // Declaring it invented on a single district's holdings is the error the
    // mission exists to prevent, so it is a retry here, not full credit.
    const invented = decision.choices!.find((c) => /does not exist|made up/i.test(c.label))!;
    expect(invented.feedback.tone).toBe("rethink");
    expect(invented.retry).toBe(true);
  });

  it("adds an independent wider check before calling the book invented", () => {
    const wider = book.scenes.find((scene) => scene.id === "s3b")!;
    const copy = wider.narration.join(" ").toLowerCase();
    expect(copy).toMatch(/libraries all over the world/);
    expect(copy).toMatch(/publisher records/);
    // Digital formats are named, because "not on a shelf" is not a test.
    expect(copy).toMatch(/ebook/);
    expect(copy).toMatch(/audiobook/);
    expect(copy).toMatch(/nobody wrote this book/);
  });

  it("gives a record rule rather than a shelf rule", () => {
    const studentCopy = book.scenes
      .flatMap((scene) => [
        ...scene.narration,
        scene.prompt ?? "",
        ...(scene.wrapUp ?? []),
        ...(scene.choices ?? []).flatMap((c) => [c.label, c.feedback.headline, c.feedback.body]),
      ])
      .join(" ")
      .toLowerCase();
    expect(studentCopy).toMatch(/leaves a record somewhere/);
    expect(studentCopy).not.toMatch(/if a book is real, you can hold it/);
    const wrapUp = book.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/cannot use it yet, not that it is invented/);
  });

  it("constrains the extension to preverified titles and says what a miss proves", () => {
    const extension = book.guide.extension.toLowerCase();
    expect(extension).toMatch(/confirmed are in your catalogue|already looked up/);
    expect(extension).toMatch(/cannot use it, not that nobody wrote it/);
    // And the family sheet must not claim no library anywhere had it.
    expect(book.family.summary.toLowerCase()).not.toMatch(/no library anywhere/);
  });
});

describe("a preview is not a broadcast", () => {
  const camera = MISSION_BY_SLUG["what-the-camera-sees"];
  const studentCopy = camera.scenes
    .flatMap((scene) => [
      ...scene.narration,
      scene.prompt ?? "",
      ...(scene.wrapUp ?? []),
      ...(scene.choices ?? []).flatMap((c) => [c.label, c.feedback.headline, c.feedback.body]),
    ])
    .join(" ")
    .toLowerCase();

  it("shows permission, preview and live as three distinct states", () => {
    // The camera permission already existed and was given for something else,
    // which is the realistic case and a lesson in its own right.
    expect(studentCopy).toMatch(/gave it the camera months ago/);
    expect(studentCopy).toMatch(/it already has the camera/);
    // Both states are labelled on screen, so the test is observable.
    expect(studentCopy).toMatch(/preview — only you can see this/);
    expect(studentCopy).toMatch(/8 players can see this now/);
  });

  it("teaches that seeing yourself is not proof anyone else is receiving it", () => {
    const preview = camera.scenes.find((scene) => scene.id === "s2b")!;
    const strong = preview.choices!.find((c) => c.feedback.tone === "strong")!;
    expect(strong.label.toLowerCase()).toMatch(/only on my screen|nobody has seen it yet/);
    // "If I can see it, everybody can see it" must loop back, not score.
    const fear = preview.choices!.find((c) => /everybody can see it/i.test(c.label))!;
    expect(fear.feedback.tone).toBe("rethink");
    expect(fear.retry).toBe(true);
  });

  it("phrases the durable rule as each new live moment outrunning review", () => {
    const wrapUp = camera.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/once it is live, each new moment reaches people before you can check it/);
    expect(wrapUp).toMatch(/read what the screen says/);
  });

  it("keeps the classroom activity offline", () => {
    const extension = camera.guide.extension.toLowerCase();
    expect(extension).toMatch(/never a live feed/);
    expect(extension).toMatch(/empty classroom|prepared image/);
    expect(extension).toMatch(/never a fresh photo with children in it/);
  });
});

describe("no person and no familiarity settles whether something happened", () => {
  const video = MISSION_BY_SLUG["the-video-of-mr-ruiz"];

  it("makes out-of-character a pause, and provenance the strong first move", () => {
    const first = video.scenes.find((scene) => scene.id === "s2")!;
    const outOfCharacter = first.choices!.find((c) => /would never do that/i.test(c.label))!;
    // Knowing somebody is a reason to stop and look. It is not a verdict, and
    // teaching a child that an adult they like is exonerated is a safeguarding
    // problem as well as a verification one.
    expect(outOfCharacter.feedback.tone).toBe("partial");
    expect(outOfCharacter.evidence?.result).toBe("developing");
    expect(outOfCharacter.feedback.headline.toLowerCase()).toMatch(/not proof/);

    const provenance = first.choices!.find((c) => /where did this come from/i.test(c.label))!;
    expect(provenance.feedback.tone).toBe("strong");
    expect(provenance.evidence?.result).toBe("demonstrated");
  });

  it("treats the subject's account as context, not as the check", () => {
    const reflect = video.scenes.find((scene) => scene.id === "s6")!;
    const strong = reflect.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong).toHaveLength(1);
    expect(strong[0].label.toLowerCase()).toMatch(/where it came from/);

    const askThem = reflect.choices!.find((c) => /can tell you what happened to them/i.test(c.label))!;
    expect(askThem.feedback.tone).toBe("partial");
    expect(askThem.evidence?.result).toBe("developing");
    expect(askThem.feedback.body.toLowerCase()).toMatch(/faked|not always right about themselves/);
  });

  it("aligns the sign, the wrap-up and the family rule on provenance", () => {
    const studentCopy = video.scenes
      .flatMap((scene) => [...scene.narration, ...(scene.wrapUp ?? [])])
      .join(" ")
      .toLowerCase();
    expect(studentCopy).toMatch(/if it is about a person, find out where it came from/);
    expect(studentCopy).not.toMatch(/if it is about a person, ask the person/);
    expect(video.family.familyRule.toLowerCase()).toMatch(/where it came from/);

    const wrapUp = video.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/out of character is a reason to stop, not a reason to be sure/);
    // A harmful clip goes to an adult who can check it properly.
    expect(wrapUp).toMatch(/goes to a grown-up who can check it properly/);
  });

  it("warns the teacher against the safeguarding failure explicitly", () => {
    const setup = video.guide.setup.toLowerCase();
    expect(setup).toMatch(/never let it teach that a familiar adult is automatically in the clear/);
    expect(setup).toMatch(/speaking up/);
    const students = video.guide.misconceptions.map((m) => m.student.toLowerCase()).join(" ");
    expect(students).toMatch(/he said he did not do it/);
    expect(students).toMatch(/you can tell he would never do that/);
  });
});

describe("provenance is asked of everybody, never inferred from a person", () => {
  const drawing = MISSION_BY_SLUG["the-perfect-drawing"];
  const studentCopy = drawing.scenes
    .flatMap((scene) => [
      ...scene.narration,
      scene.prompt ?? "",
      ...(scene.wrapUp ?? []),
      ...(scene.choices ?? []).flatMap((c) => [c.label, c.feedback.headline, c.feedback.body]),
    ])
    .join(" ")
    .toLowerCase();

  it("establishes the universal process question before the surprising entry", () => {
    // The form asks everybody from the opening scene. It is the starting norm,
    // not a remedy invented after one child was scrutinised.
    const opening = drawing.scenes.find((scene) => scene.id === drawing.openingSceneId)!;
    expect(opening.narration.join(" ").toLowerCase()).toMatch(/how did you make this/);
    expect(opening.narration.join(" ").toLowerCase()).toMatch(/everybody fills in/);
  });

  it("never awards mastery for judging what a classmate is capable of", () => {
    const notice = drawing.scenes.find((scene) => scene.id === "s2")!;
    const strong = notice.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong).toHaveLength(1);
    expect(strong[0].label.toLowerCase()).toMatch(/form asks everybody|nobody has to guess/);

    // A jump is curiosity at most.
    const surprise = notice.choices!.find((c) => /surprising/i.test(c.label))!;
    expect(surprise.feedback.tone).toBe("partial");
    expect(surprise.evidence?.result).toBe("developing");
    expect(surprise.feedback.body.toLowerCase()).toMatch(/practise at home|get suddenly better/);

    // Concluding she could not have drawn it is the retry.
    const verdict = notice.choices!.find((c) => /could not have drawn/i.test(c.label))!;
    expect(verdict.feedback.tone).toBe("rethink");
    expect(verdict.retry).toBe(true);
  });

  it("drops drafts and on-demand demonstration as tests of authorship", () => {
    expect(studentCopy).not.toMatch(/first tries|rough ones|earlier tries/);
    expect(studentCopy).not.toMatch(/leave a trail/);
    const wrapUp = drawing.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/getting suddenly better is a thing people do/);
    expect(wrapUp).toMatch(/nobody has to be guessed about/);
    // Disclosed tool use stays acceptable.
    expect(wrapUp).toMatch(/made by an app is fine/);
  });

  it("tells the teacher why sudden improvement is not evidence", () => {
    const setup = drawing.guide.setup.toLowerCase();
    expect(setup).toMatch(/appraise each other/);
    expect(setup).toMatch(/still learning english|whose hands do not do what they are told/);
    const students = drawing.guide.misconceptions.map((m) => m.student.toLowerCase()).join(" ");
    expect(students).toMatch(/never drawn like that before/);
    expect(drawing.guide.extension.toLowerCase()).toMatch(/ask every child/);
    // The form was still blank, so nothing had been entered as her own.
    expect(drawing.family.summary.toLowerCase()).not.toMatch(/entered a picture/);
  });
});

describe("escalation completes operationally, not just socially", () => {
  const sleepover = MISSION_BY_SLUG["the-sleepover-screen"];

  it("makes stopping the app the full-credit move, not substituting a detail", () => {
    const school = sleepover.scenes.find((scene) => scene.id === "s4")!;
    const strong = school.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong.map((c) => c.label.toLowerCase()).join(" ")).toMatch(/close it|can we close it/);

    // Inventing a school keeps one thing out and leaves the app running with
    // the child's real name already in it.
    const madeUp = school.choices!.find((c) => /made-up one/i.test(c.label))!;
    expect(madeUp.feedback.tone).toBe("partial");
    expect(madeUp.evidence?.result).toBe("developing");
    expect(madeUp.feedback.body.toLowerCase()).toMatch(/agree with your own grown-up/);
  });

  it("requires saying what already went in and asking for it to be removed", () => {
    const tell = sleepover.scenes.find((scene) => scene.id === "s5")!;
    const strong = tell.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong).toHaveLength(1);
    expect(strong[0].label.toLowerCase()).toMatch(/my name is in it/);
    expect(strong[0].label.toLowerCase()).toMatch(/take it out/);

    // Asking whether it is okay is a good question and stops one step short.
    const vague = tell.choices!.find((c) => /is that okay/i.test(c.label))!;
    expect(vague.feedback.tone).toBe("partial");
    expect(vague.evidence?.result).toBe("developing");
  });

  it("shows the adult acting and the caregiver being told", () => {
    const outcome = sleepover.scenes.find((scene) => scene.id === "s5b")!;
    const copy = outcome.narration.join(" ").toLowerCase();
    expect(copy).toMatch(/closes the app/);
    expect(copy).toMatch(/deletes it/);
    // Uncertainty about what was kept is named, and the caregiver decides.
    expect(copy).toMatch(/cannot tell whether the app kept anything/);
    expect(copy).toMatch(/message your grown-up/);
  });

  it("gives a seven-year-old an action they can actually start", () => {
    const studentCopy = sleepover.scenes
      .flatMap((scene) => [
        ...scene.narration,
        ...(scene.wrapUp ?? []),
        ...(scene.choices ?? []).flatMap((c) => [c.label, c.feedback.body]),
      ])
      .join(" ")
      .toLowerCase();
    // "Go home" is not something a child can initiate at a sleepover.
    expect(studentCopy).not.toMatch(/go home/);
    expect(studentCopy).toMatch(/ask to ring my grown-up|ask to phone your own grown-up/);
    const wrapUp = sleepover.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/close it first/);
    expect(wrapUp).toMatch(/put the tablet down and ask to ring your own grown-up/);
  });
});

describe("teacher guidance never corrects a child in front of the class", () => {
  // Two missions told teachers to interrupt a belief publicly, or to respond to
  // one child's low reading number with curiosity in front of the room. Both
  // single out a child for something that usually tracks a learning difference
  // or what is happening at home, and neither is the teacher's to expose.
  it("has no guidance to address an individual child's shortfall publicly", () => {
    for (const mission of MISSIONS) {
      const guidance = [
        mission.guide.setup,
        ...mission.guide.misconceptions.map((m) => m.response),
        ...mission.scenes.flatMap((scene) =>
          (scene.choices ?? []).map((c) => c.feedback.coachNote ?? ""),
        ),
      ]
        .join(" ")
        .toLowerCase();
      // Sprint 16 banned four exact strings here and missed a third instance
      // worded "out loud, for the whole room". Match the shape: a correcting
      // verb aimed at a public setting, in either order.
      const correcting = "interrupt|correct|challenge|call out|address|push back on";
      const publicly = "publicly|in front of the (class|room|whole)|to the whole room|for the whole room|out loud, for";
      for (const pattern of [
        new RegExp(`(${correcting})[^.]{0,60}(${publicly})`),
        new RegExp(`(${publicly})[^.]{0,60}(${correcting})`),
      ]) {
        expect(guidance, `${mission.slug} guidance`).not.toMatch(pattern);
      }
    }
  });

  it("says out loud that the slow-recall mission is not about accommodations", () => {
    const practice = MISSION_BY_SLUG["the-practice-that-got-skipped"];
    const setup = practice.guide.setup.toLowerCase();
    // Practice makes it better. The story is not a promise about how fast.
    expect(setup).toMatch(/story rather than a promise/);
    expect(setup).toMatch(/dyscalculia|working-memory/);
    // Children with a tool by agreement must not read this as being about them.
    expect(setup).toMatch(/accommodation/);
    // And a child for whom practice is not working needs somewhere to go.
    const wednesday = practice.scenes.find((scene) => scene.id === "s5")!;
    const tellSomebody = wednesday.choices!.find((c) => /still really hard/i.test(c.label))!;
    expect(tellSomebody.feedback.tone).toBe("strong");
    const wrapUp = practice.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/still hard, tell somebody/);
  });

  it("allocates group jobs rather than asking children to declare a talent", () => {
    const group = MISSION_BY_SLUG["the-group-project"];
    const extension = group.guide.extension.toLowerCase();
    expect(extension).toMatch(/list the jobs the task needs/);
    expect(extension).not.toMatch(/what each member is bringing/);
    expect(group.guide.setup.toLowerCase()).toMatch(/nothing to bring|no obvious talent/);
  });
});

describe("escalation changes something, everywhere it appears", () => {
  // Sprint 15 found a mission where speaking to a pleasant adult was the whole
  // safety action. This sweeps the missions whose primary skill is escalation:
  // once something has gone in, the story must show it being dealt with.
  const escalationMissions = MISSIONS.filter((m) => m.primarySkillId === "privacy.escalate");

  it("covers more than one mission, so the sweep is meaningful", () => {
    expect(escalationMissions.length).toBeGreaterThanOrEqual(2);
  });

  it.each(escalationMissions.map((m) => [m.slug, m] as const))(
    "%s shows something being stopped, removed or handed on",
    (_slug, mission) => {
      const story = mission.scenes
        .flatMap((scene) => [...scene.narration, ...(scene.wrapUp ?? [])])
        .join(" ")
        .toLowerCase();
      expect(story).toMatch(
        /takes? (it|the address) out|deletes?|closes? the app|comes off|(turned|switched) off/,
      );
      // And somebody with standing outside the room is told.
      expect(story).toMatch(/grown-up|ms\. okafor|the office|family|families/);
    },
  );

  it("makes the incomplete version visible in the bystander mission", () => {
    const theo = MISSION_BY_SLUG["it-happened-to-theo"];
    const outcome = theo.scenes.find((scene) => scene.id === "s5")!;
    const copy = outcome.narration.join(" ").toLowerCase();
    expect(copy).toMatch(/takes it out/);
    // Uncertainty is written down rather than glossed.
    expect(copy).toMatch(/cannot be sure about/);
    expect(copy).toMatch(/speak to his grown-up/);
    const wrapUp = theo.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/telling somebody is the start/);
  });
});

describe("no scene reports mastery for the only way out of it", () => {
  // The eight legacy forced-award scenes. Every child who finished such a scene
  // took the one exit, so taking it recorded nothing about whether they
  // reasoned their way there or were sent back until they found it. The rule
  // itself now lives in validateMission, which every mission is checked
  // against; these assertions pin the shape so the intent survives a refactor.
  it("gives every evidence-awarding scene at least two ways out", () => {
    for (const mission of MISSIONS) {
      for (const scene of mission.scenes) {
        const exits = (scene.choices ?? []).filter((c) => !c.retry);
        if (exits.some((c) => c.evidence)) {
          expect(
            exits.length,
            `${mission.slug}/${scene.id} awards evidence through a single exit`,
          ).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("keeps a coached retry at developing, so a second attempt is not mastery", () => {
    // The scene that made the finding: every child used to be funnelled into
    // "the street you live on". Now school and street are both independently
    // correct, and reaching either after a retry records developing.
    const mission = MISSION_BY_SLUG["sprocket-wants-to-know"];
    const scene = mission.scenes.find((s) => s.id === "s6")!;
    const exits = scene.choices!.filter((c) => !c.retry);
    expect(exits).toHaveLength(2);
    for (const exit of exits) {
      expect(exit.evidence).toEqual({ skillId: "privacy.identity", result: "demonstrated" });
    }
    // The distinction is contextual: a fact plus a name, not a public/private
    // list with one obviously-private entry among two obviously-public ones.
    expect(scene.choices!.map((c) => c.label.toLowerCase()).join(" ")).not.toMatch(
      /favourite colour/,
    );
    // The downgrade for a coached retry is exercised for real against every
    // mission in tests/evidence-integrity.test.ts, through recordDecision.
  });

  /**
   * Sprint 36. This scene used to open "Sprocket already knows your first
   * name". It does not, on any route a child can take: the full-credit exit
   * from s2 is "leave it blank and tap Start", and the only other non-retry
   * exit is "ask Theo what he typed" — neither types a name. The scene then
   * awarded privacy.identity on feedback reasoning from that premise, so the
   * evidence rested on a fact the child's own path contradicted.
   */
  it("states its premise as a hypothetical, because no path establishes it", () => {
    const mission = MISSION_BY_SLUG["sprocket-wants-to-know"];
    const scene = mission.scenes.find((s) => s.id === "s6")!;
    const opening = `${scene.narration.join(" ")} ${scene.prompt}`.toLowerCase();

    // Explicitly hypothetical, and framed in the prompt itself rather than
    // only in narration a class may skim past.
    expect(scene.prompt!.toLowerCase()).toMatch(/imagine/);
    expect(opening).toMatch(/pretend|imagine/);
    // And it never asserts the app holds something the child withheld.
    expect(opening).not.toMatch(/already knows your/);
    expect(opening).not.toMatch(/you (gave|typed|told)/);
  });

  it("teaches that details stack, without claiming one child has been identified", () => {
    const mission = MISSION_BY_SLUG["sprocket-wants-to-know"];
    const scene = mission.scenes.find((s) => s.id === "s6")!;

    // Sprint 17's safeguard: finishing is not mastery, so more than one exit.
    const exits = scene.choices!.filter((c) => !c.retry);
    expect(exits).toHaveLength(2);

    const copy = scene
      .choices!.map((c) => `${c.feedback.headline} ${c.feedback.body}`)
      .join(" ")
      .toLowerCase();

    // The durable rule: a detail narrows the field. Not that it settles it.
    expect(copy).toMatch(/smaller|narrows|short/);
    // No claim of unique identification, and no claim of certainty.
    expect(copy).not.toMatch(/one particular child/);
    expect(copy).not.toMatch(/\bknows (where|who) (you|one|somebody|a kid)\b/);
    expect(copy).not.toMatch(/nearly a doorstep|exactly where/);

    // Dinosaurs stay a genuine public contrast: they add no place, so they do
    // not narrow anything, which is why that option loops rather than exits.
    const dinos = scene.choices!.find((c) => c.label.toLowerCase().includes("dinosaur"))!;
    expect(dinos.retry).toBe(true);
    expect(dinos.evidence).toBeUndefined();
    expect(dinos.feedback.body.toLowerCase()).toMatch(/place/);
  });
});

describe("an app must be allowed before its permissions are minimised", () => {
  const filter = MISSION_BY_SLUG["the-filter-that-wanted-more"];

  it("settles approval before any permission is granted", () => {
    // The approval decision must come before the permission box.
    const ids = filter.scenes.map((s) => s.id);
    expect(ids.indexOf("s1b")).toBeLessThan(ids.indexOf("s2"));
    const approval = filter.scenes.find((s) => s.id === "s1b")!;
    const strong = approval.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong.length).toBeGreaterThanOrEqual(2);
    expect(strong.map((c) => c.label.toLowerCase()).join(" ")).toMatch(/allowed|ms\. okafor/);
    // Reading the permission list is the second question, not the first.
    const permissions = approval.choices!.find((c) => /going to ask for/i.test(c.label))!;
    expect(permissions.feedback.tone).toBe("partial");
    // Another child already using it is not permission.
    const peer = approval.choices!.find((c) => /theo already has it/i.test(c.label))!;
    expect(peer.retry).toBe(true);
  });

  it("requires an allowed audience, not merely a clean background", () => {
    const post = filter.scenes.find((s) => s.id === "s5")!;
    const strong = post.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong.map((c) => c.label.toLowerCase()).join(" ")).toMatch(/school tablet|rule/);
    // Declining because of the sign is partway there.
    const background = post.choices!.find((c) => /school sign/i.test(c.label))!;
    expect(background.feedback.tone).toBe("partial");
    expect(background.evidence?.result).toBe("developing");
    expect(background.feedback.body.toLowerCase()).toMatch(/take the sign out/);
  });

  it("never claims an image stayed on the device", () => {
    const ending = filter.scenes.find((s) => s.kind === "ending")!;
    const copy = [...ending.narration, ...(ending.wrapUp ?? [])].join(" ").toLowerCase();
    expect(copy).not.toMatch(/never left the tablet/);
    // What can be done is done; what cannot be known is said.
    expect(copy).toMatch(/delete both fox pictures/);
    expect(copy).toMatch(/cannot see from the outside/);
    expect(copy).toMatch(/a tidy background is not permission/);
  });
});

describe("feedback headlines survive being joined to the body", () => {
  it("never doubles the punctuation, whatever the headline ends with", () => {
    // The teacher preview and the screen-reader announcement both append a
    // full stop. Five authored headlines already ended in one, and one ended
    // in a question mark, so they rendered as "though?." until endSentence.
    for (const mission of MISSIONS) {
      for (const scene of mission.scenes) {
        for (const choice of scene.choices ?? []) {
          const joined = endSentence(choice.feedback.headline);
          expect(joined, `${mission.slug}/${scene.id}/${choice.id}`).not.toMatch(/[.!?…]\.$/);
          expect(joined).toMatch(/[.!?…]["')\]]?$/);
        }
      }
    }
  });
});

describe("a verdict is only as wide as what was actually checked", () => {
  const penguin = MISSION_BY_SLUG["the-penguin-on-the-playground"];

  it("gives the image a checkable claim, including when", () => {
    // Without a claimed time, "it did not snow yesterday" settles nothing.
    const opening = penguin.scenes.find((s) => s.id === penguin.openingSceneId)!;
    expect(opening.narration.join(" ").toLowerCase()).toMatch(/this morning/);
    const clues = penguin.scenes.find((s) => s.id === "s3")!;
    const strong = clues.choices!.find((c) => c.feedback.tone === "strong")!;
    expect(strong.label.toLowerCase()).toMatch(/this morning/);
    // And the check settles the caption, not the picture's origin.
    expect(strong.feedback.body.toLowerCase()).toMatch(/where the picture itself came from is still nobody/);
  });

  it("checks the voice against a channel as well as against the person", () => {
    const voice = penguin.scenes.find((s) => s.id === "s5")!;
    const exits = voice.choices!.filter((c) => !c.retry);
    expect(exits).toHaveLength(2);
    const labels = exits.map((c) => c.label.toLowerCase()).join(" ");
    expect(labels).toMatch(/ms\. okafor/);
    expect(labels).toMatch(/class page/);
    // Asking the subject is scoped to this instruction, not made a general law.
    const askHer = exits.find((c) => /ms\. okafor/i.test(c.label))!;
    expect(askHer.feedback.body.toLowerCase()).toMatch(/homework message from your own teacher/);
  });

  it("reports the two artefacts separately, because they were settled differently", () => {
    const correct = penguin.scenes.find((s) => s.id === "s6")!;
    const strong = correct.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong).toHaveLength(1);
    expect(strong[0].label.toLowerCase()).toMatch(/did not send/);
    expect(strong[0].label.toLowerCase()).toMatch(/nobody knows where the picture came from/);

    // Declaring the whole thing fake is the same error pointed the other way.
    const blanket = correct.choices!.find((c) => /whole thing is fake/i.test(c.label))!;
    expect(blanket.feedback.tone).toBe("partial");
    expect(blanket.evidence?.result).toBe("developing");

    // And the mission ends with the picture unresolved, on purpose.
    const ending = penguin.scenes.find((s) => s.kind === "ending")!;
    const copy = [...ending.narration, ...(ending.wrapUp ?? [])].join(" ").toLowerCase();
    expect(copy).toMatch(/unknown/);
    expect(copy).toMatch(/unknown is a real answer/);
  });
});

describe("conflicting answers are reconciled before one is called wrong", () => {
  const dates = MISSION_BY_SLUG["two-answers-one-truth"];
  const studentCopy = dates.scenes
    .flatMap((scene) => [
      ...scene.narration,
      scene.prompt ?? "",
      ...(scene.wrapUp ?? []),
      ...(scene.choices ?? []).flatMap((c) => [c.label, c.feedback.headline, c.feedback.body]),
    ])
    .join(" ")
    .toLowerCase();

  it("never asserts that the two dates are incompatible", () => {
    // A school founded in 1908 can move into a building erected in 1961.
    expect(studentCopy).not.toMatch(/cannot both be right/);
    expect(studentCopy).toMatch(/both be true|both of them be right|nobody\. they were answering/);
  });

  it("makes reading the plaque's actual wording the full-credit move", () => {
    const conflict = dates.scenes.find((s) => s.id === "s4")!;
    const strong = conflict.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong.length).toBeGreaterThanOrEqual(2);
    expect(strong.map((c) => c.label.toLowerCase()).join(" ")).toMatch(/erected/);
    // Deferring to the object because it looks official is the retry.
    const deference = conflict.choices!.find((c) => /official/i.test(c.label))!;
    expect(deference.retry).toBe(true);
    expect(deference.feedback.headline.toLowerCase()).toMatch(/looking official is not a reason/);
  });

  it("settles it with the record responsible for the fact, not a hierarchy", () => {
    const records = dates.scenes.find((s) => s.id === "s5")!;
    expect(records.narration.join(" ").toLowerCase()).toMatch(/building records/);
    expect(records.narration.join(" ").toLowerCase()).toMatch(/1908/);
    expect(records.narration.join(" ").toLowerCase()).toMatch(/1961/);
    // No universal league table of source types in the wrap-up.
    const wrapUp = dates.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/work out what the question is/);
    expect(wrapUp).toMatch(/erected is not the same as founded/);
    expect(wrapUp).not.toMatch(/first-hand beats/);
  });
});

describe("every path into a reporting scene can honestly say what it awards", () => {
  const homework = MISSION_BY_SLUG["the-homework-that-did-itself"];

  it("sends a kept answer to a different conversation from a hint", () => {
    // Keeping Sprocket's answer to number two and clearing the page are
    // different actions, so they cannot share a disclosure scene: on the first
    // path, "it gave me a hint" is simply false.
    const action = homework.scenes.find((s) => s.id === "s4")!;
    const kept = action.choices!.find((c) => /keep number two/i.test(c.label))!;
    const cleared = action.choices!.filter((c) => /^clear/i.test(c.label));
    expect(cleared.length).toBeGreaterThanOrEqual(2);
    expect(new Set(cleared.map((c) => c.next)).size).toBe(1);
    expect(kept.next).not.toBe(cleared[0].next);
    // Keeping a supplied answer is allowed, and it is less of the practice.
    expect(kept.feedback.tone).toBe("partial");
    expect(kept.evidence?.result).toBe("developing");
  });

  it("never awards honesty for calling a kept answer a hint", () => {
    const keptReport = homework.scenes.find((s) => s.id === "s5b")!;
    const strong = keptReport.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong).toHaveLength(1);
    expect(strong[0].label.toLowerCase()).toMatch(/gave me the answer/);

    const calledAHint = keptReport.choices!.find((c) => /gave me a hint/i.test(c.label))!;
    expect(calledAHint.feedback.tone).toBe("partial");
    expect(calledAHint.evidence?.result).toBe("developing");
    expect(calledAHint.feedback.body.toLowerCase()).toMatch(/sound smaller than it was/);
  });

  it("makes the shared reporting scene true on every path that reaches it", () => {
    // s5 is reached only by paths where the child did all six themselves, and
    // on all of them the child did type "I am stuck on number two".
    const report = homework.scenes.find((s) => s.id === "s5")!;
    const strong = report.choices!.filter((c) => c.feedback.tone === "strong");
    for (const choice of strong) {
      expect(choice.label.toLowerCase()).not.toMatch(/hint/);
    }
    // The example offered at the opening is stated to be unworked, because
    // that changes what the child can truthfully report.
    const opening = homework.scenes.find((s) => s.id === "s2")!;
    const example = opening.choices!.find((c) => /problem like it/i.test(c.label))!;
    expect(example.feedback.body.toLowerCase()).toMatch(/leaves it blank/);
  });
});

describe("practice is defined by recall, not by handwriting", () => {
  const spelling = MISSION_BY_SLUG["the-spelling-test-surprise"];
  const studentCopy = spelling.scenes
    .flatMap((scene) => [
      ...scene.narration,
      scene.prompt ?? "",
      ...(scene.wrapUp ?? []),
      ...(scene.choices ?? []).flatMap((c) => [c.label, c.feedback.headline, c.feedback.body]),
    ])
    .join(" ")
    .toLowerCase();

  it("names copying versus remembering, not the hand", () => {
    // The story says the child handwrote every word five times, so any
    // explanation resting on handwriting contradicts its own setup.
    expect(studentCopy).toMatch(/copying a word/);
    expect(studentCopy).toMatch(/out of (your|my) head|out of sight|without looking/);
    expect(studentCopy).not.toMatch(/hand never learned/);
    expect(studentCopy).not.toMatch(/when your hand writes them/);
  });

  it("lets the plan be any modality, as long as the answer is hidden", () => {
    const plan = spelling.scenes.find((s) => s.id === "s5")!;
    const strong = plan.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong.length).toBeGreaterThanOrEqual(2);
    expect(strong.map((c) => c.label.toLowerCase()).join(" ")).toMatch(/cover/);
    const anyWay = strong.map((c) => c.feedback.body.toLowerCase()).join(" ");
    expect(anyWay).toMatch(/typed/);
    expect(anyWay).toMatch(/letter tiles/);
    expect(anyWay).toMatch(/out of sight/);
  });

  it("does not make a messy page the evidence of learning", () => {
    const peer = spelling.scenes.find((s) => s.id === "s6")!;
    const strong = peer.choices!.find((c) => c.feedback.tone === "strong")!;
    expect(strong.feedback.body.toLowerCase()).toMatch(/neat and some come out a mess/);
    expect(strong.feedback.body.toLowerCase()).toMatch(/had a go before you looked/);
    // And the family sheet must not prescribe handwriting either.
    expect(spelling.family.tryAtHome.toLowerCase()).toMatch(/written, typed, said out loud/);
    expect(spelling.family.tryAtHome.toLowerCase()).not.toMatch(/in their handwriting/);
  });
});

describe("no mission scores how many adults a child can name", () => {
  /**
   * The count was never the skill, and it measured family size. Three names is
   * comfortable for a child with a large safe family and impossible for a child
   * in foster care, in an unstable home, or in a household where an adult is
   * the problem — which are the children these missions most need to reach.
   * Written as a sweep because this is the kind of thing that reappears.
   */
  it("never makes a number of trusted adults the full-credit answer", () => {
    for (const mission of MISSIONS) {
      for (const scene of mission.scenes) {
        for (const choice of scene.choices ?? []) {
          if (choice.evidence?.result !== "demonstrated") continue;
          const copy = `${choice.label} ${choice.feedback.headline} ${choice.feedback.body}`.toLowerCase();
          // Narrow to the quota framing. Copy that merely mentions two adults —
          // "putting two adults in touch with each other" — is not this defect.
          expect(copy, `${mission.slug}/${scene.id}/${choice.id}`).not.toMatch(
            /(?:at least|more than|keep|need) (?:one|two|three|four) (?:other )?(?:trusted )?(?:grown-ups?|adults?)\b/,
          );
          expect(copy).not.toMatch(/(?:one|two|three|four) trusted (?:grown-ups?|adults?)\b/);
        }
        // Nor may a scene ask a child the question in the first place.
        expect(scene.prompt?.toLowerCase() ?? "", `${mission.slug}/${scene.id} prompt`).not.toMatch(
          /how many (?:trusted )?(?:grown-ups?|adults?)/,
        );
      }
    }
  });

  it("routes escalation somewhere that does not depend on home", () => {
    const bedtime = MISSION_BY_SLUG["the-question-at-bedtime"];
    const reflect = bedtime.scenes.find((s) => s.id === "s6")!;
    const strong = reflect.choices!.filter((c) => c.feedback.tone === "strong");
    const labels = strong.map((c) => c.label.toLowerCase()).join(" ");
    // Keep telling until somebody acts, and a school route that is always open.
    expect(labels).toMatch(/tell somebody else|until somebody does something/);
    expect(labels).toMatch(/school/);
    const schoolChoice = strong.find((c) => /school/i.test(c.label))!;
    expect(schoolChoice.feedback.body.toLowerCase()).toMatch(/does not depend on anything at home/);

    // Telling one person and stopping is the right first move, not the whole
    // rule, so it is partway there rather than wrong.
    const oneOnly = reflect.choices!.find((c) => /leave it there/i.test(c.label))!;
    expect(oneOnly.feedback.tone).toBe("partial");
    expect(oneOnly.feedback.body.toLowerCase()).toMatch(/one person is plenty to start with/);
  });

  it("keeps the planning card optional, private and never collected", () => {
    const bedtime = MISSION_BY_SLUG["the-question-at-bedtime"];
    const extension = bedtime.guide.extension.toLowerCase();
    expect(extension).toMatch(/one line filled in is fine/);
    expect(extension).toMatch(/do not collect the cards/);
    expect(extension).toMatch(/do not read them out/);
    // The teacher is told what to do about a blank card, discreetly.
    expect(extension).toMatch(/quietly and separately/);
    expect(extension).not.toMatch(/three/);
    // And the guide names why the count was dropped.
    expect(bedtime.guide.setup.toLowerCase()).toMatch(/foster care|an adult is the problem/);
    expect(bedtime.guide.setup.toLowerCase()).toMatch(/nothing here says an adult is safe because of their role/);
  });

  it("addresses the family rule to a trusted adult, not to a household", () => {
    const bedtime = MISSION_BY_SLUG["the-question-at-bedtime"];
    expect(bedtime.family.familyRule.toLowerCase()).toMatch(/a grown-up we trust/);
    expect(bedtime.family.familyRule.toLowerCase()).not.toMatch(/in this house/);
    expect(bedtime.family.questions.join(" ").toLowerCase()).not.toMatch(/three/);
    // The escalation half must reach families too.
    expect(bedtime.family.tryAtHome.toLowerCase()).toMatch(/tell somebody else/);
  });
});

describe("execution is not verification", () => {
  const sure = MISSION_BY_SLUG["the-very-sure-answer"];

  it("does not call a calculator infallible", () => {
    const scene = sure.scenes.find((s) => s.id === "s3")!;
    const calc = scene.choices!.find((c) => /computers do not make mistakes/i.test(c.label))!;
    const copy = `${calc.feedback.headline} ${calc.feedback.body}`.toLowerCase();
    expect(copy).not.toMatch(/calculators do not/);
    // It does exactly what it is told, which is a different claim.
    expect(copy).toMatch(/exactly the sum you type/);
    expect(copy).toMatch(/wrong sum/);
  });

  it("earns mastery from a source responsible for the claim", () => {
    const check = sure.scenes.find((s) => s.id === "s6")!;
    const strong = check.choices!.filter((c) => c.feedback.tone === "strong");
    expect(strong.map((c) => c.label.toLowerCase()).join(" ")).toMatch(/where the page came from/);
    const site = strong.find((c) => /science site/i.test(c.label))!;
    expect(site.feedback.body.toLowerCase()).toMatch(/names the aquarium/);

    // A name on a cover is a starting point, not a credential.
    const book = check.choices!.find((c) => /see who wrote it/i.test(c.label))!;
    expect(book.feedback.tone).toBe("partial");
    expect(book.evidence?.result).toBe("developing");
    expect(book.feedback.body.toLowerCase()).toMatch(/not that they study fish/);
  });
});

describe("classroom activities do not log children", () => {
  /**
   * The product keeps no behavioural telemetry — tests/access-control.test.ts
   * asserts that at the schema level. A paper tally of which children got stuck
   * and what they reached for is the same thing with a different storage
   * medium, and it makes asking for help into something that gets watched.
   * Written as a sweep because an extension is easy to add and easy to skim.
   */
  it("has no activity that records per-child help-seeking over time", () => {
    for (const mission of MISSIONS) {
      const activity = mission.guide.extension.toLowerCase();
      // Noticing something in the moment is fine and is what lookFor is for.
      // What is banned is accumulating it against individual children.
      for (const pattern of [
        /(keep|run|start) (a|an) [^.]{0,30}(tally|log|chart|record|register)/,
        /each time (a|the) (student|child|they)[^.]{0,40}(mark|record|write down|tick)/,
        /(record|track|note down) (which|who|how often) (student|child|children|they)/,
      ]) {
        expect(activity, `${mission.slug} extension`).not.toMatch(pattern);
      }
    }
  });

  it("says out loud in Four Doors why the tally was dropped", () => {
    const doors = MISSION_BY_SLUG["four-doors"];
    const activity = doors.guide.extension.toLowerCase();
    expect(activity).toMatch(/nothing gets written down/);
    expect(activity).toMatch(/not better for being on paper/);
    // And the replacement is anonymous, teacher-authored and low-preparation.
    expect(activity).toMatch(/same six for the whole class/);
    expect(activity).toMatch(/show of hands|walking to a corner/);
  });
});

describe("the four doors are distinguishable and combinable", () => {
  const doors = MISSION_BY_SLUG["four-doors"];

  it("names the fourth route precisely, and says tools help at all of them", () => {
    const opening = doors.scenes.find((s) => s.id === doors.openingSceneId)!;
    const copy = opening.narration.join(" ").toLowerCase();
    // "Use a tool" overlapped every other door: a book is a tool, so is a
    // calculator, so is the software that reads a page aloud.
    expect(copy).toMatch(/door four: ask an ai tool/);
    expect(copy).not.toMatch(/door four: use a tool/);
    expect(copy).toMatch(/the ai tools this school lets us use/);
    expect(copy).toMatch(/a book is a tool/);
    expect(copy).toMatch(/where the answer comes from, not about what you are holding/);
  });

  it("teaches two doors in a row rather than four exclusive kinds", () => {
    const tree = doors.scenes.find((s) => s.id === "s3")!;
    const aiChoice = tree.choices!.find((c) => /ask an ai tool/i.test(c.label))!;
    expect(aiChoice.feedback.body.toLowerCase()).toMatch(/two doors in a row/);
    expect(aiChoice.feedback.body.toLowerCase()).toMatch(/go and read that yourself/);
    const wrapUp = doors.scenes.find((s) => s.kind === "ending")!.wrapUp!.join(" ").toLowerCase();
    expect(wrapUp).toMatch(/doors can go in a row/);
    expect(wrapUp).toMatch(/a tool can help you at any door/);
  });

  it("states the learner's situation before scoring the strategy", () => {
    // Without a stated state, "you already know this one" is an assertion about
    // the child's arithmetic, and children for whom it is false get marked
    // below mastery for answering honestly.
    const first = doors.scenes.find((s) => s.id === "s2")!;
    expect(first.narration.join(" ").toLowerCase()).toMatch(/worked this one out yesterday/);
    expect(first.narration.join(" ").toLowerCase()).toMatch(/nearly back/);
    const think = first.choices!.find((c) => /think it out/i.test(c.label))!;
    expect(think.feedback.body.toLowerCase()).not.toMatch(/you already know this one/);
    expect(think.feedback.body.toLowerCase()).not.toMatch(/you can do seven plus eight/);
  });

  it("makes a hint and an agreed accommodation full-credit answers", () => {
    const first = doors.scenes.find((s) => s.id === "s2")!;
    const agreed = first.choices!.find((c) => /agreed with ms\. okafor/i.test(c.label))!;
    expect(agreed.feedback.tone).toBe("strong");
    expect(agreed.evidence?.result).toBe("demonstrated");
    expect(agreed.feedback.body.toLowerCase()).toMatch(/your arrangement, not a shortcut/);
    // And the teacher is told, plainly, not to make it a public matter.
    const setup = doors.guide.setup.toLowerCase();
    expect(setup).toMatch(/an agreed accommodation is not the shortcut this mission is about/);
    expect(setup).toMatch(/never discuss a particular child's speed/);
  });
});

describe("benchmark forms", () => {
  it("has exactly one correct option per item", () => {
    for (const form of Object.values(BENCHMARK_FORMS)) {
      for (const item of form.items) {
        expect(item.options.filter((o) => o.correct)).toHaveLength(1);
        expect(item.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("balances both forms across the three competencies", () => {
    for (const form of Object.values(BENCHMARK_FORMS)) {
      expect(form.items).toHaveLength(9);
      for (const competency of COMPETENCIES) {
        expect(form.items.filter((i) => i.competency === competency.id)).toHaveLength(3);
      }
    }
  });

  it("pairs the forms skill for skill so the two windows compare like with like", () => {
    const pre = BENCHMARK_FORMS.pre.items.map((i) => i.skillId).sort();
    const post = BENCHMARK_FORMS.post.items.map((i) => i.skillId).sort();
    expect(pre).toEqual(post);
  });

  it("uses transfer scenarios: no benchmark text reuses a mission's setting", () => {
    // Proper nouns from the mission world must not appear in either form,
    // otherwise the benchmark measures recall rather than transfer.
    const missionWorld = [
      "Sprocket", "Dazzle", "AskMe", "Brightwood", "Okafor", "Theo", "Nia",
      "Room 12", "Ruiz", "goldfish", "penguin", "fox filter",
    ];
    for (const form of Object.values(BENCHMARK_FORMS)) {
      const text = form.items
        .map((i) => `${i.scenario} ${i.question} ${i.options.map((o) => o.label).join(" ")}`)
        .join(" ");
      for (const term of missionWorld) {
        expect(text.toLowerCase()).not.toContain(term.toLowerCase());
      }
    }
  });

  it("never frames the check-in to a child as a graded test", () => {
    // Denials are fine and wanted ("this is not a test", "nobody gets a
    // score"). What must never appear is copy that assigns a child a result.
    const banned = [
      "your score",
      "you scored",
      "will be graded",
      "your grade",
      "how well you did",
      "get them right",
      "correct answers",
    ];
    for (const form of Object.values(BENCHMARK_FORMS)) {
      const copy = [...form.intro, ...form.outro].join(" ").toLowerCase();
      for (const phrase of banned) expect(copy).not.toContain(phrase);
    }
    // And the intro must actively say there is no score.
    for (const form of Object.values(BENCHMARK_FORMS)) {
      const intro = form.intro.join(" ").toLowerCase();
      expect(intro).toMatch(/no score|nobody gets a score/);
    }
  });
});

describe("the benchmark does not repeat a rationale the missions removed", () => {
  const items = Object.values(BENCHMARK_FORMS).flatMap((f) => f.items);
  const copy = items
    .flatMap((i) => [i.scenario, i.question, ...i.options.map((o) => o.label)])
    .join(" ")
    .toLowerCase();

  it("never treats an inscription or an object's age as source authority", () => {
    // Sprint 18 removed this from Two Answers, One Truth: a plaque may have
    // been installed later, by somebody who was not there, and it answers
    // whatever narrow question was engraved. The benchmark was still scoring
    // it as the correct answer, which is worse — a mission teaches, and an
    // item like this rewards the belief and then reports it as evidence.
    for (const phrase of [
      "the people who built it put it there",
      "because it was there",
      "because it is older",
      "because it is carved",
      "because it is official",
    ]) {
      expect(copy).not.toContain(phrase);
    }
    // Nor may a correct option rest on proximity or apparent authority.
    for (const item of items) {
      const right = item.options.find((o) => o.correct)!;
      expect(right.label.toLowerCase(), `${item.id}`).not.toMatch(
        /because it is right there|because it is on the (wall|door|building)/,
      );
    }
  });

  it("makes the responsible source the correct answer where sources conflict", () => {
    // Both source items now turn on who is answerable for the fact.
    const sourceItems = items.filter((i) => i.skillId === "verify.source");
    expect(sourceItems.length).toBeGreaterThanOrEqual(2);
    for (const item of sourceItems) {
      const right = item.options.find((o) => o.correct)!;
      expect(right.label.toLowerCase(), `${item.id}`).toMatch(
        /because they (run|keep)|records/,
      );
    }
  });
});

describe("the two check-in forms are matched, and say so honestly", () => {
  const pre = BENCHMARK_FORMS.pre.items;
  const post = BENCHMARK_FORMS.post.items;

  it("asks the same kind of question of each paired skill", () => {
    // Not equated — nobody has piloted these — but at least the pair must ask
    // for the same move. Pre-4 used to ask a child to rate their belief while
    // post-4 asked them to choose an action, so a difference between the
    // windows could be a difference in task demand rather than in the child.
    for (const item of pre) {
      const pair = post.find((p) => p.skillId === item.skillId)!;
      expect(pair, `${item.id} has no post pair`).toBeDefined();
      expect(item.options).toHaveLength(pair.options.length);

      // Same stem shape: both ask what to do, or neither does.
      const actionStem = (q: string) => /what (should you do|is the best thing to do|is the best move)/i.test(q);
      expect(actionStem(item.question), `${item.id} vs ${pair.id} stem`).toBe(
        actionStem(pair.question),
      );

      // Comparable reading load rather than identical.
      const words = (t: string) => t.split(/\s+/).length;
      expect(
        Math.abs(words(item.scenario) - words(pair.scenario)),
        `${item.id} vs ${pair.id} scenario length`,
      ).toBeLessThanOrEqual(12);
    }
  });

  it("states in the content module what the instrument cannot support", () => {
    // One item per skill means a single response moves a competency by a third.
    for (const form of Object.values(BENCHMARK_FORMS)) {
      for (const skill of ALL_SKILLS) {
        expect(form.items.filter((i) => i.skillId === skill.id)).toHaveLength(1);
      }
    }
  });

  it("tells a child who sees the results, not only that there is no score", () => {
    // "Your teacher only uses this" was incomplete: cohort figures reach
    // school leaders through reports, dashboards and exports.
    for (const form of Object.values(BENCHMARK_FORMS)) {
      const intro = form.intro.join(" ").toLowerCase();
      expect(intro, `${form.form} intro`).toMatch(/nobody sees your answers/);
      expect(intro).toMatch(/adults at your school only see results for whole groups/);
      expect(intro).not.toMatch(/your teacher only uses this/);
    }
  });
});

describe("educator orientation", () => {
  it("does not claim competence anywhere in its own content", () => {
    // The checks are ungated on purpose: a teacher can answer every one of
    // them wrong and still finish. That is a defensible design for adult
    // professional learning, and it means the only fact the system holds is
    // that five modules were read and five questions answered. Calling that
    // "certified" tells a principal something the data cannot support, so the
    // word does not appear in the offering's own copy.
    const copy = CERTIFICATION_MODULES.flatMap((m) => [
      m.title,
      ...m.body,
      ...m.keyPoints,
      m.check.question,
      m.check.explanation,
      ...m.check.options.map((o) => o.label),
    ])
      .join(" ")
      .toLowerCase();
    for (const phrase of ["certified", "certification", "micro-certification"]) {
      expect(copy).not.toContain(phrase);
    }
  });

  it("is named an orientation everywhere the product describes it", () => {
    // A sweep over the offering's own title and the shared constants, so the
    // word cannot creep back into one surface while the checks stay ungated.
    expect(CERTIFICATION_TITLE.toLowerCase()).not.toContain("certif");
    expect(CERTIFICATION_MODULES.length).toBe(5);
  });

  it("describes the curriculum it actually ships", () => {
    // It said "the curriculum is nine situations" while the product had 27
    // missions, three per skill. A teacher planning from that would have
    // prepared nine one-off stories and missed the repetition entirely.
    const first = CERTIFICATION_MODULES.find((m) => m.order === 1)!;
    const copy = [...first.body, ...first.keyPoints].join(" ").toLowerCase();
    expect(copy).toContain("27 authored missions");
    expect(copy).toMatch(/three for each of the nine skills/);
    expect(copy).not.toMatch(/the curriculum is nine situations/);
  });

  it("frames concreteness as a teaching sequence, not a fact about children", () => {
    const copy = CERTIFICATION_MODULES.flatMap((m) => [...m.body, ...m.keyPoints])
      .join(" ")
      .toLowerCase();
    // Universal claims about what seven year olds are and causal claims about
    // transfer are not things this program has evidence for.
    expect(copy).not.toMatch(/children at this age are concrete thinkers/);
    expect(copy).not.toMatch(/far better/);
    expect(copy).not.toMatch(/transfer better than stated rules/);
    // What replaced it says what to do, and says it is a sequence.
    expect(copy).toMatch(/start concrete, name the rule out loud/);
    expect(copy).toMatch(/not a claim about what a seven year old is capable of/);
  });

  it("has five modules, each with one correct answer and an explanation", () => {
    expect(CERTIFICATION_MODULES).toHaveLength(5);
    for (const mod of CERTIFICATION_MODULES) {
      expect(mod.check.options.filter((o) => o.correct)).toHaveLength(1);
      expect(mod.check.explanation.length).toBeGreaterThan(40);
      expect(mod.body.length).toBeGreaterThanOrEqual(2);
      expect(mod.keyPoints.length).toBeGreaterThanOrEqual(3);
    }
  });
});
