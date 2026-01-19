import { defineConfig } from "tsup";
const isDocker =
  process.env.DOCKER_BUILD === "true" || process.env.DOCKER_BUILD === "1";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: !isDocker,
  splitting: false,
  sourcemap: !isDocker,
  clean: true,
  treeshake: true,
  minify: false,
  outDir: "dist",
});
