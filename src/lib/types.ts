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
  /** Optional pre-generation project brief (3 questions) */
  projectBrief:    import("./projectBrief").ProjectBrief | null;
  lightingOption:  LightingOption | null;
  roomPhotoUrl:         string | null;
  /** Bathroom size selection */
  bathroomSize:         BathroomSize | null;
  useCustomDimensions:  boolean;
  customLength:         number;   // metres
  customWidth:          number;   // metres
  floorTile:            TileOption | null;
  wallTile:             TileOption | null;
  vanity:               VanityType | null;
  tapware:              TapwareFinish | null;
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

// ── Lighting & Electrical ─────────────────────────────────────────

export type LightingOption = "none" | "standard" | "premium";

export const LIGHTING_OPTIONS: {
  id:          LightingOption;
  label:       string;
  sub:         string;
  cost:        number;   // AUD inc. GST — fixture + estimated electrician labour
  promptLine:  string;
}[] = [
  {
    id:         "none",
    label:      "No Upgrade",
    sub:        "Keep existing lighting",
    cost:       0,
    promptLine: "",
  },
  {
    id:         "standard",
    label:      "Heat Exhaust (3-in-1)",
    sub:        "$308 fixture + ~$150 install",
    cost:       458,    // Marvel 3-in-1 $308.18 ex GST (BDW #235561) + $150 electrician est.
    promptLine: "Include a wall-mounted 3-in-1 heat/exhaust/light unit above the shower or toilet zone.",
  },
  {
    id:         "premium",
    label:      "LED Accent + Heat Exhaust",
    sub:        "3-in-1 + under-vanity & cabinet LED",
    cost:       908,    // $308.18 fixture + $350 LED fixtures + $250 electrician est.
    promptLine: "Include a 3-in-1 heat/exhaust/light unit, LED strip lighting under the floating vanity, and integrated LED lighting around the shaving cabinet mirror.",
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

// ── Per-item flat cost constants ─────────────────────────────

/** Supply & lay cost per tile selection — medium bathroom baseline (~7 m²) */
export const FLOOR_TILE_COSTS: Record<string, number> = {
  "travertine":      1_800,
  "desert-stone":    1_600,
  "charcoal-slate":  2_000,
  "zellige-ivory":   2_800,
  "terrazzo-blanc":  2_600,
  "honed-limestone": 2_100,
  "natural-oak":     2_200,
  "marble-blanc":    3_500,
};
export const WALL_TILE_COSTS: Record<string, number> = {
  "travertine":      1_600,
  "desert-stone":    1_400,
  "charcoal-slate":  1_800,
  "zellige-ivory":   2_500,
  "terrazzo-blanc":  2_300,
  "honed-limestone": 1_900,
  "natural-oak":     2_000,
  "marble-blanc":    3_200,
};
export const BATHROOM_VANITY_COSTS: Record<string, number>  = { floating: 2_200, freestanding: 1_800 };
export const BATHROOM_TAPWARE_COSTS: Record<string, number> = { chrome: 850, "matte-black": 1_300, "brushed-gold": 1_700 };
export const BATHROOM_LIGHTING_COSTS: Record<string, number> = { none: 0, standard: 650, premium: 1_600 };
/** Scale tile costs up/down based on bathroom size vs medium baseline */
export const BATHROOM_SIZE_TILE_SCALE: Record<string, number> = {
  small: 0.65, medium: 1.0, large: 1.5, custom: 1.0,
};

// ── Cost engine ───────────────────────────────────────────────────

/** Fixed 2026 Australian bathroom renovation base price (kept for display contexts) */
export const BASE_RENOVATION_COST = 12_000;

/**
 * Calculates the estimated renovation cost from zero — costs only
 * accumulate as the user makes selections.
 *
 * Logic:
 *  1. Determine tile scale from bathroom size or custom dimensions
 *  2. Accumulate material costs for each non-null selection
 *  3. Add structural flat costs
 *  4. Labour = 40% of material total (only when materials > 0)
 *  5. Round to nearest $500
 */
export function calcEstimatedCost(
  floorTile:         TileOption | null,
  wallTile:          TileOption | null,
  vanity:            VanityType | null,
  tapware:           TapwareFinish | null,
  structuralChanges: StructuralChanges,
  _baseCost:         number = 0,
  bathroomSize:      BathroomSize | null = null,
  customLength:      number = 0,
  customWidth:       number = 0,
  lightingOption:    LightingOption | null = null,
): number {
  const round = (n: number) => Math.round(n);

  // 1. Tile scale
  let scale: number;
  if (bathroomSize === "custom" && customLength > 0 && customWidth > 0) {
    scale = Math.min(3.0, Math.max(0.5, (customLength * customWidth) / 7));
  } else {
    scale = BATHROOM_SIZE_TILE_SCALE[bathroomSize ?? "medium"] ?? 1.0;
  }

  // 2. Materials
  let materials = 0;
  if (floorTile)  materials += round((FLOOR_TILE_COSTS[floorTile.id] ?? 1_800) * scale);
  if (wallTile)   materials += round((WALL_TILE_COSTS[wallTile.id]   ?? 1_600) * scale);
  if (vanity)     materials += BATHROOM_VANITY_COSTS[vanity]  ?? 2_200;
  if (tapware)    materials += BATHROOM_TAPWARE_COSTS[tapware] ?? 850;
  if (lightingOption && lightingOption !== "none") materials += BATHROOM_LIGHTING_COSTS[lightingOption] ?? 650;

  // 3. Structural
  let structural = 0;
  const { removeBathtub, addWalkinShower, replaceToilet, inWallCistern } = structuralChanges;
  if (removeBathtub)   structural += STRUCTURAL_COST.removeBathtub;
  if (addWalkinShower) structural += STRUCTURAL_COST.addWalkinShower;
  if (replaceToilet)   structural += STRUCTURAL_COST.replaceToilet;
  if (inWallCistern)   structural += STRUCTURAL_COST.inWallCistern;
  structural += NICHE_COST[structuralChanges.showerNiche];
  structural += SHOWER_FIXTURES_COST[structuralChanges.showerFixtures];

  // 4. Early exit when nothing selected
  if (materials === 0 && structural === 0) return 0;

  // 5. Labour
  const labour = materials > 0 ? round(materials * 0.40) : 0;

  // 6. Round to $500
  return Math.round((materials + structural + labour) / 500) * 500;
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
  vanity:            VanityType | null,
  tapware:           TapwareFinish | null,
  structuralChanges: StructuralChanges,
  _baseCost:         number = 0,
  bathroomSize:      BathroomSize | null = null,
  customLength:      number = 0,
  customWidth:       number = 0,
  lightingOption:    LightingOption | null = null,
): CostLineItem[] {
  const round = (n: number) => Math.round(n);

  // 1. Tile scale
  let scale: number;
  if (bathroomSize === "custom" && customLength > 0 && customWidth > 0) {
    scale = Math.min(3.0, Math.max(0.5, (customLength * customWidth) / 7));
  } else {
    scale = BATHROOM_SIZE_TILE_SCALE[bathroomSize ?? "medium"] ?? 1.0;
  }

  // 2. Material line items
  const materialItems: CostLineItem[] = [];
  if (floorTile) {
    const cost = round((FLOOR_TILE_COSTS[floorTile.id] ?? 1_800) * scale);
    materialItems.push({ label: `Floor Tiles — ${floorTile.name}`, amount: cost, detail: floorTile.description });
  }
  if (wallTile) {
    const cost = round((WALL_TILE_COSTS[wallTile.id] ?? 1_600) * scale);
    materialItems.push({ label: `Wall Tiles — ${wallTile.name}`, amount: cost, detail: wallTile.description });
  }
  if (vanity) {
    materialItems.push({
      label:  vanity === "floating" ? "Floating Vanity" : "Freestanding Vanity",
      amount: BATHROOM_VANITY_COSTS[vanity] ?? 2_200,
    });
  }
  if (tapware) {
    const tapwareLabel =
      tapware === "matte-black"  ? "Matte Black Tapware" :
      tapware === "brushed-gold" ? "Brushed Gold Tapware" :
                                   "Chrome Tapware";
    materialItems.push({ label: tapwareLabel, amount: BATHROOM_TAPWARE_COSTS[tapware] ?? 850 });
  }
  if (lightingOption && lightingOption !== "none") {
    const lightLabel = lightingOption === "premium" ? "LED Accent + Heat Exhaust" : "Heat Exhaust (3-in-1)";
    materialItems.push({ label: lightLabel, amount: BATHROOM_LIGHTING_COSTS[lightingOption] ?? 650 });
  }

  // 3. Labour (based on material total)
  const materialTotal = materialItems.reduce((s, i) => s + i.amount, 0);
  const items: CostLineItem[] = [];
  if (materialTotal > 0) {
    items.push({
      label:  "Labour & Installation",
      amount: round(materialTotal * 0.40),
      detail: "Tiling, plumbing fit-off, electrical, waste removal",
    });
  }
  items.push(...materialItems);

  // 4. Structural line items
  if (structuralChanges.removeBathtub)
    items.push({ label: "Bathtub removal",           amount: STRUCTURAL_COST.removeBathtub });
  if (structuralChanges.addWalkinShower)
    items.push({ label: "Walk-in shower conversion",  amount: STRUCTURAL_COST.addWalkinShower });
  if (structuralChanges.replaceToilet)
    items.push({ label: "Toilet replacement",         amount: STRUCTURAL_COST.replaceToilet });
  if (structuralChanges.inWallCistern)
    items.push({ label: "In-wall cistern",            amount: STRUCTURAL_COST.inWallCistern });
  if (structuralChanges.showerNiche === "single")
    items.push({ label: "Single shower niche",        amount: NICHE_COST.single });
  if (structuralChanges.showerNiche === "double")
    items.push({ label: "Double shower niche",        amount: NICHE_COST.double });
  if (structuralChanges.showerFixtures === "dual")
    items.push({ label: "Dual shower heads", amount: SHOWER_FIXTURES_COST.dual, detail: "Rain + handheld with plumbing split" });

  return items;
}
