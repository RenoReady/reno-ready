"use client";

/**
 * /account — My Account
 *
 * Plan + usage, drafts (continue or delete), saved AI renders, what the
 * paid plans add, and quick links. Signed-out visitors get the sign-in prompt.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles, History, Image as ImageIcon, Lock, Check, CreditCard, Loader2, Trash2,
  ArrowRight, Download, X, Bath, ChefHat, BedDouble, MessageSquare, Crown, CalendarClock,
  Link2, Copy, ExternalLink, Palette, Hammer, FileText, Eye, ThumbsUp, MessageCircleQuestion, FileCheck,
} from "lucide-react";
import BrandForm from "@/components/account/BrandForm";
import ProjectPlanner from "@/components/account/ProjectPlanner";
import EmailPrefs from "@/components/account/EmailPrefs";
import DeleteAccount from "@/components/account/DeleteAccount";
import AuthModal from "@/components/auth/AuthModal";
import PaywallModal, { type PaywallReason } from "@/components/ui/PaywallModal";
import PreviewWatermark from "@/components/ui/PreviewWatermark";
import { timeAgo } from "@/components/builder/ResumeDraftModal";
import { createBillingPortalSession } from "@/app/actions/stripe";
import { listAccountDrafts, deleteAccountDraft, type DraftSummary } from "@/lib/drafts";
import { downloadImage } from "@/lib/watermark";
import { ROOM_PAGES } from "@/lib/roomPages";
import type { RoomType } from "@/lib/roomTypes";
import type { AccountResponse } from "@/app/api/account/route";

interface ShareReplySummary { kind: "approve" | "question"; option?: string | null; name: string; contact: string; message: string | null; at: string }
interface ShareSummary { id: string; title: string; roomType: string; createdAt: string; thumbUrl: string | null; options?: string[]; firstViewedAt?: string | null; replies: ShareReplySummary[] }
interface BriefSummary { id: string; createdAt: string; room: string; estimate: number; timeline: string | null; address: string | null; reportUrl: string | null; renderUrl: string | null }
import { cn, formatAUD } from "@/lib/utils";

const ROOM_ICON: Record<RoomType, typeof Bath> = { bathroom: Bath, kitchen: ChefHat, bedroom: BedDouble };
const roomName = (r: string) => r[0].toUpperCase() + r.slice(1);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
const daysLeft = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));

const PRO_PERKS = [
  { title: "Crisp 2K renders",             body: "Sharper designs instead of the standard free preview." },
  { title: "No watermark",                 body: "Clean images to share with family, builders and designers." },
  { title: "More \u201cNot quite right?\u201d edits", body: "Highlight any spot and change just that part." },
  { title: "Contractor PDF Pro Reports",   body: "Materials, itemised costs and your render, ready to quote from." },
  { title: "500 renders and edits a month", body: "Design every room as many times as you need, up to 500 renders and 500 edits each month." },
  { title: "4K exports",                   body: "Print-quality images for listings, brochures and presentations." },
  { title: "Multi-room reports",           body: "Bathroom, kitchen and bedroom in one builder brief." },
  { title: "Commercial use licence",       body: "Use your renders in property listings and marketing." },
  { title: "4 variations per click",       body: "Four takes on the same room at once, to compare options." },
  { title: "Client share links",           body: "Send a private before/after page. No account needed to view it." },
  { title: "Branded PDF reports",          body: "Your logo, contact details and colours on every report." },
];
/** The Project Pass includes the first PASS_PERKS of the list above */
const PASS_PERKS = 4;

