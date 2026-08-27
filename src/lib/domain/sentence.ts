/**
 * Feedback headlines are authored as fragments, and two places join a headline
 * to the body with a full stop: the teacher's mission preview, and the string
 * the student player announces to a screen reader. Most headlines end in no
 * punctuation, so appending one is right — but a handful end in a full stop or
 * a question mark, and those rendered as "Better at what, though?." until this
 * existed. Authors should not have to remember which kind they wrote.
 */
const TERMINAL = /[.!?…]["')\]]?$/;

/** Append a full stop unless the text already ends a sentence. */
export function endSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return TERMINAL.test(trimmed) ? trimmed : `${trimmed}.`;
}
