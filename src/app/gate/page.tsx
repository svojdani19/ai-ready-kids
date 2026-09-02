import type { Metadata } from "next";
import { headers } from "next/headers";
import { GateForm } from "./GateForm";

/**
 * The curtain.
 *
 * Deliberately says almost nothing. It names the product, because somebody who
 * was sent a link should be able to tell they are in the right place, and then
 * asks for the password. It does not describe the program, list what is behind
 * it, or hint at who has access — the point of the gate is that none of that is
 * readable yet.
 *
 * `noindex`, because a page that exists to hide a site should not be the thing
 * that puts it in a search index.
 */
export const metadata: Metadata = {
  title: "AI Ready Kids",
  description: "This preview is password protected.",
  robots: { index: false, follow: false },
};

export default async function GatePage() {
  // Set by the middleware rewrite, so entering the password lands on the page
  // that was originally asked for rather than the home page.
  const next = (await headers()).get("x-airk-gate-next") ?? "/";

  return (
    <main
      id="main"
      className="flex min-h-dvh items-center justify-center bg-paper px-5 py-16"
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-ink bg-surface p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">
          AI Ready Kids
        </p>
        <h1 className="mt-2 font-display text-2xl leading-tight text-ink">
          This preview is password protected.
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
          Enter the password you were given to see the site. If you do not have one,
          the person who sent you the link has it.
        </p>
        <GateForm next={next} />
      </div>
    </main>
  );
}
