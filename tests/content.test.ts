import { describe, expect, it } from "vitest";
import { MISSIONS, MISSION_BY_SLUG } from "@/content/missions";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { CERTIFICATION_MODULES } from "@/content/certification";
import { ALL_SKILLS, COMPETENCIES, SKILL_BY_ID } from "@/content/competencies";
import { simulateAttempt } from "@/lib/db/seed";
import { validateMission } from "@/lib/domain/missionPath";

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

    const voiceScene = mission.scenes.find((scene) => scene.id === "s5")!;
    const nonRetryChoices = voiceScene.choices!.filter((choice) => !choice.retry);
    expect(nonRetryChoices).toHaveLength(1);
    expect(nonRetryChoices[0].evidence).toBeUndefined();
  });

  it("does not turn a coached Mission 5 completion into demonstrated evidence", () => {
    const mission = MISSION_BY_SLUG["the-penguin-on-the-playground"];
    const result = simulateAttempt(mission, () => 0.1, 0);

    expect(result.path).toEqual(
      expect.arrayContaining([
        { sceneId: "s5", choiceId: "c2" },
        { sceneId: "s5", choiceId: "c1" },
      ]),
    );
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

  it("pairs the forms skill for skill so growth compares like with like", () => {
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

describe("educator certification", () => {
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
