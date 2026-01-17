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
    "faiss-node",

    // "@lancedb/lancedb",
    // "@lancedb/lancedb-linux-x64-gnu",
    // "@lancedb/lancedb-linux-x64-musl",
    // "@lancedb/lancedb-darwin-x64",
    // "@lancedb/lancedb-darwin-arm64",
    // "@lancedb/lancedb-win32-x64-msvc",
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
      config.externals = [
        ...(config.externals || []),
        "@orpc/client/fetch",
        "onnxruntime-node",
        "chromadb",
        "@chroma-core/default-embed",
        "@huggingface/transformers",
        "faiss-node",

        // "@lancedb/lancedb",
        // "@lancedb/lancedb-linux-x64-gnu",
        // "@lancedb/lancedb-linux-x64-musl",
        // "@lancedb/lancedb-darwin-x64",
        // "@lancedb/lancedb-darwin-arm64",
        // "@lancedb/lancedb-win32-x64-msvc",
      ];
    } else {
      // Prevent client-side bundling
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        chromadb: false,
        "@chroma-core/default-embed": false,
        "@huggingface/transformers": false,
        "@lancedb/lancedb": false,
        "faiss-node": false,
        // "@lancedb/lancedb-linux-x64-gnu": false,
        // "@lancedb/lancedb-linux-x64-musl": false,
        // "@lancedb/lancedb-darwin-x64": false,
        // "@lancedb/lancedb-darwin-arm64": false,
        // "@lancedb/lancedb-win32-x64-msvc": false,
      };
    }

    config.plugins = config.plugins || [];

    // Ignore platform-specific bindings
    config.plugins.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /@lancedb\/lancedb-(linux|darwin|win32)/,
        contextRegExp: /node_modules/,
      })
    );

    // Handle .node files
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
