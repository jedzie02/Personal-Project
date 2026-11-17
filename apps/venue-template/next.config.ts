import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pickle/core"],
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
