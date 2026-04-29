// ── Tile ──────────────────────────────────────────────────────────

export interface TileOption {
  id:          string;
  name:        string;
  bgClass:     string;       // Tailwind backgroundImage utility class
  description: string;       // Shown in the info tooltip
  textLight?:  boolean;      // Use white text on dark tiles
}

export type VanityType    = "floating" | "freestanding";
export type TapwareFinish = "chrome"   | "matte-black" | "brushed-gold";

// ── Tile style / layout ───────────────────────────────────────────

export type TileStyle =
  | "vertical-stack"
  | "herringbone"
  | "terrazzo"
  | "zellige"
  | "large-format"
  | "penny-rounds"
  | "checkerboard"
  | "honed-travertine";

export interface TileStyleOption {
  id:    TileStyle;
  label: string;
  tag:   string;   // Short descriptor shown as sub-label
  promptPhrase: string;  // Phrase sent to Gemini
}

export const TILE_STYLE_OPTIONS: TileStyleOption[] = [
  {
    id:           "vertical-stack",
    label:        "Vertical Stack",
    tag:          "Modern",
    promptPhrase: "tiles laid in a vertical stack bond pattern",
  },
  {
    id:           "herringbone",
    label:        "Herringbone",
    tag:          "Classic",
    promptPhrase: "tiles laid in a classic herringbone pattern",
  },
  {
    id:           "terrazzo",
    label:        "Terrazzo",
    tag:          "Trendy",
    promptPhrase: "terrazzo-style tiles with scattered chips on a white base",
  },
  {
    id:           "zellige",
    label:        "Zellige",
    tag:          "Handmade",
    promptPhrase: "hand-glazed zellige tiles with natural imperfections and irregular facets",
  },
  {
    id:           "large-format",
    label:        "Large Format Stone",
    tag:          "Seamless",
    promptPhrase: "large-format 600×1200mm stone-look tiles with minimal grout lines",
  },
  {
    id:           "penny-rounds",
    label:        "Penny Rounds",
    tag:          "Feature",
    promptPhrase: "penny-round mosaic tiles in a honeycomb arrangement",
  },
  {
    id:           "checkerboard",
    label:        "Checkerboard",
    tag:          "Vintage",
    promptPhrase: "classic checkerboard pattern tiles alternating two tones",
  },
  {
    id:           "honed-travertine",
    label:        "Honed Travertine",
    tag:          "Premium",
    promptPhrase: "honed travertine with unfilled natural voids and a matte finish",
  },
];

// ── Structural changes ────────────────────────────────────────────

export type ShowerNiche    = "none"   | "single" | "double";
export type ShowerFixtures = "single" | "dual";

export interface StructuralChanges {
  removeBathtub:   boolean;
  addWalkinShower: boolean;
  replaceToilet:   boolean;
  inWallCistern:   boolean;
  showerNiche:     ShowerNiche;
  showerFixtures:  ShowerFixtures;
}

// ── Bathroom size ─────────────────────────────────────────────────

export type BathroomSize = "small" | "medium" | "large" | "custom";

export interface BathroomSizeOption {
  id:        BathroomSize;
  label:     string;
  sub:       string;
  baseCost?: number;
}

export const BATHROOM_SIZE_OPTIONS: BathroomSizeOption[] = [
  { id: "small",  label: "Small",  sub: "Ensuite / Powder",  baseCost: 12_000 },
  { id: "medium", label: "Medium", sub: "Standard Bathroom", baseCost: 22_000 },
  { id: "large",  label: "Large",  sub: "Master / Family",   baseCost: 32_000 },
  { id: "custom", label: "Custom", sub: "Enter dimensions"                     },
];

/** Cost per square metre for custom dimensions (Brisbane/Sydney avg 2026) */
export const CUSTOM_SQM_RATE = 5_500;

