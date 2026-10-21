/**
 * POST /api/account/delete — permanently deletes the signed-in user's account.
 * Body: { confirm: "DELETE" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAccount } from "@/lib/accountDeletion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.confirm !== "DELETE") return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });

  try {
    const summary = await deleteAccount(user);
    console.info(`[account] deleted ${user.id}: ${summary.files} files, ${summary.subscriptionsCancelled} subscriptions cancelled`);
    await supabase.auth.signOut().catch(() => {});
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[account] delete failed:", msg);
    return NextResponse.json({ error: msg.includes("admin") ? msg : "We couldn't delete your account. Please try again or email us." }, { status: 500 });
  }
}
