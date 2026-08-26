/**
 * Student avatars.
 *
 * Ten animals drawn on a shared 64-unit grid with the same stroke weight and
 * eye treatment, so a class roster reads as one set. They are assigned
 * automatically at roster creation: children never upload an image and there
 * is no camera anywhere in this product.
 *
 * Silhouettes are deliberately distinct rather than palette-swapped, because
 * a seven year old picks their own name off a grid of twenty-three faces.
 */

const INK = "#241f1a";

interface Spec {
  label: string;
  body: string;
  draw: React.ReactNode;
}

const eyes = (
  <>
    <circle cx="25" cy="32" r="3.2" fill={INK} />
    <circle cx="39" cy="32" r="3.2" fill={INK} />
  </>
);

const SPECS: Record<string, Spec> = {
  fox: {
    label: "Fox",
    body: "#e08a1e",
    draw: (
      <>
        <path d="M13 27 15 7l15 10zM51 27 49 7 34 17z" fill="#e08a1e" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="32" cy="34" r="21" fill="#e08a1e" stroke={INK} strokeWidth="2.5" />
        <path d="M32 26c9 0 13 8 13 14 0 7-6 12-13 12s-13-5-13-12c0-6 4-14 13-14Z" fill="#fdf7ee" />
        {eyes}
        <path d="M32 41c2.6 0 4 1.6 4 3s-1.6 3-4 3-4-1.4-4-3 1.4-3 4-3Z" fill={INK} />
        <path d="M32 47v4" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  owl: {
    label: "Owl",
    body: "#8a6c4f",
    draw: (
      <>
        <path d="M16 18 13 6l12 6zM48 18l3-12-12 6z" fill="#8a6c4f" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="32" cy="34" r="22" fill="#8a6c4f" stroke={INK} strokeWidth="2.5" />
        <circle cx="24" cy="31" r="9" fill="#fdf7ee" stroke={INK} strokeWidth="2" />
        <circle cx="40" cy="31" r="9" fill="#fdf7ee" stroke={INK} strokeWidth="2" />
        <circle cx="24" cy="31" r="3.6" fill={INK} />
        <circle cx="40" cy="31" r="3.6" fill={INK} />
        <path d="M32 38l5 7h-10z" fill="#e08a1e" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </>
    ),
  },
  otter: {
    label: "Otter",
    body: "#7a4f2a",
    draw: (
      <>
        <circle cx="16" cy="18" r="7" fill="#7a4f2a" stroke={INK} strokeWidth="2.5" />
        <circle cx="48" cy="18" r="7" fill="#7a4f2a" stroke={INK} strokeWidth="2.5" />
        <circle cx="32" cy="34" r="21" fill="#7a4f2a" stroke={INK} strokeWidth="2.5" />
        <ellipse cx="32" cy="42" rx="14" ry="10" fill="#f3e2c8" />
        {eyes}
        <ellipse cx="32" cy="38" rx="4" ry="3" fill={INK} />
        <path d="M18 42h7M18 46h7M46 42h-7M46 46h-7" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  bear: {
    label: "Bear",
    body: "#6b4a2f",
    draw: (
      <>
        <circle cx="15" cy="16" r="9" fill="#6b4a2f" stroke={INK} strokeWidth="2.5" />
        <circle cx="49" cy="16" r="9" fill="#6b4a2f" stroke={INK} strokeWidth="2.5" />
        <circle cx="15" cy="16" r="4" fill="#c79a6d" />
        <circle cx="49" cy="16" r="4" fill="#c79a6d" />
        <circle cx="32" cy="35" r="22" fill="#6b4a2f" stroke={INK} strokeWidth="2.5" />
        <ellipse cx="32" cy="43" rx="12" ry="9" fill="#e8d4b6" />
        {eyes}
        <ellipse cx="32" cy="39" rx="4.5" ry="3.4" fill={INK} />
        <path d="M32 43v3M27 49c3 2.4 7 2.4 10 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  frog: {
    label: "Frog",
    body: "#4f9a52",
    draw: (
      <>
        <circle cx="21" cy="18" r="10" fill="#4f9a52" stroke={INK} strokeWidth="2.5" />
        <circle cx="43" cy="18" r="10" fill="#4f9a52" stroke={INK} strokeWidth="2.5" />
        <circle cx="21" cy="18" r="4" fill={INK} />
        <circle cx="43" cy="18" r="4" fill={INK} />
        <path d="M32 22c13 0 22 8 22 17s-10 15-22 15-22-6-22-15 9-17 22-17Z" fill="#4f9a52" stroke={INK} strokeWidth="2.5" />
        <path d="M18 42c5 5 23 5 28 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <circle cx="19" cy="35" r="2.4" fill="#3d7a40" />
        <circle cx="45" cy="35" r="2.4" fill="#3d7a40" />
      </>
    ),
  },
  turtle: {
    label: "Turtle",
    body: "#1c6b58",
    draw: (
      <>
        <path d="M8 42c0-13 11-22 24-22s24 9 24 22z" fill="#2b8a72" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M32 20v22M14 40l9-13M50 40l-9-13" stroke={INK} strokeWidth="2" opacity="0.6" />
        <circle cx="32" cy="45" r="13" fill="#7fc4a8" stroke={INK} strokeWidth="2.5" />
        <circle cx="27" cy="43" r="2.8" fill={INK} />
        <circle cx="37" cy="43" r="2.8" fill={INK} />
        <path d="M28 51c2.4 1.8 5.6 1.8 8 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  crane: {
    label: "Crane",
    body: "#dfe5ea",
    draw: (
      <>
        <circle cx="32" cy="34" r="21" fill="#eef2f5" stroke={INK} strokeWidth="2.5" />
        <path d="M32 13c6 0 9 4 9 7H23c0-3 3-7 9-7Z" fill="#a8375a" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        {eyes}
        <path d="M32 38l20 5-20 5z" fill="#e08a1e" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 40c3 3 7 4 11 4" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  hedgehog: {
    label: "Hedgehog",
    body: "#7a6355",
    draw: (
      <>
        <path d="M6 40c0-16 12-28 26-28s26 12 26 28z" fill="#5d4b3f" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M12 34l5-9 4 9 5-11 4 11 5-11 4 11 5-9 4 9" fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M14 40h36c0 9-8 15-18 15s-18-6-18-15Z" fill="#c3a98f" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="25" cy="45" r="2.8" fill={INK} />
        <circle cx="39" cy="45" r="2.8" fill={INK} />
        <circle cx="32" cy="52" r="3" fill={INK} />
      </>
    ),
  },
  bee: {
    label: "Bee",
    body: "#e8b93c",
    draw: (
      <>
        <path d="M22 14 18 4M42 14l4-10" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="18" cy="4" r="3" fill={INK} />
        <circle cx="46" cy="4" r="3" fill={INK} />
        <circle cx="32" cy="35" r="22" fill="#f0c94f" stroke={INK} strokeWidth="2.5" />
        <path d="M12 43h40M17 51h30" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="25" cy="31" r="3.4" fill={INK} />
        <circle cx="39" cy="31" r="3.4" fill={INK} />
        <path d="M27 38c3 2.4 7 2.4 10 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  whale: {
    label: "Whale",
    body: "#2b6193",
    draw: (
      <>
        <path d="M32 8c1 5 5 6 5 10M32 8c-1 5-5 6-5 10" stroke="#8fc0e4" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M10 30c0-9 10-14 22-14s22 5 22 14v6c0 11-10 18-22 18s-22-7-22-18z" fill="#2b6193" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M12 40h40c0 8-9 13-20 13s-20-5-20-13Z" fill="#bfd7e8" />
        <circle cx="24" cy="33" r="3.2" fill={INK} />
        <circle cx="40" cy="33" r="3.2" fill={INK} />
        <path d="M23 43c5 4 13 4 18 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
};

const FALLBACK = SPECS.fox;

export const AVATAR_KEYS = Object.keys(SPECS);

export function avatarLabel(key: string): string {
  return (SPECS[key] ?? FALLBACK).label;
}

export function Avatar({
  avatarKey,
  size = 48,
  className = "",
}: {
  avatarKey: string;
  size?: number;
  className?: string;
}) {
  const spec = SPECS[avatarKey] ?? FALLBACK;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {spec.draw}
    </svg>
  );
}
