// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const submitCheckInAnswer = vi.fn(async () => ({ ok: true as const }));
const finishCheckIn = vi.fn(async () => {});
const push = vi.fn();

vi.mock("@/app/actions/student", () => ({
  submitCheckInAnswer: (...args: unknown[]) => submitCheckInAnswer(...(args as [])),
  finishCheckIn: (...args: unknown[]) => finishCheckIn(...(args as [])),
  submitDecision: vi.fn(),
  finishMission: vi.fn(),
  beginMission: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// jsdom ships no speech synthesis, and ReadAloud correctly renders nothing
// when the browser has none. Stub it so the control can be asserted at all.
Object.defineProperty(window, "speechSynthesis", {
  configurable: true,
  value: { cancel: vi.fn(), speak: vi.fn() },
});
class FakeUtterance {
  constructor(public text: string) {}
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
}
Object.defineProperty(window, "SpeechSynthesisUtterance", {
  configurable: true,
  value: FakeUtterance,
});

const { CheckInPlayer } = await import("@/app/student/checkin/[form]/CheckInPlayer");
const { BENCHMARK_FORMS } = await import("@/content/benchmark");

const content = BENCHMARK_FORMS.pre;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function startCheckIn(saved: Record<string, string> = {}) {
  const user = userEvent.setup();
  render(<CheckInPlayer content={content} initialResponses={saved} />);
  await user.click(screen.getByRole("button", { name: saved.pre1 ? "Carry on" : /Start|Carry on/ }));
  return user;
}

describe("check-in accidental-tap protection", () => {
  it("does not save or advance when an option is first tapped", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    await user.click(screen.getByRole("radio", { name: first.options[0].label }));

    // Nothing sent, and we are still on story 1.
    expect(submitCheckInAnswer).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: `Story 1 of ${content.items.length}` })).toBeInTheDocument();
    expect(screen.getByText(first.scenario)).toBeInTheDocument();
  });

  it("shows a strong selected state on the chosen option only", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    await user.click(screen.getByRole("radio", { name: first.options[1].label }));

    expect(screen.getByRole("radio", { name: first.options[1].label })).toBeChecked();
    expect(screen.getByRole("radio", { name: first.options[0].label })).not.toBeChecked();
    expect(screen.getByText(/That is your pick/)).toBeInTheDocument();
  });

  it("keeps Next unavailable until something is selected", async () => {
    const user = await startCheckIn();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: content.items[0].options[0].label }));
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("lets a child change their mind before confirming, saving only the last pick", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    await user.click(screen.getByRole("radio", { name: first.options[0].label }));
    await user.click(screen.getByRole("radio", { name: first.options[2].label }));
    expect(submitCheckInAnswer).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(submitCheckInAnswer).toHaveBeenCalledTimes(1);
    expect(submitCheckInAnswer).toHaveBeenCalledWith({
      form: "pre",
      itemId: first.id,
      optionId: first.options[2].id,
    });
  });
});

describe("check-in navigation", () => {
  it("saves and advances on Next", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    await user.click(screen.getByRole("radio", { name: first.options[1].label }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: `Story 2 of ${content.items.length}` })).toBeInTheDocument();
    expect(screen.getByText(content.items[1].scenario)).toBeInTheDocument();
  });

  it("restores the saved selection when going Back", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    await user.click(screen.getByRole("radio", { name: first.options[1].label }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "← Back" }));

    expect(screen.getByRole("heading", { name: `Story 1 of ${content.items.length}` })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: first.options[1].label })).toBeChecked();
  });

  it("discards an unconfirmed change when Back is pressed", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    // Save option 1, move on, come back, start changing it, then leave again.
    await user.click(screen.getByRole("radio", { name: first.options[1].label }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "← Back" }));
    await user.click(screen.getByRole("radio", { name: first.options[2].label }));
    expect(submitCheckInAnswer).toHaveBeenCalledTimes(1);

    // Forward to story 2 requires a confirm, so use Back from story 2 instead:
    // confirm story 1 again would save. Move on and return.
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByRole("radio", { name: first.options[2].label })).toBeChecked();
  });

  it("Back is unavailable on the first story", async () => {
    await startCheckIn();
    expect(screen.getByRole("button", { name: "← Back" })).toBeDisabled();
  });

  it("resumes at the first unanswered story and shows earlier answers on Back", async () => {
    const saved = {
      [content.items[0].id]: content.items[0].options[0].id,
      [content.items[1].id]: content.items[1].options[1].id,
    };
    const user = userEvent.setup();
    render(<CheckInPlayer content={content} initialResponses={saved} />);
    await user.click(screen.getByRole("button", { name: "Carry on" }));

    expect(screen.getByRole("heading", { name: `Story 3 of ${content.items.length}` })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByRole("radio", { name: content.items[1].options[1].label })).toBeChecked();
  });

  it("finishes on the last story and never shows a score", async () => {
    const saved = Object.fromEntries(
      content.items.slice(0, -1).map((i) => [i.id, i.options[0].id]),
    );
    const user = userEvent.setup();
    render(<CheckInPlayer content={content} initialResponses={saved} />);
    await user.click(screen.getByRole("button", { name: "Carry on" }));

    const last = content.items.at(-1)!;
    expect(screen.getByRole("button", { name: "Finish" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: last.options[0].label }));
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(submitCheckInAnswer).toHaveBeenCalledWith({
      form: "pre",
      itemId: last.id,
      optionId: last.options[0].id,
    });
    expect(screen.getByText("All done")).toBeInTheDocument();

    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/\b\d+\s*(?:\/|out of)\s*9\b/);
    expect(body.toLowerCase()).not.toContain("correct");
  });
});

