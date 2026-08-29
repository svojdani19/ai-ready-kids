import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cookie signing, kept free of Next and database imports so the tamper cases
 * can be tested directly.
 */

/**
 * A student session carries the class code that authorised it.
 *
 * Rotation used to invalidate new joins and half-finished grants but not a
 * session already issued: `{ kind: "student", studentId }` said nothing about
 * *how* the holder got in, so `currentStudent` had nothing to compare against
 * the class's current code. A session created through a leaked code therefore
 * survived rotation for the rest of its twelve hours — while the product told
 * administrators the old code "stops working immediately".
 *
 * `code` is the normalised join code, which is exactly the marker the grant
 * already carried. It is not persisted anywhere: it lives only inside the
 * signed, HttpOnly cookie, and no screen shows it.
 *
 * The field is required, not optional. A token from an older build decodes to
 * null and its holder is asked to rejoin — see `decodeSession`.
 */
export type SessionValue =
  | { kind: "staff"; userId: string }
  | { kind: "student"; studentId: string; code: string };

/**
 * What entering a correct class code buys you: a short-lived, signed statement
 * that this browser proved knowledge of one particular class's code, and no
 * more than that.
 *
 * Before sprint 27 it bought nothing. The code was checked and then discarded,
 * and `/join/[classId]` rendered a full roster to anyone with a class id while
 * `chooseStudent` issued a session for any student id it was handed. The code
 * was the only credential the privacy page claimed, and it protected nothing.
 */
export interface JoinGrant {
  kind: "join";
  classId: string;
  /**
   * The code that was actually entered, normalised. Carried so that rotating a
   * class code invalidates grants already issued against the old one — without
   * it, a code that leaked stayed usable for anybody mid-flow.
   */
  code: string;
  /** Unix seconds. Short, because it is only meant to survive one page. */
  exp: number;
}

export function encodeJoinGrant(key: Buffer, grant: JoinGrant): string {
  const payload = Buffer.from(JSON.stringify(grant), "utf8").toString("base64url");
  return `${payload}.${signPayload(key, payload)}`;
}

/**
 * Returns the grant only if the signature holds, the shape is right and it has
 * not expired. `now` is injected so expiry can be tested without waiting.
 */
export function decodeJoinGrant(
  key: Buffer,
  token: string | undefined,
  now: number,
): JoinGrant | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(key, payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const c = parsed as Record<string, unknown>;
    if (
      c.kind !== "join" ||
      typeof c.classId !== "string" ||
      typeof c.code !== "string" ||
      typeof c.exp !== "number"
    ) {
      return null;
    }
    if (c.exp <= now) return null;
    return { kind: "join", classId: c.classId, code: c.code, exp: c.exp };
  } catch {
    return null;
  }
}

export function signPayload(key: Buffer, payload: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function encodeSession(key: Buffer, value: SessionValue): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  return `${payload}.${signPayload(key, payload)}`;
}

export function decodeSession(key: Buffer, token: string | undefined): SessionValue | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(key, payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Record<string, unknown>;
    if (candidate.kind === "staff" && typeof candidate.userId === "string") {
      return { kind: "staff", userId: candidate.userId };
    }
    if (
      candidate.kind === "student" &&
      typeof candidate.studentId === "string" &&
      // Fail closed. A legacy student token has no `code`, and treating a
      // missing binding as "matches anything" would preserve the exact hole
      // this closes. The one-time cost is real and is stated in the copy:
      // student sessions issued by an older build are asked to rejoin.
      typeof candidate.code === "string" &&
      candidate.code !== ""
    ) {
      return { kind: "student", studentId: candidate.studentId, code: candidate.code };
    }
    return null;
  } catch {
    return null;
  }
}
