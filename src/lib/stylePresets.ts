/**
 * "Start from a style" presets for every design tool. The same four looks run
 * across bathroom, kitchen and bedroom so the choice feels familiar wherever a
 * user starts; each maps onto that room's own options.
 *
 * Presets never override a category the user has chosen to keep as it is.
 */

import type { VanityType, TapwareFinish, TileStyle } from "./types";
import type { KitchenSelections, BedroomSelections } from "./roomTypes";

/** What a style card shows: an upper and lower surface plus a fixture swatch */
export interface StyleLook {
  id:          string;
  name:        string;
  description: string;
  /** CSS backgrounds for the card preview */
  top:         string;
  bottom:      string;
  dot?:        string;
}

const tile = (id: string) => `url(/tiles/${id}.webp) center / cover`;
const grad = (a: string, b: string) => `linear-gradient(135deg, ${a}, ${b})`;
const METAL = {
  black:  grad("#3a3a3a", "#111111"),
  white:  grad("#ffffff", "#e4e3df"),
  chrome: grad("#ededed", "#a8a8a8"),
  gold:   grad("#e8c97e", "#b8962c"),
};

// ── Bathroom ──────────────────────────────────────────────────────

export interface BathroomStyle extends StyleLook {
  floorTileId: string;
  wallTileId:  string;
  vanity:      VanityType;
  tapware:     TapwareFinish;
  tileStyle:   TileStyle | null;
}

const bathroom = (s: Omit<BathroomStyle, "top" | "bottom">): BathroomStyle =>
  ({ ...s, top: tile(s.wallTileId), bottom: tile(s.floorTileId) });

export const BATHROOM_STYLES: BathroomStyle[] = [
  bathroom({ id: "modern-contemporary", name: "Modern Contemporary", description: "Large-format slate, concrete walls, matte black tapware.",
    floorTileId: "matte-slate-lg", wallTileId: "smoked-concrete", vanity: "floating", tapware: "matte-black", tileStyle: "large-format", dot: METAL.black }),
  bathroom({ id: "warm-minimalist", name: "Warm Minimalist", description: "Nude travertine, fluted white walls, soft white fixtures.",
    floorTileId: "travertine", wallTileId: "fluted-white", vanity: "floating", tapware: "white", tileStyle: "large-format", dot: METAL.white }),
  bathroom({ id: "coastal-hamptons", name: "Coastal Hamptons", description: "Honed limestone, white zellige, classic vanity, chrome.",
    floorTileId: "honed-limestone", wallTileId: "zellige-white", vanity: "freestanding", tapware: "chrome", tileStyle: "herringbone", dot: METAL.chrome }),
  bathroom({ id: "luxurious-traditional", name: "Luxurious Traditional", description: "Marble walls, checkerboard floor, brushed gold tapware.",
    floorTileId: "charcoal-slate", wallTileId: "marble-blanc", vanity: "freestanding", tapware: "brushed-gold", tileStyle: "checkerboard", dot: METAL.gold }),
];

// ── Kitchen ───────────────────────────────────────────────────────

export interface KitchenStyle extends StyleLook { patch: Partial<KitchenSelections> }

