import type { SceneArt as SceneArtKey } from "@/content/types";

/**
 * Original scene illustrations.
 *
 * Flat shapes, one warm palette, no gradients and no photography. Each scene
 * is decorative: the narration carries every piece of meaning, so these are
 * marked aria-hidden and a screen reader user misses nothing.
 */

const INK = "#241f1a";
const PAPER = "#fdf7ee";
const SAND = "#efe3d1";
const SAND_DEEP = "#d9c4a5";
const MARIGOLD = "#e08a1e";
const MARIGOLD_DEEP = "#9c5605";
const PINE = "#1c6b58";
const DENIM = "#2b6193";
const DENIM_DEEP = "#1d4770";
const BERRY = "#a8375a";

function Frame({ children, sky = PAPER }: { children: React.ReactNode; sky?: string }) {
  return (
    <svg
      viewBox="0 0 400 220"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="220" fill={sky} />
      {children}
    </svg>
  );
}

const classroom = (
  <Frame sky="#fdf1dd">
    <rect x="22" y="26" width="150" height="96" rx="6" fill={PINE} />
    <rect x="30" y="34" width="134" height="80" rx="3" fill="#26806a" />
    <path d="M46 62h60M46 76h84M46 90h44" stroke={PAPER} strokeWidth="4" strokeLinecap="round" />
    <rect x="214" y="24" width="150" height="104" rx="8" fill={DENIM} />
    <rect x="224" y="34" width="130" height="84" rx="4" fill="#8fc0e4" />
    <circle cx="322" cy="60" r="17" fill={MARIGOLD} />
    <path d="M289 96l22-26 20 24 14-16 17 18z" fill={PINE} />
    <rect x="214" y="24" width="150" height="104" rx="8" fill="none" stroke={INK} strokeWidth="4" />
    <path d="M289 24v104M214 76h150" stroke={INK} strokeWidth="4" />
    <rect x="0" y="150" width="400" height="70" fill={SAND} />
    <rect x="0" y="146" width="400" height="8" fill={SAND_DEEP} />
    <rect x="34" y="158" width="122" height="12" rx="4" fill={MARIGOLD_DEEP} />
    <rect x="44" y="170" width="12" height="42" fill={INK} />
    <rect x="134" y="170" width="12" height="42" fill={INK} />
    <rect x="234" y="158" width="122" height="12" rx="4" fill={MARIGOLD_DEEP} />
    <rect x="244" y="170" width="12" height="42" fill={INK} />
    <rect x="334" y="170" width="12" height="42" fill={INK} />
  </Frame>
);

const tablet = (
  <Frame sky="#e9f1f7">
    <rect x="96" y="26" width="208" height="168" rx="16" fill={INK} />
    <rect x="108" y="38" width="184" height="132" rx="6" fill={PAPER} />
    <circle cx="200" cy="182" r="7" fill={SAND_DEEP} />
    <rect x="124" y="56" width="90" height="34" rx="12" fill={MARIGOLD_DEEP} />
    <path d="M136 90l4 14 14-14z" fill={MARIGOLD_DEEP} />
    <path d="M138 68h56M138 78h34" stroke={PAPER} strokeWidth="5" strokeLinecap="round" />
    <rect x="186" y="108" width="90" height="44" rx="12" fill={SAND} />
    <path d="M266 152l-4 14-14-14z" fill={SAND} />
    <path d="M200 122h60M200 134h40" stroke={INK} strokeWidth="5" strokeLinecap="round" opacity="0.7" />
  </Frame>
);

const camera = (
  <Frame sky="#f3ecf7">
    <rect x="128" y="22" width="144" height="176" rx="18" fill={INK} />
    <rect x="138" y="32" width="124" height="140" rx="6" fill="#c8ddec" />
    <circle cx="200" cy="96" r="34" fill={MARIGOLD} />
    <path d="M180 84c4-12 36-12 40 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="188" cy="98" r="4" fill={INK} />
    <circle cx="212" cy="98" r="4" fill={INK} />
    <path d="M168 74l-8-18 22 8zM232 74l8-18-22 8z" fill={MARIGOLD_DEEP} />
    <path d="M150 44h18M150 44v18M250 44h-18M250 44v18M150 160h18M150 160v-18M250 160h-18M250 160v-18"
      stroke={PAPER} strokeWidth="4" strokeLinecap="round" />
    <circle cx="200" cy="184" r="9" fill={BERRY} />
  </Frame>
);

