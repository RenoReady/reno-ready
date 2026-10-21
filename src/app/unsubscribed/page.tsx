import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Unsubscribed", robots: { index: false, follow: false } };

export default async function UnsubscribedPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const failed = (await searchParams).error === "1";
  return (
    <main className="min-h-[70vh] bg-sand flex items-center justify-center px-6 py-20">
      <div className="max-w-md rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-warm-sm">
        <h1 className="mb-2 text-2xl font-bold text-charcoal">{failed ? "That link didn’t work" : "You’re unsubscribed"}</h1>
        <p className="text-sm leading-relaxed text-charcoal/60">
          {failed
            ? "The unsubscribe link looks incomplete. Sign in and turn reminders off under My Account, or email us and we’ll do it."
            : "We won’t send you any more reminders about unfinished designs. You can turn them back on anytime under My Account."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account" className="rounded-xl bg-terracotta px-5 py-2.5 text-sm font-bold text-white hover:bg-terracotta/90">My Account</Link>
          <Link href="/" className="rounded-xl border-2 border-sand-200 px-5 py-2.5 text-sm font-bold text-charcoal/70 hover:border-terracotta/40">Home</Link>
        </div>
      </div>
    </main>
  );
}
