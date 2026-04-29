"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Share2,
  Download,
  Eye,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { useBuilderStore } from "@/lib/store";
import {
  VANITY_OPTIONS,
  TAPWARE_OPTIONS,
  calcEstimatedCost,
  buildItemisedCosts,
} from "@/lib/types";
import { cn, formatAUD } from "@/lib/utils";


export default function PreviewPage() {
  const router = useRouter();
  const {
    floorTile,
    wallTile,
    vanity,
    tapware,
    budget,
    structuralChanges,
    generatedImageUrl,
    generateDescription,
  } = useBuilderStore();

  const hasImage = !!generatedImageUrl;

  const estimatedCost  = calcEstimatedCost(floorTile, wallTile, vanity, tapware, structuralChanges);
  const low            = Math.round(estimatedCost * 0.88 / 500) * 500;
  const high           = Math.round(estimatedCost * 1.12 / 500) * 500;
  const itemisedCosts  = buildItemisedCosts(floorTile, wallTile, vanity, tapware, structuralChanges);
  const overBudget     = estimatedCost > budget;
  const budgetDelta    = Math.abs(estimatedCost - budget);

  const vanityLabel  = VANITY_OPTIONS.find((v) => v.id === vanity)?.label  ?? vanity;
  const tapwareLabel = TAPWARE_OPTIONS.find((t) => t.id === tapware)?.label ?? tapware;

  const [downloadHover, setDownloadHover] = useState(false);

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      let href = generatedImageUrl;
      if (!generatedImageUrl.startsWith("data:")) {
        const res  = await fetch(generatedImageUrl);
        const blob = await res.blob();
        href = URL.createObjectURL(blob);
      }
      const a = document.createElement("a");
      a.href = href;
      a.download = "My-Reno-Ready-Design.png";
      a.click();
      if (!generatedImageUrl.startsWith("data:")) URL.revokeObjectURL(href);
    } catch {
      alert("Download failed — try right-clicking the image and saving manually.");
    }
  };

  return (
    <div className="min-h-screen bg-sand pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/50 hover:text-charcoal transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Configurator
        </button>

        {/* Page header */}
        <div className="mb-10">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 border",
              hasImage
                ? "bg-terracotta/10 border-terracotta/20"
                : "bg-charcoal/8 border-charcoal/15",
            )}
          >
            {hasImage ? (
              <>
                <Sparkles size={13} className="text-terracotta" />
                <span className="text-xs font-bold text-terracotta tracking-wide">AI Preview Ready</span>
              </>
            ) : (
              <>
                <Eye size={13} className="text-charcoal/70" />
                <span className="text-xs font-bold text-charcoal/70 tracking-wide">Preview Mode</span>
              </>
            )}
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-charcoal">
            {hasImage ? "Your Bathroom Preview" : "Sample Bathroom Preview"}
          </h1>
          <p className="text-charcoal/50 mt-2 text-lg">
            {hasImage
              ? "Here's how your selected style could look — and what it's likely to cost."
              : "This is a sample renovation. Generate your own AI preview from the configurator to see your design here."}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">

          {/* ── LEFT: AI Preview / Sample slider ────────────────── */}
          <div className="flex flex-col gap-6">

            {hasImage ? (
              /* Generated AI image */
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-warm-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedImageUrl!}
                  alt="Your AI-generated bathroom preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-5 left-5">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-bold text-terracotta shadow-warm-sm border border-terracotta/20">
                    AI Generated Preview
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 flex flex-wrap gap-2">
                  {[
                    floorTile && `Floor: ${floorTile.name}`,
                    wallTile  && `Wall: ${wallTile.name}`,
                  ].filter(Boolean).map((label) => (
                    <span
                      key={label as string}
                      className="bg-charcoal/70 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              /* Sample Before/After slider — preview mode */
              <div className="relative">
                <BeforeAfterSlider height={520} />
                {/* Preview Mode badge — top-centre overlay */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="bg-charcoal/85 backdrop-blur-sm rounded-xl px-3.5 py-1.5 flex items-center gap-2 shadow-warm-sm">
                    <Eye size={12} className="text-white/80" />
                    <span className="text-xs font-bold text-white tracking-wide uppercase">
                      Preview Mode · Sample Project
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI description (when present) */}
            {hasImage && generateDescription && (
              <Card variant="flat" padding="md">
                <p className="text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-2">Designer&apos;s Note</p>
                <p className="text-sm text-charcoal/75 leading-relaxed">{generateDescription}</p>
              </Card>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-charcoal/40 text-center">
              {hasImage
                ? "This is a simulated preview for planning purposes. Actual finishes may vary."
                : "Sample renovation shown for reference — actual results depend on your selections and existing room."}
              {" "}Connect with a builder for a detailed quote.
            </p>
          </div>

          {/* ── RIGHT: Cost summary + CTA ────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* ── Hero cost card ─────────────────────────────── */}
            <div className="rounded-3xl bg-charcoal text-white overflow-hidden shadow-warm-xl">

              {/* Total */}
              <div className="px-6 pt-6 pb-5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.25em] mb-1">Estimated Renovation Cost</p>
                <p className="text-5xl font-bold text-white tabular-nums leading-none mb-1">
                  {formatAUD(estimatedCost)}
                </p>
                <p className="text-sm text-white/40">
                  Range&nbsp;
                  <span className="text-white/70 font-semibold tabular-nums">{formatAUD(low)}</span>
                  <span className="mx-1.5 text-white/30">–</span>
                  <span className="text-white/70 font-semibold tabular-nums">{formatAUD(high)}</span>
                </p>
              </div>

              {/* Budget comparison bar */}
              <div className="mx-6 mb-5 p-3.5 rounded-2xl bg-white/8 border border-white/10">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Your budget target</span>
                  <span className={cn(
                    "text-[11px] font-bold px-2 py-0.5 rounded-full",
                    overBudget ? "bg-terracotta/20 text-terracotta" : "bg-emerald-500/20 text-emerald-400",
                  )}>
                    {overBudget ? `+${formatAUD(budgetDelta)} over` : "Within budget ✓"}
                  </span>
                </div>
                {/* Stacked bar: budget vs estimated */}
                <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", overBudget ? "bg-terracotta/60" : "bg-emerald-500/60")}
                    style={{ width: `${Math.min(100, (estimatedCost / Math.max(budget, estimatedCost)) * 100)}%` }}
                  />
                  {/* Budget marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                    style={{ left: `${Math.min(100, (budget / Math.max(budget, estimatedCost)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-white/30">$0</span>
                  <span className="text-[10px] text-white/50 font-semibold tabular-nums">{formatAUD(budget)}</span>
                </div>
              </div>

              <p className="text-center text-[10px] text-white/25 pb-4">Based on Australian market rates, 2026</p>
            </div>

            {/* ── Itemised cost breakdown ─────────────────────── */}
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="px-5 py-4 border-b border-sand-100 flex items-center gap-2">
                <DollarSign size={14} className="text-terracotta" strokeWidth={2.5} />
                <h3 className="text-sm font-bold text-charcoal">Cost Breakdown</h3>
              </div>

              <div className="divide-y divide-sand-100">
                {itemisedCosts.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-charcoal leading-snug">{item.label}</p>
                      {item.detail && (
                        <p className="text-[11px] text-charcoal/40 mt-0.5 leading-tight">{item.detail}</p>
                      )}
                    </div>
                    <p className={cn(
                      "text-[13px] font-bold tabular-nums flex-shrink-0 mt-0.5",
                      item.amount === 0 ? "text-charcoal/30" : item.amount < 0 ? "text-emerald-600" : "text-charcoal",
                    )}>
                      {item.amount > 0 ? "+" : ""}{formatAUD(item.amount)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total row */}
              <div className="flex items-center justify-between px-5 py-4 bg-charcoal/4 border-t-2 border-charcoal/10">
                <span className="text-sm font-bold text-charcoal">Estimated Total</span>
                <span className="text-lg font-bold text-charcoal tabular-nums">{formatAUD(estimatedCost)}</span>
              </div>
            </Card>

            {/* ── Your selections (compact) ───────────────────── */}
            <Card variant="default" padding="md">
              <h3 className="text-sm font-bold text-charcoal mb-3">Your Selections</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Floor",   value: floorTile?.name  ?? "Not selected" },
                  { label: "Wall",    value: wallTile?.name   ?? "Not selected" },
                  { label: "Vanity",  value: vanityLabel },
                  { label: "Tapware", value: tapwareLabel },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-sand-50 border border-sand-200 px-3 py-2.5">
                    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-charcoal leading-tight truncate">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Primary CTA — Connect (always visible) */}
            <Link href="/connect">
              <Button variant="primary" size="lg" fullWidth className="group">
                {hasImage ? "Connect with a Builder" : "Save Selections / Connect"}
                <ArrowRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => router.push("/builder")}
              >
                <ArrowLeft size={16} className="mr-1" /> Edit Design
              </Button>

              {/* Download with tooltip when disabled */}
              <div
                className="relative flex-1"
                onMouseEnter={() => setDownloadHover(true)}
                onMouseLeave={() => setDownloadHover(false)}
              >
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  disabled={!hasImage}
                  onClick={handleDownload}
                  aria-label={hasImage ? "Download AI image" : "Generate to download"}
                >
                  <Download size={16} className="mr-1" /> Download
                </Button>
                {!hasImage && downloadHover && (
                  <div
                    role="tooltip"
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-3 py-1.5 rounded-lg bg-charcoal text-white text-xs font-semibold shadow-warm-lg pointer-events-none"
                  >
                    Generate to Download
                    <span
                      className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-charcoal"
                    />
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "My Reno Ready Design", url: window.location.href });
                  }
                }}
              >
                <Share2 size={16} className="mr-1" /> Share
              </Button>
            </div>

            {/* Trust note */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-terracotta/5 border border-terracotta/15">
              <CheckCircle2 size={16} className="text-terracotta mt-0.5 flex-shrink-0" />
              <p className="text-xs text-charcoal/60 leading-relaxed">
                All builders in our network are licensed and insured. Your details are only shared with builders you explicitly choose to contact.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
