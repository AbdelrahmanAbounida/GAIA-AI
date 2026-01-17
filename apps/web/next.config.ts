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

  serverExternalPackages: isVercel
    ? [
        "better-sqlite3",
        "@libsql/client",
        "@orpc/server",
        "@orpc/client",
        "pg",
        "chromadb",
        "@chroma-core/default-embed",
        "onnxruntime-node",
        "@huggingface/transformers",
      ]
    : [
        "better-sqlite3",
        "faiss-node",
        "@lancedb/lancedb",
        "@orpc/server",
        "@orpc/client",
        "pg",
        "chromadb",
        "@chroma-core/default-embed",
        "onnxruntime-node",
        "@huggingface/transformers",
      ],

  // output: isVercel ? "export" : "standalone",
  ...(isDockerBuild && { output: "standalone" }),
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@lancedb/**",
      "node_modules/faiss-node/**",
      "node_modules/@libsql/**",
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Production optimizations
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
        "@lancedb/lancedb",
        "faiss-node",
      ];

      // Exclude heavy packages on Vercel to reduce bundle size
      if (isVercel) {
        config.externals.push(
          "@lancedb/lancedb",
          "faiss-node",
          // Exclude specific LanceDB native binaries
          "@lancedb/lancedb-linux-x64-musl",
          "@lancedb/lancedb-linux-x64-gnu",
          "@lancedb/lancedb-darwin-x64",
          "@lancedb/lancedb-darwin-arm64",
          "@lancedb/lancedb-win32-x64-msvc"
        );
      }
    } else {
      // Prevent client-side bundling of server-only packages
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        chromadb: false,
        "@chroma-core/default-embed": false,
        "@huggingface/transformers": false,
      };

      // Also exclude heavy packages on client side for Vercel
      if (isVercel) {
        config.resolve.alias["@lancedb/lancedb"] = false;
        config.resolve.alias["faiss-node"] = false;
      }
    }

    // Ignore .node files
    config.module = {
      ...config.module,
      rules: [
        ...(config.module?.rules || []),
        {
          test: /\.node$/,
          use: "node-loader",
        },
      ],
    };

    // Vercel-specific optimizations
    if (isVercel) {
      // Reduce bundle size by excluding unnecessary files
      config.resolve.alias = {
        ...config.resolve.alias,
        // Exclude native bindings that aren't needed on Vercel
        "@lancedb/lancedb-linux-x64-musl": false,
        "@lancedb/lancedb-linux-x64-gnu": false,
        "@lancedb/lancedb-darwin-x64": false,
        "@lancedb/lancedb-darwin-arm64": false,
        "@lancedb/lancedb-win32-x64-msvc": false,
      };

      // Optimize for serverless
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic",
        runtimeChunk: false,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };
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
