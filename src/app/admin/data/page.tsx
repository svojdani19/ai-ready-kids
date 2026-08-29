import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { listClasses, listStudents } from "@/lib/repo/classroom";
import { getSchool, listAudit } from "@/lib/repo/school";
import { deleteClassDataAction } from "@/app/actions/admin";
import {
  formatDate,
  purgeDateFor,
  retentionBlock,
  retentionRows,
  schoolYearEndBlock,
} from "@/lib/domain/retention";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { Note, Stat, Tag } from "@/components/ui/Bits";
import { ConfirmAction } from "@/components/staff/ConfirmAction";
import { RetentionForm } from "./RetentionForm";

export const metadata: Metadata = { title: "Data and retention" };

const COLLECTED = [
  ["A class name, grade and join code", "So a child can find their own class."],
  ["A first name and last initial per student", "So a child can find their own row on a screen of twenty-three."],
  ["An assigned animal avatar", "So a pre-reader can find themselves faster. Chosen by us, never uploaded."],
  ["Which authored choices a student tapped", "This is the competency evidence teachers act on."],
  ["Which check-in options a student selected", "Aggregated into a group difference. Never shown per student to anyone."],
  ["Staff name, school email and role", "So staff can sign in and own a class."],
];

const NOT_COLLECTED = [
  "Surnames, dates of birth, addresses, phone numbers or student email addresses",
  "Any text a child typed, because a child cannot type anything into this product",
  "Photographs, audio, video, camera access or microphone access",
  "Location, IP-based geolocation or device fingerprints",
  "Time on task, idle time, keystroke timing or any behavioural telemetry",
  "Risk scores, readiness bands, personality inferences or predictions about a child",
  "Advertising identifiers, third-party analytics or any tracker of any kind",
];

