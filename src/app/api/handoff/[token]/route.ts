/**
 * /api/handoff/<token> — one photo from the phone to the computer.
 *
 *  PUT  (the phone)    { photo: "data:image/jpeg;base64,…" }. Accepted once,
 *                      within 30 minutes of the hand-off starting.
 *  GET  (the computer) { status: "waiting" } until the photo arrives, then
 *                      { status: "ready", photo, room } once, and the row is
 *                      deleted. { status: "gone" } if it's expired or unknown.
 *
 * The token is random (in the QR code), so only the phone that scanned it
 * and the computer that made it know where to send and collect.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TOKEN = /^[A-Za-z0-9_-]{20,40}$/;
const SEND_WINDOW = 30 * 60_000;
const MAX_PHOTO = 3_000_000;

type Params = { params: Promise<{ token: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!TOKEN.test(token)) return NextResponse.json({ ok: false, error: "That code isn't valid." }, { status: 404 });
  try {
    const body = await req.json().catch(() => ({}));
    const photo = typeof body.photo === "string" ? body.photo : "";
    if (!photo.startsWith("data:image/jpeg;base64,") || photo.length > MAX_PHOTO) {
      return NextResponse.json({ ok: false, error: "That photo couldn't be sent. Please try another one." }, { status: 400 });
    }
    const svc = createSupabaseServiceRoleClient();
    const { data: row, error } = await svc.from("photo_handoffs").select("created_at, photo").eq("token", token).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || Date.now() - Date.parse(row.created_at as string) > SEND_WINDOW) {
      return NextResponse.json({ ok: false, expired: true, error: "This code has expired. Scan the new code on your computer." }, { status: 410 });
    }
    if (row.photo) return NextResponse.json({ ok: false, error: "A photo has already been sent with this code." }, { status: 409 });

    const { error: saveError } = await svc.from("photo_handoffs")
      .update({ photo, received_at: new Date().toISOString() }).eq("token", token).is("photo", null);
    if (saveError) throw new Error(saveError.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("[handoff] couldn't save the photo:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "We couldn't send that just now. Please try again." }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!TOKEN.test(token)) return NextResponse.json({ status: "gone" });
  try {
    const svc = createSupabaseServiceRoleClient();
    const { data: row, error } = await svc.from("photo_handoffs").select("photo, room").eq("token", token).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return NextResponse.json({ status: "gone" });
    if (!row.photo) return NextResponse.json({ status: "waiting" }, { headers: { "Cache-Control": "no-store" } });
    // picked up once: the photo isn't kept after this
    await svc.from("photo_handoffs").delete().eq("token", token);
    return NextResponse.json({ status: "ready", photo: row.photo, room: row.room }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.warn("[handoff] couldn't check:", err instanceof Error ? err.message : err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
