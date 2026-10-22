/**
 * "Where customers come from" for the admin dashboard (server only):
 * sign-ups, paying customers and revenue per source / campaign, from the
 * attribution saved on each account at sign-up (see lib/attribution.ts) and
 * the account's real Stripe payments.
 */

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { netByCustomer } from "@/lib/stripeRevenue";
import type { Attribution } from "@/lib/attribution";

/** Accounts created before this have no recorded source */
export const TRACKING_STARTED = "2026-10-22";

export interface SourceRow {
  source:   string;
  medium:   string | null;
  campaign: string | null;
  signups:  number;
  /** accounts with any net payment */
  paying:   number;
  /** cents, after refunds */
  revenue:  number;
}

export async function sourceReport(excludeEmail: string): Promise<{ rows: SourceRow[]; revenueError: string | null }> {
  const svc = createSupabaseServiceRoleClient();
  const users = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const [{ data: profiles }, net] = await Promise.all([
    svc.from("profiles").select("id, stripe_customer_id"),
    netByCustomer(excludeEmail),
  ]);
  const customerOf = new Map((profiles ?? []).map((p) => [p.id as string, p.stripe_customer_id as string | null]));
  const revenueError = "error" in net ? net.error : null;
  const started = Date.parse(TRACKING_STARTED);

  const rows = new Map<string, SourceRow>();
  for (const u of users) {
    if (u.email?.toLowerCase() === excludeEmail.toLowerCase()) continue;
    const a = u.app_metadata?.attribution as Attribution | undefined;
    const src = a ?? { source: Date.parse(u.created_at) < started ? "(before tracking)" : "direct", medium: null, campaign: null };
    const key = [src.source, src.medium ?? "", src.campaign ?? ""].join("|");
    const row = rows.get(key) ?? { source: src.source, medium: src.medium ?? null, campaign: src.campaign ?? null, signups: 0, paying: 0, revenue: 0 };
    const customer = customerOf.get(u.id);
    const paid = customer && !("error" in net) ? net.get(customer) ?? 0 : 0;
    row.signups += 1;
    if (paid > 0) { row.paying += 1; row.revenue += paid; }
    rows.set(key, row);
  }
  // best earners first; accounts from before tracking always last
  const sorted = [...rows.values()].sort((x, y) =>
    Number(x.source === "(before tracking)") - Number(y.source === "(before tracking)") || y.revenue - x.revenue || y.signups - x.signups);
  return { rows: sorted, revenueError };
}
