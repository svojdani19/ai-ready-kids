import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger" | "kid";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-pine-deep text-white border-pine-deep hover:bg-pine active:bg-pine-deep",
  secondary:
    "bg-surface text-ink border-sand-deep hover:bg-paper-deep",
  quiet:
    "bg-transparent text-ink-soft border-transparent hover:bg-paper-deep hover:text-ink",
  danger:
    "bg-berry-deep text-white border-berry-deep hover:bg-berry",
  kid:
    "bg-marigold-deep text-white border-marigold-deep hover:bg-marigold ark-sticker font-semibold",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-[0.95rem] rounded-xl gap-2",
  lg: "px-6 py-3.5 text-lg rounded-2xl gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center border-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none text-center";

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
