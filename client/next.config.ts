import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // Required for static export: disable image optimization (uses server-side rendering)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