/** Derive base cost from bathroom size selection */
export function getBathroomBaseCost(
  size:   BathroomSize,
  length: number,
  width:  number,
): number {
  if (size === "custom") {
    const sqm = (length || 0) * (width || 0);
    return sqm > 0 ? Math.round(sqm * CUSTOM_SQM_RATE / 500) * 500 : BASE_RENOVATION_COST;
  }
  return BATHROOM_SIZE_OPTIONS.find((o) => o.id === size)?.baseCost ?? BASE_RENOVATION_COST;
}

// ── Builder selections (passed to store + API) ────────────────────

export interface BuilderSelections {
  roomPhotoUrl:         string | null;
  /** Bathroom size selection */
  bathroomSize:         BathroomSize;
  useCustomDimensions:  boolean;
  customLength:         number;   // metres
  customWidth:          number;   // metres
  floorTile:            TileOption | null;
  wallTile:             TileOption | null;
  vanity:               VanityType;
  tapware:              TapwareFinish;
  budget:               number;             // AUD — user's target/limit
  customNote:           string;             // free-text design note → Gemini prompt
  customFloorColor:     string | null;      // hex colour for floor (custom picker)
  customWallColor:      string | null;      // hex colour for wall (custom picker)
  tileStyle:            TileStyle | null;   // tile layout choice
  structuralChanges:    StructuralChanges;
  generatedImageUrl:    string | null;      // returned by /api/generate
  generateDescription:  string | null;      // text description from AI
}

// ── Floor tiles (8 options) ───────────────────────────────────────

export const FLOOR_TILES: TileOption[] = [
  {
    id:          "travertine",
    name:        "Nude Travertine",
    bgClass:     "bg-travertine",
    description: "Soft-hued natural limestone with warm ivory tones. Sealed finish for wet areas. Timeless and low-maintenance.",
  },
  {
    id:          "desert-stone",
    name:        "Desert Stone",
    bgClass:     "bg-desert-stone",
    description: "Australian sandstone-inspired porcelain. Earthy ochre warmth with subtle natural variation across each tile.",
  },
  {
    id:          "charcoal-slate",
    name:        "Charcoal Slate",
    bgClass:     "bg-charcoal-slate",
    description: "Dense metamorphic stone in deep charcoal. Naturally textured and non-slip — ideal for wet areas.",
    textLight:   true,
  },
  {
    id:          "zellige-ivory",
    name:        "Zellige Ivory",
    bgClass:     "bg-zellige-ivory",
    description: "Hand-crafted Moroccan clay tiles with organic imperfections and a glazed ivory finish. Every tile is unique.",
  },
  {
    id:          "terrazzo-blanc",
    name:        "Terrazzo Blanc",
    bgClass:     "bg-terrazzo-blanc",
    description: "Contemporary white terrazzo with scattered grey and warm-tone chips. Polished finish for a premium spa feel.",
  },
  {
    id:          "honed-limestone",
    name:        "Honed Limestone",
    bgClass:     "bg-honed-limestone",
    description: "Matte-honed natural limestone in a soft cream. Slip-resistant texture and beautifully tactile underfoot.",
  },
  {
    id:          "natural-oak",
    name:        "Natural Oak Look",
    bgClass:     "bg-natural-oak",
    description: "Timber-look porcelain in warm oak tones. 100% waterproof — all the warmth of wood, none of the maintenance.",
  },
  {
    id:          "matte-slate-lg",
    name:        "Matte Slate",
    bgClass:     "bg-matte-slate-lg",
    description: "Large-format matte slate in a cool blue-grey. Clean, contemporary and hides water marks effortlessly.",
    textLight:   true,
  },
];

// ── Wall tiles (8 options) ────────────────────────────────────────

