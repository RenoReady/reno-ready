/**
 * "Keep the same as my current room" — per-category opt-out of a finish.
 *
 * A kept category has no selection, so it adds $0 to the estimate (every
 * room's cost engine only charges for chosen items), and the AI prompt is
 * told to leave that surface exactly as it is.
 */

export type BathroomKeepKey = "floor" | "walls" | "vanity" | "tapware";
export type KitchenKeepKey  = "cabinetry" | "benchtop" | "mixer" | "splashback" | "floor" | "walls" | "appliances" | "ceiling";
export type BedroomKeepKey  = "flooring" | "walls" | "ceiling" | "lighting" | "storage" | "windows";

/** Selection fields cleared when a category is kept */
export const BATHROOM_KEEP_FIELDS: Record<BathroomKeepKey, string[]> = {
  floor:   ["floorTile", "customFloorColor"],
  walls:   ["wallTile", "customWallColor"],
  vanity:  ["vanity"],
  tapware: ["tapware"],
};

export const KITCHEN_KEEP_FIELDS: Record<KitchenKeepKey, string[]> = {
  cabinetry:  ["cabinetry"],
  benchtop:   ["benchtop"],
  mixer:      ["mixer"],
  splashback: ["splashback"],
  floor:      ["floorFinish", "floorColor"],
  walls:      ["wallColor"],
  appliances: ["cooktop", "dishwasher"],
  ceiling:    ["ceilingStyle"],
};

export const BEDROOM_KEEP_FIELDS: Record<BedroomKeepKey, string[]> = {
  flooring: ["flooring", "flooringColor"],
  walls:    ["wallTreatment", "wallColor"],
  ceiling:  ["ceilingStyle", "ceilingColor"],
  lighting: ["lighting"],
  storage:  ["storage"],
  windows:  ["windowTreatment"],
};

export const KEEP_TEXT = "Keep existing";

export function isKept<K extends string>(list: readonly K[] | undefined | null, key: K): boolean {
  return !!list?.includes(key);
}

/** Patch that turns a category's keep on (clearing its fields) or off */
export function keepPatch<K extends string>(
  fields: Record<K, string[]>,
  list: readonly K[] | undefined,
  key: K,
  on: boolean,
): Record<string, unknown> {
  const current = list ?? [];
  const next = on ? [...current.filter((k) => k !== key), key] : current.filter((k) => k !== key);
  const cleared = on ? Object.fromEntries(fields[key].map((f) => [f, null])) : {};
  return { ...cleared, keepExisting: next };
}

/** Choosing a new finish in a kept category switches that keep off */
export function withKeepReleased<K extends string>(
  fields: Record<K, string[]>,
  list: readonly K[] | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const current = list ?? [];
  if (current.length === 0 || "keepExisting" in patch) return patch;
  const released = (Object.keys(fields) as K[]).filter((k) =>
    fields[k].some((f) => f in patch && patch[f] !== null && patch[f] !== undefined),
  );
  if (released.length === 0) return patch;
  return { ...patch, keepExisting: current.filter((k) => !released.includes(k)) };
}

/** Summary text: the chosen option, "Keep existing", or the fallback */
export function selectionText(label: string | null | undefined, kept: boolean, fallback = "Not selected"): string {
  return label ?? (kept ? KEEP_TEXT : fallback);
}
