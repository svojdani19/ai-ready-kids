import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, type Db } from "@/lib/db";
import { seed } from "@/lib/db/seed";
import type { Mission } from "@/content/types";
import { expectedDecisionSceneId } from "@/lib/domain/missionPath";
import { completeAttempt, getAttempt, recordDecision, startAttempt } from "@/lib/repo/progress";

/**
 * Spin up an isolated, seeded database per test file. Nothing here touches the
 * developer's data/ directory.
 */
export function createTestDb(): { db: Db; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "airk-test-"));
  const db = openDatabase(join(dir, "test.db"));
  /**
   * A test database is thrown away at the end of the test, so it does not need
   * to survive a power cut. The schema sets WAL, which fsyncs on every commit,
   * and this suite commits constantly — `BEGIN IMMEDIATE` runs in the seat
   * check, the purge, every audited write. When the disk stalls, trivial
   * synchronous tests were blocking past the 5s timeout and failing as
   * timeouts, moving around the suite at random.
   *
   * Durability is the only thing being given up, and only for a file that is
   * deleted moments later. Every transaction, lock and rollback still behaves
   * exactly as it does in production, which is what the tests are about.
   */
  db.exec("PRAGMA synchronous = OFF");
  seed(db);
  // Sprint 42 made enrollment check the school's licensed seats. Almost no test
  // in this suite is about entitlement, and many enrol far more children than
  // the demo school buys, so the fixture is licensed generously. Tests that do
  // mean to exercise the cap call `setLicensedSeats` and say the number out
  // loud, which is clearer than depending on whatever the seed happened to buy.
  // 5000 is the maximum this product sells, and sprint 56 made anything outside
  // 1-5000 an unrecognized contract value — including the 100000 this fixture
  // used to write, which was itself a number no school could buy. Still far
  // more than any test enrols.
  db.prepare("UPDATE schools SET licensed_students = 5000").run();
  return {
    db,
    cleanup: () => {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export const DEMO_CLASS = "cls_room12";
export const DEMO_STUDENT = "stu_room12_01";
export const DEMO_TEACHER = "usr_okafor";
export const DEMO_ADMIN = "usr_delgado";
export const DEMO_SCHOOL = "sch_brightwood";

/**
 * Walk an attempt forward to a target decision scene, the way a child would.
 *
 * Sprint 28 made the server authoritative about progression: a decision may
 * only be recorded against the scene the stored path actually leads to. Tests
 * that used to post straight at a scene were describing a state no student
 * could reach, so they now walk there. Chooses the first non-retry option at
 * every decision on the way, which is enough for the authored graph.
 */
export function playTo(
  db: Db,
  studentId: string,
  mission: Mission,
  targetSceneId: string,
): void {
  startAttempt(db, studentId, mission.id);
  for (let guard = 0; guard < 80; guard += 1) {
    const attempt = getAttempt(db, studentId, mission.id)!;
    const at = expectedDecisionSceneId(mission, attempt.path);
    if (at === null || at === targetSceneId) return;
    const scene = mission.scenes.find((s) => s.id === at)!;
    const choice = scene.choices!.find((c) => !c.retry)!;
    recordDecision(db, {
      studentId,
      missionId: mission.id,
      sceneId: scene.id,
      choiceId: choice.id,
      evidence: choice.evidence,
    });
  }
  throw new Error(`Could not reach ${targetSceneId} in ${mission.slug}`);
}

/** Walk an attempt all the way to its ending, then complete it. */
export function playToEnd(db: Db, studentId: string, mission: Mission): void {
  playTo(db, studentId, mission, "\u0000never");
  completeAttempt(db, studentId, mission.id);
}

/** Set a school's licensed seats. For tests that are about the seat cap. */
export function setLicensedSeats(db: Db, schoolId: string, seats: number): void {
  db.prepare("UPDATE schools SET licensed_students = ? WHERE id = ?").run(seats, schoolId);
}
