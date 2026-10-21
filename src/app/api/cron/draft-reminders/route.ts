/**
 * GET /api/cron/draft-reminders — run daily by Vercel Cron (see vercel.json).
 *
 * Vercel sends "Authorization: Bearer $CRON_SECRET". The admin can also open
 * it while signed in; add ?dry=1 to see who would be emailed without sending.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";
import { runDraftReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function allowed(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) return true;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!(await allowed(req))) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const result = await runDraftReminders({ dryRun });
  console.info("[reminders]", JSON.stringify(result));
  return NextResponse.json(result);
}
