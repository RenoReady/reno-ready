/**
 * POST /api/handoff — the computer starts a phone → computer photo hand-off.
 *
 * Returns a random token for the Step 1 QR code. The phone sends its photo
 * to /api/handoff/<token>, and the computer polls the same address to pick it
 * up. Up to 30 open hand-offs per browser; rows over an hour old are cleared.
 * Any failure (e.g. the table isn't there yet) returns an error, and the page
 * falls back to the plain QR link.
 */
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { VISITOR_COOKIE } from "@/lib/visitor";

export const dynamic = "force-dynamic";

const ROOMS = new Set(["bathroom", "kitchen", "bedroom"]);
const HOUR = 3_600_000;

export async function POST(req: NextRequest) {
  try {
    const visitor = req.cookies.get(VISITOR_COOKIE)?.value?.slice(0, 64);
    if (!visitor) return NextResponse.json({ ok: false }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const room = typeof body.room === "string" && ROOMS.has(body.room) ? body.room : null;

    const svc = createSupabaseServiceRoleClient();
    // tidy up: unclaimed hand-offs only live an hour
    await svc.from("photo_handoffs").delete().lt("created_at", new Date(Date.now() - HOUR).toISOString());

    const { count, error: countError } = await svc.from("photo_handoffs")
      .select("token", { count: "exact", head: true }).eq("visitor_id", visitor);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= 30) return NextResponse.json({ ok: false }, { status: 429 });

    const token = randomBytes(18).toString("base64url");
    const { error } = await svc.from("photo_handoffs").insert({ token, visitor_id: visitor, room });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    console.warn("[handoff] couldn't start:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