function UsageBar({ label, used, limit, dark }: { label: string; used: number; limit: number; dark?: boolean }) {
  const pct = Math.min(100, (used / Math.max(1, limit)) * 100);
  return (
    <div>
      <div className={cn("mb-1.5 flex justify-between text-xs font-semibold", dark ? "text-white/60" : "text-charcoal/55")}>
        <span>{label}</span>
        <span>{Math.max(0, limit - used)} of {limit} left</span>
      </div>
      <div className={cn("h-2 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-sand-200")}>
        <div className={cn("h-full rounded-full", pct >= 100 ? "bg-red-400" : "bg-terracotta")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [drafts,  setDrafts]  = useState<DraftSummary[] | null>(null);
  const [state,   setState]   = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [paywall, setPaywall] = useState<PaywallReason | null>(null);
  const [viewing, setViewing] = useState<AccountResponse["renders"][number] | null>(null);
  const [billingBusy,  setBillingBusy]  = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  // Pro: client share links
  const [shares, setShares] = useState<ShareSummary[] | null>(null);
  // Pro only: false = no report branding yet, so reports and client links go out unbranded
  const [branded, setBranded] = useState<boolean | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<BriefSummary[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account", { cache: "no-store" });
      if (res.status === 401) { setState("signed-out"); return; }
      if (!res.ok) throw new Error(String(res.status));
      const acct = (await res.json()) as AccountResponse;
      setAccount(acct);
      setState("ready");
      setDrafts(await listAccountDrafts() ?? []);
      fetch("/api/leads", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { briefs: [] })).then((d) => setBriefs(d.briefs ?? [])).catch(() => setBriefs([]));
      if (acct.plan.kind === "pro" || acct.plan.kind === "admin") {
        const r = await fetch("/api/shares", { cache: "no-store" }).catch(() => null);
        setShares(r?.ok ? (await r.json()).shares : []);
        fetch("/api/brand", { cache: "no-store" }).then((b) => (b.ok ? b.json() : null)).then((d) => d && setBranded(!!d.brand)).catch(() => {});
      }
    } catch {
      setState("error");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shareUrl = (id: string) => `${window.location.origin}/s/${id}`;
  const copyShare = async (id: string) => {
    try { await navigator.clipboard.writeText(shareUrl(id)); setCopiedId(id); setTimeout(() => setCopiedId(null), 2_000); } catch { /* clipboard blocked */ }
  };
  const removeShare = async (id: string) => {
    if (!window.confirm("Turn off this link? Anyone who has it won't be able to open it any more.")) return;
    setDeleting(id);
    const ok = (await fetch(`/api/shares/${id}`, { method: "DELETE" }).catch(() => null))?.ok;
    if (ok) setShares((list) => list?.filter((x) => x.id !== id) ?? null);
    setDeleting(null);
  };

  const manageBilling = async () => {
    setBillingBusy(true); setBillingError(null);
    const r = await createBillingPortalSession().catch(() => ({ error: "We couldn't open billing right now." }));
    if ("url" in r) { window.location.href = r.url; return; }
    setBillingError(r.error); setBillingBusy(false);
  };

  const removeDraft = async (id: string) => {
    if (!window.confirm("Delete this draft? This can't be undone.")) return;
    setDeleting(id);
    if (await deleteAccountDraft(id)) setDrafts((d) => d?.filter((x) => x.id !== id) ?? null);
    setDeleting(null);
  };

  if (state === "loading") {
    return <div className="min-h-[70vh] bg-sand flex items-center justify-center"><Loader2 className="animate-spin text-terracotta" size={28} /></div>;
  }
  if (state === "signed-out") {
    return (
      <div className="min-h-[70vh] bg-sand">
        <AuthModal
          title="Sign in to My Account"
          message={<>See your drafts, saved designs and plan in one place.</>}
          onSuccess={load}
          onClose={() => { window.location.href = "/"; }}
        />
      </div>
    );
  }
  if (state === "error" || !account) {
    return (
      <div className="min-h-[70vh] bg-sand flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-semibold text-charcoal">We couldn&apos;t load your account.</p>
        <button onClick={() => { setState("loading"); load(); }} className="rounded-xl bg-terracotta px-5 py-2.5 text-sm font-bold text-white">Try again</button>
      </div>
    );
  }

  const { plan } = account;
  const isFree = plan.kind === "free";
  const watermark = isFree;
  const roomsDesigned = new Set([...account.renders.map((r) => r.roomType), ...(drafts ?? []).map((d) => d.roomType)]).size;
  const { usage } = account;
  const outOfRenders = usage.rendersLimit !== null && usage.rendersUsed >= usage.rendersLimit;
  const planName =
    plan.kind === "free" ? "Free" : plan.kind === "pass" ? "7-Day Project Pass"
    : plan.kind === "pro" ? `Reno Ready Pro${plan.interval === "annual" ? " \u00b7 Annual" : ""}` : "Admin \u00b7 full access";

  return (
    <div className="min-h-screen bg-sand pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">

        {/* ── Pro without branding: their reports and links go out unbranded ── */}
        {branded === false && (
          <a href="#branding" className="flex items-center gap-3 rounded-2xl border border-terracotta/25 bg-terracotta/5 px-4 py-3 text-sm text-charcoal/75 hover:border-terracotta/45">
            <Palette size={18} className="flex-shrink-0 text-terracotta" />
            <span className="flex-1"><strong className="text-charcoal">Add your branding.</strong> Your logo and details go on every PDF report and client link, so clients see your business.</span>
            <ArrowRight size={16} className="flex-shrink-0 text-terracotta" />
          </a>
        )}

        {/* ── Profile + plan ───────────────────────────────────── */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex items-center gap-4 rounded-3xl border border-sand-200 bg-white/80 p-5 sm:p-6 shadow-warm-sm">
            {account.avatarUrl && !avatarFailed
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={account.avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
              : <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-terracotta/15 text-lg font-bold text-terracotta">{(account.name ?? account.email)[0]?.toUpperCase()}</div>}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-charcoal/40">My Account</p>
              <h1 className="truncate text-xl sm:text-2xl font-bold text-charcoal">{account.name ?? account.email.split("@")[0]}</h1>
              <p className="truncate text-sm text-charcoal/55">{account.email}</p>
              {account.memberSince && <p className="mt-0.5 text-xs text-charcoal/40">Member since {fmtDate(account.memberSince)}</p>}
            </div>
          </div>

          <div className={cn("flex flex-col gap-4 rounded-3xl p-5 sm:p-6 shadow-warm-sm",
            isFree ? "border border-sand-200 bg-white/80" : "bg-charcoal text-white")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={cn("text-xs font-bold uppercase tracking-widest", isFree ? "text-charcoal/40" : "text-white/45")}>Your plan</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-bold">
                  {!isFree && <Crown size={18} className="text-terracotta" />}
                  {planName}
                </p>
              </div>
              {plan.expiresAt && plan.kind !== "admin" && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
                  <CalendarClock size={13} />
                  {plan.kind === "pass" ? `${daysLeft(plan.expiresAt)} day${daysLeft(plan.expiresAt) === 1 ? "" : "s"} left` : `Renews ${fmtDate(plan.expiresAt)}`}
                </span>
              )}
            </div>

            {isFree ? (
              <>
                <div className="flex flex-col gap-3">
                  <UsageBar label="Free preview" used={usage.rendersUsed} limit={usage.rendersLimit ?? 1} />
                  <UsageBar label="Free edit" used={usage.editsUsed} limit={usage.editsLimit ?? 1} />
                  <p className="text-xs text-charcoal/50">
                    {!outOfRenders ? "Your free preview is ready to use." : "You've used your free preview. Upgrade to keep designing in full 2K."}
                  </p>
                </div>
                <button onClick={() => setPaywall("upgrade")}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-terracotta py-3 text-sm font-bold text-white shadow-warm-sm hover:bg-terracotta/90">
                  <Sparkles size={15} /> Upgrade from $19
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-white/60">
                  {plan.kind === "pass" && plan.expiresAt && <>2K renders, edits and PDF Pro Reports until {fmtDate(plan.expiresAt)}. Nothing renews.</>}
                  {plan.kind === "pro" && <>Up to 500 renders and 500 edits a month, 4K exports and a commercial use licence. Cancel anytime in 1-click.</>}
                  {plan.kind === "admin" && <>Every feature is unlocked on this account.</>}
                </p>
                {plan.kind === "pass" && usage.rendersLimit !== null && usage.editsLimit !== null && (
                  <div className="flex flex-col gap-3">
                    <UsageBar dark label="Renders" used={usage.rendersUsed} limit={usage.rendersLimit} />
                    <UsageBar dark label="Edits" used={usage.editsUsed} limit={usage.editsLimit} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {plan.canManageBilling && (
                    <button onClick={manageBilling} disabled={billingBusy}
                      className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60">
                      {billingBusy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} Manage or cancel subscription
                    </button>
                  )}
                  {plan.kind === "pass" && (
                    <button onClick={() => setPaywall("upgrade")} className="flex items-center gap-2 rounded-xl bg-terracotta px-4 py-2.5 text-sm font-bold text-white hover:bg-terracotta/90">
                      <Sparkles size={15} /> Go Pro for 500 a month
                    </button>
                  )}
                </div>
                {billingError && <p className="text-xs text-white/60">{billingError}</p>}
              </>
            )}
          </div>
        </section>

        {/* ── Numbers ──────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Previews generated", value: account.generationCount },
            { label: "Drafts saved",       value: drafts?.length ?? "…" },
            { label: "Saved designs",      value: account.renders.length },
            { label: "Rooms designed",     value: roomsDesigned },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-sand-200 bg-white/70 px-4 py-3.5">
              <p className="text-2xl font-bold tabular-nums text-charcoal">{s.value}</p>
              <p className="text-xs font-semibold text-charcoal/50">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── Quick actions ────────────────────────────────────── */}
        <section className="grid gap-3 sm:grid-cols-4">
          {(["bathroom", "kitchen", "bedroom"] as RoomType[]).map((r) => {
            const Icon = ROOM_ICON[r];
            return (
              <Link key={r} href={ROOM_PAGES[r].path}
                className="flex items-center gap-3 rounded-2xl border-2 border-sand-200 bg-white/60 px-4 py-3 text-sm font-bold text-charcoal/75 transition-colors hover:border-terracotta/40 hover:text-terracotta">
                <Icon size={18} className="text-terracotta" /> New {r} design
              </Link>
            );
          })}
          <Link href="/connect"
            className="flex items-center gap-3 rounded-2xl bg-charcoal px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-charcoal/90">
            <MessageSquare size={18} /> Send my brief to a builder
          </Link>
        </section>

        {/* ── Whole-home project ──────────────────────────────── */}
        {drafts && drafts.length > 0 && (
          <ProjectPlanner drafts={drafts} isPro={plan.kind === "pro" || plan.kind === "admin"}
            onChange={setDrafts} onUpgrade={() => setPaywall("project")} />
        )}

        {/* ── Drafts ───────────────────────────────────────────── */}
        <section id="drafts" className="scroll-mt-32">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal"><History size={18} className="text-terracotta" /> Drafts</h2>
              <p className="text-sm text-charcoal/50">Saved automatically as you design. Pick up any of them where you left off.</p>
            </div>
          </div>
          {drafts === null ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-sand-300"><Loader2 className="animate-spin text-charcoal/30" /></div>
          ) : drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white/40 px-6 py-8 text-center text-sm text-charcoal/50">
              No drafts yet. Start a design and it saves here automatically.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drafts.map((d) => {
                const Icon = ROOM_ICON[d.roomType];
                return (
                  <div key={d.id} className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white/80 shadow-warm-sm">
                    <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
                      {d.thumbUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={d.thumbUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-charcoal/25"><Icon size={36} /></div>}
                      {d.hasRender && watermark && <PreviewWatermark />}
                      <span className={cn("absolute left-3 top-3 z-10 rounded-lg px-2.5 py-1 text-[11px] font-bold",
                        d.hasRender ? "bg-terracotta text-white" : "bg-white/90 text-charcoal/70")}>
                        {d.hasRender ? "AI preview ready" : "In progress"}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <p className="flex items-center gap-1.5 font-bold text-charcoal"><Icon size={15} className="text-terracotta" /> {d.title}</p>
                        <p className="text-xs text-charcoal/50">
                          Edited {timeAgo(Date.parse(d.updatedAt))}{d.estimate ? <> · <span className="font-semibold text-charcoal/70">{d.estimate}</span></> : null}
                        </p>
                      </div>
                      <div className="mt-auto flex gap-2">
                        <Link href={`${ROOM_PAGES[d.roomType].path}?draft=${d.id}`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-terracotta py-2.5 text-sm font-bold text-white hover:bg-terracotta/90">
                          Continue <ArrowRight size={14} />
                        </Link>
                        <button onClick={() => removeDraft(d.id)} disabled={deleting === d.id} aria-label="Delete draft"
                          className="flex items-center justify-center rounded-xl border-2 border-sand-200 px-3 text-charcoal/45 hover:border-red-200 hover:text-red-500 disabled:opacity-50">
                          {deleting === d.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Saved designs ────────────────────────────────────── */}
        <section>
          <div className="mb-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal"><ImageIcon size={18} className="text-terracotta" /> Saved designs</h2>
            <p className="text-sm text-charcoal/50">Every AI render you&apos;ve generated{account.renders.length >= 24 ? " (latest 24)" : ""}.</p>
          </div>
          {account.renders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white/40 px-6 py-8 text-center text-sm text-charcoal/50">
              Your AI renders will appear here once you generate one.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {account.renders.map((r) => (
                <button key={r.id} onClick={() => setViewing(r)} disabled={!r.url}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-100 text-left shadow-warm-sm">
                  {r.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.url} alt={`${roomName(r.roomType)} render`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  )}
                  {watermark && <PreviewWatermark />}
                  <span className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/65 to-transparent px-3 pb-2 pt-6 text-xs font-semibold text-white">
                    {roomName(r.roomType)} · {fmtDate(r.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Builder briefs ───────────────────────────────────── */}
        <section id="briefs" className="scroll-mt-32">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal"><Hammer size={18} className="text-terracotta" /> Builder briefs</h2>
              <p className="text-sm text-charcoal/50">Designs you&apos;ve sent to be quoted. We&apos;ll be in touch by email or phone.</p>
            </div>
            <Link href="/connect" className="flex items-center gap-1.5 rounded-xl bg-charcoal px-4 py-2 text-xs font-bold text-white hover:bg-charcoal/90">
              <MessageSquare size={14} /> Send a brief
            </Link>
          </div>
          {briefs === null ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-sand-300"><Loader2 className="animate-spin text-charcoal/30" /></div>
          ) : briefs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white/40 px-6 py-8 text-center text-sm text-charcoal/50">
              No briefs yet. When you&apos;re happy with a design, tap &ldquo;Send my brief to a builder&rdquo; and it&apos;ll show here.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-sand-100 overflow-hidden rounded-2xl border border-sand-200 bg-white/80">
              {briefs.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3">
                  {b.renderUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={b.renderUrl} alt="" className="h-12 w-16 flex-shrink-0 rounded-lg object-cover" />
                    : <div className="h-12 w-16 flex-shrink-0 rounded-lg bg-sand-100" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-charcoal">{b.room} brief · <span className="tabular-nums">{formatAUD(b.estimate)}</span></p>
                    <p className="truncate text-xs text-charcoal/50">Sent {fmtDate(b.createdAt)}{b.timeline ? ` · ${b.timeline}` : ""}{b.address ? ` · ${b.address}` : ""}</p>
                  </div>
                  {b.reportUrl && (
                    <a href={b.reportUrl} target="_blank" rel="noopener" className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-sand-200 px-2.5 py-2 text-xs font-bold text-charcoal/65 hover:border-terracotta/40 hover:text-terracotta">
                      <FileText size={13} /><span className="hidden sm:inline">PDF</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Report branding (Pro) ────────────────────────────── */}
        {(plan.kind === "pro" || plan.kind === "admin") && (
          <section id="branding" className="scroll-mt-32">
            <div className="mb-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal"><Palette size={18} className="text-terracotta" /> Report branding</h2>
              <p className="text-sm text-charcoal/50">Your logo, details and colour on every PDF Pro Report you download, in place of Reno Ready&apos;s.</p>
            </div>
            <BrandForm onSaved={() => setBranded(true)} />
          </section>
        )}

        {/* ── Client share links (Pro) ─────────────────────────── */}
        {shares !== null && (
          <section>
            <div className="mb-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal"><Link2 size={18} className="text-terracotta" /> Client links</h2>
              <p className="text-sm text-charcoal/50">Private before/after pages you&apos;ve shared, with your branding. Clients can approve a design or ask a question, and their replies show here. Turn one off and the link stops working.</p>
            </div>
            {shares.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sand-300 bg-white/40 px-6 py-8 text-center text-sm text-charcoal/50">
                No links yet. Tap &ldquo;Share with client&rdquo; under any preview to make one.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-sand-100 overflow-hidden rounded-2xl border border-sand-200 bg-white/80">
                {shares.map((sh) => (
                  <div key={sh.id} className="p-3">
                  <div className="flex items-center gap-3">
                    {sh.thumbUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={sh.thumbUrl} alt="" className="h-12 w-16 flex-shrink-0 rounded-lg object-cover" />
                      : <div className="h-12 w-16 flex-shrink-0 rounded-lg bg-sand-100" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-charcoal">{sh.title}</p>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal/50">
                        <span>{roomName(sh.roomType)}{sh.options && sh.options.length > 1 ? ` · ${sh.options.length} options` : ""} · shared {fmtDate(sh.createdAt)}</span>
                        <span className={cn("flex items-center gap-1 font-semibold", sh.firstViewedAt ? "text-charcoal/60" : "text-charcoal/35")}>
                          <Eye size={12} /> {sh.firstViewedAt ? `Opened ${fmtDate(sh.firstViewedAt)}` : "Not opened yet"}
                        </span>
                        {sh.replies.some((r) => r.kind === "approve") && (
                          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">
                            <ThumbsUp size={11} /> Approved{(() => { const o = sh.replies.filter((r) => r.kind === "approve").at(-1)?.option; return o ? ` option ${o}` : ""; })()}
                          </span>
                        )}
                        {sh.replies.filter((r) => r.kind === "question").length > 0 && (
                          <span className="flex items-center gap-1 rounded-md bg-terracotta/10 px-1.5 py-0.5 font-bold text-terracotta">
                            <MessageCircleQuestion size={11} /> {sh.replies.filter((r) => r.kind === "question").length} question{sh.replies.filter((r) => r.kind === "question").length > 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      {sh.replies.some((r) => r.kind === "approve") && (
                        <a href={`/account/approval/${sh.id}`} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                          <FileCheck size={13} /><span className="hidden sm:inline">Approval record</span>
                        </a>
                      )}
                      <button onClick={() => copyShare(sh.id)} className="flex items-center gap-1 rounded-lg bg-charcoal px-2.5 py-2 text-xs font-bold text-white hover:bg-charcoal/90">
                        {copiedId === sh.id ? <Check size={13} /> : <Copy size={13} />}<span className="hidden sm:inline">{copiedId === sh.id ? "Copied" : "Copy link"}</span>
                      </button>
                      <a href={`/s/${sh.id}`} target="_blank" rel="noopener" aria-label="Open" className="flex items-center rounded-lg border border-sand-200 px-2.5 text-charcoal/55 hover:text-charcoal"><ExternalLink size={14} /></a>
                      <button onClick={() => removeShare(sh.id)} disabled={deleting === sh.id} aria-label="Turn off link"
                        className="flex items-center rounded-lg border border-sand-200 px-2.5 text-charcoal/45 hover:border-red-200 hover:text-red-500 disabled:opacity-50">
                        {deleting === sh.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                  {sh.replies.length > 0 && (
                    <ul className="mt-2.5 flex flex-col gap-2 sm:ml-[76px]">
                      {[...sh.replies].reverse().map((r, i) => (
                        <li key={i} className="rounded-xl bg-sand-50 px-3 py-2 text-sm">
                          <p className="flex flex-wrap items-center gap-x-2 text-xs text-charcoal/50">
                            <span className="font-bold text-charcoal">{r.name}</span>
                            <span className={r.kind === "approve" ? "font-semibold text-emerald-700" : "font-semibold text-terracotta"}>{r.kind === "approve" ? (r.option ? `approved option ${r.option}` : "approved it") : r.option ? `asked about option ${r.option}` : "asked a question"}</span>
                            <span>{fmtDate(r.at)}</span>
                          </p>
                          {r.message && <p className="mt-1 whitespace-pre-line text-charcoal/75">{r.message}</p>}
                          <a href={r.contact.includes("@") ? `mailto:${r.contact}` : `tel:${r.contact.replace(/[^\d+]/g, "")}`}
                            className="mt-1 inline-block text-xs font-bold text-terracotta hover:underline">{r.contact}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── What the paid plans add ──────────────────────────── */}
        {plan.kind !== "pro" && plan.kind !== "admin" && (
          <section className="rounded-3xl border border-terracotta/25 bg-terracotta/5 p-5 sm:p-7">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-charcoal">{isFree ? "What you’re missing" : "Even more with Reno Ready Pro"}</h2>
                <p className="text-sm text-charcoal/55">
                  {isFree ? "Your free preview shows the idea. A paid plan gets it ready for a builder." : "Your pass covers this project. Pro keeps every room going, with 4K and a commercial licence."}
                </p>
              </div>
              <button onClick={() => setPaywall("upgrade")}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-sm font-bold text-white shadow-warm-sm hover:bg-terracotta/90 sm:mt-0">
                <Sparkles size={15} /> {isFree ? "See plans" : "See Pro"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRO_PERKS.map((p, i) => {
                const has = !isFree && i < PASS_PERKS;
                return (
                  <div key={p.title} className="flex gap-3 rounded-2xl bg-white/80 p-4">
                    <span className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                      has ? "bg-emerald-100 text-emerald-600" : "bg-charcoal/8 text-charcoal/45")}>
                      {has ? <Check size={15} strokeWidth={3} /> : <Lock size={14} />}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-charcoal">{p.title}</p>
                      <p className="text-xs leading-snug text-charcoal/55">{p.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <EmailPrefs />

        <DeleteAccount planKind={plan.kind} />

        <p className="text-center text-xs text-charcoal/40">
          <Link href="/privacy" className="underline">Privacy policy</Link>
          {" "}· <Link href="/terms" className="underline">Terms of Use</Link>
        </p>
      </div>

      {/* Render viewer */}
      {viewing?.url && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4" onClick={() => setViewing(null)}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewing.url} alt="" className="max-h-[78vh] w-full object-contain bg-black" />
              {watermark && <PreviewWatermark onUpgrade={() => { setViewing(null); setPaywall("watermark"); }} />}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-white">
              <p className="text-sm font-semibold">{roomName(viewing.roomType)} · {fmtDate(viewing.createdAt)}</p>
              <div className="flex gap-2">
                <button onClick={() => downloadImage(viewing.url!, { watermark }).catch(() => alert("Download failed. Please try again."))}
                  className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25">
                  <Download size={15} /> Download
                </button>
                <button onClick={() => setViewing(null)} aria-label="Close" className="rounded-xl bg-white/15 p-2 hover:bg-white/25"><X size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paywall && <PaywallModal reason={paywall} onClose={() => setPaywall(null)} />}
    </div>
  );
}
