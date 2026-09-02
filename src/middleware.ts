import { NextResponse, type NextRequest } from "next/server";
import {
  GATE_COOKIE,
  gateEnabled,
  gateTokenIsValid,
  isAlwaysAllowed,
} from "@/lib/auth/site-gate";

/**
 * The site password, applied to every request before anything renders.
 *
 * Middleware rather than a layout check, because the requirement is that
 * nothing is visible — and a layout does not cover all of it. `/family/[slug]`
 * is statically generated at build time and served without ever calling a
 * server component, the marketing pages are their own route group, and
 * `/signin` sits outside both. Middleware is the only layer every one of those
 * requests passes through.
 *
 * Unset `AIRK_SITE_PASSWORD` and this returns immediately, so local
 * development and the test suite are untouched.
 */
export async function middleware(request: NextRequest) {
  if (!gateEnabled()) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (isAlwaysAllowed(pathname)) return NextResponse.next();

  if (await gateTokenIsValid(request.cookies.get(GATE_COOKIE)?.value)) {
    return NextResponse.next();
  }

  // Rewrite rather than redirect, so the address bar keeps the page the visitor
  // asked for and they land on it once past the gate. A redirect would replace
  // a shared deep link — a specific mission, a family take-home — with `/gate`,
  // and the link is usually the reason somebody is here.
  const url = request.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  const response = NextResponse.rewrite(url);
  // Where to send them afterwards, read by the gate's form. Not signed: it is
  // a path this request already carried, and the gate only ever uses it as a
  // same-origin destination.
  response.headers.set("x-airk-gate-next", `${pathname}${search}`);
  return response;
}

export const config = {
  /**
   * Everything except Next's own build output and the icon. The allow-list in
   * `isAlwaysAllowed` is the real rule; this matcher only spares the runtime
   * the work of evaluating it for every static chunk.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
