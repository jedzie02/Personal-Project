import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pickle/core"],
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