const library = (
  <Frame sky="#f6efe2">
    <rect x="18" y="20" width="168" height="182" rx="6" fill={MARIGOLD_DEEP} />
    <rect x="26" y="28" width="152" height="50" fill="#7a4304" />
    <rect x="26" y="86" width="152" height="50" fill="#7a4304" />
    <rect x="26" y="144" width="152" height="50" fill="#7a4304" />
    {[0, 1, 2].map((r) =>
      [PINE, BERRY, DENIM, MARIGOLD, PAPER, PINE, BERRY].map((c, i) => (
        <rect
          key={`${r}-${i}`}
          x={32 + i * 21}
          y={32 + r * 58}
          width={14}
          height={42}
          rx="2"
          fill={c}
        />
      )),
    )}
    <rect x="212" y="118" width="164" height="16" rx="4" fill={SAND_DEEP} />
    <rect x="222" y="134" width="12" height="68" fill={INK} />
    <rect x="354" y="134" width="12" height="68" fill={INK} />
    <path d="M236 118l30-24 30 24z" fill={PAPER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M266 94v24" stroke={INK} strokeWidth="3" />
    <rect x="300" y="96" width="52" height="22" rx="3" fill={DENIM} />
  </Frame>
);

const bedroomNight = (
  <Frame sky="#1d2b3d">
    <rect x="40" y="24" width="150" height="120" rx="8" fill="#0f1a28" stroke={SAND_DEEP} strokeWidth="6" />
    <path d="M115 24v120M40 84h150" stroke={SAND_DEEP} strokeWidth="6" />
    <circle cx="88" cy="56" r="15" fill="#f5e3b8" />
    <circle cx="82" cy="50" r="12" fill="#0f1a28" />
    <circle cx="150" cy="46" r="2.5" fill={PAPER} />
    <circle cx="165" cy="66" r="2" fill={PAPER} />
    <circle cx="140" cy="110" r="2" fill={PAPER} />
    <rect x="232" y="96" width="144" height="60" rx="8" fill={BERRY} />
    <rect x="222" y="82" width="60" height="34" rx="8" fill={PAPER} />
    <rect x="232" y="156" width="144" height="42" fill="#7f2340" />
    <rect x="0" y="196" width="400" height="24" fill="#141f2e" />
    <circle cx="196" cy="140" r="20" fill={MARIGOLD} opacity="0.25" />
    <rect x="182" y="132" width="28" height="20" rx="4" fill={MARIGOLD} />
  </Frame>
);

const playground = (
  <Frame sky="#dcefff">
    <circle cx="332" cy="46" r="26" fill={MARIGOLD} />
    <rect x="0" y="160" width="400" height="60" fill="#8fbf7a" />
    <rect x="0" y="156" width="400" height="8" fill={PINE} />
    <rect x="92" y="46" width="14" height="118" fill={INK} />
    <rect x="146" y="46" width="14" height="118" fill={INK} />
    <rect x="80" y="34" width="92" height="16" rx="4" fill={BERRY} />
    <path d="M160 60l72 100h-30l-56-84z" fill={DENIM} />
    <path d="M166 56l74 104" stroke={DENIM_DEEP} strokeWidth="6" strokeLinecap="round" />
    <rect x="250" y="120" width="120" height="44" rx="6" fill={SAND} />
    <rect x="250" y="116" width="120" height="8" rx="4" fill={SAND_DEEP} />
    <circle cx="52" cy="128" r="18" fill={MARIGOLD_DEEP} />
    <rect x="44" y="146" width="16" height="18" fill={INK} />
  </Frame>
);

const deskTest = (
  <Frame sky="#f6efe2">
    <rect x="0" y="128" width="400" height="92" fill={MARIGOLD_DEEP} />
    <rect x="0" y="122" width="400" height="10" fill="#7a4304" />
    <rect x="96" y="36" width="132" height="94" rx="4" fill={PAPER} stroke={INK} strokeWidth="4" />
    <path d="M116 62h92M116 78h92M116 94h60" stroke={SAND_DEEP} strokeWidth="5" strokeLinecap="round" />
    <path d="M116 62h34" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <g transform="rotate(28 288 92)">
      <rect x="278" y="34" width="20" height="94" fill={MARIGOLD} />
      <path d="M278 128h20l-10 22z" fill="#f0d9b8" />
      <path d="M282 146h12l-6 10z" fill={INK} />
      <rect x="278" y="34" width="20" height="14" fill={BERRY} />
    </g>
    <rect x="24" y="86" width="46" height="44" rx="4" fill={DENIM} />
  </Frame>
);

const fourDoors = (
  <Frame sky="#f3ecdd">
    {[
      { x: 14, fill: PINE },
      { x: 112, fill: MARIGOLD_DEEP },
      { x: 210, fill: DENIM },
      { x: 308, fill: BERRY },
    ].map((d) => (
      <g key={d.x}>
        <rect x={d.x} y="34" width="78" height="164" rx="6" fill={d.fill} />
        <rect x={d.x + 8} y="42" width="62" height="148" rx="4" fill="none" stroke={PAPER} strokeWidth="3" opacity="0.6" />
        <circle cx={d.x + 62} cy="118" r="5" fill={MARIGOLD} />
        <rect x={d.x + 16} y="56" width="46" height="26" rx="3" fill={PAPER} opacity="0.9" />
      </g>
    ))}
    <rect x="0" y="196" width="400" height="24" fill={SAND_DEEP} />
  </Frame>
);

const kitchen = (
  <Frame sky="#fbeed6">
    <rect x="0" y="150" width="400" height="70" fill={MARIGOLD_DEEP} />
    <rect x="0" y="144" width="400" height="10" fill="#7a4304" />
    <rect x="118" y="94" width="164" height="52" rx="4" fill={PAPER} stroke={INK} strokeWidth="4" />
    <path d="M138 112h80M138 128h50" stroke={SAND_DEEP} strokeWidth="5" strokeLinecap="round" />
    <path d="M300 106h34v40h-34z" fill={PINE} />
    <path d="M334 116h12v18h-12z" fill="none" stroke={PINE} strokeWidth="5" />
    <path d="M300 100h34" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    <g>
      <path d="M62 30h44l-6 46H68z" fill={SAND} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="80" y="76" width="8" height="58" fill={INK} />
      <rect x="60" y="134" width="48" height="12" rx="4" fill={INK} />
      <circle cx="84" cy="60" r="9" fill={MARIGOLD} />
    </g>
  </Frame>
);

const hallway = (
  <Frame sky="#eef2f6">
    <rect x="0" y="160" width="400" height="60" fill={SAND} />
    <rect x="0" y="154" width="400" height="8" fill={SAND_DEEP} />
    {[8, 74, 140].map((x) => (
      <g key={x}>
        <rect x={x} y="42" width="58" height="118" rx="4" fill={DENIM} />
        <rect x={x + 6} y="48" width="46" height="106" rx="3" fill={DENIM_DEEP} />
        <circle cx={x + 44} cy="102" r="4" fill={MARIGOLD} />
        <path d={`M${x + 16} 62h26M${x + 16} 70h26`} stroke={DENIM} strokeWidth="3" />
      </g>
    ))}
    <rect x="238" y="26" width="130" height="134" rx="4" fill={MARIGOLD_DEEP} />
    <rect x="246" y="34" width="114" height="118" rx="3" fill="#7a4304" />
    <circle cx="256" cy="98" r="6" fill={MARIGOLD} />
    <rect x="272" y="56" width="64" height="34" rx="3" fill="#c8a45a" stroke={INK} strokeWidth="3" />
    <path d="M284 68h40M284 78h26" stroke={INK} strokeWidth="3" strokeLinecap="round" />
  </Frame>
);

const ART: Record<SceneArtKey, React.ReactNode> = {
  classroom,
  tablet,
  camera,
  library,
  "bedroom-night": bedroomNight,
  playground,
  "desk-test": deskTest,
  "four-doors": fourDoors,
  kitchen,
  hallway,
};

export function SceneArt({ art }: { art: SceneArtKey }) {
  return <>{ART[art] ?? classroom}</>;
}
