/**
 * POST /api/track — a journey step from the browser (see src/lib/track.ts).
 * Only the steps in CLIENT_STEPS are accepted; the rest are logged server-side.
 * Always answers 204 so a beacon never shows an error.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CLIENT_STEPS, logEvent, type FunnelStep } from "@/lib/funnel";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 2_000) return new NextResponse(null, { status: 204 });
    const b = JSON.parse(raw) as Record<string, unknown>;
    const step = b.step as FunnelStep;
    if (!CLIENT_STEPS.has(step)) return new NextResponse(null, { status: 204 });
    let userId: string | null = null;
    try { userId = (await (await createSupabaseServerClient()).auth.getUser()).data.user?.id ?? null; } catch { /* signed out */ }
    await logEvent(req, {
      step, userId,
      room:      typeof b.room === "string" ? b.room : null,
      detail:    typeof b.detail === "string" ? b.detail : null,
      page:      typeof b.page === "string" ? b.page : null,
      returning: typeof b.returning === "boolean" ? b.returning : null,
      postcode:  typeof b.postcode === "string" ? b.postcode : null,
    });
  } catch { /* bad body: ignore */ }
  return new NextResponse(null, { status: 204 });
}
