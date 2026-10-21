/**
 * Self-serve account deletion (server only).
 *
 * Removes everything stored against the account:
 *   generations/<uid>/…   AI renders and 4K exports
 *   drafts/<uid>/…        drafts (choices, room photos, renders)
 *   shares                the user's client share links
 *   leads                 builder briefs they sent
 *   brands/<uid>/…        report branding logo
 *   auth user             which cascades to profiles + generations rows
 *
 * An active Pro subscription is cancelled first, so nobody is charged after
 * deleting. Stripe's own payment records are kept (tax law), as the privacy
 * policy says.
 */

import Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";

type Storage = ReturnType<typeof createSupabaseServiceRoleClient>["storage"];

/** Every object under a folder, however deep */
async function listAll(storage: Storage, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) {
    if (/not found/i.test(error.message)) return out;   // bucket never created
    throw new Error(`${bucket}: ${error.message}`);
  }
  for (const item of data ?? []) {
    const path = `${prefix}/${item.name}`;
    if (item.id === null) out.push(...(await listAll(storage, bucket, path)));   // a folder
    else out.push(path);
  }
  return out;
}

async function removeAll(storage: Storage, bucket: string, paths: string[]): Promise<number> {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await storage.from(bucket).remove(paths.slice(i, i + 100));
    if (error && !/not found/i.test(error.message)) throw new Error(`${bucket}: ${error.message}`);
  }
  return paths.length;
}

/** Items saved per-id (shares, leads) and listed under owners/<uid>/<id> */
async function removeOwned(storage: Storage, bucket: string, userId: string, files: string[]): Promise<number> {
  const markers = await listAll(storage, bucket, `owners/${userId}`);
  const ids = markers.map((m) => m.split("/").pop()!).filter(Boolean);
  return removeAll(storage, bucket, [...ids.flatMap((id) => files.map((f) => `${id}/${f}`)), ...markers]);
}

export async function cancelSubscriptions(customerId: string | null): Promise<number> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!customerId || !key) return 0;
  const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  let n = 0;
  for (const status of ["active", "trialing", "past_due"] as const) {
    for (const sub of (await stripe.subscriptions.list({ customer: customerId, status, limit: 20 })).data) {
      await stripe.subscriptions.cancel(sub.id);
      n++;
    }
  }
  return n;
}

/** Removes every stored file belonging to a user; returns how many */
export async function deleteStoredFiles(uid: string): Promise<number> {
  const storage = createSupabaseServiceRoleClient().storage;
  let files = 0;
  files += await removeAll(storage, "generations", await listAll(storage, "generations", uid));
  files += await removeAll(storage, "drafts", await listAll(storage, "drafts", uid));
  files += await removeAll(storage, "brands", await listAll(storage, "brands", uid));
  files += await removeOwned(storage, "shares", uid, ["share.json", "after.jpg", "before.jpg"]);
  files += await removeOwned(storage, "leads", uid, ["lead.json", "report.pdf", "render.jpg"]);
  return files;
}

export interface DeletionSummary { files: number; subscriptionsCancelled: number }

export async function deleteAccount(user: User): Promise<DeletionSummary> {
  if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) throw new Error("The admin account can't be deleted from here.");
  const svc = createSupabaseServiceRoleClient();
  const uid = user.id;

  // 1. stop billing before anything else
  const { data: profile } = await svc.from("profiles").select("stripe_customer_id").eq("id", uid).single();
  const subscriptionsCancelled = await cancelSubscriptions((profile?.stripe_customer_id as string | null) ?? null);

  // 2. stored files
  const files = await deleteStoredFiles(uid);

  // 3. the account itself (profiles + generations rows go with it)
  const { error } = await svc.auth.admin.deleteUser(uid);
  if (error) throw new Error(`Couldn't delete the account: ${error.message}`);
  return { files, subscriptionsCancelled };
}
