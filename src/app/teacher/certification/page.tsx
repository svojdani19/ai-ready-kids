import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { getCertification } from "@/lib/repo/progress";
import {
  CERTIFICATION_MINUTES,
  CERTIFICATION_MODULES,
  CERTIFICATION_TITLE,
} from "@/content/certification";
import { PageHeader } from "@/components/ui/Panel";
import { ButtonLink } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Meter";
import { Note } from "@/components/ui/Bits";
import { CertificationModuleCard } from "./CertificationModule";
import { CompleteButton } from "./CompleteButton";

export const metadata: Metadata = { title: CERTIFICATION_TITLE };

export default async function CertificationPage() {
  const { user } = await requireStaff();
  const record = getCertification(getDb(), user.id);
  const answers = record?.answers ?? {};
  const answered = CERTIFICATION_MODULES.filter((m) => answers[m.id]).length;
  const done = Boolean(record?.completed_at);

  return (
    <div>
      <PageHeader
        eyebrow="Educator orientation"
        title={CERTIFICATION_TITLE}
        description={`Five modules, about ${CERTIFICATION_MINUTES} minutes in total, designed for two prep periods rather than a summer institute. Your answers save as you go.`}
        actions={
          done ? (
            <ButtonLink href="/teacher/certification/certificate" variant="secondary">
              View certificate
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="rounded-xl border border-sand-deep bg-surface px-5 py-4">
        <Meter
          label="Modules answered"
          value={answered}
          max={CERTIFICATION_MODULES.length}
          accent="pine"
          valueLabel={`${answered} of ${CERTIFICATION_MODULES.length}`}
        />
        {done && (
          <p className="mt-3 text-sm font-semibold text-pine-deep">
            Completed on{" "}
            {new Date(record!.completed_at!).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .{" "}
            <Link
              href="/teacher/certification/certificate"
              className="underline underline-offset-2"
            >
              Print your certificate
            </Link>
            .
          </p>
        )}
      </div>

      <Note tone="neutral" >
        The check after each module is not a gate and there is no pass mark. Pick an answer,
        read why, and move on. It is there so the ideas get used once rather than only read.
        That is also why this is called an orientation rather than a certification: finishing
        it records that you read the modules and answered the checks, and your school sees
        exactly that. It does not claim you got them right, because nobody is checking.
      </Note>

      <div className="mt-6 space-y-5">
        {CERTIFICATION_MODULES.map((mod, index) => (
          <CertificationModuleCard
            key={mod.id}
            module={mod}
            index={index}
            savedAnswer={answers[mod.id]}
            locked={done}
          />
        ))}
      </div>

      {!done && (
        <div className="mt-7 rounded-xl border border-sand-deep bg-surface px-5 py-5">
          <h2 className="font-display text-lg text-ink">Finish up</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {answered === CERTIFICATION_MODULES.length
              ? "All five modules are answered. Completing records the date against your staff record and unlocks your printable certificate."
              : `Answer the check in each module to finish. ${CERTIFICATION_MODULES.length - answered} to go.`}
          </p>
          <div className="mt-4">
            <CompleteButton ready={answered === CERTIFICATION_MODULES.length} />
          </div>
        </div>
      )}
    </div>
  );
}
