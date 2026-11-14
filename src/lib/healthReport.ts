/**
 * The daily health email to the admin, with a copy to the work inbox
 * (CONTACT_EMAIL, or HEALTH_EMAIL_CC) (server only), sent by the 9am cron
 * (/api/cron/draft-reminders) straight after the reminder run.
 *
 * Covers the last 24 hours: visitors and how far they got, sign-ups (and any
 * that never finished signing in, which is how a broken Google sign-in
 * shows up), previews made and failed, payments and builder briefs, what time
 * of day people visited and signed up (Brisbane time), plus warnings when
 * something looks broken. Also: the headline numbers against the daily average
 * of the 7 days before, where visitors came from (ads, search, outreach links),
 * and money from Stripe (new payments, active subscriptions, MRR, cancellations).
 */

import { Resend } from "resend";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, CONTACT_EMAIL } from "@/lib/config";
import { FUNNEL_STEPS, STEP_LABEL, fetchEvents, groupPeople, type FunnelEvent, type FunnelStep, type Person } from "@/lib/funnel";
import { moneySnapshot, type MoneySnapshot } from "@/lib/stripeRevenue";
import { formatAUD } from "@/lib/utils";

const SITE = "https://www.renoready.com.au";
const DAY = 86_400_000;

/** Times of day, Brisbane time (no daylight saving, so the bands never shift) */
export const TIME_BANDS = [
  { label: "Early morning (5–9am)", from: 5,  to: 9 },
  { label: "Daytime (9am–5pm)",     from: 9,  to: 17 },
  { label: "Evening (5–9pm)",       from: 17, to: 21 },
  { label: "Night (9pm–5am)",       from: 21, to: 29 },
] as const;

const brisbaneHour = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Brisbane", hour: "numeric", hourCycle: "h23" });

/** How many of these times fall in each band */
export function byTimeOfDay(isoTimes: string[]): number[] {
  const counts = TIME_BANDS.map(() => 0);
  for (const iso of isoTimes) {
    const h = Number(brisbaneHour.format(new Date(iso)));
    const hh = h < 5 ? h + 24 : h;   // 0–4am counts as the night that started the evening before
    const i = TIME_BANDS.findIndex((b) => hh >= b.from && hh < b.to);
    if (i >= 0) counts[i]++;
  }
  return counts;
}

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
  /** Per TIME_BANDS: when each visitor first turned up, and when each sign-up happened */
  visitTimes: number[];
  signupTimes: number[];
  /** Daily average over the 7 days before the last 24 hours */
  avg7: DayStats;
  /** Where the last 24 hours' visitors came from, most first */
  sources: { source: string; people: number }[];
  /** Outreach email links clicked in the last 7 days, by business */
  outreach: { source: string; people: number }[];
  money: MoneySnapshot | { error: string };
  /** People who had their design emailed to them ("Email it to me"), last 24 hours */
  emailLeads: { email: string; room: string | null; estimate: string | null }[];
}

export interface DayStats { people: number; signups: number; previews: number; paid: number }

/** "Email it to me" leads since a time; [] if the table isn't there yet */
async function recentEmailLeads(since: string): Promise<HealthSummary["emailLeads"]> {
  const { data, error } = await createSupabaseServiceRoleClient().from("email_leads")
    .select("email, room, estimate").gte("created_at", since).order("created_at", { ascending: false }).limit(20);
  return error ? [] : (data ?? []) as HealthSummary["emailLeads"];
}

/** Where someone came from: the first source on any of their events, else direct */
const sourceOf = (p: Person) => p.events.find((e) => e.source)?.source ?? "direct";

function countSources(people: Person[]): { source: string; people: number }[] {
  const counts = new Map<string, number>();
  for (const p of people) counts.set(sourceOf(p), (counts.get(sourceOf(p)) ?? 0) + 1);
  return [...counts].map(([source, n]) => ({ source, people: n })).sort((a, b) => b.people - a.people);
}

