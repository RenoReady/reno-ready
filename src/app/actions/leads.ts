"use server";

/**
 * Lead pipeline actions for the admin dashboard.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";
import { setLeadStatus, type LeadStatus } from "@/lib/leadStore";

/** Moves a builder brief through new → contacted → quoted → won / lost (admin only) */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return { ok: false, error: "Not allowed" };
  const ok = await setLeadStatus(id, status).catch(() => false);
  return ok ? { ok: true } : { ok: false, error: "Couldn't update that lead" };
}
