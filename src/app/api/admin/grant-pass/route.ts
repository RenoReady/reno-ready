/**
 * POST /api/admin/grant-pass { userId } — the admin gives an account a free
 * 7-Day Project Pass (e.g. for completing the feedback survey). Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";
import { grantProjectPass } from "@/lib/grants";

export async function POST(req: NextRequest) {
  const user = await createSupabaseServerClient().then((s) => s.auth.getUser()).then((r) => r.data.user).catch(() => null);
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const { userId } = (await req.json().catch(() => ({}))) as { userId?: string };
  if (!userId || !/^[0-9a-f-]{36}$/.test(userId)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await grantProjectPass(userId)) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Couldn't give the pass" }, { status: 500 });
  }
}
