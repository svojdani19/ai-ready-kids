import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { listAssignments, listClasses, listStudents } from "@/lib/repo/classroom";
import { getSchool, listUsers } from "@/lib/repo/school";
import {
  archiveClassAction,
  deleteClassDataAction,
  restoreClassAction,
} from "@/app/actions/admin";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { EmptyState, Note, Tag } from "@/components/ui/Bits";
import { ConfirmAction } from "@/components/staff/ConfirmAction";
import { CreateClassForm } from "./CreateClassForm";

export const metadata: Metadata = { title: "Classes" };

export default async function AdminClasses() {
  const { user } = await requireAdmin();
  const db = getDb();
  const school = getSchool(db, user.school_id)!;
  const classes = listClasses(db, user.school_id, true);
  const teachers = listUsers(db, user.school_id, "teacher");
  const schoolYear = classes[0]?.school_year ?? "2025-2026";

  const rows = classes.map((c) => ({
    classroom: c,
    students: listStudents(db, c.id).length,
    assignments: listAssignments(db, c.id).length,
    teacher: teachers.find((t) => t.id === c.teacher_id),
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Administrator"
        title="Classes"
        description={`${school.name} · ${schoolYear}. Archiving keeps a finished class out of the way without changing when its records are deleted. Deleting removes its roster and every record immediately.`}
      />

      <Panel title="Create a class">
        <PanelBody>
          {teachers.length === 0 ? (
            <EmptyState title="Add a teacher first">
              A class needs somebody to own it.{" "}
              <Link href="/admin/staff" className="font-semibold underline underline-offset-2">
                Add staff
              </Link>
              .
            </EmptyState>
          ) : (
            <CreateClassForm teachers={teachers} schoolYear={schoolYear} />
          )}
        </PanelBody>
      </Panel>

      <div className="mt-6">
        <Panel title="All classes" description={`${classes.length} total`}>
          {rows.length === 0 ? (
            <PanelBody>
              <EmptyState title="No classes yet">
                Create the first class above. Students join by typing its code.
              </EmptyState>
            </PanelBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] border-collapse text-sm">
                <caption className="sr-only">Classes at this school</caption>
                <thead>
                  <tr className="border-b border-sand text-left">
                    <th scope="col" className="px-5 py-2.5 font-semibold text-ink-soft">Class</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Grade</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Teacher</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Code</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Students</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold text-ink-soft">Assigned</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold text-ink-soft">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ classroom, students, assignments, teacher }) => (
                    <tr key={classroom.id} className="border-b border-sand last:border-0">
                      <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                        {/* Deliberately not a link. The teacher class page
                            renders named students beside their individual
                            evidence, and this product tells administrators
                            they see aggregates. */}
                        {classroom.name}
                        {classroom.archived_at && (
                          <Tag className="ml-2" tone="neutral">
                            Archived
                          </Tag>
                        )}
                      </th>
                      <td className="px-3 py-3 text-ink-soft">{classroom.grade}</td>
                      <td className="px-3 py-3 text-ink-soft">{teacher?.name ?? "Unassigned"}</td>
                      <td className="px-3 py-3">
                        <code className="rounded bg-paper-deep px-1.5 py-0.5 text-xs text-ink-soft">
                          {classroom.join_code}
                        </code>
                      </td>
                      <td className="ark-tabular px-3 py-3 text-ink-soft">{students}</td>
                      <td className="ark-tabular px-3 py-3 text-ink-soft">{assignments}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {classroom.archived_at ? (
                            <ConfirmAction
                              tone="quiet"
                              label="Restore"
                              confirmLabel="Restore class"
                              question={`Put ${classroom.name} back in the active list?`}
                              action={async () => {
                                "use server";
                                await restoreClassAction(classroom.id);
                              }}
                            />
                          ) : (
                            <ConfirmAction
                              tone="quiet"
                              label="Archive"
                              confirmLabel="Archive class"
                              question={`Archive ${classroom.name}? Students can no longer join. Its deletion date does not change.`}
                              action={async () => {
                                "use server";
                                await archiveClassAction(classroom.id);
                              }}
                            />
                          )}
                          <ConfirmAction
                            label="Delete data"
                            confirmLabel="Delete permanently"
                            question={`Delete ${classroom.name}, its ${students} student records, all mission history and both check-ins? This cannot be undone.`}
                            action={async () => {
                              "use server";
                              await deleteClassDataAction(classroom.id);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Note tone="denim" title="Class codes">
          A code is the only thing standing between a child and their own progress, which
          is exactly as much security as this data warrants. Codes are per class and can be
          regenerated by deleting and recreating a class. Roster sync and single sign-on
          would replace this in a production deployment; neither is built, so class codes
          are how joining works here.
        </Note>
      </div>
    </div>
  );
}
