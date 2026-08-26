import type { DatabaseSync } from "node:sqlite";

export type Db = DatabaseSync;

/** node:sqlite returns null-prototype rows; normalise to plain objects. */
export function rows<T>(value: unknown[]): T[] {
  return value.map((r) => ({ ...(r as object) })) as T[];
}

export function row<T>(value: unknown): T | undefined {
  return value === undefined || value === null
    ? undefined
    : ({ ...(value as object) } as T);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
