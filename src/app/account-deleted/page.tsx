import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Account deleted", robots: { index: false, follow: false } };

export default function AccountDeletedPage() {
  return (
    <main className="min-h-[70vh] bg-sand flex items-center justify-center px-6 py-20">
      <div className="max-w-md rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-warm-sm">
        <h1 className="mb-2 text-2xl font-bold text-charcoal">Your account has been deleted</h1>
        <p className="text-sm leading-relaxed text-charcoal/60">
          Your designs, drafts, share links and briefs have been removed, and you&apos;ve been signed out.
          Thanks for planning with Reno Ready. You&apos;re welcome back any time.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-terracotta px-5 py-2.5 text-sm font-bold text-white hover:bg-terracotta/90">Back to home</Link>
      </div>
    </main>
  );
}
