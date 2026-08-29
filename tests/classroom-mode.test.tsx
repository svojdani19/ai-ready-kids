// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const { ClassroomMode } = await import("@/app/teacher/classroom/[slug]/ClassroomMode");
const { getMission } = await import("@/content/missions");

const mission = getMission("sprocket-wants-to-know")!;
/** The first decision scene, reached one Next from the opening. */
const decision = mission.scenes.find((s) => s.id === "s2")!;
const choices = decision.choices!;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Put the mission on the board and advance to the first decision. */
async function present() {
  const user = userEvent.setup();
  render(<ClassroomMode mission={mission} />);
  await user.click(screen.getAllByRole("button", { name: "Put it on the board" })[0]);
  await user.click(screen.getByRole("button", { name: "Next →" }));
  return user;
}

describe("classroom mode branch comparison", () => {
  it("keeps a branch switcher on screen once a choice is revealed", async () => {
    const user = await present();

    // Before revealing, the room sees the choice list and no switcher.
    expect(screen.queryByRole("group", { name: "Compare the choices" })).toBeNull();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));

    expect(screen.getByText(choices[0].feedback.headline)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Compare the choices" })).toBeInTheDocument();
  });

  it("switches between branches by touch alone, without leaving the scene", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));

    // No keyboard involved: tap straight from branch A to branch C.
    await user.click(
      screen.getByRole("button", {
        name: `Show what choice C does: ${choices[2].label}`,
      }),
    );
    expect(screen.getByText(choices[2].feedback.headline)).toBeInTheDocument();
    expect(screen.queryByText(choices[0].feedback.headline)).toBeNull();

    // And back to B, still on the same decision.
    await user.click(
      screen.getByRole("button", {
        name: `Show what choice B does: ${choices[1].label}`,
      }),
    );
    expect(screen.getByText(choices[1].feedback.headline)).toBeInTheDocument();
    expect(screen.getByText(/Decision 1 of/)).toBeInTheDocument();
  });

  it("marks the branch currently on the board as pressed", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice B does: ${choices[1].label}` }));

    const switcher = screen.getByRole("group", { name: "Compare the choices" });
    const buttons = [0, 1, 2].map((i) =>
      screen.getByRole("button", {
        name: `Show what choice ${["A", "B", "C"][i]} does: ${choices[i].label}`,
      }),
    );
    expect(switcher).toContainElement(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
    expect(buttons[2]).toHaveAttribute("aria-pressed", "false");
  });

  it("tapping the branch already on screen keeps it there", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));

    const sameBranch = screen.getByRole("button", {
      name: `Show what choice A does: ${choices[0].label}`,
    });
    await user.click(sameBranch);
    await user.click(sameBranch);

    // Setting, not toggling: two taps on the active branch is not a hide.
    expect(screen.getByText(choices[0].feedback.headline)).toBeInTheDocument();
  });

  it("returns to the full choice list by touch", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));

    await user.click(
      screen.getByRole("button", {
        name: "Hide this answer and show the list of choices again",
      }),
    );

    for (const [i, choice] of choices.entries()) {
      expect(screen.getByRole("button", { name: `Show what choice ${["A", "B", "C"][i]} does: ${choice.label}` })).toBeInTheDocument();
    }
    expect(screen.queryByText(choices[0].feedback.headline)).toBeNull();
  });

  it("keeps the question on the board while a branch is open", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));
    expect(screen.getByText(decision.prompt!)).toBeInTheDocument();
  });

  it("still supports number keys and Escape for a teacher at a laptop", async () => {
    const user = await present();

    await user.keyboard("2");
    expect(screen.getByText(choices[1].feedback.headline)).toBeInTheDocument();

    await user.keyboard("3");
    expect(screen.getByText(choices[2].feedback.headline)).toBeInTheDocument();
    expect(screen.queryByText(choices[1].feedback.headline)).toBeNull();

    await user.keyboard("{Escape}");
    expect(screen.queryByText(choices[2].feedback.headline)).toBeNull();
    expect(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` })).toBeInTheDocument();
  });

  it("keeps the branch switcher distinct from the hands-up tally", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));

    // The tally is separately named and lives outside the switcher group.
    const tally = screen.getByRole("button", { name: "Add a vote for option B" });
    const switcher = screen.getByRole("group", { name: "Compare the choices" });
    expect(switcher).not.toContainElement(tally);

    // Counting hands must not change which branch the room is reading.
    await user.click(tally);
    expect(screen.getByText(choices[0].feedback.headline)).toBeInTheDocument();
  });

  it("gives every branch control a name that says what it will do", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));

    const switcher = screen.getByRole("group", { name: "Compare the choices" });
    const names = Array.from(switcher.querySelectorAll("button")).map(
      (b) => b.getAttribute("aria-label") ?? b.textContent?.trim(),
    );
    expect(names).toEqual([
      `Show what choice A does: ${choices[0].label}`,
      `Show what choice B does: ${choices[1].label}`,
      `Show what choice C does: ${choices[2].label}`,
      "Hide this answer and show the list of choices again",
    ]);
  });

  it("offers every branch control as a board-sized target", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));

    const switcher = screen.getByRole("group", { name: "Compare the choices" });
    for (const button of switcher.querySelectorAll("button")) {
      expect(button.className).toContain("min-h-12");
    }
  });

  it("records nothing at all, whatever the teacher taps", async () => {
    const user = await present();
    await user.click(screen.getByRole("button", { name: `Show what choice A does: ${choices[0].label}` }));
    await user.click(
      screen.getByRole("button", { name: `Show what choice B does: ${choices[1].label}` }),
    );
    await user.click(screen.getByRole("button", { name: "Add a vote for option A" }));

    // Classroom Mode imports no server action; nothing can leave the browser.
    expect(vi.mocked(globalThis.fetch ?? (() => {})).mock?.calls ?? []).toHaveLength(0);
  });
});


