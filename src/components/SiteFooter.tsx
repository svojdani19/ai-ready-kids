import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-sand-deep bg-paper-deep">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Practice before exposure. An annual subscription for elementary schools that
            gives grades 2 to 4 rehearsed decisions about AI, and gives their school
            something honest to report.
          </p>
        </div>
        <nav aria-label="Footer" className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {[
            {
              heading: "The program",
              links: [
                ["/approach", "How it works"],
                ["/curriculum", "Curriculum"],
                ["/benchmark", "Annual check-ins"],
                ["/privacy", "Privacy and data"],
              ],
            },
            {
              heading: "For your school",
              links: [
                ["/for-schools", "Students, teachers, families"],
                ["/plans", "Plans"],
                ["/demo", "Open the demo"],
                ["/signin", "Educator sign in"],
                ["/join", "Student class code"],
              ],
            },
          ].map((group) => (
            <div key={group.heading}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                {group.heading}
              </p>
              <ul className="mt-2 space-y-1.5">
                {group.links.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-sand-deep px-5 py-4">
        <p className="mx-auto max-w-6xl text-xs leading-relaxed text-ink-faint">
          Demonstration build. All schools, staff and students shown in this product are
          fictional. AI Ready Kids describes its own data practices and is not a legal
          compliance certification.
        </p>
      </div>
    </footer>
  );
}
