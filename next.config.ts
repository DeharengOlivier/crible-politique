import type { NextConfig } from "next";

// Headers every response carries, except where noted below.
const BASE_SECURITY_HEADERS = [
  // The browser must not guess a type the server did not declare.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // A shared profile URL carries a badge in its path. Sending only the origin
  // to another site keeps that badge out of a third party's logs when someone
  // follows a link away from the page.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs a camera, a microphone or a location. The microphone
  // entry is the one that matters: the interview mode speaks and never
  // listens, and this makes the browser refuse a request for one even if code
  // asking for it ever came back.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

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
        // Everything except the embed. The negative lookahead is what keeps a
        // page from receiving two different frame-ancestors directives.
        source: "/((?!embed).*)",
        headers: [
          ...BASE_SECURITY_HEADERS,
          // Only this site may frame these pages. It stops another site
          // putting the test, a shared profile or a comparison inside an
          // invisible frame under its own controls.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      {
        // The widget exists to be framed by partner media, so it says so
        // rather than inheriting a rule that would forbid its only purpose.
        source: "/embed/:path*",
        headers: [
          ...BASE_SECURITY_HEADERS,
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        source: "/embed",
        headers: [
          ...BASE_SECURITY_HEADERS,
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
