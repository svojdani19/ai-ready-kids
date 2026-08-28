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
  rotateJoinCodeAsAdminAction,
} from "@/app/actions/admin";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { EmptyState, Note, Tag } from "@/components/ui/Bits";
import { ConfirmAction } from "@/components/staff/ConfirmAction";
import { ReassignForm } from "./ReassignForm";
import { CreateClassForm } from "./CreateClassForm";

export const metadata: Metadata = { title: "Classes" };

export default async function AdminClasses() {
  const { user } = await requireAdmin();
  const db = getDb();
  const school = getSchool(db, user.school_id)!;
  const classes = listClasses(db, user.school_id, true);
  const teachers = listUsers(db, user.school_id, "teacher");
  // The school's own current year, not whichever class sorts first. That
  // fallback meant every new class was still being created in 2025-2026.
  const schoolYear = school.academic_year;

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
                        {/* The control sits beside the code because this cell
                            is where the new one appears once it changes, and
                            an administrator's next job is to hand it out. */}
                        <code className="rounded bg-paper-deep px-1.5 py-0.5 text-xs text-ink-soft">
                          {classroom.join_code}
                        </code>
                        <div className="mt-1.5">
                          <ConfirmAction
                            tone="quiet"
                            label="New code"
                            confirmLabel="Change the code"
                            question={`Give ${classroom.name} a new code? The old one and anybody halfway through joining with it stop working straight away. The class, its teacher, the roster, assignments, mission history, badges and both check-ins are not touched.`}
                            action={async () => {
                              "use server";
                              return rotateJoinCodeAsAdminAction(classroom.id);
                            }}
                          />
                        </div>
                      </td>
                      <td className="ark-tabular px-3 py-3 text-ink-soft">{students}</td>
                      <td className="ark-tabular px-3 py-3 text-ink-soft">{assignments}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <ReassignForm
                            classId={classroom.id}
                            className={classroom.name}
                            currentTeacherId={classroom.teacher_id}
                            teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
                          />
                          {classroom.archived_at ? (
                            <ConfirmAction
                              tone="quiet"
                              label="Restore"
                              confirmLabel="Restore class"
                              question={`Put ${classroom.name} back in the active list?`}
                              action={async () => {
                                "use server";
                                // Returned, not swallowed: a restore can be
                                // refused for exceeding the school's licence,
                                // and the administrator needs to see why.
                                return restoreClassAction(classroom.id);
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
                                return archiveClassAction(classroom.id);
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
          is exactly as much security as this data warrants. Codes get read aloud and
          photographed off whiteboards, so choose <strong>New code</strong> above whenever
          one has travelled further than the class. The old code stops working immediately
          and nothing else about the class changes. The teacher of record can do the same
          from their own class page. Deleting a class is never the way to change its code.
          Roster sync and single sign-on would replace codes in a production deployment;
          neither is built, so this is how joining works here.
        </Note>
      </div>
    </div>
  );
}
