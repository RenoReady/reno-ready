/**
 * GET /api/account — everything the My Account page shows for the signed-in
 * user: plan + usage, and their saved AI renders (short-lived image links).
 * Drafts come from /api/drafts.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { FREE_GENERATION_LIMIT } from "@/lib/plans";
import { getAllowance } from "@/lib/usage";
import { GENERATIONS_BUCKET } from "@/lib/generations";

export const dynamic = "force-dynamic";

const RENDERS_SHOWN = 24;

export interface AccountResponse {
  email:     string;
  name:      string | null;
  avatarUrl: string | null;
  memberSince: string | null;
  plan: {
    kind:      "free" | "pass" | "pro" | "admin";
    /** Pro only */
    interval:  "monthly" | "annual" | null;
    active:    boolean;
    expiresAt: string | null;
    /** Pro only: a Stripe customer exists, so the billing portal can open */
    canManageBilling: boolean;
  };
  usage: { rendersUsed: number; rendersLimit: number | null; editsUsed: number; editsLimit: number | null };
  generationCount: number;
  freeLimit:       number;
  renders: { id: string; roomType: string; createdAt: string; url: string | null; hadPhoto: boolean }[];
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to see your account." }, { status: 401 });

  const svc = createSupabaseServiceRoleClient();
  const [allowance, { data: profile }, { data: gens }] = await Promise.all([
    getAllowance(user),
    svc.from("profiles").select("created_at").eq("id", user.id).single(),
    svc.from("generations")
      .select("id, room_type, image_path, had_photo, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(RENDERS_SHOWN),
  ]);

  const kind = allowance.tier;
  const isPro = kind === "pro";

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
      interval:  isPro ? (allowance.plan === "annual" ? "annual" : "monthly") : null,
      active:    kind !== "free",
      expiresAt: kind === "pass" || isPro ? allowance.expiresAt : null,
      canManageBilling: isPro && !!allowance.stripeCustomerId,
    },
    usage: {
      rendersUsed: allowance.rendersUsed, rendersLimit: allowance.rendersLimit,
      editsUsed: allowance.editsUsed, editsLimit: allowance.editsLimit,
    },
    generationCount: allowance.generationCount,
    freeLimit:       FREE_GENERATION_LIMIT,
    renders: (gens ?? []).map((g) => ({
      id: g.id as string, roomType: g.room_type as string, createdAt: g.created_at as string,
      url: urlFor.get(g.image_path as string) ?? null, hadPhoto: !!g.had_photo,
    })),
  };
  return NextResponse.json(body);
}