export const WALL_TILES: TileOption[] = [
  {
    id:          "marble-blanc",
    name:        "Marble Blanc",
    bgClass:     "bg-marble-blanc",
    description: "Classic white Carrara marble with subtle grey veining. Cool, luxurious, and enduringly elegant.",
  },
  {
    id:          "sage-subway",
    name:        "Sage Subway",
    bgClass:     "bg-sage-subway",
    description: "Glazed ceramic subway tiles in a soft muted sage. Easy to clean, highly durable, and enduringly stylish.",
    textLight:   true,
  },
  {
    id:          "terracotta-feature",
    name:        "Terracotta Feature",
    bgClass:     "bg-terracotta-feature",
    description: "Earthy red-clay tiles inspired by Mediterranean craftsmanship. Use as a feature wall for bold warmth.",
    textLight:   true,
  },
  {
    id:          "zellige-white",
    name:        "Zellige White",
    bgClass:     "bg-zellige-white",
    description: "White-glazed handmade Moroccan zellige. Irregular facets catch and scatter light beautifully throughout the day.",
  },
  {
    id:          "zellige-sage",
    name:        "Zellige Sage",
    bgClass:     "bg-zellige-sage",
    description: "Handmade sage-green zellige with irregular glaze depth. A trending Australian choice pairing warmth with nature.",
    textLight:   true,
  },
  {
    id:          "fluted-white",
    name:        "Fluted White",
    bgClass:     "bg-fluted-white",
    description: "Ribbed white ceramic with vertical fluting. Adds architectural texture and dimension to any wet area wall.",
  },
  {
    id:          "coastal-terrazzo",
    name:        "Coastal Terrazzo",
    bgClass:     "bg-coastal-terrazzo",
    description: "Warm sand-toned terrazzo wall tile. Brings a laid-back coastal luxe feel — pairs beautifully with brushed gold.",
  },
  {
    id:          "smoked-concrete",
    name:        "Smoked Concrete",
    bgClass:     "bg-smoked-concrete",
    description: "Large-format matte concrete-look wall tile in warm grey. Industrial edge with a boutique hotel finish.",
    textLight:   true,
  },
];

export const VANITY_OPTIONS: {
  id:          VanityType;
  label:       string;
  description: string;
}[] = [
  {
    id:          "floating",
    label:       "Floating",
    description: "Wall-mounted with full floor clearance. Clean, modern silhouette — makes the room feel larger.",
  },
  {
    id:          "freestanding",
    label:       "Freestanding",
    description: "Traditional floor-mounted cabinet. Timeless look with generous storage beneath.",
  },
];

export const TAPWARE_OPTIONS: {
  id:        TapwareFinish;
  label:     string;
  swatchBg:  string;
  premium?:  string;
}[] = [
  {
    id:       "chrome",
    label:    "Chrome",
    swatchBg: "linear-gradient(135deg,#e8e8e8,#c0c0c0,#a8a8a8)",
  },
  {
    id:       "matte-black",
    label:    "Matte Black",
    swatchBg: "linear-gradient(135deg,#3a3a3a,#1a1a1a,#111111)",
    premium:  "+6%",
  },
  {
    id:       "brushed-gold",
    label:    "Brushed Gold",
    swatchBg: "linear-gradient(135deg,#e8c97e,#c9a84c,#b8962c)",
    premium:  "+14%",
  },
];

// ── Budget ────────────────────────────────────────────────────────

export const BUDGET_MIN  = 10_000;
export const BUDGET_MAX  = 40_000;
export const BUDGET_STEP = 500;

// ── Cost multipliers ──────────────────────────────────────────────

export const VANITY_MULTIPLIER: Record<VanityType, number> = {
  floating:     1.00,
  freestanding: 0.92,
};

export const TAPWARE_MULTIPLIER: Record<TapwareFinish, number> = {
  "chrome":       1.00,
  "matte-black":  1.06,
  "brushed-gold": 1.14,
};

export const TILE_MULTIPLIER: Record<string, number> = {
  "travertine":          1.08,
  "desert-stone":        1.00,
  "charcoal-slate":      1.05,
  "zellige-ivory":       1.18,
  "marble-blanc":        1.22,
  "sage-subway":         0.95,
  "terracotta-feature":  1.10,
  "zellige-white":       1.16,
  "terrazzo-blanc":      1.12,
  "honed-limestone":     1.06,
  "natural-oak":         1.15,
  "matte-slate-lg":      1.08,
  "zellige-sage":        1.18,
  "fluted-white":        1.10,
  "coastal-terrazzo":    1.12,
  "smoked-concrete":     1.05,
};

