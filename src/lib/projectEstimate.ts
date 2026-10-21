/**
 * Prices one room from a saved draft's choices, the same way the builder's
 * estimate panel does, so a whole-home total always matches each room.
 * Pure: safe on the server (drafts list) and in the browser (PDF).
 */

import { calcEstimatedCost, buildItemisedCosts } from "@/lib/types";
import { calcKitchenCost, calcBedroomCost, type RoomType } from "@/lib/roomTypes";
import { calcBriefCostItems, type ProjectBrief } from "@/lib/projectBrief";

export interface RoomEstimate {
  /** Best single figure (the midpoint for bathrooms), rounded to $500 */
  total: number;
  low:   number;
  high:  number;
  items: { label: string; amount: number; detail?: string }[];
}

const round500 = (n: number) => Math.round(n / 500) * 500;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function estimateFromSnapshot(roomType: RoomType, snap: Record<string, any>): RoomEstimate | null {
  try {
    const brief = (snap.projectBrief ?? null) as ProjectBrief | null;
    const briefItems = brief ? calcBriefCostItems(brief, roomType) : [];
    const briefTotal = briefItems.reduce((n, i) => n + i.amount, 0);

    if (roomType === "kitchen" || roomType === "bedroom") {
      const sel = { keepExisting: [], ...(roomType === "kitchen" ? snap.kitchenSelections : snap.bedroomSelections) };
      const base = roomType === "kitchen" ? calcKitchenCost(sel) : calcBedroomCost(sel);
      const total = round500(base.total + briefTotal);
      // kitchens and bedrooms show one figure; the ±12% range is for the project summary
      return { total, low: round500((base.total + briefTotal) * 0.88), high: round500((base.total + briefTotal) * 1.12), items: [...base.items, ...briefItems] };
    }

    const surfaces = {
      floorFormat: snap.floorFormat ?? null, wallFormat: snap.wallFormat ?? null,
      wallPaintFinish: snap.wallPaintFinish ?? null, wallPaintColor: snap.wallPaintColor ?? null,
      designStyle: snap.designStyle ?? null,
    };
    const args = [
      snap.floorTile ?? null, snap.wallTile ?? null, snap.vanity ?? null, snap.tapware ?? null,
      snap.structuralChanges ?? {}, 0, snap.bathroomSize ?? null, snap.customLength ?? 0, snap.customWidth ?? 0,
      snap.lightingOption ?? null, surfaces,
    ] as Parameters<typeof calcEstimatedCost>;
    const est = calcEstimatedCost(...args);
    const items = buildItemisedCosts(...(args as unknown as Parameters<typeof buildItemisedCosts>));
    return {
      total: round500(est + briefTotal),
      low:   round500(est * 0.88 + briefTotal),
      high:  round500(est * 1.12 + briefTotal),
      items: [...items, ...briefItems],
    };
  } catch {
    return null;
  }
}
