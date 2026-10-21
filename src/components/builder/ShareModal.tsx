"use client";

/**
 * ShareModal — "Share with client" (Reno Ready Pro).
 * Creates a public, unlisted page with the before/after, key finishes and
 * (optionally) the estimate, and hands back a link to send.
 */

import { useEffect, useState } from "react";
import { X, Link2, Copy, Check, Loader2, ExternalLink, Share2 } from "lucide-react";
import { useBuilderStore } from "@/lib/store";
import { shareRows } from "@/lib/shareRows";
import { toJpeg } from "@/lib/watermark";

export default function ShareModal({ estimate, onClose }: { estimate: string | null; onClose: () => void }) {
  const roomType = useBuilderStore((s) => s.roomType);
  const room = roomType[0].toUpperCase() + roomType.slice(1);
  const [title, setTitle] = useState(`${room} renovation concept`);
  const [message, setMessage] = useState("");
  const [withEstimate, setWithEstimate] = useState(!!estimate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // null while checking; false = no report branding yet, so the page would go out unbranded
  const [branded, setBranded] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/brand", { cache: "no-store" }).then((r) => r.json()).then((d) => setBranded(!!d.brand)).catch(() => setBranded(null));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const create = async () => {
    const st = useBuilderStore.getState();
    if (!st.generatedImageUrl) return;
    setBusy(true);
    setError(null);
    try {
      const [after, before] = await Promise.all([
        toJpeg(st.generatedImageUrl, 0.9),
        st.roomPhotoUrl ? toJpeg(st.roomPhotoUrl, 0.88) : Promise.resolve(null),
      ]);
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType: st.roomType, title, message: message || null,
          estimate: withEstimate ? estimate : null, rows: shareRows(), after, before,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Couldn't create the link.");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the link.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2_000); }
    catch { setError("Copy didn't work. Select the link and copy it instead."); }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-warm-xl">
        <div className="flex items-start gap-3 border-b border-sand-100 p-5 sm:p-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta"><Link2 size={18} /></div>
          <div className="flex-1">
            <h2 id="share-title" className="text-lg font-bold text-charcoal">Share with your client</h2>
            <p className="text-sm text-charcoal/55">A private page with your branding, the before/after and the key finishes. Your client can approve it or ask a question, and you&apos;ll see their reply in My Account. No account needed to view it.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-charcoal/40 hover:bg-sand-50 hover:text-charcoal"><X size={18} /></button>
        </div>

        {!url ? (
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-charcoal/80">
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
                className="rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-base font-normal text-charcoal outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-charcoal/80">
              Message to your client <span className="-mt-1 text-xs font-normal text-charcoal/45">Optional</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3}
                placeholder="e.g. Here's option 2 with the darker floor tiles. Let me know what you think."
                className="resize-none rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-base font-normal text-charcoal outline-none placeholder:text-charcoal/30 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20" />
            </label>
            {estimate && (
              <label className="flex items-center gap-2.5 text-sm text-charcoal/75">
                <input type="checkbox" checked={withEstimate} onChange={(e) => setWithEstimate(e.target.checked)} className="h-4 w-4 accent-terracotta" />
                Show the estimate ({estimate})
              </label>
            )}
            {branded === false && (
              <p className="rounded-xl bg-sand-50 px-3.5 py-2.5 text-xs text-charcoal/60">
                Add your logo and contact details under <a href="/account#branding" target="_blank" rel="noopener" className="font-bold text-terracotta hover:underline">Report branding</a> in My Account and they&apos;ll show on the page, including links you&apos;ve already sent.
              </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={create} disabled={busy}
              className="flex items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 text-sm font-bold text-white shadow-warm-sm hover:bg-terracotta/90 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              {busy ? "Creating link…" : "Create share link"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-2 rounded-2xl border border-sand-200 bg-sand-50 p-2 pl-3.5">
              <input readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent text-sm text-charcoal outline-none" />
              <button onClick={copy} className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-charcoal px-3.5 py-2 text-xs font-bold text-white hover:bg-charcoal/90">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={url} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-xl border-2 border-sand-200 px-4 py-2.5 text-sm font-bold text-charcoal/75 hover:border-terracotta/40 hover:text-terracotta">
                <ExternalLink size={15} /> Preview
              </a>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button onClick={() => navigator.share({ title, url }).catch(() => {})}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-sand-200 px-4 py-2.5 text-sm font-bold text-charcoal/75 hover:border-terracotta/40 hover:text-terracotta">
                  <Share2 size={15} /> Send
                </button>
              )}
            </div>
            <p className="text-xs text-charcoal/50">Anyone with the link can view it. Turn it off any time from My Account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
