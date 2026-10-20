/**
 * roomTypes.ts
 *
 * Defines all room-specific types, selection options, cost items, and AI prompt
 * builders for the multi-room renovation planner.
 *
 * Rooms: Bathroom (legacy) · Kitchen · Living/Master Bedroom
 *
 * Cost benchmarks calibrated to QLD 2026 mid-range renovations.
 */

import { isKept, type KitchenKeepKey, type BedroomKeepKey } from "./keepExisting";
import {
  FLOOR_TILES, FLOOR_FORMATS, STONE_TIMBER_TONES, PAINT_FINISHES, PAINT_TONES,
  surfaceLabel, surfacePrompt, paintLabel, paintPrompt,
  type TileOption, type FloorFormat, type SurfaceFormat, type WallPaintFinish, type PaintFinish,
} from "./types";
import { styleSection, styleCostItem, type DesignStyleId } from "./designStyles";

// ── Room type ────────────────────────────────────────────────────────────────

export type RoomType = "bathroom" | "kitchen" | "bedroom";

export const ROOM_LABELS: Record<RoomType, string> = {
  bathroom: "Bathroom",
  kitchen:  "Kitchen",
  bedroom:  "Living / Master Bedroom",
};

export const ROOM_DESCRIPTIONS: Record<RoomType, string> = {
  bathroom: "Tiles, vanity, tapware & structural changes",
  kitchen:  "Cabinetry, benchtop, appliances & finishes",
  bedroom:  "Flooring, joinery, wall treatments & lighting",
};

// ── Global ceiling ────────────────────────────────────────────────────────────

export type CeilingStyle = "standard-white" | "custom-paint";

export const CEILING_CUSTOM_COST = 450;

export const CEILING_OPTIONS: { id: CeilingStyle; label: string; sub: string; cost: number }[] = [
  { id: "standard-white", label: "Standard Crisp White", sub: "Fresh flat white — the default",      cost: 0 },
  { id: "custom-paint",   label: "Custom Paint Colour",  sub: "Any colour from the colour wheel",     cost: CEILING_CUSTOM_COST },
];

/** Ceiling for the AI: crisp white unless a custom colour is chosen */
export function ceilingPrompt(style: CeilingStyle | string | null | undefined, color: string | null | undefined): string {
  return style === "custom-paint" && color ? `painted ceiling in the exact colour ${color}` : "crisp flat white painted ceiling";
}
export function ceilingCost(style: CeilingStyle | string | null | undefined): number {
  return style === "custom-paint" ? CEILING_CUSTOM_COST : 0;
}
export function ceilingLabel(style: CeilingStyle | string | null | undefined, color: string | null | undefined): string {
  return style === "custom-paint" ? `Custom Paint${color ? ` ${color}` : ""}` : "Standard Crisp White";
}

// ── Kitchen types ─────────────────────────────────────────────────────────────

export type KitchenRoomSize  = "galley" | "standard" | "large" | "custom";
/** Cabinetry door profile — the colour is chosen separately (cabinetColor) */
export type CabinetryStyle   = "shaker" | "flat-panel" | "natural-timber";
export type BenchtopMaterial = "engineered-stone" | "porcelain-slab" | "timber";
export type MixerFinish      = "brushed-brass" | "matte-black" | "chrome" | "white";
export type SplashbackStyle  = "white-subway" | "grey-subway" | "calacatta-slab" | "mirrored" | "vj-panel" | "slab-match";
export type CooktopType      = "induction" | "gas";
export type DishwasherType   = "integrated" | "freestanding";
/** Kitchen walls use the shared wall colour finishes */
export type KitchenWallFinish = WallPaintFinish;

export interface KitchenSizeOption {
  id:       KitchenRoomSize;
  label:    string;
  sub:      string;
  approxSqm: string;
  baseCost: number;
}

export const KITCHEN_SIZE_OPTIONS: KitchenSizeOption[] = [
  { id: "galley",   label: "Galley / Small",    sub: "Single-run or narrow galley",     approxSqm: "< 12m²",  baseCost: 22_000 },
  { id: "standard", label: "Standard",           sub: "L-shape, U-shape or island",      approxSqm: "12–20m²", baseCost: 32_000 },
  { id: "large",    label: "Large / Open-Plan",  sub: "Expansive open-plan or chef kitchen", approxSqm: "20m²+",  baseCost: 48_000 },
  { id: "custom",   label: "Custom Size",        sub: "Enter your exact dimensions",     approxSqm: "",        baseCost: 0      },
];

// ── Kitchen budget constants (AU market 2026) ─────────────────────────────────
// Basic refresh: ~$15k  |  Mid-range: $35k–$55k  |  Premium: $80k+
export const KITCHEN_BUDGET_MIN     = 15_000;
export const KITCHEN_BUDGET_MAX     = 80_000;
export const KITCHEN_BUDGET_STEP    =  1_000;
export const KITCHEN_BUDGET_DEFAULT = 40_000;

export interface KitchenSelections {
  roomSize:             KitchenRoomSize | null;
  customLength:         number;   // metres — used when roomSize === "custom"
  customWidth:          number;
  cabinetry:            CabinetryStyle   | null;  // null = deselected
  benchtop:             BenchtopMaterial | null;
  /** Cabinet colour (hex), chosen in the cabinetry drawer */
  cabinetColor:         string | null;
  /** Benchtop tone id (e.g. "white-calacatta"), or a custom "#hex" */
  benchtopTone:         string | null;
  mixer:                MixerFinish      | null;
  splashback:           SplashbackStyle  | null;
  /** Floor Step A — the format; Step B is floorTone (or a custom floorColor) */
  floorFormat:          FloorFormat | null;
  floorTone:            string | null;             // tone id (SURFACE_TONES)
  floorColor:           string | null;             // custom hex instead of a tone
  /** Wall colour Step A — the paint finish; Step B is wallColor */
  wallFinish:           KitchenWallFinish | null;
  wallColor:            string | null;             // wall colour (hex)
  cooktop:              CooktopType | null;
  dishwasher:           DishwasherType | null;
  ceilingStyle:         CeilingStyle | null;
  ceilingColor:         string | null;             // custom ceiling paint colour
  /** Overall look for the AI — never selects finishes */
  designStyle:          DesignStyleId | null;
  hasIsland:            boolean;  // triggers gas/plumbing advisory
  hasApplianceRoughin:  boolean;  // new gas point / 15-amp circuit
  hasSinkRoughin:       boolean;  // moving the plumbing stack
  hasWallChange:        boolean;  // open-plan wall removal/addition
  hasButlersPantry:     boolean;  // butler's pantry integration
  /** Categories kept as they are — no cost, left untouched in the render */
  keepExisting:         KitchenKeepKey[];
  budget:               number;   // user's target budget (AUD)
  customNote:           string;
}

// ── Kitchen options ───────────────────────────────────────────────────────────

/** A colour or tone in a style-first picker; `color` is the hex used for paint-like finishes and custom matching */
export interface FinishTone { id: string; name: string; color: string; sub?: string }

/** Cabinetry: pick a door profile, then its colour (stored as a hex in cabinetColor) */
const CABINET_PAINT: FinishTone[] = [
  { id: "pure-white",  name: "Pure White",  color: "#F5F2EC", sub: "Clean and bright" },
  { id: "sage-green",  name: "Sage Green",  color: "#8FAF8A", sub: "Soft, earthy green" },
  { id: "matte-black", name: "Matte Black", color: "#2B2B2B", sub: "Bold and architectural" },
  { id: "cream-beige", name: "Cream Beige", color: "#D8CEBC", sub: "Warm neutral" },
];
const CABINET_TIMBER: FinishTone[] = [
  { id: "light-oak",   name: "Light Oak",   color: "#D6B88E", sub: "Pale, Scandi warmth" },
  { id: "natural-oak", name: "Natural Oak", color: "#B8865A", sub: "Classic mid-tone oak" },
  { id: "walnut",      name: "Walnut",      color: "#5C3D2A", sub: "Rich and dark" },
  { id: "smoked-oak",  name: "Smoked Oak",  color: "#6E5642", sub: "Deep, moody oak" },
];

