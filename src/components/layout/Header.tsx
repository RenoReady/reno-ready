"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ProgressNav from "@/components/ui/ProgressNav";
import { cn } from "@/lib/utils";

const APP_ROUTES = ["/builder", "/preview", "/connect"];

export default function Header() {
  const pathname = usePathname();
  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <header className="sticky top-0 z-50 w-full bg-sand-50/90 backdrop-blur-md border-b border-sand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-24 flex items-center justify-between gap-2 sm:gap-6">

        {/* Logo — square canvas, multiply removes the white background on sand header */}
        <Link href="/" className="flex items-center group flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Reno Ready"
            height={150}
            width={150}
            style={{ mixBlendMode: "multiply" }}
            priority
            className="h-10 w-auto sm:h-[100px] sm:w-auto transition-opacity duration-200 group-hover:opacity-75"
          />
        </Link>

        {/* Middle: Progress nav (app routes) OR nav links (landing) */}
        {isAppRoute ? (
          <ProgressNav />
        ) : (
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "How It Works", href: "/#how-it-works" },
              { label: "Pricing",      href: "/#pricing" },
              { label: "FAQ",          href: "/#faq" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold text-charcoal/70",
                  "hover:text-charcoal hover:bg-charcoal/5 transition-all duration-150",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: CTA */}
        <Link
          href="/builder"
          className={cn(
            "hidden sm:inline-flex items-center gap-2",
            "px-5 py-2.5 rounded-xl text-sm font-semibold",
            "bg-terracotta text-white shadow-warm-sm",
            "hover:bg-terracotta-600 transition-all duration-200",
            isAppRoute && "opacity-0 pointer-events-none", // hide on app routes
          )}
        >
          Start Free
        </Link>

      </div>
    </header>
  );
}
