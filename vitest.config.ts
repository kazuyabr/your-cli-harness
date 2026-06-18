import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts", "tests/e2e/**/*.test.ts"],
    exclude: [],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/core/**/*.ts", "src/shared/**/*.ts"],
      exclude: ["src/**/index.ts", "src/**/types.ts"],
      thresholds: {
        branches: 80,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@clients": path.resolve(__dirname, "src/clients"),
    },
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@clients": path.resolve(__dirname, "src/clients"),
    },
  },
});
