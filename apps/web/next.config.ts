import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  // Thêm các config khác nếu cần
};

export default nextConfig;
