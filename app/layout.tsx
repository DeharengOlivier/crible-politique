import type { Metadata, Viewport } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import AccountBadge from "@/components/AccountBadge";
import { analyticsWebsiteId } from "@/lib/optionalFeatures";

const lexend = Lexend({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // The production domain, and the base every absolute URL is built on:
  // canonical links, the sitemap, robots.txt and the Open Graph images. A
  // preview deployment overrides it with NEXT_PUBLIC_SITE_URL.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://crible.eu"),
  title: "Le Crible Politique — Un miroir, pas un juge",
  description: "Situez vos positions en 7 dimensions, comparez-les aux positions documentées des partis (France et Belgique), et voyez ce que le droit permet ou empêche pour les mesures phares du débat. Le calcul se fait dans votre navigateur; sauvegarde chiffrée facultative.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Le Crible Politique — Quel est ton profil politique ?",
    description: "15 énoncés, 3 minutes, méthodologie publique. Le calcul se fait dans ton navigateur.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Le Crible",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A8A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* The icon links are emitted from app/icon.svg, app/favicon.ico and
            app/apple-icon.png: a hand-written one pointed at a file that had
            never existed. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Read through the same helper /legal declares the processor from, so
            the script and the declaration cannot disagree. */}
        {analyticsWebsiteId() !== null && (
          // Served from this origin, not from the measurement host. Ad
          // blockers filter on the third-party hostname rather than on the
          // path, so a first-party script is the difference between counting
          // visits and counting the visits of people without a blocker. The
          // /_v/ prefix is rewritten in next.config.ts, and covers the beacon
          // too: the Umami tracker derives its collection URL from the
          // directory of its own currentScript.src.
          <>
            {/* Loaded first, and deferred like the tracker, so the redaction
                below is defined by the time the tracker fires: deferred
                scripts run in document order. */}
            <script defer src="/mesure-audience.js" />
            <script
              defer
              data-website-id={analyticsWebsiteId() ?? undefined}
              data-before-send="cribleMesureAudience"
              src="/_v/script.js"
            />
          </>
        )}
      </head>
      <body
        className={`${lexend.variable} ${sourceSans.variable} font-[family-name:var(--font-body)] antialiased`}
      >
        {/* The account corner, on every page that has chrome. It decides for
            itself to stay off the test page. */}
        <AccountBadge />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
