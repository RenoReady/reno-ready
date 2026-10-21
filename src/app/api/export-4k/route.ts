/**
 * POST /api/export-4k — Reno Ready Pro only.
 *
 * Re-renders the current design at 4K (about 3600×4800 for a portrait photo)
 * without changing it, so it can be printed or used in listings. The file is
 * too big to send back directly (Vercel caps responses at 4.5 MB), so it's
 * stored privately and a 15-minute download link is returned.
 *
 * Body: { image: "data:image/jpeg;base64,..." }  →  { url } | { error }
 * Exports don't count towards render or edit allowances.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAllowance } from "@/lib/usage";
import { isProTier } from "@/lib/plans";
import { GENERATIONS_BUCKET } from "@/lib/generations";

export const maxDuration = 55;
export const dynamic = "force-dynamic";

const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
function closestAspectRatio(w: number, h: number): string {
  const target = Math.log(w / h);
  return ASPECT_RATIOS.reduce((best, r) => {
    const [a, b] = r.split(":").map(Number), [ba, bb] = best.split(":").map(Number);
    return Math.abs(Math.log(a / b) - target) < Math.abs(Math.log(ba / bb) - target) ? r : best;
  });
}

const PROMPT =
  "Return this exact image at higher resolution. Do not add, remove, move or restyle anything: " +
  "keep every surface, fixture, colour, reflection, shadow and the framing identical. " +
  "Only sharpen fine detail and textures. No text, labels or watermarks.";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to export." }, { status: 401 });

  const allowance = await getAllowance(user);
  if (!isProTier(allowance.tier)) {
    return NextResponse.json({ error: "4K exports are part of Reno Ready Pro.", upgrade_required: true }, { status: 403 });
  }

  let image: unknown;
  try { ({ image } = await req.json()); } catch { /* handled below */ }
  const m = typeof image === "string" ? image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) : null;
  if (!m || m[2].length > 6_000_000) return NextResponse.json({ error: "Send the render as an image." }, { status: 400 });

  const key = process.env.GOOGLE_API_KEY;
  if (!key || key === "your_google_api_key_here") return NextResponse.json({ error: "4K export isn't available right now." }, { status: 503 });

  try {
    const meta = await sharp(Buffer.from(m[2], "base64")).metadata();
    const aspectRatio = meta.width && meta.height ? closestAspectRatio(meta.width, meta.height) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const model = new GoogleGenerativeAI(key, { apiVersion: "v1beta" }).getGenerativeModel({ model: "gemini-3.1-flash-image" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: m[1], data: m[2] } }, { text: PROMPT }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { imageSize: "4K", ...(aspectRatio && { aspectRatio }) } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = result.response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));
    if (!part?.inlineData) throw new Error("no image returned");

    const jpeg = await sharp(Buffer.from(part.inlineData.data, "base64")).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    const path = `${user.id}/exports/${Date.now()}-${randomUUID().slice(0, 8)}-4k.jpg`;
    const store = createSupabaseServiceRoleClient().storage.from(GENERATIONS_BUCKET);
    const { error: upErr } = await store.upload(path, jpeg, { contentType: "image/jpeg" });
    if (upErr) throw new Error(upErr.message);
    const { data: signed } = await store.createSignedUrl(path, 15 * 60, { download: "My-Reno-Ready-Design-4K.jpg" });
    if (!signed?.signedUrl) throw new Error("couldn't sign the download");

    const out = await sharp(jpeg).metadata();
    return NextResponse.json({ url: signed.signedUrl, width: out.width, height: out.height });
  } catch (err) {
    console.error("[export-4k]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "The 4K export didn't work this time. Please try again in a moment." }, { status: 500 });
  }
}
