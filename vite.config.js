import { defineConfig } from "vite";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts", "test/**/*.e2e.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      reporter: ["html"],
      thresholds: {
        100: true,
      },
    },
  },
});
