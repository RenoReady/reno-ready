/**
 * The admin "Visitor journey" numbers (server only), built from funnel_events:
 * how many people reached each step (overall and by room), where they are,
 * what they use, and each account's own timeline for the Users table.
 */

import { FUNNEL_STEPS, STEP_LABEL, fetchEvents, furthestStep, groupPeople, type FunnelStep, type Person } from "@/lib/funnel";

export const ROOMS = ["bathroom", "kitchen", "bedroom"] as const;

export interface FunnelRow { step: FunnelStep; label: string; all: number; byRoom: Record<(typeof ROOMS)[number], number> }
export interface Count { name: string; people: number }

export interface JourneyReport {
  days: number;
  people: number;
  funnel: FunnelRow[];
  previewsFailed: number;
  previewsMade: number;
  cities: Count[];
  postcodes: Count[];
  devices: Count[];
  returning: number;
  /** account id → their journey (for the Users table) */
  byUser: Map<string, Person>;
}

const top = (m: Map<string, number>, n: number): Count[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, people]) => ({ name, people }));
const bump = (m: Map<string, number>, k: string | null | undefined) => { if (k) m.set(k, (m.get(k) ?? 0) + 1); };
const lastWith = <K extends keyof Person["events"][number]>(p: Person, k: K) => {
  for (let i = p.events.length - 1; i >= 0; i--) if (p.events[i][k]) return p.events[i][k];
  return null;
};

export async function journeyReport(days: number, excludeUserIds: string[]): Promise<JourneyReport> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const events = await fetchEvents(since);
  const people = groupPeople(events, excludeUserIds);

  const funnel: FunnelRow[] = FUNNEL_STEPS.map((step) => ({ step, label: STEP_LABEL[step], all: 0, byRoom: { bathroom: 0, kitchen: 0, bedroom: 0 } }));
  const cities = new Map<string, number>(), postcodes = new Map<string, number>(), devices = new Map<string, number>();
  let returning = 0, previewsFailed = 0, previewsMade = 0;
  const byUser = new Map<string, Person>();

  for (const p of people) {
    for (const row of funnel) {
      if (!p.steps.has(row.step)) continue;
      row.all++;
      if (p.room && p.room in row.byRoom) row.byRoom[p.room as (typeof ROOMS)[number]]++;
    }
    const city = lastWith(p, "city"), region = lastWith(p, "region"), country = lastWith(p, "country");
    bump(cities, city ? `${city}${region ? `, ${region}` : ""}${country && country !== "AU" ? ` (${country})` : ""}` : null);
    bump(postcodes, lastWith(p, "postcode") as string | null);
    bump(devices, (p.events.find((e) => e.device)?.device) ?? null);
    if (p.events.some((e) => e.step === "visit" && e.is_returning)) returning++;
    for (const e of p.events) {
      if (e.step === "preview_failed") previewsFailed++;
      if (e.step === "preview") previewsMade++;
    }
    if (p.userId) byUser.set(p.userId, p);
  }

  return {
    days, people: people.length, funnel, previewsFailed, previewsMade,
    cities: top(cities, 10), postcodes: top(postcodes, 10), devices: top(devices, 3), returning, byUser,
  };
}

export { furthestStep, STEP_LABEL };
