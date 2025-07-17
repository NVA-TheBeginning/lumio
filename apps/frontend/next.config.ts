import { env } from "node:process";
import type { NextConfig } from "next";

const isProduction = env.NODE_ENV === "production" || env.BUN_ENV === "production";
// One page is broken with React compiler, so we disable it for now
const enableReactCompiler = isProduction && env.ENABLE_REACT_COMPILER === "true";

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
    reactCompiler: enableReactCompiler,
    optimizePackageImports: ["@radix-ui/*", "framer-motion"],
    nodeMiddleware: true,
    browserDebugInfoInTerminal: true,
    serverActions: {
      bodySizeLimit: "1gb",
    },
    turbopackPersistentCaching: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
};

export default nextConfig;
