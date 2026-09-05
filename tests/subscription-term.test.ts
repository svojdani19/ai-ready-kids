import { afterAll, describe, expect, it } from "vitest";
import { demonstrationTerm } from "@/lib/db/seed";
import { createTestDb } from "./helpers";

/**
 * The demonstration school's subscription term.
 *
 * Two separate defects have shipped here, in opposite directions, and this file
 * exists so a third cannot.
 *
 * The renewal date was once a fixed string. It passed, then it expired, and the
 * demo told every visitor the subscription had ended.
 *
 * The repair floated the renewal date and left the start date fixed, so the term
 * grew by a day every day: by September 2026 the school showed a term running
 * two years and a month while the plans page sold one subscription per school
 * year. A guard against a stale date is not a guard against a false one.
 *
 * So both properties are asserted here, across a decade of seeding dates rather
 * than at whatever moment the suite happens to run.
 */

/** Every day the suite could plausibly run on, sampled across ten years. */
const SEED_DAYS: string[] = [];
for (let year = 2025; year <= 2035; year += 1) {
  for (const monthDay of ["01-01", "06-30", "08-17", "08-18", "08-19", "09-05", "12-31"]) {
    SEED_DAYS.push(`${year}-${monthDay}`);
  }
}

const at = (day: string) => new Date(`${day}T12:00:00.000Z`);
const yearsBetween = (from: string, to: string) =>
  (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) /
  (1000 * 60 * 60 * 24);

describe("the demonstration term is annual, whenever it is seeded", () => {
  it.each(SEED_DAYS)("seeded on %s", (day) => {
    const now = at(day);
    const term = demonstrationTerm(now);

    // FAILING-BEFORE: a fixed start with a floating renewal gave 748 days.
    const span = yearsBetween(term.startsOn, term.renewsOn);
    expect(span, `${term.startsOn} → ${term.renewsOn} is not one year`).toBeGreaterThanOrEqual(365);
    expect(span, `${term.startsOn} → ${term.renewsOn} is longer than a year`).toBeLessThanOrEqual(
      366,
    );
  });

  it.each(SEED_DAYS)("has not already lapsed on %s", (day) => {
    // FAILING-BEFORE: the fixed "2026-09-01" renewal, from 2026-09-02 onwards.
    const now = at(day);
    const term = demonstrationTerm(now);
    expect(Date.parse(`${term.renewsOn}T00:00:00.000Z`)).toBeGreaterThan(now.getTime());
  });

  it.each(SEED_DAYS)("has already begun on %s", (day) => {
    // A school cannot be mid-year on a subscription that starts next month.
    const now = at(day);
    const term = demonstrationTerm(now);
    expect(Date.parse(`${term.startsOn}T00:00:00.000Z`)).toBeLessThanOrEqual(now.getTime());
  });

  it("starts the same day it renews, a year apart, on the anchor itself", () => {
    // The boundary: seeded exactly on 18 August, a school gets a full year
    // ahead of it rather than one that renews today.
    const term = demonstrationTerm(at("2027-08-18"));
    expect(term).toEqual({ startsOn: "2027-08-18", renewsOn: "2028-08-18" });
    const dayBefore = demonstrationTerm(at("2027-08-17"));
    expect(dayBefore).toEqual({ startsOn: "2026-08-18", renewsOn: "2027-08-18" });
  });
});

describe("the seeded school carries that term, and keeps it apart from the school year", () => {
  const { db, cleanup } = createTestDb();
  afterAll(cleanup);
  const school = db
    .prepare("select term_starts_on, term_renews_on, academic_year, year_starts_on, year_ends_on from schools")
    .get() as Record<string, string>;

  it("stores an annual term", () => {
    const span = yearsBetween(school.term_starts_on, school.term_renews_on);
    expect(span).toBeGreaterThanOrEqual(365);
    expect(span).toBeLessThanOrEqual(366);
  });

  it("is live rather than lapsed", () => {
    expect(Date.parse(`${school.term_renews_on}T00:00:00.000Z`)).toBeGreaterThan(Date.now());
  });

  it("keeps the academic year as its own fact", () => {
    // Rollover and renewal are different events. A seed where the two dates
    // coincided would hide a conflation that has already been a defect once.
    expect(school.academic_year).toBe("2025-2026");
    expect(school.year_starts_on).toBe("2025-08-25");
    expect(school.year_ends_on).toBe("2026-06-12");
    expect(school.year_starts_on).not.toBe(school.term_starts_on);
    expect(school.year_ends_on).not.toBe(school.term_renews_on);
  });

  it("anchors the seeded history to the school year, not to the invoice", () => {
    // The attempt history starts just after the children arrive in August 2025
    // and stays there however long after that the database is seeded. A history
    // that followed the sliding term would begin in the term's own August, so
    // the first attempt landing before the term even starts is the proof.
    const first = (
      db.prepare("select min(started_at) as first from attempts").get() as { first: string }
    ).first.slice(0, 10);
    expect(first >= school.year_starts_on).toBe(true);
    expect(first < school.term_starts_on).toBe(true);
    expect(first.slice(0, 4)).toBe("2025");
  });
});
