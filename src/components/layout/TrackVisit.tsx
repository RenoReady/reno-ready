"use client";

/**
 * Records the first page of each visit (once per tab session), and whether this
 * browser has been here before. Admin pages and client share links (/s/…)
 * aren't customer visits, so they're left out.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

const SEEN_KEY = "rr_seen";

export default function TrackVisit() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/s/")) return;
    let returning = false;
    try {
      returning = localStorage.getItem(SEEN_KEY) === "1";
      localStorage.setItem(SEEN_KEY, "1");
    } catch { /* private mode */ }
    track("visit", { returning });
  }, [pathname]);
  return null;
}
