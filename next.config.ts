import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["canvas", "@tensorflow/tfjs", "@tensorflow/tfjs-node"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
