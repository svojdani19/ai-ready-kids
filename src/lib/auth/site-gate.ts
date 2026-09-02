/**
 * HTTP Basic authentication in front of the whole deployment.
 *
 * This is not part of the product's own authentication and must never be
 * confused with it. Staff sign in by email and children join by class code;
 * both of those are the product. This is a curtain over the entire site so a
 * build can be handed to a named school without being open to the internet.
 *
 * **Why Basic rather than a password page.** The first version of this was a
 * styled `/gate` route, which meant `/_next/` had to be served unauthenticated
 * — the gate page needed its own stylesheet and chunks — and a Next chunk can
 * contain page copy. That was a real seam, written down at the time. Basic auth
 * closes it: the browser draws the credential prompt itself, so no asset has to
 * be reachable before the password, and the allow-list is **empty**. Not one
 * byte of the application is served without credentials.
 *
 * The cost is a native browser dialog instead of a designed page. For a preview
 * handed to a named school that is the right trade; for a public sign-up flow
 * it would not be.
 *
 * **Off unless configured.** With `AIRK_SITE_PASSWORD` unset nothing here runs,
 * which keeps local development, the test suite and any deliberately public
 * deployment exactly as they were.
 *
 * Runs in middleware, so it uses Web APIs only — no `node:crypto`, no
 * dependencies.
 */

/** Shown in the browser's credential dialog. Names the site, nothing more. */
export const GATE_REALM = "AI Ready Kids preview";

export function sitePassword(): string | undefined {
  const value = process.env.AIRK_SITE_PASSWORD?.trim();
  return value ? value : undefined;
}

/**
 * The username, if one is required.
 *
 * Unset means any username is accepted and only the password is checked, which
 * is what a shared preview link usually wants: one secret to pass on, and
 * nobody stuck at the dialog wondering what to type on the top line.
 */
export function siteUser(): string | undefined {
  const value = process.env.AIRK_SITE_USER?.trim();
  return value ? value : undefined;
}

/** True when this deployment is behind the curtain at all. */
export function gateEnabled(): boolean {
  return sitePassword() !== undefined;
}

/** Compared without an early exit, so a wrong value cannot be refined by timing. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Decode `Authorization: Basic <base64>` into its two halves.
 *
 * Returns null for anything malformed rather than guessing. The password may
 * itself contain a colon — only the first one separates the pair — so the split
 * is deliberately on the first colon and not on every one.
 */
export function decodeBasicAuth(header: string | null): { user: string; password: string } | null {
  if (!header) return null;
  const [scheme, encoded] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return null;
  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return null;
  }
  const separator = decoded.indexOf(":");
  if (separator === -1) return null;
  return { user: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
}

/** Whether these credentials open the site. Fails closed when unconfigured. */
export function credentialsAreValid(header: string | null): boolean {
  const expected = sitePassword();
  if (!expected) return false;
  const supplied = decodeBasicAuth(header);
  if (!supplied) return false;

  const requiredUser = siteUser();
  if (requiredUser && !constantTimeEquals(supplied.user, requiredUser)) return false;
  return constantTimeEquals(supplied.password, expected);
}
