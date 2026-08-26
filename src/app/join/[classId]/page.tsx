import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getClass, listStudents } from "@/lib/repo/classroom";
import { getUser } from "@/lib/repo/school";
import { chooseStudent } from "@/app/actions/auth";
import { Avatar, avatarLabel } from "@/components/art/Avatar";
import { Logo } from "@/components/Logo";
import { EmptyState } from "@/components/ui/Bits";

export const metadata: Metadata = { title: "Find your name" };

export default async function ChooseStudentPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const db = getDb();
  const classroom = getClass(db, classId);
  if (!classroom || classroom.archived_at) notFound();

  const teacher = getUser(db, classroom.teacher_id);
  const students = listStudents(db, classId);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-sand-deep px-5 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link href="/" aria-label="AI Ready Kids home">
            <Logo />
          </Link>
          <Link
            href="/join"
            className="text-sm font-semibold text-ink-soft underline-offset-2 hover:text-ink hover:underline"
          >
            Different class code
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <h1 className="font-display text-3xl text-ink">Find your name</h1>
        <p className="mt-2 text-[1.05rem] text-ink-soft">
          {classroom.name}
          {teacher ? ` · ${teacher.name}` : ""} · Grade {classroom.grade}
        </p>

        {students.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="Nobody is on this roster yet">
              Your teacher has not added names to {classroom.name}. Ask them to add you,
              then come back and type the class code again.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {students.map((s) => (
              <li key={s.id}>
                <form
                  action={async () => {
                    "use server";
                    await chooseStudent(s.id);
                  }}
                >
                  <button
                    type="submit"
                    aria-label={`I am ${s.display_name}, the ${avatarLabel(s.avatar_key).toLowerCase()}`}
                    className="ark-sticker flex w-full flex-col items-center gap-2 rounded-2xl border-4 border-ink bg-surface px-3 py-4 text-center transition-colors hover:bg-marigold-wash"
                  >
                    <Avatar avatarKey={s.avatar_key} size={56} />
                    <span className="font-display text-base leading-tight text-ink">
                      {s.display_name}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
