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
    floorTile, wallTile,
    customFloorColor, customWallColor,
    tileStyle,
    vanity, tapware, budget,
    structuralChanges,
    customNote,
    generatedImageUrl,
    roomPhotoUrl,
    bathroomSize, customLength, customWidth,
  } = useBuilderStore();

  const hasGeneratedImage = !!generatedImageUrl;

  const vanityLabel  = VANITY_OPTIONS.find((v) => v.id === vanity)?.label  ?? vanity;
  const tapwareLabel = TAPWARE_OPTIONS.find((t) => t.id === tapware)?.label ?? tapware;
  const tileStyleLabel = tileStyle
    ? TILE_STYLE_OPTIONS.find((s) => s.id === tileStyle)?.label ?? tileStyle
    : null;

  const baseCost      = getBathroomBaseCost(bathroomSize, customLength, customWidth);
  const estimatedCost = calcEstimatedCost(floorTile, wallTile, vanity, tapware, structuralChanges, baseCost);
  const itemisedCosts = buildItemisedCosts(floorTile, wallTile, vanity, tapware, structuralChanges, baseCost);

  // Build the raw AI prompt that would be (or was) sent to Gemini
  const aiPrompt = useMemo(() => buildGeminiPrompt({
    imageBase64: roomPhotoUrl,
    selections: {
      floorTile, wallTile, vanity, tapware,
      customNote, customFloorColor, customWallColor,
      tileStyle, structuralChanges,
    },
  }), [
    roomPhotoUrl, floorTile, wallTile, vanity, tapware,
    customNote, customFloorColor, customWallColor, tileStyle, structuralChanges,
  ]);

  // Active structural changes summarised as labels for the design brief
  const structuralLabels = useMemo(() => {
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
  }, [structuralChanges]);

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
          customFloorColor,
          customWallColor,
          tileStyle:        tileStyle ?? null,
          vanity,
          tapware,
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

            {/* ── Information Summary ─────────────────────────────── */}
            <Card variant="default" padding="lg">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={14} className="text-terracotta" />
                <h2 className="text-lg font-bold text-charcoal">What gets sent</h2>
              </div>

              {/* Selected Tiles */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-charcoal/45 uppercase tracking-wider mb-3">Selected Tiles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-sand-50 border border-sand-200">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 ring-1 ring-black/10"
                         style={{ background: customFloorColor ?? undefined }}>
                      {!customFloorColor && (
                        <div className={cn("w-full h-full rounded-lg", floorTile?.bgClass ?? "bg-sand-100")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-charcoal/45 font-bold uppercase tracking-wider">Floor</p>
                      <p className="text-xs font-bold text-charcoal truncate">{floorTile?.name ?? "Not selected"}</p>
                      {customFloorColor && <p className="text-[10px] font-mono text-terracotta">{customFloorColor}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-sand-50 border border-sand-200">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 ring-1 ring-black/10"
                         style={{ background: customWallColor ?? undefined }}>
                      {!customWallColor && (
                        <div className={cn("w-full h-full rounded-lg", wallTile?.bgClass ?? "bg-sand-100")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-charcoal/45 font-bold uppercase tracking-wider">Wall</p>
                      <p className="text-xs font-bold text-charcoal truncate">{wallTile?.name ?? "Not selected"}</p>
                      {customWallColor && <p className="text-[10px] font-mono text-terracotta">{customWallColor}</p>}
                    </div>
                  </div>
                </div>
                {tileStyleLabel && (
                  <p className="mt-2.5 text-xs text-charcoal/55">
                    Layout: <span className="font-semibold text-charcoal">{tileStyleLabel}</span>
                  </p>
                )}
              </div>

              {/* Structural Changes */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-charcoal/45 uppercase tracking-wider mb-3">Structural Changes</h3>
                {structuralLabels.length === 0 ? (
                  <p className="text-sm text-charcoal/45 italic">No structural changes requested.</p>
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
                <SummaryItem icon={Layers}     label="Floor Tile" value={floorTile?.name ?? "Not selected"} accent={customFloorColor} />
                <SummaryItem icon={Layers}     label="Wall Tile"  value={wallTile?.name  ?? "Not selected"} accent={customWallColor} />
                <SummaryItem icon={Layers}     label="Vanity"     value={vanityLabel} />
                <SummaryItem icon={Droplets}   label="Tapware"    value={tapwareLabel} />
                <div className="h-px bg-sand-200 my-1" />
                <SummaryItem icon={DollarSign} label="Budget Target" value={formatAUD(budget)} />
                <SummaryItem icon={DollarSign} label="Estimated Cost" value={formatAUD(estimatedCost)} bold />
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
