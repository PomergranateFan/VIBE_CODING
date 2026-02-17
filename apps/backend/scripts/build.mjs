import { build } from "esbuild";
import { rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/index.cjs",
  packages: "external",
  define: {
    "process.env.NODE_ENV": '"production"'
  },
  sourcemap: false,
  minify: true,
  logLevel: "info"
});
