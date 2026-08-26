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

export interface CohortBenchmark {
  preCompleted: number;
  postCompleted: number;
  /** Students with both windows finished — the only fair growth denominator. */
  matched: number;
  preRate: number | null;
  postRate: number | null;
  /** Percentage points, matched students only. Null until both windows close. */
  growthPoints: number | null;
  byCompetency: {
    competency: CompetencyId;
    preRate: number | null;
    postRate: number | null;
    growthPoints: number | null;
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
  const preRate = rate(pre, "pre");
  const postRate = rate(post, "post");
  const matchedPreRate = rate(matchedPre, "pre");
  const matchedPostRate = rate(matchedPost, "post");

  return {
    preCompleted: pre.length,
    postCompleted: post.length,
    matched: matchedPre.length,
    preRate,
    postRate,
    growthPoints:
      matchedPreRate !== null && matchedPostRate !== null
        ? (matchedPostRate - matchedPreRate) * 100
        : null,
    byCompetency: COMPETENCY_IDS.map((competency) => {
      const p = competencyRate(matchedPre, "pre", competency);
      const q = competencyRate(matchedPost, "post", competency);
      return {
        competency,
        preRate: competencyRate(pre, "pre", competency),
        postRate: competencyRate(post, "post", competency),
        growthPoints: p !== null && q !== null ? (q - p) * 100 : null,
      };
    }),
  };
}

/** Which check-in a student should be offered next, if any. */
export function nextBenchmarkFor(
  records: BenchmarkRecord[],
): { form: BenchmarkForm; resuming: boolean } | null {
  const pre = records.find((r) => r.form === "pre");
  const post = records.find((r) => r.form === "post");
  if (!pre || !pre.completed_at) return { form: "pre", resuming: Boolean(pre) };
  if (!post || !post.completed_at) return { form: "post", resuming: Boolean(post) };
  return null;
}
