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
 *   <id>/opt-<n>.jpg         when several options are shared (opt-0 is also after.jpg)
 *   <id>/replies.json        ShareReply[]: the client approving it or asking a question
 *   owners/<user_id>/<id>    empty marker, so an owner can list and delete theirs
 *
 * Ids are 12 random URL-safe characters, so links can't be guessed.
 *
 * The page shows the owner's report branding (looked up live, so links stay
 * current when they change it) and lets the client reply to them.
 */

import { randomBytes } from "node:crypto";
import { createSupabaseServiceRoleClient, readStorageJson } from "@/lib/supabase/server";

export const SHARES_BUCKET = "shares";
export const MAX_SHARES_PER_USER = 100;
export const MAX_REPLIES_PER_SHARE = 20;
export const MAX_SHARE_OPTIONS = 4;
/** Every file a share can have, for clean-up */
export const SHARE_FILES = ["share.json", "after.jpg", "before.jpg", "replies.json", ...Array.from({ length: MAX_SHARE_OPTIONS }, (_, i) => `opt-${i}.jpg`)];
const MAX_IMAGE_BYTES = 4_000_000;

export interface ShareReply {
  kind:    "approve" | "question";
  /** Which option they were looking at, when several were shared (e.g. "B1") */
  option?: string | null;
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
  /** Labels of the options when several were shared, in order (opt-0.jpg, opt-1.jpg…) */
  options?:   string[];
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
  after?: unknown;
  before?: unknown;
  /** Several takes for the client to choose between: [{ label, image }] */
  options?: unknown;
}): Promise<ShareRecord> {
  const options = Array.isArray(input.options)
    ? input.options.slice(0, MAX_SHARE_OPTIONS).map((o) => ({
        label: typeof o?.label === "string" ? o.label.trim().slice(0, 8) : "",
        image: jpeg(o?.image),
      }))
    : [];
  if (options.some((o) => !o.label || !o.image)) throw new Error("Invalid option");
  const after = options[0]?.image ?? jpeg(input.after);
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
    ...(options.length > 1 && { options: options.map((o) => o.label) }),
  };

  const store = await bucket();
  const put = async (path: string, body: Buffer, contentType: string, cacheControl?: string) => {
    const { error } = await store.upload(path, body, { contentType, upsert: false, ...(cacheControl && { cacheControl }) });
    if (error) throw new Error(`Couldn't save the share: ${error.message}`);
  };
  await put(`${id}/after.jpg`, after, "image/jpeg");
  if (before) await put(`${id}/before.jpg`, before, "image/jpeg");
  if (options.length > 1) await Promise.all(options.map((o, i) => put(`${id}/opt-${i}.jpg`, o.image!, "image/jpeg")));
  // uncached: it's rewritten when the client first opens it
  await put(`${id}/share.json`, Buffer.from(JSON.stringify(record)), "application/json", "0");
  await put(`owners/${ownerId}/${id}`, Buffer.from(""), "text/plain");
  return record;
}

export async function getShare(id: string): Promise<(ShareRecord & { afterUrl: string; beforeUrl: string | null; optionUrls: { label: string; url: string }[] }) | null> {
  if (!isShareId(id)) return null;
  const store = await bucket();
  const record = await readJson<ShareRecord>(`${id}/share.json`);
  if (!record) return null;
  const sign = async (name: string) => (await store.createSignedUrl(`${id}/${name}`, 60 * 60 * 6)).data?.signedUrl ?? null;
  const afterUrl = await sign("after.jpg");
  if (!afterUrl) return null;
  const optionUrls = (await Promise.all((record.options ?? []).map(async (label, i) => ({ label, url: await sign(`opt-${i}.jpg`) }))))
    .filter((o): o is { label: string; url: string } => !!o.url);
  return { ...record, afterUrl, beforeUrl: record.hasBefore ? await sign("before.jpg") : null, optionUrls };
}

// always fresh: share.json and replies.json are rewritten, and the Storage CDN can serve the old copy
const readJson = <T>(path: string) => readStorageJson<T>(SHARES_BUCKET, path);

