/**
 * Builder briefs ("leads") — server only.
 *
 * Every brief sent from /connect is saved here before it's emailed, so a lead
 * is never lost if the email fails, the admin dashboard can list and track
 * them, and the customer can see what they sent on My Account.
 *
 * Private `leads` Storage bucket (created on first use, no SQL needed):
 *   <id>/lead.json          LeadRecord
 *   <id>/report.pdf         the Pro Report built for the builder
 *   <id>/render.jpg         the AI render (thumbnail)
 *   owners/<user_id>/<id>   marker, when the sender was signed in
 *
 * Ids start with a base-36 timestamp, so sorting by name newest-first works.
 */

import { randomBytes } from "node:crypto";
import { createSupabaseServiceRoleClient, readStorageJson } from "@/lib/supabase/server";

export const LEADS_BUCKET = "leads";
export const LEAD_STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadRecord {
  id:         string;
  createdAt:  string;
  userId:     string | null;
  name:       string;
  email:      string;
  phone:      string | null;
  address:    string | null;
  timeline:   string | null;
  message:    string | null;
  room:       string;
  estimate:   number;
  budget:     number | null;
  rows:       { label: string; value: string }[];
  structural: string[];
  designNote: string | null;
  status:     LeadStatus;
  emailed:    boolean;
  hasReport:  boolean;
  hasRender:  boolean;
}

export interface LeadWithLinks extends LeadRecord {
  reportUrl: string | null;
  renderUrl: string | null;
}

export function isLeadId(id: unknown): id is string {
  return typeof id === "string" && /^[0-9a-z]{6,12}-[A-Za-z0-9_-]{8}$/.test(id);
}

let bucketReady = false;
async function bucket() {
  const svc = createSupabaseServiceRoleClient();
  if (!bucketReady) {
    const { data } = await svc.storage.getBucket(LEADS_BUCKET);
    if (!data) {
      const { error } = await svc.storage.createBucket(LEADS_BUCKET, { public: false });
      if (error && !/already exists/i.test(error.message)) throw new Error(`leads bucket: ${error.message}`);
    }
    bucketReady = true;
  }
  return svc.storage.from(LEADS_BUCKET);
}

/** Saves a new brief and returns its id */
export async function saveLead(
  input: Omit<LeadRecord, "id" | "createdAt" | "status" | "emailed" | "hasReport" | "hasRender">,
  files: { pdf?: Buffer | null; renderJpeg?: string | null },
): Promise<string> {
  const store = await bucket();
  const id = `${Date.now().toString(36)}-${randomBytes(6).toString("base64url")}`;
  const jpeg = files.renderJpeg?.match(/^data:image\/jpeg;base64,(.+)$/)?.[1];

  let hasReport = false, hasRender = false;
  if (files.pdf) hasReport = !(await store.upload(`${id}/report.pdf`, files.pdf, { contentType: "application/pdf" })).error;
  if (jpeg) hasRender = !(await store.upload(`${id}/render.jpg`, Buffer.from(jpeg, "base64"), { contentType: "image/jpeg" })).error;

  const record: LeadRecord = { ...input, id, createdAt: new Date().toISOString(), status: "new", emailed: false, hasReport, hasRender };
  const { error } = await store.upload(`${id}/lead.json`, Buffer.from(JSON.stringify(record)), { contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(`couldn't save lead: ${error.message}`);
  if (input.userId) await store.upload(`owners/${input.userId}/${id}`, Buffer.from(""), { contentType: "text/plain" });
  return id;
}

// always fresh: a lead is rewritten when its status changes, and the Storage CDN can serve the old copy
async function readLead(id: string): Promise<LeadRecord | null> {
  return readStorageJson<LeadRecord>(LEADS_BUCKET, `${id}/lead.json`);
}

async function writeLead(record: LeadRecord): Promise<void> {
  const { error } = await (await bucket()).upload(`${record.id}/lead.json`, Buffer.from(JSON.stringify(record)), { contentType: "application/json", upsert: true, cacheControl: "0" });
  if (error) throw new Error(error.message);
}

export async function markLeadEmailed(id: string, emailed: boolean): Promise<void> {
  const lead = await readLead(id);
  if (lead) await writeLead({ ...lead, emailed });
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  if (!isLeadId(id) || !LEAD_STATUSES.includes(status)) return false;
  const lead = await readLead(id);
  if (!lead) return false;
  await writeLead({ ...lead, status });
  return true;
}

async function withLinks(leads: LeadRecord[]): Promise<LeadWithLinks[]> {
  if (!leads.length) return [];
  const store = await bucket();
  const paths = leads.flatMap((l) => [l.hasReport ? `${l.id}/report.pdf` : null, l.hasRender ? `${l.id}/render.jpg` : null]).filter((p): p is string => !!p);
  const signed = paths.length ? (await store.createSignedUrls(paths, 60 * 60)).data ?? [] : [];
  const url = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return leads.map((l) => ({ ...l, reportUrl: url.get(`${l.id}/report.pdf`) ?? null, renderUrl: url.get(`${l.id}/render.jpg`) ?? null }));
}

/** All briefs, newest first (admin) */
export async function listLeads(limit = 200): Promise<LeadWithLinks[]> {
  const store = await bucket();
  const { data } = await store.list("", { limit: 1000, sortBy: { column: "name", order: "desc" } });
  const ids = (data ?? []).map((f) => f.name).filter(isLeadId).slice(0, limit);
  const leads = (await Promise.all(ids.map(readLead))).filter((l): l is LeadRecord => !!l);
  return withLinks(leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

/** One customer's briefs, newest first */
export async function listLeadsFor(userId: string): Promise<LeadWithLinks[]> {
  const { data } = await (await bucket()).list(`owners/${userId}`, { limit: 200 });
  const ids = (data ?? []).map((f) => f.name).filter(isLeadId);
  const leads = (await Promise.all(ids.map(readLead))).filter((l): l is LeadRecord => !!l && l.userId === userId);
  return withLinks(leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
