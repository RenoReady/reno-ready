/**
 * Stored generations — every successful AI preview is uploaded to the
 * private `generations` bucket and recorded in public.generations so the
 * admin dashboard can show each user's designs.
 * Schema: supabase/migrations/20261008_generations.sql
 */

import { randomUUID } from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { RoomType } from "@/lib/roomTypes";

export const GENERATIONS_BUCKET = "generations";

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/**
 * Uploads a generated image (a base-64 data URL) and records it against the
 * user. Never throws — a storage hiccup must not affect the user's result.
 */
export async function saveGeneration(opts: {
  userId:   string;
  roomType: RoomType;
  dataUrl:  string;
  prompt:   string;
  hadPhoto: boolean;
}): Promise<void> {
  try {
    const match = opts.dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
    if (!match) return;
    const [, mimeType, base64] = match;
    const path = `${opts.userId}/${Date.now()}-${randomUUID().slice(0, 8)}.${EXT[mimeType] ?? "png"}`;

    const svc = createSupabaseServiceRoleClient();
    const { error: uploadError } = await svc.storage
      .from(GENERATIONS_BUCKET)
      .upload(path, Buffer.from(base64, "base64"), { contentType: mimeType, upsert: false });
    if (uploadError) {
      console.warn("[generations] upload failed:", uploadError.message);
      return;
    }

    const { error: insertError } = await svc.from("generations").insert({
      user_id:    opts.userId,
      room_type:  opts.roomType,
      image_path: path,
      prompt:     opts.prompt,
      had_photo:  opts.hadPhoto,
    });
    if (insertError) {
      console.warn("[generations] insert failed:", insertError.message);
      await svc.storage.from(GENERATIONS_BUCKET).remove([path]);   // don't leave an untracked file
    }
  } catch (err: unknown) {
    console.warn("[generations] save failed:", err instanceof Error ? err.message : err);
  }
}
