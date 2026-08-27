import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { classesOwnedBy, listUsers } from "@/lib/repo/school";
import { listCertifications } from "@/lib/repo/progress";
import { removeStaffAction } from "@/app/actions/admin";
import { CERTIFICATION_MODULES, CERTIFICATION_TITLE } from "@/content/certification";
import { formatShortDate } from "@/lib/domain/retention";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { Meter } from "@/components/ui/Meter";
import { Note, Stat, Tag } from "@/components/ui/Bits";
import { ConfirmAction } from "@/components/staff/ConfirmAction";
import { AddStaffForm } from "./AddStaffForm";

export const metadata: Metadata = { title: "Staff" };

export default async function AdminStaff() {
  const { user } = await requireAdmin();
  const db = getDb();
  const staff = listUsers(db, user.school_id);
  const certs = listCertifications(db, user.school_id);
  const certByUser = new Map(certs.map((c) => [c.user_id, c]));
  const teachers = staff.filter((s) => s.role === "teacher");
  const completed = teachers.filter((t) => certByUser.get(t.id)?.completed_at).length;

  return (
    <div>
      <PageHeader
        eyebrow="Administrator"
        title="Staff and orientation"
        description="Who has access, what they own, and how far through the educator orientation they are. Finishing it records that the modules were read; the checks are not gated."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Teachers" value={teachers.length} />
        <Stat label="Administrators" value={staff.length - teachers.length} />
        <Stat
          label="Orientation completed"
          value={`${completed} of ${teachers.length}`}
          hint={CERTIFICATION_TITLE}
        />
      </div>

      <div className="mt-6">
        <Panel title="Everyone with access">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <caption className="sr-only">Staff at this school</caption>
              <thead>
                <tr className="border-b border-sand text-left">
                  <th scope="col" className="px-5 py-2.5 font-semibold text-ink-soft">Name</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Role</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Email</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Classes</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">
                    Orientation
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold text-ink-soft">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const cert = certByUser.get(member.id);
                  const answered = CERTIFICATION_MODULES.filter((m) => cert?.answers[m.id]).length;
                  const owned = classesOwnedBy(db, member.id);
                  return (
                    <tr key={member.id} className="border-b border-sand last:border-0">
                      <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                        {member.name}
                        <span className="block text-xs font-normal text-ink-soft">
                          {member.title}
                        </span>
                      </th>
                      <td className="px-3 py-3">
                        <Tag tone={member.role === "admin" ? "denim" : "neutral"}>
                          {member.role === "admin" ? "Administrator" : "Teacher"}
                        </Tag>
                      </td>
                      <td className="px-3 py-3">
                        <code className="rounded bg-paper-deep px-1.5 py-0.5 text-xs text-ink-soft">
                          {member.email}
                        </code>
                      </td>
                      <td className="px-3 py-3 text-ink-soft">
                        {owned.length === 0 ? (
                          <span className="ark-tabular">0</span>
                        ) : (
                          <>
                            <span className="ark-tabular">{owned.length}</span>
                            <span className="block text-xs text-ink-faint">
                              {owned
                                .map((c) => (c.archived ? `${c.name} (archived)` : c.name))
                                .join(", ")}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {cert?.completed_at ? (
                          <Tag tone="pine">Completed {formatShortDate(cert.completed_at)}</Tag>
                        ) : (
                          <div className="min-w-[9rem]">
                            <Meter
                              size="sm"
                              label="Modules"
                              value={answered}
                              max={CERTIFICATION_MODULES.length}
                              accent="marigold"
                              valueLabel={`${answered}/${CERTIFICATION_MODULES.length}`}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {member.id === user.id ? (
                          <span className="text-xs text-ink-faint">You</span>
                        ) : (
                          <ConfirmAction
                            label="Remove"
                            confirmLabel={`Remove ${member.name}`}
                            question={`Remove ${member.name}'s access to ${member.role === "admin" ? "the administrator area" : "their classes"}?`}
                            action={async () => {
                              "use server";
                              return removeStaffAction(member.id);
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PanelBody className="border-t border-sand">
            <AddStaffForm />
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6">
        <Note tone="neutral" title="Sign-in in this build">
          Staff sign in with their school email and no password, which is appropriate for a
          local demonstration and nothing else. A district deployment replaces this with
          your identity provider before any real roster exists. See the README section on
          deferred integrations.
        </Note>
      </div>
    </div>
  );
}
