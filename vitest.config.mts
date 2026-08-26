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
    restoreMocks: true,
  },
});
