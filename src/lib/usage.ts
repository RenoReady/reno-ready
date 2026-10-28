/**
 * Render + edit allowances (server only).
 *
 * Counters live in the user's Supabase `app_metadata.usage` — only the server
 * (service role) can write it, and it needs no database migration:
 *   { key: "pass:<expiresAt>" | "pro:2026-10" | "free", renders, edits }
 * A new key (a new pass, a new month) starts the counters again.
 *
 * Free previews also honour profiles.generation_count, which counted previews
 * before these counters existed.
 *
 * A free allowance can be renewed (renewFreeAllowance, e.g. a thank-you to early
 * users): previews counted before then no longer count, and history is kept.
 */

import type { User } from "@supabase/supabase-js";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";
import { TIER_LIMITS, tierFor, type Tier } from "@/lib/plans";

export type UsageKind = "render" | "edit";

export interface Allowance {
  tier: Tier;
  /** profiles.subscription_plan as stored */
  plan: string | null;
  expiresAt: string | null;
  rendersUsed: number;
  editsUsed: number;
  /** null = no limit (admin) */
  rendersLimit: number | null;
  editsLimit: number | null;
  stripeCustomerId: string | null;
  generationCount: number;
}

interface UsageMeta { key?: string; renders?: number; edits?: number }

function periodKey(tier: Tier, expiresAt: string | null): string {
  if (tier === "pass") return `pass:${expiresAt ?? ""}`;
  if (tier === "pro") return `pro:${new Date().toISOString().slice(0, 7)}`;
  return tier;
}

/** What this user has used and may use right now */
export async function getAllowance(user: User): Promise<Allowance> {
  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const { data: profile } = await createSupabaseServiceRoleClient()
    .from("profiles")
    .select("generation_count, subscription_plan, subscription_expires_at, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const plan = (profile?.subscription_plan as string | null) ?? null;
  const expiresAt = (profile?.subscription_expires_at as string | null) ?? null;
  const tier = tierFor(plan, expiresAt, isAdmin);
  const generationCount = (profile?.generation_count as number | undefined) ?? 0;

  const meta = (user.app_metadata?.usage ?? {}) as UsageMeta;
  const current = meta.key === periodKey(tier, expiresAt);
  let rendersUsed = current ? meta.renders ?? 0 : 0;
  const editsUsed = current ? meta.edits ?? 0 : 0;
  // previews made before a renewal don't count against the free one
  const baseline = (user.app_metadata?.freeRenewal as { baseline?: number } | undefined)?.baseline ?? 0;
  if (tier === "free") rendersUsed = Math.max(rendersUsed, generationCount - baseline);

  const limits = tier === "admin" ? null : TIER_LIMITS[tier];
  return {
    tier, plan, expiresAt, rendersUsed, editsUsed,
    rendersLimit: limits?.renders ?? null,
    editsLimit: limits?.edits ?? null,
    stripeCustomerId: (profile?.stripe_customer_id as string | null) ?? null,
    generationCount,
  };
}

/** Whether one more render/edit is allowed */
export function canUse(a: Allowance, kind: UsageKind): boolean {
  const limit = kind === "render" ? a.rendersLimit : a.editsLimit;
  const used  = kind === "render" ? a.rendersUsed : a.editsUsed;
  return limit === null || used < limit;
}

/** Gives a free account its free preview and edit again. Returns false if they're on a paid plan. */
export async function renewFreeAllowance(userId: string): Promise<boolean> {
  const svc = createSupabaseServiceRoleClient();
  const [{ data }, { data: profile }] = await Promise.all([
    svc.auth.admin.getUserById(userId),
    svc.from("profiles").select("generation_count, subscription_plan, subscription_expires_at").eq("id", userId).single(),
  ]);
  if (!data.user) return false;
  if (tierFor(profile?.subscription_plan as string | null, profile?.subscription_expires_at as string | null) !== "free") return false;
  const { error } = await svc.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(data.user.app_metadata ?? {}),
      usage: { key: "free", renders: 0, edits: 0 },
      freeRenewal: { at: new Date().toISOString(), baseline: (profile?.generation_count as number | undefined) ?? 0 },
    },
  });
  if (error) throw new Error(error.message);
  return true;
}

/** Counts a successful render/edit against the current period */
export async function recordUsage(userId: string, a: Allowance, kind: UsageKind): Promise<void> {
  if (a.tier === "admin") return;
  const svc = createSupabaseServiceRoleClient();
  // re-read so two quick generations don't overwrite each other's count
  const { data } = await svc.auth.admin.getUserById(userId);
  const meta = (data.user?.app_metadata?.usage ?? {}) as UsageMeta;
  const key = periodKey(a.tier, a.expiresAt);
  const base = meta.key === key ? meta : { key, renders: 0, edits: 0 };
  const next: UsageMeta = {
    key,
    renders: (base.renders ?? 0) + (kind === "render" ? 1 : 0),
    edits:   (base.edits ?? 0) + (kind === "edit" ? 1 : 0),
  };
  const { error } = await svc.auth.admin.updateUserById(userId, {
    app_metadata: { ...(data.user?.app_metadata ?? {}), usage: next },
  });
  if (error) console.warn("[usage] couldn't record usage:", error.message);
}
