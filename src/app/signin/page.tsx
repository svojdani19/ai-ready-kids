import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getPrimarySchool, listUsers } from "@/lib/repo/school";
import { Logo } from "@/components/Logo";
import { DemoEntry } from "@/components/DemoEntry";
import { Note } from "@/components/ui/Bits";
import { ButtonLink } from "@/components/ui/Button";
import { SignInForm } from "./SignInForm";
import { DemoUnlockForm } from "./DemoUnlockForm";
import { demoGateEnabled, demoUnlocked } from "@/lib/auth/demo-gate";

export const metadata: Metadata = { title: "Educator sign in" };

/**
 * Rendered per request: both the demo cards and the staff list are read from
 * the database, and a build-time snapshot would go stale the moment an
 * administrator added a teacher.
 */
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const db = getDb();
  const school = getPrimarySchool(db);
  const staff = listUsers(db, school.id);
  // One question, whether or not this deployment sets a password: `demoUnlocked`
  // is true when the gate is off, so no caller has to check two things.
  const locked = demoGateEnabled() && !(await demoUnlocked());

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-sand-deep px-5 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/" aria-label="AI Ready Kids home">
            <Logo />
          </Link>
          <ButtonLink href="/join" variant="secondary" size="sm">
            I am a student
          </ButtonLink>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div>
            <h1 className="font-display text-3xl text-ink">Educator sign in</h1>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
              {school.name} · {school.district}
            </p>
            <div className="mt-6">{locked ? <DemoUnlockForm /> : <SignInForm />}</div>
            {locked ? (
              <Note tone="neutral" title="What this password is">
                It opens the demonstration school, and it is not a staff credential.
                Everything past it &mdash; assigning missions, rotating class codes,
                archiving a class, deleting records &mdash; is an administrator&rsquo;s to
                do, on a school where every person is fictional.
              </Note>
            ) : (
              <Note tone="neutral" title="Why there is no password">
                This MVP authenticates by email only, on purpose. A real deployment signs
                in through your district identity provider rather than introducing another
                credential for staff to manage.
              </Note>
            )}
          </div>

          <div>
            <h2 className="font-display text-xl text-ink">
              {locked ? "What is behind it" : "Or jump straight in"}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {locked
                ? "Three seats — student, teacher and administrator — at a fictional school with a full year of fictional data."
                : "Three seats, one click each, already populated with a full school year."}
            </p>
            {!locked && (
              <div className="mt-5">
                <DemoEntry compact />
              </div>
            )}

            {/* The staff list is the sign-in credential. It stays behind the
                password with everything else it opens. */}
            {!locked && (
              <>
            <h3 className="mt-9 font-display text-lg text-ink">Staff at this school</h3>
            <ul className="mt-3 divide-y divide-sand rounded-xl border border-sand-deep bg-surface">
              {staff.map((u) => (
                <li key={u.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{u.name}</p>
                    <p className="text-xs text-ink-soft">{u.title}</p>
                  </div>
                  <code className="rounded bg-paper-deep px-2 py-0.5 text-xs text-ink-soft">
                    {u.email}
                  </code>
                </li>
              ))}
            </ul>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
