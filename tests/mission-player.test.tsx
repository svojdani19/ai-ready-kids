// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const submitDecision = vi.fn(async () => ({ ok: true as const }));
const finishMission = vi.fn(async () => {});

vi.mock("@/app/actions/student", () => ({
  submitDecision: (...args: unknown[]) => submitDecision(...(args as [])),
  finishMission: (...args: unknown[]) => finishMission(...(args as [])),
  beginMission: vi.fn(),
  replayMission: vi.fn(),
  submitCheckInAnswer: vi.fn(),
  finishCheckIn: vi.fn(),
}));

const { MissionPlayer } = await import("@/app/student/play/[slug]/MissionPlayer");
const { getMission } = await import("@/content/missions");

const mission = getMission("sprocket-wants-to-know")!;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderPlayer(sceneId = mission.openingSceneId, completed = false) {
  return render(
    <MissionPlayer mission={mission} initialSceneId={sceneId} alreadyCompleted={completed} />,
  );
}

describe("mission player", () => {
  it("opens on the first story scene with a way forward", async () => {
    renderPlayer();
    expect(screen.getByText(/tablet cart rolls in/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    // A story scene is not a decision, so nothing is recorded yet.
    expect(submitDecision).not.toHaveBeenCalled();
  });

  it("advances to the first decision and offers every authored choice", async () => {
    const user = userEvent.setup();
    renderPlayer();
    await user.click(screen.getByRole("button", { name: "Next" }));

    const scene = mission.scenes.find((s) => s.id === "s2")!;
    for (const choice of scene.choices!) {
      expect(screen.getByRole("button", { name: choice.label })).toBeInTheDocument();
    }
    expect(screen.getByText(/Decision 1 of/)).toBeInTheDocument();
  });

  it("shows authored feedback for a safe choice and records it", async () => {
    const user = userEvent.setup();
    renderPlayer("s2");

    const safe = mission.scenes.find((s) => s.id === "s2")!.choices!.find(
      (c) => c.feedback.tone === "strong",
    )!;
    await user.click(screen.getByRole("button", { name: safe.label }));

    expect(screen.getByText(safe.feedback.headline)).toBeInTheDocument();
    expect(screen.getByText(safe.feedback.body)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep going" })).toBeInTheDocument();

    await waitFor(() =>
      expect(submitDecision).toHaveBeenCalledWith({
        slug: mission.slug,
        sceneId: "s2",
        choiceId: safe.id,
      }),
    );
  });

  it("loops an unsafe choice back to the same question instead of ending it", async () => {
    const user = userEvent.setup();
    renderPlayer("s2");

    const scene = mission.scenes.find((s) => s.id === "s2")!;
    const unsafe = scene.choices!.find((c) => c.feedback.tone === "rethink")!;
    await user.click(screen.getByRole("button", { name: unsafe.label }));

    expect(screen.getByText(unsafe.feedback.headline)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Have another go" }));

    // Back on the same scene, with every option available again.
    for (const choice of scene.choices!) {
      expect(screen.getByRole("button", { name: choice.label })).toBeInTheDocument();
    }
  });

  it("never shows a coach note to a student", async () => {
    const user = userEvent.setup();
    renderPlayer("s5");
    const withNote = mission.scenes
      .find((s) => s.id === "s5")!
      .choices!.find((c) => c.feedback.coachNote)!;

    await user.click(screen.getByRole("button", { name: withNote.label }));
    expect(screen.getByText(withNote.feedback.headline)).toBeInTheDocument();
    expect(screen.queryByText(withNote.feedback.coachNote!)).not.toBeInTheDocument();
  });

  it("announces feedback politely for screen readers", async () => {
    const user = userEvent.setup();
    renderPlayer("s2");
    const safe = mission.scenes.find((s) => s.id === "s2")!.choices!.find(
      (c) => c.feedback.tone === "strong",
    )!;
    await user.click(screen.getByRole("button", { name: safe.label }));

    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live).toBeInTheDocument();
    expect(within(live as HTMLElement).getByText(safe.feedback.headline)).toBeInTheDocument();
  });

  it("awards the badge and records completion on the ending scene", async () => {
    const ending = mission.scenes.find((s) => s.kind === "ending")!;
    renderPlayer(ending.id);

    await waitFor(() => expect(finishMission).toHaveBeenCalledWith(mission.slug));
    await waitFor(() => expect(screen.getByText("Badge earned")).toBeInTheDocument());
    expect(screen.getByText(mission.badge.name)).toBeInTheDocument();
    for (const line of ending.wrapUp!) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });

  it("records nothing when replaying a mission that is already finished", async () => {
    const user = userEvent.setup();
    renderPlayer("s2", true);

    const safe = mission.scenes.find((s) => s.id === "s2")!.choices!.find(
      (c) => c.feedback.tone === "strong",
    )!;
    await user.click(screen.getByRole("button", { name: safe.label }));

    expect(screen.getByText(safe.feedback.headline)).toBeInTheDocument();
    expect(submitDecision).not.toHaveBeenCalled();
    expect(screen.getByText(/your badge\s+stays/i)).toBeInTheDocument();
  });

  it("is fully operable from the keyboard", async () => {
    const user = userEvent.setup();
    renderPlayer("s2");
    const scene = mission.scenes.find((s) => s.id === "s2")!;

    // Tab until the first choice has focus, then activate it with Enter.
    const first = screen.getByRole("button", { name: scene.choices![0].label });
    first.focus();
    expect(first).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(scene.choices![0].feedback.headline)).toBeInTheDocument();
  });
});

describe("mission player save resilience", () => {
  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
      resolve = res;
    });
    return { promise, resolve };
  }

  const scene = mission.scenes.find((s) => s.id === "s2")!;
  const safe = scene.choices!.find((c) => c.feedback.tone === "strong")!;
  const unsafe = scene.choices!.find((c) => c.feedback.tone === "rethink")!;

  it("shows the authored feedback at once but holds the way forward", async () => {
    const gate = deferred<{ ok: true }>();
    submitDecision.mockReturnValueOnce(gate.promise as never);

    const user = userEvent.setup();
    renderPlayer("s2");
    await user.click(screen.getByRole("button", { name: safe.label }));

    // Reading does not wait on the network; leaving does.
    expect(screen.getByText(safe.feedback.body)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Keep going" })).toBeNull();

    await act(async () => {
      gate.resolve({ ok: true });
    });
    expect(screen.getByRole("button", { name: "Keep going" })).toBeEnabled();
  });

  it("cannot be advanced past an unsaved decision", async () => {
    const gate = deferred<{ ok: true }>();
    submitDecision.mockReturnValueOnce(gate.promise as never);

    const user = userEvent.setup();
    renderPlayer("s2");
    await user.click(screen.getByRole("button", { name: safe.label }));

    await user.click(screen.getByRole("button", { name: "Saving…" }));
    // Still on the feedback for the same decision.
    expect(screen.getByText(safe.feedback.headline)).toBeInTheDocument();

    await act(async () => {
      gate.resolve({ ok: true });
    });
    await user.click(screen.getByRole("button", { name: "Keep going" }));
    expect(screen.queryByText(safe.feedback.headline)).toBeNull();
  });

  it("keeps the child on the feedback screen when the save fails", async () => {
    submitDecision.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = userEvent.setup();
    renderPlayer("s2");
    await user.click(screen.getByRole("button", { name: safe.label }));

    expect(screen.getByRole("alert")).toHaveTextContent("Nothing is lost");
    expect(screen.getByText(safe.feedback.body)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Keep going" })).toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("resends the same decision on Try again and then lets the child move on", async () => {
    submitDecision.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = userEvent.setup();
    renderPlayer("s2");
    await user.click(screen.getByRole("button", { name: safe.label }));
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(submitDecision).toHaveBeenCalledTimes(2);
    expect(submitDecision).toHaveBeenLastCalledWith({
      slug: mission.slug,
      sceneId: "s2",
      choiceId: safe.id,
    });
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Keep going" }));
    expect(screen.queryByText(safe.feedback.headline)).toBeNull();
  });

  it("blocks the retry branch too, so a loop-back is recorded before it loops", async () => {
    submitDecision.mockRejectedValueOnce(new Error("Failed to fetch"));

    const user = userEvent.setup();
    renderPlayer("s2");
    await user.click(screen.getByRole("button", { name: unsafe.label }));

    expect(screen.queryByRole("button", { name: "Have another go" })).toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await user.click(screen.getByRole("button", { name: "Have another go" }));
    expect(screen.getByRole("button", { name: safe.label })).toBeInTheDocument();
  });

  it("never waits on a replay, because a replay writes nothing", async () => {
    const user = userEvent.setup();
    renderPlayer("s2", true);
    await user.click(screen.getByRole("button", { name: safe.label }));

    expect(submitDecision).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Keep going" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Keep going" }));
    expect(screen.queryByText(safe.feedback.headline)).toBeNull();
    expect(submitDecision).not.toHaveBeenCalled();
  });

  it("offers a retry when recording the finished mission fails", async () => {
    finishMission.mockRejectedValueOnce(new Error("Failed to fetch"));
    const ending = mission.scenes.find((s) => s.kind === "ending")!;

    renderPlayer(ending.id);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing you did is lost");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(finishMission).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});

describe("mission completion integrity", () => {
  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  const ending = mission.scenes.find((s) => s.kind === "ending")!;

  it("does not claim the badge while the save is still in flight", async () => {
    const gate = deferred<void>();
    finishMission.mockReturnValueOnce(gate.promise as never);

    renderPlayer(ending.id);

    expect(screen.getByText("Saving your badge…")).toBeInTheDocument();
    expect(screen.queryByText("Badge earned")).toBeNull();
    // The wrap-up is still there: the child has finished, we just have not
    // written it down.
    for (const line of ending.wrapUp!) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }

    await act(async () => {
      gate.resolve();
    });
    expect(screen.getByText("Badge earned")).toBeInTheDocument();
    expect(screen.queryByText("Saving your badge…")).toBeNull();
  });

  it("offers no way out of the mission until completion is recorded", async () => {
    const gate = deferred<void>();
    finishMission.mockReturnValueOnce(gate.promise as never);

    renderPlayer(ending.id);

    expect(screen.queryByRole("link", { name: "Back to my missions" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Take-home page" })).toBeNull();
    // The mid-mission escape hatch is gone on the ending scene too, so there
    // is no ungated route off this screen.
    expect(screen.queryByRole("link", { name: "Save and exit" })).toBeNull();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();

    await act(async () => {
      gate.resolve();
    });
    expect(screen.getByRole("link", { name: "Back to my missions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Take-home page" })).toBeInTheDocument();
  });

  it("does not claim the badge, or open the exits, when the save fails", async () => {
    finishMission.mockRejectedValueOnce(new Error("Failed to fetch"));

    renderPlayer(ending.id);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    expect(screen.queryByText("Badge earned")).toBeNull();
    expect(screen.getByText("Your badge is not lost")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back to my missions" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Take-home page" })).toBeNull();
    for (const line of ending.wrapUp!) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });

  it("awards the badge and opens the exits once a retry succeeds", async () => {
    finishMission.mockRejectedValueOnce(new Error("Failed to fetch"));
    const user = userEvent.setup();

    renderPlayer(ending.id);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByText("Badge earned")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Back to my missions" })).toBeInTheDocument();
    expect(finishMission).toHaveBeenCalledTimes(2);
  });

  it("does not tell a child they already finished, at the moment they finish", async () => {
    const ending = mission.scenes.find((s) => s.kind === "ending")!;
    const { rerender } = render(
      <MissionPlayer mission={mission} initialSceneId={ending.id} alreadyCompleted={false} />,
    );
    await waitFor(() => expect(screen.getByText("Badge earned")).toBeInTheDocument());

    // Recording completion re-renders the route with alreadyCompleted true.
    rerender(
      <MissionPlayer mission={mission} initialSceneId={ending.id} alreadyCompleted={true} />,
    );
    expect(screen.queryByText(/You already finished this one/)).toBeNull();
  });

  it("is immediate and write-free on a replay", async () => {
    renderPlayer(ending.id, true);

    expect(finishMission).not.toHaveBeenCalled();
    expect(screen.getByText("Badge earned")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to my missions" })).toBeInTheDocument();
    expect(screen.queryByText("Saving your badge…")).toBeNull();
  });
});
