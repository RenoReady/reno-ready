"use client";

/**
 * Drafts (browser side).
 *
 * Two layers, so nothing is lost:
 *  - Local: the design in progress is autosaved to IndexedDB on this device a
 *    moment after every change. It survives closed tabs, crashes, power cuts
 *    and the Google sign-in redirect, even before the person has an account.
 *  - Account: once signed in, the same draft is synced to /api/drafts (a few
 *    seconds after changes, and straight away after a new render), so it is
 *    on every device and listed on the My Account page.
 */

import { useEffect, useRef } from "react";
import { useBuilderStore, builderSnapshot, applyBuilderSnapshot } from "@/lib/store";
import { toJpeg } from "@/lib/watermark";
import type { RoomType } from "@/lib/roomTypes";

export interface LocalDraft {
  id:          string;
  roomType:    RoomType;
  snapshot:    Record<string, unknown>;
  photo:       string | null;
  render:      string | null;
  description: string | null;
  estimate:    string | null;
  updatedAt:   number;
}

export interface DraftSummary {
  id: string; roomType: RoomType; title: string; updatedAt: string; createdAt: string;
  hasPhoto: boolean; hasRender: boolean; estimate: string | null; thumbUrl: string | null;
  /** Counted in the whole-home project total */
  inProject: boolean;
  estimateTotal: number | null; estimateLow: number | null; estimateHigh: number | null;
}

/** Adds a draft to, or takes it out of, the whole-home project */
export async function setDraftInProject(id: string, inProject: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/drafts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inProject }) });
    return res.ok;
  } catch { return false; }
}

// ── Current draft id ───────────────────────────────────────────────
const ID_KEY = "reno_ready_draft_id";

export function newDraftId(): string {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return rand.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 36);
}

export function currentDraftId(): string {
  try {
    const id = localStorage.getItem(ID_KEY);
    if (id) return id;
    const fresh = newDraftId();
    localStorage.setItem(ID_KEY, fresh);
    return fresh;
  } catch { return newDraftId(); }
}

function setCurrentDraftId(id: string) {
  try { localStorage.setItem(ID_KEY, id); } catch { /* private mode */ }
}

// ── IndexedDB (one "current" draft per device) ─────────────────────
const DB = "reno-ready", STORE = "drafts", CURRENT = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
}

export async function loadLocalDraft(): Promise<LocalDraft | null> {
  try { return (await idb<LocalDraft | undefined>("readonly", (s) => s.get(CURRENT))) ?? null; } catch { return null; }
}

async function saveLocalDraft(d: LocalDraft): Promise<void> {
  try { await idb("readwrite", (s) => s.put(d, CURRENT)); } catch { /* storage blocked: account sync still works */ }
}

export async function clearLocalDraft(): Promise<void> {
  try { await idb("readwrite", (s) => s.delete(CURRENT)); } catch { /* nothing to clear */ }
}

/** A draft worth offering back: it has a photo or a render */
export function isResumable(d: LocalDraft | null): d is LocalDraft {
  return !!d && (!!d.photo || !!d.render);
}

// ── Account sync ───────────────────────────────────────────────────

/** Which images the account copy already has, so they aren't re-sent */
const sent = new Map<string, { photo: string | null; render: string | null }>();
const fingerprint = (url: string | null) => (url ? `${url.length}:${url.slice(-48)}` : null);

