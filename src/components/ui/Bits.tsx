import type { ReactNode } from "react";

const TONES: Record<string, string> = {
  neutral: "bg-paper-deep text-ink-soft border-sand-deep",
  pine: "bg-pine-wash text-pine-deep border-pine",
  marigold: "bg-marigold-wash text-marigold-deep border-marigold",
  denim: "bg-denim-wash text-denim-deep border-denim",
  berry: "bg-berry-wash text-berry-deep border-berry",
};

export function Tag({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="rounded-xl border border-sand-deep bg-surface px-4 py-3.5 ark-print-plain">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">{label}</p>
      <p
        className={`ark-tabular mt-1.5 font-display text-2xl leading-none ${
          tone === "neutral" ? "text-ink" : (TONES[tone].split(" ")[1] ?? "text-ink")
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs leading-snug text-ink-soft">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-sand-deep bg-paper px-6 py-10 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{children}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Note({
  title,
  children,
  tone = "denim",
}: {
  title?: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <aside className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${TONES[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </aside>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${htmlFor}-hint`} className="mt-0.5 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-berry-deep">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border-2 border-sand-deep bg-surface px-3 py-2 text-[0.95rem] text-ink placeholder:text-ink-faint focus:border-denim-deep focus:outline-none";