/** People, sign-ups, previews and payments in [from, to), the same way the last 24 hours are counted */
function dayStats(events: FunnelEvent[], signupTimes: number[], exclude: string[], from: number, to: number): DayStats {
  const inWindow = events.filter((e) => { const t = Date.parse(e.created_at); return t >= from && t < to; });
  const people = groupPeople(inWindow, exclude);
  const kept = people.flatMap((p) => p.events);
  return {
    people: people.length,
    signups: signupTimes.filter((t) => t >= from && t < to).length,
    previews: kept.filter((e) => e.step === "preview").length,
    paid: kept.filter((e) => e.step === "paid").length,
  };
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

  const exclude = adminId ? [adminId] : [];
  const weekEvents = await fetchEvents(new Date(now - 8 * DAY).toISOString());
  const events = weekEvents.filter((e) => e.created_at >= since);
  const people = groupPeople(events, exclude);
  const steps: Partial<Record<FunnelStep, number>> = {};
  for (const s of FUNNEL_STEPS) steps[s] = people.filter((p) => p.steps.has(s)).length;
  const kept = people.flatMap((p) => p.events);
  const previews = kept.filter((e) => e.step === "preview").length;
  const failedEvents = kept.filter((e) => e.step === "preview_failed");
  const failures = [...new Set(failedEvents.map((e) => e.detail ?? "unknown error"))].slice(0, 5);

  // the 7 days before the last 24 hours, averaged per day
  const signupMs = users.filter((u) => u.id !== adminId).map((u) => Date.parse(u.created_at));
  const days = Array.from({ length: 7 }, (_, i) => dayStats(weekEvents, signupMs, exclude, now - (i + 2) * DAY, now - (i + 1) * DAY));
  const avg = (k: keyof DayStats) => Math.round((days.reduce((n, d) => n + d[k], 0) / 7) * 10) / 10;
  const avg7: DayStats = { people: avg("people"), signups: avg("signups"), previews: avg("previews"), paid: avg("paid") };

  const outreach = countSources(groupPeople(weekEvents.filter((e) => Date.parse(e.created_at) >= now - 7 * DAY), exclude))
    .filter((r) => r.source.startsWith("outreach"));

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
    visitTimes: byTimeOfDay(people.map((p) => p.first)),
    signupTimes: byTimeOfDay(newUsers.map((u) => u.created_at)),
    avg7, sources: countSources(people).slice(0, 6), outreach,
    money: await moneySnapshot(ADMIN_EMAIL, now - DAY),
    emailLeads: await recentEmailLeads(since),
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
  const heading = (t: string) => `<p style="margin:20px 0 6px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6B7480;">${t}</p>`;
  const trend = (today: number, avg: number) => {
    if (avg === 0) return today === 0 ? "" : ` <span style="color:#05603A;">new</span>`;
    const pct = Math.round(((today - avg) / avg) * 100);
    if (Math.abs(pct) < 5) return ` <span style="color:#9CA3AF;">≈</span>`;
    return pct > 0 ? ` <span style="color:#05603A;">↑${pct}%</span>` : ` <span style="color:#B42318;">↓${-pct}%</span>`;
  };
  const today: DayStats = { people: h.people, signups: h.signups, previews: h.previews, paid: h.steps.paid ?? 0 };
  const compareRows = ([["Visitors", "people"], ["Sign-ups", "signups"], ["Previews made", "previews"], ["Paid", "paid"]] as const).map(([label, k]) =>
    `<tr><td style="padding:6px 0;color:#3E4A57;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#2C3E50;">${today[k]}${trend(today[k], h.avg7[k])}</td><td style="padding:6px 0;text-align:right;color:#6B7480;">${h.avg7[k]}</td></tr>`).join("");
  const sourceRows = h.sources.length ? h.sources.map((r) => row(esc(r.source), r.people)).join("") : row("No visitors", "");
  const outreachRows = h.outreach.map((r) => row(esc(r.source.replace(/^outreach-?/, "") || "outreach"), r.people)).join("");
  const m = h.money;
  const moneyHtml = "error" in m
    ? `<p style="margin:0;font-size:13px;color:#B42318;">Couldn't reach Stripe: ${esc(m.error)}</p>`
    : `<table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${row("New payments", m.newPayments ? `${m.newPayments} · ${formatAUD(m.newRevenue / 100)}` : 0, m.newPayments > 0)}
      ${row("Active subscriptions", m.active, true)}
      ${row("Monthly recurring revenue", formatAUD(m.mrr / 100), true)}
      ${row("Cancelled", m.cancelled)}
    </table>`;
  const timeRows = TIME_BANDS.map((b, i) =>
    `<tr><td style="padding:6px 0;color:#3E4A57;">${b.label}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#2C3E50;">${h.visitTimes[i]}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#2C3E50;">${h.signupTimes[i]}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2C3E50;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #EDE5D8;padding:26px 26px 18px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#D27D5E;">Reno Ready · daily health</p>
    <h1 style="margin:6px 0 4px;font-size:20px;">${esc(date)}</h1>
    <p style="margin:0 0 16px;font-size:13px;color:#6B7480;">The last 24 hours (your own account left out).</p>
    ${ok
      ? `<p style="margin:0 0 18px;padding:12px 14px;border-radius:12px;background:#ECFDF3;color:#05603A;font-size:14px;font-weight:600;">Everything looks normal.</p>`
      : `<div style="margin:0 0 18px;padding:12px 14px;border-radius:12px;background:#FEF3F2;color:#B42318;font-size:14px;">${h.warnings.map((w) => `<p style="margin:4px 0;font-weight:600;">${esc(w)}</p>`).join("")}</div>`}
    ${heading("Last 24 hours vs. the 7 days before")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td></td><td style="padding:0 0 4px;text-align:right;font-size:11px;color:#9CA3AF;">Last 24h</td><td style="padding:0 0 4px;text-align:right;font-size:11px;color:#9CA3AF;">Daily avg</td></tr>
      ${compareRows}
    </table>
    ${h.emailLeads.length ? `${heading(`New email leads (${h.emailLeads.length})`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${h.emailLeads.map((l) => row(`<a href="mailto:${esc(l.email)}" style="color:#2C3E50;">${esc(l.email)}</a>`, esc([l.room, l.estimate].filter(Boolean).join(" · ")))).join("")}</table>
    <p style="margin:6px 0 0;font-size:12px;color:#6B7480;">They asked for their design by email and agreed to a couple of follow-ups.</p>` : ""}
    ${heading("Money (Stripe)")}
    ${moneyHtml}
    ${heading("Details")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${row("New sign-ups", h.signups, true)}
      ${row("…never finished signing in", h.signupsNeverSignedIn)}
      ${row("Previews made", h.previews, true)}
      ${row("Previews failed", h.failed)}
    </table>
    ${h.failures.length ? `<p style="margin:10px 0 0;font-size:12px;color:#B42318;">Errors: ${h.failures.map(esc).join(" · ")}</p>` : ""}
    <p style="margin:20px 0 6px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6B7480;">How far people got</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${funnelRows}</table>
    ${heading("Where visitors came from")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${sourceRows}</table>
    ${h.outreach.length ? `${heading("Outreach email clicks (last 7 days)")}<table style="width:100%;border-collapse:collapse;font-size:14px;">${outreachRows}</table>` : ""}
    <p style="margin:20px 0 6px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6B7480;">When they came (Brisbane time)</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td></td><td style="padding:0 0 4px;text-align:right;font-size:11px;color:#9CA3AF;">Visitors</td><td style="padding:0 0 4px;text-align:right;font-size:11px;color:#9CA3AF;">Sign-ups</td></tr>
      ${timeRows}
    </table>
    <p style="margin:22px 0 0;"><a href="${SITE}/admin" style="display:inline-block;background:#D27D5E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:12px;">Open the dashboard</a></p>
  </div>
</body></html>`;
  const text = [`${subject}`, "", ...h.warnings.map((w) => `! ${w}`), "",
    `New sign-ups: ${h.signups} (${h.signupsNeverSignedIn} never finished signing in)`,
    `Previews: ${h.previews} made, ${h.failed} failed${h.failures.length ? ` (${h.failures.join("; ")})` : ""}`, "",
    ...FUNNEL_STEPS.map((s) => `${STEP_LABEL[s]}: ${h.steps[s] ?? 0}`), "",
    "Last 24h vs daily avg of the 7 days before:",
    `Visitors ${h.people} (${h.avg7.people}) · Sign-ups ${h.signups} (${h.avg7.signups}) · Previews ${h.previews} (${h.avg7.previews}) · Paid ${h.steps.paid ?? 0} (${h.avg7.paid})`, "",
    ...(h.emailLeads.length ? [`New email leads (${h.emailLeads.length}):`, ...h.emailLeads.map((l) => `  ${l.email} (${[l.room, l.estimate].filter(Boolean).join(", ")})`), ""] : []),
    "error" in h.money ? `Stripe: ${h.money.error}`
      : `Money: ${h.money.newPayments} new payments (${formatAUD(h.money.newRevenue / 100)}) · ${h.money.active} active subscriptions · MRR ${formatAUD(h.money.mrr / 100)} · ${h.money.cancelled} cancelled`, "",
    "Where visitors came from:", ...h.sources.map((r) => `  ${r.source}: ${r.people}`),
    ...(h.outreach.length ? ["Outreach email clicks (last 7 days):", ...h.outreach.map((r) => `  ${r.source}: ${r.people}`)] : []), "",
    "When they came (Brisbane time): visitors / sign-ups",
    ...TIME_BANDS.map((b, i) => `${b.label}: ${h.visitTimes[i]} / ${h.signupTimes[i]}`), "", `${SITE}/admin`].join("\n");
  return { subject, html, text };
}

/** Works it out and emails the admin. Returns what was sent (or why not). */
export async function sendHealthEmail(): Promise<{ sent: boolean; subject?: string; error?: string }> {
  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (!process.env.RESEND_API_KEY || !sender || /resend\.dev/i.test(sender)) return { sent: false, error: "RESEND_FROM_EMAIL not set" };
  try {
    const mail = healthEmail(await healthSummary());
    // a copy to the work inbox too (HEALTH_EMAIL_CC overrides; "none" turns it off)
    const ccSetting = process.env.HEALTH_EMAIL_CC?.trim();
    const cc = ccSetting === "none" ? [] : [ccSetting || CONTACT_EMAIL].filter((e) => e.toLowerCase() !== ADMIN_EMAIL.toLowerCase());
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: sender, to: ADMIN_EMAIL, ...(cc.length && { cc }), subject: mail.subject, html: mail.html, text: mail.text,
    });
    if (error) throw new Error(error.message);
    return { sent: true, subject: mail.subject };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[health] email failed:", msg);
    return { sent: false, error: msg };
  }
}
