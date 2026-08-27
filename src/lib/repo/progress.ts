import "server-only";
import { type Db, newId, nowIso, parseJson, row, rows } from "@/lib/db";
import type {
  Attempt,
  BenchmarkRecord,
  CertificationRecord,
  EvidenceMap,
  PathStep,
} from "@/lib/types";

interface AttemptRow {
  id: string;
  student_id: string;
  mission_id: string;
  started_at: string;
  completed_at: string | null;
  path_json: string;
  evidence_json: string;
}

function toAttempt(r: AttemptRow): Attempt {
  return {
    id: r.id,
    student_id: r.student_id,
    mission_id: r.mission_id,
    started_at: r.started_at,
    completed_at: r.completed_at,
    path: parseJson<PathStep[]>(r.path_json, []),
    evidence: parseJson<EvidenceMap>(r.evidence_json, {}),
  };
}

export function listAttemptsForStudent(db: Db, studentId: string): Attempt[] {
  return rows<AttemptRow>(
    db.prepare("SELECT * FROM attempts WHERE student_id = ? ORDER BY started_at").all(studentId),
  ).map(toAttempt);
}

export function listAttemptsForClass(db: Db, classId: string): Attempt[] {
  return rows<AttemptRow>(
    db
      .prepare(
        `SELECT a.* FROM attempts a
         JOIN students s ON s.id = a.student_id
         WHERE s.class_id = ?`,
      )
      .all(classId),
  ).map(toAttempt);
}

export function listAttemptsForSchool(db: Db, schoolId: string): Attempt[] {
  return rows<AttemptRow>(
    db
      .prepare(
        `SELECT a.* FROM attempts a
         JOIN students s ON s.id = a.student_id
         JOIN classes c ON c.id = s.class_id
         WHERE c.school_id = ? AND c.archived_at IS NULL`,
      )
      .all(schoolId),
  ).map(toAttempt);
}

export function getAttempt(db: Db, studentId: string, missionId: string): Attempt | undefined {
  const r = row<AttemptRow>(
    db
      .prepare("SELECT * FROM attempts WHERE student_id = ? AND mission_id = ?")
      .get(studentId, missionId),
  );
  return r ? toAttempt(r) : undefined;
}

/** Idempotent: opening a mission a second time resumes the existing attempt. */
export function startAttempt(db: Db, studentId: string, missionId: string): Attempt {
  const existing = getAttempt(db, studentId, missionId);
  if (existing) return existing;
  db.prepare(
    `INSERT INTO attempts (id, student_id, mission_id, started_at, completed_at, path_json, evidence_json)
     VALUES (?,?,?,?,NULL,'[]','{}')`,
  ).run(newId("att"), studentId, missionId, nowIso());
  return getAttempt(db, studentId, missionId)!;
}

/**
 * Append one decision.
 *
 * Two rules, and they pull in opposite directions on purpose.
 *
 * **Coaching downgrades.** Reaching the safe answer only after the authored
 * feedback has explained it is not the same as choosing it. A strong choice
 * made on a scene the child has already answered records `developing`, because
 * the correction is what got them there. Without this, a child could take
 * every wrong turn in a mission, read every explanation, and still be reported
 * as having independently demonstrated the skill.
 *
 * **`demonstrated` is sticky.** Once shown independently anywhere, a later
 * `developing` on the same skill does not take it away. This is evidence of
 * what a child can do, not an average of their attempts.
 */
export function recordDecision(
  db: Db,
  input: {
    studentId: string;
    missionId: string;
    sceneId: string;
    choiceId: string;
    evidence?: { skillId: string; result: "demonstrated" | "developing" };
  },
): Attempt {
  const attempt = startAttempt(db, input.studentId, input.missionId);
  const path = [...attempt.path, { sceneId: input.sceneId, choiceId: input.choiceId }];
  const evidence: EvidenceMap = { ...attempt.evidence };

  if (input.evidence) {
    // Already answered here means the child was sent back by feedback.
    const afterCoaching = attempt.path.some((step) => step.sceneId === input.sceneId);
    const result =
      afterCoaching && input.evidence.result === "demonstrated"
        ? "developing"
        : input.evidence.result;

    if (evidence[input.evidence.skillId] !== "demonstrated") {
      evidence[input.evidence.skillId] = result;
    }
  }
  db.prepare("UPDATE attempts SET path_json = ?, evidence_json = ? WHERE id = ?").run(
    JSON.stringify(path),
    JSON.stringify(evidence),
    attempt.id,
  );
  return getAttempt(db, input.studentId, input.missionId)!;
}

export function completeAttempt(db: Db, studentId: string, missionId: string): Attempt {
  const attempt = startAttempt(db, studentId, missionId);
  if (!attempt.completed_at) {
    db.prepare("UPDATE attempts SET completed_at = ? WHERE id = ?").run(nowIso(), attempt.id);
  }
  return getAttempt(db, studentId, missionId)!;
}

/** Lets a student replay a mission from the beginning. */
export function resetAttempt(db: Db, studentId: string, missionId: string): void {
  db.prepare("DELETE FROM attempts WHERE student_id = ? AND mission_id = ?").run(
    studentId,
    missionId,
  );
}

/* ------------------------------- benchmarks ------------------------------ */

