// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

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

  it("reassures without echoing the stored value", () => {
    render(
      <AcademicDatesForm academicYear={null} startsOn={null} endsOn={null} settingsState="unreadable" />,
    );
    const note = screen.getByText(CORRECTION).closest("aside")!;
    expect(note.textContent).toMatch(/Nothing has been deleted/i);
    expect(note.textContent).toMatch(/no class or student record has changed/i);
    // Naming the bad value back is how a wrong record gets copied into a fix.
    expect(note.textContent).not.toMatch(/2026-13-45|2025-2027|\d{4}-\d{2}-\d{2}/);
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
