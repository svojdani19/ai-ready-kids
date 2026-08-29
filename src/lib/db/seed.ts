import { MISSIONS } from "@/content/missions";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { CERTIFICATION_MODULES } from "@/content/certification";
import type { Mission } from "@/content/types";
import type { Db } from "./helpers";

/**
 * Demo data.
 *
 * Everything below is fictional. There is no real school, no real child and
 * no real staff member anywhere in this file, and the product never asks a
 * deployment to import any. The seed exists so that every dashboard, report
 * and export has something honest to render on a fresh clone.
 *
 * Student progress is not random noise: each seeded attempt is produced by
 * actually walking the mission's scene graph and choosing branches, so every
 * stored path is a path a real child could have taken.
 */

const SCHOOL_ID = "sch_brightwood";
const SCHOOL_YEAR = "2025-2026";
// Subscription dates: when money changes hands.
const TERM_START = "2025-08-18";
const TERM_RENEWS = "2026-09-01";
// Academic dates: when the children arrive and go home. Deliberately different
// from the two above, because conflating them was the sprint 32 defect and a
// seed where they coincided would hide it.
const YEAR_STARTS = "2025-08-25";
const YEAR_ENDS = "2026-06-12";

/** Small deterministic PRNG so the demo looks identical on every machine. */
function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

function isoDay(dayOffsetFromTermStart: number): string {
  const base = new Date(`${TERM_START}T15:30:00.000Z`);
  base.setUTCDate(base.getUTCDate() + dayOffsetFromTermStart);
  return base.toISOString();
}

const AVATARS = [
  "fox",
  "owl",
  "otter",
  "bear",
  "frog",
  "turtle",
  "crane",
  "hedgehog",
  "bee",
  "whale",
] as const;

const FIRST_NAMES = [
  "Amina", "Jonah", "Priya", "Marcus", "Sofia", "Emeka", "Lila", "Diego",
  "Nora", "Kai", "Zaynab", "Owen", "Ivy", "Mateo", "Hana", "Elias",
  "Rosa", "Theo", "Maya", "Sam", "Aisha", "Felix", "Ruby", "Nico",
  "Grace", "Omar", "Wren", "Levi", "Nia", "Jasper", "Talia", "Beau",
  "Simone", "Arun", "Clara", "Malik", "Esme", "Tobias", "Vera", "Rafi",
  "June", "Hugo", "Anya", "Caleb", "Isla", "Dev", "Lena", "Otis",
];

const LAST_INITIALS = "ABCDEFGHIJKLMNOPRSTVW".split("");

interface SeedClass {
  id: string;
  name: string;
  grade: number;
  joinCode: string;
  teacherId: string;
  size: number;
  /** How many missions this class has been assigned so far this year. */
  assignedMissions: number;
  /** Roughly what share of assigned missions the class has completed. */
  completionRate: number;
  /** Whether the class finished the spring check-in. */
  postBenchmark: boolean;
  seed: number;
}

const USERS = [
  {
    id: "usr_delgado",
    role: "admin" as const,
    name: "Rosa Delgado",
    email: "r.delgado@brightwood.demo",
    title: "Director of Instructional Technology",
  },
  {
    id: "usr_hale",
    role: "admin" as const,
    name: "Gwen Hale",
    email: "g.hale@brightwood.demo",
    title: "Principal",
  },
  {
    id: "usr_okafor",
    role: "teacher" as const,
    name: "Amara Okafor",
    email: "a.okafor@brightwood.demo",
    title: "Grade 3 Teacher, Room 12",
  },
  {
    id: "usr_whitfield",
    role: "teacher" as const,
    name: "Danny Whitfield",
    email: "d.whitfield@brightwood.demo",
    title: "Grade 2 Teacher, Room 4",
  },
  {
    id: "usr_raman",
    role: "teacher" as const,
    name: "Priya Raman",
    email: "p.raman@brightwood.demo",
    title: "Grade 4 Teacher, Room 21",
  },
  {
    id: "usr_brennan",
    role: "teacher" as const,
    name: "Lucas Brennan",
    email: "l.brennan@brightwood.demo",
    title: "Grade 3 Teacher, Room 14",
  },
];

