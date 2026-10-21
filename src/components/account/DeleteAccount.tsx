"use client";

/**
 * DeleteAccount — "Delete my account" on My Account.
 * Lists exactly what goes, warns about an active plan, and asks the person
 * to type DELETE before anything happens.
 */

import { useEffect, useState } from "react";
import { Trash2, Loader2, X, AlertTriangle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { clearLocalDraft } from "@/lib/drafts";

export default function DeleteAccount({ planKind }: { planKind: "free" | "pass" | "pro" | "admin" }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  if (planKind === "admin") return null;   // the admin account can't delete itself

  const remove = async () => {
    setBusy(true); setError(null);
    const res = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) { setError(data?.error ?? "We couldn't delete your account. Please try again."); setBusy(false); return; }
    // clear this device too
    await clearLocalDraft();
    try { Object.keys(localStorage).filter((k) => k.startsWith("reno_ready")).forEach((k) => localStorage.removeItem(k)); } catch { /* storage blocked */ }
    try { sessionStorage.clear(); } catch { /* storage blocked */ }
    await createSupabaseBrowserClient().auth.signOut().catch(() => {});
    window.location.href = "/account-deleted";
  };

  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-charcoal">Delete my account</p>
          <p className="text-xs text-charcoal/55">Permanently removes your account, designs, drafts, share links and briefs.</p>
        </div>
        <button type="button" onClick={() => { setOpen(true); setTyped(""); setError(null); }}
          className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:border-red-300 hover:bg-red-50">
          <Trash2 size={14} /> Delete account
        </button>
      </section>

      {open && (
        <div className="fixed inset-0 z-[320] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !busy && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-warm-xl sm:rounded-3xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600"><AlertTriangle size={18} /></span>
                <h2 id="delete-title" className="text-lg font-bold text-charcoal">Delete your account?</h2>
              </div>
              <button onClick={() => setOpen(false)} disabled={busy} aria-label="Close" className="rounded-lg p-1.5 text-charcoal/40 hover:bg-sand-50 hover:text-charcoal"><X size={18} /></button>
            </div>

            <p className="text-sm text-charcoal/70">This can&apos;t be undone. We&apos;ll permanently delete:</p>
            <ul className="my-3 list-disc space-y-1 pl-5 text-sm text-charcoal/70 marker:text-red-400">
              <li>your account and sign-in</li>
              <li>all your AI designs, 4K exports and drafts, including room photos</li>
              <li>your client share links (they&apos;ll stop working) and report branding</li>
              <li>the builder briefs you&apos;ve sent</li>
            </ul>
            {planKind === "pro" && (
              <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Your Reno Ready Pro subscription will be cancelled straight away, so you won&apos;t be charged again. The rest of the current period isn&apos;t refunded.</p>
            )}
            {planKind === "pass" && (
              <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Your 7-Day Project Pass ends now. The rest of it isn&apos;t refunded.</p>
            )}
            <p className="mb-4 text-xs text-charcoal/50">Payment records are kept by our payment provider, Stripe, as Australian tax law requires.</p>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-charcoal/80">
              Type DELETE to confirm
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" disabled={busy}
                className="rounded-xl border border-sand-300 px-3 py-2.5 text-base font-normal text-charcoal outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
            </label>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy}
                className="flex-1 rounded-2xl border-2 border-sand-200 py-3 text-sm font-bold text-charcoal/70 hover:border-charcoal/30">Keep my account</button>
              <button type="button" onClick={remove} disabled={busy || typed.trim().toUpperCase() !== "DELETE"}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} {busy ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
