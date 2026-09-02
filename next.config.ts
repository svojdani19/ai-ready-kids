import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Copies only the server files and the pruned dependencies the app actually
   * imports into `.next/standalone`, so the container ships without
   * `node_modules`. Nothing about local development changes.
   */
  output: "standalone",
};

export default nextConfig;
