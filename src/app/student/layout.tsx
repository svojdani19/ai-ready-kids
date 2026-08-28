import Link from "next/link";
import { requireStudent } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { schoolHasLapsed } from "@/lib/auth/subscription-gate";
import { LAPSED_STUDENT_MESSAGE } from "@/lib/domain/subscription";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/art/Avatar";
import { LogoMark } from "@/components/Logo";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { student, classroom } = await requireStudent();
  // A child keeps their session and can still see their own badges and map.
  // What stops is starting or recording anything new, and they are told that
  // in their own words — never in the language of an invoice.
  const closed = schoolHasLapsed(getDb(), classroom.school_id);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b-4 border-ink bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/student"
            className="flex min-h-11 items-center gap-2.5 rounded-lg pr-2"
            aria-label="Mission map"
          >
            <LogoMark size={32} />
            <span className="font-display text-lg font-bold text-ink">Missions</span>
          </Link>

          <nav aria-label="Student" className="flex items-center gap-2">
            <Link
              href="/student"
              className="flex min-h-11 items-center rounded-xl px-3.5 text-base font-semibold text-ink-soft hover:bg-paper-deep hover:text-ink"
            >
              Map
            </Link>
            <Link
              href="/student/badges"
              className="flex min-h-11 items-center rounded-xl px-3.5 text-base font-semibold text-ink-soft hover:bg-paper-deep hover:text-ink"
            >
              My badges
            </Link>
            <span className="ml-1 flex min-h-11 items-center gap-2 rounded-xl border-2 border-sand-deep bg-paper px-3">
              <Avatar avatarKey={student.avatar_key} size={28} />
              <span className="text-sm font-semibold text-ink">{student.display_name}</span>
              <span className="sr-only">in {classroom.name}</span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="flex min-h-11 items-center rounded-xl px-3.5 text-base font-semibold text-ink-soft underline-offset-2 hover:text-ink hover:underline"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {closed && (
          <p
            role="status"
            className="mb-6 rounded-2xl border-2 border-marigold-deep bg-marigold-wash px-5 py-4 text-lg font-semibold leading-snug text-ink"
          >
            {LAPSED_STUDENT_MESSAGE}
          </p>
        )}
        {children}
      </main>

      <footer className="border-t border-sand-deep px-4 py-4">
        <p className="mx-auto max-w-5xl text-center text-xs text-ink-faint">
          Everything you read here was written by people, not by a computer.
        </p>
      </footer>
    </div>
  );
}