const CLASSES: SeedClass[] = [
  {
    id: "cls_room12",
    name: "Room 12",
    grade: 3,
    joinCode: "MAPLE-HERON-317",
    teacherId: "usr_okafor",
    size: 23,
    assignedMissions: 18,
    completionRate: 0.88,
    postBenchmark: true,
    seed: 101,
  },
  {
    id: "cls_room4",
    name: "Room 4",
    grade: 2,
    joinCode: "ACORN-BADGER-208",
    teacherId: "usr_whitfield",
    size: 21,
    assignedMissions: 9,
    completionRate: 0.63,
    postBenchmark: false,
    seed: 202,
  },
  {
    id: "cls_room21",
    name: "Room 21",
    grade: 4,
    joinCode: "HERON-TULIP-455",
    teacherId: "usr_raman",
    size: 24,
    assignedMissions: 15,
    completionRate: 0.79,
    postBenchmark: true,
    seed: 303,
  },
  {
    id: "cls_room14",
    name: "Room 14",
    grade: 3,
    joinCode: "CEDAR-ROBIN-361",
    teacherId: "usr_brennan",
    size: 22,
    assignedMissions: 11,
    completionRate: 0.41,
    postBenchmark: false,
    seed: 404,
  },
];

/**
 * Walk a mission's scene graph the way a child would, choosing branches with
 * a skill level that biases towards or away from the strong option. Returns
 * the path taken and the evidence it produced.
 */
export function simulateAttempt(
  mission: Mission,
  rng: () => number,
  skill: number,
): { path: { sceneId: string; choiceId: string }[]; evidence: Record<string, string> } {
  const path: { sceneId: string; choiceId: string }[] = [];
  const evidence: Record<string, string> = {};
  const sceneById = new Map(mission.scenes.map((s) => [s.id, s]));

  let sceneId: string | undefined = mission.openingSceneId;
  let steps = 0;

  while (sceneId && steps < 60) {
    steps += 1;
    const scene = sceneById.get(sceneId);
    if (!scene) break;

    if (!scene.choices || scene.choices.length === 0) {
      if (scene.kind === "ending") break;
      sceneId = scene.next;
      continue;
    }

    const strong = scene.choices.filter((c) => c.feedback.tone === "strong");
    const partial = scene.choices.filter((c) => c.feedback.tone === "partial");
    const weak = scene.choices.filter((c) => c.feedback.tone === "rethink");

    const roll = rng();
    let choice =
      roll < skill && strong.length
        ? pick(rng, strong)
        : roll < skill + 0.22 && partial.length
          ? pick(rng, partial)
          : weak.length
            ? pick(rng, weak)
            : pick(rng, scene.choices);

    // A retry choice loops back; children almost always land the strong
    // option on the second read, which is what the retry design is for. The
    // second answer is coached, so it records developing rather than
    // demonstrated — the same rule the live player applies.
    let afterCoaching = false;
    if (choice.retry) {
      path.push({ sceneId: scene.id, choiceId: choice.id });
      choice = strong.length ? pick(rng, strong) : scene.choices[0];
      afterCoaching = true;
    }

    path.push({ sceneId: scene.id, choiceId: choice.id });
    if (choice.evidence) {
      const result =
        afterCoaching && choice.evidence.result === "demonstrated"
          ? "developing"
          : choice.evidence.result;
      if (evidence[choice.evidence.skillId] !== "demonstrated") {
        evidence[choice.evidence.skillId] = result;
      }
    }
    sceneId = choice.next === scene.id ? scene.next : choice.next;
  }

  return { path, evidence };
}

function seedBenchmark(
  form: "pre" | "post",
  rng: () => number,
  skill: number,
): Record<string, string> {
  const responses: Record<string, string> = {};
  for (const item of BENCHMARK_FORMS[form].items) {
    const correct = item.options.find((o) => o.correct)!;
    const others = item.options.filter((o) => !o.correct);
    responses[item.id] = rng() < skill ? correct.id : pick(rng, others).id;
  }
  return responses;
}

