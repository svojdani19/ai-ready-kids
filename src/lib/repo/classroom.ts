import "server-only";
import {
  assertRoomForActiveClass,
  LicenceExceededError,
  LicenceNotRecognisedError,
  licenceStatus,
  RestoreExceedsLicenceError,
} from "@/lib/repo/entitlement";
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
  input: {
    schoolId: string;
    teacherId: string;
    name: string;
    grade: number;
    schoolYear: string;
    /** This cohort's year-end date. Snapshotted; retention counts from it. */
    yearEndsOn: string;
  },
): Classroom {
  const owner = row<{ role: string; school_id: string }>(
    db.prepare("SELECT role, school_id FROM users WHERE id = ?").get(input.teacherId),
  );
  if (!owner || owner.role !== "teacher" || owner.school_id !== input.schoolId) {
    throw new Error("A class must be owned by a teacher at the same school.");
  }
  const id = newId("cls");
  // Count and insert in one write transaction, so two creations arriving
  // together cannot both see the single slot free and both take it.
  const outer = db.isTransaction;
  if (!outer) db.exec("BEGIN IMMEDIATE");
  try {
    assertRoomForActiveClass(db, input.schoolId);
    db.prepare(
      `INSERT INTO classes (id, school_id, teacher_id, name, grade, join_code, school_year, year_ends_on, created_at, archived_at)
       VALUES (?,?,?,?,?,?,?,?,?,NULL)`,
    ).run(
      id,
      input.schoolId,
      input.teacherId,
      input.name,
      input.grade,
      generateJoinCode(db),
      input.schoolYear,
      input.yearEndsOn,
      nowIso(),
    );
    if (!outer) db.exec("COMMIT");
  } catch (error) {
    if (!outer) db.exec("ROLLBACK");
    throw error;
  }
  return getClass(db, id)!;
}

/**
 * Move a class to a different teacher, keeping everything else.
 *
 * Without this, offboarding a teacher who owned a class was impossible.
 * `removeStaffAction` refused while they owned one and told the administrator
 * to "reassign or archive it first" — there was no reassign, and the count
 * included archived classes so archiving did not help either. The only ways out
 * were to permanently delete every class they had ever owned, students and all,
 * or to leave the account live. In a build where staff sign in with a known
 * email address and no password, leaving it live keeps a former employee's
 * roster access.
 *
 * Roster, attempts, check-ins, assignments and the join code all stay exactly
 * as they were: this changes who is responsible, and nothing about the class.
 */
export function reassignClass(db: Db, classId: string, teacherId: string): boolean {
  const classroom = getClass(db, classId);
  if (!classroom) return false;
  const owner = row<{ role: string; school_id: string }>(
    db.prepare("SELECT role, school_id FROM users WHERE id = ?").get(teacherId),
  );
  // Same invariant as creation, in the same place, so a class can never become
  // ownerless or cross-school by being moved.
  if (!owner || owner.role !== "teacher" || owner.school_id !== classroom.school_id) {
    return false;
  }
  db.prepare("UPDATE classes SET teacher_id = ? WHERE id = ?").run(teacherId, classId);
  return true;
}

export function archiveClass(db: Db, id: string): void {
  db.prepare("UPDATE classes SET archived_at = ? WHERE id = ?").run(nowIso(), id);
}

/**
 * Bring an archived cohort back, if the school has the seats for it.
 *
 * Sprint 42 metered enrolment and excluded archived cohorts from the count,
 * which is right — a class kept for retention is not a class being taught. It
 * also opened a door this closes: archive a full cohort, spend the freed seats
 * on a new one, restore the old class, and the school is over its licence
 * without a single child having passed through `createStudent`.
 *
 * The policy is the least surprising one for a school. Restoration is refused
 * rather than allowed-with-an-overage, because an overage is a bill somebody
 * did not agree to, and rather than a partial restore, because choosing which
 * children come back is not a decision software should make. **The class stays
 * archived and every record in it is untouched.** Nothing is deleted, and the
 * administrator can free seats or buy more and try again.
 *
 * Enforced here rather than in the action, for the reason `createStudent`
 * gives: the repository is the only door. The read and the write share one
 * `BEGIN IMMEDIATE` transaction so a restore and an enrolment arriving together
 * cannot both see the same free seat.
 */
