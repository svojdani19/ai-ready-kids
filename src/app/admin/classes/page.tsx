import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { listAssignments, listClasses, listStudents } from "@/lib/repo/classroom";
import { getSchool, listUsers } from "@/lib/repo/school";
import { classroomAllowance } from "@/lib/repo/entitlement";
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

  // The plan's room allowance, next to the form that would spend it.
  const rooms = classroomAllowance(db, user.school_id);

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
        description={`${school.name} · ${schoolYear}. Archiving closes a finished class: students cannot join and those already signed in are signed out on their next request, while its records and their deletion date are unchanged. Deleting removes its roster and every record immediately.`}
      />

      <Panel
        title="Create a class"
        description={
          !rooms.recognised
            ? `Plan needs configuration — no new classrooms can be activated. ${rooms.active} active, and every class and record is unchanged.`
            : rooms.limit === null
              ? `${rooms.active} active. Archived classes are kept and do not count.`
              : `Active classrooms: ${rooms.active} of ${rooms.limit}. Archived classes are kept and do not count.`
        }
      >
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
                            // Sprint 68 aligned the note below and the audit
                            // entry, and missed this: it said "stop working
                            // straight away" — the same immediacy claim under
                            // different words — and named only people halfway
                            // through joining, not students already signed in,
                            // who are the ones the binding newly reaches.
                            question={`Give ${classroom.name} a new code? From then on the old code is rejected on its next use: nobody can join with it, anybody halfway through joining stops, and a student already signed in with it is asked to rejoin next time they load a page. The class, its teacher, the roster, assignments, mission history, badges and both check-ins are not touched.`}
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
                              // Sprint 69: this said only "students can no
                              // longer join", which was the whole of what
                              // archiving used to do. It now closes access for
                              // children already signed in, and issues a new
                              // code so restoring cannot revive their sessions.
                              question={`Archive ${classroom.name}? Students can no longer join, and any child already signed in is asked to rejoin next time they load a page. The class gets a new join code, so the old one will not work even if you restore it — everyone rejoins with the new code. The roster, mission history, check-ins and the deletion date do not change.`}
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
                              return deleteClassDataAction(classroom.id);
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
          A class code is shared classroom access, not proof of who is using it. Anyone
          holding it can see that class&rsquo;s roster of first names and avatars, choose
          any child on it, and open that child&rsquo;s progress. Codes get read aloud and
          photographed off whiteboards, so choose <strong>New code</strong> above whenever
          one has travelled further than the class. From then on the old code is rejected
          on the next request that uses it: nobody can join with it, a half-finished join
          stops, and a browser already signed in with it is asked to rejoin the next time
          it loads a page. It does not close a page that is already open &mdash; a child
          mid-mission keeps that screen until they navigate. Nothing else about the class
          changes and no records are touched. The teacher of record can do the same
          from their own class page. Deleting a class is never the way to change its code.
          Roster sync and single sign-on would replace codes in a production deployment;
          neither is built, so a class code is the only credential in the product and it is
          not production access control. This build is a local demonstration on fictional
          data. Putting real student records behind a class code is a decision for the
          school, which has to weigh the shared access described above against its own
          policies first.
        </Note>
      </div>
    </div>
  );
}
