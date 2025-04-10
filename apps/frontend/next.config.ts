import { env } from "node:process";
import type { NextConfig } from "next";

const isProduction = env.NODE_ENV === "production" || env.BUN_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  expireTime: 3600,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    minimumCacheTTL: 60,
  },
  experimental: {
    reactCompiler: isProduction,
    optimizePackageImports: ["@radix-ui/*"],
    ppr: "incremental",
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
};

export default nextConfig;