async function pushDraft(d: LocalDraft): Promise<boolean> {
  const prev = sent.get(d.id);
  const photoFp = fingerprint(d.photo), renderFp = fingerprint(d.render);
  const body: Record<string, unknown> = {
    id: d.id, roomType: d.roomType, snapshot: d.snapshot,
    estimate: d.estimate, description: d.description,
  };
  if (!prev || prev.photo !== photoFp) body.photo = d.photo ? await toJpeg(d.photo, 0.85) : null;
  if (!prev || prev.render !== renderFp) body.render = d.render ? await toJpeg(d.render, 0.88) : null;
  try {
    const res = await fetch("/api/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return false;
    sent.set(d.id, { photo: photoFp, render: renderFp });
    return true;
  } catch { return false; }
}

export async function listAccountDrafts(): Promise<DraftSummary[] | null> {
  try {
    const res = await fetch("/api/drafts", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()).drafts as DraftSummary[];
  } catch { return null; }
}

export async function deleteAccountDraft(id: string): Promise<boolean> {
  try { return (await fetch(`/api/drafts/${id}`, { method: "DELETE" })).ok; } catch { return false; }
}

async function asDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

/** Downloads one of the account's drafts, ready to load into the builder */
export async function fetchAccountDraft(id: string): Promise<LocalDraft | null> {
  try {
    const res = await fetch(`/api/drafts/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const d = (await res.json()).draft;
    const [photo, render] = await Promise.all([asDataUrl(d.photoUrl), asDataUrl(d.renderUrl)]);
    sent.set(d.id, { photo: fingerprint(photo), render: fingerprint(render) });
    return { id: d.id, roomType: d.roomType, snapshot: d.snapshot, photo, render, description: d.description, estimate: d.estimate, updatedAt: Date.parse(d.updatedAt) };
  } catch { return null; }
}

// ── Loading a draft into the builder ───────────────────────────────

/** Puts a draft into the builder and makes it the one being autosaved */
export function applyDraft(d: LocalDraft): void {
  applyBuilderSnapshot({ ...d.snapshot, roomType: d.roomType, roomConfirmed: true });
  const st = useBuilderStore.getState();
  if (d.photo) st.setRoomPhotoUrl(d.photo);
  st.setGeneratedImageUrl(d.render);
  st.setGenerateDescription(d.description);
  setCurrentDraftId(d.id);
  handoff = null;
}

/**
 * Hand-off for loading a draft on another room's page. Kept in memory (it
 * survives client-side navigation) because the new page can run before the
 * address bar shows the new query string.
 */
let handoff: { local: true } | { accountId: string } | null = null;
export function setDraftHandoff(h: typeof handoff) { handoff = h; }
/** Read without clearing; applyDraft clears it once the draft is loaded */
export function peekDraftHandoff(): typeof handoff { return handoff; }

/** "Start new": forget the device's draft and begin a fresh one (account drafts stay) */
export async function startNewDraft(): Promise<void> {
  await clearLocalDraft();
  setCurrentDraftId(newDraftId());
}

// ── Autosave ───────────────────────────────────────────────────────

const LOCAL_DELAY = 1_200, ACCOUNT_DELAY = 5_000;

/**
 * Autosaves the builder while `enabled`. `signedIn` turns on account sync;
 * `meta()` adds the current estimate (only shown once there is a preview).
 */
export function useDraftAutosave(enabled: boolean, signedIn: boolean, meta: () => { estimate: string | null }) {
  const metaRef = useRef(meta);
  metaRef.current = meta;

  useEffect(() => {
    if (!enabled) return;
    let localTimer: ReturnType<typeof setTimeout> | undefined;
    let accountTimer: ReturnType<typeof setTimeout> | undefined;
    let lastRender = useBuilderStore.getState().generatedImageUrl;

    const build = (): LocalDraft | null => {
      const st = useBuilderStore.getState();
      if (!st.roomPhotoUrl && !st.generatedImageUrl) return null;   // nothing worth keeping yet
      return {
        id: currentDraftId(), roomType: st.roomType, snapshot: builderSnapshot(),
        photo: st.roomPhotoUrl, render: st.generatedImageUrl, description: st.generateDescription,
        estimate: metaRef.current().estimate, updatedAt: Date.now(),
      };
    };
    const syncAccount = () => { const d = build(); if (d && signedIn) void pushDraft(d); };

    let lastRoom = useBuilderStore.getState().roomType;

    const unsubscribe = useBuilderStore.subscribe((st) => {
      // A different room ("Add another room") is a new draft, not an overwrite.
      // applyDraft sets its own id straight after, so loading a draft keeps it.
      if (st.roomType !== lastRoom) {
        lastRoom = st.roomType;
        if (!st.roomPhotoUrl) setCurrentDraftId(newDraftId());
      }
      clearTimeout(localTimer);
      localTimer = setTimeout(() => { const d = build(); if (d) void saveLocalDraft(d); }, LOCAL_DELAY);
      if (!signedIn) return;
      clearTimeout(accountTimer);
      // a new render is saved to the account right away
      if (st.generatedImageUrl && st.generatedImageUrl !== lastRender) {
        lastRender = st.generatedImageUrl;
        syncAccount();
      } else {
        accountTimer = setTimeout(syncAccount, ACCOUNT_DELAY);
      }
    });

    // Just signed in with a design already going: copy it to the account
    if (signedIn) syncAccount();

    const flush = () => { const d = build(); if (d) void saveLocalDraft(d); };
    window.addEventListener("pagehide", flush);
    return () => {
      unsubscribe();
      clearTimeout(localTimer);
      clearTimeout(accountTimer);
      window.removeEventListener("pagehide", flush);
    };
  }, [enabled, signedIn]);
}
