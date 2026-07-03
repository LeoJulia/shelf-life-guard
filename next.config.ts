import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    dangerouslyAllowLocalIP: true,
    domains: ["zgvolwclxwvboazhskio.supabase.co"],
  },
};

export default nextConfig;