// ── Premium tile IDs (Marble / Terrazzo → +20% surcharge) ────────

export const PREMIUM_TILE_IDS = new Set([
  "marble-blanc",
  "terrazzo-blanc",
  "coastal-terrazzo",
]);

// ── Cost breakdown ────────────────────────────────────────────────

export const COST_BREAKDOWN: { label: string; pct: number }[] = [
  { label: "Tiles — Floor & Wall",  pct: 0.18 },
  { label: "Vanity & Storage",      pct: 0.22 },
  { label: "Tapware & Fixtures",    pct: 0.14 },
  { label: "Labour & Installation", pct: 0.38 },
  { label: "Sundries & Waste",      pct: 0.08 },
];

// ── Structural change cost adders (AUD) ───────────────────────────

export const STRUCTURAL_COST: {
  removeBathtub:   number;
  addWalkinShower: number;
  replaceToilet:   number;
  inWallCistern:   number;
} = {
  removeBathtub:   2_500,
  addWalkinShower: 4_500,
  replaceToilet:   1_200,
  inWallCistern:   2_200,
};

export const NICHE_COST: Record<ShowerNiche, number> = {
  none:   0,
  single: 600,
  double: 1_000,
};

export const SHOWER_FIXTURES_COST: Record<ShowerFixtures, number> = {
  single: 0,
  dual:   1_200,
};

// ── Cost engine ───────────────────────────────────────────────────

/** Fixed 2026 Australian bathroom renovation base price */
export const BASE_RENOVATION_COST = 12_000;

/**
 * Calculates the estimated renovation cost independently of the
 * budget slider.  The budget slider is the user's target; this
 * function returns what their selections actually cost so the UI
 * can flag over-budget scenarios.
 *
 * Logic:
 *  1. Start at $12,000 (entry-level Australian reno, 2026)
 *  2. Apply material & fixture multipliers
 *  3. Add structural flat costs
 *  4. If Marble or Terrazzo tiles are selected → +20%
 *  5. Round to nearest $500
 */
export function calcEstimatedCost(
  floorTile:         TileOption | null,
  wallTile:          TileOption | null,
  vanity:            VanityType,
  tapware:           TapwareFinish,
  structuralChanges: StructuralChanges,
  baseCost:          number = BASE_RENOVATION_COST,
): number {
  // 1. Base
  let cost = baseCost;

  // 2. Material multipliers
  const floorMult   = TILE_MULTIPLIER[floorTile?.id ?? ""] ?? 1.0;
  const wallMult    = TILE_MULTIPLIER[wallTile?.id  ?? ""] ?? 1.0;
  const avgTileMult = (floorMult + wallMult) / 2;

  cost *=
    VANITY_MULTIPLIER[vanity] *
    TAPWARE_MULTIPLIER[tapware] *
    ((avgTileMult + 1) / 2);

  // 3. Boolean structural flat adders
  const { removeBathtub, addWalkinShower, replaceToilet, inWallCistern } = structuralChanges;
  if (removeBathtub)   cost += STRUCTURAL_COST.removeBathtub;
  if (addWalkinShower) cost += STRUCTURAL_COST.addWalkinShower;
  if (replaceToilet)   cost += STRUCTURAL_COST.replaceToilet;
  if (inWallCistern)   cost += STRUCTURAL_COST.inWallCistern;

  // 4. Shower niche cost
  cost += NICHE_COST[structuralChanges.showerNiche];

  // 5. Shower fixtures cost (dual head plumbing split)
  cost += SHOWER_FIXTURES_COST[structuralChanges.showerFixtures];

  // 6. Premium surcharge
  const premiumFloor = PREMIUM_TILE_IDS.has(floorTile?.id ?? "");
  const premiumWall  = PREMIUM_TILE_IDS.has(wallTile?.id  ?? "");
  if (premiumFloor || premiumWall) cost *= 1.20;

  // 7. Round to $500
  return Math.round(cost / 500) * 500;
}

