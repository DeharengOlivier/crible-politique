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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nothing here needs a camera, a microphone or a location. The
          // microphone entry is the one that matters: the interview mode
          // speaks and never listens, and this makes the browser refuse a
          // request for one even if code asking for it ever came back.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
