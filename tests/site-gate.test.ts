import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  credentialsAreValid,
  decodeBasicAuth,
  gateEnabled,
  GATE_REALM,
  siteUser,
  sitePassword,
} from "@/lib/auth/site-gate";

/**
 * HTTP Basic authentication in front of the whole deployment.
 *
 * Not the product's authentication and easy to confuse with it: staff sign in
 * by email and children join by class code, and both of those are the product.
 * This is a curtain over the entire site so a build can be handed to a named
 * school without being open to anybody who finds the URL.
 *
 * The property under test is **total coverage**. An earlier version was a
 * styled `/gate` page, which forced `/_next/` to be served unauthenticated so
 * the page could style itself — and a Next chunk can contain page copy. Basic
 * auth needs no assets before the prompt, so the allow-list is empty and the
 * matcher covers every path. These tests exist to stop that seam reopening.
 */

const ORIGINAL_PASSWORD = process.env.AIRK_SITE_PASSWORD;
const ORIGINAL_USER = process.env.AIRK_SITE_USER;

const basic = (user: string, password: string) =>
  `Basic ${Buffer.from(`${user}:${password}`, "utf8").toString("base64")}`;

afterEach(() => {
  for (const [key, value] of [
    ["AIRK_SITE_PASSWORD", ORIGINAL_PASSWORD],
    ["AIRK_SITE_USER", ORIGINAL_USER],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
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

  it("refuses every credential while it is off, rather than waving them through", () => {
    delete process.env.AIRK_SITE_PASSWORD;
    // The middleware short-circuits first, but a helper that returned true here
    // would be a trap for the next caller.
    expect(credentialsAreValid(basic("anyone", "anything"))).toBe(false);
  });
});

describe("credentials", () => {
  it("accepts the password under any username by default", () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    delete process.env.AIRK_SITE_USER;
    // One secret to pass on, and nobody stuck at the dialog wondering what to
    // type on the top line.
    for (const user of ["", "preview", "someone@example.com"]) {
      expect(credentialsAreValid(basic(user, "a-shared-password"))).toBe(true);
    }
  });

  it("rejects a wrong password under any username", () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    for (const user of ["", "preview", "admin"]) {
      expect(credentialsAreValid(basic(user, "not-the-password"))).toBe(false);
    }
  });

  it("requires the username too, once one is configured", () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    process.env.AIRK_SITE_USER = "brightwood";
    expect(credentialsAreValid(basic("brightwood", "a-shared-password"))).toBe(true);
    expect(credentialsAreValid(basic("someone-else", "a-shared-password"))).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    for (const header of [
      null,
      "",
      "Basic",
      "Bearer a-shared-password",
      "Basic !!!not-base64!!!",
      `Basic ${Buffer.from("no-colon-here", "utf8").toString("base64")}`,
    ]) {
      expect(credentialsAreValid(header), `accepted ${String(header)}`).toBe(false);
    }
  });

  it("keeps a password that contains a colon intact", () => {
    // Only the first colon separates the pair. Splitting on every one would
    // silently truncate a perfectly good password.
    process.env.AIRK_SITE_PASSWORD = "a:password:with:colons";
    expect(decodeBasicAuth(basic("user", "a:password:with:colons"))?.password).toBe(
      "a:password:with:colons",
    );
    expect(credentialsAreValid(basic("user", "a:password:with:colons"))).toBe(true);
  });

  it("is case-insensitive about the scheme, as the spec requires", () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    const encoded = Buffer.from(":a-shared-password", "utf8").toString("base64");
    expect(credentialsAreValid(`basic ${encoded}`)).toBe(true);
    expect(credentialsAreValid(`BASIC ${encoded}`)).toBe(true);
  });

  it("stops accepting the old password when it is rotated", () => {
    process.env.AIRK_SITE_PASSWORD = "first-password";
    expect(credentialsAreValid(basic("x", "first-password"))).toBe(true);
    // Rotating the variable is the whole revocation story, so it has to work.
    process.env.AIRK_SITE_PASSWORD = "second-password";
    expect(credentialsAreValid(basic("x", "first-password"))).toBe(false);
    expect(credentialsAreValid(basic("x", "second-password"))).toBe(true);
  });
});