export const KITCHEN_STYLES: KitchenStyle[] = [
  {
    id: "modern-contemporary", name: "Modern Contemporary", description: "Handleless grey cabinetry, porcelain slab, matte black mixer.",
    top: grad("#E8E8E8", "#B0B0B0"), bottom: grad("#C9C5C2", "#A9A5A2"), dot: METAL.black,
    patch: { cabinetry: "flat-panel", benchtop: "porcelain-slab", splashback: "slab-match", mixer: "matte-black",
             floorFinish: "large-grey", floorColor: null, wallColor: "#D4D8DC", ceilingStyle: "standard-white" },
  },
  {
    id: "warm-minimalist", name: "Warm Minimalist", description: "Soft beige fronts, stone benchtop, oak-look floor, white mixer.",
    top: grad("#D8CEBC", "#B8AC98"), bottom: tile("natural-oak"), dot: METAL.white,
    patch: { cabinetry: "flat-panel-beige", benchtop: "engineered-stone", splashback: "slab-match", mixer: "white",
             floorFinish: "timber-oak", floorColor: null, wallColor: "#F8F5F0", ceilingStyle: "standard-white" },
  },
  {
    id: "coastal-hamptons", name: "Coastal Hamptons", description: "White shaker, subway splashback, VJ ceiling, chrome mixer.",
    top: grad("#F5F0E8", "#C8C0B8"), bottom: tile("vertical-stack"), dot: METAL.chrome,
    patch: { cabinetry: "shaker", benchtop: "engineered-stone", splashback: "white-subway", mixer: "chrome",
             floorFinish: "large-white", floorColor: null, wallColor: "#F8F5F0", ceilingStyle: "vj-paneling" },
  },
  {
    id: "luxurious-traditional", name: "Luxurious Traditional", description: "Sage shaker, Calacatta slab, coffered ceiling, brass mixer.",
    top: grad("#8FAF8A", "#65885D"), bottom: tile("marble-blanc"), dot: METAL.gold,
    patch: { cabinetry: "shaker-sage", benchtop: "engineered-stone", splashback: "calacatta-slab", mixer: "brushed-brass",
             floorFinish: "timber-oak", floorColor: null, wallColor: "#C4A882", ceilingStyle: "coffered" },
  },
];

// ── Bedroom ───────────────────────────────────────────────────────

export interface BedroomStyle extends StyleLook { patch: Partial<BedroomSelections> }

export const BEDROOM_STYLES: BedroomStyle[] = [
  {
    id: "modern-contemporary", name: "Modern Contemporary", description: "Microcement walls, polished concrete, downlights, blockout blinds.",
    top: grad("#BDB8B0", "#9A958E"), bottom: tile("smoked-concrete"),
    patch: { flooring: "polished-concrete", flooringColor: null, wallTreatment: "microcement", wallColor: null,
             lighting: "architectural-downlights", windowTreatment: "blockout-roller", ceilingStyle: "standard-white", ceilingColor: null },
  },
  {
    id: "warm-minimalist", name: "Warm Minimalist", description: "Limewash walls, pale ash boards, LED cove glow, sheer drapes.",
    top: grad("#ECE5D9", "#D9CFBF"), bottom: grad("#E0CCAA", "#B8A87E"),
    patch: { flooring: "ash", flooringColor: null, wallTreatment: "limewash-paint", wallColor: null,
             lighting: "led-cove", windowTreatment: "floor-ceiling-sheers", ceilingStyle: "standard-white", ceilingColor: null },
  },
  {
    id: "coastal-hamptons", name: "Coastal Hamptons", description: "VJ panelling, blonde beech boards, statement pendants, sheers.",
    top: "repeating-linear-gradient(90deg, #F6F4EF 0 13px, #DCD7CD 13px 15px)", bottom: grad("#D4B88A", "#AC8858"),
    patch: { flooring: "beech", flooringColor: null, wallTreatment: "vj-paneling", wallColor: null,
             lighting: "statement-pendant", windowTreatment: "floor-ceiling-sheers", ceilingStyle: "vj-paneling", ceilingColor: null },
  },
  {
    id: "luxurious-traditional", name: "Luxurious Traditional", description: "Venetian plaster, oak herringbone, coffered ceiling, pendants.",
    top: grad("#DCD2C3", "#BFB09A"), bottom: tile("herringbone"),
    patch: { flooring: "engineered-oak-herringbone", flooringColor: null, wallTreatment: "venetian-plaster", wallColor: null,
             lighting: "statement-pendant", windowTreatment: "floor-ceiling-sheers", ceilingStyle: "coffered", ceilingColor: null },
  },
];

/**
 * Drops any fields that belong to a kept category, so a preset never
 * overwrites something the user has chosen to keep as it is.
 */
export function withoutKept<K extends string, T extends object>(
  patch: T,
  keepFields: Record<K, string[]>,
  kept: readonly K[] | undefined,
): T {
  const blocked = new Set((kept ?? []).flatMap((k) => keepFields[k] ?? []));
  return Object.fromEntries(Object.entries(patch).filter(([f]) => !blocked.has(f))) as T;
}

/** Patch that clears what a preset set (used when the active preset is tapped again) */
export function clearPatch<T extends object>(patch: T): T {
  return Object.fromEntries(Object.keys(patch).map((f) => [f, null])) as T;
}
