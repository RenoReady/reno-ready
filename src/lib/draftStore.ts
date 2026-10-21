/**
 * Drafts — in-progress designs saved to the user's account (server only).
 *
 * Stored in the private `drafts` Storage bucket (created on first use, so no
 * SQL migration is needed):
 *   <user_id>/<draft_id>/draft.json   choices + summary (DraftRecord)
 *   <user_id>/<draft_id>/photo.jpg    the room photo
 *   <user_id>/<draft_id>/render.jpg   the latest AI render, once there is one
 *
 * Each account keeps its most recent MAX_DRAFTS drafts.
 */

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { estimateFromSnapshot } from "@/lib/projectEstimate";

export const DRAFTS_BUCKET = "drafts";
export const MAX_DRAFTS = 12;
const MAX_IMAGE_BYTES = 3_500_000;
const SIGNED_URL_SECONDS = 60 * 60;

export interface DraftRecord {
  id:          string;
  roomType:    "bathroom" | "kitchen" | "bedroom";
  title:       string;
  updatedAt:   string;
  createdAt:   string;
  hasPhoto:    boolean;
  hasRender:   boolean;
  /** Estimate shown in the builder once a preview exists, e.g. "$18,500–$21,000" */
  estimate:    string | null;
  description: string | null;
  /** Counted in the whole-home project total. Unset = included once it has a render. */
  inProject?:  boolean;
  snapshot:    Record<string, unknown>;
}

/** Summary for lists — no snapshot, with short-lived image links */
export interface DraftSummary extends Omit<DraftRecord, "snapshot" | "inProject"> {
  thumbUrl: string | null;
  inProject: boolean;
  /** Priced from the draft's choices (null when it can't be) */
  estimateTotal: number | null;
  estimateLow:   number | null;
  estimateHigh:  number | null;
}

export function isDraftId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9-]{8,48}$/.test(id);
}

let bucketReady = false;
async function bucket() {
  const svc = createSupabaseServiceRoleClient();
  if (!bucketReady) {
    const { data } = await svc.storage.getBucket(DRAFTS_BUCKET);
    if (!data) {
      const { error } = await svc.storage.createBucket(DRAFTS_BUCKET, { public: false });
      if (error && !/already exists/i.test(error.message)) throw new Error(`drafts bucket: ${error.message}`);
    }
    bucketReady = true;
  }
  return svc.storage.from(DRAFTS_BUCKET);
}

