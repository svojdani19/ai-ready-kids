import type { FoundationTrack, Mission } from "../types";
import { earlyFoundations } from "./early";
import { upperFoundations } from "./upper";

/**
 * First Look — the introductory segment.
 *
 * Six sessions in two grade tiers, for a class that has not been told what AI
 * is. The core twenty-seven missions all assume three things a child arrives
 * with: that an AI program works from patterns in many examples to make a guess,
 * of which producing a likely next word is one kind, that it
 * is already inside ordinary tools, and that a person decides when it is used
 * and is answerable for the result. Before this segment existed those three
 * were assumed and never taught, which meant a mission about declining a
 * request for a home address was being played by children who thought the app
 * asking was alive.
 *
 * A class runs one track, not both. `foundationsForGrade` picks it, and the
 * teacher can override by assigning whichever sessions they want — a mixed
 * grade 2 and 3 room is a real thing and the product should not argue with a
 * teacher about it.
 *
 * These sessions record no skill evidence. See `Segment` in `../types` for
 * why, and `validateMission` for where it is enforced.
 *
 * `order` is per track rather than across the segment: each track is sessions
 * 1 to 3. A grade 5 class is offered three sessions and every screen calls them
 * 1, 2 and 3 — numbering them 4, 5 and 6 because another grade band exists
 * would send a teacher looking for the first three and leave a child thinking
 * they had missed something.
 */
export const FOUNDATIONS: Mission[] = [
  ...earlyFoundations.slice().sort((a, b) => a.order - b.order),
  ...upperFoundations.slice().sort((a, b) => a.order - b.order),
];

export const FOUNDATIONS_BY_TRACK: Record<FoundationTrack, Mission[]> = {
  early: FOUNDATIONS.filter((m) => m.track === "early"),
  upper: FOUNDATIONS.filter((m) => m.track === "upper"),
};

export const FOUNDATION_TRACKS: {
  id: FoundationTrack;
  name: string;
  grades: string;
  /** Educator-facing, one line, used on the library and the curriculum page. */
  blurb: string;
}[] = [
  {
    id: "early",
    name: "First Look, early",
    grades: "Grades 1 and 2",
    blurb:
      "Three short sessions for children who have not been told what AI is, written to be read aloud and answered together before anybody plays them on a device.",
  },
  {
    id: "upper",
    name: "First Look, upper",
    grades: "Grades 3 to 5",
    blurb:
      "The same three ideas for readers who have probably already used an AI tool without being told that is what it was, including a live demonstration of a confident invented answer.",
  },
];

/** The track a class of this grade should be offered. */
export function trackForGrade(grade: number): FoundationTrack {
  return grade <= 2 ? "early" : "upper";
}

/** The First Look sessions a class of this grade should be offered. */
export function foundationsForGrade(grade: number): Mission[] {
  return FOUNDATIONS_BY_TRACK[trackForGrade(grade)];
}
