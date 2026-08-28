import { NextResponse } from "next/server";
import { clearJoinGrant } from "@/lib/auth/session";

/**
 * Drop a join grant and send the child to the closed-class message.
 *
 * This exists because a Server Component may not write cookies. Sprint 50 had
 * the lapsed branch of `/join/[classId]` call `clearJoinGrant()` directly, and
 * Next 16 throws "Cookies can only be modified in a Server Action or Route
 * Handler" for that — so a child who simply *refreshed* the roster after their
 * school lapsed got a 500 instead of the sentence meant for them. The action
 * path was fine, which is exactly why the browser check missed it: pressing a
 * name runs in a Server Action, where the write is allowed.
 *
 * A Route Handler is a supported mutation context, so the page redirects here
 * and this does the one thing the page could not. It reads no state and makes
 * no decision: the page has already decided, and this only tidies up after it.
 */
export async function GET(request: Request) {
  await clearJoinGrant();
  return NextResponse.redirect(new URL("/join?closed=1", request.url));
}
