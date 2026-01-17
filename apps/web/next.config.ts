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
    ...(isVercel ? [] : ["chromadb", "@chroma-core/default-embed"]), // Only include on non-Vercel
    "onnxruntime-node",
    "@huggingface/transformers",
    "@lancedb/lancedb",
    "faiss-node",
  ],

  ...(isDockerBuild && { output: "standalone" }),

  outputFileTracingExcludes: {
    "*": [
      // Exclude Alpine Linux
      "**/@lancedb+lancedb-linux-x64-musl*/**",
      "**/@lancedb/lancedb-linux-x64-musl/**",

      // Exclude Mac/Windows
      "**/@lancedb+lancedb-darwin*/**",
      "**/@lancedb/lancedb-darwin*/**",
      "**/@lancedb+lancedb-win32*/**",
      "**/@lancedb/lancedb-win32*/**",

      // Exclude Faiss
      "node_modules/faiss-node/**",

      // Exclude ChromaDB on Vercel
      ...(isVercel
        ? ["node_modules/chromadb/**", "node_modules/@chroma-core/**"]
        : []),
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
      // Mark these as external (don't bundle them)
      config.externals = [
        ...(config.externals || []),
        "@orpc/client/fetch",
        "onnxruntime-node",
        "@huggingface/transformers",
        "faiss-node",
        "@lancedb/lancedb",
        // Always externalize chromadb on server
        "chromadb",
        "@chroma-core/default-embed",
      ];
    } else {
      // For client-side, mark as false (don't include at all)
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

    // On Vercel, also alias chromadb to false on server
    if (isVercel && isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        chromadb: false,
        "@chroma-core/default-embed": false,
        "@lancedb/lancedb": false,
        "@lancedb/lancedb-linux-x64-musl": false,
        "@lancedb/lancedb-darwin-x64": false,
        "@lancedb/lancedb-darwin-arm64": false,
        "@lancedb/lancedb-win32-x64-msvc": false,
        "faiss-node": false,
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
