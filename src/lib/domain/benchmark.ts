import { BENCHMARK_FORMS } from "@/content/benchmark";
import { COMPETENCY_IDS } from "@/content/competencies";
import type { BenchmarkForm, CompetencyId } from "@/content/types";
import type { BenchmarkRecord } from "@/lib/types";

/**
 * Benchmark scoring.
 *
 * A student never sees any of this. It exists so a school can answer one
 * question at the end of the year: did the cohort get better at these three
 * things, measured on scenarios the missions never used.
 */

export interface FormScore {
  form: BenchmarkForm;
  correct: number;
  total: number;
  byCompetency: Record<CompetencyId, { correct: number; total: number }>;
}

export function scoreForm(
  form: BenchmarkForm,
  responses: Record<string, string>,
): FormScore {
  const content = BENCHMARK_FORMS[form];
  const byCompetency = Object.fromEntries(
    COMPETENCY_IDS.map((id) => [id, { correct: 0, total: 0 }]),
  ) as Record<CompetencyId, { correct: number; total: number }>;

  let correct = 0;
  for (const item of content.items) {
    byCompetency[item.competency].total += 1;
    const chosen = responses[item.id];
    const isCorrect = Boolean(chosen) && item.options.some((o) => o.id === chosen && o.correct);
    if (isCorrect) {
      correct += 1;
      byCompetency[item.competency].correct += 1;
    }
  }

  return { form, correct, total: content.items.length, byCompetency };
}

/**
 * The smallest group a check-in rate may be computed over. Suppression happens
 * here, at the source, rather than in one UI surface — a value that exists on
 * the object is a value that reaches the export, and the export promises this.
 */
export const MIN_BENCHMARK_GROUP = 5;

export interface CohortBenchmark {
  preCompleted: number;
  postCompleted: number;
  /** Students with both windows finished — the only fair denominator. */
  matched: number;
  preRate: number | null;
  postRate: number | null;
  /**
   * Percentage points between the two windows, matched students only. Null
   * until both windows close or the matched group is too small.
   *
   * Deliberately not called growth. The two forms have never been piloted or
   * equated, and each skill carries a single item, so a difference here is the
   * difference between two authored check-ins and nothing stronger. Naming the
   * field for the statistic it is not is how the overclaim gets back in.
   */
  pointsDifference: number | null;
  byCompetency: {
    competency: CompetencyId;
    preRate: number | null;
    postRate: number | null;
    /** As above: a difference between two authored forms, not growth. */
    pointsDifference: number | null;
  }[];
}

export function summariseCohortBenchmark(records: BenchmarkRecord[]): CohortBenchmark {
  const completed = records.filter((r) => r.completed_at);
  const pre = completed.filter((r) => r.form === "pre");
  const post = completed.filter((r) => r.form === "post");

  const postByStudent = new Map(post.map((r) => [r.student_id, r]));
  const matchedPre = pre.filter((r) => postByStudent.has(r.student_id));

  const rate = (list: BenchmarkRecord[], form: BenchmarkForm) => {
    if (!list.length) return null;
    const totals = list.reduce(
      (acc, r) => {
        const s = scoreForm(form, r.responses);
        return { correct: acc.correct + s.correct, total: acc.total + s.total };
      },
      { correct: 0, total: 0 },
    );
    return totals.total ? totals.correct / totals.total : null;
  };

  const competencyRate = (
    list: BenchmarkRecord[],
    form: BenchmarkForm,
    competency: CompetencyId,
  ) => {
    if (!list.length) return null;
    const totals = list.reduce(
      (acc, r) => {
        const s = scoreForm(form, r.responses).byCompetency[competency];
        return { correct: acc.correct + s.correct, total: acc.total + s.total };
      },
      { correct: 0, total: 0 },
    );
    return totals.total ? totals.correct / totals.total : null;
  };

  const matchedPost = post.filter((r) => matchedPre.some((p) => p.student_id === r.student_id));

  // Distinct students, not records. A window is reportable only when enough
  // different children finished it; growth only when enough finished both.
  const preStudents = new Set(pre.map((r) => r.student_id)).size;
  const postStudents = new Set(post.map((r) => r.student_id)).size;
  const matchedStudents = new Set(matchedPre.map((r) => r.student_id)).size;

  const preOk = preStudents >= MIN_BENCHMARK_GROUP;
  const postOk = postStudents >= MIN_BENCHMARK_GROUP;
  const matchedOk = matchedStudents >= MIN_BENCHMARK_GROUP;

  const matchedPreRate = matchedOk ? rate(matchedPre, "pre") : null;
  const matchedPostRate = matchedOk ? rate(matchedPost, "post") : null;

  return {
    preCompleted: pre.length,
    postCompleted: post.length,
    matched: matchedStudents,
    preRate: preOk ? rate(pre, "pre") : null,
    postRate: postOk ? rate(post, "post") : null,
    pointsDifference:
      matchedPreRate !== null && matchedPostRate !== null
        ? (matchedPostRate - matchedPreRate) * 100
        : null,
    byCompetency: COMPETENCY_IDS.map((competency) => {
      // The per-competency difference uses the same matched threshold as the
      // headline, so a cell is never more revealing than the figure above it.
      const p = matchedOk ? competencyRate(matchedPre, "pre", competency) : null;
      const q = matchedOk ? competencyRate(matchedPost, "post", competency) : null;
      return {
        competency,
        preRate: preOk ? competencyRate(pre, "pre", competency) : null,
        postRate: postOk ? competencyRate(post, "post", competency) : null,
        pointsDifference: p !== null && q !== null ? (q - p) * 100 : null,
      };
    }),
  };
}

/**
 * `nextBenchmarkFor` used to live here and offered the spring form the moment
 * the fall one was completed, with no window state anywhere. It now takes the
 * school's open window and lives in `@/lib/domain/eligibility` beside the rule
 * the page loader and the server action both enforce.
 */
