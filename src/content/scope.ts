import { FOUNDATIONS, FOUNDATION_TRACKS, FOUNDATIONS_BY_TRACK } from "./foundations";
import { MISSIONS } from "./missions";
import type { GradeBand } from "./types";

/**
 * What this product is actually sold as, derived from what it actually contains.
 *
 * The repository carried two incompatible commercial scopes. The assessed
 * program is **grades 2 to 4**: all 27 core missions are `gradeBand: "2-4"`, and
 * the check-ins, the nine-skill evidence, the badges, the school report and the
 * annual spine all key off those missions. Grades 1 and 5 get First Look, which
 * is three sessions and records no skill evidence at all.
 *
 * Some surfaces said that correctly — the For your school card, the
 * `CreateClassForm` hint, the curriculum footnote. Others sold an annual
 * grades 1 to 5 program: the README's opening sentence, the root metadata, the
 * site footer, the Approach description, the Curriculum description, and a Plans
 * card listing "All 27 missions and both check-in forms" with no grade
 * qualifier at all.
 *
 * A grade 1 or grade 5 buyer could read that as a full-year assessed program for
 * their students, buy it, and then find every library card in the product saying
 * grades 2 to 4 and their own track carrying no evidence. That is a renewal
 * objection and a trust problem at setup, and it is entirely a copy problem —
 * the content model was never ambiguous.
 *
 * So the scope is computed here rather than typed into prose. If the curriculum
 * ever gains a mission outside 2-4, or a track changes length, these values move
 * and the tests that assert the buyer copy against them fail. A phrase denylist
 * would have gone stale the first time somebody rephrased.
 */

/** Every distinct band across the core curriculum. One, or the label is a lie. */
const CORE_BANDS: GradeBand[] = [...new Set(MISSIONS.map((m) => m.gradeBand))];

/**
 * The single band the assessed program is written for.
 *
 * Deliberately throws rather than picking one. A mixed-band core curriculum is
 * not a scope this file can describe in a sentence, and the honest failure is a
 * build that stops rather than marketing copy that quietly narrows.
 */
export const CORE_GRADE_BAND: GradeBand = (() => {
  if (CORE_BANDS.length !== 1) {
    throw new Error(
      `The core curriculum spans ${CORE_BANDS.length} grade bands (${CORE_BANDS.join(
        ", ",
      )}). content/scope.ts describes one, and every buyer-facing claim is built from it.`,
    );
  }
  return CORE_BANDS[0];
})();

const bandLabel = (band: GradeBand) => `grades ${band.replace("-", " to ")}`;

/** "grades 2 to 4" — the phrase every buyer-facing scope claim is built from. */
export const CORE_GRADE_LABEL = bandLabel(CORE_GRADE_BAND);

export const CORE_MISSION_COUNT = MISSIONS.length;

/** Every First Look session that exists, across both tracks. */
export const FIRST_LOOK_TOTAL_SESSIONS = FOUNDATIONS.length;

/**
 * How many First Look sessions **one class** is offered.
 *
 * Not the total, and the difference is a commercial claim: a class runs the one
 * track written for its grade. Copy that says "six sessions" without saying
 * "two tracks" reads as six per class, which is twice what anybody gets.
 */
export const FIRST_LOOK_SESSIONS_PER_CLASS: number = (() => {
  const lengths = [...new Set(FOUNDATION_TRACKS.map((t) => FOUNDATIONS_BY_TRACK[t.id].length))];
  if (lengths.length !== 1) {
    throw new Error(
      `First Look tracks are uneven (${lengths.join(", ")} sessions). "a class receives N" is only sayable when they match.`,
    );
  }
  return lengths[0];
})();

/** "grades 1 and 2" / "grades 3 to 5", straight from the track definitions. */
export const FIRST_LOOK_TRACK_LABELS = FOUNDATION_TRACKS.map((t) => t.grades.toLowerCase());

/**
 * The one-line scope, for the surfaces that need a sentence rather than parts.
 *
 * Every clause here is derived. It names what is assessed, who it is for, and
 * what grades outside that band actually receive — which is the sentence the
 * README, the footer and the metadata were all missing.
 */
export const PROGRAM_SCOPE_SENTENCE =
  `${CORE_MISSION_COUNT} authored decision-practice missions for ${CORE_GRADE_LABEL}, ` +
  `with First Look — ${FIRST_LOOK_SESSIONS_PER_CLASS} short introductory sessions per class, ` +
  `in a ${FIRST_LOOK_TRACK_LABELS[0]} track and a ${FIRST_LOOK_TRACK_LABELS[1]} track — ` +
  `available to bridge into it.`;
