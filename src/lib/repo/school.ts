import "server-only";
import { type Db, newId, nowIso, row, rows } from "@/lib/db";
import type { AuditEntry, BenchmarkWindow, Role, School, User } from "@/lib/types";

export function getSchool(db: Db, id: string): School | undefined {
  return row<School>(db.prepare("SELECT * FROM schools WHERE id = ?").get(id));
}

export function getPrimarySchool(db: Db): School {
  const found = row<School>(
    db.prepare("SELECT * FROM schools ORDER BY created_at LIMIT 1").get(),
  );
  if (!found) throw new Error("No school configured. Run npm run db:reset.");
  return found;
}

export function updateSchoolProfile(
  db: Db,
  id: string,
  patch: { name?: string; monogram?: string; brand_accent?: string; contact_name?: string; contact_email?: string },
): void {
  const current = getSchool(db, id);
  if (!current) throw new Error("Unknown school");
  db.prepare(
    `UPDATE schools SET name = ?, monogram = ?, brand_accent = ?, contact_name = ?, contact_email = ? WHERE id = ?`,
  ).run(
    patch.name ?? current.name,
    patch.monogram ?? current.monogram,
    patch.brand_accent ?? current.brand_accent,
    patch.contact_name ?? current.contact_name,
    patch.contact_email ?? current.contact_email,
    id,
  );
}

export function setRetentionMonths(db: Db, id: string, months: number): void {
  db.prepare("UPDATE schools SET retention_months = ? WHERE id = ?").run(months, id);
}

/**
 * Open or close a check-in window. Deliberately one at a time and deliberately
 * explicit: the spring form does not become available because the fall one was
 * finished, it becomes available because somebody opened spring.
 */
/** Move the school into a new academic year. Subscription dates untouched. */
export function setAcademicYear(
  db: Db,
  id: string,
  input: { year: string; startsOn: string; endsOn: string },
): void {
  db.prepare(
    "UPDATE schools SET academic_year = ?, year_starts_on = ?, year_ends_on = ? WHERE id = ?",
  ).run(input.year, input.startsOn, input.endsOn, id);
}

export function setBenchmarkWindow(db: Db, id: string, window: BenchmarkWindow): void {
  db.prepare("UPDATE schools SET benchmark_window = ? WHERE id = ?").run(window, id);
}

export function listUsers(db: Db, schoolId: string, role?: Role): User[] {
  return role
    ? rows<User>(
        db
          .prepare("SELECT * FROM users WHERE school_id = ? AND role = ? ORDER BY name")
          .all(schoolId, role),
      )
    : rows<User>(
        db.prepare("SELECT * FROM users WHERE school_id = ? ORDER BY role, name").all(schoolId),
      );
}

export function getUser(db: Db, id: string): User | undefined {
  return row<User>(db.prepare("SELECT * FROM users WHERE id = ?").get(id));
}

export function getUserByEmail(db: Db, email: string): User | undefined {
  return row<User>(
    db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email.trim()),
  );
}

export function createUser(
  db: Db,
  input: { schoolId: string; role: Role; name: string; email: string; title: string },
): User {
  const id = newId("usr");
  db.prepare(
    "INSERT INTO users (id, school_id, role, name, email, title, created_at) VALUES (?,?,?,?,?,?,?)",
  ).run(id, input.schoolId, input.role, input.name, input.email.toLowerCase(), input.title, nowIso());
  return getUser(db, id)!;
}

export function deleteUser(db: Db, id: string): void {
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function countClassesForTeacher(db: Db, teacherId: string): number {
  const r = db
    .prepare("SELECT COUNT(*) AS n FROM classes WHERE teacher_id = ?")
    .get(teacherId) as { n: number };
  return r.n;
}

/**
 * Every class a teacher owns, active and archived, for the offboarding flow.
 *
 * Archived ones count. `removeStaffAction` used to tell an administrator to
 * "reassign or archive" a class, and archiving changed nothing about ownership
 * — so the advice was wrong and the block stayed. Naming them is what lets the
 * administrator actually clear it.
 */
export function classesOwnedBy(
  db: Db,
  teacherId: string,
): { id: string; name: string; archived: boolean }[] {
  return rows<{ id: string; name: string; archived_at: string | null }>(
    db
      .prepare("SELECT id, name, archived_at FROM classes WHERE teacher_id = ? ORDER BY name")
      .all(teacherId),
  ).map((c) => ({ id: c.id, name: c.name, archived: Boolean(c.archived_at) }));
}

export function recordAudit(
  db: Db,
  input: { schoolId: string; actorLabel: string; action: string; detail: string },
): void {
  db.prepare(
    "INSERT INTO audit_log (id, school_id, actor_label, action, detail, created_at) VALUES (?,?,?,?,?,?)",
  ).run(newId("aud"), input.schoolId, input.actorLabel, input.action, input.detail, nowIso());
}

export function listAudit(db: Db, schoolId: string, limit = 50): AuditEntry[] {
  return rows<AuditEntry>(
    db
      .prepare("SELECT * FROM audit_log WHERE school_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(schoolId, limit),
  );
}