export function isSeeded(db: Db): boolean {
  const result = db.prepare("SELECT COUNT(*) AS n FROM schools").get() as
    | { n: number }
    | undefined;
  return (result?.n ?? 0) > 0;
}

export function seedIfEmpty(db: Db): boolean {
  if (isSeeded(db)) return false;
  seed(db);
  return true;
}

export function seed(db: Db): void {
  const insertSchool = db.prepare(`
    INSERT INTO schools (id, name, slug, district, city, state, monogram, brand_accent,
      plan, licensed_students, term_starts_on, term_renews_on, academic_year,
      year_starts_on, year_ends_on, contact_name,
      contact_email, retention_months, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  insertSchool.run(
    SCHOOL_ID,
    "Brightwood Elementary School",
    "brightwood",
    "Maplewood Township Schools",
    "Brightwood",
    "OH",
    "BE",
    "pine",
    "school",
    120,
    TERM_START,
    TERM_RENEWS,
    SCHOOL_YEAR,
    YEAR_STARTS,
    YEAR_ENDS,
    "Rosa Delgado",
    "r.delgado@brightwood.demo",
    12,
    isoDay(-30),
  );

  const insertUser = db.prepare(
    "INSERT INTO users (id, school_id, role, name, email, title, created_at) VALUES (?,?,?,?,?,?,?)",
  );
  for (const u of USERS) {
    insertUser.run(u.id, SCHOOL_ID, u.role, u.name, u.email, u.title, isoDay(-25));
  }

  const insertClass = db.prepare(`
    INSERT INTO classes (id, school_id, teacher_id, name, grade, join_code, school_year, year_ends_on, created_at, archived_at)
    VALUES (?,?,?,?,?,?,?,?,?,NULL)
  `);
  const insertStudent = db.prepare(
    "INSERT INTO students (id, class_id, display_name, avatar_key, created_at) VALUES (?,?,?,?,?)",
  );
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (id, class_id, mission_id, assigned_by, assigned_at, due_on, note)
    VALUES (?,?,?,?,?,?,?)
  `);
  const insertAttempt = db.prepare(`
    INSERT INTO attempts (id, student_id, mission_id, started_at, completed_at, path_json, evidence_json)
    VALUES (?,?,?,?,?,?,?)
  `);
  const insertBenchmark = db.prepare(`
    INSERT INTO benchmarks (id, student_id, form, started_at, completed_at, responses_json)
    VALUES (?,?,?,?,?,?)
  `);

  let nameCursor = 0;

  for (const cls of CLASSES) {
    const rng = makeRng(cls.seed);
    insertClass.run(
      cls.id,
      SCHOOL_ID,
      cls.teacherId,
      cls.name,
      cls.grade,
      cls.joinCode,
      SCHOOL_YEAR,
      YEAR_ENDS,
      isoDay(-20),
    );

    const assigned = MISSIONS.slice(0, cls.assignedMissions);
    assigned.forEach((mission, index) => {
      insertAssignment.run(
        `asg_${cls.id}_${mission.id}`,
        cls.id,
        mission.id,
        cls.teacherId,
        isoDay(5 + index * 18),
        null,
        // No note. The demo used to write one here, which made a column no
        // screen renders and no action writes look like a feature in use.
        null,
      );
    });

    for (let i = 0; i < cls.size; i += 1) {
      const first = FIRST_NAMES[nameCursor % FIRST_NAMES.length];
      // 11 is coprime with the initials list, so surname initials cycle through
      // every letter instead of landing on the same handful.
      const initial = LAST_INITIALS[(nameCursor * 11) % LAST_INITIALS.length];
      nameCursor += 1;

      const studentId = `stu_${cls.id.slice(4)}_${String(i + 1).padStart(2, "0")}`;
      insertStudent.run(
        studentId,
        cls.id,
        `${first} ${initial}.`,
        AVATARS[(i + cls.seed) % AVATARS.length],
        isoDay(-18),
      );

      // Each child gets a stable ability level so growth reads coherently.
      const ability = 0.42 + rng() * 0.5;

      assigned.forEach((mission, index) => {
        if (rng() > cls.completionRate) return;
        const { path, evidence } = simulateAttempt(mission, rng, ability);
        const startedAt = isoDay(8 + index * 18 + Math.floor(rng() * 6));
        insertAttempt.run(
          `att_${studentId}_${mission.id}`,
          studentId,
          mission.id,
          startedAt,
          startedAt,
          JSON.stringify(path),
          JSON.stringify(evidence),
        );
      });

      // Fall check-in: everybody, early in the year, before instruction.
      //
      // The two rates are deliberately modest. A demo showing a fifty point
      // jump would be the first thing an evaluator disbelieved, and rightly
      // so. This lands near 47 percent in the fall and 69 percent in the
      // spring, which is a strong but arguable programme effect.
      const preAbility = Math.min(0.7, Math.max(0.25, ability * 0.55 + 0.1));
      const postAbility = Math.min(0.92, Math.max(0.35, ability * 0.65 + 0.25));

      insertBenchmark.run(
        `bmk_${studentId}_pre`,
        studentId,
        "pre",
        isoDay(9),
        isoDay(9),
        JSON.stringify(seedBenchmark("pre", rng, preAbility)),
      );

      if (cls.postBenchmark && rng() > 0.08) {
        insertBenchmark.run(
          `bmk_${studentId}_post`,
          studentId,
          "post",
          isoDay(255),
          isoDay(255),
          JSON.stringify(seedBenchmark("post", rng, postAbility)),
        );
      }
    }
  }

  // Educator orientation: one complete, one partway, two untouched.
  const insertCert = db.prepare(
    "INSERT INTO certifications (id, user_id, answers_json, completed_at) VALUES (?,?,?,?)",
  );
  const allCorrect = Object.fromEntries(
    CERTIFICATION_MODULES.map((m) => [m.id, m.check.options.find((o) => o.correct)!.id]),
  );
  insertCert.run("cert_okafor", "usr_okafor", JSON.stringify(allCorrect), isoDay(40));
  const partial = Object.fromEntries(
    CERTIFICATION_MODULES.slice(0, 2).map((m) => [
      m.id,
      m.check.options.find((o) => o.correct)!.id,
    ]),
  );
  insertCert.run("cert_raman", "usr_raman", JSON.stringify(partial), null);

  const insertAudit = db.prepare(
    "INSERT INTO audit_log (id, school_id, actor_label, action, detail, created_at) VALUES (?,?,?,?,?,?)",
  );
  const auditRows: [string, string, string, string, number][] = [
    ["aud_1", "Rosa Delgado", "program.activated", "Annual subscription activated for the 2025-2026 school year.", -20],
    ["aud_2", "Rosa Delgado", "retention.updated", "Student record retention set to 12 months after school year end.", -19],
    ["aud_3", "Gwen Hale", "class.created", "Room 21 created for Grade 4.", -18],
    ["aud_4", "Rosa Delgado", "benchmark.opened", "Fall check-in window opened for all classes.", 7],
    ["aud_5", "Rosa Delgado", "benchmark.opened", "Spring check-in window opened for Grade 3 and Grade 4.", 250],
    ["aud_6", "Rosa Delgado", "report.exported", "Annual school report exported for the district office.", 262],
  ];
  for (const [id, actor, action, detail, day] of auditRows) {
    insertAudit.run(id, SCHOOL_ID, actor, action, detail, isoDay(day));
  }
}

export const DEMO = {
  schoolId: SCHOOL_ID,
  schoolYear: SCHOOL_YEAR,
  termStart: TERM_START,
  termRenews: TERM_RENEWS,
  adminEmail: "r.delgado@brightwood.demo",
  teacherEmail: "a.okafor@brightwood.demo",
  studentJoinCode: "MAPLE-HERON-317",
  studentId: "stu_room12_01",
  classId: "cls_room12",
};
