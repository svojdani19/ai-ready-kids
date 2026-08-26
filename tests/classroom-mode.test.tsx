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
