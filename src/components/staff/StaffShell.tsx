import Link from "next/link";
import {
  instructionClosed,
  LAPSED_STAFF_BODY,
  LAPSED_STAFF_TITLE,
  UNVERIFIED_STAFF_BODY,
  UNVERIFIED_STAFF_TITLE,
} from "@/lib/domain/subscription";
import { signOut } from "@/app/actions/auth";
import { LogoMark } from "@/components/Logo";
import type { School, User } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
}

const ACCENT: Record<string, string> = {
  pine: "bg-pine-deep",
  marigold: "bg-marigold-deep",
  denim: "bg-denim-deep",
  berry: "bg-berry-deep",
};

export function StaffShell({
  school,
  user,
  nav,
  area,
  children,
}: {
  school: School;
  user: User;
  nav: NavItem[];
  area: string;
  children: React.ReactNode;
}) {
  // Why new classroom work is closed, if it is. Both reasons pause the same
  // things and say different sentences: one subscription ended, the other
  // cannot be read at all.
  const closed = instructionClosed(school, new Date());

  return (
    <div className="min-h-dvh bg-paper lg:flex">
      <aside className="border-b border-sand-deep bg-surface lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r ark-no-print">
        <div className="flex items-center gap-3 px-5 py-4">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg font-display text-sm font-bold text-white ${ACCENT[school.brand_accent] ?? ACCENT.pine}`}
            aria-hidden="true"
          >
            {school.monogram}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-ink">{school.name}</p>
            <p className="truncate text-xs text-ink-faint">{area}</p>
          </div>
        </div>

        <nav aria-label={area} className="px-3 pb-3 lg:pb-5">
          <ul className="flex flex-wrap gap-1 lg:block lg:space-y-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-deep hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-sand px-5 py-3.5 lg:mt-auto">
          <p className="text-sm font-semibold leading-tight text-ink">{user.name}</p>
          <p className="text-xs leading-snug text-ink-soft">{user.title}</p>
          <div className="mt-2 flex items-center gap-3">
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                Sign out
              </button>
            </form>
            <Link
              href="/"
              className="text-xs font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
            >
              Product site
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-5 py-8 lg:py-10">
          {/* One notice, in the shell, so it cannot be missed by arriving on a
              page that happens not to carry it. `role="status"` rather than
              "alert": it is a standing condition a teacher should be told
              about, not an emergency interrupting what they are doing. */}
          {closed && (
            <div
              role="status"
              className="mb-6 rounded-lg border-2 border-berry bg-berry-wash px-4 py-3 text-sm leading-relaxed text-ink"
            >
              <p className="font-semibold text-berry-deep">
                {closed === "needs-configuration" ? UNVERIFIED_STAFF_TITLE : LAPSED_STAFF_TITLE}
              </p>
              <p className="mt-1">
                {closed === "needs-configuration" ? UNVERIFIED_STAFF_BODY : LAPSED_STAFF_BODY}
              </p>
              <p className="mt-2">
                <Link
                  href="/admin/program"
                  className="font-semibold text-berry-deep underline underline-offset-2"
                >
                  Request renewal on the Program and plan page
                </Link>
              </p>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function LogoBadge() {
  return <LogoMark size={28} />;
}
