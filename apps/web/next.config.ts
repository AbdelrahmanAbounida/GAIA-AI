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
    "chromadb",
    "@chroma-core/default-embed",
    "onnxruntime-node",
    "@huggingface/transformers",
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
      config.externals = [
        ...(config.externals || []),
        "@orpc/client/fetch",
        "onnxruntime-node",
        "chromadb",
        "@chroma-core/default-embed",
        "@huggingface/transformers",
      ];
    } else {
      // Prevent client-side bundling of server-only packages
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        chromadb: false,
        "@chroma-core/default-embed": false,
        "@huggingface/transformers": false,
      };
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
