import "server-only";
import { getDb } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { getSchool } from "@/lib/repo/school";
import { instructionClosed } from "@/lib/domain/subscription";
import type { User } from "@/lib/types";

/**
 * May this member of staff open the authored curriculum right now?
 *
 * The companion to `subscription-gate.ts`, which refuses classroom **writes**
 * after the term ends. That was taken for the whole of enforcement and was half
 * of it: every authored teaching route asked only `requireStaff`, so a signed-in
 * teacher at a school whose term ended a year ago could still open the mission
 * library, read every branch of all 27 missions, print the discussion guides,
 * run Classroom Mode on a projector and take the educator orientation. Classroom
 * Mode records nothing, which is exactly why it needed this: no write ever
 * happens, so the write gate never fires, and the product's primary use in front
 * of a class ran indefinitely on one year's fee.
 *
 * **The boundary is ownership, not leverage.** What is gated here is the
 * authored curriculum, which is the vendor's and is licensed by the year. What
 * is deliberately *not* gated is everything the school itself produced or
 * earned — dashboards, class history, reports, exports, retention, deletion,
 * staff administration, sign-out, and an orientation certificate already issued.
 * A school must never have to renew to reach its own records.
 *
 * Family take-homes are outside this by design, not by omission. `/family/[slug]`
 * is statically generated with no session at all, and this sprint's acceptance
 * correction removed it from the paid plan cards, so what the product sells and
 * what this gate protects are the same set.
 *
 * Fail-closed on both non-active states, and they are kept distinct all the way
 * to the sentence a teacher reads: "your subscription ended" is a false and
 * damaging thing to tell a school whose only problem is that somebody typed
 * `"soon"` into a date field.
 */
export type InstructionAccess =
  | { open: true; user: User }
  | { open: false; user: User; reason: "lapsed" | "needs-configuration" };

/**
 * The one call every authored teaching page makes. It authenticates first —
 * a signed-out visitor is redirected to sign in by `requireStaff`, and never
 * learns anything about the school's commercial state — and only then asks
 * whether the curriculum is licensed right now.
 *
 * Returning a discriminated result rather than redirecting keeps the page's own
 * URL, so a teacher who fixes the account or renews reloads the page they were
 * on and is teaching again. The page is expected to return the panel and render
 * nothing else; `tests/instruction-entitlement.test.ts` proves each one does,
 * and a source inventory there fails if a new teaching route omits the call.
 */
export async function requireOpenCurriculum(now = new Date()): Promise<InstructionAccess> {
  const { user } = await requireStaff();
  const school = getSchool(getDb(), user.school_id);
  // A staff row whose school is missing is not evidence of a paid term. There
  // is no school record to read a date from, so this is the unreadable case.
  if (!school) return { open: false, user, reason: "needs-configuration" };
  const closed = instructionClosed(school, now);
  return closed ? { open: false, user, reason: closed } : { open: true, user };
}
