/**
 * Free plans given by the admin (server only), e.g. a 7-Day Project Pass as a
 * thank-you for completing the feedback survey. Same plan and limits as a
 * bought pass; the account just isn't charged. Emails them that it's active.
 */

import { Resend } from "resend";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";

const DAY_MS = 86_400_000;
const SITE = "https://www.renoready.com.au";

export async function grantProjectPass(userId: string, { notify = true } = {}): Promise<{ expiresAt: string; emailed: boolean }> {
  const svc = createSupabaseServiceRoleClient();
  const { data } = await svc.auth.admin.getUserById(userId);
  const user = data.user;
  if (!user) throw new Error("No such account");

  const expiresAt = new Date(Date.now() + PLANS.projectPass.accessDays * DAY_MS).toISOString();
  // "day_pass" is how a 7-Day Project Pass is stored (the profiles check constraint predates the rename)
  const { error } = await svc.from("profiles").update({ subscription_plan: "day_pass", subscription_expires_at: expiresAt }).eq("id", userId);
  if (error) throw new Error(error.message);
  await svc.auth.admin.updateUserById(userId, {
    app_metadata: { ...(user.app_metadata ?? {}), grants: [...((user.app_metadata?.grants as unknown[]) ?? []), { plan: "projectPass", at: new Date().toISOString(), expiresAt }] },
  });

  let emailed = false;
  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (notify && user.email && sender && process.env.RESEND_API_KEY) {
    const first = ((user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") as string).split(" ")[0];
    const until = new Date(expiresAt).toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane", weekday: "long", day: "numeric", month: "long" });
    const text = `Hi${first ? ` ${first}` : ""},

Thanks for filling in the survey. Your free 7-Day Project Pass is now active on your Reno Ready account, until ${until}.

That's 20 renders and 10 edits in 2K, with PDF reports you can take to a builder. Just sign in and start designing:
${SITE}/builder

Thanks again for helping shape Reno Ready.

Braiden
Founder, Reno Ready`;
    const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: sender, to: user.email, subject: "Your free 7-Day Project Pass is active", text,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2C3E50;max-width:560px">${text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(`${SITE}/builder`, `<a href="${SITE}/builder" style="color:#D27D5E;font-weight:700">Start designing</a>`)
        .split("\n\n").map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`).join("")}</div>`,
    });
    if (sendError) console.warn("[grants] email failed:", sendError.message);
    else emailed = true;
  }
  return { expiresAt, emailed };
}
