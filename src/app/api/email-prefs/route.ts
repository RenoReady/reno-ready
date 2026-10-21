/**
 * /api/email-prefs — the signed-in user's email preferences (My Account).
 *   GET → { reminders: boolean }
 *   PUT { reminders: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { remindersOn, setRemindersOn } from "@/lib/reminders";

export const dynamic = "force-dynamic";

async function currentUser() {
  const supabase = await createSupabaseServerClient();
  return (await supabase.auth.getUser()).data.user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  return NextResponse.json({ reminders: remindersOn(user) });
}

export async function PUT(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (typeof body?.reminders !== "boolean") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  return (await setRemindersOn(user.id, body.reminders)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Couldn't save" }, { status: 500 });
}
