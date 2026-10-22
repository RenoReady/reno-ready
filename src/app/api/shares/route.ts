/**
 * /api/shares — client share links (Reno Ready Pro)
 *   GET   → { shares }  the signed-in user's links, newest first
 *   POST  → { share, url }  body: { roomType, title?, message?, estimate?, rows?, after | options, before? }
 *          options: [{ label, image }] (2–4) to let the client choose. Images as JPEG data URLs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllowance } from "@/lib/usage";
import { isProTier } from "@/lib/plans";
import { createShare, listShares } from "@/lib/shareStore";

export const dynamic = "force-dynamic";

const ROOMS = ["bathroom", "kitchen", "bedroom"] as const;

async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    return NextResponse.json({ shares: await listShares(user.id) });
  } catch {
    return NextResponse.json({ error: "Couldn't load your share links." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isProTier((await getAllowance(user)).tier)) {
    return NextResponse.json({ error: "Client share links are part of Reno Ready Pro.", upgrade_required: true }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const roomType = ROOMS.find((r) => r === body.roomType);
  if (!roomType) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const str = (v: unknown) => (typeof v === "string" ? v : null);

  try {
    const share = await createShare(user.id, {
      roomType,
      title:    str(body.title) ?? undefined,
      message:  str(body.message),
      estimate: str(body.estimate),
      rows:     body.rows,
      after:    body.after,
      before:   body.before,
      options:  body.options,
    });
    return NextResponse.json({ share, url: `${req.nextUrl.origin}/s/${share.id}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[shares] create failed:", msg);
    const userFacing = msg.startsWith("Invalid") || msg.startsWith("You can have");
    return NextResponse.json({ error: userFacing ? msg : "Couldn't create the link. Please try again." }, { status: userFacing ? 400 : 500 });
  }
}
