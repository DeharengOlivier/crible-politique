import type { Metadata, Viewport } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";
import "./globals.css";

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
  // Replace with the production domain once wired up
  // (criblepolitique.fr): used as the base for absolute OG image URLs.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://criblepolitique.fr"),
  title: "Le Crible Politique — Un miroir, pas un juge",
  description: "Vos convictions au crible, les programmes au crible du droit. Situez vos positions en 7 dimensions, comparez-les aux positions documentées des partis (FR/BE) et vérifiez ce que le droit permet vraiment. Sans compte, sans collecte de données.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Le Crible Politique — Quel est ton profil politique ?",
    description: "12 énoncés, 3 minutes, méthodologie publique. Tes réponses ne quittent jamais ton appareil.",
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body
        className={`${lexend.variable} ${sourceSans.variable} font-[family-name:var(--font-body)] antialiased`}
      >
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