export const CABINETRY_OPTIONS: { id: CabinetryStyle; label: string; sub: string; costAdj: number; swatch: string; tones: FinishTone[]; defaultTone: string }[] = [
  { id: "shaker",         label: "Shaker Profile",        sub: "Classic recessed-panel doors", costAdj: 0,     swatch: "cab-shaker--pure-white",  tones: CABINET_PAINT,  defaultTone: "pure-white" },
  { id: "flat-panel",     label: "Flat-Panel Minimalist", sub: "Handleless, seamless fronts",  costAdj: 1_500, swatch: "cab-flat--matte-black",   tones: CABINET_PAINT,  defaultTone: "matte-black" },
  { id: "natural-timber", label: "Natural Timber",        sub: "Real timber veneer doors",     costAdj: 3_000, swatch: "cab-timber--natural-oak", tones: CABINET_TIMBER, defaultTone: "natural-oak" },
];
export const cabinetSwatch = (style: string, tone: string) => `cab-${style === "natural-timber" ? "timber" : style === "flat-panel" ? "flat" : "shaker"}--${tone}`;

/** Benchtops: pick a material, then a tone or veining (benchtopTone: tone id, or a custom "#hex") */
const BENCH_STONE: FinishTone[] = [
  { id: "white-calacatta", name: "White Calacatta", color: "#F2F0EC", sub: "Bold grey-gold veins" },
  { id: "grey-veined",     name: "Grey Veined",     color: "#C9CACB", sub: "Soft grey marble look" },
  { id: "black",           name: "Black",           color: "#2A2A2C", sub: "Dramatic, fine white veins" },
  { id: "terrazzo",        name: "Terrazzo",        color: "#ECE7DF", sub: "Speckled stone chips" },
];
const BENCH_TIMBER: FinishTone[] = [
  { id: "blackbutt",   name: "Blackbutt",   color: "#C9A57A", sub: "Light Australian hardwood" },
  { id: "spotted-gum", name: "Spotted Gum", color: "#9A6B47", sub: "Warm, varied grain" },
  { id: "oak",         name: "Oak",         color: "#B98E5E", sub: "Classic oiled oak" },
];

export const BENCHTOP_OPTIONS: { id: BenchtopMaterial; label: string; sub: string; costAdj: number; swatch: string; tones: FinishTone[]; defaultTone: string }[] = [
  { id: "engineered-stone", label: "Engineered Stone", sub: "20mm, durable and stain-resistant", costAdj: 0,     swatch: "bench--white-calacatta", tones: BENCH_STONE,  defaultTone: "white-calacatta" },
  { id: "porcelain-slab",   label: "Porcelain Slab",   sub: "Ultra-thin, heatproof, hygienic",   costAdj: 1_200, swatch: "bench--grey-veined",     tones: BENCH_STONE,  defaultTone: "grey-veined" },
  { id: "timber",           label: "Solid Timber",     sub: "Oiled hardwood, warm and unique",   costAdj: 2_500, swatch: "bench--blackbutt",       tones: BENCH_TIMBER, defaultTone: "blackbutt" },
];
export const benchSwatch = (tone: string) => `bench--${tone}`;

/** "Sage Green · Shaker Profile" */
export function cabinetryLabel(sel: Pick<KitchenSelections, "cabinetry" | "cabinetColor">): string | null {
  const opt = CABINETRY_OPTIONS.find((o) => o.id === sel.cabinetry);
  if (!opt) return null;
  const tone = sel.cabinetColor ? opt.tones.find((t) => t.color.toLowerCase() === sel.cabinetColor!.toLowerCase()) : undefined;
  const colour = tone?.name ?? (sel.cabinetColor ? `Custom ${sel.cabinetColor}` : null);
  return [colour, opt.label].filter(Boolean).join(" · ");
}
/** "White Calacatta · Engineered Stone" */
export function benchtopLabel(sel: Pick<KitchenSelections, "benchtop" | "benchtopTone">): string | null {
  const opt = BENCHTOP_OPTIONS.find((o) => o.id === sel.benchtop);
  if (!opt) return null;
  const t = sel.benchtopTone;
  const tone = t?.startsWith("#") ? `Custom ${t}` : opt.tones.find((x) => x.id === t)?.name ?? null;
  return [tone, opt.label].filter(Boolean).join(" · ");
}
/** Prompt phrases, e.g. "sage green (#8FAF8A) shaker-profile cabinetry" */
export function cabinetryPrompt(sel: Pick<KitchenSelections, "cabinetry" | "cabinetColor">): string | null {
  const opt = CABINETRY_OPTIONS.find((o) => o.id === sel.cabinetry);
  if (!opt) return null;
  const tone = sel.cabinetColor ? opt.tones.find((t) => t.color.toLowerCase() === sel.cabinetColor!.toLowerCase()) : undefined;
  const colour = sel.cabinetColor ? `${tone ? tone.name.toLowerCase() : "custom-coloured"} (exact colour ${sel.cabinetColor}) ` : "";
  return `${colour}${opt.label.toLowerCase()} cabinetry`;
}
export function benchtopPrompt(sel: Pick<KitchenSelections, "benchtop" | "benchtopTone">): string | null {
  const opt = BENCHTOP_OPTIONS.find((o) => o.id === sel.benchtop);
  if (!opt) return null;
  const t = sel.benchtopTone;
  const tone = t?.startsWith("#") ? `custom-coloured (exact colour ${t})` : opt.tones.find((x) => x.id === t)?.name.toLowerCase();
  return `${tone ? `${tone} ` : ""}${opt.label.toLowerCase()} benchtop`;
}
/** Product-finder tags for the chosen cabinetry (older products are tagged by the old combined styles) */
export function cabinetryTags(sel: Pick<KitchenSelections, "cabinetry" | "cabinetColor">): string[] {
  if (!sel.cabinetry) return [];
  const tone = CABINETRY_OPTIONS.find((o) => o.id === sel.cabinetry)?.tones.find((t) => t.color.toLowerCase() === sel.cabinetColor?.toLowerCase())?.id;
  const tags: string[] = [sel.cabinetry];
  if (tone === "sage-green") tags.push("shaker-sage");
  if (tone === "matte-black") tags.push("matte-black");
  if (tone === "cream-beige") tags.push("flat-panel-beige");
  return tags;
}

export const MIXER_OPTIONS: { id: MixerFinish; label: string; sub: string }[] = [
  { id: "brushed-brass", label: "Brushed Brass",  sub: "Warm gold — pairs beautifully with timber or white cabinetry" },
  { id: "matte-black",   label: "Matte Black",    sub: "Bold, architectural — works with every cabinet colour"        },
  { id: "chrome",        label: "Chrome",          sub: "Classic, easy-to-clean and universally compatible"           },
  { id: "white",         label: "Plain White",     sub: "Soft matte white — blends into pale benchtops and splashbacks" },
];

export const SPLASHBACK_OPTIONS: { id: SplashbackStyle; label: string; sub: string; costAdj: number }[] = [
  { id: "white-subway",   label: "White Subway (Vertical)", sub: "Timeless vertical stack — adds height to any kitchen",       costAdj: 0     },
  { id: "grey-subway",    label: "Grey Subway",              sub: "Cool-toned subway — pairs well with white or black cabinetry", costAdj: 0     },
  { id: "calacatta-slab", label: "Calacatta Stone Slab",    sub: "Full-height stone slab — dramatic, luxurious statement",      costAdj: 2_800 },
  { id: "mirrored",       label: "Mirrored Glass",          sub: "Reflects light and doubles the visual space",                 costAdj: 1_800 },
  { id: "vj-panel",       label: "VJ Paneling",             sub: "Timber-look vertical panels — warm, kitchen-specific coastal", costAdj: 900   },
  { id: "slab-match",     label: "Benchtop Slab Match",     sub: "Seamless stone continuation — the most dramatic look",        costAdj: 2_200 },
];

