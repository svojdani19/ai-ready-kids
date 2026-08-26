import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Join your class" };

export default function JoinPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-sand-deep px-5 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link href="/" aria-label="AI Ready Kids home">
            <Logo />
          </Link>
          <Link
            href="/signin"
            className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
          >
            I am a teacher
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-12">
        <div className="rounded-3xl border-4 border-ink bg-surface p-6 shadow-sticker-deep sm:p-8">
          <JoinForm />
        </div>
        <p className="mt-6 text-center text-sm leading-relaxed text-ink-soft">
          You do not need a password and you never have to type your last name.
        </p>
      </main>
    </div>
  );
}
