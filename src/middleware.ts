import { NextResponse, type NextRequest } from "next/server";
import { credentialsAreValid, GATE_REALM, gateEnabled } from "@/lib/auth/site-gate";

/**
 * HTTP Basic authentication on every request, before anything is served.
 *
 * The requirement is that nothing is visible — and "nothing" has to include the
 * build output. The previous password-page version had to serve `/_next/`
 * unauthenticated so the gate page could style itself, and a Next chunk can
 * carry page copy. Basic auth needs no assets at all, because the browser draws
 * the prompt, so the allow-list is empty and the matcher covers everything.
 *
 * Unset `AIRK_SITE_PASSWORD` and this returns immediately, so local
 * development, the test suite and any deliberately public deployment are
 * untouched.
 */
export function middleware(request: NextRequest) {
  if (!gateEnabled()) return NextResponse.next();
  if (credentialsAreValid(request.headers.get("authorization"))) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      // `charset="UTF-8"` so a password with non-ASCII characters is decoded
      // the same way the browser encoded it.
      "WWW-Authenticate": `Basic realm="${GATE_REALM}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
      // A 401 is not a page. Nothing should keep it, and nothing should index
      // the fact that a route exists behind it.
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  /**
   * Every path, with no exemption whatsoever — including `/_next/`, the
   * favicon and any static asset. That total coverage is the whole reason this
   * replaced the password page.
   */
  matcher: ["/:path*"],
};
