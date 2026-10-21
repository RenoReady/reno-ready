/**
 * GET /api/user-status
 *
 * The current user's plan and what they have left, so the builder can show
 * counters and gate features without exposing the service-role key.
 *
 *  tier          free | pass | pro | admin
 *  isPremium     a paid plan is active (pass or Pro) — no watermark, PDF reports
 *  renders/edits used + limit for the current period (limit null = no limit)
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TIER_LIMITS, FREE_GENERATION_LIMIT, isPaidTier, type Tier } from "@/lib/plans";
import { getAllowance } from "@/lib/usage";

export const dynamic = "force-dynamic";

interface UserStatusResponse {
  userId:          string | null;
  isAdmin:         boolean;
  isPremium:       boolean;
  tier:            Tier;
  generationCount: number;
  freeLimit:       number;
  rendersUsed:     number;
  rendersLimit:    number | null;
  editsUsed:       number;
  editsLimit:      number | null;
}

export async function GET(): Promise<NextResponse<UserStatusResponse>> {
  const empty: UserStatusResponse = {
    userId: null, isAdmin: false, isPremium: false, tier: "free",
    generationCount: 0, freeLimit: FREE_GENERATION_LIMIT,
    rendersUsed: 0, rendersLimit: TIER_LIMITS.free.renders,
    editsUsed: 0, editsLimit: TIER_LIMITS.free.edits,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(empty);

    const a = await getAllowance(user);
    return NextResponse.json({
      userId:          user.id,
      isAdmin:         a.tier === "admin",
      isPremium:       isPaidTier(a.tier) && a.tier !== "admin",
      tier:            a.tier,
      generationCount: a.generationCount,
      freeLimit:       FREE_GENERATION_LIMIT,
      rendersUsed:     a.rendersUsed,
      rendersLimit:    a.rendersLimit,
      editsUsed:       a.editsUsed,
      editsLimit:      a.editsLimit,
    });
  } catch (err) {
    console.error("[user-status]", err);
    return NextResponse.json(empty);
  }
}
