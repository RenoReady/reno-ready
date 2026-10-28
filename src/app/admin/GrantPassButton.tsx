"use client";

/** Users table: give this account a free 7-Day Project Pass (survey reward). Asks first. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";

export default function GrantPassButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const give = async () => {
    if (!confirm(`Give ${email} a free 7-Day Project Pass? They'll get an email saying it's active.`)) return;
    setBusy(true);
    const res = await fetch("/api/admin/grant-pass", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { alert(data?.error ?? "Couldn't give the pass."); return; }
    setDone(data.emailed ? "Pass given, emailed" : "Pass given");
    router.refresh();
  };

  if (done) return <span className="text-xs font-semibold text-emerald-700">{done}</span>;
  return (
    <button onClick={give} disabled={busy}
      className="mt-1.5 flex items-center gap-1 rounded-lg border border-sand-200 px-2 py-1 text-[11px] font-bold text-charcoal/60 hover:border-terracotta/40 hover:text-terracotta disabled:opacity-50">
      {busy ? <Loader2 size={11} className="animate-spin" /> : <Gift size={11} />} Give 7-day pass
    </button>
  );
}
