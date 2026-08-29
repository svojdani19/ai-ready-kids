/**
 * Wordmark. The glyph is a small open book whose pages form a checkmark:
 * the product's whole claim is "practiced, and checked", not "protected".
 */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="2" y="5" width="36" height="30" rx="7" fill="#12503f" />
      <path
        d="M8 12c4-2 8-2 12 1v16c-4-3-8-3-12-1z"
        fill="#fdf7ee"
      />
      <path d="M32 12c-4-2-8-2-12 1v16c4-3 8-3 12-1z" fill="#e08a1e" />
      <path
        d="M13 20.5l3.4 3.4L24 16"
        fill="none"
        stroke="#12503f"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  size = 34,
  subtitle,
  className = "",
}: {
  size?: number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="leading-none">
        <span className="block font-display text-[1.05rem] font-bold tracking-tight text-ink">
          AI Ready Kids
        </span>
        {subtitle && (
          <span className="mt-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
