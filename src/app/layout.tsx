import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";

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

export const metadata: Metadata = {
  title: {
    default:  "Reno Ready — AI Bathroom Design & Cost Estimator Australia",
    template: "%s | Reno Ready",
  },
  description:
    "Design your Australian bathroom renovation with AI, get an instant cost estimate, then connect with local builders. Free bathroom design tool — no architect needed.",
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
  ],
  openGraph: {
    title:       "Reno Ready — AI Bathroom Design & Cost Estimator Australia",
    description: "Design your Australian bathroom renovation with AI, get an instant cost estimate, then connect with local builders.",
    type:        "website",
    locale:      "en_AU",
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple:   [{ url: "/logo.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/logo.png",
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-sand text-charcoal overflow-x-hidden`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
