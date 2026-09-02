import { afterEach, describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  GATE_COOKIE,
  gateEnabled,
  gateToken,
  gateTokenIsValid,
  isAlwaysAllowed,
  sitePassword,
} from "@/lib/auth/site-gate";

/**
 * A shared password in front of the whole deployment.
 *
 * Not part of the product's authentication and easy to confuse with it: staff
 * sign in by email and children join by class code, and both of those are the
 * product. This is a curtain over the entire site — marketing pages, sign-in,
 * the staff and student areas, and the statically generated family take-homes —
 * so a build can be handed to a named school without being open to anybody who
 * finds the URL.
 *
 * The property that matters is that it covers **everything**, which is why it
 * lives in middleware rather than in a layout: `/family/[slug]` is prerendered
 * and never calls a server component, and the marketing pages are their own
 * route group.
 */

const ORIGINAL = process.env.AIRK_SITE_PASSWORD;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AIRK_SITE_PASSWORD;
  else process.env.AIRK_SITE_PASSWORD = ORIGINAL;
});

describe("the gate is off unless it is configured", () => {
  it("does nothing with no password set", () => {
    delete process.env.AIRK_SITE_PASSWORD;
    expect(gateEnabled()).toBe(false);
    expect(sitePassword()).toBeUndefined();
  });

  it("treats an empty or whitespace value as unset", () => {
    // A blank environment variable is how a platform reports "not configured".
    // Reading it as a password would put the site behind a secret nobody knows.
    for (const value of ["", "   ", "\t"]) {
      process.env.AIRK_SITE_PASSWORD = value;
      expect(gateEnabled(), `"${value}" should not enable the gate`).toBe(false);
    }
  });

  it("is on once a password is set", () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    expect(gateEnabled()).toBe(true);
  });
});

describe("the cookie proves the password without carrying it", () => {
  it("accepts a token minted from the current password", async () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    expect(await gateTokenIsValid(await gateToken("a-shared-password"))).toBe(true);
  });

  it("is not the password, so the cookie cannot leak it", async () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    const token = await gateToken("a-shared-password");
    expect(token).not.toContain("a-shared-password");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects a token minted from a different password", async () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    expect(await gateTokenIsValid(await gateToken("some-other-password"))).toBe(false);
  });

  it("rejects nothing, junk and a truncated token", async () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    const valid = await gateToken("a-shared-password");
    for (const bad of [undefined, "", "deadbeef", valid.slice(0, -1), `${valid}0`]) {
      expect(await gateTokenIsValid(bad), `accepted ${String(bad)}`).toBe(false);
    }
  });

  it("stops accepting old cookies when the password changes", async () => {
    process.env.AIRK_SITE_PASSWORD = "first-password";
    const old = await gateToken("first-password");
    expect(await gateTokenIsValid(old)).toBe(true);
    // Rotating the variable is the whole revocation story, so it has to work.
    process.env.AIRK_SITE_PASSWORD = "second-password";
    expect(await gateTokenIsValid(old)).toBe(false);
  });

  it("refuses everything while the gate is off", async () => {
    const token = await gateToken("a-shared-password");
    delete process.env.AIRK_SITE_PASSWORD;
    // Fail closed on the token check even though the middleware short-circuits
    // first: a helper that returned true here would be a trap for a caller.
    expect(await gateTokenIsValid(token)).toBe(false);
  });
});

describe("what the gate lets through unauthenticated", () => {
  it("allows only the gate page and build output", () => {
    for (const path of ["/gate", "/_next/static/chunk.js", "/favicon.ico", "/robots.txt"]) {
      expect(isAlwaysAllowed(path), `${path} should be reachable`).toBe(true);
    }
  });

  it("allows nothing else, including every real surface", () => {
    for (const path of [
      "/",
      "/plans",
      "/curriculum",
      "/privacy",
      "/for-schools",
      "/approach",
      "/benchmark",
      "/demo",
      "/signin",
      "/join",
      "/student",
      "/teacher",
      "/teacher/missions",
      "/admin",
      "/family/four-doors",
    ]) {
      expect(isAlwaysAllowed(path), `${path} must not be reachable`).toBe(false);
    }
  });

  it("covers every marketing page that exists, not a list of them", () => {
    // Same reasoning as the buyer-surface guard: a page added later must be
    // behind the gate without anybody remembering to add it here.
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(join(process.cwd(), dir))) {
        const rel = `${dir}/${entry}`;
        if (statSync(join(process.cwd(), rel)).isDirectory()) out.push(...walk(rel));
        else if (entry === "page.tsx") out.push(rel);
      }
      return out;
    };
    const routes = walk("src/app/(site)").map((f) =>
      f.replace("src/app/(site)", "").replace("/page.tsx", "") || "/",
    );
    expect(routes.length).toBeGreaterThanOrEqual(8);
    for (const route of routes) {
      expect(isAlwaysAllowed(route), `${route} must not be reachable`).toBe(false);
    }
  });
});

describe("the middleware is wired to see every request", () => {
  const middleware = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");

  it("matches all paths except build output", () => {
    // A matcher scoped to a subtree would leave the rest of the site open,
    // which is the one mistake that makes the whole feature decorative.
    expect(middleware).toContain('matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]');
  });

  it("rewrites rather than redirects, so a shared deep link survives", () => {
    expect(middleware).toContain("NextResponse.rewrite");
    expect(middleware).not.toContain("NextResponse.redirect");
  });

  it("checks the cookie before letting anything render", () => {
    const body = middleware.slice(middleware.indexOf("export async function middleware"));
    expect(body.indexOf("gateTokenIsValid")).toBeLessThan(body.indexOf("NextResponse.rewrite"));
    expect(body).toContain(GATE_COOKIE.length > 0 ? "GATE_COOKIE" : "");
  });
});

describe("the gate page gives nothing away", () => {
  const page = readFileSync(join(process.cwd(), "src/app/gate/page.tsx"), "utf8");

  it("is not indexable", () => {
    expect(page).toMatch(/robots:\s*\{\s*index:\s*false/);
  });

  it("describes nothing behind it", () => {
    // No curriculum, no grades, no pricing, no school name — the point of the
    // curtain is that none of that is readable yet.
    for (const leak of ["grades 2 to 4", "27", "mission", "Brightwood", "subscription"]) {
      expect(page.toLowerCase(), `the gate mentions "${leak}"`).not.toContain(
        leak.toLowerCase(),
      );
    }
  });
});