export default async function AdminData() {
  const { user } = await requireAdmin();
  const db = getDb();
  const school = getSchool(db, user.school_id)!;
  const now = new Date();

  const classes = listClasses(db, user.school_id, true).map((c) => ({
    ...c,
    studentCount: listStudents(db, c.id).length,
  }));
  const rows = retentionRows(school, classes, now);
  // An unrecognised window stops the schedule for the whole school, so it is
  // said once at the top rather than repeated on every row.
  const policyBlocked = retentionBlock(school) !== null;
  // The school's own year end, separately from the policy: missing is a
  // migration in progress, malformed is a broken record.
  const yearEndBlock = schoolYearEndBlock(school);
  const audit = listAudit(db, user.school_id, 25);
  const eligible = rows.filter((r) => r.eligibleNow);
  const totalStudents = classes.reduce((n, c) => n + c.studentCount, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Administrator"
        title="Data and retention"
        description="What this product holds about your students, when it becomes due for deletion, and how to delete it sooner."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Student records" value={totalStudents} hint="Display name and avatar only" />
        <Stat
          label="Retention window"
          // A window this product does not sell is not shown as if it were
          // policy. The number is named as the stored value, not as a rule.
          value={policyBlocked ? "Needs configuration" : `${school.retention_months} months`}
          hint={
            policyBlocked
              ? `The stored value is ${JSON.stringify(school.retention_months)}, which is not one of the windows below. Automatic purge is blocked until you choose one.`
              : yearEndBlock === "malformed-year-end"
                ? "After a cohort's own school year ends — and this school's recorded end date cannot be read. Set the academic dates on Program & plan."
                : yearEndBlock === "no-year-end"
                  ? "After a cohort's own school year ends — and this school has not recorded when that is."
                  : `After a cohort's own school year ends. This year's ends ${formatDate(school.year_ends_on)}.`
          }
          tone={policyBlocked ? "berry" : "neutral"}
        />
        <Stat
          label="This year due"
          value={(() => {
            if (policyBlocked) return "Blocked";
            const due = purgeDateFor(school);
            return due ? formatDate(due) : "Not set";
          })()}
          hint={
            policyBlocked
              ? "Nothing is deleted automatically while the retention window needs configuration."
              : purgeDateFor(school) === null
                ? "Set the academic dates on Program & plan. Nothing is deleted until you do."
                : eligible.length
                  ? `${eligible.length} classes eligible now`
                  : "Nothing eligible yet"
          }
          tone={policyBlocked || eligible.length ? "berry" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="What we collect" description="The complete list. There is nothing held back.">
          <PanelBody>
            <dl className="space-y-3">
              {COLLECTED.map(([what, why]) => (
                <div key={what}>
                  <dt className="text-sm font-semibold text-ink">{what}</dt>
                  <dd className="text-sm leading-relaxed text-ink-soft">{why}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>

        <Panel
          title="What we do not collect"
          description="These have no column in the database, not merely no screen in the product."
        >
          <PanelBody>
            <ul className="space-y-2">
              {NOT_COLLECTED.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <span aria-hidden="true" className="mt-0.5 font-bold text-berry">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Panel title="Retention window">
          <PanelBody>
            <RetentionForm current={school.retention_months} />
          </PanelBody>
        </Panel>

        <Panel
          title="Delete now"
          description="Deleting a class removes its roster, every mission attempt and both check-ins immediately and permanently."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <caption className="sr-only">Classes with their scheduled deletion dates</caption>
              <thead>
                <tr className="border-b border-sand text-left">
                  <th scope="col" className="px-5 py-2.5 font-semibold text-ink-soft">Class</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Students</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Due on</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold text-ink-soft">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.classId} className="border-b border-sand last:border-0">
                    <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                      {row.className}
                      {row.archived && (
                        <Tag className="ml-2" tone="neutral">
                          Archived
                        </Tag>
                      )}
                      <span className="block text-xs font-normal text-ink-soft">
                        Grade {row.grade} · {row.schoolYear}
                      </span>
                    </th>
                    <td className="ark-tabular px-3 py-3 text-ink-soft">{row.studentCount}</td>
                    <td className="px-3 py-3">
                      <span className={row.eligibleNow ? "font-semibold text-berry-deep" : "text-ink-soft"}>
                        {row.purgeOn
                          ? formatDate(row.purgeOn)
                          : row.blockedReason === "unrecognised-policy" ||
                              row.blockedReason === "malformed-year-end"
                            ? "Blocked"
                            : "Not set"}
                      </span>
                      {row.blockedReason === "unrecognised-policy" && (
                        <span className="block text-xs text-berry-deep">
                          Retention needs configuration — automatic purge is blocked.
                        </span>
                      )}
                      {row.blockedReason === "malformed-year-end" && (
                        <span className="block text-xs text-berry-deep">
                          This cohort&apos;s year-end date cannot be read, so nothing here is
                          deleted automatically. Save the academic dates on Program &amp; plan to
                          repair it.
                        </span>
                      )}
                      {row.blockedReason === "no-year-end" && (
                        <span className="block text-xs text-ink-faint">
                          This year has no recorded end date, so nothing here is deleted
                          automatically.
                        </span>
                      )}
                      {row.eligibleNow && (
                        <span className="block text-xs text-berry-deep">Eligible now</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ConfirmAction
                        label="Delete now"
                        confirmLabel="Delete permanently"
                        question={`Delete ${row.className} and all ${row.studentCount} student records right now? This cannot be undone.`}
                        action={async () => {
                          "use server";
                          await deleteClassDataAction(row.classId);
                        }}
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-sm text-ink-soft">
                      There are no classes holding student data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Audit log"
          description="Every configuration and deletion action, with who did it and when."
        >
          <PanelBody>
            <ol className="space-y-2.5">
              {audit.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-sand pb-2.5 last:border-0">
                  <code className="rounded bg-paper-deep px-1.5 py-0.5 text-xs font-semibold text-ink-soft">
                    {entry.action}
                  </code>
                  <span className="text-sm text-ink">{entry.detail}</span>
                  <span className="ml-auto shrink-0 text-xs text-ink-faint">
                    {entry.actor_label} · {formatDate(entry.created_at)}
                  </span>
                </li>
              ))}
              {audit.length === 0 && (
                <li className="text-sm text-ink-soft">Nothing recorded yet.</li>
              )}
            </ol>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Note tone="denim" title="How this maps to FERPA and COPPA">
          Mission and check-in records are education records under FERPA, held by the school
          and deleted on the school&rsquo;s schedule. Because the product collects no
          personal information beyond a display name chosen by the teacher, and offers no
          way for a child to disclose any, the COPPA surface is deliberately small. This is
          a description of how the product is built. It is not a legal opinion and it is not
          a compliance certification.
        </Note>
        <Note tone="neutral" title="Deletion in this build">
          Deletion is immediate and real: the rows are removed from the database, not
          flagged. There is no soft-delete table and no backup restore path in a local MVP,
          so treat these buttons as final.
        </Note>
        <Note tone="neutral" title="What runs the purge">
          The date above is when a class becomes <strong>due</strong> for deletion, and the
          purge that acts on it is a job — <code>npm run purge</code> — which deletes every
          class past its date along with each roster, attempt and check-in, and writes an
          audit entry. It is idempotent, so running it twice is safe. Nothing in this build
          runs it on a timer: a deployment schedules it, and until it runs, records past
          the date are still here. That is why this page says due rather than deleted. You
          can also delete any class immediately with the buttons above.
        </Note>
      </div>
    </div>
  );
}
