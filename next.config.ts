import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow long-running AI generation requests (up to 5 minutes)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
