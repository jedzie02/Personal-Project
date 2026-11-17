import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pickle/core"],
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
