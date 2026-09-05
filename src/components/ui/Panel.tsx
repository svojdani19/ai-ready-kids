import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  as: Tag = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={`rounded-xl border border-sand-deep bg-surface ark-print-plain ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-sand px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-lg leading-tight text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-1 max-w-prose text-sm text-ink-soft">{description}</p>
            )}
          </div>
          {/*
            Wraps rather than refusing to shrink. `shrink-0` kept a row of tags
            at its full width on a phone, so a fourth tag on the mission cards
            pushed the whole page 43px wide. The header already lets this drop
            to its own line; now its contents can wrap on that line too.
          */}
          {actions && (
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
          )}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function PanelBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-display text-3xl leading-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
