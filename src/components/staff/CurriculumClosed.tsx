import Link from "next/link";
import {
  curriculumBlock,
  staffHandoff,
  subscriptionNotice,
} from "@/lib/domain/subscription";

/**
 * What a member of staff sees in place of an authored teaching page while the
 * curriculum is not licensed.
 *
 * It replaces the page rather than covering it, because the point is that the
 * content is not served — an overlay over a rendered mission is a hidden link,
 * which is the defect this sprint exists to fix, not the fix.
 *
 * The two reasons never borrow each other's commercial claim. `lapsed` says a
 * term ended and offers renewal; `needs-configuration` says outright that
 * nothing has ended and asks for the dates to be corrected. Recovery is
 * role-appropriate for the same reason sprint 59 made the shell notice so: only
 * an administrator can open `/admin/program`, and pointing a teacher at a route
 * that bounces them is worse than pointing them at a person.
 *
 * The way back to the dashboard is always here and always first, because every
 * record-owning surface a school might actually need is reachable from it, and
 * a dead end would make this look like a lockout of the school's own data.
 */
export function CurriculumClosed({
  reason,
  role,
}: {
  reason: "lapsed" | "needs-configuration";
  role: "admin" | "teacher";
}) {
  const { title, body } = curriculumBlock(reason);
  const notice = subscriptionNotice(reason, role);
  const dashboard = role === "admin" ? "/admin" : "/teacher";

  return (
    // Deliberately not `role="status"`. The shell already carries one standing
    // status region for the same account condition, and a second live region
    // repeating the same headline announces it twice. This is not a message
    // about the page — it *is* the page, so it is an ordinary landmark with
    // the page's own `h1`. `tabIndex={-1}` keeps it a skip-link target without
    // adding a stop to the tab order.
    <section
      id="curriculum-closed"
      aria-labelledby="curriculum-closed-title"
      tabIndex={-1}
      className="mx-auto max-w-2xl rounded-xl border-2 border-berry bg-berry-wash px-6 py-7"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-berry-deep">
        Curriculum access
      </p>
      <h1
        id="curriculum-closed-title"
        className="mt-1.5 font-display text-2xl leading-tight text-ink"
      >
        {title}
      </h1>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">{body}</p>

      <p className="mt-4 text-[0.95rem] leading-relaxed text-ink">
        {notice.link ? (
          <Link
            href={notice.link.href}
            className="font-semibold text-berry-deep underline underline-offset-2"
          >
            {notice.link.label}
          </Link>
        ) : (
          staffHandoff(reason)
        )}
      </p>

      <p className="mt-4">
        <Link
          href={dashboard}
          className="font-semibold text-ink underline underline-offset-2 hover:text-berry-deep"
        >
          ← Back to the {role === "admin" ? "administrator" : "teacher"} dashboard
        </Link>
      </p>
    </section>
  );
}
