import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { getCertification } from "@/lib/repo/progress";
import { getSchool } from "@/lib/repo/school";
import {
  CERTIFICATION_MINUTES,
  CERTIFICATION_MODULES,
  CERTIFICATION_TITLE,
} from "@/content/certification";
import { LogoMark } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = { title: "Certificate" };

export default async function CertificatePage() {
  const { user } = await requireStaff();
  const db = getDb();
  const record = getCertification(db, user.id);
  if (!record?.completed_at) redirect("/teacher/certification");
  const school = getSchool(db, user.school_id)!;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="ark-no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/teacher/certification"
          className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          ← Back to the modules
        </Link>
        <PrintButton label="Print the certificate" />
      </div>

      <article className="rounded-xl border-4 border-pine bg-surface p-10 text-center ark-print-plain">
        <LogoMark size={52} />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Certificate of completion
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-ink">
          {CERTIFICATION_TITLE}
        </h1>
        <p className="mt-7 text-sm uppercase tracking-[0.14em] text-ink-faint">
          Awarded to
        </p>
        <p className="mt-1.5 font-display text-4xl text-ink">{user.name}</p>
        <p className="mt-1.5 text-[0.95rem] text-ink-soft">
          {user.title} · {school.name}
        </p>

        <div className="mx-auto mt-8 max-w-lg border-t border-sand pt-6 text-left">
          <p className="text-sm leading-relaxed text-ink-soft">
            Completed all {CERTIFICATION_MODULES.length} modules of the AI Ready Kids
            educator orientation, approximately {CERTIFICATION_MINUTES} minutes of
            professional learning covering developmental readiness, student data practice,
            verification instruction, learning ownership and family communication.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            This records completion of the orientation. The check after each module is not
            gated, so this is not an assessment of understanding and does not certify
            competence in any of the areas listed.
          </p>
          <ul className="mt-4 space-y-1">
            {CERTIFICATION_MODULES.map((m) => (
              <li key={m.id} className="text-sm text-ink-soft">
                · {m.title}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-sm text-ink-soft">
          {new Date(record.completed_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="mt-6 text-xs leading-relaxed text-ink-faint">
          A record of professional learning completed within this product. It is not a
          state license, an endorsement, or an accredited continuing-education credit.
          Check with your district about how it counts toward your requirements.
        </p>
      </article>
    </div>
  );
}
