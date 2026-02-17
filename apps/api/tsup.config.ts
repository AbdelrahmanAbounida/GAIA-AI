import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/types.ts",
    "src/ratelimits.ts",
    "src/utils.ts",
    "src/scalar.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  outDir: "dist",
  external: [
    "@gaia/ai",
    "@gaia/db",
    "@orpc/client",
    "@orpc/openapi",
    "@orpc/server",
    "@orpc/zod",
    "axios",
    "nanoid",
    "uuid",
    "vm2",
    "zod",
  ],
});
