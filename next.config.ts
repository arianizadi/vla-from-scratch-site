import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      // A lesson read as data (src/lessons/index.ts): its animations become markers, so each page
      // ships only the animations it shows (scripts/lesson-data-loader.cjs).
      "*.ts": {
        condition: { query: "?lesson-data" },
        loaders: ["./scripts/lesson-data-loader.cjs"],
        as: "*.ts",
      },
    },
  },
};

export default nextConfig;