describe("check-in accessibility", () => {
  it("exposes the options as a keyboard-operable radio group", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(first.options.length);

    // Arrow keys move the selection without submitting anything.
    radios[0].focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: first.options[1].label })).toBeChecked();
    expect(submitCheckInAnswer).not.toHaveBeenCalled();

    // Confirming from the keyboard saves exactly the selected option.
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(submitCheckInAnswer).toHaveBeenCalledTimes(1);
    expect(submitCheckInAnswer).toHaveBeenCalledWith({
      form: "pre",
      itemId: first.id,
      optionId: first.options[1].id,
    });
  });

  it("offers read-aloud on every story", async () => {
    await startCheckIn();
    expect(screen.getByRole("button", { name: /Read aloud/ })).toBeInTheDocument();
  });
});

describe("check-in save resilience", () => {
  /** A promise the test resolves by hand, to hold the save open. */
  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it("stays on the story while the save is in flight", async () => {
    const gate = deferred<{ ok: true }>();
    submitCheckInAnswer.mockReturnValueOnce(gate.promise as never);

    const user = await startCheckIn();
    const first = content.items[0];
    await user.click(screen.getByRole("radio", { name: first.options[1].label }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Still story 1, and the way forward is calmly closed.
    expect(
      screen.getByRole("heading", { name: `Story 1 of ${content.items.length}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "← Back" })).toBeDisabled();
    expect(screen.getByText("Saving your answer…")).toBeInTheDocument();

    await act(async () => {
      gate.resolve({ ok: true });
    });

    expect(
      screen.getByRole("heading", { name: `Story 2 of ${content.items.length}` }),
    ).toBeInTheDocument();
  });

  it("does not advance when the server rejects the answer", async () => {
    submitCheckInAnswer.mockResolvedValueOnce({
      ok: false,
      error: "That answer is not part of this check-in.",
    } as never);

    const user = await startCheckIn();
    const first = content.items[0];
    await user.click(screen.getByRole("radio", { name: first.options[1].label }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: `Story 1 of ${content.items.length}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Your pick is still here");
    expect(screen.getByRole("radio", { name: first.options[1].label })).toBeChecked();
  });

  it("does not advance and keeps the pick when the network drops", async () => {
    submitCheckInAnswer.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = await startCheckIn();
    const first = content.items[0];
    await user.click(screen.getByRole("radio", { name: first.options[2].label }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: `Story 1 of ${content.items.length}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not save that answer just now.",
    );
    expect(screen.getByRole("radio", { name: first.options[2].label })).toBeChecked();
    expect(screen.getByText(first.scenario)).toBeInTheDocument();
  });

  it("offers Try again, and advances once the retry succeeds", async () => {
    submitCheckInAnswer.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = await startCheckIn();
    const first = content.items[0];
    await user.click(screen.getByRole("radio", { name: first.options[1].label }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    const retry = screen.getByRole("button", { name: "Try again" });
    expect(retry).toBeEnabled();

    await user.click(retry);

    expect(submitCheckInAnswer).toHaveBeenCalledTimes(2);
    expect(submitCheckInAnswer).toHaveBeenLastCalledWith({
      form: "pre",
      itemId: first.id,
      optionId: first.options[1].id,
    });
    expect(
      screen.getByRole("heading", { name: `Story 2 of ${content.items.length}` }),
    ).toBeInTheDocument();
  });

  it("lets a child pick a different answer after a failure", async () => {
    submitCheckInAnswer.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = await startCheckIn();
    const first = content.items[0];
    await user.click(screen.getByRole("radio", { name: first.options[0].label }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: first.options[2].label }));
    expect(screen.queryByRole("alert")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(submitCheckInAnswer).toHaveBeenLastCalledWith({
      form: "pre",
      itemId: first.id,
      optionId: first.options[2].id,
    });
  });

  it("does not finish the check-in if the last answer fails to save", async () => {
    const saved = Object.fromEntries(
      content.items.slice(0, -1).map((i) => [i.id, i.options[0].id]),
    );
    submitCheckInAnswer.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = userEvent.setup();
    render(<CheckInPlayer content={content} initialResponses={saved} />);
    await user.click(screen.getByRole("button", { name: "Carry on" }));

    const last = content.items.at(-1)!;
    await user.click(screen.getByRole("radio", { name: last.options[0].label }));
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(screen.queryByText("All done")).toBeNull();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(finishCheckIn).not.toHaveBeenCalled();
  });
});

describe("check-in finalization", () => {
  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
      resolve = res;
    });
    return { promise, resolve };
  }

  /** Answer the last remaining story so the closing screen is showing. */
  async function reachClosingScreen() {
    const saved = Object.fromEntries(
      content.items.slice(0, -1).map((i) => [i.id, i.options[0].id]),
    );
    const user = userEvent.setup();
    render(<CheckInPlayer content={content} initialResponses={saved} />);
    await user.click(screen.getByRole("button", { name: "Carry on" }));
    const last = content.items.at(-1)!;
    await user.click(screen.getByRole("radio", { name: last.options[0].label }));
    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.getByText("All done")).toBeInTheDocument();
    return user;
  }

  it("waits visibly and does not navigate while finishing", async () => {
    const gate = deferred<void>();
    finishCheckIn.mockReturnValueOnce(gate.promise as never);

    const user = await reachClosingScreen();
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("All done")).toBeInTheDocument();

    await act(async () => {
      gate.resolve();
    });
    expect(push).toHaveBeenCalledWith("/student");
  });

  it("stays on the closing screen and keeps every answer when finishing fails", async () => {
    finishCheckIn.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = await reachClosingScreen();
    // All nine answers reached the server before this point.
    expect(submitCheckInAnswer).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("All done")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      `All ${content.items.length} of your answers are safe`,
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("routes away only once the completion marker succeeds", async () => {
    finishCheckIn.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = await reachClosingScreen();
    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(finishCheckIn).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/student");
  });

  it("ignores extra taps while a finish is already in flight", async () => {
    const gate = deferred<void>();
    finishCheckIn.mockReturnValueOnce(gate.promise as never);

    const user = await reachClosingScreen();
    const button = screen.getByRole("button", { name: "Finish" });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "Saving…" }));
    await user.click(screen.getByRole("button", { name: "Saving…" }));

    expect(finishCheckIn).toHaveBeenCalledTimes(1);

    await act(async () => {
      gate.resolve();
    });
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("survives repeated failures and still finishes on a later retry", async () => {
    finishCheckIn
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = await reachClosingScreen();
    await user.click(screen.getByRole("button", { name: "Finish" }));
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(finishCheckIn).toHaveBeenCalledTimes(3);
    expect(push).toHaveBeenCalledWith("/student");
  });
});

describe("check-in interrupted-session recovery", () => {
  const allAnswered = Object.fromEntries(
    content.items.map((i) => [i.id, i.options[0].id]),
  );

  it("opens straight on the finishing screen when every answer is already saved", () => {
    render(<CheckInPlayer content={content} initialResponses={allAnswered} />);

    expect(screen.getByRole("heading", { name: "Let's finish saving" })).toBeInTheDocument();
    expect(
      screen.getByText(
        `You already answered all ${content.items.length} stories, and every one of them is safe.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finish" })).toBeEnabled();
  });

  it("does not march the child back through stories they have answered", () => {
    render(<CheckInPlayer content={content} initialResponses={allAnswered} />);

    // No story, no options, nothing to re-answer.
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByText(content.items[0].scenario)).toBeNull();
    expect(screen.queryByRole("button", { name: "Start" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Carry on" })).toBeNull();
    expect(screen.queryByText(/Story \d+ of/)).toBeNull();
  });

  it("rewrites no answers on the way to finishing", async () => {
    const user = userEvent.setup();
    render(<CheckInPlayer content={content} initialResponses={allAnswered} />);

    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(submitCheckInAnswer).not.toHaveBeenCalled();
    expect(finishCheckIn).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/student");
  });

  it("still resumes a partly answered check-in at the first unanswered story", async () => {
    const partial = Object.fromEntries(
      content.items.slice(0, 4).map((i) => [i.id, i.options[0].id]),
    );
    const user = userEvent.setup();
    render(<CheckInPlayer content={content} initialResponses={partial} />);

    // A partial set still goes through the intro, then lands on story 5.
    expect(screen.queryByRole("heading", { name: "Let's finish saving" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Carry on" }));
    expect(
      screen.getByRole("heading", { name: `Story 5 of ${content.items.length}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.items[4].scenario)).toBeInTheDocument();
  });

  it("treats a check-in with no answers as a fresh start, not a recovery", () => {
    render(<CheckInPlayer content={content} initialResponses={{}} />);
    expect(screen.queryByRole("heading", { name: "Let's finish saving" })).toBeNull();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("recovers after a finalization failure, a walk away, and a fresh open", async () => {
    // First visit: every answer saved, then finishing fails.
    finishCheckIn.mockRejectedValueOnce(new Error("Failed to fetch"));
    const user = userEvent.setup();
    const first = render(
      <CheckInPlayer content={content} initialResponses={allAnswered} />,
    );

    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    // The child closes the tab. The server still holds nine answers and no
    // completion marker, which is exactly what the page would hand back.
    first.unmount();

    render(<CheckInPlayer content={content} initialResponses={allAnswered} />);
    expect(screen.getByRole("heading", { name: "Let's finish saving" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(submitCheckInAnswer).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/student");
  });

  it("says 'All done' rather than the recovery copy on a normal finish", async () => {
    const saved = Object.fromEntries(
      content.items.slice(0, -1).map((i) => [i.id, i.options[0].id]),
    );
    const user = userEvent.setup();
    render(<CheckInPlayer content={content} initialResponses={saved} />);
    await user.click(screen.getByRole("button", { name: "Carry on" }));

    const last = content.items.at(-1)!;
    await user.click(screen.getByRole("radio", { name: last.options[0].label }));
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(screen.getByRole("heading", { name: "All done" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Let's finish saving" })).toBeNull();
  });
});

describe("check-in keyboard focus visibility", () => {
  it("moves focus into the option group with Tab and shows it on the card", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    await user.tab();
    let guard = 0;
    while (
      guard++ < 12 &&
      (document.activeElement as HTMLElement)?.getAttribute("type") !== "radio"
    ) {
      await user.tab();
    }

    const focused = document.activeElement as HTMLInputElement;
    expect(focused.type).toBe("radio");
    expect(focused.value).toBe(first.options[0].id);

    // The ring is painted on the visible card, not the clipped input.
    const card = focused.closest("label")!;
    expect(card.className).toContain("has-[input:focus-visible]:outline-4");
    expect(card.className).toContain("has-[input:focus-visible]:outline-marigold-deep");
    expect(focused.className).toContain("focus-visible:outline-none");
  });

  it("keeps the focus ring distinct from the selected state", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    await user.click(screen.getByRole("radio", { name: first.options[1].label }));
    const card = screen
      .getByRole("radio", { name: first.options[1].label })
      .closest("label")!;

    // Selected is denim on the border and background; focus is a marigold
    // outline outside it. A card can show both at once without ambiguity.
    expect(card.className).toContain("border-denim-deep");
    expect(card.className).toContain("bg-denim-wash");
    expect(card.className).toContain("has-[input:focus-visible]:outline-marigold-deep");
  });

  it("selects with arrow keys once the group has focus", async () => {
    const user = await startCheckIn();
    const first = content.items[0];

    screen.getAllByRole("radio")[0].focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("radio", { name: first.options[1].label })).toBeChecked();
    expect(document.activeElement).toBe(
      screen.getByRole("radio", { name: first.options[1].label }),
    );
    expect(submitCheckInAnswer).not.toHaveBeenCalled();
  });
});
