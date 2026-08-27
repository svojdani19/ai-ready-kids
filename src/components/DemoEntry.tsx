import { getDb } from "@/lib/db";
import { getStudent, getClass, listAssignments, listStudents } from "@/lib/repo/classroom";
import { getUserByEmail } from "@/lib/repo/school";
import { listAttemptsForStudent } from "@/lib/repo/progress";
import { summariseStudent } from "@/lib/domain/evidence";
import { DEMO } from "@/lib/db/seed";
import { enterDemo } from "@/app/actions/auth";
import { Button } from "./ui/Button";

/**
 * Three one-click entries so a reviewer never hunts for credentials. The
 * descriptions are read from the seeded database rather than written by hand,
 * so they cannot drift out of step with the demo data.
 */
export async function DemoEntry({ compact = false }: { compact?: boolean }) {
  const db = getDb();

  const student = getStudent(db, DEMO.studentId) ?? listStudents(db, DEMO.classId)[0];
  const classroom = student ? getClass(db, student.class_id) : undefined;
  const summary = student
    ? summariseStudent(listAttemptsForStudent(db, student.id))
    : undefined;

  const teacher = getUserByEmail(db, DEMO.teacherEmail);
  const teacherClass = teacher ? listStudents(db, DEMO.classId).length : 0;
  const teacherAssigned = teacher ? listAssignments(db, DEMO.classId).length : 0;
  const admin = getUserByEmail(db, DEMO.adminEmail);

  const cards = [
    {
      role: "student" as const,
      title: "Student",
      who: student
        ? `${student.display_name}, Grade ${classroom?.grade ?? 3}, ${classroom?.name ?? ""}`
        : "A student in Room 12",
      blurb: summary
        ? `${summary.completedMissionIds.length} missions finished, ${summary.badgeIds.length} badges, ${summary.skillsDemonstrated} of ${summary.skillsTotal} skills shown.`
        : "Mission map, badges and a competency view.",
      accent: "border-marigold bg-marigold-wash",
    },
    {
      role: "teacher" as const,
      title: "Teacher",
      who: teacher ? `${teacher.name}, ${classroom?.name ?? "Room 12"}` : "Room 12 teacher",
      blurb: `${teacherClass} students, ${teacherAssigned} missions assigned, certification complete.`,
      accent: "border-pine bg-pine-wash",
    },
    {
      role: "admin" as const,
      title: "Administrator",
      who: admin ? `${admin.name}, ${admin.title}` : "Instructional technology",
      blurb: "Four classes, a full year of data, renewal decision pending.",
      accent: "border-denim bg-denim-wash",
    },
  ];

  return (
    <div className={`grid gap-4 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"}`}>
      {cards.map((r) => (
        <form
          key={r.role}
          action={async () => {
            "use server";
            await enterDemo(r.role);
          }}
          className={`flex flex-col rounded-xl border-2 p-4 ${r.accent}`}
        >
          <h3 className="font-display text-lg text-ink">{r.title}</h3>
          <p className="mt-0.5 text-sm font-semibold text-ink-soft">{r.who}</p>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{r.blurb}</p>
          <Button type="submit" variant="secondary" size="sm" className="mt-4 w-full">
            Open the {r.title.toLowerCase()} demo
          </Button>
        </form>
      ))}
    </div>
  );
}
