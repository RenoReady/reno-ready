"use client";

/**
 * ProWelcome — shown once, right after someone upgrades to Pro, if they
 * haven't set up report branding yet. Their logo and details go on every PDF
 * report and client share link, so it's the first thing worth doing.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, X } from "lucide-react";
import BrandForm from "@/components/account/BrandForm";

const DISMISS_KEY = "rr_brand_prompt_dismissed";

export function brandPromptDismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}

export default function ProWelcome({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const skip = () => { try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ } onClose(); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[320] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={skip}>
      <div role="dialog" aria-modal="true" aria-labelledby="pro-welcome-title" onClick={(e) => e.stopPropagation()}
        className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-sand shadow-warm-xl sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-sand-200 bg-white p-5 sm:p-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta text-white"><Crown size={18} /></div>
          <div className="flex-1">
            <h2 id="pro-welcome-title" className="text-lg font-bold text-charcoal">Welcome to Reno Ready Pro</h2>
            <p className="text-sm text-charcoal/55">
              First, make it yours. Your logo and details go on every PDF report and client link you send, so clients see your business, not ours.
            </p>
          </div>
          <button onClick={skip} aria-label="Close" className="rounded-xl p-2 text-charcoal/40 hover:bg-sand-50 hover:text-charcoal"><X size={18} /></button>
        </div>

        <div className="p-4 sm:p-6">
          {saved ? (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-sand-200 bg-white px-6 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={22} /></span>
              <p className="text-lg font-bold text-charcoal">You&apos;re all set</p>
              <p className="max-w-sm text-sm text-charcoal/60">
                Your branding is on your PDF reports and client links from now on. Change it anytime under Report branding in My Account.
              </p>
              <button onClick={onClose} className="mt-3 rounded-2xl bg-terracotta px-6 py-3 text-sm font-bold text-white shadow-warm-sm hover:bg-terracotta/90">
                Back to my design
              </button>
            </div>
          ) : (
            <>
              <BrandForm onSaved={() => setSaved(true)} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <button onClick={skip} className="font-semibold text-charcoal/50 hover:text-charcoal">Skip for now</button>
                <Link href="/account#branding" onClick={skip} className="text-charcoal/45 hover:text-charcoal">You can also do this later in My Account</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
