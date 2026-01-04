import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gaia/db", "@gaia/api", "@gaia/ai"],
  serverExternalPackages: ["better-sqlite3", "faiss-node", "@lancedb/lancedb"],
  output: "standalone",
  experimental: {
    // turbo: {
    //   resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    // },
  },
};

export default nextConfig;
