import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import TrackVisit from "@/components/layout/TrackVisit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const SITE_TITLE       = "Reno Ready | Design Your Dream Renovation in Seconds";
const SITE_DESCRIPTION = "Design your bathroom, kitchen, or bedroom in seconds. Get AI visual previews, instant itemized cost estimates, and builder briefs on Reno Ready.";

export const metadata: Metadata = {
  // absolute URLs for share images and canonical links
  metadataBase: new URL("https://www.renoready.com.au"),
  title: {
    default:  SITE_TITLE,
    template: "%s | Reno Ready",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Reno Ready",
  keywords: [
    "bathroom renovation Australia",
    "bathroom design tool",
    "AI bathroom design",
    "bathroom renovation cost estimator",
    "bathroom renovation cost Australia",
    "bathroom reno design",
    "where to start bathroom renovation",
    "bathroom renovation hidden costs",
    "bathroom design AI Australia",
    "renovation planning tool",
    "bathroom renovation ideas Australia",
    "kitchen renovation cost estimator",
    "AI kitchen design",
    "bedroom renovation ideas",
    "renovation cost estimate Australia",
  ],
  // the share image comes from app/opengraph-image.jpg and twitter-image.jpg
  openGraph: {
    title:       SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName:    "Reno Ready",
    type:        "website",
    locale:      "en_AU",
  },
  twitter: {
    card:        "summary_large_image",
    title:       SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: {
    // the house-and-tick mark alone on white, square, so search results and tabs show it clearly
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple:   [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-sand text-charcoal [overflow-x:clip]`}
      >
        <Header />
        <TrackVisit />
        {children}
      </body>
    </html>
  );
}
