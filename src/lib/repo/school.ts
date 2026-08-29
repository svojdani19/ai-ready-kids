import "server-only";
import { type Db, newId, nowIso, row, rows } from "@/lib/db";
import { isAcademicYearLabel, isCalendarDate } from "@/lib/domain/calendar";
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
/**
 * Record the academic dates and fill in any cohort that has none.
 *
 * A database migrated from before sprint 32 arrives with these empty, because
 * nothing in the old schema said when a school year ended and guessing could
 * have deleted a child's records early. This is how an administrator supplies
 * the real date, and it backfills the classes in that year at the same time so
 * retention starts working for them rather than staying blocked forever.
 */
export interface AcademicRepair {
  /** Cohorts moved off an unrecognised label onto the corrected one. */
  relabelled: number;
  /** Cohorts given a usable year-end date they did not have. */
  datesRepaired: number;
}

/**
 * Correcting a school calendar, as one transaction.
 *
 * This is a multi-write boundary and it used to be a sequence of separate
 * commits: the school row first, then the decisive read of the previous label,
 * then a loop repairing each candidate cohort's label and year-end. A failure
 * partway through left the school's calendar changed, **some** cohorts repaired
 * and others not — and because each class's `year_ends_on` is what its
 * retention due date is calculated from, that is not a cosmetic inconsistency.
 * Two children's cohorts in the same year would have had different deletion
 * dates, one of them still unschedulable, with no record that a save had been
 * attempted.
 *
 * `BEGIN IMMEDIATE` is taken **before** the read of the previous academic year,
 * because that read is what decides which labels are repair candidates: taking
 * the lock afterwards would leave a window in which the answer could change.
 *
 * Transaction-aware rather than transaction-owning. An outer transaction — the
 * action's `auditedWrite`, or any future caller — is participated in and never
 * committed or rolled back here. A direct repository caller with no transaction
 * of its own still gets atomicity.
 */
export function setAcademicDates(
  db: Db,
  id: string,
  input: { year: string; startsOn: string; endsOn: string },
): AcademicRepair {
  const outer = db.isTransaction;
  if (!outer) db.exec("BEGIN IMMEDIATE");
  try {
    const repair = applyAcademicDates(db, id, input);
    if (!outer) db.exec("COMMIT");
    return repair;
  } catch (error) {
    if (!outer) db.exec("ROLLBACK");
    throw error;
  }
}

function applyAcademicDates(
  db: Db,
  id: string,
  input: { year: string; startsOn: string; endsOn: string },
): AcademicRepair {
  // Read before writing. Sprint 61: the repair used to run after the school was
  // updated and matched only `school_year = <new label>`, which missed the one
  // state this whole correction exists for. A class created while the school
  // said "2025-2027" copied **that** label along with the broken date, so after
  // an administrator saved a correct 2025-2026 calendar the cohort still sat
  // under "2025-2027" with an unreadable date, Data still said Blocked, the
  // purge still exited 1, and there was no way to fix it from anywhere.
  const previous = row<{ academic_year: string }>(
    db.prepare("SELECT academic_year FROM schools WHERE id = ?").get(id),
  )?.academic_year;

  setAcademicYear(db, id, input);
  // Repairs empty **and malformed** snapshots, which is sprint 60's widening:
  // the old clause matched `= ''` only, so a cohort carrying "2026-13-45" had
  // no administrator recovery path at all — correcting the school left it
  // permanently unschedulable.
  //
  // Scoped tightly on purpose. Only this school, only this academic year, and
  // only rows whose date is not already a real day: an already-valid cohort
  // snapshot is a deliberate record of when that year ended and must not be
  // moved, and neither may any other year.
  //
  // Which labels this correction covers. Always the new one. Additionally the
  // previous one **only when it was itself unrecognised** — such a cohort could
  // only exist by copying a broken school label, which is the invariant class
  // creation has always had. A previous label that was a real school year is
  // history and is never rewritten.
  const labels = [input.year];
  const relabelFrom =
    previous !== undefined && previous !== input.year && !isAcademicYearLabel(previous)
      ? previous
      : null;
  if (relabelFrom) labels.push(relabelFrom);

  const placeholders = labels.map(() => "?").join(", ");
  const candidates = rows<{ id: string; school_year: string; year_ends_on: string }>(
    db
      .prepare(
        `SELECT id, school_year, year_ends_on FROM classes
          WHERE school_id = ? AND school_year IN (${placeholders})`,
      )
      .all(id, ...labels),
  );

  const setDate = db.prepare("UPDATE classes SET year_ends_on = ? WHERE id = ?");
  const setLabel = db.prepare("UPDATE classes SET school_year = ? WHERE id = ?");

  let relabelled = 0;
  let datesRepaired = 0;
  for (const candidate of candidates) {
    if (relabelFrom && candidate.school_year === relabelFrom) {
      setLabel.run(input.year, candidate.id);
      relabelled += 1;
    }
    // Only a date that is not already a real day. A valid snapshot is a
    // deliberate record of when that year ended and is never moved, even for a
    // cohort being relabelled.
    if (!isCalendarDate(candidate.year_ends_on)) {
      setDate.run(input.endsOn, candidate.id);
      datesRepaired += 1;
    }
  }
  return { relabelled, datesRepaired };
}

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
