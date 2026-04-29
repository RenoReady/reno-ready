import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow the public folder (default) + any remote Gemini/Supabase image hosts
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "generativelanguage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
