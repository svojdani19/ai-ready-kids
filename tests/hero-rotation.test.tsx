// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HERO_PANELS } from "@/content/hero";
import { MISSIONS } from "@/content/missions";

const { HeroScenes } = await import("@/components/marketing/HeroScenes");

/**
 * The landing page hero: three real decisions, rotating.
 *
 * Two things are being protected here, and they are different.
 *
 * **The copy is derived.** The hero used to be one decision typed into
 * `page.tsx` by hand — Sprocket asking for a full name — with the mission it
 * quoted free to change underneath it. Nothing failed when they disagreed,
 * because nothing connected them. These tests read the missions and assert the
 * panels match, so the marketing page cannot drift from the product it
 * describes.
 *
 * **The motion is optional.** An auto-rotating panel that cannot be stopped is
 * a WCAG failure, not a nice-to-have, and a reader who has asked their system
 * for less motion has already answered the question. Every panel stays
 * reachable by its own button either way.
 */

let reduceMotion = false;

beforeEach(() => {
  reduceMotion = false;
  window.matchMedia = ((query: string) => ({
    media: query,
    matches: query.includes("prefers-reduced-motion") ? reduceMotion : false,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** One dwell and a little, so a tick that was going to happen has happened. */
const DWELL_AND_A_BIT = 8500;

const advance = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

/**
 * `fireEvent` rather than `user-event` throughout the timed tests. The rotation
 * is a clock, so these run on a fake one, and user-event's own waits between
 * the events that make up a click never resolve against a frozen clock.
 */
const clickButton = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("the panels are read out of the curriculum", () => {
  it("shows three missions, one per competency", () => {
    expect(HERO_PANELS).toHaveLength(3);
    expect(new Set(HERO_PANELS.map((p) => p.competency)).size).toBe(3);
  });

  it("draws a different scene for each one", () => {
    // The hero rotates a picture as well as a question. Three panels over the
    // same illustration would not read as a rotation at all.
    expect(new Set(HERO_PANELS.map((p) => p.art)).size).toBe(HERO_PANELS.length);
  });

  it.each(HERO_PANELS)("$slug quotes its own mission", (panel) => {
    const mission = MISSIONS.find((m) => m.slug === panel.slug);
    expect(mission, `${panel.slug} is not a core mission`).toBeDefined();
    const scene = mission!.scenes.find((s) => s.kind === "decision");
    expect(scene).toBeDefined();

    // Every string on the panel, checked against the scene it came from. Edit
    // the mission and this is what moves the hero with it.
    expect(panel.missionNumber).toBe(mission!.order);
    expect(panel.title).toBe(mission!.title);
    expect(panel.art).toBe(scene!.art);
    expect(panel.prompt).toBe(scene!.prompt);
    expect(panel.moment).toBe(scene!.narration[scene!.narration.length - 1]);

    const labels = (tone: string) =>
      scene!.choices!.filter((c) => c.feedback.tone === tone).map((c) => c.label);
    expect(labels("strong")).toContain(panel.demonstrated);
    expect(labels("rethink")).toContain(panel.tempting);
  });

  it("leaves no copy of a child's decision typed into the landing page", () => {
    // The original defect: the hero's words lived in the marketing page, so
    // rewriting the mission changed nothing on the front page.
    const page = readFileSync(join(process.cwd(), "src/app/(site)/page.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1");

    for (const panel of HERO_PANELS) {
      for (const line of [panel.moment, panel.prompt, panel.tempting, panel.demonstrated]) {
        expect(page, `"${line.slice(0, 40)}…" is hard-coded again`).not.toContain(line);
      }
    }
    // And it no longer picks the illustration by hand either.
    expect(page).not.toContain("SceneArt");
  });
});

describe("what a reader sees", () => {
  it("opens on the first panel, with the skilled answer marked", () => {
    render(<HeroScenes panels={HERO_PANELS} />);
    const [first] = HERO_PANELS;
    expect(screen.getByText(first.moment)).toBeInTheDocument();
    expect(screen.getByText(first.prompt)).toBeInTheDocument();
    expect(screen.getByText(first.tempting)).toBeInTheDocument();
    expect(screen.getByText(`${first.demonstrated} ✓`)).toBeInTheDocument();
    // One at a time: the others are not sitting in the document unseen.
    expect(screen.queryByText(HERO_PANELS[1].moment)).not.toBeInTheDocument();
  });

  it("names each mission on its own button rather than numbering the slides", () => {
    render(<HeroScenes panels={HERO_PANELS} />);
    for (const panel of HERO_PANELS) {
      expect(
        screen.getByRole("button", { name: `${panel.competencyName}: ${panel.title}` }),
      ).toBeInTheDocument();
    }
  });

  it("moves on by itself", async () => {
    vi.useFakeTimers();
    render(<HeroScenes panels={HERO_PANELS} />);
    expect(screen.getByText(HERO_PANELS[0].moment)).toBeInTheDocument();

    await advance(DWELL_AND_A_BIT);
    expect(screen.getByText(HERO_PANELS[1].moment)).toBeInTheDocument();

    await advance(DWELL_AND_A_BIT);
    expect(screen.getByText(HERO_PANELS[2].moment)).toBeInTheDocument();

    // And round again, rather than stopping on the last one.
    await advance(DWELL_AND_A_BIT);
    expect(screen.getByText(HERO_PANELS[0].moment)).toBeInTheDocument();
  });

  it("goes where a button says, and stays there for a full dwell", async () => {
    vi.useFakeTimers();
    render(<HeroScenes panels={HERO_PANELS} />);
    const target = HERO_PANELS[2];

    clickButton(`${target.competencyName}: ${target.title}`);
    expect(screen.getByText(target.moment)).toBeInTheDocument();

    // Choosing a panel restarts its dwell rather than inheriting the tail of
    // the one before it, so a reader who clicks does not get half a second.
    await advance(DWELL_AND_A_BIT - 1000);
    expect(screen.getByText(target.moment)).toBeInTheDocument();
  });
});

describe("the motion can be stopped", () => {
  it("holds where it is while it is paused, and carries on afterwards", async () => {
    vi.useFakeTimers();
    render(<HeroScenes panels={HERO_PANELS} />);

    clickButton(/^pause$/i);
    await advance(DWELL_AND_A_BIT * 2);
    expect(screen.getByText(HERO_PANELS[0].moment)).toBeInTheDocument();

    clickButton(/^play$/i);
    await advance(DWELL_AND_A_BIT);
    expect(screen.getByText(HERO_PANELS[1].moment)).toBeInTheDocument();
  });

  it("waits while the pointer is on it", async () => {
    vi.useFakeTimers();
    render(<HeroScenes panels={HERO_PANELS} />);

    fireEvent.mouseEnter(screen.getByRole("group"));
    await advance(DWELL_AND_A_BIT * 2);
    expect(screen.getByText(HERO_PANELS[0].moment)).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole("group"));
    await advance(DWELL_AND_A_BIT);
    expect(screen.getByText(HERO_PANELS[1].moment)).toBeInTheDocument();
  });

  it("does not rotate at all when the reader has asked for less motion", async () => {
    reduceMotion = true;
    vi.useFakeTimers();
    render(<HeroScenes panels={HERO_PANELS} />);

    await advance(DWELL_AND_A_BIT * 3);
    expect(screen.getByText(HERO_PANELS[0].moment)).toBeInTheDocument();

    // No control for stopping something that was never started, and the
    // panels are still reachable one by one.
    // Anchored: "The Penguin on the Playground" contains the word play.
    expect(screen.queryByRole("button", { name: /^(pause|play)$/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(HERO_PANELS.length);
  });

  it("still lets a keyboard reader reach every panel with the rotation stopped", async () => {
    reduceMotion = true;
    render(<HeroScenes panels={HERO_PANELS} />);

    for (const panel of [...HERO_PANELS].reverse()) {
      clickButton(`${panel.competencyName}: ${panel.title}`);
      expect(screen.getByText(panel.moment)).toBeInTheDocument();
    }
  });
});
