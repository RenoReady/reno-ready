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
  // The builder-brief form sends the client's Pro Report PDF (photos compressed, usually < 1 MB)
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // The admin dashboard lives at /admin — send /dashboard there too
  async redirects() {
    return [
      { source: "/dashboard", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