/** Kitchen floors use the shared formats and tones, priced for a typical kitchen */
const KITCHEN_FLOOR_COST: Record<FloorFormat, number> = {
  "marble-stone": 3_900, terrazzo: 3_600, "concrete-slate": 3_100, "large-format-plain": 2_600,
  "timber-plank": 3_000, encaustic: 3_700, terracotta: 3_400, "small-hexagon": 3_500,
};
export const KITCHEN_FLOOR_FORMATS: SurfaceFormat<FloorFormat>[] =
  FLOOR_FORMATS.map((f) => ({ ...f, cost: KITCHEN_FLOOR_COST[f.id] }));

/** Kitchen wall colour finishes: the shared paint finishes, priced for all the kitchen's painted walls */
export const KITCHEN_WALL_FINISHES: PaintFinish[] = PAINT_FINISHES.map((f) => ({ ...f, cost: f.kitchenCost }));


// ── Kitchen cost engine (mid-range QLD 2026) ─────────────────────────────────

export interface RoomCostItem {
  label:   string;
  amount:  number;
  detail?: string;
  warning?: boolean;
}

export const KITCHEN_BASE_COST = 22_000; // kept for reference

export function calcKitchenCost(sel: KitchenSelections): { items: RoomCostItem[]; total: number } {
  const cabinetryOpt  = sel.cabinetry   ? CABINETRY_OPTIONS.find((o)     => o.id === sel.cabinetry)   : null;
  const benchtopOpt   = sel.benchtop    ? BENCHTOP_OPTIONS.find((o)      => o.id === sel.benchtop)    : null;
  const splashbackOpt = sel.splashback  ? SPLASHBACK_OPTIONS.find((o)    => o.id === sel.splashback)  : null;
  const mixerOpt      = sel.mixer       ? MIXER_OPTIONS.find((o)         => o.id === sel.mixer)       : null;
  const floorFmt      = sel.floorFormat ? KITCHEN_FLOOR_FORMATS.find((f) => f.id === sel.floorFormat) : null;
  const floorTone     = sel.floorTone   ? FLOOR_TILES.find((t) => t.id === sel.floorTone)           : null;
  const wallFin       = sel.wallFinish  ? KITCHEN_WALL_FINISHES.find((f) => f.id === sel.wallFinish) : null;

  const materialItems: RoomCostItem[] = [];

  if (sel.cabinetry && cabinetryOpt) {
    materialItems.push({
      label:  `Cabinetry — ${cabinetryLabel(sel)}`,
      amount: 8_000 + cabinetryOpt.costAdj,
      detail: cabinetryOpt.label + " doors + carcasses, floor-to-ceiling",
    });
  }
  if (sel.benchtop && benchtopOpt) {
    materialItems.push({
      label:  `Benchtop — ${benchtopLabel(sel)}`,
      amount: 3_200 + benchtopOpt.costAdj,
      detail: benchtopOpt.label,
    });
  }
  if (sel.splashback && splashbackOpt) {
    materialItems.push({
      label:  `Splashback — ${splashbackOpt.label}`,
      amount: 1_200 + splashbackOpt.costAdj,
      detail: splashbackOpt.label,
    });
  }
  if (floorFmt || floorTone || sel.floorColor) {
    materialItems.push({
      label:  `Kitchen Floor — ${surfaceLabel(floorFmt, floorTone, sel.floorColor) ?? "Tiles"}`,
      amount: (floorFmt?.cost ?? 2_800) + (floorTone?.adj ?? 0),
      detail: floorFmt?.sub ?? floorTone?.description,
    });
  }
  if (wallFin && wallFin.cost > 0) {
    materialItems.push({ label: `Walls — ${paintLabel(wallFin.id, sel.wallColor)}`, amount: wallFin.cost, detail: wallFin.sub });
  }
  if (sel.mixer && mixerOpt) {
    materialItems.push({
      label:  `Mixer & Sink — ${mixerOpt.label}`,
      amount: 1_450,
      detail: `${mixerOpt.label} gooseneck, under-mount sink set`,
    });
  }
  if (sel.cooktop) {
    materialItems.push({
      label:  sel.cooktop === "induction" ? "Induction Cooktop" : "Gas Cooktop + Lines",
      amount: sel.cooktop === "induction" ? 1_800 : 2_400,
      detail: sel.cooktop === "induction" ? "60cm zone induction + installation" : "900mm gas cooktop + gas line certification",
    });
  }
  if (sel.dishwasher) {
    materialItems.push({
      label:  sel.dishwasher === "integrated" ? "Integrated Dishwasher" : "Freestanding Dishwasher",
      amount: sel.dishwasher === "integrated" ? 2_200 : 1_100,
      detail: sel.dishwasher === "integrated" ? "Panel-match integrated, supply + install" : "Freestanding, supply + connection",
    });
  }
  if (ceilingCost(sel.ceilingStyle) > 0) {
    materialItems.push({ label: `Ceiling — ${ceilingLabel(sel.ceilingStyle, sel.ceilingColor)}`, amount: ceilingCost(sel.ceilingStyle), detail: "Ceiling repaint in a custom colour" });
  }

  const materialTotal = materialItems.reduce((s, i) => s + i.amount, 0);
  const items: RoomCostItem[] = [];

  if (materialTotal > 0) {
    items.push({
      label:  "Installation & Labour",
      amount: Math.round(materialTotal * 0.35),
      detail: "Demo, waste removal, trade connections & tiling labour",
    });
  }
  items.push(...materialItems);

  // Structural adds
  if (sel.hasIsland) {
    items.push({ label: "Island Bench — Plumbing/Gas Relocation", amount: 2_500, detail: "Repositioning drain or gas point to island location", warning: true });
  }
  if (sel.hasApplianceRoughin) {
    items.push({ label: "Appliance Rough-ins (Gas/15A Circuit)", amount: 1_800, detail: "New gas point or 15-amp power point for induction", warning: true });
  }
  if (sel.hasSinkRoughin) {
    items.push({ label: "Sink Plumbing Relocation", amount: 2_200, detail: "Moving existing drain/water supply to new position", warning: true });
  }
  if (sel.hasWallChange) {
    items.push({ label: "Wall Removal / Addition", amount: 6_500, detail: "Structural engineer, demolition, lintel, patch & paint", warning: true });
  }
  if (sel.hasButlersPantry) {
    items.push({ label: "Butler's Pantry Integration", amount: 8_000, detail: "Separate prep space with cabinetry, sink, additional storage" });
  }

  const styleItem = styleCostItem(sel.designStyle);
  if (styleItem) items.push(styleItem);

  const total = items.reduce((s, i) => s + i.amount, 0);
  return { items, total };
}

// ── Bedroom types ─────────────────────────────────────────────────────────────

export type BedroomRoomSize    = "standard" | "master" | "large" | "custom";
export type BedroomFloorFormat = "timber-boards" | "herringbone" | "hybrid-plank" | "polished-concrete" | "carpet";
export type WallTreatment      = "paint-refresh" | "vj-paneling" | "timber-battens" | "feature-wallpaper";
export type BedroomLighting    = "led-cove" | "architectural-downlights" | "statement-pendant";
export type StorageOption      = "built-in-mirror-sliders" | "custom-wir";
export type WindowTreatment    = "floor-ceiling-sheers" | "blockout-roller";

export interface BedroomSizeOption {
  id:        BedroomRoomSize;
  label:     string;
  sub:       string;
  approxSqm: string;
  baseSqm:   number;  // used for flooring area estimate
}