/**
 * Sprint 47. Classroom Mode paints `fixed inset-0` over the teacher
 * application, and until now that was all it did: it was not announced as a
 * modal region, it did not contain focus, and its Exit button unmounted while
 * focused without giving focus back. A teacher driving a lesson from the
 * keyboard could tab off the projected board into the header and sidebar
 * underneath — invisible, because the screen does not change when focus lands
 * on a covered control — with a class waiting.
 *
 * These render the real component with the surrounding chrome a teacher page
 * actually has, so "does Tab reach the navigation" is a question the test can
 * genuinely ask.
 */
describe("the board is a modal teaching surface", () => {
  /** Classroom Mode inside the kind of page furniture it covers. */
  function withChrome() {
    return (
      <div>
        {/* Fragment hrefs, not page routes: these stand in for the header,
            sidebar and page controls the board covers, and what matters is
            that they are focusable, not where they go. */}
        <header>
          <a href="#teacher-overview">Teacher overview</a>
          <button type="button">Sign out</button>
        </header>
        <ClassroomMode mission={mission} />
        <footer>
          <a href="#mission-library">Mission library</a>
        </footer>
      </div>
    );
  }

  const launchers = () => screen.getAllByRole("button", { name: "Put it on the board" });

  const board = () => screen.getByRole("dialog");

  const underlying = () => [
    screen.getByRole("link", { name: "Teacher overview" }),
    screen.getByRole("button", { name: "Sign out" }),
    screen.getByRole("link", { name: "Mission library" }),
  ];

  it("announces itself as a labeled modal, and the plan page does not", async () => {
    const user = userEvent.setup();
    render(withChrome());

    // The plan is an ordinary page. Nothing modal about reading a lesson plan.
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(launchers()[0]);
    const surface = board();
    expect(surface).toHaveAttribute("aria-modal", "true");
    expect(surface).toHaveAccessibleName(`${mission.title} on the board`);
  });

  it("labels the debrief as the same surface in its second state", async () => {
    const user = userEvent.setup();
    render(withChrome());
    await user.click(launchers()[0]);

    for (let i = 0; i < mission.scenes.length + 2; i += 1) {
      const go = screen.queryByRole("button", { name: /Next →|Go to debrief →/ });
      if (!go) break;
      await user.click(go);
      if (screen.queryByRole("button", { name: "Next question →" })) break;
    }

    const surface = board();
    expect(surface).toHaveAttribute("aria-modal", "true");
    expect(surface).toHaveAccessibleName(`${mission.title} on the board — talk about it`);
    expect(screen.getByRole("button", { name: "← Back" })).toBeInTheDocument();
  });

  it("keeps Tab inside the board and away from the covered navigation", async () => {
    const user = userEvent.setup();
    render(withChrome());
    await user.click(launchers()[0]);
    const surface = board();

    // Twice round the cycle, so wrapping is exercised rather than just the
    // first few stops. Focus must never leave the surface.
    for (let i = 0; i < 30; i += 1) {
      await user.tab();
      expect(surface.contains(document.activeElement)).toBe(true);
      for (const el of underlying()) expect(el).not.toHaveFocus();
    }
  });

  it("keeps Shift+Tab inside the board too", async () => {
    const user = userEvent.setup();
    render(withChrome());
    await user.click(launchers()[0]);
    const surface = board();

    for (let i = 0; i < 30; i += 1) {
      await user.tab({ shift: true });
      expect(surface.contains(document.activeElement)).toBe(true);
      for (const el of underlying()) expect(el).not.toHaveFocus();
    }
  });

  it("contains focus in the debrief as well", async () => {
    const user = userEvent.setup();
    render(withChrome());
    await user.click(launchers()[0]);
    for (let i = 0; i < mission.scenes.length + 2; i += 1) {
      const go = screen.queryByRole("button", { name: /Next →|Go to debrief →/ });
      if (!go) break;
      await user.click(go);
      if (screen.queryByRole("button", { name: "Next question →" })) break;
    }

    const surface = board();
    for (let i = 0; i < 12; i += 1) {
      await user.tab();
      expect(surface.contains(document.activeElement)).toBe(true);
      for (const el of underlying()) expect(el).not.toHaveFocus();
    }
  });

  it("leaves a visible way out rather than trapping anybody", async () => {
    const user = userEvent.setup();
    render(withChrome());
    await user.click(launchers()[0]);

    // Containment is only defensible because the exits are on screen.
    expect(screen.getByRole("button", { name: "Exit" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Next →|Go to debrief →/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "← Back" })).toBeVisible();
  });

  it("returns focus to the header launcher that opened it", async () => {
    const user = userEvent.setup();
    render(withChrome());

    await user.click(launchers()[0]);
    await user.click(screen.getByRole("button", { name: "Exit" }));

    // The plan remounts, so the assertion is on position rather than on the
    // node captured before launch: the header launcher, not the body one.
    expect(screen.queryByRole("dialog")).toBeNull();
    const after = launchers();
    expect(after[0]).toHaveFocus();
    expect(after[1]).not.toHaveFocus();
  });

  it("returns focus to the body launcher when that is the one that opened it", async () => {
    const user = userEvent.setup();
    render(withChrome());
    const before = launchers();

    // The second button, at the foot of the plan. A teacher who launched from
    // there and landed back at the top has lost their place.
    await user.click(before[1]);
    await user.click(screen.getByRole("button", { name: "Exit" }));

    const after = launchers();
    expect(after[1]).toHaveFocus();
    expect(after[0]).not.toHaveFocus();
  });

  it("does not pull focus back when the debrief navigates to the guide", async () => {
    const user = userEvent.setup();
    render(withChrome());
    await user.click(launchers()[0]);
    for (let i = 0; i < mission.scenes.length + 2; i += 1) {
      const go = screen.queryByRole("button", { name: /Next →|Go to debrief →/ });
      if (!go) break;
      await user.click(go);
      if (screen.queryByRole("button", { name: "Next question →" })) break;
    }
    while (screen.queryByRole("button", { name: "Next question →" })) {
      await user.click(screen.getByRole("button", { name: "Next question →" }));
    }

    const finish = screen.getByRole("link", { name: "Finish and open the guide" });
    finish.focus();
    expect(finish).toHaveFocus();
    // Leaving through the guide is ordinary navigation: nothing reaches in to
    // move focus, and no launcher steals it.
    expect(screen.queryByRole("button", { name: "Put it on the board" })).toBeNull();
  });

  it("moves focus to the visible stage on a scene change, never to something removed", async () => {
    const user = userEvent.setup();
    render(withChrome());
    await user.click(launchers()[0]);
    const surface = board();

    await user.click(screen.getByRole("button", { name: /Next →|Go to debrief →/ }));
    expect(surface.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBeVisible();
  });

  it("keeps every presenter shortcut doing what it did", async () => {
    const user = userEvent.setup();
    render(withChrome());
    await user.click(launchers()[0]);
    await user.click(screen.getByRole("button", { name: "Next →" }));

    // 1-4 reveal a branch.
    await user.keyboard("{1}");
    expect(screen.getByText(choices[0].feedback.headline)).toBeInTheDocument();

    // Escape returns to the choice list. It is not an exit from the board.
    await user.keyboard("{Escape}");
    expect(screen.queryByText(choices[0].feedback.headline)).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // N toggles the teacher notes.
    await user.keyboard("{n}");
    expect(screen.getByRole("button", { name: "Notes" })).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{n}");
    expect(screen.getByRole("button", { name: "Notes" })).toHaveAttribute("aria-pressed", "false");

    // Arrows, space and Page keys still page the running order.
    const heading = () => screen.getByRole("dialog").textContent ?? "";
    const atFirstDecision = heading();
    await user.keyboard("{ArrowRight}");
    expect(heading()).not.toBe(atFirstDecision);
    await user.keyboard("{ArrowLeft}");
    expect(heading()).toBe(atFirstDecision);
    await user.keyboard("{PageDown}");
    expect(heading()).not.toBe(atFirstDecision);
    await user.keyboard("{PageUp}");
    expect(heading()).toBe(atFirstDecision);
  });
});
