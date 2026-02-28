import type { NextConfig } from "next";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  output: isCapacitorBuild ? 'export' : 'standalone',

  // Static export requires unoptimized images (no server-side resizing)
  ...(isCapacitorBuild && {
    images: { unoptimized: true },
  }),
};

export default nextConfig;