export const BEDROOM_SIZE_OPTIONS: BedroomSizeOption[] = [
  { id: "standard", label: "Standard Bedroom", sub: "Single or double — typical spare room", approxSqm: "10–14m²", baseSqm: 12 },
  { id: "master",   label: "Master Bedroom",   sub: "Main bedroom with ensuite potential",   approxSqm: "14–20m²", baseSqm: 16 },
  { id: "large",    label: "Large Suite",       sub: "Expansive master or combined living",   approxSqm: "20m²+",   baseSqm: 24 },
  { id: "custom",   label: "Custom Size",       sub: "Enter your exact dimensions",          approxSqm: "",        baseSqm: 0  },
];

// ── Bedroom budget constants (AU market 2026) ─────────────────────────────────
// Cosmetic refresh: ~$5k  |  Mid-range: $15k–$25k  |  Premium: $40k+
export const BEDROOM_BUDGET_MIN     =  5_000;
export const BEDROOM_BUDGET_MAX     = 40_000;
export const BEDROOM_BUDGET_STEP    =    500;
export const BEDROOM_BUDGET_DEFAULT = 15_000;

export interface BedroomSelections {
  roomSize:          BedroomRoomSize | null;
  customLength:      number;   // metres — used when roomSize === "custom"
  customWidth:       number;
  /** Flooring Step A — the format; Step B is flooringTone (or a custom flooringColor) */
  flooringFormat:    BedroomFloorFormat | null;
  flooringTone:      string | null;            // tone id (BEDROOM_FLOOR_TONES)
  flooringColor:     string | null;            // custom hex instead of a tone
  wallTreatment:     WallTreatment    | null;
  wallColor:         string | null;            // custom hex override for wall
  lighting:          BedroomLighting  | null;
  storage:           StorageOption    | null;
  windowTreatment:   WindowTreatment  | null;
  ceilingStyle:      CeilingStyle | null;
  ceilingColor:      string | null;            // custom ceiling paint colour
  /** Overall look for the AI — never selects finishes */
  designStyle:       DesignStyleId | null;
  hasElectricalWork: boolean;  // bedside pendants / re-wiring → advisory
  hasVJWall:         boolean;  // VJ feature wall (structural add)
  hasMediaJoinery:   boolean;  // built-in media/TV joinery
  hasPendantRoughin: boolean;  // bedside sconce/pendant rough-ins
  /** Categories kept as they are — no cost, left untouched in the render */
  keepExisting:      BedroomKeepKey[];
  budget:            number;   // user's target budget (AUD)
  customNote:        string;
}

// ── Bedroom options ───────────────────────────────────────────────────────────

const OAK = ["natural-oak", "blonde-oak", "smoked-oak", "bleached-oak"];

export const CARPET_TONES: TileOption[] = [
  { id: "carpet-oatmeal",  name: "Oatmeal",   bgClass: "bg-honed-limestone", description: "Warm oatmeal loop pile — soft and forgiving." },
  { id: "carpet-dove",     name: "Dove Grey", bgClass: "bg-smoked-concrete", description: "Cool dove grey loop pile." },
  { id: "carpet-charcoal", name: "Charcoal",  bgClass: "bg-charcoal-slate",  textLight: true, description: "Deep charcoal loop pile — hides wear well." },
  { id: "carpet-ivory",    name: "Soft Ivory", bgClass: "bg-marble-blanc",   description: "Soft white-ivory loop pile — light and calm." },
];
export const BEDROOM_FLOOR_TONES: TileOption[] = [...STONE_TIMBER_TONES, ...CARPET_TONES];

/** Flooring formats, priced per 16m² and scaled to the room */
export const BEDROOM_FLOOR_FORMATS: SurfaceFormat<BedroomFloorFormat>[] = [
  { id: "timber-boards",     label: "Timber Boards",     sub: "Engineered, wide boards",       swatch: "natural-oak",    cost: 5_200,
    prompt: "engineered timber floorboards laid lengthways", tones: OAK },
  { id: "herringbone",       label: "Herringbone",       sub: "Classic angled boards",         swatch: "herringbone",    cost: 6_500,
    prompt: "laid in a classic herringbone pattern", tones: [...OAK, "honed-limestone", "matte-slate-lg"] },
  { id: "hybrid-plank",      label: "Hybrid Plank",      sub: "Waterproof, great value",       swatch: "blonde-oak",     cost: 3_800,
    prompt: "hybrid planks with a realistic timber look", tones: OAK },
  { id: "polished-concrete", label: "Polished Concrete", sub: "Grind and seal the slab",       swatch: "concrete-pale",  cost: 4_500, more: true,
    prompt: "seamless polished concrete with a sealed satin finish", tones: ["concrete-pale", "smoked-concrete", "concrete-charcoal", "concrete-white"] },
  { id: "carpet",            label: "Carpet",            sub: "Soft wool-blend loop pile",     swatch: "carpet-oatmeal", cost: 4_200,
    prompt: "soft wool-blend loop-pile carpet, wall to wall", tones: ["carpet-oatmeal", "carpet-dove", "carpet-charcoal", "carpet-ivory"] },
];

/** Bedroom walls: four finishes, each with its own colour drawer (the colour is stored as a hex in wallColor) */
const BATTEN_TONES: FinishTone[] = [
  { id: "natural-oak",   name: "Natural Oak",   color: "#B8865A", sub: "Warm mid-tone timber" },
  { id: "blonde-oak",    name: "Blonde Oak",    color: "#D9B98F", sub: "Light and airy" },
  { id: "walnut",        name: "Walnut",        color: "#5C3D2A", sub: "Rich, dark timber" },
  { id: "black-stained", name: "Black Stained", color: "#2E2B28", sub: "Moody and modern" },
  { id: "white-painted", name: "White Painted", color: "#EDEBE6", sub: "Soft, coastal" },
];
const WALLPAPER_TONES: FinishTone[] = [
  { id: "soft-linen",          name: "Soft Linen",          color: "#DCD3C4", sub: "Woven neutral texture" },
  { id: "sage-botanical",      name: "Sage Botanical",      color: "#9DAE94", sub: "Leafy botanical print" },
  { id: "navy-geometric",      name: "Navy Geometric",      color: "#2F3A4A", sub: "Bold geometric pattern" },
  { id: "terracotta-print",    name: "Terracotta Print",    color: "#C07A57", sub: "Warm arches print" },
  { id: "charcoal-grasscloth", name: "Charcoal Grasscloth", color: "#4A4A48", sub: "Natural fibre texture" },
];
const WALL_PAINT_TONES: FinishTone[] = PAINT_TONES.map((t) => ({ id: t.id, name: t.name, color: t.color, sub: t.sub }));

export const WALL_TREATMENT_OPTIONS: { id: WallTreatment; label: string; sub: string; cost: number; prompt: string; swatch: string; tones: FinishTone[]; defaultTone: string }[] = [
  { id: "paint-refresh",     label: "Standard Paint Refresh",       sub: "Low-sheen paint, all walls",          cost: 850,
    prompt: "freshly painted walls in a low-sheen finish",                       swatch: "paint-crisp-neutral--natural-white", tones: WALL_PAINT_TONES, defaultTone: "natural-white" },
  { id: "vj-paneling",       label: "VJ Paneling (Vertical Joint)", sub: "Painted V-joint boards, bedhead wall", cost: 3_500,
    prompt: "vertical VJ (V-joint) panelling on the bedhead wall, painted",       swatch: "paint-vj-panelling--natural-white",  tones: WALL_PAINT_TONES, defaultTone: "natural-white" },
  { id: "timber-battens",    label: "Timber Batten Accent Wall",    sub: "Vertical battens behind the bed",     cost: 2_800,
    prompt: "a vertical timber batten accent wall behind the bed",               swatch: "batten--natural-oak",                 tones: BATTEN_TONES,     defaultTone: "natural-oak" },
  { id: "feature-wallpaper", label: "Feature Wallpaper",            sub: "One statement wall",                  cost: 2_200,
    prompt: "a feature wallpaper on the bedhead wall",                           swatch: "wallpaper--sage-botanical",           tones: WALLPAPER_TONES,  defaultTone: "sage-botanical" },
];
export const wallTreatmentSwatch = (id: string, tone: string) =>
  id === "timber-battens" ? `batten--${tone}` : id === "feature-wallpaper" ? `wallpaper--${tone}`
  : id === "vj-paneling" ? `paint-vj-panelling--${tone}` : `paint-crisp-neutral--${tone}`;

