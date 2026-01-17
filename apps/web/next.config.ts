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

  ...(isDockerBuild && { output: "standalone" }),
  outputFileTracingExcludes: {
    "*": [
      "node_modules/faiss-node/**",
      // "node_modules/@lancedb/**",
      // "node_modules/.pnpm/*lancedb*/**",
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  poweredByHeader: false,
  compress: true,

  turbopack: {},

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep existing externals
      config.externals = [
        ...(config.externals || []),
        "@orpc/client/fetch",
        "onnxruntime-node",
        "chromadb",
        "@chroma-core/default-embed",
        "@huggingface/transformers",
        "faiss-node",
      ];

      if (isVercel) {
        // config.externals.push("@lancedb/lancedb", "faiss-node");
        config.externals.push({ vectordb: "vectordb" });
      }
    } else {
      // Prevent client-side bundling
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        chromadb: false,
        "@chroma-core/default-embed": false,
        "@huggingface/transformers": false,
      };

      if (isVercel) {
        // config.resolve.alias["@lancedb/lancedb"] = false;
        config.resolve.alias["faiss-node"] = false;
      }
    }

    // ✅ Add ignore plugin for LanceDB native bindings
    config.plugins = config.plugins || [];

    if (isVercel) {
      config.plugins.push(
        new (require("webpack").IgnorePlugin)({
          resourceRegExp: /@lancedb\/lancedb-(linux|darwin|win32)/,
        })
      );
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

    if (isVercel) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@lancedb/lancedb-linux-x64-musl": false,
        "@lancedb/lancedb-linux-x64-gnu": false,
        "@lancedb/lancedb-darwin-x64": false,
        "@lancedb/lancedb-darwin-arm64": false,
        "@lancedb/lancedb-win32-x64-msvc": false,
      };

      // Add fallback for missing modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@lancedb/lancedb-linux-x64-gnu": false,
        "@lancedb/lancedb-linux-x64-musl": false,
        "@lancedb/lancedb-darwin-x64": false,
        "@lancedb/lancedb-darwin-arm64": false,
        "@lancedb/lancedb-win32-x64-msvc": false,
      };

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
