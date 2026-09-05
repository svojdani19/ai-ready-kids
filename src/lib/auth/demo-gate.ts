import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { signingKey } from "./session";
import { decodeDemoUnlock, encodeDemoUnlock } from "./token";

/**
 * A password in front of the demonstration seats.
 *
 * Distinct from three things it is easy to confuse it with. It is not the
 * product's authentication — staff sign in by email, children by class code.
 * It is not the site gate in `middleware.ts`, which decides whether the
 * deployment answers at all. And it is not a competence check on the person
 * typing it.
 *
 * What it is: the reason a shared link cannot make a stranger an administrator
 * of the demonstration school in one click. Everything past this point can
 * assign missions, rotate class codes, archive classes and delete records —
 * on fictional data, but a visitor cannot know that before they have done it.
 *
 * **The password lives in `AIRK_DEMO_PASSWORD`, never in this repository**,
 * which is public. Unset means the gate is off, which keeps local development
 * and the test suite exactly as they were — the same decision `site-gate.ts`
 * makes, for the same reason, and it is why a deployment that wants the gate
 * has to set the variable deliberately.
 */

const COOKIE = "airk_demo";
/** A working session with the demo, not a persistent login. */
const MAX_AGE_SECONDS = 60 * 60 * 12;

export const DEMO_LOCKED_MESSAGE =
  "Enter the demonstration password to open a seat.";

export function demoPassword(): string | undefined {
  const value = process.env.AIRK_DEMO_PASSWORD?.trim();
  return value ? value : undefined;
}

/** True when this deployment asks for a password before handing out a seat. */
export function demoGateEnabled(): boolean {
  return demoPassword() !== undefined;
}

/**
 * Which password a cookie was issued against, without storing the password.
 *
 * Keyed with the server's own signing key, so the fingerprint is meaningless
 * anywhere else and nothing about the password survives in a cookie.
 */
function fingerprint(password: string): string {
  return createHmac("sha256", signingKey()).update(password).digest("hex").slice(0, 32);
}

/** Compared without an early exit, so a wrong value cannot be refined by timing. */
export function demoPasswordIsValid(input: string): boolean {
  const expected = demoPassword();
  if (!expected) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Whether this browser has already typed it.
 *
 * Always true when the gate is off, so every caller can ask the same question
 * and no caller has to remember to check both.
 */
export async function demoUnlocked(): Promise<boolean> {
  if (!demoGateEnabled()) return true;
  const expected = demoPassword();
  if (!expected) return true;
  const store = await cookies();
  const unlock = decodeDemoUnlock(
    signingKey(),
    store.get(COOKIE)?.value,
    Math.floor(Date.now() / 1000),
  );
  // Issued against the password in force now, not merely against some password
  // this server once had.
  return unlock !== null && unlock.pw === fingerprint(expected);
}

export async function writeDemoUnlock(): Promise<void> {
  const store = await cookies();
  store.set(
    COOKIE,
    encodeDemoUnlock(signingKey(), {
      kind: "demo",
      exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
      pw: fingerprint(demoPassword() ?? ""),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === "production",
    },
  );
}
