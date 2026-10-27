"use client";

/**
 * ShareReplyPanel — on a shared design (/s/:id), lets the client approve it or
 * ask a question. The reply goes to whoever shared it (see /api/shares/:id/reply).
 */

import { useState } from "react";
import { Check, Loader2, MessageCircleQuestion, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShareOption } from "@/components/share/ShareOptions";

type Kind = "approve" | "question";

/** An approval already on the link, shown to whoever opens it */
export interface ApprovedInfo { firstName: string; at: string; option: string | null }

export default function ShareReplyPanel({ shareId, sharedBy, accent, approved }: { shareId: string; sharedBy: string | null; accent: string; approved?: ApprovedInfo | null }) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");   // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Kind | null>(null);
  const option = useShareOption();   // set when several options were shared
  // trailing full stop dropped so "Coastal Build Co." doesn't end a sentence as "Co.."
  const who = sharedBy?.replace(/\.+$/, "") ?? "the person who sent you this";

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shares/${shareId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, option, name, contact, message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't send that. Please try again.");
      setSent(kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-sand-200 bg-white/80 px-6 py-8 text-center shadow-warm-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: accent }}><Check size={22} /></span>
        <p className="text-lg font-bold text-charcoal">{sent === "approve" ? (option ? `Option ${option} approved. Thanks!` : "Approved. Thanks!") : "Question sent"}</p>
        <p className="max-w-sm text-sm text-charcoal/60">
          {sent === "approve"
            ? <>We&apos;ve let {who} know. Next, they&apos;ll be in touch to confirm the details and your written quote.</>
            : <>We&apos;ve let {who} know. They&apos;ll be in touch soon.</>}
        </p>
      </div>
    );
  }

  const field = "w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-base text-charcoal outline-none placeholder:text-charcoal/30 focus:border-charcoal/40 focus:ring-2 focus:ring-charcoal/10";
  return (
    <div className="rounded-3xl border border-sand-200 bg-white/80 p-5 shadow-warm-sm sm:p-6">
      {approved && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-3.5 text-sm text-emerald-900">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={14} /></span>
          <p>
            <span className="font-bold">{approved.option ? `Option ${approved.option} approved` : "Approved"}</span> by {approved.firstName} on{" "}
            {new Date(approved.at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}.{" "}
            Next, {who} will be in touch to confirm the details and your written quote.
          </p>
        </div>
      )}
      <p className="text-lg font-bold text-charcoal">{approved ? "Anything else?" : "What do you think?"}</p>
      <p className="mt-0.5 text-sm text-charcoal/55">
        {option ? "Pick the option you like above, then approve it or ask a question. " : ""}Your reply goes straight to {who}.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {([["approve", option ? `Approve option ${option}` : "Approve this design", ThumbsUp], ["question", "Ask a question", MessageCircleQuestion]] as const).map(([k, label, Icon]) => (
          <button key={k} type="button" onClick={() => { setKind(k); setError(null); }} aria-pressed={kind === k}
            className={cn("flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-sm font-bold transition-colors",
              kind === k ? "border-transparent text-white" : "border-sand-200 bg-white text-charcoal/75 hover:border-charcoal/20")}
            style={kind === k ? { background: accent } : undefined}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {kind && (
        <form onSubmit={send} className="mt-4 flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="Your name" autoComplete="name" className={field} />
          <input value={contact} onChange={(e) => setContact(e.target.value)} required maxLength={120} placeholder="Email or phone, so they can get back to you" autoComplete="email" className={field} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} required={kind === "question"}
            placeholder={kind === "approve" ? "Anything to add? (optional)" : "Your question, e.g. could we try a lighter floor tile?"}
            className={cn(field, "resize-none")} />
          {/* honeypot: hidden from people, tempting to bots */}
          <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" className="hidden" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-warm-sm transition-opacity hover:opacity-90 disabled:opacity-60" style={{ background: accent }}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {kind === "approve" ? (option ? `Approve option ${option}` : "Send my approval") : "Send my question"}
          </button>
        </form>
      )}
    </div>
  );
}
