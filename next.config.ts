import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Routes from before the merge into "Le Crible Politique". Kept because
    // links to them are in the wild; they are redirects, not pages.
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
