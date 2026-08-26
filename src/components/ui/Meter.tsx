const TRACK_FILL: Record<string, string> = {
  pine: "bg-pine",
  marigold: "bg-marigold-deep",
  denim: "bg-denim",
  berry: "bg-berry",
  ink: "bg-ink-soft",
};

/**
 * A labelled proportion bar. The visible label always carries the numbers, so
 * the bar is decorative reinforcement rather than the only channel — this
 * keeps it readable without colour perception and at any contrast setting.
 */
export function Meter({
  label,
  value,
  max = 1,
  accent = "pine",
  valueLabel,
  size = "md",
}: {
  label: string;
  value: number;
  max?: number;
  accent?: keyof typeof TRACK_FILL;
  valueLabel?: string;
  size?: "sm" | "md";
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const percent = Math.round(ratio * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`${size === "sm" ? "text-xs" : "text-sm"} text-ink-soft`}>{label}</span>
        <span
          className={`ark-tabular font-semibold text-ink ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          {valueLabel ?? `${percent}%`}
        </span>
      </div>
      <div
        className={`mt-1.5 w-full overflow-hidden rounded-full bg-sand ${size === "sm" ? "h-1.5" : "h-2.5"}`}
        role="img"
        aria-label={`${label}: ${valueLabel ?? `${percent} percent`}`}
      >
        <div
          className={`h-full rounded-full ${TRACK_FILL[accent] ?? TRACK_FILL.pine}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
