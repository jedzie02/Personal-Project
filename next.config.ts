import type { NextConfig } from "next";

// Pin server-side Date to PH time. TZ is reserved in Vercel env vars,
// so we set it here instead — next.config runs before any server code.
process.env.TZ = "Asia/Manila";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
