"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Logo } from "./Logo";

/**
 * Marketing header.
 *
 * The site's depth lives in these menus rather than in one long scrolling
 * page, so the landing page can do the one job a landing page has.
 *
 * Implemented as disclosure buttons rather than a true ARIA menubar. A menubar
 * takes over the arrow keys and is the wrong pattern for what is really a set
 * of links; a button that expands a list of links is what screen reader users
 * actually expect on a marketing site. Escape closes, a click outside closes,
 * moving focus out closes, and every item is a plain link that works without
 * JavaScript running.
 */

interface NavItem {
  href: string;
  label: string;
  blurb: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "The program",
    items: [
      { href: "/approach", label: "How it works", blurb: "Practice before exposure, and why it is not a chatbot" },
      { href: "/curriculum", label: "Curriculum", blurb: "Twenty-seven missions across three competencies" },
      { href: "/benchmark", label: "Annual check-ins", blurb: "Fall and spring, on unfamiliar situations" },
      { href: "/privacy", label: "Privacy and data", blurb: "Everything we hold, and what has no column" },
    ],
  },
  {
    label: "For your school",
    items: [
      // Sprint 44: this said "certify". Sprint 25 renamed the five modules an
      // educator orientation precisely because the checks are ungated — a
      // teacher can answer every one wrong and still finish — so completion
      // records that pages were read, not that anything was understood. The
      // destination section calls it an orientation with a certificate of
      // completion; the navigation promised a principal something else.
      {
        href: "/for-schools#teachers",
        label: "Teachers",
        blurb: "Preview, assign, discuss, prepare",
      },
      { href: "/for-schools#administrators", label: "Administrators", blurb: "Aggregate trends and an annual report" },
      { href: "/for-schools#families", label: "Families", blurb: "A printable page per mission, no account" },
      { href: "/plans", label: "Plans", blurb: "Annual subscription, purchase order friendly" },
    ],
  },
];

/**
 * How a menu was dismissed, because the answer changes what happens to focus.
 *
 * Escape is the only one that has to hand focus back. The others already leave
 * it somewhere the user chose: on the link they followed, on whatever they
 * clicked, or on whatever they tabbed to.
 */
type DismissReason = "escape" | "pointer" | "focus";

function useDismiss(
  open: boolean,
  close: (reason: DismissReason) => void,
  ref: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close("escape");
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close("pointer");
    };
    const onFocus = (e: FocusEvent) => {
      const target = e.target as Node | null;
      // Focus landing on the document body is not a user moving away: it is a
      // window blur, a programmatic focus reset, or the page regaining focus.
      // Closing on those made the menu shut by itself.
      if (!target || target === document.body) return;
      if (ref.current && !ref.current.contains(target)) close("focus");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open, close, ref]);
}

function NavMenu({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  /**
   * Escape has to give focus back, or it is not a way out.
   *
   * Sprint 44's browser check found the menu hiding while focus stayed on a
   * link inside it — still in the document, no longer visible — so a keyboard
   * or switch user pressing Escape and then Tab resumed from a place they
   * could not see. "Escape closes" is only true if what it closes gives focus
   * somewhere findable.
   *
   * Guarded on focus actually being inside the menu, which keeps this to the
   * recovery case: if the user has already tabbed away, the thing being hidden
   * is not what holds focus, and pulling it back would be stealing it. Every
   * other dismissal leaves focus where the user put it — the link they
   * followed, what they clicked, what they tabbed to — so none of them refocus.
   */
  const dismiss = useCallback((reason: DismissReason) => {
    const hadFocus = Boolean(wrapper.current?.contains(document.activeElement));
    setOpen(false);
    if (reason === "escape" && hadFocus) button.current?.focus();
  }, []);

  useDismiss(open, dismiss, wrapper);

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[0.95rem] font-semibold transition-colors ${
          open ? "bg-grape-wash text-grape-deep" : "text-ink-soft hover:bg-paper-deep hover:text-ink"
        }`}
      >
        {group.label}
        <svg
          viewBox="0 0 12 8"
          width="11"
          height="8"
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        id={id}
        hidden={!open}
        className="absolute left-0 top-full z-40 mt-1 w-80 rounded-2xl border-2 border-ink bg-surface p-2 shadow-panel"
      >
        <ul>
          {group.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 hover:bg-grape-wash focus-visible:bg-grape-wash"
              >
                <span className="block text-[0.95rem] font-semibold text-ink">{item.label}</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{item.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Closed on the tap that navigates rather than by watching the route, so
  // there is no effect correcting state after the fact.
  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" aria-label="AI Ready Kids home" className="flex min-h-11 items-center">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {GROUPS.map((group) => (
            <NavMenu key={group.label} group={group} />
          ))}
          <Link
            href="/demo"
            className="flex min-h-11 items-center rounded-xl px-3 text-[0.95rem] font-semibold text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
          >
            See the demo
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/join"
            className="hidden min-h-11 items-center rounded-xl border-2 border-ink bg-surface px-3.5 text-sm font-semibold text-ink hover:bg-marigold-wash sm:flex"
          >
            I have a class code
          </Link>
          <Link
            href="/signin"
            className="flex min-h-11 items-center rounded-xl border-2 border-pine-deep bg-pine-deep px-3.5 text-sm font-semibold text-white hover:bg-pine"
          >
            Educator sign in
          </Link>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="site-menu"
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-ink bg-surface lg:hidden"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {mobileOpen ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </div>

      <div id="site-menu" hidden={!mobileOpen} className="border-t-2 border-ink bg-surface lg:hidden">
        <div className="mx-auto max-w-6xl px-5 py-4">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                {group.label}
              </p>
              <ul className="mt-1.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="flex min-h-11 items-center rounded-xl px-2 text-[0.95rem] font-semibold text-ink hover:bg-grape-wash"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            href="/demo"
            onClick={close}
            className="flex min-h-11 items-center rounded-xl px-2 text-[0.95rem] font-semibold text-ink hover:bg-grape-wash"
          >
            See the demo
          </Link>
          <Link
            href="/join"
            onClick={close}
            className="mt-1 flex min-h-11 items-center rounded-xl px-2 text-[0.95rem] font-semibold text-ink hover:bg-grape-wash sm:hidden"
          >
            I have a class code
          </Link>
        </div>
      </div>
    </header>
  );
}
