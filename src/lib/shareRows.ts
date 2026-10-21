/**
 * The key finishes of the current design, as label/value rows for a client
 * share page. Kept short on purpose: what a homeowner would look at, not the
 * full builder spec. Unselected items are left out.
 */

import { useBuilderStore } from "@/lib/store";
import { isKept } from "@/lib/keepExisting";
import { FLOOR_FORMATS, VANITY_OPTIONS, TAPWARE_OPTIONS, surfaceLabel, bathroomWallLabel } from "@/lib/types";
import { cabinetryLabel, benchtopLabel, kitchenFloorLabel, kitchenWallLabel, bedroomFloorLabel, bedroomWallLabel } from "@/lib/roomTypes";
import { DESIGN_STYLES, isDesignStyle } from "@/lib/designStyles";

export interface ShareRow { label: string; value: string }

/** The current design's rows (share links) */
export function shareRows(): ShareRow[] {
  return designRows(useBuilderStore.getState() as unknown as DesignState);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type DesignState = Record<string, any> & { roomType: "bathroom" | "kitchen" | "bedroom" };

/** Rows for any saved design: the live store, or a draft's snapshot plus its roomType */
export function designRows(s: DesignState): ShareRow[] {
  s = { keepExisting: [], ...s, kitchenSelections: { keepExisting: [], ...s.kitchenSelections }, bedroomSelections: { keepExisting: [], ...s.bedroomSelections } };
  const kept = "Keep existing";
  const rows: [string, string | null | undefined, boolean?][] = [];

  if (s.roomType === "kitchen") {
    const k = s.kitchenSelections;
    rows.push(
      ["Cabinetry", cabinetryLabel(k), isKept(k.keepExisting, "cabinetry")],
      ["Benchtop",  benchtopLabel(k),  isKept(k.keepExisting, "benchtop")],
      ["Floor",     kitchenFloorLabel(k), isKept(k.keepExisting, "floor")],
      ["Walls",     kitchenWallLabel(k),  isKept(k.keepExisting, "walls")],
    );
    { const ds: unknown = k.designStyle; if (isDesignStyle(ds)) rows.push(["Style", DESIGN_STYLES[ds].name]); }
  } else if (s.roomType === "bedroom") {
    const b = s.bedroomSelections;
    rows.push(
      ["Flooring", bedroomFloorLabel(b), isKept(b.keepExisting, "flooring")],
      ["Walls",    bedroomWallLabel(b),  isKept(b.keepExisting, "walls")],
    );
    { const ds: unknown = b.designStyle; if (isDesignStyle(ds)) rows.push(["Style", DESIGN_STYLES[ds].name]); }
  } else {
    rows.push(
      ["Floor",   surfaceLabel(FLOOR_FORMATS.find((f) => f.id === s.floorFormat), s.floorTile, s.customFloorColor), isKept(s.keepExisting, "floor")],
      ["Walls",   bathroomWallLabel(s.wallFormat, s.wallTile, s.customWallColor, s.wallPaintColor), isKept(s.keepExisting, "walls")],
      ["Vanity",  s.vanity ? VANITY_OPTIONS.find((v) => v.id === s.vanity)?.label ?? null : null],
      ["Tapware", s.tapware ? TAPWARE_OPTIONS.find((t) => t.id === s.tapware)?.label ?? null : null],
    );
    { const ds: unknown = s.designStyle; if (isDesignStyle(ds)) rows.push(["Style", DESIGN_STYLES[ds].name]); }
  }

  return rows
    .map(([label, value, keep]) => ({ label, value: keep ? kept : value ?? "" }))
    .filter((r) => r.value);
}
