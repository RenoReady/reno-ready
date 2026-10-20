/**
 * /api/drafts — the signed-in user's saved designs.
 *   GET   → { drafts: DraftSummary[] }   newest first
 *   POST  → saves one draft (body: see saveDraft), returns { draft }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listDrafts, saveDraft, isDraftId } from "@/lib/draftStore";

export const dynamic = "force-dynamic";

const ROOMS = ["bathroom", "kitchen", "bedroom"] as const;

async function currentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to see your drafts." }, { status: 401 });
  try {
    return NextResponse.json({ drafts: await listDrafts(userId) });
  } catch (err) {
    console.error("[drafts] list failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't load your drafts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to save drafts." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }

  const roomType = ROOMS.find((r) => r === body.roomType);
  const snapshot = body.snapshot;
  if (!isDraftId(body.id) || !roomType || !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (JSON.stringify(snapshot).length > 200_000) return NextResponse.json({ error: "Draft too large" }, { status: 413 });

  const optString = (v: unknown) => (typeof v === "string" ? v : v === null ? null : undefined);
  const optImage  = (v: unknown) => (typeof v === "string" ? v : v === null ? null : undefined);

  try {
    const draft = await saveDraft(userId, {
      id:          body.id,
      roomType,
      title:       typeof body.title === "string" ? body.title : undefined,
      estimate:    optString(body.estimate),
      description: optString(body.description),
      snapshot:    snapshot as Record<string, unknown>,
      photo:       optImage(body.photo),
      render:      optImage(body.render),
    });
    const { snapshot: _s, ...summary } = draft;
    return NextResponse.json({ draft: summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[drafts] save failed:", msg);
    return NextResponse.json({ error: msg.startsWith("Invalid") ? msg : "Couldn't save your draft." }, { status: msg.startsWith("Invalid") ? 400 : 500 });
  }
}