/** Older bedroom wall choices map onto the four that remain */
export const OLD_WALL_TREATMENT: Record<string, WallTreatment> = {
  "feature-paint": "paint-refresh", "limewash-paint": "paint-refresh", "shiplap-paneling": "vj-paneling",
  "designer-wallpaper": "feature-wallpaper", "botanical-wallpaper": "feature-wallpaper",
};
/** Product-finder tags for a bedroom wall finish (older products use the old ids) */
export function wallTreatmentTags(id: string | null | undefined): string[] {
  if (!id) return [];
  return [id, ...Object.entries(OLD_WALL_TREATMENT).filter(([, v]) => v === id).map(([k]) => k)];
}
/** "Sage Botanical · Feature Wallpaper" */
export function wallTreatmentLabel(sel: Pick<BedroomSelections, "wallTreatment" | "wallColor">): string | null {
  const opt = WALL_TREATMENT_OPTIONS.find((o) => o.id === sel.wallTreatment);
  const tone = sel.wallColor ? (opt?.tones ?? []).find((t) => t.color.toLowerCase() === sel.wallColor!.toLowerCase()) : undefined;
  const colour = tone?.name ?? (sel.wallColor ? `Custom ${sel.wallColor}` : null);
  const parts = [colour, opt?.label].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export const BEDROOM_LIGHTING_OPTIONS: { id: BedroomLighting; label: string; sub: string; cost: number; triggerElectrical?: boolean }[] = [
  {
    id:               "led-cove",
    label:            "LED Strip Cove Lighting",
    sub:              "Concealed LED strip in ceiling recess — ambient, architectural glow",
    cost:             2_400,
    triggerElectrical: true,
  },
  {
    id:    "architectural-downlights",
    label: "Architectural Downlights",
    sub:   "Recessed dimmable LEDs — clean, versatile, high CRI for makeup/reading",
    cost:  1_600,
  },
  {
    id:               "statement-pendant",
    label:            "Statement Pendant",
    sub:              "Designer pendant over bedside tables — sculptural and atmospheric",
    cost:             1_800,
    triggerElectrical: true,
  },
];

export const STORAGE_OPTIONS: { id: StorageOption; label: string; sub: string; cost: number }[] = [
  {
    id:    "built-in-mirror-sliders",
    label: "Built-in Robe — Mirror Sliders",
    sub:   "Full-height mirror sliding doors — reflects light, doubles visual space",
    cost:  4_800,
  },
  {
    id:    "custom-wir",
    label: "Custom Walk-in Robe",
    sub:   "Fully fitted WIR with shelving, drawers & hanging — the ultimate luxury",
    cost:  9_500,
  },
];

export const WINDOW_TREATMENT_OPTIONS: { id: WindowTreatment; label: string; sub: string; cost: number }[] = [
  {
    id:    "floor-ceiling-sheers",
    label: "Floor-to-Ceiling Sheers",
    sub:   "Sheer linen drapes on ceiling-height track — soft, luxurious light filter",
    cost:  1_800,
  },
  {
    id:    "blockout-roller",
    label: "Blockout Roller Blinds",
    sub:   "Motorised blockout rollers — perfect sleep environment, clean lines",
    cost:  1_200,
  },
];

/** Product-matching tags for a bedroom flooring format (shop-the-look lists use these ids) */
export function flooringProductTags(sel: BedroomSelections): string[] {
  const map: Record<BedroomFloorFormat, string[]> = {
    "timber-boards":     ["ash", "ash-rustic", "beech"],
    herringbone:         ["engineered-oak-herringbone", "herringbone-stone-grey", "herringbone-stone-white"],
    "hybrid-plank":      ["hybrid-plank"],
    "polished-concrete": ["polished-concrete"],
    carpet:              ["wool-carpet"],
  };
  return sel.flooringFormat ? map[sel.flooringFormat] : [];
}

// ── Summary labels (briefs, PDF, preview) ──────────────────────────────────────

export function kitchenFloorLabel(sel: KitchenSelections): string | null {
  return surfaceLabel(KITCHEN_FLOOR_FORMATS.find((f) => f.id === sel.floorFormat), FLOOR_TILES.find((t) => t.id === sel.floorTone), sel.floorColor);
}
export function kitchenWallLabel(sel: KitchenSelections): string | null {
  return paintLabel(sel.wallFinish, sel.wallColor);
}
export function bedroomFloorLabel(sel: BedroomSelections): string | null {
  return surfaceLabel(BEDROOM_FLOOR_FORMATS.find((f) => f.id === sel.flooringFormat), BEDROOM_FLOOR_TONES.find((t) => t.id === sel.flooringTone), sel.flooringColor);
}
export function bedroomWallLabel(sel: BedroomSelections): string | null {
  return wallTreatmentLabel(sel);
}

// ── Bedroom cost engine ────────────────────────────────────────────────────────

export const BEDROOM_BASE_COST = 3_500; // kept for reference

export function calcBedroomCost(sel: BedroomSelections): { items: RoomCostItem[]; total: number } {
  const floorFmt    = sel.flooringFormat ? BEDROOM_FLOOR_FORMATS.find((f)    => f.id === sel.flooringFormat) : null;
  const floorTone   = sel.flooringTone   ? BEDROOM_FLOOR_TONES.find((t)      => t.id === sel.flooringTone)   : null;
  const wallOpt     = sel.wallTreatment  ? WALL_TREATMENT_OPTIONS.find((o)    => o.id === sel.wallTreatment)  : null;
  const lightOpt    = sel.lighting       ? BEDROOM_LIGHTING_OPTIONS.find((o)  => o.id === sel.lighting)       : null;
  const storageOpt  = sel.storage        ? STORAGE_OPTIONS.find((o)           => o.id === sel.storage)        : null;
  const windowOpt   = sel.windowTreatment ? WINDOW_TREATMENT_OPTIONS.find((o) => o.id === sel.windowTreatment) : null;

  // Resolve floor area for cost and labels
  const sizeOpt = sel.roomSize ? BEDROOM_SIZE_OPTIONS.find((o) => o.id === sel.roomSize) : null;
  const sqm = sel.roomSize === "custom" && sel.customLength > 0 && sel.customWidth > 0
    ? sel.customLength * sel.customWidth
    : (sizeOpt?.baseSqm ?? 16);
  const sqmLabel = `approx ${sqm.toFixed(0)}m²`;

  // Scale flooring cost by area (base cost is per 16m²)
  const hasFloor = !!(floorFmt || floorTone || sel.flooringColor);
  const flooringCost = hasFloor ? Math.round((((floorFmt?.cost ?? 5_200) + (floorTone?.adj ?? 0)) * sqm) / 16 / 100) * 100 : 0;

  const materialItems: RoomCostItem[] = [];

  if (hasFloor) {
    materialItems.push({ label: `Flooring — ${surfaceLabel(floorFmt, floorTone, sel.flooringColor) ?? "Flooring"}`, amount: flooringCost, detail: `Supply + lay, ${sqmLabel}` });
  }
  if (wallOpt) {
    materialItems.push({ label: `Wall — ${wallTreatmentLabel(sel)}`, amount: wallOpt.cost, detail: wallOpt.sub });
  }
  if (lightOpt) {
    materialItems.push({ label: `Lighting — ${lightOpt.label}`, amount: lightOpt.cost, detail: lightOpt.sub });
  }
  if (storageOpt) {
    materialItems.push({ label: `Storage — ${storageOpt.label}`, amount: storageOpt.cost, detail: storageOpt.sub });
  }
  if (windowOpt) {
    materialItems.push({ label: `Window — ${windowOpt.label}`, amount: windowOpt.cost, detail: windowOpt.sub });
  }

  const materialTotal = materialItems.reduce((s, i) => s + i.amount, 0);
  const items: RoomCostItem[] = [];

  if (materialTotal > 0) {
    items.push({
      label:  "Labour & Preparation",
      amount: Math.round(materialTotal * 0.30),
      detail: "Wall prep, skirting, painting, waste removal",
    });
  }
  items.push(...materialItems);

  if (ceilingCost(sel.ceilingStyle) > 0) {
    items.push({ label: `Ceiling — ${ceilingLabel(sel.ceilingStyle, sel.ceilingColor)}`, amount: ceilingCost(sel.ceilingStyle), detail: "Ceiling repaint in a custom colour" });
  }
  if (sel.hasVJWall) {
    items.push({ label: "VJ Feature Wall Installation", amount: 2_800, detail: "Floor-to-ceiling tongue-and-groove boards, painted" });
  }
  if (sel.hasMediaJoinery) {
    items.push({ label: "Built-in Media Joinery", amount: 4_500, detail: "Custom TV unit + integrated shelving/storage" });
  }
  if (sel.hasPendantRoughin || sel.hasElectricalWork) {
    items.push({ label: "Electrical Re-wiring & Fit-off", amount: 2_200, detail: "New circuits for pendant/sconce/cove lighting, safety switch upgrades", warning: true });
  }

  const styleItem = styleCostItem(sel.designStyle);
  if (styleItem) items.push(styleItem);

  const total = items.reduce((s, i) => s + i.amount, 0);
  return { items, total };
}

// ── Saved Room (multi-room project) ──────────────────────────────────────────

export interface SavedRoom {
  id:                string;
  roomType:          RoomType;
  roomLabel:         string;
  roomPhotoUrl:      string | null;
  generatedImageUrl: string | null;
  estimatedCost:     number;
  kitchenSelections?: KitchenSelections;
  bedroomSelections?: BedroomSelections;
  projectBrief?:     import("./projectBrief").ProjectBrief | null;
}

// ── Hidden cost advisories ─────────────────────────────────────────────────────

export const HIDDEN_COST_ADVISORIES: Record<RoomType, { condition: string; message: string; cost: string } | null> = {
  bathroom: null,
  kitchen:  {
    condition: "island",
    message:   "Moving plumbing or gas lines for an island bench can add $2,500+ to trade costs. Ensure your layout stays 'run-ready' to avoid budget blowouts.",
    cost:      "$2,500+",
  },
  bedroom: {
    condition: "electrical",
    message:   "High-end VJ paneling and electrical re-wiring for bedside pendants often add $1,500–$3,000 to a standard refresh.",
    cost:      "$1,500–$3,000",
  },
};

// ── Room-aware AI prompt builders ─────────────────────────────────────────────

/**
 * Hard spatial lock block — prepended to every photo-mode prompt.
 * Frames the task as a surface retexturing job, NOT a redesign.
 * Placed FIRST so the model reads it before any other instruction.
 */
function photoSpatialLock(roomWord: string, dimNote: string): string {
  return [
    `SURFACE RETEXTURING TASK — NOT a redesign or reimagining.`,
    `You are given a reference photo of a real ${roomWord}. Your ONLY job is to re-texture and re-colour`,
    `the existing visible surfaces (cabinetry, benchtop, splashback, walls, floor, ceiling) in-place.`,
    ``,
    `HARD CONSTRAINTS — these are immutable and override everything else:`,
    `1. ROOM SIZE IS FIXED. The physical footprint, floor area, wall positions, and ceiling height shown`,
    `   in the reference photo must not change by even one centimetre. Do not make the room look larger.`,
    `2. CAMERA IS LOCKED. Reproduce the exact same camera angle, distance, field of view, and perspective`,
    `   as the reference photo. Do not zoom out, pan, tilt, or change the viewpoint in any way.`,
    `3. NO NEW SPACE. Do not add benchtop runs, cabinetry, walls, or appliances that are not already`,
    `   visible within the reference photo's frame. Every surface you modify must already exist in the photo.`,
    `4. STRUCTURAL LAYOUT IS FROZEN. Every window, door, and load-bearing element stays in the same`,
    `   position as the reference photo unless a structural change is explicitly listed below.`,
    `5. ONLY SURFACES CHANGE. Textures, colours, materials, and finishes may change. Spatial geometry may not.`,
    dimNote,
  ].filter(Boolean).join("\n");
}

/** Prompt line for a category the client is keeping as-is */
function keepLine(category: string, thing: string, hasPhoto: boolean): string {
  return hasPhoto
    ? `${category}: KEEP the existing ${thing} exactly as it appears in the reference photo — do not change its colour, material or style.`
    : `${category}: the client is keeping their existing ${thing} — show a plain, standard ${thing} rather than an upgrade.`;
}

/** Per-size dimension note added to the spatial lock block */
function kitchenDimNote(sel: KitchenSelections): string {
  if (sel.roomSize === "custom" && sel.customLength > 0 && sel.customWidth > 0) {
    const sqm = (sel.customLength * sel.customWidth).toFixed(1);
    return `SIZE CONTEXT: The user has confirmed this kitchen is ${sel.customLength}m × ${sel.customWidth}m (${sqm}m²). ` +
           `Do not render a room that looks larger than this.`;
  }
  if (sel.roomSize === "galley") return `SIZE CONTEXT: This is a galley/small kitchen (under 12m²). The room must feel compact — do not add an island or extra benchtop runs.`;
  if (sel.roomSize === "large")  return `SIZE CONTEXT: This is a large open-plan kitchen (20m²+). The existing spacious layout should be preserved.`;
  return `SIZE CONTEXT: Preserve the exact room proportions from the reference photo — do not add or remove any space.`;
}

function bedroomDimNote(sel: BedroomSelections): string {
  if (sel.roomSize === "custom" && sel.customLength > 0 && sel.customWidth > 0) {
    const sqm = (sel.customLength * sel.customWidth).toFixed(1);
    return `SIZE CONTEXT: The user has confirmed this bedroom is ${sel.customLength}m × ${sel.customWidth}m (${sqm}m²). ` +
           `Do not render a room that looks larger than this.`;
  }
  if (sel.roomSize === "standard") return `SIZE CONTEXT: This is a standard bedroom (10–14m²). Keep the proportions compact — do not expand the room footprint.`;
  if (sel.roomSize === "large")    return `SIZE CONTEXT: This is a large bedroom suite (20m²+). The existing spacious layout should be preserved.`;
  return `SIZE CONTEXT: Preserve the exact room proportions from the reference photo — do not add or remove any space.`;
}

/** Final reminder appended at the END of every photo-mode prompt (models weight beginnings and ends) */
const SPATIAL_REMINDER = [
  ``,
  `FINAL SPATIAL CHECK (read before generating): The output image must show the same room size,`,
  `camera angle, and structural layout as the reference photo. If anything spatial looks different`,
  `from the reference photo, discard and regenerate. Only materials, textures, and colours should`,
  `have changed. The room must not look bigger, wider, taller, or deeper than in the reference photo.`,
].join("\n");

export function buildKitchenPrompt(sel: KitchenSelections, hasPhoto: boolean): string {
  const cabinet  = cabinetryPrompt(sel);
  const benchtop = benchtopPrompt(sel);
  const mixer    = sel.mixer      ? (MIXER_OPTIONS.find((o)          => o.id === sel.mixer)?.label       ?? sel.mixer)      : null;
  const splash   = sel.splashback ? (SPLASHBACK_OPTIONS.find((o)     => o.id === sel.splashback)?.label  ?? sel.splashback) : null;
  const floorFmt = KITCHEN_FLOOR_FORMATS.find((f) => f.id === sel.floorFormat);
  const floorTn  = FLOOR_TILES.find((t) => t.id === sel.floorTone);
  const floor    = floorFmt
    ? surfacePrompt(floorFmt, floorTn, sel.floorColor)
    : floorTn || sel.floorColor ? `${floorTn?.name ?? "custom-coloured"} floor tiles` : null;
  const floorColorNote = sel.floorColor && !floorFmt ? ` in the exact colour ${sel.floorColor}` : "";
  const wallPaint      = paintPrompt(sel.wallFinish, sel.wallColor);
  const wallColorNote  = wallPaint ? `Kitchen walls: ${wallPaint} on all visible painted walls.` : null;
  const cooktop  = sel.cooktop ? (sel.cooktop === "induction" ? "induction cooktop" : "gas cooktop") : "cooktop (type not specified)";
  const dw       = sel.dishwasher ? (sel.dishwasher === "integrated" ? "integrated panel-match dishwasher" : "freestanding dishwasher") : "dishwasher (type not specified)";
  const ceiling  = ceilingPrompt(sel.ceilingStyle, sel.ceilingColor);
  const kept = (k: KitchenKeepKey) => isKept(sel.keepExisting, k);

  // ── No-photo mode: generate from scratch ─────────────────────────────────
  if (!hasPhoto) {
    const sizeDesc = sel.roomSize === "galley" ? "a compact galley kitchen"
      : sel.roomSize === "large" ? "a large open-plan kitchen"
      : sel.roomSize === "custom" && sel.customLength > 0 && sel.customWidth > 0
        ? `a kitchen approximately ${sel.customLength}m × ${sel.customWidth}m`
      : "a standard residential kitchen";

    const lines = [
      "ROOM TYPE: KITCHEN. This is strictly a KITCHEN renovation visualisation. Do NOT generate a bathroom, bedroom, or any other room type.",
      "You are a professional interior design visualizer. Generate a photorealistic KITCHEN render from scratch.",
      `Compose ${sizeDesc} from a slightly elevated angle showing cabinetry, benchtop, splashback and appliances.`,
      "Remove all clutter. Produce a high-end architectural photography result at 2K resolution.",
      "",
      kept("cabinetry")  ? keepLine("Cabinetry", "cabinetry", false)          : cabinet  ? `Cabinetry: ${cabinet}, floor-to-ceiling where possible.` : "Cabinetry: choose a style that suits the space — designer's choice.",
      kept("benchtop")   ? keepLine("Benchtop", "benchtop", false)            : benchtop ? `Benchtop: ${benchtop} — 20mm thick, waterfall edge on island if present.`   : "Benchtop: select a premium material appropriate to the style.",
      kept("mixer")      ? keepLine("Sink & Mixer", "sink and mixer tap", false) : mixer ? `Sink & Mixer: Under-mount sink with ${mixer} gooseneck mixer.`              : "Sink & Mixer: under-mount sink with a quality gooseneck mixer.",
      kept("splashback") ? keepLine("Splashback", "splashback", false)        : splash   ? `Splashback: ${splash}.`                                                            : "Splashback: select a material that complements the cabinetry.",
      kept("floor")      ? keepLine("Kitchen Floor", "floor", false)          : floor    ? `Kitchen Floor: ${floor}${floorColorNote}.`                                         : "Kitchen Floor: large format neutral porcelain or timber-look planks.",
      kept("walls")      ? keepLine("Kitchen Walls", "wall paint", false)     : wallColorNote ?? "Kitchen Walls: clean white or warm neutral paint.",
      kept("appliances") ? keepLine("Appliances", "cooktop and dishwasher", false) + " Include a counter-depth refrigerator." : `Appliances: ${cooktop}, ${dw}. Include a counter-depth integrated refrigerator.`,
      kept("ceiling")    ? keepLine("Ceiling", "ceiling", false)              : `Ceiling: ${ceiling}.`,
      "Style: warm Australian natural light, realistic textures, high-fidelity 2K render.",
    ];

    if (sel.hasIsland)       lines.push("\nIsland bench: Include a freestanding kitchen island with matching benchtop and waterfall edges.");
    if (sel.hasWallChange)   lines.push("Open-plan connection: Show an open-plan kitchen-living space.");
    if (sel.hasButlersPantry) lines.push("Include a butler's pantry scullery adjacent to the main kitchen with matching cabinetry.");
    return lines.join("\n") + styleSection(sel.designStyle, "kitchen", false) + clientRequestSection(sel.customNote, false);
  }

  // ── Photo mode: surface retexturing only ─────────────────────────────────
  const spatialLock = photoSpatialLock("kitchen", kitchenDimNote(sel));

  const materials = [
    "",
    "─── MATERIAL CHANGES TO APPLY (within the existing spatial layout) ───",
    kept("cabinetry")  ? keepLine("Cabinetry", "cabinetry", true)              : cabinet  ? `Cabinetry: Replace all cabinet door faces with ${cabinet} doors.`                : "Cabinetry: retain existing layout — apply a designer finish of your choice.",
    kept("benchtop")   ? keepLine("Benchtop", "benchtop", true)                : benchtop ? `Benchtop: Re-texture existing benchtop surfaces to ${benchtop}, 20mm thick.`          : "Benchtop: apply a premium material that complements the cabinetry.",
    kept("mixer")      ? keepLine("Sink & Mixer", "sink and mixer tap", true)  : mixer    ? `Sink & Mixer: Replace visible mixer tap with a ${mixer} gooseneck model.`              : "Sink & Mixer: replace with a quality gooseneck mixer.",
    kept("splashback") ? keepLine("Splashback", "splashback", true)            : splash   ? `Splashback: Re-surface the splashback with ${splash}.`                                 : "Splashback: choose a finish that suits the cabinetry.",
    kept("floor")      ? keepLine("Kitchen Floor", "floor", true)              : floor    ? `Kitchen Floor: Re-texture the floor with ${floor}${floorColorNote}.`                   : "Kitchen Floor: retain the existing floor or choose a clean, neutral finish.",
    kept("walls")      ? keepLine("Kitchen Walls", "wall paint", true)         : wallColorNote ?? "Kitchen Walls: Retain existing wall colour unless specified.",
    kept("appliances") ? keepLine("Appliances", "cooktop and dishwasher", true) : `Appliances: ${cooktop}, ${dw}. Fit into the existing appliance spaces — do not add new ones outside the existing footprint.`,
    kept("ceiling")    ? keepLine("Ceiling", "ceiling", true)                  : `Ceiling: ${ceiling}.`,
    "Remove all personal items, appliances on benchtops, and clutter.",
    "Style: warm Australian natural light, realistic textures, high-fidelity 2K render.",
  ].join("\n");

  const islandNote = sel.hasIsland
    ? "\nIsland bench: Only add an island if there is already clear floor space for one in the reference photo."
    : "";

  const structuralNotes: string[] = [];
  if (sel.hasWallChange)    structuralNotes.push("PERMITTED structural change: the user has requested an open-plan wall removal — show an open kitchen-living connection.");
  if (sel.hasButlersPantry) structuralNotes.push("PERMITTED structural change: show a butler's pantry scullery adjacent to the kitchen with matching cabinetry.");
  const structuralSection = structuralNotes.length > 0
    ? "\n\nPermitted structural changes (only these — no others): " + structuralNotes.join(" ")
    : "";

  return spatialLock + materials + islandNote + structuralSection + styleSection(sel.designStyle, "kitchen", true) + clientRequestSection(sel.customNote, true) + SPATIAL_REMINDER;
}

/**
 * The client's own words from the design note. It must show in the image: it
 * outranks the default material choices, but never the structural lock in photo mode.
 */
export function clientRequestSection(note: string | undefined | null, hasPhoto: boolean): string {
  const text = note?.trim();
  if (!text) return "";
  return hasPhoto
    ? `\n\nCLIENT'S OWN REQUEST — make this clearly visible in the image: "${text}"\nThis takes priority over the default material choices above. It may change or add finishes, colours, fittings and decor (for example a mirror, a basin colour or a light), but it must NOT move, add or remove walls, doorways or windows.`
    : `\n\nCLIENT'S OWN REQUEST — make this clearly visible in the image: "${text}"\nThis takes priority over the default choices above.`;
}

export function buildBedroomPrompt(sel: BedroomSelections, hasPhoto: boolean): string {
  const floorFmt = BEDROOM_FLOOR_FORMATS.find((f) => f.id === sel.flooringFormat);
  const floorTn  = BEDROOM_FLOOR_TONES.find((t) => t.id === sel.flooringTone);
  const flooring = floorFmt || floorTn || sel.flooringColor
    ? `${floorTn?.name ?? (sel.flooringColor ? "custom-coloured" : "neutral")} ${floorFmt?.prompt ?? "flooring"}${sel.flooringColor ? ` in the exact colour ${sel.flooringColor}` : ""}`
    : null;
  const wallOpt  = WALL_TREATMENT_OPTIONS.find((o) => o.id === sel.wallTreatment);
  const wallTone = sel.wallColor ? (wallOpt?.tones ?? []).find((t) => t.color.toLowerCase() === sel.wallColor!.toLowerCase()) : undefined;
  const wall     = wallOpt || sel.wallColor
    ? `${wallOpt?.prompt ?? "painted walls"}${sel.wallColor ? ` in ${wallTone ? `${wallTone.name.toLowerCase()} (exact colour ${sel.wallColor})` : `the exact colour ${sel.wallColor}`}` : ""}`
    : null;
  const light    = sel.lighting        ? (BEDROOM_LIGHTING_OPTIONS.find((o)  => o.id === sel.lighting)?.label        ?? sel.lighting)        : null;
  const storage  = sel.storage         ? (STORAGE_OPTIONS.find((o)           => o.id === sel.storage)?.label         ?? sel.storage)         : null;
  const window_  = sel.windowTreatment ? (WINDOW_TREATMENT_OPTIONS.find((o)  => o.id === sel.windowTreatment)?.label ?? sel.windowTreatment) : null;
  const ceiling  = ceilingPrompt(sel.ceilingStyle, sel.ceilingColor);

  const kept = (k: BedroomKeepKey) => isKept(sel.keepExisting, k);

  const lightDesc = !light
    ? "quality ambient lighting appropriate to the style"
    : sel.lighting === "led-cove"
    ? "Concealed LED strip cove lighting in ceiling recesses casting a warm ambient glow"
    : sel.lighting === "architectural-downlights"
    ? "Recessed architectural dimmable downlights throughout"
    : "Designer statement pendant lights flanking the bedhead";

  // ── No-photo mode: generate from scratch ─────────────────────────────────
  if (!hasPhoto) {
    const sizeDesc = sel.roomSize === "standard" ? "a standard bedroom (approx 12m²)"
      : sel.roomSize === "large" ? "a large bedroom suite (20m²+)"
      : sel.roomSize === "custom" && sel.customLength > 0 && sel.customWidth > 0
        ? `a bedroom approximately ${sel.customLength}m × ${sel.customWidth}m`
      : "a master bedroom";

    const lines = [
      "ROOM TYPE: BEDROOM. This is strictly a BEDROOM renovation visualisation. Do NOT generate a bathroom, kitchen, or any other room type.",
      "You are a professional interior design visualizer. Generate a photorealistic BEDROOM render from scratch.",
      `Compose ${sizeDesc} showing the bedhead feature wall, flooring, storage and window treatments at 2K resolution.`,
      "Remove all clutter and personal items. Produce a high-end editorial photography result.",
      "",
      kept("flooring") ? keepLine("Flooring", "flooring", false)                     : flooring ? `Flooring: ${flooring} — lay full room width.`                             : "Flooring: choose a premium flooring appropriate to the style.",
      kept("walls")    ? keepLine("Wall treatment", "wall finish", false)            : wall     ? `Wall treatment: ${wall} — apply to feature wall behind bedhead.`          : "Wall treatment: designer's choice appropriate to the room palette.",
      kept("lighting") ? keepLine("Lighting", "light fittings", false)               : `Lighting: ${lightDesc}.`,
      kept("storage")  ? keepLine("Storage", "wardrobe and storage", false)          : storage  ? `Storage: ${storage} — full-height, floor-to-ceiling.`                    : "Storage: appropriate built-in wardrobe solution for the space.",
      kept("windows")  ? keepLine("Window treatment", "window coverings", false)     : window_  ? `Window treatment: ${window_} — floor-length, ceiling-mounted track.`     : "Window treatment: quality window covering appropriate to the style.",
      kept("ceiling")  ? keepLine("Ceiling", "ceiling", false)                       : `Ceiling: ${ceiling}.`,
      "Style: warm natural Australian light, editorial photography, high-fidelity 2K render.",
    ];

    if (sel.hasVJWall)       lines.push("Add a floor-to-ceiling VJ paneled feature wall behind the bedhead.");
    if (sel.hasMediaJoinery) lines.push("Include a custom built-in media unit with TV recess, flanking shelves and integrated storage.");
    if (sel.hasPendantRoughin) lines.push("Show bedside wall-hung pendant sconces on each side of the bedhead.");
    return lines.join("\n") + styleSection(sel.designStyle, "bedroom", false) + clientRequestSection(sel.customNote, false);
  }

  // ── Photo mode: surface retexturing only ─────────────────────────────────
  const spatialLock = photoSpatialLock("bedroom", bedroomDimNote(sel));

  const materials = [
    "",
    "─── MATERIAL CHANGES TO APPLY (within the existing spatial layout) ───",
    kept("flooring") ? keepLine("Flooring", "flooring", true)                 : flooring ? `Flooring: Replace the existing floor surface with ${flooring} — cover the full visible floor area.`  : "Flooring: apply a premium flooring material appropriate to the style.",
    kept("walls")    ? keepLine("Wall treatment", "wall finish", true)        : wall     ? `Wall treatment: Apply ${wall} to the feature wall behind where the bedhead would be.`               : "Wall treatment: designer's choice appropriate to the room palette.",
    kept("lighting") ? keepLine("Lighting", "light fittings", true)           : `Lighting: ${lightDesc} — fit within the existing ceiling structure.`,
    kept("storage")  ? keepLine("Storage", "wardrobe and storage", true)      : storage  ? `Storage: Replace or re-face existing wardrobe/storage with ${storage}.`                             : "Storage: retain existing storage and apply a quality finish.",
    kept("windows")  ? keepLine("Window treatment", "window coverings", true) : window_  ? `Window treatment: Replace window coverings with ${window_} — floor-length, ceiling-mounted track.`  : "Window treatment: apply quality window covering appropriate to the style.",
    kept("ceiling")  ? keepLine("Ceiling", "ceiling", true)                   : `Ceiling: ${ceiling}.`,
    "Remove all personal items, clothes, and clutter.",
    "Style: warm natural Australian light, editorial photography, high-fidelity 2K render.",
  ].join("\n");

  const structuralNotes: string[] = [];
  if (sel.hasVJWall)       structuralNotes.push("PERMITTED structural change: add a floor-to-ceiling VJ paneled feature wall behind the bedhead.");
  if (sel.hasMediaJoinery) structuralNotes.push("PERMITTED structural change: add a custom built-in media unit with TV recess into an existing wall.");
  if (sel.hasPendantRoughin) structuralNotes.push("PERMITTED change: show bedside wall-hung pendant sconces on each side of the bedhead.");
  const structuralSection = structuralNotes.length > 0
    ? "\n\nPermitted structural changes (only these — no others): " + structuralNotes.join(" ")
    : "";

  return spatialLock + materials + structuralSection + styleSection(sel.designStyle, "bedroom", true) + clientRequestSection(sel.customNote, true) + SPATIAL_REMINDER;
}
