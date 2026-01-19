import type { NextConfig } from "next";
import path from "path";

const isDockerBuild = !!process.env.DOCKER_BUILD;
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

if (!isVercel && !process.env.DOCKER_BUILD) {
  require("dotenv").config({
    path: path.resolve(process.cwd(), "../../.env"),
  });
}

const nextConfig: NextConfig = {
  transpilePackages: ["@gaia/db", "@gaia/api", "@gaia/ai"],
  typescript: {
    ignoreBuildErrors: true,
  },

  serverExternalPackages: [
    "better-sqlite3",
    "@orpc/server",
    "@orpc/client",
    "pg",
    ...(isVercel ? [] : ["chromadb", "@chroma-core/default-embed"]),
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
    // Disable memory-intensive features in Docker
    ...(isDockerBuild && {
      webpackBuildWorker: false, // Disable webpack worker to save memory
    }),
  },

  poweredByHeader: false,
  compress: true,

  // Disable source maps in Docker to save memory during build
  ...(isDockerBuild && {
    productionBrowserSourceMaps: false,
  }),

  turbopack: {},

  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "@orpc/client/fetch",
        "onnxruntime-node",
        "@huggingface/transformers",
        "faiss-node",
        "@lancedb/lancedb",
        "chromadb",
        "@chroma-core/default-embed",
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

    if (isVercel && isServer) {
      config.externals.push(
        "chromadb",
        "@chroma-core/default-embed",
        "@lancedb/lancedb",
        "faiss-node",
      );
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

    // IMPROVED: Docker-specific optimizations that actually help
    if (isDockerBuild && !dev) {
      // Keep minification enabled - it reduces final bundle size
      config.optimization = {
        ...config.optimization,
        minimize: true, // Changed from false - smaller bundles use less memory
        minimizer: config.optimization?.minimizer, // Keep default minimizer
        // Disable code splitting to reduce complexity
        splitChunks: false,
        // Reduce concurrent processing
        runtimeChunk: false,
      };

      // Disable cache to avoid memory accumulation
      config.cache = false;

      // Reduce parallelism to avoid memory spikes
      config.parallelism = 1;

      // Disable performance hints to save memory
      config.performance = {
        hints: false,
      };
    }

    return config;
  },
};

export default nextConfig;
