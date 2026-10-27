/**
 * "Your design is waiting" reminder emails (server only).
 *
 * Once a day (Vercel Cron → /api/cron/draft-reminders) we look for signed-in
 * users who left a design 1–7 days ago and haven't come back to it or sent it
 * to a builder, and email them a link straight back to it.
 *
 * Guard rails:
 *  - at most one reminder per draft, and one email per person per 7 days
 *  - never after they've sent a builder brief for it
 *  - honours the unsubscribe switch (app_metadata.emailPrefs.reminders === false)
 *  - only sends from a verified domain (RESEND_FROM_EMAIL), so it never
 *    falls back to Resend's test sender
 *
 * Unsubscribe links carry an HMAC of the user id, so they work without
 * signing in and can't be forged for someone else.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, RESEND_FROM } from "@/lib/config";
import { draftOwners, listDrafts, markDraftReminded, draftImageLink, type DraftSummary } from "@/lib/draftStore";
import { listLeadsFor } from "@/lib/leadStore";
import { formatAUD } from "@/lib/utils";

const SITE = "https://www.renoready.com.au";
const DAY = 86_400_000;
const MIN_IDLE = 1 * DAY, MAX_IDLE = 7 * DAY, PER_PERSON_GAP = 7 * DAY;
const MAX_PER_RUN = 50;

// ── Preferences ───────────────────────────────────────────────────

export function remindersOn(user: Pick<User, "app_metadata">): boolean {
  return (user.app_metadata?.emailPrefs as { reminders?: boolean } | undefined)?.reminders !== false;
}

export async function setRemindersOn(userId: string, on: boolean): Promise<boolean> {
  const svc = createSupabaseServiceRoleClient();
  const { data } = await svc.auth.admin.getUserById(userId);
  if (!data.user) return false;
  const meta = data.user.app_metadata ?? {};
  const { error } = await svc.auth.admin.updateUserById(userId, {
    app_metadata: { ...meta, emailPrefs: { ...(meta.emailPrefs ?? {}), reminders: on } },
  });
  return !error;
}

// ── Unsubscribe tokens ────────────────────────────────────────────

function secret(): string {
  const s = process.env.REMINDER_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("No secret for unsubscribe links");
  return s;
}

export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", secret()).update(`unsubscribe:${userId}`).digest("base64url").slice(0, 32);
}

export function validUnsubscribe(userId: string, token: string): boolean {
  if (!/^[0-9a-f-]{36}$/.test(userId) || typeof token !== "string") return false;
  const want = Buffer.from(unsubscribeToken(userId)), got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}

export const unsubscribeUrl = (userId: string) => `${SITE}/api/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}`;

// ── The email ─────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function reminderEmail(d: Pick<DraftSummary, "id" | "roomType" | "title" | "hasRender" | "estimateTotal" | "thumbUrl">, name: string | null, userId: string) {
  const room = d.roomType;
  const link = `${SITE}/${room}?draft=${encodeURIComponent(d.id)}`;
  const hi = name ? `Hi ${esc(name.split(" ")[0])},` : "Hi,";
  const subject = d.hasRender ? `Your ${room} design is saved and ready` : `Finish your ${room} design in a minute`;
  const lead = d.hasRender
    ? `Your ${room} design is saved${d.estimateTotal ? `, with an estimate of <strong>${formatAUD(d.estimateTotal)}</strong>` : ""}. Pick up where you left off: try another look, or send it to a builder for a quote.`
    : `You started designing your ${room} on Reno Ready. Your photo and choices are saved, and it only takes about 30 seconds to see your room transformed.`;
  const heading = d.hasRender ? `Your ${room} design is ready when you are` : `Your ${room} is one click from a makeover`;
  // without a render the image is their own "before" photo, so say so
  const photoLabel = d.hasRender ? "Your design" : "Your photo";
  const unsub = unsubscribeUrl(userId);
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2C3E50;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #EDE5D8;">
    ${d.thumbUrl ? `<img src="${esc(d.thumbUrl)}" alt="${photoLabel}" width="560" style="display:block;width:100%;height:auto;max-height:320px;object-fit:cover;">
    <p style="margin:0;padding:8px 28px;background:#F5F0E6;font-size:12px;font-weight:600;color:#6B7480;">${photoLabel}${d.hasRender ? "" : ": here&#39;s where you left off"}</p>` : ""}
    <div style="padding:28px 28px 8px;">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#D27D5E;">Reno Ready</p>
      <h1 style="margin:8px 0 14px;font-size:22px;line-height:1.3;">${esc(heading)}</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3E4A57;">${hi}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#3E4A57;">${lead}</p>
      <a href="${link}" style="display:inline-block;background:#D27D5E;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:12px;">Pick up where you left off</a>
      <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#6B7480;">You can see all your saved designs anytime under My Account.</p>
    </div>
    <div style="padding:20px 28px 26px;">
      <p style="margin:0;font-size:11px;line-height:1.6;color:#9CA3AF;">
        You&#39;re getting this because you started a design on Reno Ready (renoready.com.au) while signed in.
        We send at most one reminder a week. <a href="${unsub}" style="color:#9CA3AF;">Unsubscribe from reminders</a>.
      </p>
    </div>
  </div>
</body></html>`;
  const text = `${hi.replace(/&#39;/g, "'")}\n\n${lead.replace(/<[^>]+>/g, "")}\n\nPick up where you left off: ${link}\n\nYou're getting this because you started a design on Reno Ready (renoready.com.au). Unsubscribe from reminders: ${unsub}`;
  return { subject, html, text, unsub };
}

// ── The daily job ─────────────────────────────────────────────────

export interface ReminderRun { checked: number; sent: number; skipped: Record<string, number>; errors: number; dryRun: boolean; sender: string }

/** Finds people with an unfinished design and emails them. dryRun = work it all out, send nothing. */
export async function runDraftReminders({ dryRun = false, now = Date.now() } = {}): Promise<ReminderRun> {
  const sender = process.env.RESEND_FROM_EMAIL?.trim() || "";
  const canSend = !!process.env.RESEND_API_KEY && !!sender && !/resend\.dev/i.test(sender);
  const run: ReminderRun = { checked: 0, sent: 0, skipped: {}, errors: 0, dryRun: dryRun || !canSend, sender: canSend ? sender : "(not set: verify a domain in Resend and set RESEND_FROM_EMAIL)" };
  const skip = (why: string) => { run.skipped[why] = (run.skipped[why] ?? 0) + 1; };
  const svc = createSupabaseServiceRoleClient();
  const resend = canSend ? new Resend(process.env.RESEND_API_KEY!) : null;

  for (const userId of await draftOwners()) {
    if (run.sent >= MAX_PER_RUN) { skip("run limit"); continue; }
    run.checked++;
    const { data } = await svc.auth.admin.getUserById(userId);
    const user = data.user;
    if (!user?.email) { skip("no email"); continue; }
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) { skip("admin"); continue; }   // the owner's test designs
    if (!remindersOn(user)) { skip("unsubscribed"); continue; }
    const last = (user.app_metadata?.reminders as { lastSentAt?: string } | undefined)?.lastSentAt;
    if (last && now - Date.parse(last) < PER_PERSON_GAP) { skip("emailed this week"); continue; }

    const drafts = await listDrafts(userId);
    const briefs = await listLeadsFor(userId).catch(() => []);
    const lastBrief = briefs[0] ? Date.parse(briefs[0].createdAt) : 0;
    const due = drafts.find((d) => {
      const idle = now - Date.parse(d.updatedAt);
      if (idle < MIN_IDLE || idle > MAX_IDLE) return false;
      if (!d.hasPhoto && !d.hasRender) return false;
      if (d.remindedAt && Date.parse(d.remindedAt) >= Date.parse(d.updatedAt)) return false;   // already reminded about this version
      if (lastBrief >= Date.parse(d.updatedAt)) return false;                                    // they sent it to a builder
      return true;
    });
    // and they haven't been active on any other design since
    const newest = drafts[0] ? Date.parse(drafts[0].updatedAt) : 0;
    if (!due) { skip("nothing waiting"); continue; }
    if (now - newest < MIN_IDLE) { skip("active recently"); continue; }

    const name = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? null;
    // the list's image links last an hour; emails get a 30-day one
    const mail = reminderEmail({ ...due, thumbUrl: await draftImageLink(userId, due).catch(() => null) }, name, userId);
    if (run.dryRun) { run.sent++; continue; }
    try {
      const { error } = await resend!.emails.send({
        from: sender || RESEND_FROM, to: user.email, subject: mail.subject, html: mail.html, text: mail.text,
        headers: { "List-Unsubscribe": `<${mail.unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      if (error) throw new Error(error.message);
      await markDraftReminded(userId, due.id);
      await svc.auth.admin.updateUserById(userId, {
        app_metadata: { ...(user.app_metadata ?? {}), reminders: { lastSentAt: new Date(now).toISOString() } },
      });
      run.sent++;
    } catch (err) {
      run.errors++;
      console.error("[reminders] send failed:", err instanceof Error ? err.message : err);
    }
  }
  return run;
}
