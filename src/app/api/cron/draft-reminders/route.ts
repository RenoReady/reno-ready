/**
 * GET /api/cron/draft-reminders — run daily by Vercel Cron (see vercel.json).
 *
 * Vercel sends "Authorization: Bearer $CRON_SECRET". The admin can also open
 * it while signed in; add ?dry=1 to see who would be emailed without sending.
 * After the reminders it sends the admin's daily health email (src/lib/healthReport.ts),
 * and on the 1st of a month the monthly (and quarterly / yearly) report
 * (src/lib/periodReport.ts). The admin can send a report on demand with
 * ?report=month (or quarter / year): that sends only the report.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/config";
import { runDraftReminders } from "@/lib/reminders";
import { sendHealthEmail } from "@/lib/healthReport";
import { sendDuePeriodReports, sendPeriodReport, type PeriodKind } from "@/lib/periodReport";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function allowed(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) return true;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!(await allowed(req))) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  // on demand: just the report for the last complete month / quarter / year
  const report = req.nextUrl.searchParams.get("report");
  if (report === "month" || report === "quarter" || report === "year") {
    const sent = await sendPeriodReport([report as PeriodKind]);
    console.info("[period-report]", JSON.stringify(sent));
    return NextResponse.json({ report: sent });
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const result = await runDraftReminders({ dryRun });
  console.info("[reminders]", JSON.stringify(result));
  // then the admin's daily health email (not on a dry run)
  const health = dryRun ? { sent: false, error: "dry run" } : await sendHealthEmail();
  console.info("[health]", JSON.stringify(health));
  // on the 1st of a month: last month's report (plus quarter / year when they end)
  const periods = dryRun ? { sent: false, error: "dry run" } : await sendDuePeriodReports();
  if (periods.error !== "nothing due") console.info("[period-report]", JSON.stringify(periods));
  return NextResponse.json({ ...result, health, periods });
}
