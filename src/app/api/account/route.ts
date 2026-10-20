/**
 * GET /api/account — everything the My Account page shows for the signed-in
 * user: plan + usage, and their saved AI renders (short-lived image links).
 * Drafts come from /api/drafts.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";
import { FREE_GENERATION_LIMIT, hasActivePlan } from "@/lib/plans";
import { GENERATIONS_BUCKET } from "@/lib/generations";

export const dynamic = "force-dynamic";

const RENDERS_SHOWN = 24;

export interface AccountResponse {
  email:     string;
  name:      string | null;
  avatarUrl: string | null;
  memberSince: string | null;
  plan: {
    /** "free" | "pass" | "monthly" | "admin" */
    kind:      "free" | "pass" | "monthly" | "admin";
    active:    boolean;
    expiresAt: string | null;
    /** Pro Monthly only: a Stripe customer exists, so the billing portal can open */
    canManageBilling: boolean;
  };
  generationCount: number;
  freeLimit:       number;
  renders: { id: string; roomType: string; createdAt: string; url: string | null; hadPhoto: boolean }[];
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to see your account." }, { status: 401 });

  const svc = createSupabaseServiceRoleClient();
  const [{ data: profile }, { data: gens }] = await Promise.all([
    svc.from("profiles")
      .select("generation_count, subscription_plan, subscription_expires_at, stripe_customer_id, created_at")
      .eq("id", user.id).single(),
    svc.from("generations")
      .select("id, room_type, image_path, had_photo, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(RENDERS_SHOWN),
  ]);

  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const planValue = profile?.subscription_plan as string | null | undefined;
  const active = hasActivePlan(planValue, profile?.subscription_expires_at);
  const kind: AccountResponse["plan"]["kind"] =
    isAdmin ? "admin" : !active ? "free" : planValue === "monthly" ? "monthly" : "pass";

  const paths = (gens ?? []).map((g) => g.image_path as string);
  const signed = paths.length ? (await svc.storage.from(GENERATIONS_BUCKET).createSignedUrls(paths, 3600)).data ?? [] : [];
  const urlFor = new Map(signed.map((s) => [s.path, s.signedUrl]));

  const meta = user.user_metadata ?? {};
  const body: AccountResponse = {
    email:       user.email ?? "",
    name:        (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
    avatarUrl:   (meta.avatar_url as string | undefined) ?? null,
    memberSince: (profile?.created_at as string | undefined) ?? user.created_at ?? null,
    plan: {
      kind,
      active:    active || isAdmin,
      expiresAt: active ? (profile?.subscription_expires_at as string | null) ?? null : null,
      canManageBilling: !!profile?.stripe_customer_id && planValue === "monthly",
    },
    generationCount: (profile?.generation_count as number | undefined) ?? 0,
    freeLimit:       FREE_GENERATION_LIMIT,
    renders: (gens ?? []).map((g) => ({
      id: g.id as string, roomType: g.room_type as string, createdAt: g.created_at as string,
      url: urlFor.get(g.image_path as string) ?? null, hadPhoto: !!g.had_photo,
    })),
  };
  return NextResponse.json(body);
}