// cacheControl "0" too, so browsers and signed URLs never hold an old copy
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

export interface ShareActivity {
  links: number; opened: number; approved: number; questions: number; withOptions: number;
  byOwner: { ownerId: string; links: number; opened: number; approved: number; questions: number; lastSharedAt: string }[];
}

/** Admin dashboard: how Pro users' client links are doing (sent, opened, approved), skipping excluded owners */
export async function shareActivity(excludeOwnerIds: string[] = []): Promise<ShareActivity> {
  const store = await bucket();
  const { data: owners } = await store.list("owners", { limit: 1000 });
  const ownerIds = (owners ?? []).map((o) => o.name).filter((id) => !excludeOwnerIds.includes(id));
  const out: ShareActivity = { links: 0, opened: 0, approved: 0, questions: 0, withOptions: 0, byOwner: [] };
  await Promise.all(ownerIds.map(async (ownerId) => {
    const ids = await ownedIds(ownerId);
    const shares = await Promise.all(ids.map(async (id) => ({
      record: await readJson<ShareRecord>(`${id}/share.json`),
      replies: (await readJson<ShareReply[]>(`${id}/replies.json`)) ?? [],
    })));
    const row = { ownerId, links: 0, opened: 0, approved: 0, questions: 0, lastSharedAt: "" };
    for (const { record, replies } of shares) {
      if (!record || record.ownerId !== ownerId) continue;
      row.links++;
      if (record.firstViewedAt) row.opened++;
      if (replies.some((r) => r.kind === "approve")) row.approved++;
      row.questions += replies.filter((r) => r.kind === "question").length;
      if ((record.options?.length ?? 0) > 1) out.withOptions++;
      if (record.createdAt > row.lastSharedAt) row.lastSharedAt = record.createdAt;
    }
    if (!row.links) return;
    out.links += row.links; out.opened += row.opened; out.approved += row.approved; out.questions += row.questions;
    out.byOwner.push(row);
  }));
  out.byOwner.sort((a, b) => b.links - a.links || b.lastSharedAt.localeCompare(a.lastSharedAt));
  return out;
}

/** Records the first time someone other than the owner opens the link */
export async function markShareViewed(id: string): Promise<void> {
  const record = await readJson<ShareRecord>(`${id}/share.json`);
  if (!record || record.firstViewedAt) return;
  await writeJson(`${id}/share.json`, { ...record, firstViewedAt: new Date().toISOString() });
}

/** A link's client replies, oldest first */
export async function shareReplies(id: string): Promise<ShareReply[]> {
  if (!isShareId(id)) return [];
  return (await readJson<ShareReply[]>(`${id}/replies.json`)) ?? [];
}

/** The client's latest approval, if they've approved */
export const latestApproval = (replies: ShareReply[]) => replies.filter((r) => r.kind === "approve").at(-1) ?? null;

/** Saves a client's reply; returns the share so the caller can notify its owner */
export async function addShareReply(id: string, reply: Omit<ShareReply, "at">): Promise<ShareRecord> {
  if (!isShareId(id)) throw new Error("Not found");
  const record = await readJson<ShareRecord>(`${id}/share.json`);
  if (!record) throw new Error("Not found");
  const replies = (await readJson<ShareReply[]>(`${id}/replies.json`)) ?? [];
  if (replies.length >= MAX_REPLIES_PER_SHARE) throw new Error("Too many replies");
  // only keep an option label that was actually shared
  const option = reply.option && record.options?.includes(reply.option) ? reply.option : null;
  await writeJson(`${id}/replies.json`, [...replies, { ...reply, option, at: new Date().toISOString() }]);
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
  const record = await readJson<ShareRecord>(`${id}/share.json`);
  if (!record || record.ownerId !== ownerId) return false;
  await store.remove([...SHARE_FILES.map((f) => `${id}/${f}`), `owners/${ownerId}/${id}`]);
  return true;
}
