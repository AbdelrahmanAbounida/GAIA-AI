import type { NextConfig } from "next";

const isDockerBuild = process.env.DOCKER_BUILD === "true";

const nextConfig: NextConfig = {
  transpilePackages: ["@gaia/db", "@gaia/api", "@gaia/ai"],
  serverExternalPackages: [
    "better-sqlite3",
    "faiss-node",
    "@lancedb/lancedb",
    "@orpc/server",
    "@orpc/client",
    "pg",
  ],
  output: "standalone",

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  turbopack: {},

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "@orpc/client/fetch"];
    }

    // Only apply memory-saving optimizations when building for Docker
    if (isDockerBuild) {
      config.cache = false;
      config.parallelism = 1;

      config.optimization = {
        ...config.optimization,
        minimize: false,
        splitChunks: false,
      };
    }

    return config;
  },
};

export default nextConfig;
