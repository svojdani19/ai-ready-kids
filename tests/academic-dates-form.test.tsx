// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { AcademicDatesForm } = await import("@/app/admin/program/AcademicDatesForm");
const { academicSettingsState } = await import("@/lib/domain/calendar");

afterEach(cleanup);

/**
 * Sprint 62. The form received unreadable values as null - sprint 60 stopped
 * prefilling them - and then inferred `missing = !startsOn || !endsOn`. So a
 * corrupted current record produced "This school year has no recorded dates"
 * and an explanation about records brought forward from an earlier version.
 *
 * That is a claim about provenance the product cannot support. An absent legacy
 * column and a record somebody corrupted last week look identical from inside
 * the form, and they call for different responses: one is a migration to
 * finish, the other is a mistake to correct.
 */

const MIGRATION = /brought forward from an earlier version/i;
const CORRECTION = /cannot be read/i;

describe("the academic form tells missing data apart from a broken record", () => {
  const school = (over: Record<string, unknown>) => ({
    academic_year: "2025-2026",
    year_starts_on: "2025-08-25",
    year_ends_on: "2026-06-12",
    ...over,
  });

  it("classifies only the genuine migration shape as absent", () => {
    // A database from before sprint 32: no date columns at all.
    expect(academicSettingsState(school({ academic_year: "", year_starts_on: "", year_ends_on: "" }))).toBe("absent");
    expect(academicSettingsState(school({ year_starts_on: "", year_ends_on: "" }))).toBe("absent");

    // Present and unreadable, in every combination.
    expect(academicSettingsState(school({ year_starts_on: "2026-13-45" }))).toBe("unreadable");
    expect(academicSettingsState(school({ year_ends_on: "2026-02-30" }))).toBe("unreadable");
    expect(academicSettingsState(school({ academic_year: "2025-2027" }))).toBe("unreadable");
    // Mixed: one absent, one malformed.
    expect(academicSettingsState(school({ year_starts_on: "", year_ends_on: "2026-13-45" }))).toBe("unreadable");
    expect(academicSettingsState(school({ year_starts_on: "2026-13-45", year_ends_on: "" }))).toBe("unreadable");
    // Dates absent but the label itself corrupted: not a clean migration.
    expect(academicSettingsState(school({ academic_year: "2025-2027", year_starts_on: "", year_ends_on: "" }))).toBe("unreadable");
    // Both real dates, but the combination does not hold together.
    expect(academicSettingsState(school({ year_starts_on: "2026-06-12", year_ends_on: "2025-08-25" }))).toBe("unreadable");

    expect(academicSettingsState(school({}))).toBe("ok");
  });

  it("explains the migration only when the dates are genuinely absent", () => {
    render(<AcademicDatesForm academicYear={null} startsOn={null} endsOn={null} settingsState="absent" />);
    expect(screen.getByText(MIGRATION)).toBeInTheDocument();
    expect(screen.queryByText(CORRECTION)).toBeNull();
  });

  it("makes no provenance claim when a present record is unreadable", () => {
    render(<AcademicDatesForm academicYear={null} startsOn={null} endsOn={null} settingsState="unreadable" />);
    // The defect: this state used to carry the migration explanation.
    expect(screen.queryByText(MIGRATION)).toBeNull();
    expect(screen.getByText(CORRECTION)).toBeInTheDocument();
    expect(screen.getByText(/settings cannot be read/i)).toBeInTheDocument();
  });

  it("does not echo the stored value back", () => {
    render(
      <AcademicDatesForm academicYear={null} startsOn={null} endsOn={null} settingsState="unreadable" />,
    );
    const note = screen.getByText(CORRECTION).closest("aside")!;
    // Naming the bad value back is how a wrong record gets copied into a fix.
    expect(note.textContent).not.toMatch(/2026-13-45|2025-2027|\d{4}-\d{2}-\d{2}/);
  });

  /**
   * Sprint 63. The first version of this copy said "rollover and automatic
   * deletion are paused" and "Nothing has been deleted".
   *
   * Both overstate, on a privacy control where that matters. Retention is per
   * cohort: a class carries its own snapshotted year-end, and
   * `runScheduledPurge` deliberately keeps deleting cohorts whose own date is
   * valid and past — the partial purge sprint 60 built. An unreadable school
   * calendar blocks the rollover preview and the current-year summary date, and
   * nothing else. And "Nothing has been deleted" is a claim about history the
   * product cannot make: a purge may well have run last week.
   */
  it.each(["absent", "unreadable"] as const)(
    "describes what is actually blocked, in the %s state",
    (settingsState) => {
      render(
        <AcademicDatesForm academicYear={null} startsOn={null} endsOn={null} settingsState={settingsState} />,
      );
      const note = screen
        .getByText(settingsState === "absent" ? MIGRATION : CORRECTION)
        .closest("aside")!;
      const copy = note.textContent ?? "";

      // What is genuinely blocked.
      expect(copy).toMatch(/rollover and this year's retention date cannot be worked out/i);
      // What is not: a cohort with its own valid date keeps its schedule.
      expect(copy).toMatch(/valid recorded year-end still follow their own deletion dates/i);
      // And a cohort without one stays blocked.
      expect(copy).toMatch(/without one is not deleted automatically/i);
      // Present tense about this page, never a claim about what has happened.
      expect(copy).toMatch(/does not itself delete any student work/i);

      // The overbroad phrasings, forbidden explicitly.
      expect(copy).not.toMatch(/nothing has been deleted/i);
      expect(copy).not.toMatch(/no class or student record has changed/i);
      expect(copy).not.toMatch(/automatic deletion (is|are) paused/i);
      expect(copy).not.toMatch(/nothing is deleted automatically until/i);
      expect(copy).not.toMatch(/retention (is|are) (blocked|paused)/i);
    },
  );

  it("keeps the Program page from repeating the overstatement", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/admin/program/page.tsx"),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1");

    expect(page).toMatch(/rollover and this year's retention date can be worked out/i);
    expect(page).toMatch(/Classes with a valid recorded year-end keep their own deletion dates/i);
    expect(page).not.toMatch(/before rollover and retention can work/i);
    expect(page).not.toMatch(/Retention and rollover are blocked/i);
  });

  it("shows no note at all when the settings are usable", () => {
    render(
      <AcademicDatesForm
        academicYear="2025-2026"
        startsOn="2025-08-25"
        endsOn="2026-06-12"
        settingsState="ok"
      />,
    );
    expect(screen.queryByText(MIGRATION)).toBeNull();
    expect(screen.queryByText(CORRECTION)).toBeNull();
    // Valid behaviour unchanged: the fields still prefill and still submit.
    expect(screen.getByLabelText(/School year/i)).toHaveValue("2025-2026");
    expect(screen.getByLabelText(/First day/i)).toHaveValue("2025-08-25");
    expect(screen.getByLabelText(/Last day/i)).toHaveValue("2026-06-12");
    expect(screen.getByRole("button", { name: /Save these dates/i })).toBeEnabled();
  });

  it("never prefills a value it would reject, in either broken state", () => {
    for (const settingsState of ["absent", "unreadable"] as const) {
      cleanup();
      render(
        <AcademicDatesForm academicYear={null} startsOn={null} endsOn={null} settingsState={settingsState} />,
      );
      expect(screen.getByLabelText(/School year/i), settingsState).toHaveValue("");
      expect(screen.getByLabelText(/First day/i), settingsState).toHaveValue("");
      expect(screen.getByLabelText(/Last day/i), settingsState).toHaveValue("");
    }
  });
});
