"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "@/app/actions/leads";
import type { LeadStatus } from "@/lib/leadStore";
import { cn } from "@/lib/utils";

const OPTIONS: { value: LeadStatus; label: string; tone: string }[] = [
  { value: "new",       label: "New",       tone: "bg-terracotta/15 text-terracotta border-terracotta/30" },
  { value: "contacted", label: "Contacted", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "quoted",    label: "Quoted",    tone: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "won",       label: "Won",       tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "lost",      label: "Lost",      tone: "bg-charcoal/5 text-charcoal/50 border-charcoal/15" },
];

export default function LeadStatusSelect({ id, status }: { id: string; status: LeadStatus }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const tone = OPTIONS.find((o) => o.value === value)?.tone;

  return (
    <select
      aria-label="Lead status"
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as LeadStatus, prev = value;
        setValue(next); setFailed(false);
        start(async () => {
          const r = await updateLeadStatus(id, next);
          if (!r.ok) { setValue(prev); setFailed(true); }
        });
      }}
      className={cn("rounded-lg border px-2 py-1 text-xs font-bold outline-none", tone, pending && "opacity-60", failed && "ring-2 ring-red-300")}
    >
      {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
