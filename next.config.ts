import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "asclepios-medical.ro",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
