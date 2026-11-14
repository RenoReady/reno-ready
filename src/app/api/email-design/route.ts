/**
 * POST /api/email-design — "Email it to me" after a signed-out preview.
 *
 * Sends the visitor their (watermarked) before-and-after design by email, with
 * a link back to continue, and keeps their email as a lead (email_leads table,
 * supabase/migrations/20261114_email_leads.sql) for a couple of follow-ups,
 * which the form tells them about.
 *
 * Guards, so it can't be used to send email to strangers:
 *  - only for a browser that made a signed-out preview in the last 24 hours
 *  - 3 sends per browser and 100 site-wide in 24 hours
 *  - JPEG image only, up to ~2.5 MB
 */
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { CONTACT_EMAIL } from "@/lib/config";
import { VISITOR_COOKIE } from "@/lib/visitor";

export const dynamic = "force-dynamic";

const SITE = "https://www.renoready.com.au";
const DAY = 86_400_000;
const ROOMS = new Set(["bathroom", "kitchen", "bedroom"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_IMAGE = 2_500_000;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: NextRequest) {
  const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
    const room = typeof body.room === "string" && ROOMS.has(body.room) ? body.room : "bathroom";
    const estimate = typeof body.estimate === "string" ? body.estimate.slice(0, 40) : null;
    const image = typeof body.image === "string" ? body.image : "";
    if (!EMAIL.test(email)) return fail("Please enter a valid email address.");
    if (!image.startsWith("data:image/jpeg;base64,") || image.length > MAX_IMAGE) return fail("That design couldn't be attached. Please try again.");

    const visitor = req.cookies.get(VISITOR_COOKIE)?.value?.slice(0, 64);
    if (!visitor) return fail("Please refresh the page and try again.");

    const sender = process.env.RESEND_FROM_EMAIL?.trim() || "";
    if (!process.env.RESEND_API_KEY || !sender || /resend\.dev/i.test(sender)) return fail("Email isn't available right now.", 503);

    const svc = createSupabaseServiceRoleClient();
    const since = new Date(Date.now() - DAY).toISOString();
    const [made, mine, all] = await Promise.all([
      svc.from("anon_previews").select("id", { count: "exact", head: true }).eq("visitor_id", visitor).eq("succeeded", true).gte("created_at", since),
      svc.from("email_leads").select("id", { count: "exact", head: true }).eq("visitor_id", visitor).gte("created_at", since),
      svc.from("email_leads").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    for (const r of [made, mine, all]) if (r.error) throw new Error(r.error.message);
    if ((made.count ?? 0) === 0) return fail("Make your free preview first, then we can email it to you.", 403);
    if ((mine.count ?? 0) >= 3 || (all.count ?? 0) >= 100) return fail("We've sent a few already. Please try again tomorrow.", 429);

    const roomName = room;
    const link = `${SITE}/${room}?resume=local`;
    const subject = `Your ${roomName} design from Reno Ready`;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2C3E50;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #EDE5D8;">
    <img src="cid:design" alt="Your ${esc(roomName)} design" width="560" style="display:block;width:100%;height:auto;">
    <div style="padding:26px 28px 8px;">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#D27D5E;">Reno Ready</p>
      <h1 style="margin:8px 0 12px;font-size:22px;line-height:1.3;">Here&#39;s your ${esc(roomName)} design</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3E4A57;">Thanks for trying Reno Ready.${estimate ? ` Your estimate came to about <strong>${esc(estimate)}</strong>.` : ""}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#3E4A57;">Want to change something? Sign in for free to save it, make a free edit, and send it to a builder for a quote.</p>
      <a href="${link}" style="display:inline-block;background:#D27D5E;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:12px;">Continue my design</a>
      <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#6B7480;">Opens where you left off on the device you used. Questions? Just reply to this email.</p>
    </div>
    <div style="padding:18px 28px 24px;">
      <p style="margin:0;font-size:11px;line-height:1.6;color:#9CA3AF;">
        You&#39;re getting this because you asked Reno Ready (renoready.com.au) to email your design. We may follow up once or twice about it.
        Reply &quot;unsubscribe&quot; and we won&#39;t email you again.
      </p>
    </div>
  </div>
</body></html>`;
    const text = `Here's your ${roomName} design from Reno Ready.${estimate ? ` Your estimate came to about ${estimate}.` : ""}\n\nWant to change something? Sign in for free to save it, make a free edit, and send it to a builder for a quote.\n\nContinue my design: ${link}\n(Opens where you left off on the device you used.)\n\nYou're getting this because you asked Reno Ready to email your design. We may follow up once or twice about it. Reply "unsubscribe" and we won't email you again.`;

    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: sender, to: email, replyTo: CONTACT_EMAIL, subject, html, text,
      attachments: [{ filename: `reno-ready-${room}.jpg`, content: image.slice("data:image/jpeg;base64,".length), contentType: "image/jpeg", contentId: "design" }],
    });
    if (error) throw new Error(error.message);

    const { error: saveError } = await svc.from("email_leads").insert({ email, room, estimate, visitor_id: visitor });
    if (saveError) console.warn("[email-design] sent, but couldn't save the lead:", saveError.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email-design]", err instanceof Error ? err.message : err);
    return fail("We couldn't send that just now. Please try again.", 500);
  }
}
