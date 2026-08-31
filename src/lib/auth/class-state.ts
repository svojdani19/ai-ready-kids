import "server-only";

/**
 * Archived is a closed class, and this is what makes that true of every write.
 *
 * Sprint 69 made archiving an access boundary for children: student sessions
 * close, the code rotates, the cohort leaves the active seat count. It never
 * became a boundary for staff. `requireOwnActiveClass` answered ownership and
 * the subscription term and never read `archived_at`, so each action that
 * cared had to remember to check for itself.
 *
 * Sprint 76 added that check to `setAssignmentAction` and wrote that widening
 * the resolver "would change every classroom mutation at once, which is a
 * different correction". Sprint 79 added it to `removeStudentAction` and wrote
 * the same sentence. Sprint 81 listed the leftovers as a known gap for the
 * third time. Each of those reviews named **rename and rotate** as what
 * remained.
 *
 * All three were wrong about the size of the hole. Enumerating the actions
 * rather than the reviews turns up a fourth: `addStudentAction` never checked
 * either, and it is the most consequential of them — it enrolls a child into a
 * cohort whose year is finished, consumes a licensed seat, and appears on the
 * roster the moment somebody restores the class. Nobody wrote it down across
 * three sprints of writing about this exact problem, which is the argument
 * against per-action checks in one line: a list maintained by hand is a list
 * that is quietly wrong.
 *
 * So the resolver asks, and the question cannot be skipped — there is no way to
 * resolve a class for a mutation without naming what the mutation is.
 *
 * **Every classroom mutation refuses.** That was worth checking rather than
 * assuming, one verb at a time. Adding, renaming and removing all change what a
 * finished year's roster, exports and history say. Assigning goes live for
 * children on restore. Rotating is the only arguable one — archiving already
 * rotated the code and signed the room out, so a second rotation changes a
 * credential nobody can use — and it is refused too, because its audit entry
 * claims the old code "is now rejected on its next use, for new joins and for
 * browsers already signed in with it", and there are no joins and nobody signed
 * in. A true record of a pointless act is still a false sentence.
 *
 * Restore, delete and retention are deliberately elsewhere: they are
 * administrator operations on the class as an object, they are how a parked
 * class stops being parked, and gating them here would make archiving a trap.
 */

/**
 * What a caller is trying to do, and how to finish the sentence "Restore the
 * class before ___".
 *
 * The phrasing is per-operation on purpose. A single generic refusal would have
 * been less code and a worse product: "that class is archived" leaves a teacher
 * to work out which of the four things they just tried is the one being
 * refused, and sprints 76 and 79 both chose specific wording for that reason.
 * This keeps the specificity and removes the opt-in.
 */
export const CLASS_OPERATIONS = {
  add_student: "adding a student to it",
  rename_student: "renaming a student on it",
  remove_student: "removing a student from it",
  rotate_code: "giving it a new class code",
  set_assignment: "changing its missions",
} as const;

export type ClassOperation = keyof typeof CLASS_OPERATIONS;

export function classArchivedRefusal(operation: ClassOperation): string {
  return `That class is archived. Restore the class before ${CLASS_OPERATIONS[operation]}.`;
}

/**
 * Raised when a mutation is attempted on a parked class.
 *
 * A throw rather than a returned value, matching `SubscriptionLapsedError`, and
 * for the same reason: a resolver every mutation shares can refuse without
 * every caller remembering to. `asExpectedError` turns it into the `{ error }`
 * an action renders, so a teacher meets a sentence; anything that forgets that
 * conversion fails loudly rather than writing.
 */
export class ClassArchivedError extends Error {
  readonly operation: ClassOperation;

  constructor(operation: ClassOperation) {
    super(classArchivedRefusal(operation));
    this.name = "ClassArchivedError";
    this.operation = operation;
  }
}
