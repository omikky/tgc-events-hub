import { defineConfig } from "vitest/config";

export default defineConfig({
  // This sub-project is plain Node/TS. Pass an inline (empty) PostCSS config so
  // Vite does not walk up the tree and load the parent app's Tailwind pipeline.
  css: { postcss: {} },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
