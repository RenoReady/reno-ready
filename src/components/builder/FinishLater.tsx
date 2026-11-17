"use client";

/**
 * Step 1: "Not ready? Email me a link to finish later." For people who don't
 * have a photo handy right now: emails them a link back to Step 1 of this
 * room (/api/email-later) and keeps their email as a lead, which the line
 * under the form tells them about.
 */

import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import type { RoomType } from "@/lib/roomTypes";
import { suggestEmail } from "@/lib/emailCheck";

export default function FinishLater({ room }: { room: RoomType }) {
  const [open,  setOpen]  = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  if (state === "sent") {
    return (
      <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 size={16} /> Sent to {sentTo}! Open it on your phone when you&apos;re ready.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 self-center text-sm font-semibold text-charcoal/60 underline underline-offset-2 hover:text-terracotta">
        <Mail size={14} /> Not ready? Email me a link to finish later
      </button>
    );
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const fix = suggestEmail(email.trim());
    if (fix) { setSuggestion(fix); return; }   // ask before sending to a likely typo
    void deliver(email);
  };

  const deliver = async (to: string) => {
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/email-later", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: to.trim(), room }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error ?? "We couldn't send that just now. Please try again.");
      setSentTo(to.trim());
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send that just now. Please try again.");
      setState("idle");
    }
  };

  return (
    <form onSubmit={send} className="flex flex-col gap-2 rounded-2xl border-2 border-sand-200 bg-white/70 p-3">
      <p className="text-sm font-semibold text-charcoal">We&apos;ll email you a link back to this step.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setSuggestion(null); }}
          placeholder="you@example.com" autoComplete="email" aria-label="Your email"
          className="min-w-0 flex-1 rounded-xl border-2 border-sand-200 bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-terracotta/60"
        />
        <button type="submit" disabled={state === "sending"}
          className="flex items-center justify-center gap-2 rounded-xl bg-charcoal px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-charcoal/90 disabled:opacity-60">
          {state === "sending" ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Email me the link
        </button>
      </div>
      {suggestion && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal/70">
          Did you mean <strong className="text-charcoal">{suggestion}</strong>?
          <button type="button" onClick={() => { setEmail(suggestion); setSuggestion(null); void deliver(suggestion); }}
            className="font-bold text-terracotta underline underline-offset-2">Yes, use that</button>
          <button type="button" onClick={() => { setSuggestion(null); void deliver(email); }}
            className="font-semibold text-charcoal/50 underline underline-offset-2">No, mine is right</button>
        </p>
      )}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <p className="text-xs text-charcoal/45">We may follow up once or twice about your design. Unsubscribe anytime.</p>
    </form>
  );
}
