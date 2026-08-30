import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pickVoice } from "@/components/student/ReadAloud";

/** Only the two fields the picker reads. */
const v = (name: string, lang: string) => ({ name, lang }) as SpeechSynthesisVoice;

/** What a Chromebook, an iPad and a Windows laptop actually offer. */
const CHROMEOS = [
  v("Google US English", "en-US"),
  v("Google UK English Male", "en-GB"),
  v("Google UK English Female", "en-GB"),
];
const IPAD = [
  v("Samantha", "en-US"),
  v("Daniel", "en-GB"),
  v("Serena", "en-GB"),
];
const WINDOWS = [
  v("Microsoft David - English (United States)", "en-US"),
  v("Microsoft Ryan Online (Natural) - English (United Kingdom)", "en-GB"),
  v("Microsoft Sonia Online (Natural) - English (United Kingdom)", "en-GB"),
];

describe("the read-aloud voice is British and female wherever the device has one", () => {
  it.each([
    ["ChromeOS", CHROMEOS, "Google UK English Female"],
    ["iPad", IPAD, "Serena"],
    ["Windows", WINDOWS, "Microsoft Sonia Online (Natural) - English (United Kingdom)"],
  ])("%s picks %s", (_platform, voices, expected) => {
    expect(pickVoice(voices)?.name).toBe(expected);
  });

  it("never picks a British male voice when a female one is present", () => {
    for (const voices of [CHROMEOS, IPAD, WINDOWS]) {
      const chosen = pickVoice(voices)!.name;
      for (const male of ["Google UK English Male", "Daniel", "Ryan"]) {
        expect(chosen).not.toContain(male);
      }
    }
  });

  it("prefers an unnamed British voice over a known male one", () => {
    // A device with no voice on the preferred list, but two British ones.
    const chosen = pickVoice([
      v("Daniel", "en-GB"),
      v("Fiona", "en-GB"),
      v("Alex", "en-US"),
    ]);
    expect(chosen?.name).toBe("Fiona");
  });

  it("accepts en_GB as well as en-GB, because engines write it both ways", () => {
    expect(pickVoice([v("Alex", "en-US"), v("Emma", "en_GB")])?.name).toBe("Emma");
  });
});

describe("it degrades quietly rather than refusing to read", () => {
  it("falls back to any English voice when nothing British is installed", () => {
    expect(pickVoice([v("Zira", "de-DE"), v("Samantha", "en-US")])?.name).toBe("Samantha");
  });

  it("falls back to the only British voice even if it is a male one", () => {
    // Better a British male reading than a flat default from another language.
    expect(pickVoice([v("Daniel", "en-GB"), v("Anna", "de-DE")])?.name).toBe("Daniel");
  });

  it("returns null for an empty or non-English list, leaving the browser default", () => {
    expect(pickVoice([])).toBeNull();
    expect(pickVoice([v("Anna", "de-DE"), v("Thomas", "fr-FR")])).toBeNull();
  });
});

describe("the control promises no accent it may not produce", () => {
  it("says only 'Read aloud', because the voice depends on the device", () => {
    const source = readFileSync(join(process.cwd(), "src/components/student/ReadAloud.tsx"), "utf8");
    const rendered = source.slice(source.indexOf("return ("));
    expect(rendered).toContain('"Read aloud"');
    for (const claim of [/British/i, /\bwoman\b/i, /\bfemale\b/i, /\baccent\b/i]) {
      expect(rendered).not.toMatch(claim);
    }
  });
});

