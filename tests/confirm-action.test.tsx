// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const { ConfirmAction } = await import("@/components/staff/ConfirmAction");

afterEach(cleanup);

/**
 * A promise the test settles by hand, so the pending state can be inspected
 * while the action is genuinely in flight rather than guessed at with a timer.
 */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Result = void | { error?: string };

function setup(overrides?: Partial<Parameters<typeof ConfirmAction>[0]>) {
  const gate = deferred<Result>();
  const action = vi.fn(() => gate.promise);
  const user = userEvent.setup();
  render(
    <div>
      <button type="button">Before</button>
      <ConfirmAction
        label="Delete data"
        confirmLabel="Delete permanently"
        question="Delete Room 12 and all of its records?"
        action={action}
        {...overrides}
      />
      <button type="button">After</button>
    </div>,
  );
  return { user, action, gate };
}

const launcher = () => screen.getByRole("button", { name: "Delete data" });
const confirmButton = () => screen.getByRole("button", { name: /Delete permanently|Working…/ });

/**
 * Sprint 48. Two defects, and the first is the serious one.
 *
 * Cancel stayed operative after the confirm button was pressed, and all it did
 * was collapse the interface. The server action carried on. An administrator
 * could press Cancel on a class deletion, watch the confirmation vanish,
 * reasonably conclude they had stopped it, and find the roster gone. And focus
 * went nowhere at either step, in the control that guards deletion.
 */
describe("the confirmation step is honest about what it can still stop", () => {
  it("moves focus to the confirm action and describes it with the question", async () => {
    const { user } = setup();
    await user.click(launcher());

    const confirm = confirmButton();
    expect(confirm).toHaveFocus();
    // Inline two-step, not a modal: no dialog semantics anywhere.
    expect(screen.queryByRole("dialog")).toBeNull();
    // The question is the button's description, so the consequence is read out
    // with the control rather than sitting beside it unassociated.
    expect(confirm).toHaveAccessibleDescription("Delete Room 12 and all of its records?");
  });

  it("cancels before submission without calling the action, and gives focus back", async () => {
    const { user, action } = setup();
    await user.click(launcher());
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(action).not.toHaveBeenCalled();
    expect(launcher()).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("offers no operative Cancel once the request is away", async () => {
    const { user, gate } = setup();
    await user.click(launcher());
    await user.click(confirmButton());

    // The lie is gone: there is no Cancel to press, only a statement of fact.
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.getByText("Cannot be stopped now")).toBeInTheDocument();
    // And the confirm button cannot be pressed again.
    expect(confirmButton()).toBeDisabled();
    expect(confirmButton()).toHaveTextContent("Working…");

    gate.resolve(undefined);
    await waitFor(() => expect(screen.queryByText("Cannot be stopped now")).toBeNull());
  });

  it("cannot be reopened or re-fired while the action is in flight", async () => {
    const { user, action, gate } = setup();
    await user.click(launcher());
    await user.click(confirmButton());

    // The launcher does not exist while pending, so there is nothing to reopen.
    expect(screen.queryByRole("button", { name: "Delete data" })).toBeNull();
    await user.click(confirmButton()).catch(() => undefined);
    expect(action).toHaveBeenCalledTimes(1);

    gate.resolve(undefined);
    await waitFor(() => expect(launcher()).toBeInTheDocument());
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("calls the action exactly once however fast the confirm is double-pressed", async () => {
    const { user, action, gate } = setup();
    await user.click(launcher());
    const confirm = confirmButton();
    await Promise.all([user.click(confirm), user.click(confirm).catch(() => undefined)]);

    expect(action).toHaveBeenCalledTimes(1);
    gate.resolve(undefined);
    await waitFor(() => expect(launcher()).toBeInTheDocument());
  });

  it("collapses on an expected error, announces it, and returns focus for recovery", async () => {
    const { user, gate } = setup();
    await user.click(launcher());
    await user.click(confirmButton());
    gate.resolve({ error: "That class is not part of your school." });

    await waitFor(() => expect(launcher()).toBeInTheDocument());
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("That class is not part of your school.");
    // Recovery starts at the launcher, with the alert beside it.
    expect(launcher()).toHaveFocus();
  });

  it("clears a previous error when the action is tried again", async () => {
    const { user, gate } = setup();
    await user.click(launcher());
    await user.click(confirmButton());
    gate.resolve({ error: "Not your school." });
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    await user.click(launcher());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("restores focus to the launcher on success while it is still mounted", async () => {
    const { user, gate } = setup();
    await user.click(launcher());
    await user.click(confirmButton());
    gate.resolve(undefined);

    await waitFor(() => expect(launcher()).toBeInTheDocument());
    expect(launcher()).toHaveFocus();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("does not touch focus when the control is removed before the action settles", async () => {
    const gate = deferred<Result>();
    const action = vi.fn(() => gate.promise);
    const user = userEvent.setup();
    const { unmount } = render(
      <div>
        <ConfirmAction
          label="Delete data"
          confirmLabel="Delete permanently"
          question="Delete Room 12 and all of its records?"
          action={action}
        />
      </div>,
    );
    render(<button type="button">Elsewhere</button>);

    await user.click(launcher());
    await user.click(confirmButton());

    // The row is deleted and revalidation takes this control with it.
    unmount();
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();

    gate.resolve(undefined);
    await new Promise((r) => setTimeout(r, 20));

    // Nothing reaches out of an unmounted component to move focus, and nothing
    // focuses the detached launcher.
    expect(elsewhere).toHaveFocus();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does not steal focus on first render", () => {
    setup();
    expect(document.body).toHaveFocus();
    expect(launcher()).not.toHaveFocus();
  });

  it("keeps the quiet tone working the same way", async () => {
    const { user, action } = setup({ tone: "quiet", label: "Archive", confirmLabel: "Archive class" });
    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("button", { name: "Archive class" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Archive" })).toHaveFocus();
  });
});
