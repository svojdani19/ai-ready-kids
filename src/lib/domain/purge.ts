import { type Db, newId, nowIso, rows } from "@/lib/db";
import type { Classroom, School } from "@/lib/types";
import { isRecognisedRetention, retentionRows } from "./retention";

/**
 * The retention purge.
 *
 * The product showed a date, labelled it a scheduled purge, and told families
 * that "deletion is a date". Until sprint 30 the only thing that deleted
 * anything was an administrator clicking Delete now, so records could sit
 * indefinitely past the date the page displayed — `eligibleNow` changed a label
 * and nothing else. That is a privacy promise with no mechanism behind it.
 *
 * This is the mechanism. It is idempotent: running it twice deletes nothing the
 * second time, because the first run removed the rows. And it compares dates
 * rather than instants, so a class becomes eligible at the start of its purge
 * day in UTC and not at an hour that depends on where the job happened to run.
 *
 * It is deliberately not a scheduler. Nothing in this build runs it on a timer,
 * a deployment owns that, and `npm run purge` is the entry point. The copy now
 * says that rather than implying a cron nobody wrote.
 *
 * Written against SQL rather than the repository layer for the same reason the
 * seed is: this runs from a script, outside the request lifecycle, where the
 * `server-only` guard on the repositories does not apply and should not be
 * worked around.
 */
export interface PurgeResult {
  classesDeleted: number;
  studentsDeleted: number;
  /** Class names removed, for the audit line and for the caller to print. */
  classNames: string[];
  /**
   * Schools skipped entirely because their retention window is not one this
   * product recognises. Named so an operator can act, with no child named:
   * which school has a broken account record is not a fact about any pupil.
   */
  blocked: { schoolId: string; schoolName: string; retentionMonths: number }[];
}

/** Midnight UTC on the given date, so eligibility is a day and not an instant. */
function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Delete every class whose purge date has arrived, across every school.
 * Returns what went, and writes one audit entry per school that lost anything.
 */
export function runScheduledPurge(db: Db, now = new Date()): PurgeResult {
  const result: PurgeResult = {
    classesDeleted: 0,
    studentsDeleted: 0,
    classNames: [],
    blocked: [],
  };
  const schools = rows<School>(db.prepare("SELECT * FROM schools ORDER BY name").all());

  for (const school of schools) {
    // Fail closed, per school. An unrecognised retention window is a broken
    // account record, and this job's mistake is permanent: it deletes a class
    // and cascades the roster, every attempt and both check-ins with no
    // restore path. A negative window would make every cohort look overdue.
    //
    // Skipped before anything is read or written, and the loop continues, so
    // one school's bad configuration never stops a correctly configured
    // school's records being purged on the date its policy actually says.
    if (!isRecognisedRetention(school.retention_months)) {
      result.blocked.push({
        schoolId: school.id,
        schoolName: school.name,
        retentionMonths: school.retention_months,
      });
      continue;
    }

    const classes = rows<Classroom>(
      db.prepare("SELECT * FROM classes WHERE school_id = ? ORDER BY grade, name").all(school.id),
    ).map((c) => ({
      ...c,
      studentCount: rows<{ id: string }>(
        db.prepare("SELECT id FROM students WHERE class_id = ?").all(c.id),
      ).length,
    }));

    const due = retentionRows(school, classes, now).filter(
      // A cohort whose school-year end was never recorded is never due. The
      // job would rather leave records in place than delete them on a date
      // nobody supplied.
      (row) => row.purgeOn !== null && startOfUtcDay(row.purgeOn) <= startOfUtcDay(now),
    );
    if (due.length === 0) continue;

    for (const row of due) {
      // The cascade takes the roster, every attempt and both check-ins.
      db.prepare("DELETE FROM classes WHERE id = ?").run(row.classId);
      result.classesDeleted += 1;
      result.studentsDeleted += row.studentCount;
      result.classNames.push(row.className);
    }

    db.prepare(
      "INSERT INTO audit_log (id, school_id, actor_label, action, detail, created_at) VALUES (?,?,?,?,?,?)",
    ).run(
      newId("aud"),
      school.id,
      "Retention job",
      "retention.purged",
      `${due.length} class${due.length === 1 ? "" : "es"} past the retention date deleted with every roster, attempt and check-in: ${due
        .map((d) => d.className)
        .join(", ")}.`,
      nowIso(),
    );
  }

  return result;
}
