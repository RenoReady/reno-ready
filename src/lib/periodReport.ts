/**
 * Monthly, quarterly and yearly reports to the admin (server only).
 *
 * The daily cron (/api/cron/draft-reminders, 9am Brisbane) calls
 * sendDuePeriodReports(): on the 1st of a month it emails last month's report;
 * on 1 Jan / 1 Apr / 1 Jul / 1 Oct the same email also covers last quarter;
 * on 1 January, last year too. Each period is compared with the one before.
 * The admin can also send one on demand: /api/cron/draft-reminders?report=month
 * (or quarter / year), which reports the last complete period.
 *
 * Periods run midnight to midnight Brisbane time (no daylight saving there).
 */
import { Resend } from "resend";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, CONTACT_EMAIL } from "@/lib/config";
import { fetchEvents, groupPeople, type FunnelEvent, type Person } from "@/lib/funnel";
import { moneySnapshot, periodRevenue } from "@/lib/stripeRevenue";
import { formatAUD } from "@/lib/utils";

const SITE = "https://www.renoready.com.au";
const BRISBANE_OFFSET = 10 * 3_600_000;   // UTC+10 all year

export type PeriodKind = "month" | "quarter" | "year";

interface Period { kind: PeriodKind; label: string; prevLabel: string; from: number; to: number; prevFrom: number; prevTo: number }

/** Midnight Brisbane on a given (Brisbane) date, as a UTC timestamp */
const brisbaneMidnight = (y: number, m: number, d = 1) => Date.UTC(y, m, d) - BRISBANE_OFFSET;
/** Today's year / month (0-11) / day in Brisbane */
function brisbaneToday(now: number) {
  const d = new Date(now + BRISBANE_OFFSET);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() };
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The last complete month / quarter / year before `now` */
export function lastPeriod(kind: PeriodKind, now = Date.now()): Period {
  const { y, m } = brisbaneToday(now);
  if (kind === "month") {
    const [py, pm] = m === 0 ? [y - 1, 11] : [y, m - 1];
    const [qy, qm] = pm === 0 ? [py - 1, 11] : [py, pm - 1];
    return { kind, label: `${MONTHS[pm]} ${py}`, prevLabel: `${MONTHS[qm]} ${qy}`,
      from: brisbaneMidnight(py, pm), to: brisbaneMidnight(y, m), prevFrom: brisbaneMidnight(qy, qm), prevTo: brisbaneMidnight(py, pm) };
  }
  if (kind === "quarter") {
    const q = Math.floor(m / 3);                       // this quarter (0-3)
    const [py, pq] = q === 0 ? [y - 1, 3] : [y, q - 1];
    const [qy, qq] = pq === 0 ? [py - 1, 3] : [py, pq - 1];
    return { kind, label: `Q${pq + 1} ${py}`, prevLabel: `Q${qq + 1} ${qy}`,
      from: brisbaneMidnight(py, pq * 3), to: brisbaneMidnight(y, q * 3), prevFrom: brisbaneMidnight(qy, qq * 3), prevTo: brisbaneMidnight(py, pq * 3) };
  }
  return { kind, label: `${y - 1}`, prevLabel: `${y - 2}`,
    from: brisbaneMidnight(y - 1, 0), to: brisbaneMidnight(y, 0), prevFrom: brisbaneMidnight(y - 2, 0), prevTo: brisbaneMidnight(y - 1, 0) };
}

/** Which reports are due today (only on the 1st of a month, Brisbane time) */
export function periodsDue(now = Date.now()): PeriodKind[] {
  const { m, day } = brisbaneToday(now);
  if (day !== 1) return [];
  return ["month", ...(m % 3 === 0 ? ["quarter" as const] : []), ...(m === 0 ? ["year" as const] : [])];
}

interface Stats {
  visitors: number; openedTool: number; addedPhoto: number; previews: number; signups: number;
  briefs: number; paidPeople: number; revenue: number | null; payments: number | null; emailLeads: number;
  sources: { source: string; people: number }[];
}

const sourceOf = (p: Person) => p.events.find((e) => e.source)?.source ?? "direct";

