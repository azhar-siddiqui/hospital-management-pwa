import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Dynamic pages such as /staff/[id] are not kept after a visit unless this is set.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
