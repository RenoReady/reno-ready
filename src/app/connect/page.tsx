"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Droplets,
  DollarSign,
  Wrench,
  ImageOff,
  Info,
  Ruler,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
import Card from "@/components/ui/Card";
import { useBuilderStore } from "@/lib/store";
import {
  VANITY_OPTIONS,
  TAPWARE_OPTIONS,
  TILE_STYLE_OPTIONS,
  calcEstimatedCost,
  buildItemisedCosts,
  getBathroomBaseCost,
} from "@/lib/types";
import {
  calcKitchenCost,
  calcBedroomCost,
  CABINETRY_OPTIONS,
  BENCHTOP_OPTIONS,
  SPLASHBACK_OPTIONS,
  MIXER_OPTIONS,
  BEDROOM_FLOORING_OPTIONS,
  WALL_TREATMENT_OPTIONS,
  BEDROOM_LIGHTING_OPTIONS,
  STORAGE_OPTIONS,
  WINDOW_TREATMENT_OPTIONS,
  KITCHEN_SIZE_OPTIONS,
  BEDROOM_SIZE_OPTIONS,
} from "@/lib/roomTypes";
import { buildGeminiPrompt } from "@/lib/buildPrompt";
import { submitConnectForm } from "@/app/actions/contact";
import { cn, formatAUD } from "@/lib/utils";

interface FormState {
  name:    string;
  email:   string;
  phone:   string;
  message: string;
}

interface FormErrors {
  name?:  string;
  email?: string;
  phone?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim())   errors.name  = "Your name is required.";
  if (!form.email.trim())  errors.email = "Your email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                           errors.email = "Please enter a valid email.";
  if (form.phone && !/^[\d\s()+\-]{8,}$/.test(form.phone))
                           errors.phone = "Please enter a valid phone number.";
  return errors;
}

// ── Trust badge ───────────────────────────────────────────────
function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-charcoal/60">
      <CheckCircle2 size={15} className="text-terracotta flex-shrink-0" />
      {children}
    </div>
  );
}

