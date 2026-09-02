"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GATE_COOKIE,
  GATE_MAX_AGE_SECONDS,
  gateToken,
  sitePassword,
} from "@/lib/auth/site-gate";

export type GateState = { error?: string };

/**
 * Check the site password and, if it is right, set the cookie the middleware
 * looks for.
 *
 * Deliberately says only "that is not the password". There is no account to
 * enumerate and no reset to offer, so a longer message could only speculate
 * about who the reader is. A wrong password is also not rate-limited here:
 * this is a curtain in front of fictional demo data, and the honest place for
 * throttling is the platform in front of the app, not a second half-measure
 * inside it.
 */
export async function enterSite(_prev: GateState, formData: FormData): Promise<GateState> {
  const expected = sitePassword();
  // With no password configured the middleware never routes here at all; if
  // somebody reaches it anyway, refuse rather than let anybody through.
  if (!expected) return { error: "This site is not password protected." };

  const supplied = String(formData.get("password") ?? "");
  if (supplied !== expected) return { error: "That is not the password." };

  const store = await cookies();
  store.set(GATE_COOKIE, await gateToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GATE_MAX_AGE_SECONDS,
  });

  // Back to whatever they originally asked for. Same-origin only: a value that
  // is not a plain rooted path is discarded rather than followed, so this
  // cannot be turned into an open redirect.
  const target = String(formData.get("next") ?? "/");
  const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/";
  redirect(safe);
}
