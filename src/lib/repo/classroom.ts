import "server-only";
import { type Db, newId, nowIso, row, rows } from "@/lib/db";
import type { Assignment, Classroom, Student } from "@/lib/types";

export function listClasses(db: Db, schoolId: string, includeArchived = false): Classroom[] {
  const sql = includeArchived
    ? "SELECT * FROM classes WHERE school_id = ? ORDER BY grade, name"
    : "SELECT * FROM classes WHERE school_id = ? AND archived_at IS NULL ORDER BY grade, name";
  return rows<Classroom>(db.prepare(sql).all(schoolId));
}

export function listClassesForTeacher(db: Db, teacherId: string): Classroom[] {
  return rows<Classroom>(
    db
      .prepare(
        "SELECT * FROM classes WHERE teacher_id = ? AND archived_at IS NULL ORDER BY grade, name",
      )
      .all(teacherId),
  );
}

export function getClass(db: Db, id: string): Classroom | undefined {
  return row<Classroom>(db.prepare("SELECT * FROM classes WHERE id = ?").get(id));
}

/** Join codes are matched case-insensitively and ignoring spaces or dashes. */
export function normaliseJoinCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function getClassByJoinCode(db: Db, code: string): Classroom | undefined {
  const target = normaliseJoinCode(code);
  if (!target) return undefined;
  const all = rows<Classroom>(
    db.prepare("SELECT * FROM classes WHERE archived_at IS NULL").all(),
  );
  return all.find((c) => normaliseJoinCode(c.join_code) === target);
}

const CODE_WORDS = [
  "MAPLE", "ACORN", "HERON", "CEDAR", "OTTER", "WILLOW", "FINCH", "BIRCH",
  "CORAL", "MEADOW", "ASPEN", "ROBIN", "JUNIPER", "LARK", "PEBBLE",
];

export function generateJoinCode(db: Db): string {
  const taken = new Set(
    rows<{ join_code: string }>(db.prepare("SELECT join_code FROM classes").all()).map(
      (c) => normaliseJoinCode(c.join_code),
    ),
  );
  for (let i = 0; i < 500; i += 1) {
    const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
    const digits = String(100 + Math.floor(Math.random() * 900));
    const code = `${word}-${digits}`;
    if (!taken.has(normaliseJoinCode(code))) return code;
  }
  throw new Error("Could not generate a unique class code");
}

export function createClass(
  db: Db,
  input: { schoolId: string; teacherId: string; name: string; grade: number; schoolYear: string },
): Classroom {
  const id = newId("cls");
  db.prepare(
    `INSERT INTO classes (id, school_id, teacher_id, name, grade, join_code, school_year, created_at, archived_at)
     VALUES (?,?,?,?,?,?,?,?,NULL)`,
  ).run(
    id,
    input.schoolId,
    input.teacherId,
    input.name,
    input.grade,
    generateJoinCode(db),
    input.schoolYear,
    nowIso(),
  );
  return getClass(db, id)!;
}

export function archiveClass(db: Db, id: string): void {
  db.prepare("UPDATE classes SET archived_at = ? WHERE id = ?").run(nowIso(), id);
}

export function restoreClass(db: Db, id: string): void {
  db.prepare("UPDATE classes SET archived_at = NULL WHERE id = ?").run(id);
}

/** Removes the class and, by cascade, its roster, attempts and check-ins. */
export function deleteClass(db: Db, id: string): void {
  db.prepare("DELETE FROM classes WHERE id = ?").run(id);
}

export function listStudents(db: Db, classId: string): Student[] {
  return rows<Student>(
    db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY display_name").all(classId),
  );
}

export function listStudentsForSchool(db: Db, schoolId: string): Student[] {
  return rows<Student>(
    db
      .prepare(
        `SELECT s.* FROM students s
         JOIN classes c ON c.id = s.class_id
         WHERE c.school_id = ? AND c.archived_at IS NULL
         ORDER BY s.display_name`,
      )
      .all(schoolId),
  );
}

export function getStudent(db: Db, id: string): Student | undefined {
  return row<Student>(db.prepare("SELECT * FROM students WHERE id = ?").get(id));
}

const AVATARS = ["fox", "owl", "otter", "bear", "frog", "turtle", "crane", "hedgehog", "bee", "whale"];

export function createStudent(
  db: Db,
  input: { classId: string; displayName: string; avatarKey?: string },
): Student {
  const id = newId("stu");
  const count = (
    db.prepare("SELECT COUNT(*) AS n FROM students WHERE class_id = ?").get(input.classId) as {
      n: number;
    }
  ).n;
  db.prepare(
    "INSERT INTO students (id, class_id, display_name, avatar_key, created_at) VALUES (?,?,?,?,?)",
  ).run(
    id,
    input.classId,
    input.displayName.trim(),
    input.avatarKey ?? AVATARS[count % AVATARS.length],
    nowIso(),
  );
  return getStudent(db, id)!;
}

export function deleteStudent(db: Db, id: string): void {
  db.prepare("DELETE FROM students WHERE id = ?").run(id);
}

export function listAssignments(db: Db, classId: string): Assignment[] {
  return rows<Assignment>(
    db.prepare("SELECT * FROM assignments WHERE class_id = ? ORDER BY assigned_at").all(classId),
  );
}

export function assignMission(
  db: Db,
  input: { classId: string; missionId: string; assignedBy: string; note?: string | null },
): void {
  db.prepare(
    `INSERT INTO assignments (id, class_id, mission_id, assigned_by, assigned_at, due_on, note)
     VALUES (?,?,?,?,?,NULL,?)
     ON CONFLICT (class_id, mission_id) DO UPDATE SET note = excluded.note`,
  ).run(newId("asg"), input.classId, input.missionId, input.assignedBy, nowIso(), input.note ?? null);
}

export function unassignMission(db: Db, classId: string, missionId: string): void {
  db.prepare("DELETE FROM assignments WHERE class_id = ? AND mission_id = ?").run(
    classId,
    missionId,
  );
}
