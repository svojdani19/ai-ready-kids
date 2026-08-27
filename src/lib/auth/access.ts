import type { Classroom, User } from "@/lib/types";

/**
 * Who may reach a class, and what "reach" means.
 *
 * Until sprint 26 there was no such rule. Every teacher page and every teacher
 * action checked only that the class belonged to the same school, and
 * `requireStaff` accepts administrators as well as teachers. Two consequences,
 * both live:
 *
 *   - An administrator following the class link on /admin/classes landed on the
 *     teacher class page and read every student's name beside their individual
 *     skill evidence, while the privacy page promised administrators see
 *     aggregate figures only.
 *   - Any teacher holding another class's id could read that colleague's named
 *     roster, and could add students, remove students and change assignments in
 *     it, while the same page promised a teacher sees their own roster.
 *
 * The rule below is deliberately narrow, and it is a pure function so it can be
 * asserted directly rather than only through a rendered page.
 */

/** A class is a teacher's own when they are the teacher of record for it. */
export function canTeachClass(
  user: Pick<User, "id" | "role" | "school_id">,
  classroom: Pick<Classroom, "teacher_id" | "school_id"> | undefined,
): boolean {
  if (!classroom) return false;
  if (classroom.school_id !== user.school_id) return false;
  // Administrators are deliberately excluded, not merely unrouted. The product
  // promises them aggregates, and a role check in one page loader is not a
  // promise — a promise is something no route can get round.
  if (user.role !== "teacher") return false;
  return classroom.teacher_id === user.id;
}

/**
 * What an administrator may do with a class: everything about the class as an
 * object, and nothing about the children in it. Creating, renaming, archiving,
 * deleting and retention are class identity. Rosters and evidence are not.
 */
export function canAdministerClass(
  user: Pick<User, "role" | "school_id">,
  classroom: Pick<Classroom, "school_id"> | undefined,
): boolean {
  if (!classroom) return false;
  if (classroom.school_id !== user.school_id) return false;
  return user.role === "admin";
}
