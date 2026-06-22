import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  sourcemap: true,
  noExternal: ["@business/contracts", "@business/database"],
  external: ["mysql2", "mysql2/promise", "drizzle-orm", "drizzle-orm/mysql2"],
});