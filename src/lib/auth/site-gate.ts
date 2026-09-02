/**
 * The shared secret in front of the whole deployment.
 *
 * This is not part of the product's own authentication and must never be
 * confused with it. Staff sign in by email and children join by class code;
 * both of those are the product. This is a curtain over the entire site,
 * including the marketing pages, the sign-in page and the public family
 * take-homes, so a deployment can be handed to a named school without being
 * open to the internet.
 *
 * **Off unless configured.** With `AIRK_SITE_PASSWORD` unset the gate does
 * nothing at all, which keeps local development, the test suite and any
 * deliberately public deployment exactly as they were. Setting the variable is
 * what turns it on, so nothing changes for anybody who does not want it.
 *
 * Runs in middleware, so it uses Web Crypto rather than `node:crypto` and
 * everything here is edge-safe and dependency-free.
 */

/** Cookie holding proof the password was entered. Distinct from `airk_session`. */
export const GATE_COOKIE = "airk_gate";

/** Twelve hours, matching the staff session, so both expire together. */
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 12;

/**
 * A constant signed with the password as the key.
 *
 * The cookie is therefore not the password and does not reveal it, and forging
 * one requires knowing it. Versioned so the format can change without silently
 * accepting old cookies.
 */
const GATE_PAYLOAD = "airk-site-gate-v1";

export function sitePassword(): string | undefined {
  const value = process.env.AIRK_SITE_PASSWORD?.trim();
  return value ? value : undefined;
}

/** True when this deployment is behind the curtain at all. */
export function gateEnabled(): boolean {
  return sitePassword() !== undefined;
}

async function sign(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(GATE_PAYLOAD));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie value to set once somebody has proved they know the password. */
export async function gateToken(password: string): Promise<string> {
  return sign(password);
}

/**
 * Compared in constant time, so a wrong cookie cannot be refined one character
 * at a time by timing the response. The lengths are fixed by SHA-256, so a
 * length mismatch is a malformed cookie rather than a signal.
 */
export async function gateTokenIsValid(token: string | undefined): Promise<boolean> {
  const password = sitePassword();
  if (!password || !token) return false;
  const expected = await sign(password);
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Paths served without the password, kept to the minimum that lets the gate
 * page itself render and be submitted.
 *
 * `/_next/` is here because the gate page is an ordinary Next route and needs
 * its stylesheet and its chunks. That is a real, small concession: build
 * artifacts are reachable by anyone who can guess a hashed chunk filename, and
 * chunk contents can include page copy. It is the standard shape for this kind
 * of curtain, and it is written down here rather than left implicit — if the
 * requirement is that no byte of the site is reachable, this is the seam, and
 * the answer would be an edge proxy or HTTP basic auth in front of the app
 * rather than middleware inside it.
 */
export function isAlwaysAllowed(pathname: string): boolean {
  return (
    pathname === "/gate" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  );
}
