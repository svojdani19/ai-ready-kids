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
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          <Link href="/signin" className="text-ink-soft underline-offset-2 hover:text-ink hover:underline">
            Educator sign in
          </Link>
          <Link href="/join" className="text-ink-soft underline-offset-2 hover:text-ink hover:underline">
            Student class code
          </Link>
          <Link href="/privacy" className="text-ink-soft underline-offset-2 hover:text-ink hover:underline">
            Privacy model
          </Link>
          <Link href="/#curriculum" className="text-ink-soft underline-offset-2 hover:text-ink hover:underline">
            Curriculum
          </Link>
          <Link href="/#plans" className="text-ink-soft underline-offset-2 hover:text-ink hover:underline">
            Plans
          </Link>
          <Link href="/#demo" className="text-ink-soft underline-offset-2 hover:text-ink hover:underline">
            Demo access
          </Link>
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
