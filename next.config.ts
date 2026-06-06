import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "pg",
    "ioredis",
    "kysely",
    "@better-auth/kysely-adapter",
    "better-auth",
    "@react-pdf/renderer",
  ],
  turbopack: {
    resolveAlias: {},
  },
};

export default nextConfig;
