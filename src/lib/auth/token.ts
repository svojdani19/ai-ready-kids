import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cookie signing, kept free of Next and database imports so the tamper cases
 * can be tested directly.
 */

export type SessionValue =
  | { kind: "staff"; userId: string }
  | { kind: "student"; studentId: string };

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
    if (candidate.kind === "student" && typeof candidate.studentId === "string") {
      return { kind: "student", studentId: candidate.studentId };
    }
    return null;
  } catch {
    return null;
  }
}
