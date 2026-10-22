"use client";

/**
 * BrandForm — Reno Ready Pro report branding (My Account).
 * Business details, logo and accent colour, with a live preview of the PDF
 * header. Saved through /api/brand.
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, Trash2, Check, Palette } from "lucide-react";
import type { ReportBrand } from "@/lib/generateProReportPDF";

const FIELDS: { key: keyof Omit<ReportBrand, "logo" | "accent">; label: string; placeholder: string; type?: string }[] = [
  { key: "businessName", label: "Business name", placeholder: "e.g. Coastal Renovations" },
  { key: "phone",        label: "Phone",         placeholder: "e.g. 0400 000 000", type: "tel" },
  { key: "email",        label: "Email",         placeholder: "e.g. hello@coastalreno.com.au", type: "email" },
  { key: "website",      label: "Website",       placeholder: "e.g. coastalreno.com.au" },
  { key: "licence",      label: "Licence or ABN", placeholder: "e.g. QBCC 1234567" },
];

const DEFAULT_ACCENT = "#D27D5E";

export default function BrandForm({ onSaved }: { onSaved?: () => void } = {}) {
  const [brand, setBrand]   = useState<ReportBrand>({ businessName: "", accent: DEFAULT_ACCENT, logo: null });
  const [logoChanged, setLogoChanged] = useState(false);
  const [state, setState]   = useState<"loading" | "idle" | "saving" | "saved">("loading");
  const [error, setError]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/brand", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.brand) setBrand({ accent: DEFAULT_ACCENT, ...d.brand }); })
      .finally(() => setState("idle"));
  }, []);

  const set = (patch: Partial<ReportBrand>) => { setBrand((b) => ({ ...b, ...patch })); if (state === "saved") setState("idle"); };

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3_000_000) { setError("That logo is over 3 MB. Try a smaller file."); return; }
    const reader = new FileReader();
    reader.onload = () => { set({ logo: reader.result as string }); setLogoChanged(true); setError(null); };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setState("saving"); setError(null);
    const res = await fetch("/api/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...brand, ...(logoChanged ? { logo: brand.logo ?? null } : { logo: undefined }) }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) { setError(data?.error ?? "Couldn't save. Please try again."); setState("idle"); return; }
    setLogoChanged(false);
    setState("saved");
    onSaved?.();
  };

  if (state === "loading") return <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-sand-300"><Loader2 className="animate-spin text-charcoal/30" /></div>;

  const accent = brand.accent ?? DEFAULT_ACCENT;

  return (
    <div className="grid gap-5 rounded-3xl border border-sand-200 bg-white/80 p-5 shadow-warm-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3.5">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-xs font-semibold text-charcoal/70">
            {f.label}{f.key === "businessName" && <span className="sr-only"> (required)</span>}
            <input type={f.type ?? "text"} value={(brand[f.key] as string | null | undefined) ?? ""} placeholder={f.placeholder}
              onChange={(e) => set({ [f.key]: e.target.value } as Partial<ReportBrand>)}
              className="rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-base font-normal text-charcoal outline-none placeholder:text-charcoal/30 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 sm:text-sm" />
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold text-charcoal/70">Logo</p>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-sand-300 bg-white p-2">
              {brand.logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={brand.logo} alt="Your logo" className="max-h-full max-w-full object-contain" />
                : <span className="text-[11px] text-charcoal/35">No logo yet</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-bold text-charcoal/70 hover:border-terracotta/50 hover:text-terracotta">
                <Upload size={13} /> {brand.logo ? "Replace" : "Upload"}
              </button>
              {brand.logo && (
                <button type="button" onClick={() => { set({ logo: null }); setLogoChanged(true); }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-charcoal/45 hover:text-red-500">
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
              onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <p className="mt-1.5 text-[11px] text-charcoal/40">PNG with a transparent background looks best.</p>
        </div>

        <label className="flex items-center gap-3 text-xs font-semibold text-charcoal/70">
          <Palette size={15} className="text-charcoal/40" /> Accent colour
          <input type="color" value={accent} onChange={(e) => set({ accent: e.target.value })} className="h-8 w-12 cursor-pointer rounded border border-sand-300 bg-white" />
          <span className="font-mono text-[11px] text-charcoal/45">{accent.toUpperCase()}</span>
        </label>

        {/* Live preview of the report header */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-charcoal/70">Report preview</p>
          <div className="overflow-hidden rounded-xl border border-sand-200 bg-white shadow-warm-sm">
            <div className="flex h-12 items-center justify-between px-3" style={{ borderBottom: `3px solid ${accent}` }}>
              {brand.logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={brand.logo} alt="" className="max-h-8 max-w-[45%] object-contain" />
                : <span className="truncate text-sm font-bold text-charcoal">{brand.businessName || "Your business"}</span>}
              <span className="text-[9px] font-semibold uppercase tracking-wider text-charcoal/40">Bathroom design preview report</span>
            </div>
            <div className="px-3 py-3">
              <p className="flex items-center gap-2 text-sm font-bold text-charcoal"><span className="h-3.5 w-1.5 rounded-sm" style={{ background: accent }} /> Your Bathroom Design Preview</p>
              <p className="mt-0.5 text-[10px] text-charcoal/45">Prepared by {brand.businessName || "your business"} for your client</p>
              <p className="mt-0.5 text-[10px] text-charcoal/45">{[brand.phone, brand.email, brand.website, brand.licence].filter(Boolean).join(" · ") || "Your contact details"}</p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="button" onClick={save} disabled={state === "saving" || !brand.businessName.trim()}
          className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-terracotta py-3 text-sm font-bold text-white shadow-warm-sm hover:bg-terracotta/90 disabled:opacity-50">
          {state === "saving" ? <Loader2 size={15} className="animate-spin" /> : state === "saved" ? <Check size={15} /> : null}
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save branding"}
        </button>
      </div>
    </div>
  );
}