function decodeImage(dataUrl: unknown): Buffer | null {
  if (typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  return buf.length > 0 && buf.length <= MAX_IMAGE_BYTES ? buf : null;
}

async function readRecord(userId: string, id: string): Promise<DraftRecord | null> {
  const { data, error } = await (await bucket()).download(`${userId}/${id}/draft.json`);
  if (error || !data) return null;
  try { return JSON.parse(await data.text()) as DraftRecord; } catch { return null; }
}

/** Creates or updates a draft. Images are only re-uploaded when sent. */
export async function saveDraft(userId: string, input: {
  id: string;
  roomType: DraftRecord["roomType"];
  title?: string;
  estimate?: string | null;
  description?: string | null;
  snapshot: Record<string, unknown>;
  photo?: string | null;     // data URL, or null to remove, or undefined to keep
  render?: string | null;
}): Promise<DraftRecord> {
  const store = await bucket();
  const base = `${userId}/${input.id}`;
  const prev = await readRecord(userId, input.id);

  let hasPhoto = prev?.hasPhoto ?? false;
  let hasRender = prev?.hasRender ?? false;
  for (const [field, name] of [["photo", "photo.jpg"], ["render", "render.jpg"]] as const) {
    const value = input[field];
    if (value === undefined) continue;
    if (value === null) {
      await store.remove([`${base}/${name}`]);
      if (field === "photo") hasPhoto = false; else hasRender = false;
      continue;
    }
    const buf = decodeImage(value);
    if (!buf) throw new Error(`Invalid ${field} image`);
    const { error } = await store.upload(`${base}/${name}`, buf, { contentType: "image/jpeg", upsert: true, cacheControl: "0" });
    if (error) throw new Error(`Couldn't save the ${field}: ${error.message}`);
    if (field === "photo") hasPhoto = true; else hasRender = true;
  }

  const now = new Date().toISOString();
  const record: DraftRecord = {
    id:          input.id,
    roomType:    input.roomType,
    title:       (input.title ?? prev?.title ?? "").slice(0, 80) || defaultTitle(input.roomType),
    createdAt:   prev?.createdAt ?? now,
    updatedAt:   now,
    hasPhoto,
    hasRender,
    estimate:    input.estimate === undefined ? prev?.estimate ?? null : input.estimate,
    description: input.description === undefined ? prev?.description ?? null : input.description?.slice(0, 2_000) ?? null,
    ...(prev?.inProject !== undefined && { inProject: prev.inProject }),
    snapshot:    input.snapshot,
  };
  const { error } = await store.upload(`${base}/draft.json`, Buffer.from(JSON.stringify(record)), { contentType: "application/json", upsert: true, cacheControl: "0" });
  if (error) throw new Error(`Couldn't save the draft: ${error.message}`);

  if (!prev) await pruneDrafts(userId);
  return record;
}

function defaultTitle(room: DraftRecord["roomType"]): string {
  return `${room[0].toUpperCase()}${room.slice(1)} design`;
}

async function draftIds(userId: string): Promise<string[]> {
  const { data } = await (await bucket()).list(userId, { limit: 100 });
  return (data ?? []).map((f) => f.name).filter(isDraftId);
}

/** All of a user's drafts, newest first */
export async function listDrafts(userId: string): Promise<DraftSummary[]> {
  const ids = await draftIds(userId);
  const records = (await Promise.all(ids.map((id) => readRecord(userId, id)))).filter((r): r is DraftRecord => !!r);
  records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const thumbs = records.map((r) => (r.hasRender ? `${userId}/${r.id}/render.jpg` : r.hasPhoto ? `${userId}/${r.id}/photo.jpg` : null));
  const paths = thumbs.filter((p): p is string => !!p);
  const signed = paths.length ? (await (await bucket()).createSignedUrls(paths, SIGNED_URL_SECONDS)).data ?? [] : [];
  const urlFor = new Map(signed.map((s) => [s.path, s.signedUrl]));

  return records.map(({ snapshot, inProject, ...r }, i) => {
    const est = estimateFromSnapshot(r.roomType, snapshot);
    return {
      ...r,
      thumbUrl: thumbs[i] ? urlFor.get(thumbs[i]!) ?? null : null,
      inProject: inProject ?? r.hasRender,
      estimateTotal: est?.total || null, estimateLow: est?.low || null, estimateHigh: est?.high || null,
    };
  });
}

/** Adds a draft to, or takes it out of, the whole-home project */
export async function setDraftInProject(userId: string, id: string, inProject: boolean): Promise<boolean> {
  const record = await readRecord(userId, id);
  if (!record) return false;
  const { error } = await (await bucket()).upload(`${userId}/${id}/draft.json`, Buffer.from(JSON.stringify({ ...record, inProject })), { contentType: "application/json", upsert: true, cacheControl: "0" });
  return !error;
}

/** One draft with links to its photo and render */
export async function getDraft(userId: string, id: string): Promise<(DraftRecord & { photoUrl: string | null; renderUrl: string | null }) | null> {
  const record = await readRecord(userId, id);
  if (!record) return null;
  const store = await bucket();
  const sign = async (name: string, has: boolean) =>
    has ? (await store.createSignedUrl(`${userId}/${id}/${name}`, SIGNED_URL_SECONDS)).data?.signedUrl ?? null : null;
  return { ...record, photoUrl: await sign("photo.jpg", record.hasPhoto), renderUrl: await sign("render.jpg", record.hasRender) };
}

export async function deleteDraft(userId: string, id: string): Promise<void> {
  await (await bucket()).remove([`${userId}/${id}/draft.json`, `${userId}/${id}/photo.jpg`, `${userId}/${id}/render.jpg`]);
}

/** Keeps the newest MAX_DRAFTS */
async function pruneDrafts(userId: string): Promise<void> {
  const all = await listDrafts(userId);
  await Promise.all(all.slice(MAX_DRAFTS).map((d) => deleteDraft(userId, d.id)));
}
