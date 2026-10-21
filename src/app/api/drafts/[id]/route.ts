/**
 * /api/drafts/:id
 *   GET    → { draft }  with photoUrl / renderUrl (short-lived links)
 *   DELETE → { ok: true }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDraft, deleteDraft, isDraftId, setDraftInProject } from "@/lib/draftStore";

export const dynamic = "force-dynamic";

async function currentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to open drafts." }, { status: 401 });
  if (!isDraftId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const draft = await getDraft(userId, id).catch(() => null);
  return draft ? NextResponse.json({ draft }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** PATCH { inProject: boolean } — include in / leave out of the whole-home project */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isDraftId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (typeof body?.inProject !== "boolean") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const ok = await setDraftInProject(userId, id, body.inProject).catch(() => false);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isDraftId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    await deleteDraft(userId, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't delete that draft." }, { status: 500 });
  }
}
