"use client";

/**
 * Site-wide footer. Links every room page from every page, so Google finds
 * them and treats them as important. Left off the design tool itself (it has
 * its own bottom bar on phones), client share links, admin and printouts.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN = [/^\/builder/, /^\/(bathroom|kitchen|bedroom)(\/|$)/, /^\/s\//, /^\/admin/, /^\/account\/approval/, /^\/preview/, /^\/connect/, /^\/auth/];

const ROOMS = [
  { href: "/bathroom", label: "Bathroom design" },
  { href: "/kitchen",  label: "Kitchen design" },
  { href: "/bedroom",  label: "Bedroom design" },
];

const SITE = [
  { href: "/pricing",      label: "Pricing" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/for-builders", label: "For builders" },
  { href: "/guide",        label: "Renovation Guide" },
  { href: "/gallery",      label: "Design Gallery" },
  { href: "/hidden-costs", label: "Hidden Costs" },
  { href: "/privacy",      label: "Privacy" },
  { href: "/terms",        label: "Terms" },
];

export default function Footer() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN.some((r) => r.test(pathname))) return null;

  const link = "hover:text-charcoal/70 transition-colors";
  return (
    <footer className="border-t border-sand-200 py-10 px-6 bg-sand print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-charcoal/40">© {new Date().getFullYear()} Reno Ready. Renovation planning made simple.</p>
          <nav aria-label="Design tools" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-charcoal/55">
            {ROOMS.map((r) => <Link key={r.href} href={r.href} className={link}>{r.label}</Link>)}
          </nav>
        </div>
        <nav aria-label="Site" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-charcoal/40">
          {SITE.map((s) => <Link key={s.href} href={s.href} className={link}>{s.label}</Link>)}
        </nav>
        <p className="text-xs text-charcoal/30 border-t border-sand-200 pt-4">
          Cost estimates are indicative only and based on current Australian market averages. Always obtain qualified builder quotes before committing to a renovation.
        </p>
      </div>
    </footer>
  );
}
