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
 *   <id>/replies.json        ShareReply[]: the client approving it or asking a question
 *   owners/<user_id>/<id>    empty marker, so an owner can list and delete theirs
 *
 * Ids are 12 random URL-safe characters, so links can't be guessed.
 *
 * The page shows the owner's report branding (looked up live, so links stay
 * current when they change it) and lets the client reply to them.
 */

import { randomBytes } from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const SHARES_BUCKET = "shares";
export const MAX_SHARES_PER_USER = 100;
export const MAX_REPLIES_PER_SHARE = 20;
const MAX_IMAGE_BYTES = 4_000_000;

export interface ShareReply {
  kind:    "approve" | "question";
  name:    string;
  /** Email or phone, whichever the client gave */
  contact: string;
  message: string | null;
  at:      string;
}

/** The owner's business details as shown on the page (from their report branding) */
export interface ShareBrand {
  businessName: string;
  phone:   string | null;
  email:   string | null;
  website: string | null;
  licence: string | null;
  accent:  string | null;
  logoUrl: string | null;
}

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
  /** When someone other than the owner first opened it */
  firstViewedAt?: string | null;
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
  const put = async (path: string, body: Buffer, contentType: string, cacheControl?: string) => {
    const { error } = await store.upload(path, body, { contentType, upsert: false, ...(cacheControl && { cacheControl }) });
    if (error) throw new Error(`Couldn't save the share: ${error.message}`);
  };
  await put(`${id}/after.jpg`, after, "image/jpeg");
  if (before) await put(`${id}/before.jpg`, before, "image/jpeg");
  // uncached: it's rewritten when the client first opens it
  await put(`${id}/share.json`, Buffer.from(JSON.stringify(record)), "application/json", "0");
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

async function readJson<T>(path: string): Promise<T | null> {
  const { data } = await (await bucket()).download(path);
  try { return data ? (JSON.parse(await data.text()) as T) : null; } catch { return null; }
}

// overwritten files need cacheControl "0", or reads come back stale for an hour
async function writeJson(path: string, value: unknown) {
  const { error } = await (await bucket()).upload(path, Buffer.from(JSON.stringify(value)), { contentType: "application/json", upsert: true, cacheControl: "0" });
  if (error) throw new Error(`Couldn't save: ${error.message}`);
}

export async function listShares(ownerId: string): Promise<(ShareRecord & { thumbUrl: string | null; replies: ShareReply[] })[]> {
  const ids = await ownedIds(ownerId);
  const store = await bucket();
  const records = (await Promise.all(ids.map((id) => readJson<ShareRecord>(`${id}/share.json`))))
    .filter((r): r is ShareRecord => !!r && r.ownerId === ownerId);
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [signed, replies] = await Promise.all([
    records.length ? store.createSignedUrls(records.map((r) => `${r.id}/after.jpg`), 3600).then((r) => r.data ?? []) : [],
    Promise.all(records.map((r) => readJson<ShareReply[]>(`${r.id}/replies.json`))),
  ]);
  return records.map((r, i) => ({ ...r, thumbUrl: signed[i]?.signedUrl ?? null, replies: replies[i] ?? [] }));
}

/** Records the first time someone other than the owner opens the link */
export async function markShareViewed(id: string): Promise<void> {
  const record = await readJson<ShareRecord>(`${id}/share.json`);
  if (!record || record.firstViewedAt) return;
  await writeJson(`${id}/share.json`, { ...record, firstViewedAt: new Date().toISOString() });
}

/** Saves a client's reply; returns the share so the caller can notify its owner */
export async function addShareReply(id: string, reply: Omit<ShareReply, "at">): Promise<ShareRecord> {
  if (!isShareId(id)) throw new Error("Not found");
  const record = await readJson<ShareRecord>(`${id}/share.json`);
  if (!record) throw new Error("Not found");
  const replies = (await readJson<ShareReply[]>(`${id}/replies.json`)) ?? [];
  if (replies.length >= MAX_REPLIES_PER_SHARE) throw new Error("Too many replies");
  await writeJson(`${id}/replies.json`, [...replies, { ...reply, at: new Date().toISOString() }]);
  return record;
}

/** The owner's report branding for the page, or null if they haven't set it up; plus their account email */
export async function shareOwner(ownerId: string): Promise<{ brand: ShareBrand | null; email: string | null }> {
  const svc = createSupabaseServiceRoleClient();
  const { data } = await svc.auth.admin.getUserById(ownerId);
  const user = data?.user;
  if (!user) return { brand: null, email: null };
  const b = user.app_metadata?.brand as (Omit<ShareBrand, "logoUrl"> & { hasLogo?: boolean }) | undefined;
  if (!b?.businessName) return { brand: null, email: user.email ?? null };
  const logoUrl = b.hasLogo ? (await svc.storage.from("brands").createSignedUrl(`${ownerId}/logo.png`, 60 * 60 * 6)).data?.signedUrl ?? null : null;
  return {
    brand: { businessName: b.businessName, phone: b.phone ?? null, email: b.email ?? null, website: b.website ?? null, licence: b.licence ?? null, accent: b.accent ?? null, logoUrl },
    email: user.email ?? null,
  };
}

/** Deletes a share if it belongs to ownerId */
export async function deleteShare(ownerId: string, id: string): Promise<boolean> {
  if (!isShareId(id)) return false;
  const store = await bucket();
  const { data } = await store.download(`${id}/share.json`);
  if (!data) return false;
  const record = JSON.parse(await data.text()) as ShareRecord;
  if (record.ownerId !== ownerId) return false;
  await store.remove([`${id}/share.json`, `${id}/after.jpg`, `${id}/before.jpg`, `${id}/replies.json`, `owners/${ownerId}/${id}`]);
  return true;
}
