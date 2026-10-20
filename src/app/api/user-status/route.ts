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
 * isPremium  — active 7-Day Project Pass or Pro Monthly (legacy day_pass / annual too)
 * freeLimit  — how many free generations are allowed (1)
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";
import { FREE_GENERATION_LIMIT, hasActivePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

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

    // Premium = active paid plan that hasn't expired
    const isPremium = hasActivePlan(profile?.subscription_plan, profile?.subscription_expires_at);

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
