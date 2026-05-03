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
  FileText,
  Loader2,
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
import {
  calcBriefCostItems,
  calcBriefTotal,
  needsAsbestosCheck,
} from "@/lib/projectBrief";
import {
  calcKitchenCost,
  calcBedroomCost,
} from "@/lib/roomTypes";
import { cn, formatAUD } from "@/lib/utils";
import { TriangleAlert } from "lucide-react";


export default function PreviewPage() {
  const router = useRouter();
  const {
    roomType,
    kitchenSelections,
    bedroomSelections,
    floorTile,
    wallTile,
    vanity,
    tapware,
    budget,
    structuralChanges,
    bathroomSize,
    customLength,
    customWidth,
    projectBrief,
    generatedImageUrl,
    generateDescription,
    roomPhotoUrl,
    customNote,
    customFloorColor,
    customWallColor,
    tileStyle,
    lightingOption,
    useCustomDimensions,
  } = useBuilderStore();

  const hasImage = !!generatedImageUrl;

  // ── Room-aware cost engine ──────────────────────────────────────────────────
  let estimatedCost: number;
  let baseItemisedCosts: { label: string; detail?: string; amount: number }[];

  if (roomType === "kitchen") {
    const result  = calcKitchenCost(kitchenSelections);
    estimatedCost = Math.round(result.total / 500) * 500;
    baseItemisedCosts = result.items;
  } else if (roomType === "bedroom") {
    const result  = calcBedroomCost(bedroomSelections);
    estimatedCost = Math.round(result.total / 500) * 500;
    baseItemisedCosts = result.items;
  } else {
    // Bathroom
    estimatedCost     = calcEstimatedCost(floorTile, wallTile, vanity, tapware, structuralChanges, 0, bathroomSize, customLength, customWidth, lightingOption);
    baseItemisedCosts = buildItemisedCosts(floorTile, wallTile, vanity, tapware, structuralChanges, 0, bathroomSize, customLength, customWidth, lightingOption);
  }

  const low  = Math.round(estimatedCost * 0.88 / 500) * 500;
  const high = Math.round(estimatedCost * 1.12 / 500) * 500;

  // Brief-driven verified items (bathroom only — brief not used for kitchen/bedroom)
  const briefItems  = projectBrief ? calcBriefCostItems(projectBrief) : [];
  const briefTotal  = projectBrief ? calcBriefTotal(projectBrief)     : 0;
  const grandTotal  = estimatedCost + briefTotal;

  const overBudget  = grandTotal > budget;
  const budgetDelta = Math.abs(grandTotal - budget);

  const vanityLabel  = VANITY_OPTIONS.find((v) => v.id === vanity)?.label  ?? vanity;
  const tapwareLabel = TAPWARE_OPTIONS.find((t) => t.id === tapware)?.label ?? tapware;

  // Room-specific page title
  const roomLabel =
    roomType === "kitchen" ? "Kitchen"
    : roomType === "bedroom" ? "Bedroom"
    : "Bathroom";

  const [downloadHover, setDownloadHover] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    try {
      const { generateProReportPDF } = await import("@/lib/generateProReportPDF");
      const briefTotalForPDF = projectBrief ? calcBriefTotal(projectBrief) : 0;
      await generateProReportPDF({
        selections: {
          roomPhotoUrl,
          floorTile,
          wallTile,
          vanity,
          tapware,
          budget,
          customNote,
          customFloorColor,
          customWallColor,
          tileStyle,
          structuralChanges,
          projectBrief,
          lightingOption,
          bathroomSize,
          useCustomDimensions,
          customLength,
          customWidth,
          generatedImageUrl,
          generateDescription,
        },
        projectBrief,
        generatedImageUrl,
        roomPhotoUrl,
        grandTotal:    estimatedCost + briefTotalForPDF,
        estimatedCost: estimatedCost,
        roomType,
        kitchenSelections,
        bedroomSelections,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
            {hasImage ? `Your ${roomLabel} Preview` : `Sample ${roomLabel} Preview`}
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
                  alt={`Your AI-generated ${roomLabel.toLowerCase()} preview`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-5 left-5">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-bold text-terracotta shadow-warm-sm border border-terracotta/20">
                    AI Generated Preview
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 flex flex-wrap gap-2">
                  {roomType === "bathroom" && [
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
                  {roomType === "kitchen" && kitchenSelections.cabinetry && (
                    <span className="bg-charcoal/70 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-xs font-semibold">
                      Cabinetry: {kitchenSelections.cabinetry}
                    </span>
                  )}
                  {roomType === "bedroom" && bedroomSelections.flooring && (
                    <span className="bg-charcoal/70 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-xs font-semibold">
                      Flooring: {bedroomSelections.flooring}
                    </span>
                  )}
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
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.25em] mb-1">
                  {projectBrief ? "All-in Estimated Cost" : "Estimated Renovation Cost"}
                </p>
                <p className="text-5xl font-bold text-white tabular-nums leading-none mb-1">
                  {formatAUD(projectBrief ? Math.round(grandTotal / 500) * 500 : estimatedCost)}
                </p>
                <p className="text-sm text-white/40">
                  Range&nbsp;
                  <span className="text-white/70 font-semibold tabular-nums">
                    {formatAUD(Math.round((low + briefTotal) / 500) * 500)}
                  </span>
                  <span className="mx-1.5 text-white/30">–</span>
                  <span className="text-white/70 font-semibold tabular-nums">
                    {formatAUD(Math.round((high + briefTotal) / 500) * 500)}
                  </span>
                </p>
                {projectBrief && (
                  <p className="text-[10px] text-white/30 mt-1.5">
                    Includes base reno + verified supply &amp; install costs
                    {needsAsbestosCheck(projectBrief) && " · ⚠ Asbestos removal included"}
                  </p>
                )}
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
                {/* Stacked bar: budget vs grand total */}
                <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", overBudget ? "bg-terracotta/60" : "bg-emerald-500/60")}
                    style={{ width: `${Math.min(100, (grandTotal / Math.max(budget, grandTotal)) * 100)}%` }}
                  />
                  {/* Budget marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                    style={{ left: `${Math.min(100, (budget / Math.max(budget, grandTotal)) * 100)}%` }}
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

              {/* Base renovation items */}
              <div className="divide-y divide-sand-100">
                {baseItemisedCosts.map((item, i) => (
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

              {/* Brief-driven verified cost items */}
              {briefItems.length > 0 && (
                <>
                  <div className="px-5 py-2.5 bg-sand-50 border-y border-sand-200">
                    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">
                      Verified Cost Items · From real QLD invoices
                    </p>
                  </div>
                  <div className="divide-y divide-sand-100">
                    {briefItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {item.warning && (
                              <TriangleAlert size={11} className="text-amber-500 flex-shrink-0" strokeWidth={2.5} />
                            )}
                            <p className={cn(
                              "text-[13px] font-semibold leading-snug",
                              item.warning ? "text-amber-700" : "text-charcoal",
                            )}>
                              {item.label}
                            </p>
                          </div>
                          {item.detail && (
                            <p className="text-[11px] text-charcoal/40 mt-0.5 leading-tight">{item.detail}</p>
                          )}
                          {item.source && (
                            <p className="text-[10px] text-charcoal/30 mt-0.5 leading-tight italic">{item.source}</p>
                          )}
                        </div>
                        <p className={cn(
                          "text-[13px] font-bold tabular-nums flex-shrink-0 mt-0.5",
                          item.warning ? "text-amber-700" : "text-charcoal",
                        )}>
                          +{formatAUD(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Total row */}
              <div className="flex items-center justify-between px-5 py-4 bg-charcoal/4 border-t-2 border-charcoal/10">
                <span className="text-sm font-bold text-charcoal">
                  {projectBrief ? "All-in Estimated Total" : "Estimated Total"}
                </span>
                <span className="text-lg font-bold text-charcoal tabular-nums">
                  {formatAUD(projectBrief ? Math.round(grandTotal / 500) * 500 : estimatedCost)}
                </span>
              </div>
            </Card>

            {/* ── Your selections (compact) ───────────────────── */}
            <Card variant="default" padding="md">
              <h3 className="text-sm font-bold text-charcoal mb-3">Your Selections</h3>
              <div className="grid grid-cols-2 gap-2">
                {(
                  roomType === "kitchen" ? [
                    { label: "Cabinetry",  value: kitchenSelections.cabinetry  ?? "Not selected" },
                    { label: "Benchtop",   value: kitchenSelections.benchtop   ?? "Not selected" },
                    { label: "Splashback", value: kitchenSelections.splashback ?? "Not selected" },
                    { label: "Cooktop",    value: kitchenSelections.cooktop },
                  ] : roomType === "bedroom" ? [
                    { label: "Flooring",  value: bedroomSelections.flooring      ?? "Not selected" },
                    { label: "Wall",      value: bedroomSelections.wallTreatment ?? "Not selected" },
                    { label: "Lighting",  value: bedroomSelections.lighting      ?? "Not selected" },
                    { label: "Storage",   value: bedroomSelections.storage       ?? "Not selected" },
                  ] : [
                    { label: "Floor",   value: floorTile?.name ?? "Not selected" },
                    { label: "Wall",    value: wallTile?.name  ?? "Not selected" },
                    { label: "Vanity",  value: vanityLabel },
                    { label: "Tapware", value: tapwareLabel },
                  ]
                ).map(({ label, value }) => (
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
                {hasImage ? `Connect with a Builder` : "Save Selections / Connect"}
                <ArrowRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {/* Pro Report PDF download */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl",
                "border-2 border-charcoal/15 bg-charcoal/3 text-sm font-bold text-charcoal",
                "hover:border-charcoal/30 hover:bg-charcoal/6 transition-all duration-200",
                isGeneratingPDF && "opacity-60 cursor-not-allowed",
              )}
            >
              {isGeneratingPDF
                ? <><Loader2 size={16} className="animate-spin" /> Generating PDF…</>
                : <><FileText size={16} /> Download Pro Report <span className="text-charcoal/40 font-normal text-xs">(PDF · A4)</span></>
              }
            </button>

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
