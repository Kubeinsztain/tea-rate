import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/dotenv.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2022",
  platform: "node",
  fixedExtension: false,
});
