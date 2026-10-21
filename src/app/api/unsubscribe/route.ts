/**
 * /api/unsubscribe?u=<user id>&t=<token> — turns off reminder emails.
 *   GET  → from the email's link; shows the confirmation page
 *   POST → one-click unsubscribe from the mail app (List-Unsubscribe-Post)
 */

import { NextRequest, NextResponse } from "next/server";
import { validUnsubscribe, setRemindersOn } from "@/lib/reminders";

export const dynamic = "force-dynamic";

async function apply(req: NextRequest): Promise<boolean> {
  const u = req.nextUrl.searchParams.get("u") ?? "", t = req.nextUrl.searchParams.get("t") ?? "";
  if (!validUnsubscribe(u, t)) return false;
  return setRemindersOn(u, false).catch(() => false);
}

export async function GET(req: NextRequest) {
  const ok = await apply(req);
  return NextResponse.redirect(new URL(`/unsubscribed${ok ? "" : "?error=1"}`, req.nextUrl.origin));
}

export async function POST(req: NextRequest) {
  return (await apply(req)) ? new NextResponse(null, { status: 200 }) : NextResponse.json({ error: "Invalid link" }, { status: 400 });
}
