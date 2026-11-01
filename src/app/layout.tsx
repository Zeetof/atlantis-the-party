import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ORGANIZER, SITE_NAME } from "@/lib/site";

const display = localFont({
  src: "../fonts/anton.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

const body = localFont({
  src: "../fonts/manrope.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "200 800",
});

const editorial = localFont({
  src: "../fonts/cormorant-garamond-italic.woff2",
  variable: "--font-editorial",
  display: "swap",
  weight: "400 600",
  style: "italic",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ATLANTIS THE PARTY — 4.0 Detty December",
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Atlantis The Party 4.0 — Detty December. December 30, 2026 at Watercress Event Center, Allen, Ikeja, Lagos. Official tickets via Popout Tickets, plus the 999 remembrance experience.",
  applicationName: SITE_NAME,
  authors: [{ name: ORGANIZER }],
  creator: ORGANIZER,
  keywords: [
    "Atlantis The Party",
    "WESTHAN.ENT",
    "Detty December",
    "Lagos party",
    "Ikeja event",
    "Popout Tickets",
    "999 tribute",
  ],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: SITE_NAME,
    title: "ATLANTIS THE PARTY — 4.0 Detty December",
    description:
      "December 30, 2026 · Watercress Event Center, Allen, Ikeja, Lagos. Official tickets via Popout Tickets.",
    images: [
      {
        url: "/og-atlantis.jpg",
        width: 1200,
        height: 630,
        alt: "Atlantis The Party 4.0 — Detty December, December 30, 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ATLANTIS THE PARTY — 4.0 Detty December",
    description: "December 30, 2026 · Watercress Event Center, Allen, Ikeja, Lagos.",
    images: ["/og-atlantis.jpg"],
  },
  alternates: { canonical: "/" },
  category: "events",
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: ORGANIZER,
  url: siteUrl,
  brand: {
    "@type": "Brand",
    name: SITE_NAME,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable} ${editorial.variable}`}>
      <body className="bg-ink font-sans text-bone antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-bone focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
