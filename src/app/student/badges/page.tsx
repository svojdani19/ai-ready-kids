import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireStudent } from "@/lib/auth/session";
import { listAttemptsForStudent } from "@/lib/repo/progress";
import { summariseStudent } from "@/lib/domain/evidence";
import { COMPETENCIES } from "@/content/competencies";
import { FOUNDATIONS, MISSIONS, foundationsForGrade } from "@/content/missions";
import { BadgeSticker } from "@/components/art/BadgeSticker";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My badges" };

const LANE: Record<string, string> = {
  pine: "text-pine-deep",
  marigold: "text-marigold-deep",
  denim: "text-denim-deep",
};

export default async function BadgesPage() {
  const { student, classroom } = await requireStudent();
  const summary = summariseStudent(listAttemptsForStudent(getDb(), student.id));
  const earned = new Set(summary.badgeIds);

  // Only this class's First Look track, or a grade 1 child would be shown three
  // greyed-out badges from the grades 3 to 5 sessions they will never be
  // offered — a locked row with no way to unlock it, which is exactly what
  // this wall is meant not to be. A session from the other track still appears
  // if their teacher assigned it and they finished it.
  const firstLook = [
    ...foundationsForGrade(classroom.grade),
    ...FOUNDATIONS.filter(
      (m) => m.track !== foundationsForGrade(classroom.grade)[0]?.track && earned.has(m.badge.id),
    ),
  ].sort((a, b) => a.order - b.order);
  const total = firstLook.length + MISSIONS.length;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">My badges</h1>
      <p className="mt-1.5 max-w-2xl text-[1.05rem] text-ink-soft">
        You have {earned.size} of {total}. There is nothing to unlock and no
        streak to keep up. A badge just means you finished that mission.
      </p>

      <div className="mt-8 space-y-8">
        {firstLook.length > 0 && (
          <section>
            <h2 className="font-display text-2xl text-ink">First Look</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {firstLook.map((m) => {
                const has = earned.has(m.badge.id);
                return (
                  <li
                    key={m.id}
                    className={`flex flex-col items-center rounded-2xl border-2 p-5 text-center ${
                      has ? "border-ink bg-surface" : "border-dashed border-sand-deep bg-paper"
                    }`}
                  >
                    <BadgeSticker
                      skillId={m.primarySkillId}
                      competency={m.competency}
                      earned={has}
                      size={78}
                    />
                    <p className="mt-3 font-display text-lg leading-tight text-ink">
                      {m.badge.name}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-ink-soft">
                      {has ? m.badge.blurb : `Finish “${m.title}” to earn this.`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {COMPETENCIES.map((competency) => {
          const missions = MISSIONS.filter((m) => m.competency === competency.id);
          return (
            <section key={competency.id}>
              <h2 className={`font-display text-2xl ${LANE[competency.accent]}`}>
                {competency.name}
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-3">
                {missions.map((m) => {
                  const has = earned.has(m.badge.id);
                  return (
                    <li
                      key={m.id}
                      className={`flex flex-col items-center rounded-2xl border-2 p-5 text-center ${
                        has ? "border-ink bg-surface" : "border-dashed border-sand-deep bg-paper"
                      }`}
                    >
                      <BadgeSticker
                        skillId={m.primarySkillId}
                        competency={m.competency}
                        earned={has}
                        size={78}
                      />
                      <p className="mt-3 font-display text-lg leading-tight text-ink">
                        {m.badge.name}
                      </p>
                      <p className="mt-1 text-sm leading-snug text-ink-soft">
                        {has ? m.badge.blurb : `Finish “${m.title}” to earn this.`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-9 flex justify-center">
        <ButtonLink href="/student" variant="kid" size="lg">
          Back to my missions
        </ButtonLink>
      </div>
    </div>
  );
}
