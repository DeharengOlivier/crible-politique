import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Anciennes routes (avant fusion "Le Crible Politique").
    return [
      { source: "/mode1", destination: "/test", permanent: true },
      { source: "/mode2", destination: "/crible", permanent: true },
      { source: "/elections", destination: "/", permanent: true },
      { source: "/login", destination: "/", permanent: true },
      { source: "/account", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
