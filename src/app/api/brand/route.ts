/**
 * /api/brand — Reno Ready Pro report branding.
 *   GET  → { brand: ReportBrand | null }   (logo as a data URL, ready for the PDF)
 *   PUT  → saves it. Body: { businessName, phone?, email?, website?, licence?, accent?, logo? }
 *          logo: a data URL to replace it, null to remove it, omitted to keep it.
 *
 * Text fields live in the user's app_metadata.brand (server-writable only);
 * the logo is normalised to a PNG (max 800×300) in the private `brands` bucket.
 */

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAllowance } from "@/lib/usage";
import { isProTier } from "@/lib/plans";
import type { ReportBrand } from "@/lib/generateProReportPDF";

export const dynamic = "force-dynamic";

const BUCKET = "brands";
const MAX_LOGO_BYTES = 3_000_000;

type StoredBrand = Omit<ReportBrand, "logo"> & { hasLogo?: boolean };

let bucketReady = false;
async function bucket() {
  const svc = createSupabaseServiceRoleClient();
  if (!bucketReady) {
    const { data } = await svc.storage.getBucket(BUCKET);
    if (!data) {
      const { error } = await svc.storage.createBucket(BUCKET, { public: false });
      if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
    }
    bucketReady = true;
  }
  return svc.storage.from(BUCKET);
}

async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const stored = (user.app_metadata?.brand ?? null) as StoredBrand | null;
  if (!stored?.businessName) return NextResponse.json({ brand: null });

  let logo: string | null = null;
  if (stored.hasLogo) {
    const { data } = await (await bucket()).download(`${user.id}/logo.png`);
    if (data) logo = `data:image/png;base64,${Buffer.from(await data.arrayBuffer()).toString("base64")}`;
  }
  const { hasLogo: _h, ...fields } = stored;
  return NextResponse.json({ brand: { ...fields, logo } satisfies ReportBrand });
}

export async function PUT(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isProTier((await getAllowance(user)).tier)) {
    return NextResponse.json({ error: "Branded reports are part of Reno Ready Pro.", upgrade_required: true }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const businessName = text(body.businessName, 60);
  if (!businessName) return NextResponse.json({ error: "Add your business name." }, { status: 400 });
  const accent = typeof body.accent === "string" && /^#[0-9a-f]{6}$/i.test(body.accent) ? body.accent : null;

  const prev = (user.app_metadata?.brand ?? {}) as StoredBrand;
  let hasLogo = !!prev.hasLogo;
  const store = await bucket();

  if (body.logo === null) {
    await store.remove([`${user.id}/logo.png`]);
    hasLogo = false;
  } else if (typeof body.logo === "string") {
    const m = body.logo.match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,(.+)$/);
    const raw = m ? Buffer.from(m[2], "base64") : null;
    if (!raw || raw.length > MAX_LOGO_BYTES) return NextResponse.json({ error: "Use a PNG, JPG or SVG logo under 3 MB." }, { status: 400 });
    try {
      // trim empty margins (logos often come with lots), then cap the size
      const trimmed = await sharp(raw, { density: 300 }).trim().png().toBuffer().catch(() => sharp(raw, { density: 300 }).png().toBuffer());
      const png = await sharp(trimmed).resize(800, 300, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
      const { error } = await store.upload(`${user.id}/logo.png`, png, { contentType: "image/png", upsert: true });
      if (error) throw new Error(error.message);
      hasLogo = true;
    } catch (err) {
      console.error("[brand] logo failed:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "We couldn't read that logo. Try a PNG or JPG." }, { status: 400 });
    }
  }

  const brand: StoredBrand = {
    businessName,
    phone:   text(body.phone, 30),
    email:   text(body.email, 80),
    website: text(body.website, 80),
    licence: text(body.licence, 60),
    accent,
    hasLogo,
  };
  const { error } = await createSupabaseServiceRoleClient().auth.admin.updateUserById(user.id, {
    app_metadata: { ...(user.app_metadata ?? {}), brand },
  });
  if (error) return NextResponse.json({ error: "Couldn't save your branding." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
