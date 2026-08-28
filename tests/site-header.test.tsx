// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const { SiteHeader } = await import("@/components/SiteHeader");

afterEach(cleanup);

/**
 * Sprint 45. Sprint 44's browser check found that pressing Escape with a
 * dropdown link focused hid the menu but left focus on that link — still in the
 * document, no longer visible. A keyboard or switch user then pressed Tab from
 * a location they could not see. "Escape closes" is only a way out if what it
 * closes gives focus back somewhere findable.
 *
 * These run against the real component in jsdom rather than asserting on the
 * source, because focus is behaviour: the question is where the browser puts it,
 * not which line of code was written.
 */
describe("the marketing menu gives focus back when Escape closes it", () => {
  const openSchoolMenu = async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: /for your school/i });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    return { user, trigger };
  };

  it("returns focus to the trigger that opened it", async () => {
    const { user, trigger } = await openSchoolMenu();
    const teachers = screen.getByRole("link", { name: /teachers/i });

    teachers.focus();
    expect(teachers).toHaveFocus();

    await user.keyboard("{Escape}");

    // The menu is shut, the trigger says so, and focus is on the trigger.
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    // And explicitly not on the link, which is the defect being fixed: it is
    // still in the document and no longer visible.
    expect(teachers).not.toHaveFocus();
    expect(teachers).not.toBeVisible();
  });

  it("returns focus even when Escape is pressed with the trigger itself focused", async () => {
    const { user, trigger } = await openSchoolMenu();
    trigger.focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("gives each trigger back its own menu, not the other one", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const program = screen.getByRole("button", { name: /the program/i });
    const school = screen.getByRole("button", { name: /for your school/i });

    await user.click(program);
    screen.getByRole("link", { name: /curriculum/i }).focus();
    await user.keyboard("{Escape}");

    expect(program).toHaveFocus();
    expect(school).not.toHaveFocus();
    expect(school).toHaveAttribute("aria-expanded", "false");
  });

  it("does not pull focus back when a link is chosen", async () => {
    const { user, trigger } = await openSchoolMenu();
    const teachers = screen.getByRole("link", { name: /teachers/i });

    await user.click(teachers);

    // Following a link closes the menu, and focus belongs with the navigation
    // the user just started — not yanked back to the button they left.
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveFocus();
  });

  it("does not pull focus back when the user clicks outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SiteHeader />
        <button type="button">Somewhere else</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: /for your school/i });
    await user.click(trigger);
    screen.getByRole("link", { name: /teachers/i }).focus();

    const outside = screen.getByRole("button", { name: /somewhere else/i });
    await user.click(outside);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveFocus();
  });

  it("does not pull focus back when focus moves away on its own", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SiteHeader />
        <button type="button">Somewhere else</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: /for your school/i });
    await user.click(trigger);
    screen.getByRole("link", { name: /teachers/i }).focus();

    const outside = screen.getByRole("button", { name: /somewhere else/i });
    outside.focus();

    // Tabbing away dismisses the menu, and focus stays where the user sent it.
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(outside).toHaveFocus();
    expect(trigger).not.toHaveFocus();
  });

  it("does not pull focus back when the trigger is toggled closed", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SiteHeader />
        <button type="button">Somewhere else</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: /for your school/i });
    await user.click(trigger);
    // Captured while the menu is open: once it closes the link is hidden, and
    // a hidden element is not in the accessibility tree to be queried again.
    const teachers = screen.getByRole("link", { name: /teachers/i });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // A pointer user clicking the trigger closed leaves focus wherever the
    // browser's own click handling put it; nothing here reaches in to move it.
    expect(document.activeElement).not.toBe(teachers);
  });

  it("does not reopen itself when focus comes back to the trigger", async () => {
    const { user, trigger } = await openSchoolMenu();
    screen.getByRole("link", { name: /teachers/i }).focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();

    // The refocus must not trip the dismissal listeners into a reopen or a
    // second close. One Escape, one close, one focus move, and it settles.
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("keeps Escape working the second time the menu is opened", async () => {
    const { user, trigger } = await openSchoolMenu();
    await user.keyboard("{Escape}");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    screen.getByRole("link", { name: /plans/i }).focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("leaves every link reachable and labelled while the menu is open", async () => {
    const { trigger } = await openSchoolMenu();
    const menu = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    const links = within(menu).getAllByRole("link");
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toBeVisible();
      expect(link.tabIndex).toBeGreaterThanOrEqual(0);
    }
    // The blurb sprint 44 corrected, asserted where a buyer reads it.
    expect(menu.textContent).toContain("Preview, assign, discuss, prepare");
    expect(menu.textContent).not.toMatch(/certif/i);
  });
});

/**
 * Sprint 46. Sprint 45 gave the desktop disclosure a keyboard exit and left the
 * responsive panel without one, so the same navigation escaped differently
 * depending on how wide the window was. On a tablet that panel covers most of
 * the screen and the only way out was to find the Menu button again.
 *
 * jsdom renders both the desktop and the mobile markup, because the split is a
 * CSS breakpoint and there is no CSS here. That is useful: it lets these tests
 * drive the mobile panel directly, and it is also why the viewport-trap guard
 * cannot be exercised by resizing — it is asserted through the focus-location
 * rule instead, and checked for real in the browser.
 */
describe("the responsive menu escapes the same way the desktop one does", () => {
  const openMobile = async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: /^menu$/i });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById("site-menu")!;
    expect(panel.hidden).toBe(false);
    return { user, trigger, panel };
  };

  const panelLink = (panel: HTMLElement, label: RegExp) =>
    within(panel)
      .getAllByRole("link")
      .find((a) => label.test(a.textContent ?? ""))!;

  it("closes on Escape and returns visible focus to the Menu trigger", async () => {
    const { user, trigger, panel } = await openMobile();
    const curriculum = panelLink(panel, /curriculum/i);

    curriculum.focus();
    expect(curriculum).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel.hidden).toBe(true);
    expect(trigger).toHaveFocus();
    expect(curriculum).not.toHaveFocus();
    expect(curriculum).not.toBeVisible();
  });

  it("does not steal focus when it has already moved elsewhere", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SiteHeader />
        <button type="button">Somewhere else</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: /^menu$/i });
    await user.click(trigger);
    const outside = screen.getByRole("button", { name: /somewhere else/i });
    outside.focus();

    await user.keyboard("{Escape}");

    // The panel may close — that is a safe reset — but focus stays put. This is
    // also the rule that protects the resize case: at desktop width the panel
    // is CSS-hidden, so focus cannot be inside it and is never pulled back.
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(outside).toHaveFocus();
    expect(trigger).not.toHaveFocus();
  });

  it("does not interfere with Escape while the panel is closed", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SiteHeader />
        <button type="button">Somewhere else</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: /^menu$/i });
    const outside = screen.getByRole("button", { name: /somewhere else/i });
    outside.focus();

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(outside).toHaveFocus();
  });

  it("does not pull focus back when a link in the panel is chosen", async () => {
    const { user, trigger, panel } = await openMobile();
    const families = panelLink(panel, /families/i);

    await user.click(families);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveFocus();
  });

  it("leaves ordinary focus alone when the trigger is toggled closed", async () => {
    const { user, trigger, panel } = await openMobile();
    const plans = panelLink(panel, /plans/i);
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).not.toBe(plans);
  });

  it("keeps working when the panel is opened again", async () => {
    const { user, trigger, panel } = await openMobile();
    panelLink(panel, /curriculum/i).focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    panelLink(panel, /plans/i).focus();
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("does not reopen or double-close on a second Escape", async () => {
    const { user, trigger, panel } = await openMobile();
    panelLink(panel, /curriculum/i).focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("does not disturb the desktop disclosure", async () => {
    const { user, trigger, panel } = await openMobile();
    // The desktop triggers are in the same document here, because the split is
    // a CSS breakpoint. Closing the panel must leave them exactly as they were.
    const school = screen.getByRole("button", { name: /for your school/i });
    expect(school).toHaveAttribute("aria-expanded", "false");

    panelLink(panel, /curriculum/i).focus();
    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
    expect(school).toHaveAttribute("aria-expanded", "false");
    expect(school).not.toHaveFocus();

    // And the desktop menu still escapes on its own terms afterwards.
    await user.click(school);
    screen.getByRole("link", { name: /^teachers/i }).focus();
    await user.keyboard("{Escape}");
    expect(school).toHaveFocus();
    expect(school).toHaveAttribute("aria-expanded", "false");
  });
});
