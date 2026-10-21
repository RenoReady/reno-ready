/**
 * GET /api/leads — the builder briefs the signed-in user has sent (for My Account).
 * Only their own, and only what they entered; the admin's pipeline status isn't shown.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listLeadsFor } from "@/lib/leadStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    const briefs = (await listLeadsFor(user.id)).map((l) => ({
      id: l.id, createdAt: l.createdAt, room: l.room, estimate: l.estimate,
      timeline: l.timeline, address: l.address, reportUrl: l.reportUrl, renderUrl: l.renderUrl,
    }));
    return NextResponse.json({ briefs });
  } catch {
    return NextResponse.json({ error: "Couldn't load your briefs." }, { status: 500 });
  }
}
