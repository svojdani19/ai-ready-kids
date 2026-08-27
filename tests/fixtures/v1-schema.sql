PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schools (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  district          TEXT NOT NULL,
  city              TEXT NOT NULL,
  state             TEXT NOT NULL,
  monogram          TEXT NOT NULL,
  brand_accent      TEXT NOT NULL DEFAULT 'pine',
  plan              TEXT NOT NULL DEFAULT 'school',
  licensed_students INTEGER NOT NULL DEFAULT 0,
  term_starts_on    TEXT NOT NULL,
  term_renews_on    TEXT NOT NULL,
  contact_name      TEXT NOT NULL,
  contact_email     TEXT NOT NULL,
  -- How long completed student records are kept before the annual purge.
  retention_months  INTEGER NOT NULL DEFAULT 12,
  -- Which check-in window, if any, is open. The product sells a fall and a
  -- spring benchmark; until sprint 27 nothing anywhere held that state, so a
  -- child could finish the fall form and start the spring one the same
  -- minute, and the report would present the difference as a year's change.
  benchmark_window  TEXT NOT NULL DEFAULT 'closed'
                    CHECK (benchmark_window IN ('closed', 'pre', 'post')),
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  school_id  TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('teacher', 'admin')),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
  id          TEXT PRIMARY KEY,
  school_id   TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id  TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  grade       INTEGER NOT NULL CHECK (grade BETWEEN 2 AND 4),
  join_code   TEXT NOT NULL UNIQUE,
  school_year TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  archived_at TEXT
);

-- Display name only. See the note at the top of this file.
CREATE TABLE IF NOT EXISTS students (
  id           TEXT PRIMARY KEY,
  class_id     TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_key   TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id          TEXT PRIMARY KEY,
  class_id    TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  mission_id  TEXT NOT NULL,
  assigned_by TEXT NOT NULL REFERENCES users(id),
  assigned_at TEXT NOT NULL,
  due_on      TEXT,
  note        TEXT,
  UNIQUE (class_id, mission_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id           TEXT PRIMARY KEY,
  student_id   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mission_id   TEXT NOT NULL,
  started_at   TEXT NOT NULL,
  completed_at TEXT,
  -- Ordered list of {sceneId, choiceId} the student selected. Authored
  -- content ids only; no free text is ever stored here.
  path_json    TEXT NOT NULL DEFAULT '[]',
  -- Rolled-up {skillId: 'demonstrated' | 'developing'} for this attempt.
  evidence_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE (student_id, mission_id)
);

CREATE TABLE IF NOT EXISTS benchmarks (
  id             TEXT PRIMARY KEY,
  student_id     TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  form           TEXT NOT NULL CHECK (form IN ('pre', 'post')),
  started_at     TEXT NOT NULL,
  completed_at   TEXT,
  responses_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE (student_id, form)
);

CREATE TABLE IF NOT EXISTS certifications (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers_json  TEXT NOT NULL DEFAULT '{}',
  completed_at  TEXT,
  UNIQUE (user_id)
);

-- Every destructive or configuration action an administrator takes, so a
-- district can answer "who deleted what, and when" without guesswork.
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  school_id   TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  actor_label TEXT NOT NULL,
  action      TEXT NOT NULL,
  detail      TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_classes_school   ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class   ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_mission ON attempts(mission_id);
CREATE INDEX IF NOT EXISTS idx_assign_class     ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_bench_student    ON benchmarks(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_school     ON audit_log(school_id, created_at);
