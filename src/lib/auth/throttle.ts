/**
 * Progressive backoff for class-code entry.
 *
 * `findClassByCode` is a public, unthrottled action that searches every active
 * class, which made the code space the only thing standing between a stranger
 * and a roster. Widening the space helps; leaving the guessing free does not.
 *
 * What this deliberately is not: a profile. Nothing is written to the database,
 * nothing survives a restart, no identifier of a child is involved and no
 * record of who tried what is kept. It is a counter in memory, keyed by a
 * coarse bucket, that forgets everything after the window passes. Production
 * should do this at the edge — see the README — because a per-process counter
 * is exactly as good as one process.
 */

const WINDOW_MS = 10 * 60 * 1000;
/** Free attempts before backoff starts. A child mistyping is normal. */
const FREE_ATTEMPTS = 5;
/** Each attempt past the allowance waits longer, up to this ceiling. */
const MAX_DELAY_MS = 60 * 1000;

interface Bucket {
  failures: number;
  /** When the bucket resets, refreshed on every failure. */
  expires: number;
  /** Not before this instant. */
  blockedUntil: number;
}

const buckets = new Map<string, Bucket>();

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.expires <= now && bucket.blockedUntil <= now) buckets.delete(key);
  }
}

export interface ThrottleState {
  allowed: boolean;
  /** Whole seconds a caller must wait. Zero when allowed. */
  retryAfterSeconds: number;
}

/** May this bucket attempt a code right now? */
export function checkAttempt(key: string, now = Date.now()): ThrottleState {
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.blockedUntil <= now) return { allowed: true, retryAfterSeconds: 0 };
  return {
    allowed: false,
    retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
  };
}

/** Record a wrong code. Backoff doubles per attempt past the allowance. */
export function recordFailure(key: string, now = Date.now()): void {
  const existing = buckets.get(key);
  const failures = (existing && existing.expires > now ? existing.failures : 0) + 1;
  const over = Math.max(0, failures - FREE_ATTEMPTS);
  const delay = over === 0 ? 0 : Math.min(MAX_DELAY_MS, 1000 * 2 ** (over - 1));
  buckets.set(key, {
    failures,
    expires: now + WINDOW_MS,
    blockedUntil: now + delay,
  });
}

/** A correct code clears the bucket: a child who gets in is not suspicious. */
export function clearAttempts(key: string): void {
  buckets.delete(key);
}

/** Test seam. Never called in production code. */
export function resetThrottle(): void {
  buckets.clear();
}
