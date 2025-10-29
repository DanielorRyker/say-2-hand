import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
    unoptimized: true, // Disable image optimization for GCS URLs
  },
  // Thêm các config khác nếu cần
};

export default nextConfig;