async function statsFor(events: FunnelEvent[], users: { id: string; created_at: string }[], exclude: string[], from: number, to: number): Promise<Stats> {
  const inRange = events.filter((e) => { const t = Date.parse(e.created_at); return t >= from && t < to; });
  const people = groupPeople(inRange, exclude);
  const reached = (step: string) => people.filter((p) => p.steps.has(step as never)).length;
  const kept = people.flatMap((p) => p.events);
  const sources = new Map<string, number>();
  for (const p of people) sources.set(sourceOf(p), (sources.get(sourceOf(p)) ?? 0) + 1);

  const [revenue, leads] = await Promise.all([
    periodRevenue(ADMIN_EMAIL, from, to),
    createSupabaseServiceRoleClient().from("email_leads").select("id", { count: "exact", head: true })
      .gte("created_at", new Date(from).toISOString()).lt("created_at", new Date(to).toISOString()),
  ]);
  return {
    visitors: people.length,
    openedTool: reached("room"),
    addedPhoto: reached("photo"),
    previews: kept.filter((e) => e.step === "preview").length,
    signups: users.filter((u) => { const t = Date.parse(u.created_at); return !exclude.includes(u.id) && t >= from && t < to; }).length,
    briefs: kept.filter((e) => e.step === "brief").length,
    paidPeople: reached("paid"),
    revenue: "error" in revenue ? null : revenue.net,
    payments: "error" in revenue ? null : revenue.payments,
    emailLeads: leads.error ? 0 : leads.count ?? 0,
    sources: [...sources].map(([source, n]) => ({ source, people: n })).sort((a, b) => b.people - a.people).slice(0, 6),
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

function change(now: number, before: number): string {
  if (before === 0) return now === 0 ? "" : `<span style="color:#05603A;">new</span>`;
  const p = Math.round(((now - before) / before) * 100);
  if (Math.abs(p) < 5) return `<span style="color:#9CA3AF;">≈</span>`;
  return p > 0 ? `<span style="color:#05603A;">↑${p}%</span>` : `<span style="color:#B42318;">↓${-p}%</span>`;
}

function section(p: Period, cur: Stats, prev: Stats, money: { active: number; mrr: number } | null): { html: string; text: string } {
  const money$ = (c: number | null) => (c === null ? "–" : formatAUD(c / 100));
  const rows: [string, string, string, string][] = [
    ["Visitors", `${cur.visitors}`, `${prev.visitors}`, change(cur.visitors, prev.visitors)],
    ["Opened the design tool", `${cur.openedTool} (${pct(cur.openedTool, cur.visitors)})`, `${prev.openedTool}`, change(cur.openedTool, prev.openedTool)],
    ["Added a photo", `${cur.addedPhoto}`, `${prev.addedPhoto}`, change(cur.addedPhoto, prev.addedPhoto)],
    ["Previews made", `${cur.previews}`, `${prev.previews}`, change(cur.previews, prev.previews)],
    ["Sign-ups", `${cur.signups}`, `${prev.signups}`, change(cur.signups, prev.signups)],
    ["Email leads", `${cur.emailLeads}`, `${prev.emailLeads}`, change(cur.emailLeads, prev.emailLeads)],
    ["Builder briefs sent", `${cur.briefs}`, `${prev.briefs}`, change(cur.briefs, prev.briefs)],
    ["Paying customers", `${cur.paidPeople} (${pct(cur.paidPeople, cur.visitors)} of visitors)`, `${prev.paidPeople}`, change(cur.paidPeople, prev.paidPeople)],
    ["Revenue", money$(cur.revenue), money$(prev.revenue), cur.revenue !== null && prev.revenue !== null ? change(cur.revenue, prev.revenue) : ""],
  ];
  const title = p.kind === "month" ? `Month: ${p.label}` : p.kind === "quarter" ? `Quarter: ${p.label}` : `Year: ${p.label}`;
  const td = (s: string, extra = "") => `<td style="padding:6px 0;${extra}">${s}</td>`;
  const html = `
    <h2 style="margin:22px 0 4px;font-size:17px;">${esc(title)}</h2>
    <p style="margin:0 0 8px;font-size:12px;color:#6B7480;">Compared with ${esc(p.prevLabel)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td></td><td style="text-align:right;font-size:11px;color:#9CA3AF;">${esc(p.label)}</td><td style="text-align:right;font-size:11px;color:#9CA3AF;">${esc(p.prevLabel)}</td><td></td></tr>
      ${rows.map(([l, a, b, c]) => `<tr>${td(esc(l), "color:#3E4A57;")}${td(esc(a), "text-align:right;font-weight:700;color:#2C3E50;")}${td(esc(b), "text-align:right;color:#6B7480;")}${td(c, "text-align:right;width:56px;")}</tr>`).join("")}
    </table>
    ${money ? `<p style="margin:8px 0 0;font-size:13px;color:#3E4A57;">Now: <strong>${money.active}</strong> active subscription${money.active === 1 ? "" : "s"} · <strong>${formatAUD(money.mrr / 100)}</strong> monthly recurring revenue</p>` : ""}
    <p style="margin:10px 0 4px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6B7480;">Where visitors came from</p>
    <p style="margin:0;font-size:13px;color:#3E4A57;">${cur.sources.length ? cur.sources.map((s) => `${esc(s.source)} ${s.people}`).join(" · ") : "No visitors"}</p>`;
  const text = [`${title} (vs ${p.prevLabel})`, ...rows.map(([l, a, b]) => `  ${l}: ${a} (was ${b})`),
    ...(money ? [`  Now: ${money.active} active subscriptions, MRR ${formatAUD(money.mrr / 100)}`] : []),
    `  Sources: ${cur.sources.map((s) => `${s.source} ${s.people}`).join(", ") || "none"}`, ""].join("\n");
  return { html, text };
}

/** Builds and emails one report covering the given periods (e.g. month + quarter on 1 Oct) */
export async function sendPeriodReport(kinds: PeriodKind[], now = Date.now()): Promise<{ sent: boolean; subject?: string; error?: string }> {
  if (!kinds.length) return { sent: false, error: "nothing due" };
  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (!process.env.RESEND_API_KEY || !sender || /resend\.dev/i.test(sender)) return { sent: false, error: "RESEND_FROM_EMAIL not set" };
  try {
    const periods = kinds.map((k) => lastPeriod(k, now));
    const earliest = Math.min(...periods.map((p) => p.prevFrom));

    const svc = createSupabaseServiceRoleClient();
    const users: { id: string; email?: string; created_at: string }[] = [];
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      users.push(...data.users);
      if (data.users.length < 200) break;
    }
    const adminId = users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())?.id;
    const exclude = adminId ? [adminId] : [];
    const events = await fetchEvents(new Date(earliest).toISOString(), 200_000);
    const m = await moneySnapshot(ADMIN_EMAIL, now);
    const money = "error" in m ? null : { active: m.active, mrr: m.mrr };

    const parts = await Promise.all(periods.map(async (p) =>
      section(p, await statsFor(events, users, exclude, p.from, p.to), await statsFor(events, users, exclude, p.prevFrom, p.prevTo), money)));

    const main = periods[0];
    const subject = `Reno Ready ${periods.map((p) => (p.kind === "month" ? "monthly" : p.kind === "quarter" ? "quarterly" : "yearly")).join(" + ")} report: ${periods.map((p) => p.label).join(" / ")}`;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F0E6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2C3E50;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #EDE5D8;padding:26px 26px 22px;">
    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#D27D5E;">Reno Ready · ${esc(main.kind === "month" ? "monthly" : main.kind === "quarter" ? "quarterly" : "yearly")} report</p>
    <h1 style="margin:6px 0 4px;font-size:22px;">${esc(periods.map((p) => p.label).join(" · "))}</h1>
    <p style="margin:0;font-size:13px;color:#6B7480;">Your own account left out. Times are Brisbane time.</p>
    ${parts.map((x) => x.html).join("")}
    <p style="margin:24px 0 0;"><a href="${SITE}/admin" style="display:inline-block;background:#D27D5E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:12px;">Open the dashboard</a></p>
  </div>
</body></html>`;
    const text = [subject, "", ...parts.map((x) => x.text), `${SITE}/admin`].join("\n");

    const ccSetting = process.env.HEALTH_EMAIL_CC?.trim();
    const cc = ccSetting === "none" ? [] : [ccSetting || CONTACT_EMAIL].filter((e) => e.toLowerCase() !== ADMIN_EMAIL.toLowerCase());
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: sender, to: ADMIN_EMAIL, ...(cc.length && { cc }), subject, html, text });
    if (error) throw new Error(error.message);
    return { sent: true, subject };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[period-report] failed:", msg);
    return { sent: false, error: msg };
  }
}

/** For the daily cron: sends whatever is due today (nothing on most days) */
export async function sendDuePeriodReports(now = Date.now()) {
  return sendPeriodReport(periodsDue(now), now);
}
