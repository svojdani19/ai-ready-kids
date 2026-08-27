import { COMPETENCY_BY_ID } from "@/content/competencies";
import type { CompetencyId } from "@/content/types";

/**
 * Mission badges.
 *
 * A badge means one thing only: you finished this mission and read the
 * feedback. There is no rarity, no tier, no points value and no streak, so
 * there is nothing here to chase, and the display looks the same on day one as
 * on day two.
 *
 * The glyph is keyed to the skill a mission builds rather than to the mission
 * itself, so the three badges for one skill are visibly a family. A child
 * collecting them can see what they are collecting, which twenty-seven
 * unrelated drawings would not show them.
 */

const ACCENT_HEX: Record<string, { solid: string; wash: string }> = {
  pine: { solid: "#12503f", wash: "#e2f0eb" },
  marigold: { solid: "#9c5605", wash: "#fdefd6" },
  denim: { solid: "#1d4770", wash: "#e5eef6" },
};

const GLYPHS: Record<string, React.ReactNode> = {
  "privacy.identity": <path d="M20 30h24v16a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4zM26 30v-6a6 6 0 0 1 12 0v6" strokeWidth="3.5" />,
  "privacy.media": <path d="M18 26h10l4-5h8l4 5h10v22H18zM32 30a7 7 0 1 0 0 14 7 7 0 0 0 0-14" strokeWidth="3.5" />,
  "privacy.escalate": <path d="M22 46c0-6 4-10 10-10s10 4 10 10M32 22a6 6 0 1 1 0 12 6 6 0 0 1 0-12M46 30l6-6" strokeWidth="3.5" />,
  "verify.confidence": <path d="M32 20v18M32 44v2" strokeWidth="4" />,
  "verify.synthetic": <path d="M28 34a10 10 0 1 1 20 0 10 10 0 0 1-20 0M26 41L16 51" strokeWidth="3.5" />,
  "verify.source": <path d="M22 22h20v24H22zM27 30h10M27 37h10M42 26l8 8-8 8" strokeWidth="3.5" />,
  "own.effort": <path d="M24 44l4-12 16-16 6 6-16 16zM24 44l6-2" strokeWidth="3.5" />,
  "own.toolchoice": <path d="M20 22h10v24H20zM34 22h10v24H34zM27 34h1M41 34h1" strokeWidth="3.5" />,
  "own.honesty": <path d="M20 26h24M20 34h24M20 42h14" strokeWidth="4" />,
};

export function BadgeSticker({
  skillId,
  competency,
  earned,
  size = 84,
}: {
  /** The mission's primary skill. Badges for one skill share a glyph. */
  skillId: string;
  competency: CompetencyId;
  earned: boolean;
  size?: number;
}) {
  const accent = ACCENT_HEX[COMPETENCY_BY_ID[competency].accent] ?? ACCENT_HEX.pine;
  const stroke = earned ? accent.solid : "#a79b8c";
  const fill = earned ? accent.wash : "#f2ece3";

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={earned ? "" : "opacity-60"}
    >
      <path
        d="M32 3l6.6 4.9 8.1-1.2 3.2 7.6 7.6 3.2-1.2 8.1L61.2 32l-4.9 6.6 1.2 8.1-7.6 3.2-3.2 7.6-8.1-1.2L32 61.2l-6.6-4.9-8.1 1.2-3.2-7.6-7.6-3.2 1.2-8.1L2.8 32l4.9-6.6-1.2-8.1 7.6-3.2 3.2-7.6 8.1 1.2z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round">
        {GLYPHS[skillId] ?? GLYPHS["own.honesty"]}
      </g>
    </svg>
  );
}
