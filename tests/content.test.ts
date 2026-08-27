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