export function restoreClass(db: Db, id: string): void {
  const outer = db.isTransaction;
  if (!outer) db.exec("BEGIN IMMEDIATE");
  try {
    const classroom = db
      .prepare("SELECT school_id, archived_at FROM classes WHERE id = ?")
      .get(id) as { school_id: string; archived_at: string | null } | undefined;
    if (!classroom) throw new Error("Unknown class");

    // Restoring an already-active class is a no-op, not an overage: its
    // students are in the active count already, and so is the class itself.
    if (classroom.archived_at) {
      // The room before the seats. Both can refuse, and a school on the
      // classroom plan with one class already running hits this first.
      assertRoomForActiveClass(db, classroom.school_id);
      const status = licenceStatus(db, classroom.school_id);
      if (!status.recognised) throw new LicenceNotRecognisedError();
      const roster = (
        db.prepare("SELECT COUNT(*) AS n FROM students WHERE class_id = ?").get(id) as { n: number }
      ).n;
      // Landing exactly on the cap is allowed: the school paid for that seat.
      if (status.used + roster > status.licensed) {
        throw new RestoreExceedsLicenceError(status.used, roster, status.licensed);
      }
    }

    db.prepare("UPDATE classes SET archived_at = NULL WHERE id = ?").run(id);
    if (!outer) db.exec("COMMIT");
  } catch (error) {
    if (!outer) db.exec("ROLLBACK");
    throw error;
  }
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

/**
 * Enrol a child, against the school's licensed seats.
 *
 * The check lives here rather than in the server action on purpose. A server
 * action is one door; the repository is the only door. Sprint 26 learned the
 * same lesson about authorization — a rule enforced in the page that renders
 * the button is not a rule — and a seat limit that a future action could route
 * around is a seat limit a school buyer cannot rely on.
 *
 * Count and insert run inside one `BEGIN IMMEDIATE` write transaction, so two
 * enrolments arriving together cannot both read the same count and both write.
 * The last licensed seat is allowed; the one after it raises
 * `LicenceExceededError` and writes nothing at all.
 */
export function createStudent(
  db: Db,
  input: { classId: string; displayName: string; avatarKey?: string },
): Student {
  const owner = db
    .prepare("SELECT school_id, archived_at FROM classes WHERE id = ?")
    .get(input.classId) as { school_id: string; archived_at: string | null } | undefined;
  if (!owner) throw new Error("Unknown class");
  // An archived cohort does not consume seats, so it must not accept new
  // children either — otherwise archiving a full class would be a way to keep
  // enrolling past the licence and restore them all afterwards.
  if (owner.archived_at) throw new Error("That class is archived. Restore it before adding.");

  const id = newId("stu");
  // Reuse an outer transaction if there is one; a nested BEGIN is an error.
  const outer = db.isTransaction;
  if (!outer) db.exec("BEGIN IMMEDIATE");
  try {
    const status = licenceStatus(db, owner.school_id);
    // Configuration before capacity. A school whose seat licence is not a
    // recognised contract number has not exceeded anything, and comparing
    // against the stored value would classify every enrolment as an overage —
    // which with a negative licence is exactly what happened.
    if (!status.recognised) throw new LicenceNotRecognisedError();
    if (status.remaining < 1) {
      throw new LicenceExceededError(status.used, status.licensed);
    }
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
    if (!outer) db.exec("COMMIT");
  } catch (error) {
    if (!outer) db.exec("ROLLBACK");
    throw error;
  }
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
/**
 * Change a display name, scoped by class. Only that column moves: the id the
 * attempts, check-ins, badges and session all hang off is untouched.
 */
export function renameStudent(
  db: Db,
  id: string,
  classId: string,
  displayName: string,
): boolean {
  const result = db
    .prepare("UPDATE students SET display_name = ? WHERE id = ? AND class_id = ?")
    .run(displayName, id, classId);
  return Number(result.changes) > 0;
}

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
