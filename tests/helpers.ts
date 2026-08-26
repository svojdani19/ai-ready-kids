import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, type Db } from "@/lib/db";
import { seed } from "@/lib/db/seed";

/**
 * Spin up an isolated, seeded database per test file. Nothing here touches the
 * developer's data/ directory.
 */
export function createTestDb(): { db: Db; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "airk-test-"));
  const db = openDatabase(join(dir, "test.db"));
  seed(db);
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
