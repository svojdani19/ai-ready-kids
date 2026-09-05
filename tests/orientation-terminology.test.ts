import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CERTIFICATION_TITLE, CERTIFICATION_MODULES } from "@/content/certification";

/**
 * The educator program is an orientation, not a certification.
 *
 * It records that five modules were read. Reporting that as "certified" would
 * tell a principal their staff have been assessed as competent, which nothing
 * in this product measures. The word is allowed in exactly three shapes: a
 * printable **certificate of completion**, an explicit **denial** of a
 * compliance certification, and code identifiers.
 *
 * The last defect this catches was the demo card on the public site saying
 * "certification complete" while the page it linked to called the same thing an
 * orientation.
 */

/** Every file that renders something a user reads. */
function surfaces(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(process.cwd(), dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(process.cwd(), rel)).isDirectory()) out.push(...surfaces(rel));
    else if (/\.tsx$/.test(entry)) out.push(rel);
  }
  return out;
}

const SURFACES = [...surfaces("src/app"), ...surfaces("src/components")];

/**
 * Prose only: comments explain why the word was removed and would otherwise
 * read as the word coming back, and identifiers are not copy.
 */
function prose(file: string): string {
  return readFileSync(join(process.cwd(), file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1")
    .replace(/^import[\s\S]*?from "[^"]*";$/gm, "")
    .replace(/^import[^\n]*$/gm, "")
    .replace(/\/teacher\/certification[\w/]*/g, "")
    .replace(/\bCERTIFICATION_[A-Z_]+\b/g, "")
    .replace(/\b\w*Certification\w*\b/g, "")
    .replace(/\bcertifications?\.\w+/g, "")
    // Declaration names are identifiers, not copy: `CertificatePage` is a
    // component, and renaming it would be churn for no reader's benefit.
    .replace(/function \w+/g, "function")
    .replace(/\s+/g, " ");
}

/** The three accurate uses, removed before the sweep looks for the rest. */
const ALLOWED = [
  // The printable artefact, which is a record of completion and says so.
  /certificate of completion/gi,
  /(print|view)( the| your)? certificate/gi,
  /printable certificate/gi,
  /orientation certificate/gi,
  /title: "Certificate"/g,
  // Explicit denials. These are the sentences that keep the product honest and
  // a sweep that "fixed" them would be deleting the disclosure.
  /(does not|not a legal|not a) (claim any )?compliance certification/gi,
  /does not claim any compliance certification/gi,
  /rather than a certification/gi,
  /does not certify competence/gi,
  /rather than certifying competence/gi,
];

describe("the educator program is called an orientation everywhere a user reads it", () => {
  it("covers the whole app, not a list somebody maintained", () => {
    expect(SURFACES.length).toBeGreaterThan(30);
    expect(SURFACES).toContain("src/components/DemoEntry.tsx");
    expect(SURFACES).toContain("src/app/teacher/certification/page.tsx");
  });

  it.each(SURFACES)("%s", (file) => {
    let copy = prose(file);
    for (const ok of ALLOWED) copy = copy.replace(ok, "");
    const claims = copy.match(/.{0,50}certif.{0,50}/gi) ?? [];
    expect(claims, `${file} calls the orientation a certification`).toEqual([]);
  });

  it("names it an orientation in its own title, and counts five modules", () => {
    expect(CERTIFICATION_TITLE.toLowerCase()).not.toContain("certif");
    expect(CERTIFICATION_MODULES).toHaveLength(5);
  });

  it("says orientation complete on the public demo card", () => {
    // FAILING-BEFORE: "certification complete."
    const demo = readFileSync(join(process.cwd(), "src/components/DemoEntry.tsx"), "utf8");
    expect(demo).toContain("orientation complete");
    expect(demo).not.toContain("certification complete");
  });
});
