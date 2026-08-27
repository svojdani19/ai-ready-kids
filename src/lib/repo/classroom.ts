import "server-only";
import { randomInt } from "node:crypto";
import { type Db, newId, nowIso, row, rows } from "@/lib/db";
import type { Assignment, Classroom, Student } from "@/lib/types";

export function listClasses(db: Db, schoolId: string, includeArchived = false): Classroom[] {
  const sql = includeArchived
    ? "SELECT * FROM classes WHERE school_id = ? ORDER BY grade, name"
    : "SELECT * FROM classes WHERE school_id = ? AND archived_at IS NULL ORDER BY grade, name";
  return rows<Classroom>(db.prepare(sql).all(schoolId));
}

/**
 * Scoped by school as well as by teacher. Defence in depth: a class whose
 * owner sits in another school should never have been created, and if one ever
 * is, it must not surface on that person's overview with its name, join code
 * and aggregate evidence on it.
 */
export function listClassesForTeacher(db: Db, teacherId: string, schoolId: string): Classroom[] {
  return rows<Classroom>(
    db
      .prepare(
        `SELECT * FROM classes
         WHERE teacher_id = ? AND school_id = ? AND archived_at IS NULL
         ORDER BY grade, name`,
      )
      .all(teacherId, schoolId),
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

/**
 * Words a seven-year-old can read, say aloud and type. Distinct on sight and
 * on the ear: no near-homophones, no plurals of each other, nothing that turns
 * into another entry with one letter changed.
 */
const CODE_WORDS = [
  "MAPLE", "ACORN", "HERON", "CEDAR", "OTTER", "WILLOW", "FINCH", "BIRCH",
  "CORAL", "MEADOW", "ASPEN", "ROBIN", "JUNIPER", "LARK", "PEBBLE", "BADGER",
  "COMET", "DAISY", "EAGLE", "FERRY", "GARDEN", "HARBOUR", "IGLOO", "JELLY",
  "KETTLE", "LANTERN", "MARBLE", "NUTMEG", "ORCHARD", "PUMPKIN", "QUILT",
  "RIVER", "SADDLE", "TULIP", "UMBRELLA", "VIOLET", "WALNUT", "YELLOW",
  "ANCHOR", "BUTTON", "CACTUS", "DOLPHIN", "ELBOW", "FEATHER", "GINGER",
  "HAMMER", "ISLAND", "JACKET", "KITTEN", "LADDER", "MITTEN", "NOODLE",
  "OCTOPUS", "PENGUIN", "RAINBOW", "SANDAL", "TEAPOT", "VELVET", "WAGON",
  "ZEBRA", "BUCKET", "CANDLE", "DRAGON", "ENGINE",
];

/**
 * A class code is a credential, so it is generated like one.
 *
 * Until sprint 30 it was one word from a list of fifteen plus three digits:
 * **13,500 possible codes in total**, drawn from `Math.random`. `findClassByCode`
 * is a public, unthrottled action that searches every active class, so at
 * school scale a live code falls out in far fewer than 13,500 guesses, and one
 * hit hands over a roster and then any child's session. Two words and three
 * digits from this list is a little over four million, from `randomInt`, which
 * is a different kind of number — and it is still three chunks a child can read
 * off a board.
 */
export function generateJoinCode(db: Db): string {
  const taken = new Set(
    rows<{ join_code: string }>(db.prepare("SELECT join_code FROM classes").all()).map(
      (c) => normaliseJoinCode(c.join_code),
    ),
  );
  for (let i = 0; i < 500; i += 1) {
    const first = CODE_WORDS[randomInt(CODE_WORDS.length)];
    let second = CODE_WORDS[randomInt(CODE_WORDS.length)];
    // Two of the same word reads as a typo and costs a word of entropy.
    while (second === first) second = CODE_WORDS[randomInt(CODE_WORDS.length)];
    const code = `${first}-${second}-${String(randomInt(900) + 100)}`;
    if (!taken.has(normaliseJoinCode(code))) return code;
  }
  throw new Error("Could not generate a unique class code");
}

/**
 * Rotate a class's code without touching anything else in it.
 *
 * A code that has been photographed, posted in a group chat or shouted down a
 * corridor used to be valid until somebody deleted the class and rebuilt it,
 * taking every roster and record with it. Rotating invalidates outstanding join
 * grants too, because a grant carries the code it was issued against.
 */
export function rotateJoinCode(db: Db, classId: string): string | undefined {
  if (!getClass(db, classId)) return undefined;
  const code = generateJoinCode(db);
  db.prepare("UPDATE classes SET join_code = ? WHERE id = ?").run(code, classId);
  return code;
}

/**
 * The owner must be a teacher at this school.
 *
 * The foreign key only proves the user row exists, so before sprint 29 an
 * administrator could create a class in their school owned by a user id from
 * another one. `listClassesForTeacher` then handed that outsider the class on
 * their overview — name, join code, counts, aggregate evidence — while
 * `canTeachClass` denied them the class page, which is a contradictory state
 * nobody would think to look for. The rule lives here as well as in the action
 * so no other caller can create one.
 */
export function createClass(
  db: Db,
  input: { schoolId: string; teacherId: string; name: string; grade: number; schoolYear: string },
): Classroom {
  const owner = row<{ role: string; school_id: string }>(
    db.prepare("SELECT role, school_id FROM users WHERE id = ?").get(input.teacherId),
  );
  if (!owner || owner.role !== "teacher" || owner.school_id !== input.schoolId) {
    throw new Error("A class must be owned by a teacher at the same school.");
  }
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

/**
 * Delete a student, scoped by the class they belong to.
 *
 * Both ids, and the class one is not decoration. `removeStudentAction`
 * authorised the *class* and then deleted the *student* by bare id, so a
 * teacher could pass their own class id alongside any student id they knew and
 * permanently delete that child — from a colleague's class, or another school —
 * with every cascaded attempt and check-in going with them, and an audit entry
 * naming the wrong class.
 *
 * Returns whether a row was actually removed, so the caller can refuse to
 * write a success audit for a deletion that did not happen.
 */
export function deleteStudentFromClass(db: Db, id: string, classId: string): boolean {
  const result = db
    .prepare("DELETE FROM students WHERE id = ? AND class_id = ?")
    .run(id, classId);
  return Number(result.changes) > 0;
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
