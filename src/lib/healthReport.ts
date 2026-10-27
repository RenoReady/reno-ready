/**
 * The daily health email to the admin (server only), sent by the 9am cron
 * (/api/cron/draft-reminders) straight after the reminder run.
 *
 * Covers the last 24 hours: visitors and how far they got, sign-ups (and any
 * that never finished signing in, which is how a broken Google sign-in
 * shows up), previews made and failed, payments and builder briefs, plus
 * warnings when something looks broken.
 */

import { Resend } from "resend";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";
import { FUNNEL_STEPS, STEP_LABEL, fetchEvents, groupPeople, type FunnelStep } from "@/lib/funnel";

const SITE = "https://www.renoready.com.au";
const DAY = 86_400_000;

export interface HealthSummary {
  since: string;
  people: number;
  steps: Partial<Record<FunnelStep, number>>;
  signups: number;
  signupsNeverSignedIn: number;
  previews: number;
  failed: number;
  failures: string[];
  warnings: string[];
}

export async function healthSummary(now = Date.now()): Promise<HealthSummary> {
  const since = new Date(now - DAY).toISOString();
  const svc = createSupabaseServiceRoleClient();

  // the admin's own testing doesn't count
  const users: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null }[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  const adminId = users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())?.id;
  // a sign-up from the last few minutes may still be mid sign-in, so give it an hour
  const newUsers = users.filter((u) => u.id !== adminId && u.created_at >= since && Date.parse(u.created_at) < now - 60 * 60_000);
  const neverSignedIn = newUsers.filter((u) => !u.last_sign_in_at).length;

  const events = await fetchEvents(since);
  const people = groupPeople(events, adminId ? [adminId] : []);
  const steps: Partial<Record<FunnelStep, number>> = {};
  for (const s of FUNNEL_STEPS) steps[s] = people.filter((p) => p.steps.has(s)).length;
  const kept = people.flatMap((p) => p.events);
  const previews = kept.filter((e) => e.step === "preview").length;
  const failedEvents = kept.filter((e) => e.step === "preview_failed");
  const failures = [...new Set(failedEvents.map((e) => e.detail ?? "unknown error"))].slice(0, 5);

  const warnings: string[] = [];
  if (newUsers.length >= 1 && neverSignedIn === newUsers.length)
    warnings.push(`None of the ${newUsers.length} new sign-up${newUsers.length === 1 ? "" : "s"} finished signing in. Google sign-in may be broken: try it in a private window.`);
  else if (neverSignedIn >= 2)
    warnings.push(`${neverSignedIn} of ${newUsers.length} new sign-ups never finished signing in.`);
  if ((steps.generate ?? 0) >= 3 && previews === 0)
    warnings.push(`${steps.generate} people clicked Generate but no previews were made.`);
  if (failedEvents.length >= 2 && failedEvents.length / (failedEvents.length + previews) > 0.25)
    warnings.push(`${failedEvents.length} previews failed (${Math.round((failedEvents.length / (failedEvents.length + previews)) * 100)}% of attempts).`);
  if (people.length === 0)
    warnings.push("No visits were recorded at all. Check the site is up and tracking is working.");

  return {
    since, people: people.length, steps, signups: newUsers.length, signupsNeverSignedIn: neverSignedIn,
    previews, failed: failedEvents.length, failures, warnings,
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function healthEmail(h: HealthSummary) {
  const date = new Date().toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane", weekday: "long", day: "numeric", month: "long" });
  const ok = h.warnings.length === 0;
  const subject = ok
    ? `Reno Ready daily: ${h.people} visitor${h.people === 1 ? "" : "s"}, ${h.previews} preview${h.previews === 1 ? "" : "s"}, ${h.steps.paid ?? 0} paid`
    : `Reno Ready daily: ${h.warnings.length} thing${h.warnings.length === 1 ? "" : "s"} to check`;
  const row = (label: string, value: string | number, strong = false) =>
    `<tr><td style="padding:6px 0;color:#3E4A57;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:${strong ? 800 : 600};color:#2C3E50;">${value}</td></tr>`;
  const funnelRows = FUNNEL_STEPS.map((s) => row(STEP_LABEL[s], h.steps[s] ?? 0)).join("");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2C3E50;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #EDE5D8;padding:26px 26px 18px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#D27D5E;">Reno Ready · daily health</p>
    <h1 style="margin:6px 0 4px;font-size:20px;">${esc(date)}</h1>
    <p style="margin:0 0 16px;font-size:13px;color:#6B7480;">The last 24 hours (your own account left out).</p>
    ${ok
      ? `<p style="margin:0 0 18px;padding:12px 14px;border-radius:12px;background:#ECFDF3;color:#05603A;font-size:14px;font-weight:600;">Everything looks normal.</p>`
      : `<div style="margin:0 0 18px;padding:12px 14px;border-radius:12px;background:#FEF3F2;color:#B42318;font-size:14px;">${h.warnings.map((w) => `<p style="margin:4px 0;font-weight:600;">${esc(w)}</p>`).join("")}</div>`}
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${row("New sign-ups", h.signups, true)}
      ${row("…never finished signing in", h.signupsNeverSignedIn)}
      ${row("Previews made", h.previews, true)}
      ${row("Previews failed", h.failed)}
    </table>
    ${h.failures.length ? `<p style="margin:10px 0 0;font-size:12px;color:#B42318;">Errors: ${h.failures.map(esc).join(" · ")}</p>` : ""}
    <p style="margin:20px 0 6px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6B7480;">How far people got</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${funnelRows}</table>
    <p style="margin:22px 0 0;"><a href="${SITE}/admin" style="display:inline-block;background:#D27D5E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:12px;">Open the dashboard</a></p>
  </div>
</body></html>`;
  const text = [`${subject}`, "", ...h.warnings.map((w) => `! ${w}`), "",
    `New sign-ups: ${h.signups} (${h.signupsNeverSignedIn} never finished signing in)`,
    `Previews: ${h.previews} made, ${h.failed} failed${h.failures.length ? ` (${h.failures.join("; ")})` : ""}`, "",
    ...FUNNEL_STEPS.map((s) => `${STEP_LABEL[s]}: ${h.steps[s] ?? 0}`), "", `${SITE}/admin`].join("\n");
  return { subject, html, text };
}

/** Works it out and emails the admin. Returns what was sent (or why not). */
export async function sendHealthEmail(): Promise<{ sent: boolean; subject?: string; error?: string }> {
  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (!process.env.RESEND_API_KEY || !sender || /resend\.dev/i.test(sender)) return { sent: false, error: "RESEND_FROM_EMAIL not set" };
  try {
    const mail = healthEmail(await healthSummary());
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: sender, to: ADMIN_EMAIL, subject: mail.subject, html: mail.html, text: mail.text });
    if (error) throw new Error(error.message);
    return { sent: true, subject: mail.subject };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[health] email failed:", msg);
    return { sent: false, error: msg };
  }
}