describe("the middleware covers everything, with no exemptions", () => {
  const raw = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");
  /**
   * Comments discuss the seam this closed and therefore mention `/_next/`;
   * only executable lines can reopen it. Asserting on the whole file matched my
   * own explanation of the fix.
   */
  const middleware = raw
    .split("\n")
    .filter((l) => {
      const t = l.trim();
      return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
    })
    .join("\n");

  it("matches every path, including build output", () => {
    // The whole reason this replaced the password page. A matcher that spared
    // `_next` would reopen the seam it was written to close.
    expect(middleware).toContain('matcher: ["/:path*"]');
    expect(middleware).not.toMatch(/_next/);
    expect(middleware).not.toMatch(/favicon/);
  });

  it("has no allow-list left anywhere", () => {
    const gateCode = readFileSync(join(process.cwd(), "src/lib/auth/site-gate.ts"), "utf8")
      .split("\n")
      .filter((l) => {
        const t = l.trim();
        return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
      })
      .join("\n");
    for (const gone of ["isAlwaysAllowed", "GATE_COOKIE", "/_next/"]) {
      expect(gateCode, `${gone} should not survive the swap`).not.toContain(gone);
      expect(middleware, `${gone} should not survive the swap`).not.toContain(gone);
    }
  });

  it("challenges with Basic and a realm, so the browser prompts", () => {
    expect(middleware).toMatch(/status:\s*401/);
    expect(middleware).toContain("WWW-Authenticate");
    expect(middleware).toContain("GATE_REALM");
    expect(GATE_REALM.length).toBeGreaterThan(0);
  });

  it("actually refuses an unauthenticated request, on every path", async () => {
    // Behaviour, not source order: the middleware is called with real requests.
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    const { middleware: run } = await import("@/middleware");
    for (const path of [
      "/",
      "/plans",
      "/privacy",
      "/signin",
      "/family/four-doors",
      "/teacher",
      "/admin",
      "/student",
      "/_next/static/chunks/main.js",
      "/favicon.ico",
    ]) {
      const response = run(new NextRequest(new Request(`https://example.test${path}`)));
      expect(response.status, `${path} was not refused`).toBe(401);
      expect(response.headers.get("WWW-Authenticate")).toMatch(/^Basic realm=/);
    }
  });

  it("lets a correct credential through, on those same paths", async () => {
    process.env.AIRK_SITE_PASSWORD = "a-shared-password";
    const { middleware: run } = await import("@/middleware");
    for (const path of ["/", "/family/four-doors", "/_next/static/chunks/main.js"]) {
      const response = run(
        new NextRequest(
          new Request(`https://example.test${path}`, {
            headers: { authorization: basic("anyone", "a-shared-password") },
          }),
        ),
      );
      expect(response.status, `${path} was refused with the right password`).toBe(200);
    }
  });

  it("serves everything untouched when no password is configured", async () => {
    delete process.env.AIRK_SITE_PASSWORD;
    const { middleware: run } = await import("@/middleware");
    const response = run(new NextRequest(new Request("https://example.test/plans")));
    expect(response.status).toBe(200);
    expect(response.headers.get("WWW-Authenticate")).toBeNull();
  });

  it("does not let a 401 be cached or indexed", () => {
    expect(middleware).toContain("no-store");
    expect(middleware).toContain("noindex");
  });
});

describe("the password page is gone", () => {
  it("leaves no route that renders without credentials", () => {
    // A leftover `/gate` route would be a second, unauthenticated entry point.
    for (const path of ["src/app/gate/page.tsx", "src/app/actions/gate.ts"]) {
      expect(() => readFileSync(join(process.cwd(), path), "utf8"), `${path} still exists`).toThrow();
    }
  });

  it("still reports whether a username is required", () => {
    delete process.env.AIRK_SITE_USER;
    expect(siteUser()).toBeUndefined();
    process.env.AIRK_SITE_USER = "  ";
    expect(siteUser(), "whitespace should not become a required username").toBeUndefined();
    process.env.AIRK_SITE_USER = "brightwood";
    expect(siteUser()).toBe("brightwood");
  });
});
