import { afterEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { demoGateEnabled, demoPassword, demoPasswordIsValid } from "@/lib/auth/demo-gate";
import { decodeDemoUnlock, encodeDemoUnlock } from "@/lib/auth/token";

/**
 * A password in front of the demonstration seats.
 *
 * The site gate in `middleware.ts` decides whether the deployment answers at
 * all. This decides whether answering makes you an administrator. They are
 * different questions and one link can defeat only the first: credentials get
 * forwarded, and everything past this point can assign missions, rotate class
 * codes, archive classes and delete records.
 *
 * The password is never in this repository, which is public. These tests set
 * the variable themselves and assert the shape of the mechanism, not a value.
 */

const ORIGINAL = process.env.AIRK_DEMO_PASSWORD;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AIRK_DEMO_PASSWORD;
  else process.env.AIRK_DEMO_PASSWORD = ORIGINAL;
});

describe("the gate is off unless it is configured", () => {
  it("does nothing with no password set", () => {
    delete process.env.AIRK_DEMO_PASSWORD;
    expect(demoGateEnabled()).toBe(false);
    expect(demoPassword()).toBeUndefined();
  });

  it("treats an empty or whitespace value as unset", () => {
    for (const value of ["", "   ", "\t"]) {
      process.env.AIRK_DEMO_PASSWORD = value;
      expect(demoGateEnabled(), `"${value}" should not enable the gate`).toBe(false);
    }
  });

  it("refuses every password while it is off, rather than waving them through", () => {
    delete process.env.AIRK_DEMO_PASSWORD;
    expect(demoPasswordIsValid("anything")).toBe(false);
    expect(demoPasswordIsValid("")).toBe(false);
  });
});

describe("the password", () => {
  it("accepts only itself", () => {
    process.env.AIRK_DEMO_PASSWORD = "a-shared-password";
    expect(demoPasswordIsValid("a-shared-password")).toBe(true);
    for (const wrong of ["a-shared-passwor", "a-shared-passwordd", "A-Shared-Password", ""]) {
      expect(demoPasswordIsValid(wrong), `accepted "${wrong}"`).toBe(false);
    }
  });

  it("stops accepting the old one when it is rotated", () => {
    process.env.AIRK_DEMO_PASSWORD = "first";
    expect(demoPasswordIsValid("first")).toBe(true);
    process.env.AIRK_DEMO_PASSWORD = "second";
    expect(demoPasswordIsValid("first")).toBe(false);
    expect(demoPasswordIsValid("second")).toBe(true);
  });
});

describe("the unlock cookie is signed and expires", () => {
  const key = randomBytes(32);
  const now = 1_800_000_000;

  it("round-trips a token this server signed", () => {
    const token = encodeDemoUnlock(key, { kind: "demo", exp: now + 60, pw: "abc" });
    expect(decodeDemoUnlock(key, token, now)).toEqual({ kind: "demo", exp: now + 60, pw: "abc" });
  });

  it("refuses one signed with a different key", () => {
    const token = encodeDemoUnlock(randomBytes(32), { kind: "demo", exp: now + 60, pw: "abc" });
    expect(decodeDemoUnlock(key, token, now)).toBeNull();
  });

  it("refuses a tampered payload", () => {
    const token = encodeDemoUnlock(key, { kind: "demo", exp: now + 60, pw: "abc" });
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ kind: "demo", exp: now + 999999, pw: "abc" }), "utf8")
      .toString("base64url");
    expect(decodeDemoUnlock(key, `${forged}.${signature}`, now)).toBeNull();
  });

  it("refuses a token with no password fingerprint, as older builds issued", () => {
    const payload = Buffer.from(JSON.stringify({ kind: "demo", exp: now + 60 }), "utf8")
      .toString("base64url");
    const real = encodeDemoUnlock(key, { kind: "demo", exp: now + 60, pw: "abc" });
    expect(decodeDemoUnlock(key, `${payload}.${real.split(".")[1]}`, now)).toBeNull();
  });

  it("refuses an expired one, and nonsense", () => {
    expect(decodeDemoUnlock(key, encodeDemoUnlock(key, { kind: "demo", exp: now - 1, pw: "abc" }), now)).toBeNull();
    for (const junk of [undefined, "", "no-dot", "a.b", "..", "x."]) {
      expect(decodeDemoUnlock(key, junk, now), `accepted ${String(junk)}`).toBeNull();
    }
  });
});

describe("every way into a staff seat is behind it", () => {
  const auth = readFileSync(join(process.cwd(), "src/app/actions/auth.ts"), "utf8");

  it("guards the one-click seats", () => {
    const enterDemo = auth.slice(auth.indexOf("export async function enterDemo"));
    expect(enterDemo.slice(0, 600)).toMatch(/await demoUnlocked\(\)/);
  });

  it("guards email sign-in too, which reaches the same seats", () => {
    // FAILING-BEFORE: gating the buttons alone left the door open beside the
    // lock — typing a seeded address was a complete bypass.
    const signIn = auth.slice(auth.indexOf("export async function signInWithEmail"));
    expect(signIn.slice(0, 600)).toMatch(/await demoUnlocked\(\)/);
  });

  it("does not gate the class-code route a real student uses", () => {
    // Children join with a code their teacher shows the room. That is the
    // product, not the demonstration, and it must keep working.
    const join = auth.slice(auth.indexOf("export async function findClassByCode"));
    expect(join.slice(0, 800)).not.toMatch(/demoUnlocked/);
  });
});

describe("the password is not in the repository", () => {
  /**
   * Named indirectly on purpose.
   *
   * The first version of this asserted the literal password was absent — and
   * wrote it into a public repository to do so. A guard that publishes the
   * secret it protects is worse than no guard. It now checks the *shape*: the
   * value is read from the environment and nothing supplies a fallback.
   */
  const SOURCES = [
    "src/lib/auth/demo-gate.ts",
    "src/app/actions/auth.ts",
    "src/app/signin/page.tsx",
    "src/app/signin/DemoUnlockForm.tsx",
    "src/components/DemoEntry.tsx",
    ".env.example",
  ];

  it("reads the password from the environment", () => {
    const gate = readFileSync(join(process.cwd(), "src/lib/auth/demo-gate.ts"), "utf8");
    expect(gate).toContain("process.env.AIRK_DEMO_PASSWORD");
  });

  it("supplies no default, anywhere", () => {
    // A fallback would be a password in the source, which is the same as no
    // gate — everyone who can read the repository could open every seat.
    for (const file of SOURCES) {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      expect(src, `${file} defaults the demo password`).not.toMatch(
        /AIRK_DEMO_PASSWORD[^\n]*(\?\?|\|\|)\s*["'`]/,
      );
    }
  });

  it("does not hard-code whatever the password currently is", () => {
    // Run against the real value when one is configured, so a deployment's own
    // password cannot have been pasted into a file.
    const configured = process.env.AIRK_DEMO_PASSWORD?.trim();
    if (!configured) return;
    for (const file of SOURCES) {
      expect(readFileSync(join(process.cwd(), file), "utf8"), file).not.toContain(configured);
    }
  });

  it("keeps the env example empty rather than suggestive", () => {
    const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    expect(example).toMatch(/^AIRK_DEMO_PASSWORD=\s*$/m);
  });
});
