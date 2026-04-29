import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default:  "Reno Ready — Renovation planning made simple.",
    template: "%s | Reno Ready",
  },
  description:
    "Design your bathroom, know the cost, then talk to a builder. Australia's smartest renovation planning tool.",
  keywords: ["bathroom renovation", "bathroom design", "renovation cost", "Australian renovation"],
  icons: {
    icon:             [{ url: "/logo.png", type: "image/png" }],
    apple:            [{ url: "/logo.png", type: "image/png" }],
    shortcut:         "/logo.png",
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-sand text-charcoal`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
