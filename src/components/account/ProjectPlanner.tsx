"use client";

/**
 * ProjectPlanner — the whole-home project on My Account.
 *
 * Every priced room (a draft with an AI preview) can be ticked in or out;
 * the total and ±12% range add up the ticked rooms. Reno Ready Pro can
 * download them all as one multi-room PDF report (with their branding).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Lock, FileText, Loader2, Bath, ChefHat, BedDouble, Plus } from "lucide-react";
import { setDraftInProject, fetchAccountDraft, type DraftSummary } from "@/lib/drafts";
import { estimateFromSnapshot } from "@/lib/projectEstimate";
import { designRows } from "@/lib/shareRows";
import type { ReportBrand, ProjectRoomInput } from "@/lib/generateProReportPDF";
import type { RoomType } from "@/lib/roomTypes";
import { cn, formatAUD } from "@/lib/utils";

const ROOM_ICON: Record<RoomType, typeof Bath> = { bathroom: Bath, kitchen: ChefHat, bedroom: BedDouble };

export default function ProjectPlanner({ drafts, isPro, onChange, onUpgrade }: {
  drafts: DraftSummary[];
  isPro: boolean;
  onChange: (drafts: DraftSummary[]) => void;
  onUpgrade: () => void;
}) {
  const priced = drafts.filter((d) => d.hasRender && d.estimateTotal);
  const unpriced = drafts.filter((d) => !d.hasRender);
  const included = priced.filter((d) => d.inProject);
  const total = included.reduce((n, d) => n + (d.estimateTotal ?? 0), 0);
  const low = included.reduce((n, d) => n + (d.estimateLow ?? d.estimateTotal ?? 0), 0);
  const high = included.reduce((n, d) => n + (d.estimateHigh ?? d.estimateTotal ?? 0), 0);

  const [brand, setBrand] = useState<ReportBrand | null>(null);
  const [preparedFor, setPreparedFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPro) return;
    fetch("/api/brand", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setBrand(d?.brand ?? null)).catch(() => {});
  }, [isPro]);

  const toggle = async (d: DraftSummary) => {
    const next = !d.inProject;
    onChange(drafts.map((x) => (x.id === d.id ? { ...x, inProject: next } : x)));
    if (!(await setDraftInProject(d.id, next))) onChange(drafts);   // put it back if saving failed
  };

  const download = async () => {
    if (!isPro) { onUpgrade(); return; }
    setBusy(true); setError(null);
    try {
      const full = await Promise.all(included.map((d) => fetchAccountDraft(d.id)));
      const rooms: ProjectRoomInput[] = full.flatMap((f, i) => {
        if (!f) return [];
        const est = estimateFromSnapshot(f.roomType, f.snapshot);
        if (!est) return [];
        return [{
          title: included[i].title, roomType: f.roomType, renderUrl: f.render, photoUrl: f.photo,
          rows: designRows({ ...f.snapshot, roomType: f.roomType }), estimate: est,
        }];
      });
      if (!rooms.length) throw new Error("No rooms could be loaded.");
      const { generateProjectReportPDF } = await import("@/lib/generateProReportPDF");
      await generateProjectReportPDF({ rooms, brand, preparedFor: preparedFor.trim() || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't build the report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="project" className="scroll-mt-32">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal"><Home size={18} className="text-terracotta" /> Whole-home project</h2>
        <p className="text-sm text-charcoal/50">Tick the rooms you&apos;re renovating to see what the whole project comes to.</p>
      </div>

      {priced.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white/40 px-6 py-8 text-center text-sm text-charcoal/50">
          Generate a preview of each room you&apos;re planning and they&apos;ll add up here.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex flex-col divide-y divide-sand-100 overflow-hidden rounded-2xl border border-sand-200 bg-white/80">
            {priced.map((d) => {
              const Icon = ROOM_ICON[d.roomType];
              return (
                <label key={d.id} className={cn("flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-sand-50", !d.inProject && "opacity-60")}>
                  <input type="checkbox" checked={d.inProject} onChange={() => toggle(d)} className="h-4 w-4 flex-shrink-0 accent-terracotta" />
                  {d.thumbUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={d.thumbUrl} alt="" className="h-11 w-14 flex-shrink-0 rounded-lg object-cover" />
                    : <div className="flex h-11 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-sand-100"><Icon size={16} className="text-charcoal/30" /></div>}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-charcoal"><Icon size={14} className="flex-shrink-0 text-terracotta" /> {d.title}</p>
                    <p className="text-xs capitalize text-charcoal/45">{d.roomType}</p>
                  </div>
                  <p className="flex-shrink-0 text-sm font-bold tabular-nums text-charcoal">{formatAUD(d.estimateTotal ?? 0)}</p>
                </label>
              );
            })}
            {unpriced.length > 0 && (
              <p className="p-3 text-xs text-charcoal/45">
                {unpriced.length} more draft{unpriced.length === 1 ? "" : "s"} without an AI preview yet. Generate a preview to price {unpriced.length === 1 ? "it" : "them"}.
              </p>
            )}
            <Link href="/builder" className="flex items-center gap-2 p-3 text-xs font-bold text-terracotta hover:bg-terracotta/5">
              <Plus size={14} /> Add another room
            </Link>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-charcoal p-5 text-white shadow-warm-lg">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">Estimated project total</p>
              <p className="mt-1 text-4xl font-bold tabular-nums">{formatAUD(total)}</p>
              <p className="mt-1 text-xs text-white/50">
                {included.length} room{included.length === 1 ? "" : "s"}{included.length ? ` · range ${formatAUD(low)} – ${formatAUD(high)}` : ""}
              </p>
            </div>
            <p className="text-[11px] leading-snug text-white/40">Indicative, based on Australian market rates. Each room uses the same estimate you see in the designer.</p>

            {isPro && brand && (
              <input value={preparedFor} onChange={(e) => setPreparedFor(e.target.value)} maxLength={60} placeholder="Prepared for (client name, optional)"
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-base text-white outline-none placeholder:text-white/35 focus:border-white/40 sm:text-sm" />
            )}
            <button type="button" onClick={download} disabled={busy || included.length === 0}
              className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-charcoal hover:bg-sand-50 disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : isPro ? <FileText size={15} /> : <Lock size={14} />}
              {busy ? "Building report…" : "Download whole-home report"}
              {!isPro && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Pro</span>}
            </button>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
