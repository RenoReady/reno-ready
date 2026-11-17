/**
 * POST /api/email-later — Step 1: "Not ready? Email me a link to finish later."
 *
 * Emails a fixed message with a link back to Step 1 of that room, and keeps
 * the email as a lead (email_leads, source "finish_later") for a follow-up,
 * which the form tells them about.
 *
 * The message is always our own template (nothing the visitor types goes in
 * it), and sends are capped: 2 per browser and 100 email leads site-wide in
 * 24 hours.
 */
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { CONTACT_EMAIL } from "@/lib/config";
import { VISITOR_COOKIE } from "@/lib/visitor";
import { canReceiveEmail } from "@/lib/emailDomain";

export const dynamic = "force-dynamic";

const SITE = "https://www.renoready.com.au";
const DAY = 86_400_000;
const ROOMS = new Set(["bathroom", "kitchen", "bedroom"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
    const room = typeof body.room === "string" && ROOMS.has(body.room) ? body.room : "bathroom";
    if (!EMAIL.test(email)) return fail("Please enter a valid email address.");
    if (!(await canReceiveEmail(email))) return fail("That email address can't receive mail. Please check the part after the @.");

    const visitor = req.cookies.get(VISITOR_COOKIE)?.value?.slice(0, 64);
    if (!visitor) return fail("Please refresh the page and try again.");

    const sender = process.env.RESEND_FROM_EMAIL?.trim() || "";
    if (!process.env.RESEND_API_KEY || !sender || /resend\.dev/i.test(sender)) return fail("Email isn't available right now.", 503);

    const svc = createSupabaseServiceRoleClient();
    const since = new Date(Date.now() - DAY).toISOString();
    const [mine, all] = await Promise.all([
      svc.from("email_leads").select("id", { count: "exact", head: true }).eq("visitor_id", visitor).gte("created_at", since),
      svc.from("email_leads").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    for (const r of [mine, all]) if (r.error) throw new Error(r.error.message);
    if ((mine.count ?? 0) >= 2 || (all.count ?? 0) >= 100) return fail("We've already sent you a link. Please check your inbox.", 429);

    const link = `${SITE}/${room}#configurator`;
    const subject = `Your link to finish your ${room} design`;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2C3E50;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #EDE5D8;">
    <div style="padding:28px 28px 8px;">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#D27D5E;">Reno Ready</p>
      <h1 style="margin:8px 0 12px;font-size:22px;line-height:1.3;">See your ${room} transformed</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3E4A57;">Here&#39;s your link back to Reno Ready. When you&#39;re near your ${room}, open it on your phone, snap a photo (or pick one from your camera roll), and you&#39;ll see it redesigned in seconds, with an itemised cost estimate.</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#3E4A57;">Any photo works, and mess doesn&#39;t matter. Your first preview is free, with no sign-up.</p>
      <a href="${link}" style="display:inline-block;background:#D27D5E;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:12px;">Design my ${room}</a>
      <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#6B7480;">Questions? Just reply to this email.</p>
    </div>
    <div style="padding:18px 28px 24px;">
      <p style="margin:0;font-size:11px;line-height:1.6;color:#9CA3AF;">
        You&#39;re getting this because you asked Reno Ready (renoready.com.au) for a link to finish later. We may follow up once or twice about it.
        Reply &quot;unsubscribe&quot; and we won&#39;t email you again.
      </p>
    </div>
  </div>
</body></html>`;
    const text = `Here's your link back to Reno Ready. When you're near your ${room}, open it on your phone, snap a photo (or pick one from your camera roll), and you'll see it redesigned in seconds, with an itemised cost estimate.\n\nAny photo works, and mess doesn't matter. Your first preview is free, with no sign-up.\n\nDesign my ${room}: ${link}\n\nYou're getting this because you asked Reno Ready for a link to finish later. We may follow up once or twice about it. Reply "unsubscribe" and we won't email you again.`;

    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: sender, to: email, replyTo: CONTACT_EMAIL, subject, html, text });
    if (error) throw new Error(error.message);

    // save the lead; works before the "source" column migration too
    const lead = { email, room, visitor_id: visitor };
    let { error: saveError } = await svc.from("email_leads").insert({ ...lead, source: "finish_later" });
    if (saveError && /source/i.test(saveError.message)) ({ error: saveError } = await svc.from("email_leads").insert(lead));
    if (saveError) console.warn("[email-later] sent, but couldn't save the lead:", saveError.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email-later]", err instanceof Error ? err.message : err);
    return fail("We couldn't send that just now. Please try again.", 500);
  }
}
