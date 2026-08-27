import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  tone = "paper",
}: {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  children?: ReactNode;
  tone?: "paper" | "grape" | "marigold" | "pine";
}) {
  const bg = {
    paper: "bg-paper",
    grape: "bg-grape-wash",
    marigold: "bg-marigold-wash",
    pine: "bg-pine-wash",
  }[tone];

  return (
    <section className={`border-b-2 border-ink ${bg}`}>
      <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">{eyebrow}</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
          {title}
        </h1>
        {lede && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{lede}</p>}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}

export function Section({
  id,
  title,
  lede,
  children,
  tone = "paper",
}: {
  id?: string;
  title?: string;
  lede?: ReactNode;
  children: ReactNode;
  tone?: "paper" | "surface" | "grape" | "marigold" | "pine" | "denim";
}) {
  const bg = {
    paper: "bg-paper",
    surface: "bg-surface",
    grape: "bg-grape-wash",
    marigold: "bg-marigold-wash",
    pine: "bg-pine-wash",
    denim: "bg-denim-wash",
  }[tone];

  return (
    <section id={id} className={`scroll-mt-24 border-b-2 border-ink ${bg}`}>
      <div className="mx-auto max-w-5xl px-5 py-12 sm:py-14">
        {title && <h2 className="font-display text-3xl text-ink">{title}</h2>}
        {lede && (
          <p className="mt-3 max-w-3xl text-[1.05rem] leading-relaxed text-ink-soft">{lede}</p>
        )}
        <div className={title || lede ? "mt-8" : ""}>{children}</div>
      </div>
    </section>
  );
}

type CardTone = "marigold" | "pine" | "denim" | "grape" | "berry";

const BORDER: Record<CardTone, string> = {
  marigold: "border-marigold",
  pine: "border-pine",
  denim: "border-denim",
  grape: "border-grape",
  berry: "border-berry",
};

export function CardGrid({
  cards,
  columns = 3,
}: {
  cards: { title: string; body: string; tone?: CardTone }[];
  columns?: 2 | 3 | 4;
}) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "md:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid gap-4 ${cols}`}>
      {cards.map((c) => (
        <div
          key={c.title}
          className={`rounded-2xl border-2 bg-surface p-5 ${c.tone ? BORDER[c.tone] : "border-ink"}`}
        >
          <h3 className="font-display text-lg leading-snug text-ink">{c.title}</h3>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{c.body}</p>
        </div>
      ))}
    </div>
  );
}
