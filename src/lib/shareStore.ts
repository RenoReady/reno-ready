/**
 * Client share links (Reno Ready Pro) — server only.
 *
 * A share is a public, unlisted page at /s/<id> with the before/after slider,
 * the key finishes and the estimate, so a Pro user (agent, designer, builder)
 * can send a design to a client who doesn't have an account.
 *
 * Stored in the private `shares` Storage bucket (created on first use):
 *   <id>/share.json          ShareRecord
 *   <id>/after.jpg           the render
 *   <id>/before.jpg          the original photo, if any
 *   owners/<user_id>/<id>    empty marker, so an owner can list and delete theirs
 *
 * Ids are 12 random URL-safe characters, so links can't be guessed.
 */

import { randomBytes } from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const SHARES_BUCKET = "shares";
export const MAX_SHARES_PER_USER = 100;
const MAX_IMAGE_BYTES = 4_000_000;

export interface ShareRecord {
  id:         string;
  ownerId:    string;
  createdAt:  string;
  roomType:   "bathroom" | "kitchen" | "bedroom";
  title:      string;
  /** Optional note to the client, e.g. "Option 2 with the darker tiles" */
  message:    string | null;
  estimate:   string | null;
  rows:       { label: string; value: string }[];
  hasBefore:  boolean;
}

export function isShareId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{12}$/.test(id);
}

let bucketReady = false;
async function bucket() {
  const svc = createSupabaseServiceRoleClient();
  if (!bucketReady) {
    const { data } = await svc.storage.getBucket(SHARES_BUCKET);
    if (!data) {
      const { error } = await svc.storage.createBucket(SHARES_BUCKET, { public: false });
      if (error && !/already exists/i.test(error.message)) throw new Error(`shares bucket: ${error.message}`);
    }
    bucketReady = true;
  }
  return svc.storage.from(SHARES_BUCKET);
}

function jpeg(dataUrl: unknown): Buffer | null {
  if (typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:image\/jpeg;base64,(.+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[1], "base64");
  return buf.length > 0 && buf.length <= MAX_IMAGE_BYTES ? buf : null;
}

async function ownedIds(ownerId: string): Promise<string[]> {
  const { data } = await (await bucket()).list(`owners/${ownerId}`, { limit: 1000 });
  return (data ?? []).map((f) => f.name).filter(isShareId);
}

export async function createShare(ownerId: string, input: {
  roomType: ShareRecord["roomType"];
  title?: string;
  message?: string | null;
  estimate?: string | null;
  rows?: unknown;
  after: unknown;
  before?: unknown;
}): Promise<ShareRecord> {
  const after = jpeg(input.after);
  if (!after) throw new Error("Invalid render");
  const before = input.before ? jpeg(input.before) : null;
  if ((await ownedIds(ownerId)).length >= MAX_SHARES_PER_USER) {
    throw new Error(`You can have up to ${MAX_SHARES_PER_USER} share links. Delete an old one first.`);
  }

  const id = randomBytes(9).toString("base64url");   // 12 characters
  const rows = Array.isArray(input.rows)
    ? input.rows.slice(0, 12)
        .filter((r): r is { label: string; value: string } => typeof r?.label === "string" && typeof r?.value === "string")
        .map((r) => ({ label: r.label.slice(0, 40), value: r.value.slice(0, 120) }))
    : [];
  const record: ShareRecord = {
    id, ownerId,
    createdAt: new Date().toISOString(),
    roomType:  input.roomType,
    title:     (input.title ?? "").trim().slice(0, 80) || `${input.roomType[0].toUpperCase()}${input.roomType.slice(1)} design`,
    message:   input.message?.trim().slice(0, 500) || null,
    estimate:  input.estimate?.slice(0, 40) || null,
    rows,
    hasBefore: !!before,
  };

  const store = await bucket();
  const put = async (path: string, body: Buffer, contentType: string) => {
    const { error } = await store.upload(path, body, { contentType, upsert: false });
    if (error) throw new Error(`Couldn't save the share: ${error.message}`);
  };
  await put(`${id}/after.jpg`, after, "image/jpeg");
  if (before) await put(`${id}/before.jpg`, before, "image/jpeg");
  await put(`${id}/share.json`, Buffer.from(JSON.stringify(record)), "application/json");
  await put(`owners/${ownerId}/${id}`, Buffer.from(""), "text/plain");
  return record;
}

export async function getShare(id: string): Promise<(ShareRecord & { afterUrl: string; beforeUrl: string | null }) | null> {
  if (!isShareId(id)) return null;
  const store = await bucket();
  const { data } = await store.download(`${id}/share.json`);
  if (!data) return null;
  let record: ShareRecord;
  try { record = JSON.parse(await data.text()); } catch { return null; }
  const sign = async (name: string) => (await store.createSignedUrl(`${id}/${name}`, 60 * 60 * 6)).data?.signedUrl ?? null;
  const afterUrl = await sign("after.jpg");
  if (!afterUrl) return null;
  return { ...record, afterUrl, beforeUrl: record.hasBefore ? await sign("before.jpg") : null };
}

export async function listShares(ownerId: string): Promise<(ShareRecord & { thumbUrl: string | null })[]> {
  const ids = await ownedIds(ownerId);
  const store = await bucket();
  const records = (await Promise.all(ids.map(async (id) => {
    const { data } = await store.download(`${id}/share.json`);
    try { return data ? (JSON.parse(await data.text()) as ShareRecord) : null; } catch { return null; }
  }))).filter((r): r is ShareRecord => !!r && r.ownerId === ownerId);
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const signed = records.length ? (await store.createSignedUrls(records.map((r) => `${r.id}/after.jpg`), 3600)).data ?? [] : [];
  return records.map((r, i) => ({ ...r, thumbUrl: signed[i]?.signedUrl ?? null }));
}

/** Deletes a share if it belongs to ownerId */
export async function deleteShare(ownerId: string, id: string): Promise<boolean> {
  if (!isShareId(id)) return false;
  const store = await bucket();
  const { data } = await store.download(`${id}/share.json`);
  if (!data) return false;
  const record = JSON.parse(await data.text()) as ShareRecord;
  if (record.ownerId !== ownerId) return false;
  await store.remove([`${id}/share.json`, `${id}/after.jpg`, `${id}/before.jpg`, `owners/${ownerId}/${id}`]);
  return true;
}