export default function ConnectPage() {
  const router = useRouter();
  const {
    roomType,
    kitchenSelections,
    bedroomSelections,
    floorTile, wallTile,
    customFloorColor, customWallColor,
    tileStyle,
    vanity, tapware, budget,
    structuralChanges,
    customNote,
    generatedImageUrl,
    roomPhotoUrl,
    bathroomSize, customLength, customWidth,
    projectBrief,
    lightingOption,
    useCustomDimensions,
    generateDescription,
  } = useBuilderStore();

  const hasGeneratedImage = !!generatedImageUrl;

  const vanityLabel  = vanity  ? (VANITY_OPTIONS.find((v)  => v.id === vanity)?.label  ?? vanity)  : "Not selected";
  const tapwareLabel = tapware ? (TAPWARE_OPTIONS.find((t) => t.id === tapware)?.label ?? tapware) : "Not selected";
  const tileStyleLabel = tileStyle
    ? TILE_STYLE_OPTIONS.find((s) => s.id === tileStyle)?.label ?? tileStyle
    : null;

  // ── Room-aware cost engine ────────────────────────────────────────────────
  const { estimatedCost, itemisedCosts } = useMemo(() => {
    if (roomType === "kitchen") {
      const r = calcKitchenCost(kitchenSelections);
      return { estimatedCost: Math.round(r.total / 500) * 500, itemisedCosts: r.items };
    }
    if (roomType === "bedroom") {
      const r = calcBedroomCost(bedroomSelections);
      return { estimatedCost: Math.round(r.total / 500) * 500, itemisedCosts: r.items };
    }
    // Bathroom
    const baseCost = getBathroomBaseCost(bathroomSize ?? "medium", customLength, customWidth);
    return {
      estimatedCost: calcEstimatedCost(floorTile, wallTile, vanity ?? "floating", tapware ?? "chrome", structuralChanges, baseCost),
      itemisedCosts: buildItemisedCosts(floorTile, wallTile, vanity ?? "floating", tapware ?? "chrome", structuralChanges, baseCost),
    };
  }, [roomType, kitchenSelections, bedroomSelections, floorTile, wallTile, vanity, tapware, structuralChanges, bathroomSize, customLength, customWidth]);

  // Build the raw AI prompt that would be (or was) sent to Gemini
  const aiPrompt = useMemo(() => buildGeminiPrompt({
    imageBase64:       roomPhotoUrl,
    roomType,
    kitchenSelections,
    bedroomSelections,
    selections: {
      floorTile, wallTile,
      vanity:  vanity  ?? "floating",
      tapware: tapware ?? "chrome",
      customNote, customFloorColor, customWallColor,
      tileStyle, structuralChanges,
    },
  }), [
    roomPhotoUrl, roomType, kitchenSelections, bedroomSelections,
    floorTile, wallTile, vanity, tapware,
    customNote, customFloorColor, customWallColor, tileStyle, structuralChanges,
  ]);

  // ── Room-aware selection rows for "What gets sent" ───────────────────────
  const selectionRows = useMemo(() => {
    if (roomType === "kitchen") {
      const cabinet  = kitchenSelections.cabinetry  ? CABINETRY_OPTIONS.find((o)  => o.id === kitchenSelections.cabinetry)?.label  ?? kitchenSelections.cabinetry  : null;
      const benchtop = kitchenSelections.benchtop   ? BENCHTOP_OPTIONS.find((o)   => o.id === kitchenSelections.benchtop)?.label   ?? kitchenSelections.benchtop   : null;
      const splash   = kitchenSelections.splashback ? SPLASHBACK_OPTIONS.find((o) => o.id === kitchenSelections.splashback)?.label ?? kitchenSelections.splashback : null;
      const mixer    = kitchenSelections.mixer      ? MIXER_OPTIONS.find((o)      => o.id === kitchenSelections.mixer)?.label      ?? kitchenSelections.mixer      : null;
      const sizeOpt  = KITCHEN_SIZE_OPTIONS.find((o) => o.id === kitchenSelections.roomSize);
      const sizeLabel = kitchenSelections.roomSize === "custom" && kitchenSelections.customLength > 0 && kitchenSelections.customWidth > 0
        ? `${kitchenSelections.customLength}m × ${kitchenSelections.customWidth}m custom`
        : sizeOpt?.label ?? kitchenSelections.roomSize;
      return [
        { label: "Kitchen Size",  value: sizeLabel },
        { label: "Cabinetry",     value: cabinet  ?? "Not selected" },
        { label: "Benchtop",      value: benchtop ?? "Not selected" },
        { label: "Splashback",    value: splash   ?? "Not selected" },
        { label: "Mixer",         value: mixer    ?? "Not selected" },
        { label: "Cooktop",       value: kitchenSelections.cooktop === "induction" ? "Induction" : "Gas" },
        { label: "Dishwasher",    value: kitchenSelections.dishwasher === "integrated" ? "Integrated" : "Freestanding" },
      ];
    }
    if (roomType === "bedroom") {
      const flooring = bedroomSelections.flooring       ? BEDROOM_FLOORING_OPTIONS.find((o)  => o.id === bedroomSelections.flooring)?.label       ?? bedroomSelections.flooring       : null;
      const wall_    = bedroomSelections.wallTreatment  ? WALL_TREATMENT_OPTIONS.find((o)    => o.id === bedroomSelections.wallTreatment)?.label   ?? bedroomSelections.wallTreatment  : null;
      const light    = bedroomSelections.lighting       ? BEDROOM_LIGHTING_OPTIONS.find((o)  => o.id === bedroomSelections.lighting)?.label        ?? bedroomSelections.lighting       : null;
      const storage  = bedroomSelections.storage        ? STORAGE_OPTIONS.find((o)           => o.id === bedroomSelections.storage)?.label         ?? bedroomSelections.storage        : null;
      const window_  = bedroomSelections.windowTreatment ? WINDOW_TREATMENT_OPTIONS.find((o) => o.id === bedroomSelections.windowTreatment)?.label ?? bedroomSelections.windowTreatment : null;
      const sizeOpt  = BEDROOM_SIZE_OPTIONS.find((o) => o.id === bedroomSelections.roomSize);
      const sizeLabel = bedroomSelections.roomSize === "custom" && bedroomSelections.customLength > 0 && bedroomSelections.customWidth > 0
        ? `${bedroomSelections.customLength}m × ${bedroomSelections.customWidth}m custom`
        : sizeOpt?.label ?? bedroomSelections.roomSize;
      return [
        { label: "Bedroom Size",      value: sizeLabel },
        { label: "Flooring",          value: flooring ?? "Not selected" },
        { label: "Wall Treatment",    value: wall_    ?? "Not selected" },
        { label: "Lighting",          value: light    ?? "Not selected" },
        { label: "Storage",           value: storage  ?? "Not selected" },
        { label: "Window Treatment",  value: window_  ?? "Not selected" },
      ];
    }
    // Bathroom
    return [
      { label: "Floor Tile", value: floorTile?.name ?? "Not selected", color: customFloorColor },
      { label: "Wall Tile",  value: wallTile?.name  ?? "Not selected", color: customWallColor  },
      { label: "Vanity",     value: vanityLabel },
      { label: "Tapware",    value: tapwareLabel },
      ...(tileStyleLabel ? [{ label: "Tile Layout", value: tileStyleLabel }] : []),
    ];
  }, [roomType, kitchenSelections, bedroomSelections, floorTile, wallTile, customFloorColor, customWallColor, vanityLabel, tapwareLabel, tileStyleLabel]);

  // ── Room-aware structural labels ──────────────────────────────────────────
  const structuralLabels = useMemo(() => {
    if (roomType === "kitchen") {
      const arr: string[] = [];
      if (kitchenSelections.hasIsland)           arr.push("Kitchen Island");
      if (kitchenSelections.hasApplianceRoughin) arr.push("Appliance Rough-in");
      if (kitchenSelections.hasSinkRoughin)      arr.push("Sink Rough-in");
      if (kitchenSelections.hasWallChange)       arr.push("Open-Plan Wall Removal");
      if (kitchenSelections.hasButlersPantry)    arr.push("Butler's Pantry / Scullery");
      return arr;
    }
    if (roomType === "bedroom") {
      const arr: string[] = [];
      if (bedroomSelections.hasElectricalWork)  arr.push("Electrical Re-wiring");
      if (bedroomSelections.hasVJWall)          arr.push("VJ Feature Wall");
      if (bedroomSelections.hasMediaJoinery)    arr.push("Built-in Media Joinery");
      if (bedroomSelections.hasPendantRoughin)  arr.push("Pendant / Sconce Rough-in");
      return arr;
    }
    // Bathroom
    const arr: string[] = [];
    const sc = structuralChanges;
    if (sc.removeBathtub)             arr.push("Bathtub Removal");
    if (sc.addWalkinShower)           arr.push("Walk-in Shower Conversion");
    if (sc.replaceToilet)             arr.push("Toilet Replacement");
    if (sc.inWallCistern)             arr.push("In-Wall Cistern");
    if (sc.showerNiche === "single")  arr.push("Single Shower Niche");
    if (sc.showerNiche === "double")  arr.push("Double Shower Niche");
    if (sc.showerFixtures === "dual") arr.push("Dual Shower Heads (Rain + Handheld)");
    return arr;
  }, [roomType, kitchenSelections, bedroomSelections, structuralChanges]);

  // ── Right-panel brief rows ────────────────────────────────────────────────
  const briefRows = useMemo(() => {
    if (roomType === "kitchen") {
      const cabinet  = kitchenSelections.cabinetry  ? CABINETRY_OPTIONS.find((o)  => o.id === kitchenSelections.cabinetry)?.label  ?? kitchenSelections.cabinetry  : "Not selected";
      const benchtop = kitchenSelections.benchtop   ? BENCHTOP_OPTIONS.find((o)   => o.id === kitchenSelections.benchtop)?.label   ?? kitchenSelections.benchtop   : "Not selected";
      return [
        { icon: Layers,     label: "Cabinetry",     value: cabinet  },
        { icon: Layers,     label: "Benchtop",      value: benchtop },
        { icon: DollarSign, label: "Budget Target",  value: formatAUD(budget) },
        { icon: DollarSign, label: "Estimated Cost", value: formatAUD(estimatedCost), bold: true },
      ];
    }
    if (roomType === "bedroom") {
      const flooring = bedroomSelections.flooring ? BEDROOM_FLOORING_OPTIONS.find((o) => o.id === bedroomSelections.flooring)?.label ?? bedroomSelections.flooring : "Not selected";
      const wall_    = bedroomSelections.wallTreatment ? WALL_TREATMENT_OPTIONS.find((o) => o.id === bedroomSelections.wallTreatment)?.label ?? bedroomSelections.wallTreatment : "Not selected";
      return [
        { icon: Layers,     label: "Flooring",      value: flooring },
        { icon: Layers,     label: "Wall Treatment", value: wall_    },
        { icon: DollarSign, label: "Budget Target",  value: formatAUD(budget) },
        { icon: DollarSign, label: "Estimated Cost", value: formatAUD(estimatedCost), bold: true },
      ];
    }
    // Bathroom
    return [
      { icon: Layers,     label: "Floor Tile",     value: floorTile?.name ?? "Not selected", accent: customFloorColor },
      { icon: Layers,     label: "Wall Tile",       value: wallTile?.name  ?? "Not selected", accent: customWallColor  },
      { icon: Layers,     label: "Vanity",          value: vanityLabel },
      { icon: Droplets,   label: "Tapware",         value: tapwareLabel },
      { icon: DollarSign, label: "Budget Target",   value: formatAUD(budget) },
      { icon: DollarSign, label: "Estimated Cost",  value: formatAUD(estimatedCost), bold: true },
    ];
  }, [roomType, kitchenSelections, bedroomSelections, floorTile, wallTile, customFloorColor, customWallColor, vanityLabel, tapwareLabel, budget, estimatedCost]);

  const roomLabel = roomType === "kitchen" ? "Kitchen"
    : roomType === "bedroom" ? "Bedroom"
    : "Bathroom";

  const [form, setForm]           = useState<FormState>({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors]       = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const result = await submitConnectForm({
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
        design: {
          floorTile:        floorTile ? { id: floorTile.id, name: floorTile.name } : null,
          wallTile:         wallTile  ? { id: wallTile.id,  name: wallTile.name  } : null,
          customFloorColor: customFloorColor ?? null,
          customWallColor:  customWallColor ?? null,
          tileStyle:        tileStyle ?? null,
          vanity:           vanity  ?? "Not selected",
          tapware:          tapware ?? "Not selected",
          budget,
          estimatedCost,
          customNote:       customNote || undefined,
          structuralChanges,
          itemisedCosts,
          aiPrompt,
        },
      });

      if (!result.ok) {
        setServerError(result.error ?? "Something went wrong sending your design.");
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-terracotta/10 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-terracotta" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-charcoal mb-3">
              {hasGeneratedImage ? "Design Sent!" : "Selections Saved!"}
            </h1>
            <p className="text-lg text-charcoal/60 leading-relaxed">
              Thanks, <strong className="text-charcoal">{form.name.split(" ")[0]}</strong>.
              We&apos;ve received your {hasGeneratedImage ? "design brief" : "saved selections"} and will be in touch within 1 business day.
            </p>
          </div>

          <Card variant="default" padding="md" className="w-full text-left">
            <p className="text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-4">
              What happens next
            </p>
            <div className="flex flex-col gap-3">
              {[
                "Your design brief is sent to pre-vetted local builders.",
                "Builders review your style selections and budget.",
                "You receive personalised quotes within 1–3 business days.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-terracotta text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-charcoal/70">{step}</p>
                </div>
              ))}
            </div>
          </Card>

          <Button variant="outline" size="lg" onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-sand pb-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/50 hover:text-charcoal transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="max-w-xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta/10 border border-terracotta/20 mb-4">
            <ShieldCheck size={13} className="text-terracotta" />
            <span className="text-xs font-bold text-terracotta tracking-wide">Trusted &amp; secure</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-charcoal mb-4 text-balance">
            {hasGeneratedImage ? "Connect with a Builder" : "Save Your Selections"}
          </h1>
          <p className="text-lg text-charcoal/60 leading-relaxed">
            {hasGeneratedImage
              ? "Share your design brief with pre-vetted local builders. You choose who to hear from — no unsolicited calls, ever."
              : "Save your design selections so we can reach out when you're ready, or generate an AI preview first to share a visual brief."}
          </p>

          {!hasGeneratedImage && (
            <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-sand-100 border border-sand-200">
              <Info size={16} className="text-charcoal/50 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-charcoal/65 leading-relaxed">
                You haven&apos;t generated an AI preview yet. We&apos;ll save your selections, but a visual mock-up gives builders much more to work with.{" "}
                <button
                  onClick={() => router.push("/builder")}
                  className="font-semibold text-terracotta hover:underline"
                >
                  Generate one first →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">

          {/* ── LEFT: Form + Information Summary ────────────────────── */}
          <div className="flex flex-col gap-6">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

              <Card variant="default" padding="lg">
                <h2 className="text-lg font-bold text-charcoal mb-6">Your Contact Details</h2>
                <div className="flex flex-col gap-5">
                  <FormInput
                    label="Full Name"
                    placeholder="e.g. Sarah Thompson"
                    leftIcon={<User size={16} />}
                    value={form.name}
                    onChange={handleChange("name")}
                    error={errors.name}
                    autoComplete="name"
                  />
                  <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com.au"
                    leftIcon={<Mail size={16} />}
                    value={form.email}
                    onChange={handleChange("email")}
                    error={errors.email}
                    autoComplete="email"
                  />
                  <FormInput
                    label="Phone Number"
                    type="tel"
                    placeholder="04XX XXX XXX"
                    leftIcon={<Phone size={16} />}
                    value={form.phone}
                    onChange={handleChange("phone")}
                    error={errors.phone}
                    hint="Optional — faster response from builders."
                    autoComplete="tel"
                  />
                  <FormTextarea
                    label="Additional Notes"
                    placeholder="Anything else the builder should know? e.g. specific timeline, access requirements, or questions about your design…"
                    leftIcon={<MessageSquare size={16} />}
                    value={form.message}
                    onChange={handleChange("message")}
                    hint="Optional — include any specific requirements or questions."
                  />
                </div>
              </Card>

              {/* Privacy note */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-terracotta/5 border border-terracotta/15">
                <ShieldCheck size={16} className="text-terracotta mt-0.5 flex-shrink-0" />
                <p className="text-xs text-charcoal/60 leading-relaxed">
                  Your information is only shared with builders you approve. We never sell your data or add you to marketing lists. You can request removal at any time.
                </p>
              </div>

              {serverError && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
                  <ImageOff size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 leading-relaxed">{serverError}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="xl"
                fullWidth
                disabled={loading || submitted}
                className="group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    {hasGeneratedImage ? "Send Design" : "Save Selections"}
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* ── What gets sent ──────────────────────────────────────── */}
            <Card variant="default" padding="lg">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={14} className="text-terracotta" />
                <h2 className="text-lg font-bold text-charcoal">What gets sent</h2>
              </div>

              {/* Your Selections — room-aware */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-charcoal/45 uppercase tracking-wider mb-3">
                  {roomLabel} Selections
                </h3>
                <div className="rounded-xl border border-sand-200 overflow-hidden">
                  {selectionRows.map((row, i) => (
                    <div
                      key={row.label}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5",
                        i % 2 === 0 ? "bg-sand-50" : "bg-white",
                      )}
                    >
                      <p className="text-[11px] font-bold text-charcoal/45 uppercase tracking-wider w-28 flex-shrink-0">
                        {row.label}
                      </p>
                      <div className="flex items-center gap-2 min-w-0">
                        {"color" in row && row.color && (
                          <span
                            className="w-3 h-3 rounded-sm ring-1 ring-black/10 flex-shrink-0"
                            style={{ background: row.color }}
                          />
                        )}
                        <p className="text-sm font-semibold text-charcoal truncate">{row.value}</p>
                        {"color" in row && row.color && (
                          <p className="text-[10px] font-mono text-terracotta flex-shrink-0">{row.color}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Structural / Feature Changes — room-aware */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-charcoal/45 uppercase tracking-wider mb-3">
                  {roomType === "bathroom" ? "Structural Changes" : "Structural & Feature Additions"}
                </h3>
                {structuralLabels.length === 0 ? (
                  <p className="text-sm text-charcoal/45 italic">None selected.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {structuralLabels.map((label) => (
                      <li key={label} className="flex items-center gap-2.5 text-sm text-charcoal/75">
                        <Wrench size={13} className="text-terracotta flex-shrink-0" />
                        {label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Itemised Cost Breakdown */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-charcoal/45 uppercase tracking-wider mb-3">Detailed Cost Breakdown</h3>
                <div className="rounded-xl border border-sand-200 overflow-hidden">
                  {itemisedCosts.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 px-4 py-2.5 text-sm",
                        i % 2 === 0 ? "bg-sand-50" : "bg-white",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-charcoal/80 font-medium">{item.label}</p>
                        {item.detail && <p className="text-[11px] text-charcoal/45 mt-0.5">{item.detail}</p>}
                      </div>
                      <p className="font-bold text-charcoal tabular-nums whitespace-nowrap">
                        {item.amount >= 0 ? "" : "-"}{formatAUD(Math.abs(item.amount))}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 px-4 py-3 bg-charcoal text-white">
                    <p className="text-sm font-bold flex-1">Estimated Total</p>
                    <p className="text-base font-bold tabular-nums">{formatAUD(estimatedCost)}</p>
                  </div>
                </div>
              </div>

            </Card>
          </div>

          {/* ── RIGHT: Quick summary + trust ─────────────────── */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">

            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={14} className="text-terracotta" />
                <h3 className="text-sm font-bold text-charcoal">Your Design Brief</h3>
              </div>
              <div className="flex flex-col gap-3.5">
                {briefRows.map(({ icon, label, value, accent, bold }) => (
                  <SummaryItem key={label} icon={icon} label={label} value={value} accent={accent} bold={bold} />
                ))}
              </div>
            </Card>

            {/* Trust signals */}
            <Card variant="flat" padding="md">
              <p className="text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-4">Why Reno Ready</p>
              <div className="flex flex-col gap-3">
                <TrustBadge>Builders are licensed &amp; insured</TrustBadge>
                <TrustBadge>No-obligation quotes only</TrustBadge>
                <TrustBadge>Australian-owned &amp; operated</TrustBadge>
                <TrustBadge>1–3 business day response time</TrustBadge>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Summary row ───────────────────────────────────────────────
function SummaryItem({
  icon: Icon, label, value, accent, bold,
}: {
  icon: React.FC<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  accent?: string | null;
  bold?:   boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-terracotta" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-charcoal/50">{label}</p>
        <p className={cn("text-sm text-charcoal truncate", bold ? "font-bold" : "font-bold")}>
          {value}
          {accent && (
            <>
              <span className="inline-block w-2 h-2 rounded-sm ml-2 align-middle ring-1 ring-black/10" style={{ background: accent }} />
              <span className="ml-1 text-[10px] font-mono text-terracotta align-middle">{accent}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
