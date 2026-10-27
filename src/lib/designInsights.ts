/**
 * Admin "What people design" (server only): the most popular styles, finishes
 * and structural changes per room, plus budgets and estimates, from the
 * designs people actually generated (account drafts with a preview).
 * Drafts hold each design's latest choices, newest 12 per account.
 */

import { draftOwners, listDraftRecords } from "@/lib/draftStore";
import { estimateFromSnapshot } from "@/lib/projectEstimate";
import { DESIGN_STYLES, isDesignStyle } from "@/lib/designStyles";
import type { RoomType } from "@/lib/roomTypes";

export interface Choice { name: string; count: number }
export interface Category { label: string; total: number; top: Choice[] }
export interface RoomInsights {
  room: RoomType;
  designs: number;
  people: number;
  medianEstimate: number | null;
  medianBudget: number | null;
  estimateBands: Choice[];
  categories: Category[];
}

/** "matte-black" → "Matte black" */
const pretty = (v: unknown): string | null => {
  if (typeof v !== "string" || !v.trim()) return null;
  if (v.startsWith("#")) return null;   // custom colours aren't comparable
  const s = v.replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return s[0].toUpperCase() + s.slice(1);
};
const styleName = (v: unknown) => (isDesignStyle(v) ? DESIGN_STYLES[v].name : null);
const flag = (on: unknown, label: string) => (on ? label : null);
const named = (v: unknown) => (v && typeof v === "object" && "name" in v && typeof (v as { name: unknown }).name === "string" ? (v as { name: string }).name : null);

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const BANDS: [number, string][] = [[15_000, "Under $15k"], [25_000, "$15k–$25k"], [35_000, "$25k–$35k"], [50_000, "$35k–$50k"], [Infinity, "$50k+"]];

type Snap = Record<string, unknown>;
type Picker = (s: Snap) => (string | null)[];

/** What to tally for each room: label → the value(s) one design contributes */
const FIELDS: Record<RoomType, [string, Picker][]> = {
  bathroom: [
    ["Style",           (s) => [styleName(s.designStyle)]],
    ["Floor tile",      (s) => [named(s.floorTile)]],
    ["Wall tile",       (s) => [named(s.wallTile)]],
    ["Vanity",          (s) => [pretty(s.vanity)]],
    ["Tapware",         (s) => [pretty(s.tapware)]],
    ["Size",            (s) => [pretty(s.bathroomSize)]],
    ["Structural changes", (s) => {
      const c = (s.structuralChanges ?? {}) as Record<string, unknown>;
      return [flag(c.removeBathtub, "Remove the bath"), flag(c.addWalkinShower, "Walk-in shower"), flag(c.replaceToilet, "New toilet"),
        flag(c.inWallCistern, "In-wall cistern"), flag(typeof c.showerNiche === "string" && c.showerNiche !== "none", "Shower niche")];
    }],
  ],
  kitchen: [
    ["Style",           (s) => [styleName(k(s).designStyle)]],
    ["Cabinetry",       (s) => [pretty(k(s).cabinetry)]],
    ["Benchtop",        (s) => [pretty(k(s).benchtop)]],
    ["Splashback",      (s) => [pretty(k(s).splashback)]],
    ["Tapware",         (s) => [pretty(k(s).mixer)]],
    ["Cooktop",         (s) => [pretty(k(s).cooktop)]],
    ["Layout changes",  (s) => {
      const x = k(s);
      return [flag(x.hasIsland, "Island bench"), flag(x.hasButlersPantry, "Butler's pantry"), flag(x.hasWallChange, "Wall change"), flag(x.hasSinkRoughin, "Moving the sink"), flag(x.hasApplianceRoughin, "New gas or power point")];
    }],
  ],
  bedroom: [
    ["Style",           (s) => [styleName(b(s).designStyle)]],
    ["Flooring",        (s) => [pretty(b(s).flooringFormat)]],
    ["Walls",           (s) => [pretty(b(s).wallTreatment)]],
    ["Lighting",        (s) => [pretty(b(s).lighting)]],
    ["Storage",         (s) => [pretty(b(s).storage)]],
    ["Window",          (s) => [pretty(b(s).windowTreatment)]],
    ["Extras",          (s) => {
      const x = b(s);
      return [flag(x.hasVJWall, "VJ feature wall"), flag(x.hasMediaJoinery, "Media joinery"), flag(x.hasPendantRoughin, "Bedside pendants"), flag(x.hasElectricalWork, "Electrical work")];
    }],
  ],
};
function k(s: Snap) { return (s.kitchenSelections ?? {}) as Record<string, unknown>; }
function b(s: Snap) { return (s.bedroomSelections ?? {}) as Record<string, unknown>; }
const budgetOf = (room: RoomType, s: Snap) => Number(room === "kitchen" ? k(s).budget : room === "bedroom" ? b(s).budget : s.budget) || null;

export async function designInsights(excludeUserIds: string[]): Promise<RoomInsights[]> {
  const skip = new Set(excludeUserIds);
  const owners = (await draftOwners()).filter((id) => !skip.has(id));
  const drafts = (await Promise.all(owners.map(async (owner) => (await listDraftRecords(owner)).map((d) => ({ owner, d })))))
    .flat().filter(({ d }) => d.hasRender);

  return (["bathroom", "kitchen", "bedroom"] as const).map((room) => {
    const mine = drafts.filter(({ d }) => d.roomType === room);
    const estimates: number[] = [], budgets: number[] = [];
    const tallies = FIELDS[room].map(([label]) => ({ label, counts: new Map<string, number>(), total: 0 }));
    for (const { d } of mine) {
      const est = estimateFromSnapshot(room, d.snapshot)?.total;
      if (est) estimates.push(est);
      const budget = budgetOf(room, d.snapshot);
      if (budget) budgets.push(budget);
      FIELDS[room].forEach(([, pick], i) => {
        const values = pick(d.snapshot).filter((v): v is string => !!v);
        if (values.length) tallies[i].total++;
        for (const v of values) tallies[i].counts.set(v, (tallies[i].counts.get(v) ?? 0) + 1);
      });
    }
    const bands = new Map<string, number>();
    for (const e of estimates) { const label = BANDS.find(([max]) => e < max)![1]; bands.set(label, (bands.get(label) ?? 0) + 1); }
    return {
      room,
      designs: mine.length,
      people: new Set(mine.map((x) => x.owner)).size,
      medianEstimate: median(estimates),
      medianBudget: median(budgets),
      estimateBands: BANDS.map(([, label]) => ({ name: label, count: bands.get(label) ?? 0 })).filter((x) => x.count),
      categories: tallies.map((t) => ({
        label: t.label, total: t.total,
        top: [...t.counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, count]) => ({ name, count })),
      })),
    };
  });
}
