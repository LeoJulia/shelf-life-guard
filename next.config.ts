import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zgvolwclxwvboazhskio.supabase.co",
        port: "",
        pathname: "/storage/v1/object/sign/product-images/**",
      },
    ],
  },
};

export default nextConfig;
