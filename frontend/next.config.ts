import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Two sibling lockfiles (backend/ and frontend/) with no root package.json make
  // Turbopack infer the git root as the workspace root, which breaks resolution of
  // `@import "tailwindcss"` in globals.css. Pin the root to this directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
