"use client";

/**
 * "Email it to me": after a signed-out preview, an alternative to signing in.
 * Sends the watermarked design to their inbox (/api/email-design) and keeps
 * their email as a lead, which the line under the form tells them about.
 */

import { useState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useBuilderStore } from "@/lib/store";
import { toJpeg, watermarkImage } from "@/lib/watermark";

export default function EmailDesign({ estimate }: { estimate: string | null }) {
  const [open,  setOpen]  = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 size={16} /> Sent! Check your inbox (and junk folder, just in case).
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 self-start text-sm font-semibold text-charcoal/60 underline underline-offset-2 hover:text-terracotta">
        <Mail size={14} /> Not ready to sign in? Email it to me
      </button>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = useBuilderStore.getState();
    if (!st.generatedImageUrl) return;
    setError(null);
    setState("sending");
    try {
      const image = await toJpeg(await watermarkImage(st.generatedImageUrl), 0.85, 1280);
      const res = await fetch("/api/email-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, image, room: st.roomType, estimate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error ?? "We couldn't send that just now. Please try again.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send that just now. Please try again.");
      setState("idle");
    }
  };

  return (
    <form onSubmit={send} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email" aria-label="Your email"
          className="min-w-0 flex-1 rounded-xl border-2 border-sand-200 bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-terracotta/60"
        />
        <button type="submit" disabled={state === "sending"}
          className="flex items-center justify-center gap-2 rounded-xl bg-charcoal px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-charcoal/90 disabled:opacity-60">
          {state === "sending" ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Email my design
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <p className="text-xs text-charcoal/45">
        We&apos;ll email your design, then follow up once or twice about it. Unsubscribe anytime.
      </p>
    </form>
  );
}
