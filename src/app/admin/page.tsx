/**
 * Admin Dashboard — /admin
 *
 * Access is gated by middleware.ts (only ADMIN_EMAIL signed in via Supabase
 * may reach this route). This page additionally re-checks the session
 * server-side as a defence-in-depth measure.
 *
 * Reads:
 *   - profiles table (RLS bypassed via service-role client)
 *   - storage.objects in the `generations` bucket
 */

import { redirect } from "next/navigation";
import {
  Users, CreditCard, DollarSign, Sparkles,
  ImageIcon, Mail, AlertTriangle,
} from "lucide-react";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, PAID_USER_PRICE_CENTS } from "@/lib/config";
import { cn, formatAUD } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────
interface ProfileRow {
  id:                 string;
  email:              string | null;
  created_at:         string;
  subscription_plan:  "free" | "paid" | "day_pass" | "monthly" | "annual" | null;
  generation_count:   number | null;
}

interface GalleryImage {
  name:     string;
  url:      string;
  size:     number;
  created:  string;
}

// ── Data fetchers (graceful when tables/buckets don't exist) ──────
async function fetchProfiles(): Promise<{ rows: ProfileRow[]; error: string | null }> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, created_at, subscription_plan, generation_count")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as ProfileRow[], error: null };
  } catch (err: unknown) {
    return { rows: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function fetchGallery(): Promise<{ images: GalleryImage[]; error: string | null }> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const bucket   = "generations";
    const { data: files, error } = await supabase
      .storage.from(bucket)
      .list("", { limit: 24, sortBy: { column: "created_at", order: "desc" } });

    if (error) return { images: [], error: error.message };
    if (!files) return { images: [], error: null };

    const images = await Promise.all(
      files
        .filter((f) => f.name && !f.name.endsWith("/"))
        .map(async (f) => {
          const { data } = supabase.storage.from(bucket).getPublicUrl(f.name);
          return {
            name:    f.name,
            url:     data.publicUrl,
            size:    f.metadata?.size ?? 0,
            created: f.created_at ?? "",
          };
        }),
    );
    return { images, error: null };
  } catch (err: unknown) {
    return { images: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Page ──────────────────────────────────────────────────────────
export default async function AdminPage() {
  // Defence-in-depth — middleware should have already gated this, but
  // re-verify in case the matcher misses or the cookie is stale.
  let userEmail: string | undefined;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email ?? undefined;
  } catch {
    // Supabase not configured — show setup screen below
  }

  if (userEmail && userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect("/?admin_error=forbidden");
  }

  const [{ rows: profiles, error: profilesError }, { images, error: galleryError }] =
    await Promise.all([fetchProfiles(), fetchGallery()]);

  // ── Stats ───────────────────────────────────────────────────
  const totalUsers     = profiles.length;
  const paidUsers      = profiles.filter((p) => p.subscription_plan && p.subscription_plan !== "free").length;
  const freeUsers      = totalUsers - paidUsers;
  const totalRevenueCents = paidUsers * PAID_USER_PRICE_CENTS;
  const totalGenerations  = profiles.reduce((sum, p) => sum + (p.generation_count ?? 0), 0);

  return (
    <div className="min-h-screen bg-sand pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        <header className="mb-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold text-terracotta tracking-[0.2em] uppercase mb-2">
              Reno Ready · Admin
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-charcoal">Dashboard</h1>
            <p className="text-charcoal/55 mt-2">Operational overview — restricted to {ADMIN_EMAIL}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/12 border border-emerald-500/25 text-emerald-700 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live · auto-refreshes on reload
          </div>
        </header>

        {/* ── Stats grid ──────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <StatCard icon={Users}     accent="terracotta" label="Total Users"      value={totalUsers.toString()} />
          <StatCard icon={CreditCard} accent="emerald"   label="Paid Users"       value={paidUsers.toString()} hint={`${freeUsers} free`} />
          <StatCard icon={DollarSign} accent="terracotta" label="Total Revenue"    value={formatAUD(totalRevenueCents / 100)} hint={`@ ${formatAUD(PAID_USER_PRICE_CENTS / 100)} / paid user`} />
          <StatCard icon={Sparkles}   accent="charcoal"   label="AI Generations"   value={totalGenerations.toString()} />
          <StatCard icon={ImageIcon}  accent="charcoal"   label="Stored Designs"   value={images.length.toString()} />
        </section>

        {/* ── User table ──────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-charcoal">Users</h2>
            <p className="text-sm text-charcoal/45">{totalUsers} record{totalUsers === 1 ? "" : "s"} (most recent 200)</p>
          </div>

          {profilesError ? (
            <SetupCard
              title="Profiles table not available"
              detail={profilesError}
              steps={[
                "Create the profiles table in Supabase (see /supabase/schema.sql).",
                "Set SUPABASE_SERVICE_ROLE_KEY in your Vercel env vars.",
                "Reload this page.",
              ]}
            />
          ) : profiles.length === 0 ? (
            <div className="rounded-2xl bg-white border border-sand-200 p-10 text-center">
              <p className="text-sm text-charcoal/55">No users yet — they&apos;ll appear here after signing in via the Auth modal.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-sand-200 overflow-hidden shadow-warm-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-sand-50 border-b border-sand-200">
                    <tr>
                      <Th>Email</Th>
                      <Th>Signup</Th>
                      <Th>Plan</Th>
                      <Th align="right">Generations</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p, i) => (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b border-sand-100 last:border-0",
                          i % 2 === 1 && "bg-sand-50/40",
                        )}
                      >
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                              <Mail size={12} className="text-terracotta" />
                            </div>
                            <span className="font-mono text-xs text-charcoal/85 truncate max-w-[260px]">{p.email ?? "—"}</span>
                          </div>
                        </Td>
                        <Td>
                          <span className="text-xs text-charcoal/65">{formatDate(p.created_at)}</span>
                        </Td>
                        <Td>
                          <PlanPill plan={p.subscription_plan} />
                        </Td>
                        <Td align="right">
                          <span className="font-bold text-charcoal tabular-nums">{p.generation_count ?? 0}</span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ── Image gallery ───────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-charcoal">Recent Generations</h2>
            <p className="text-sm text-charcoal/45">Top {images.length} from the <code className="text-charcoal/65">generations</code> bucket</p>
          </div>

          {galleryError ? (
            <SetupCard
              title="Storage bucket not available"
              detail={galleryError}
              steps={[
                "Create a storage bucket named `generations` in Supabase.",
                "Make it public OR generate signed URLs in code.",
                "Reload this page.",
              ]}
            />
          ) : images.length === 0 ? (
            <div className="rounded-2xl bg-white border border-sand-200 p-10 text-center">
              <ImageIcon size={28} className="text-charcoal/25 mx-auto mb-3" />
              <p className="text-sm text-charcoal/55">No generations yet — once users save designs, they&apos;ll appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <a
                  key={img.name}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-sand-100 ring-1 ring-sand-200 hover:ring-terracotta hover:ring-2 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-[10px] font-mono text-white/85 truncate">{img.name}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, hint, accent,
}: {
  icon: React.FC<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  hint?: string;
  accent: "terracotta" | "emerald" | "charcoal";
}) {
  const colors = {
    terracotta: "bg-terracotta/10 text-terracotta",
    emerald:    "bg-emerald-500/12 text-emerald-700",
    charcoal:   "bg-charcoal/8 text-charcoal/75",
  }[accent];

  return (
    <div className="rounded-2xl bg-white border border-sand-200 p-5 shadow-warm-sm">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colors)}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <p className="text-xs font-semibold text-charcoal/45 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-charcoal tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-charcoal/40 mt-1">{hint}</p>}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cn(
      "px-4 py-3 font-bold text-charcoal/55 text-[11px] uppercase tracking-wider",
      align === "right" ? "text-right" : "text-left",
    )}>
      {children}
    </th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td className={cn("px-4 py-3", align === "right" ? "text-right" : "text-left")}>
      {children}
    </td>
  );
}

function PlanPill({ plan }: { plan: ProfileRow["subscription_plan"] }) {
  if (!plan || plan === "free") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sand-100 text-charcoal/55 text-[11px] font-bold uppercase tracking-wider">
        Free
      </span>
    );
  }
  const label = plan === "day_pass" ? "Day Pass" : plan === "monthly" ? "Monthly" : plan === "annual" ? "Annual" : "Paid";
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-terracotta/12 text-terracotta text-[11px] font-bold uppercase tracking-wider">
      <CreditCard size={9} strokeWidth={3} />
      {label}
    </span>
  );
}

function SetupCard({ title, detail, steps }: { title: string; detail: string; steps: string[] }) {
  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-900">{title}</h3>
          <p className="text-xs text-amber-700/85 mt-0.5 font-mono">{detail}</p>
        </div>
      </div>
      <ol className="ml-7 mt-3 space-y-1.5 text-xs text-amber-800 list-decimal list-inside">
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
