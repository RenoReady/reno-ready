"use client";

/** My Account: turn "your design is waiting" reminder emails on or off */

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmailPrefs() {
  const [on, setOn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/email-prefs", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setOn(d ? d.reminders : null)).catch(() => {});
  }, []);

  if (on === null) return null;

  const toggle = async () => {
    const next = !on;
    setOn(next); setSaving(true);
    const ok = (await fetch("/api/email-prefs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reminders: next }) }).catch(() => null))?.ok;
    if (!ok) setOn(!next);
    setSaving(false);
  };

  return (
    <section id="email" className="flex items-center justify-between gap-4 rounded-2xl border border-sand-200 bg-white/70 p-4">
      <div className="flex items-start gap-3">
        <Mail size={18} className="mt-0.5 flex-shrink-0 text-terracotta" />
        <div>
          <p className="text-sm font-bold text-charcoal">Reminders about unfinished designs</p>
          <p className="text-xs text-charcoal/50">If you leave a design for a day or two, we&apos;ll email you a link back to it. At most one a week.</p>
        </div>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label="Reminder emails" onClick={toggle} disabled={saving}
        className={cn("relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-60", on ? "bg-terracotta" : "bg-charcoal/20")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
      </button>
    </section>
  );
}
