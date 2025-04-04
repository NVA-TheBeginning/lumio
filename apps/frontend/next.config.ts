import { env } from "node:process";
import type { NextConfig } from "next";

const isProduction = env.NODE_ENV === "production" || env.BUN_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  expireTime: 3600,
  experimental: {
    reactCompiler: isProduction,
    optimizePackageImports: ["@radix-ui/*"],
    ppr: "incremental",
  },
};

export default nextConfig;
