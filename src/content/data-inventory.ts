/**
 * The student data inventory, in one place because it was in two.
 *
 * `/admin/data` listed six things under "The complete list. There is nothing
 * held back", and `/privacy` listed six different things under "Everything we
 * hold about a student". Neither list was the schema. Between them they omitted
 * the class relationship, the per-attempt derived competency evidence, the
 * check-in start and finish timestamps and the roster-enrolment timestamp — so
 * two absolute claims on two buyer-facing surfaces disagreed with each other
 * and with `schema.ts`.
 *
 * Every entry below names the columns it accounts for, and
 * `tests/data-inventory.test.ts` fails if any column of any student-linked
 * table is left unclaimed. That is what makes the word "every" on those pages a
 * checkable statement rather than a promise.
 *
 * Scope is deliberately narrow: the tables that hang off a student row. School
 * account settings, subscription dates, staff certification answers and the
 * audit log are not student records and are not listed here, so neither page
 * claims to cover them.
 */

/** Tables whose rows belong to one child. The coverage test reads these. */
export const STUDENT_LINKED_TABLES = ["students", "attempts", "benchmarks"] as const;

export type InventoryEntry = {
  /** Schema columns this line accounts for, as `table.column`. */
  columns: string[];
  /** What is held, in the language a school buyer reads. */
  what: string;
  /** Why it exists. Shown to administrators; the public page shows `what`. */
  why: string;
};

export const STUDENT_RECORD: InventoryEntry[] = [
  {
    columns: ["students.display_name"],
    what: "A display name: a first name and a last initial, typed by the teacher.",
    why: "So a child can find their own row on a screen of twenty-three.",
  },
  {
    columns: ["students.avatar_key"],
    what: "An assigned animal avatar, one of ten, chosen by us and never uploaded.",
    why: "So a pre-reader can find themselves faster than they can read.",
  },
  {
    columns: ["students.id", "students.class_id"],
    what: "Which class the student is on, and an internal identifier that ties their records together.",
    why: "The roster relationship. It is also what deletion and retention act on.",
  },
  {
    columns: ["students.created_at"],
    what: "A creation timestamp on the roster row itself.",
    // Not "so an administrator can see when a record entered the system". It
    // is written by the INSERT and read back only by `SELECT *`; no route
    // renders it, `retentionRows` and `runScheduledPurge` calculate from the
    // class's own `year_ends_on`, and `buildSchoolReport` never touches it.
    // Inventing a buyer benefit for an unused column is how an inventory
    // starts describing a product that does not exist.
    why: "Database metadata written when the row is inserted. No screen in this product displays it, and nothing computes from it: deletion dates come from the class's own recorded year-end, and no report or export includes it. It is listed because it is in the database, not because it does anything.",
  },
  {
    columns: ["attempts.id", "attempts.student_id", "attempts.mission_id"],
    what: "Which missions they have started, one record per mission.",
    why: "The unit a teacher assigns and follows up on.",
  },
  {
    columns: ["attempts.path_json"],
    what: "Which authored choices they tapped in each mission, stored as content identifiers and never as text.",
    why: "This is the competency evidence teachers act on.",
  },
  {
    columns: ["attempts.evidence_json"],
    what: "A derived judgement per skill for that mission — demonstrated or developing — worked out from those choices.",
    why: "It is calculated from the choices above, not observed separately, and it is not a score, a band or a prediction.",
  },
  {
    columns: ["attempts.started_at", "attempts.completed_at"],
    what: "When a mission was opened and when it was finished.",
    why: "So a teacher can tell unfinished work from untouched work. Two timestamps per mission, not a duration and not time-on-task.",
  },
  {
    columns: ["benchmarks.id", "benchmarks.student_id", "benchmarks.form"],
    what: "Which annual check-in they sat, fall or spring.",
    why: "The two windows are compared as a group difference, never per child.",
  },
  {
    columns: ["benchmarks.responses_json"],
    what: "Which authored option they selected for each check-in item.",
    why: "Aggregated into a cohort measurement. Never shown per student to anyone.",
  },
  {
    columns: ["benchmarks.started_at", "benchmarks.completed_at"],
    what: "When a check-in was opened and when it was finished.",
    why: "So a part-finished check-in can be resumed and an unfinished one is not counted as a result.",
  },
];

/**
 * Not student records, but a student record hangs off them, so an administrator
 * reading an inventory should see them named rather than discover them later.
 * The public page keeps to the student scope; this group is the reason the
 * admin panel says "and the records they hang from" instead of "everything".
 */
export const SURROUNDING_RECORD: InventoryEntry[] = [
  {
    columns: ["classes"],
    what: "Per class: a name, a grade, a join code, the school year and that year's end date.",
    why: "The join code is how a child gets in, and the year end is what the deletion date is calculated from.",
  },
  {
    columns: ["assignments"],
    what: "Per class: which missions a teacher has opened, when, and an optional due date and note.",
    why: "Assigned to a class, not to a child. Nothing here names a student.",
  },
  {
    columns: ["users"],
    what: "Per staff member: a name, a school email address and a role.",
    why: "So staff can sign in and own a class.",
  },
];

export const NOT_COLLECTED = [
  "Surnames, dates of birth, addresses, phone numbers or student email addresses",
  "Any text a child typed, because a child cannot type anything into this product",
  "Photographs, audio, video, camera access or microphone access",
  "Location, IP-based geolocation or device fingerprints",
  "Time on task, idle time, keystroke timing or any behavioural telemetry",
  "Risk scores, readiness bands, personality inferences or predictions about a child",
  "Advertising identifiers, third-party analytics or any tracker of any kind",
];

/**
 * What a class code actually is, said the same way everywhere it is explained.
 *
 * The three surfaces that explained it each drew their own risk conclusion —
 * "nothing worth stealing", "exactly as much security as this data warrants",
 * "the security is proportionate to that". None of those is a control, and all
 * three sat next to the product's own statement that these are education
 * records. What the code does is describable without any of them.
 */
export const CLASS_CODE_BOUNDARY = [
  "A class code is shared classroom access, not proof of who is using it. It is typed by a room, not held by a person.",
  "Anyone with the code can see that class's roster of first names and avatars, choose any child listed on it, and open that child's progress.",
  "It reaches one class. It is not a way into another class, into a teacher's tools or into anything an administrator sees.",
  "Rotate the code whenever it has travelled further than the class. The old code stops working immediately and nothing else about the class changes.",
];

/**
 * What this build is, and who decides the rest.
 *
 * The first version of this constant said a class code was "enough for a
 * supervised pilot ... where an adult is in the room and the roster is
 * fictional or small and known". That was the same risk conclusion the sprint
 * had just removed, drawn narrower: an adult in the room does not stop a code
 * photographed off a whiteboard from being used that evening, and a small
 * roster does not stop the holder from choosing a different child on it.
 *
 * So this says what the build *is* — a local demonstration on fictional data —
 * and hands the real-student question to the school, which is the only party
 * that can weigh it. No vendor assurance, in either direction.
 */
export const CLASS_CODE_POSTURE =
  "Roster sync and single sign-on would replace class codes in a production deployment. Neither is built here, so a class code is the only credential in the product, and it is not production access control. What this build is, is a local demonstration running fictional data. Before any pilot that puts real student records behind a class code, the school has to weigh the shared-access limitation above against its own policies and decide what operational controls it requires. That decision belongs to the school, and nothing here is a vendor assurance that a class code meets its bar.";
