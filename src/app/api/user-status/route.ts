/**
 * GET /api/user-status
 *
 * Returns the current user's auth + subscription state so the client
 * can gate generation without exposing the service-role key.
 *
 * Response:
 *  { isAdmin, isPremium, generationCount, userId, freeLimit }
 *
 * isAdmin    — email matches ADMIN_EMAIL env var; unlimited access
 * isPremium  — active day_pass / monthly / annual subscription
 * freeLimit  — how many free generations are allowed (3)
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";

export const dynamic = "force-dynamic";

export const FREE_GENERATION_LIMIT = 5;

interface UserStatusResponse {
  userId:          string | null;
  isAdmin:         boolean;
  isPremium:       boolean;
  generationCount: number;
  freeLimit:       number;
}

export async function GET(): Promise<NextResponse<UserStatusResponse>> {
  const empty: UserStatusResponse = {
    userId:          null,
    isAdmin:         false,
    isPremium:       false,
    generationCount: 0,
    freeLimit:       FREE_GENERATION_LIMIT,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json(empty);

    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // Use service role to read profile (bypasses RLS, avoids any permission edge-cases)
    const svc = createSupabaseServiceRoleClient();
    const { data: profile } = await svc
      .from("profiles")
      .select("generation_count, subscription_plan, subscription_expires_at")
      .eq("id", user.id)
      .single();

    const generationCount = profile?.generation_count ?? 0;

    // Premium = active non-free plan that hasn't expired
    const plan           = profile?.subscription_plan ?? "free";
    const expiresAt      = profile?.subscription_expires_at
      ? new Date(profile.subscription_expires_at)
      : null;
    const isPremiumPlan  = ["day_pass", "paid", "monthly", "annual"].includes(plan);
    const isNotExpired   = !expiresAt || expiresAt > new Date();
    const isPremium      = isPremiumPlan && isNotExpired;

    return NextResponse.json({
      userId:          user.id,
      isAdmin,
      isPremium,
      generationCount,
      freeLimit:       FREE_GENERATION_LIMIT,
    });
  } catch (err) {
    console.error("[user-status]", err);
    return NextResponse.json(empty);
  }
}