interface BenchmarkRow {
  id: string;
  student_id: string;
  form: "pre" | "post";
  started_at: string;
  completed_at: string | null;
  responses_json: string;
}

function toBenchmark(r: BenchmarkRow): BenchmarkRecord {
  return {
    id: r.id,
    student_id: r.student_id,
    form: r.form,
    started_at: r.started_at,
    completed_at: r.completed_at,
    responses: parseJson<Record<string, string>>(r.responses_json, {}),
  };
}

export function getBenchmark(
  db: Db,
  studentId: string,
  form: "pre" | "post",
): BenchmarkRecord | undefined {
  const r = row<BenchmarkRow>(
    db.prepare("SELECT * FROM benchmarks WHERE student_id = ? AND form = ?").get(studentId, form),
  );
  return r ? toBenchmark(r) : undefined;
}

export function listBenchmarksForStudent(db: Db, studentId: string): BenchmarkRecord[] {
  return rows<BenchmarkRow>(
    db.prepare("SELECT * FROM benchmarks WHERE student_id = ?").all(studentId),
  ).map(toBenchmark);
}

export function listBenchmarksForClass(db: Db, classId: string): BenchmarkRecord[] {
  return rows<BenchmarkRow>(
    db
      .prepare(
        `SELECT b.* FROM benchmarks b
         JOIN students s ON s.id = b.student_id
         WHERE s.class_id = ?`,
      )
      .all(classId),
  ).map(toBenchmark);
}

export function listBenchmarksForSchool(db: Db, schoolId: string): BenchmarkRecord[] {
  return rows<BenchmarkRow>(
    db
      .prepare(
        `SELECT b.* FROM benchmarks b
         JOIN students s ON s.id = b.student_id
         JOIN classes c ON c.id = s.class_id
         WHERE c.school_id = ? AND c.archived_at IS NULL`,
      )
      .all(schoolId),
  ).map(toBenchmark);
}

export function saveBenchmarkResponse(
  db: Db,
  input: { studentId: string; form: "pre" | "post"; itemId: string; optionId: string },
): BenchmarkRecord {
  let record = getBenchmark(db, input.studentId, input.form);
  if (!record) {
    db.prepare(
      `INSERT INTO benchmarks (id, student_id, form, started_at, completed_at, responses_json)
       VALUES (?,?,?,?,NULL,'{}')`,
    ).run(newId("bmk"), input.studentId, input.form, nowIso());
    record = getBenchmark(db, input.studentId, input.form)!;
  }
  const responses = { ...record.responses, [input.itemId]: input.optionId };
  db.prepare("UPDATE benchmarks SET responses_json = ? WHERE id = ?").run(
    JSON.stringify(responses),
    record.id,
  );
  return getBenchmark(db, input.studentId, input.form)!;
}

export function completeBenchmark(
  db: Db,
  studentId: string,
  form: "pre" | "post",
): BenchmarkRecord | undefined {
  const record = getBenchmark(db, studentId, form);
  if (!record) return undefined;
  if (!record.completed_at) {
    db.prepare("UPDATE benchmarks SET completed_at = ? WHERE id = ?").run(nowIso(), record.id);
  }
  return getBenchmark(db, studentId, form);
}

/* ----------------------------- certification ----------------------------- */

interface CertRow {
  id: string;
  user_id: string;
  answers_json: string;
  completed_at: string | null;
}

export function getCertification(db: Db, userId: string): CertificationRecord | undefined {
  const r = row<CertRow>(
    db.prepare("SELECT * FROM certifications WHERE user_id = ?").get(userId),
  );
  return r
    ? {
        id: r.id,
        user_id: r.user_id,
        answers: parseJson<Record<string, string>>(r.answers_json, {}),
        completed_at: r.completed_at,
      }
    : undefined;
}

export function saveCertificationAnswer(
  db: Db,
  userId: string,
  moduleId: string,
  optionId: string,
): CertificationRecord {
  let record = getCertification(db, userId);
  if (!record) {
    db.prepare(
      "INSERT INTO certifications (id, user_id, answers_json, completed_at) VALUES (?,?,'{}',NULL)",
    ).run(newId("cert"), userId);
    record = getCertification(db, userId)!;
  }
  const answers = { ...record.answers, [moduleId]: optionId };
  db.prepare("UPDATE certifications SET answers_json = ? WHERE id = ?").run(
    JSON.stringify(answers),
    record.id,
  );
  return getCertification(db, userId)!;
}

export function completeCertification(db: Db, userId: string): CertificationRecord | undefined {
  const record = getCertification(db, userId);
  if (!record) return undefined;
  if (!record.completed_at) {
    db.prepare("UPDATE certifications SET completed_at = ? WHERE id = ?").run(nowIso(), record.id);
  }
  return getCertification(db, userId);
}

export function listCertifications(db: Db, schoolId: string): CertificationRecord[] {
  return rows<CertRow>(
    db
      .prepare(
        `SELECT ce.* FROM certifications ce
         JOIN users u ON u.id = ce.user_id
         WHERE u.school_id = ?`,
      )
      .all(schoolId),
  ).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    answers: parseJson<Record<string, string>>(r.answers_json, {}),
    completed_at: r.completed_at,
  }));
}
