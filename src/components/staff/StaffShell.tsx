import Link from "next/link";
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
        <div className="mx-auto max-w-5xl px-5 py-8 lg:py-10">{children}</div>
      </div>
    </div>
  );
}

export function LogoBadge() {
  return <LogoMark size={28} />;
}