// ══════════════════════════════════════════════════════════════════
//  ITEMISED COST BREAKDOWN — used in /connect summary
// ══════════════════════════════════════════════════════════════════

export interface CostLineItem {
  label: string;
  amount: number;
  detail?: string;
}

export function buildItemisedCosts(
  floorTile:         TileOption | null,
  wallTile:          TileOption | null,
  vanity:            VanityType,
  tapware:           TapwareFinish,
  structuralChanges: StructuralChanges,
  baseCost:          number = BASE_RENOVATION_COST,
): CostLineItem[] {
  const items: CostLineItem[] = [];

  // 1. Base build
  items.push({
    label:  "Base bathroom renovation",
    amount: baseCost,
    detail: "Australian 2026 market rate estimate",
  });

  // 2. Tile premium adders
  const floorMult   = TILE_MULTIPLIER[floorTile?.id ?? ""] ?? 1.0;
  const wallMult    = TILE_MULTIPLIER[wallTile?.id  ?? ""] ?? 1.0;
  const tileBlend   = ((floorMult + wallMult) / 2 + 1) / 2; // matches calcEstimatedCost
  const tileAdder   = Math.round(BASE_RENOVATION_COST * (tileBlend - 1));
  if (tileAdder !== 0) {
    items.push({
      label:  "Tile material premium",
      amount: tileAdder,
      detail: `${floorTile?.name ?? "—"} (floor) · ${wallTile?.name ?? "—"} (wall)`,
    });
  }

  // 3. Vanity multiplier delta
  const vanityDelta = Math.round(BASE_RENOVATION_COST * (VANITY_MULTIPLIER[vanity] - 1));
  if (vanityDelta !== 0) {
    items.push({
      label:  vanity === "floating" ? "Floating vanity" : "Freestanding vanity",
      amount: vanityDelta,
    });
  }

  // 4. Tapware multiplier delta
  const tapwareDelta = Math.round(BASE_RENOVATION_COST * (TAPWARE_MULTIPLIER[tapware] - 1));
  if (tapwareDelta !== 0) {
    items.push({
      label:  `${tapware === "matte-black" ? "Matte black" : tapware === "brushed-gold" ? "Brushed gold" : "Chrome"} tapware`,
      amount: tapwareDelta,
    });
  }

  // 5. Structural booleans
  if (structuralChanges.removeBathtub)
    items.push({ label: "Bathtub removal",          amount: STRUCTURAL_COST.removeBathtub });
  if (structuralChanges.addWalkinShower)
    items.push({ label: "Walk-in shower conversion", amount: STRUCTURAL_COST.addWalkinShower });
  if (structuralChanges.replaceToilet)
    items.push({ label: "Toilet replacement",       amount: STRUCTURAL_COST.replaceToilet });
  if (structuralChanges.inWallCistern)
    items.push({ label: "In-wall cistern",          amount: STRUCTURAL_COST.inWallCistern });

  // 6. Shower niche
  if (structuralChanges.showerNiche === "single")
    items.push({ label: "Single shower niche", amount: NICHE_COST.single });
  if (structuralChanges.showerNiche === "double")
    items.push({ label: "Double shower niche", amount: NICHE_COST.double });

  // 7. Shower fixtures
  if (structuralChanges.showerFixtures === "dual")
    items.push({
      label: "Dual shower heads",
      amount: SHOWER_FIXTURES_COST.dual,
      detail: "Rain + handheld with plumbing split",
    });

  // 8. Premium surcharge (marble/terrazzo)
  const premiumFloor = PREMIUM_TILE_IDS.has(floorTile?.id ?? "");
  const premiumWall  = PREMIUM_TILE_IDS.has(wallTile?.id  ?? "");
  if (premiumFloor || premiumWall) {
    const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
    const surcharge = Math.round(subtotal * 0.20);
    items.push({
      label:  "Premium tile surcharge (+20%)",
      amount: surcharge,
      detail: "Marble / terrazzo finishes",
    });
  }

  return items;
}
