/**
 * What an archived class says about itself, before anybody tries anything.
 *
 * Sprint 82 closed all five classroom mutations on a parked class, above every
 * transaction, with a refusal sentence per operation. Correct, and only half of
 * a workflow: the page went on rendering as if the class were live. It showed a
 * join code and a "New code" button, the assignment panel promised a mission
 * "appears on every student's map in this class straight away", and Add, Rename
 * and Remove all sat there waiting. The only way to find out the class was
 * parked was to try something and be refused.
 *
 * That is a real classroom problem, not a tidiness one. A substitute or a
 * covering teacher reads the code off this page and writes it on the board, and
 * twenty-three children type a code that cannot admit them. Somebody promises a
 * class a mission is on. Somebody meets five refusals in a row in front of a
 * room of seven-to-ten-year-olds. For a school, each of those is a support call
 * about a product that looks broken rather than parked.
 *
 * So the state is stated first and the affordances go. The page stays fully
 * readable — roster, completed work, competency evidence, check-in figures — for
 * the same reason sprint 81 refused to gate a school's own records: archiving
 * parks a class, it does not take its history away.
 *
 * `role="status"` rather than "alert": this is a standing condition the teacher
 * navigated into, not an interruption. It sits before the controls it explains
 * so a screen reader meets the explanation before the missing buttons, and it
 * carries `aria-labelledby` so its heading names it.
 */
export const ARCHIVED_CLASS_TITLE = "This class is archived";

export function ArchivedClassNotice({ className }: { className: string }) {
  return (
    <section
      role="status"
      aria-labelledby="archived-class-title"
      className="mt-1 mb-6 rounded-xl border-2 border-marigold bg-marigold-wash px-5 py-4"
    >
      <h2
        id="archived-class-title"
        className="font-display text-lg leading-tight text-ink"
      >
        {ARCHIVED_CLASS_TITLE}
      </h2>
      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink">
        {className} is read-only. <strong className="font-semibold">Students cannot join it</strong>{" "}
        and its class code no longer admits anybody, so it is not worth writing on the board.
        Nobody can start or record new work in it.
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">
        Everything it already holds stays here and stays readable: the roster below, every
        mission each child completed, the competency evidence and the check-in figures.
        Nothing has been deleted.
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">
        To add or remove a student, rename anybody, change the missions or issue a working
        code, <strong className="font-semibold">an administrator has to restore the class
        first</strong>. Those controls are not on this page while it is archived, rather
        than being here and refusing.
      </p>
    </section>
  );
}
