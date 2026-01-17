import type { NextConfig } from "next";
import path from "path";

const isDockerBuild = process.env.DOCKER_BUILD === "true";
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

if (!isVercel) {
  require("dotenv").config({
    path: path.resolve(process.cwd(), "../../.env"),
  });
}

const nextConfig: NextConfig = {
  transpilePackages: ["@gaia/db", "@gaia/api", "@gaia/ai"],

  serverExternalPackages: [
    "better-sqlite3",
    "@orpc/server",
    "@orpc/client",
    "pg",
    "chromadb",
    "@chroma-core/default-embed",
    "onnxruntime-node",
    "@huggingface/transformers",
    "@lancedb/lancedb",
    "faiss-node",
  ],

  ...(isDockerBuild && { output: "standalone" }),

  // 1. Fix Size Limit: Explicitly exclude the Alpine (musl) and other OS binaries
  outputFileTracingExcludes: {
    "*": [
      // Exclude Alpine Linux (the huge 129MB file you don't need)
      "**/@lancedb+lancedb-linux-x64-musl*/**",
      "**/@lancedb/lancedb-linux-x64-musl/**",

      // Exclude Mac/Windows just to be safe
      "**/@lancedb+lancedb-darwin*/**",
      "**/@lancedb/lancedb-darwin*/**",
      "**/@lancedb+lancedb-win32*/**",
      "**/@lancedb/lancedb-win32*/**",

      // Exclude Faiss if not strictly needed or if too large
      "node_modules/faiss-node/**",
    ],
  },
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  poweredByHeader: false,
  compress: true,

  turbopack: {},

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "@orpc/client/fetch",
        "onnxruntime-node",
        "chromadb",
        "@chroma-core/default-embed",
        "@huggingface/transformers",
        "faiss-node",
        "@lancedb/lancedb",
      ];
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        chromadb: false,
        "@chroma-core/default-embed": false,
        "@huggingface/transformers": false,
        "@lancedb/lancedb": false,
        "faiss-node": false,
      };
    }

    // Keep the Vercel-specific alias exclusions to prevent webpack bundling
    if (isVercel) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@lancedb/lancedb-linux-x64-musl": false,
        "@lancedb/lancedb-darwin-x64": false,
        "@lancedb/lancedb-darwin-arm64": false,
        "@lancedb/lancedb-win32-x64-msvc": false,
      };
    }

    // Docker optimizations
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
