"use client";

/**
 * Microsoft Clarity: heatmaps and session recordings (free), so we can see
 * where people click, scroll and get stuck. Typed text is masked by Clarity.
 *
 * Only runs on the live site (not localhost or preview deploys), and never
 * starts on private pages: the admin dashboard, client share links (/s/…)
 * and My Account. The privacy policy lists it under "Who we share it with"
 * and "Cookies".
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim() || "zbynehifhu";
const PRIVATE = ["/admin", "/s/", "/account"];

declare global {
  interface Window { clarity?: ((...args: unknown[]) => void) & { q?: unknown[] } }
}

export default function Clarity() {
  const pathname = usePathname();
  useEffect(() => {
    if (!/(^|\.)renoready\.com\.au$/.test(window.location.hostname)) return;
    if (PRIVATE.some((p) => pathname.startsWith(p))) return;
    if (window.clarity) return;   // already running for this tab

    // Clarity's standard loader
    const q: unknown[] = [];
    const fn = (...args: unknown[]) => { q.push(args); };
    window.clarity = Object.assign(fn, { q });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
    document.head.appendChild(s);
  }, [pathname]);
  return null;
}
