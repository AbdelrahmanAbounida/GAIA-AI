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
      "**/@lancedb+lancedb-linux-x64-musl*/**",
      "**/@lancedb/lancedb-linux-x64-musl/**",

      "**/@lancedb+lancedb-darwin*/**",
      "**/@lancedb/lancedb-darwin*/**",
      "**/@lancedb+lancedb-win32*/**",
      "**/@lancedb/lancedb-win32*/**",

      "node_modules/faiss-node/**",

      ...(isVercel
        ? ["node_modules/chromadb/**", "node_modules/@chroma-core/**"]
        : []),
    ],
  },
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    ...(isDockerBuild && {
      webpackBuildWorker: false,
    }),
  },

  poweredByHeader: false,
  compress: true,
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

    if (isDockerBuild && !dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: config.optimization?.minimizer,
        splitChunks: true,
        runtimeChunk: false,
      };

      config.cache = false;

      config.parallelism = 1;
      config.devtool = false;

      config.performance = {
        hints: false,
      };
    }

    return config;
  },
};

export default nextConfig;
