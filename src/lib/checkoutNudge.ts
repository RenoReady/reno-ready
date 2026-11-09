/**
 * "You didn't finish checking out" email (server only).
 *
 * Stripe sends checkout.session.expired when a checkout is left unpaid (24
 * hours after it opened, Stripe's default). The webhook hands that session
 * here and we send one friendly follow-up linking back to the page they were
 * buying from, plus the founding member price for Pro while spots are left.
 * Replies go to CONTACT_EMAIL.
 *
 * Guard rails (same spirit as the draft reminders):
 *  - signed-in buyers only (every checkout is), never the admin account
 *  - not if they've since bought any plan
 *  - honours the reminders unsubscribe switch
 *  - at most one per person every 7 days, and not the same day as a design reminder
 *  - only from a verified domain (RESEND_FROM_EMAIL)
 */
import type Stripe from "stripe";
import { Resend } from "resend";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, CONTACT_EMAIL } from "@/lib/config";
import { FOUNDER_OFFER, PLAN_CARDS, PRO_PRICING, hasActivePlan, isPlanKey, type PlanKey } from "@/lib/plans";
import { founderStatus } from "@/lib/founder";
import { remindersOn, unsubscribeUrl } from "@/lib/reminders";

const SITE = "https://www.renoready.com.au";
const DAY = 86_400_000;
const GAP = 7 * DAY;
const BACK_PATHS = ["/bathroom", "/kitchen", "/bedroom", "/builder", "/account", "/pricing", "/for-builders"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface NudgeInput {
  plan:    PlanKey;
  name:    string | null;
  userId:  string;
  /** Page they were buying from */
  back:    string;
  /** Founding member spots left (Pro only), or null for no offer */
  founderLeft: number | null;
}

export function checkoutNudgeEmail({ plan, name, userId, back, founderLeft }: NudgeInput) {
  const hi = name ? `Hi ${esc(name.split(" ")[0])},` : "Hi,";
  const isPro = plan !== "projectPass";
  const offer = isPro && founderLeft !== null;
  const unsub = unsubscribeUrl(userId);

  const link = offer
    ? `${SITE}/for-builders#founder`
    : `${SITE}${BACK_PATHS.includes(back) ? back : isPro ? "/for-builders" : "/pricing"}`;

  const subject = offer
    ? `Founding member price: Reno Ready Pro for $${FOUNDER_OFFER.price}/month`
    : isPro ? "Your Reno Ready Pro checkout is still waiting" : "Your 7-Day Project Pass is one step away";

  const heading = offer
    ? `Pro for $${FOUNDER_OFFER.price} a month, while spots last`
    : isPro ? "Still thinking about Pro?" : "Finish planning your reno";

  const lead = offer
    ? `You started signing up for Reno Ready Pro but didn&#39;t finish. Fair enough: it&#39;s a new tool. So here&#39;s a better reason: the first ${FOUNDER_OFFER.spots} Pro members pay <strong>$${FOUNDER_OFFER.price} a month instead of $${PRO_PRICING.monthly.price}</strong>, and that price stays for as long as you stay subscribed. There ${founderLeft === 1 ? "is 1 spot" : `are ${founderLeft} spots`} left.`
    : isPro
      ? `You started signing up for Reno Ready Pro but didn&#39;t finish. Everything is still there: up to ${PLAN_CARDS.pro.features[0].replace(/^Up to /, "")}, client share links and reports with your branding.`
      : `You were one step from the 7-Day Project Pass: ${PLAN_CARDS.pass.pitch.replace(/\.$/, "")}. Your saved designs are waiting for you.`;

  const cta = offer ? "Claim a founding spot" : isPro ? "Go Pro" : "Get the 7-Day Pass";
  const footnote = isPro ? "No contract. Cancel anytime in 1-click from My Account." : "One-time payment. Nothing renews.";

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2C3E50;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #EDE5D8;">
    <div style="padding:28px 28px 8px;">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#D27D5E;">Reno Ready</p>
      <h1 style="margin:8px 0 14px;font-size:22px;line-height:1.3;">${esc(heading)}</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3E4A57;">${hi}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#3E4A57;">${lead}</p>
      <a href="${link}" style="display:inline-block;background:#D27D5E;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:12px;">${cta}</a>
      <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#6B7480;">${footnote} Questions? Just reply to this email.</p>
    </div>
    <div style="padding:20px 28px 26px;">
      <p style="margin:0;font-size:11px;line-height:1.6;color:#9CA3AF;">
        You&#39;re getting this because you started a checkout on Reno Ready (renoready.com.au) while signed in.
        <a href="${unsub}" style="color:#9CA3AF;">Unsubscribe from reminders</a>.
      </p>
    </div>
  </div>
</body></html>`;
  const plain = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  const text = `${plain(hi)}\n\n${plain(lead)}\n\n${cta}: ${link}\n\n${footnote} Questions? Just reply to this email.\n\nYou're getting this because you started a checkout on Reno Ready (renoready.com.au). Unsubscribe from reminders: ${unsub}`;
  return { subject, html, text, unsub };
}

/** Called from the Stripe webhook on checkout.session.expired. Never throws. */
export async function sendCheckoutNudge(session: Stripe.Checkout.Session): Promise<string> {
  try {
    const userId = session.client_reference_id;
    const rawPlan = session.metadata?.plan;
    if (!userId || !isPlanKey(rawPlan)) return "no user or plan";

    const sender = process.env.RESEND_FROM_EMAIL?.trim() || "";
    if (!process.env.RESEND_API_KEY || !sender || /resend\.dev/i.test(sender)) return "email not set up";

    const svc = createSupabaseServiceRoleClient();
    const { data } = await svc.auth.admin.getUserById(userId);
    const user = data.user;
    if (!user?.email) return "no email";
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return "admin";
    if (!remindersOn(user)) return "unsubscribed";

    const meta = user.app_metadata ?? {};
    const now = Date.now();
    const lastNudge = (meta.checkoutNudge as { lastSentAt?: string } | undefined)?.lastSentAt;
    if (lastNudge && now - Date.parse(lastNudge) < GAP) return "nudged this week";
    const lastReminder = (meta.reminders as { lastSentAt?: string } | undefined)?.lastSentAt;
    if (lastReminder && now - Date.parse(lastReminder) < DAY) return "reminded today";

    const { data: profile } = await svc
      .from("profiles")
      .select("subscription_plan, subscription_expires_at")
      .eq("id", userId)
      .single();
    if (hasActivePlan(profile?.subscription_plan, profile?.subscription_expires_at)) return "already paid";

    const founder = rawPlan === "projectPass" ? null : await founderStatus();
    const name = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? null;
    const mail = checkoutNudgeEmail({
      plan: rawPlan, name, userId, back: session.metadata?.back ?? "", founderLeft: founder?.left ?? null,
    });

    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: sender, to: user.email, replyTo: CONTACT_EMAIL, subject: mail.subject, html: mail.html, text: mail.text,
      headers: { "List-Unsubscribe": `<${mail.unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (error) throw new Error(error.message);

    await svc.auth.admin.updateUserById(userId, {
      app_metadata: { ...meta, checkoutNudge: { lastSentAt: new Date(now).toISOString() } },
    });
    return "sent";
  } catch (err) {
    console.error("[checkout-nudge] failed:", err instanceof Error ? err.message : err);
    return "error";
  }
}
