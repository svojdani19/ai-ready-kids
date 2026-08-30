import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [
      // `server-only` throws when imported outside a React Server Component.
      // The repositories genuinely are server-only; under test they are just
      // functions over a sqlite handle, so the guard is stubbed out here.
      { find: /^server-only$/, replacement: new URL("./tests/stubs/server-only.ts", import.meta.url).pathname },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Each suite opens its own sqlite file, so parallel files are safe.
    pool: "forks",
    /**
     * Vitest's default is 5s, and that is too tight for this suite.
     *
     * `createTestDb` seeds a whole demo school per fixture — 90 students, a
     * year of attempts and check-ins — so the heaviest tests take ~2.7s on an
     * idle machine. With one fork per core competing for CPU, several would
     * occasionally cross 5s and fail as timeouts rather than as defects: three
     * different files did so during sprint 78, each at ~5.0-5.4s, each passing
     * on its own immediately afterwards.
     *
     * A gate that fails once in three runs teaches you to re-run it, which is
     * how a real failure gets waved through. The headroom is deliberate; it
     * does not slow a passing run, because a passing test never waits.
     */
    testTimeout: 20_000,
    hookTimeout: 20_000,
    restoreMocks: true,
  },
});
