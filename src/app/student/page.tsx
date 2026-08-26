import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireStudent } from "@/lib/auth/session";
import { listAssignments } from "@/lib/repo/classroom";
import { listAttemptsForStudent, listBenchmarksForStudent } from "@/lib/repo/progress";
import { summariseStudent } from "@/lib/domain/evidence";
import { nextBenchmarkFor } from "@/lib/domain/benchmark";
import { COMPETENCIES } from "@/content/competencies";
import { MISSION_BY_ID, MISSIONS } from "@/content/missions";
import { BENCHMARK_FORMS } from "@/content/benchmark";
import { BadgeSticker } from "@/components/art/BadgeSticker";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";

export const metadata: Metadata = { title: "Your missions" };

const LANE: Record<string, { border: string; wash: string; text: string }> = {
  pine: { border: "border-pine", wash: "bg-pine-wash", text: "text-pine-deep" },
  marigold: { border: "border-marigold", wash: "bg-marigold-wash", text: "text-marigold-deep" },
  denim: { border: "border-denim", wash: "bg-denim-wash", text: "text-denim-deep" },
};

export default async function StudentHome() {
  const { student, classroom } = await requireStudent();
  const db = getDb();

  const assignments = listAssignments(db, classroom.id);
  const assignedIds = new Set(assignments.map((a) => a.mission_id));
  const attempts = listAttemptsForStudent(db, student.id);
  const summary = summariseStudent(attempts);
  const inProgress = new Set(summary.inProgressMissionIds);
  const completed = new Set(summary.completedMissionIds);

  const benchmarks = listBenchmarksForStudent(db, student.id);
  const nextCheckIn = nextBenchmarkFor(benchmarks);

  const assignedMissions = MISSIONS.filter((m) => assignedIds.has(m.id));
  const upNext =
    assignedMissions.find((m) => inProgress.has(m.id)) ??
    assignedMissions.find((m) => !completed.has(m.id));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">
            Hello, {student.display_name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-[1.05rem] text-ink-soft">
            You have finished {summary.completedMissionIds.length} of {assignedMissions.length}{" "}
            missions in {classroom.name}.
          </p>
        </div>
        {summary.badgeIds.length > 0 && (
          <Link
            href="/student/badges"
            aria-label={`See all my badges. You have ${summary.badgeIds.length}.`}
            className="flex items-center gap-1 rounded-2xl border-2 border-sand-deep bg-surface px-3 py-2"
          >
            <span className="flex -space-x-2">
              {summary.badgeIds.slice(0, 4).map((badgeId) => {
                const mission = MISSIONS.find((m) => m.badge.id === badgeId)!;
                return (
                  <BadgeSticker
                    key={badgeId}
                    badgeId={badgeId}
                    competency={mission.competency}
                    earned
                    size={34}
                  />
                );
              })}
            </span>
            <span className="ml-1.5 font-display text-base text-ink">
              {summary.badgeIds.length} badge{summary.badgeIds.length === 1 ? "" : "s"}
            </span>
          </Link>
        )}
      </div>

      {upNext && (
        <section className="mt-7 overflow-hidden rounded-3xl border-4 border-ink bg-marigold-wash">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marigold-deep">
                {inProgress.has(upNext.id) ? "Keep going" : "Up next"}
              </p>
              <h2 className="mt-1.5 font-display text-2xl leading-tight text-ink">
                {upNext.title}
              </h2>
              <p className="mt-1.5 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
                {upNext.teaser}
              </p>
            </div>
            <ButtonLink href={`/student/play/${upNext.slug}`} variant="kid" size="lg">
              {inProgress.has(upNext.id) ? "Carry on" : "Start"}
            </ButtonLink>
          </div>
        </section>
      )}

      {nextCheckIn && (
        <section className="mt-5 rounded-2xl border-2 border-denim bg-denim-wash p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-ink">
                {BENCHMARK_FORMS[nextCheckIn.form].title}
              </h2>
              <p className="mt-1 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
                Nine short stories. There is no score and no wrong-answer buzzer. It just
                helps your teacher know what the class should practise.
              </p>
            </div>
            <ButtonLink href={`/student/checkin/${nextCheckIn.form}`} variant="secondary">
              {nextCheckIn.resuming ? "Carry on" : "Start the check-in"}
            </ButtonLink>
          </div>
        </section>
      )}

      {assignedMissions.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No missions yet">
            Your teacher has not opened any missions for {classroom.name}. Check back after
            your next lesson.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-9 space-y-7">
          {COMPETENCIES.map((competency) => {
            const lane = LANE[competency.accent];
            const missions = assignedMissions.filter((m) => m.competency === competency.id);
            if (missions.length === 0) return null;
            const state = summary.competencies.find((c) => c.competency === competency.id)!;

            return (
              <section key={competency.id} aria-labelledby={`lane-${competency.id}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id={`lane-${competency.id}`}
                    className={`font-display text-2xl ${lane.text}`}
                  >
                    {competency.name}
                  </h2>
                  <p className="text-sm font-semibold text-ink-soft">
                    {state.missionsCompleted} of {missions.length} finished
                  </p>
                </div>
                <p className="mt-1 max-w-2xl text-[0.95rem] text-ink-soft">
                  {competency.kidBlurb}
                </p>

                <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {missions.map((m) => {
                    const isDone = completed.has(m.id);
                    const isStarted = inProgress.has(m.id);
                    return (
                      <li key={m.id}>
                        <Link
                          href={`/student/play/${m.slug}`}
                          aria-label={`${
                            isDone ? "Play again" : isStarted ? "Carry on with" : "Start"
                          } mission ${m.order}, ${m.title}`}
                          className={`ark-sticker flex h-full flex-col rounded-2xl border-4 border-ink p-4 transition-colors ${
                            isDone ? lane.wash : "bg-surface hover:bg-paper-deep"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                              Mission {m.order}
                            </span>
                            <BadgeSticker
                              badgeId={m.badge.id}
                              competency={m.competency}
                              earned={isDone}
                              size={38}
                            />
                          </div>
                          <h3 className="mt-2 font-display text-lg leading-snug text-ink">
                            {m.title}
                          </h3>
                          <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">
                            {m.teaser}
                          </p>
                          <p className={`mt-3 text-sm font-bold ${lane.text}`}>
                            {isDone ? "Finished ✓" : isStarted ? "Keep going →" : "Start →"}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* Kid-facing evidence. No score, no ranking, no risk label. */}
      <section aria-labelledby="can-do" className="mt-10 rounded-2xl border-2 border-sand-deep bg-surface p-5">
        <h2 id="can-do" className="font-display text-2xl text-ink">
          Things you have shown you can do
        </h2>
        <p className="mt-1 text-[0.95rem] text-ink-soft">
          These come from the choices you made in your missions.
        </p>
        {summary.skillsDemonstrated === 0 ? (
          <p className="mt-4 text-[0.95rem] text-ink-soft">
            Finish a mission and your first one will appear here.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {COMPETENCIES.flatMap((c) =>
              c.skills.map((skill) => {
                const result = summary.evidence[skill.id];
                if (result !== "demonstrated") return null;
                return (
                  <li
                    key={skill.id}
                    className={`flex items-start gap-2.5 rounded-xl border-2 px-3.5 py-2.5 ${LANE[c.accent].border} ${LANE[c.accent].wash}`}
                  >
                    <span aria-hidden="true" className="mt-0.5 font-bold text-ink">
                      ✓
                    </span>
                    <span className="text-[0.95rem] font-semibold leading-snug text-ink">
                      {skill.kidLabel}
                    </span>
                  </li>
                );
              }),
            )}
          </ul>
        )}
      </section>

      {summary.completedMissionIds.length > 0 && (
        <p className="mt-6 text-center text-sm text-ink-soft">
          Want to talk about these at home?{" "}
          <Link
            href={`/family/${MISSION_BY_ID[summary.completedMissionIds.at(-1)!]?.slug}`}
            className="font-semibold text-pine-deep underline underline-offset-2"
          >
            Print the family page for your last mission
          </Link>
          .
        </p>
      )}
    </div>
  );
}
