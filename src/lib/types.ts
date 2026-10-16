import { stylePremium, styleCostItem, type DesignStyleId } from "./designStyles";

// ── Tile ──────────────────────────────────────────────────────────

export interface TileOption {
  id:          string;
  name:        string;
  bgClass:     string;       // Tailwind backgroundImage utility class
  description: string;       // Shown in the info tooltip
  textLight?:  boolean;      // Use white text on dark tiles
  /** Small premium for this tone on top of its format's cost (AUD, medium bathroom) */
  adj?:        number;
  /** Phrase for the AI, e.g. "warm white / cream" (defaults to the name) */
  prompt?:     string;
}

export type VanityType    = "floating" | "freestanding";
export type TapwareFinish = "chrome"   | "white" | "matte-black" | "brushed-gold";

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
  /** Categories the client is keeping as they are — no cost, left untouched in the render */
  keepExisting:         import("./keepExisting").BathroomKeepKey[];
  budget:               number;             // AUD — user's target/limit
  customNote:           string;             // free-text design note → Gemini prompt
  customFloorColor:     string | null;      // hex colour for floor (custom picker)
  customWallColor:      string | null;      // hex colour for wall (custom picker)
  tileStyle:            TileStyle | null;   // legacy tile layout (superseded by the surface formats)
  /** Step A of the floor: the physical format; floorTile is Step B, the tone */
  floorFormat:          FloorFormat | null;
  /** Step A of the walls: the material/pattern; wallTile is Step B, the tone */
  wallFormat:           WallFormat | null;
  /** Wall colour for the painted areas above and around the tiles: finish, then a colour (hex) */
  wallPaintFinish:      WallPaintFinish | null;
  wallPaintColor:       string | null;
  /** Overall look for the AI — never selects finishes */
  designStyle:          import("./designStyles").DesignStyleId | null;
  structuralChanges:    StructuralChanges;
  generatedImageUrl:    string | null;      // returned by /api/generate
  generateDescription:  string | null;      // text description from AI
}

/// ── Surfaces: style first, tone second ───────────────────────────
// Floor tiles, wall tiles and wall paint all work the same way: pick a visual style
// (four popular ones up front, the rest behind "View more"), then a tone in a drawer.
// Floor and wall tiles share one tone set so the two coordinate.

export type FloorFormat =
  | "marble-stone" | "terrazzo" | "concrete-slate" | "large-format-plain"
  | "timber-plank" | "encaustic" | "terracotta" | "small-hexagon";
export type WallFormat =
  | "subway" | "kitkat" | "zellige" | "large-slab"
  | "terrazzo-wall" | "fluted" | "herringbone-wall" | "geometric"
  | "wet-zones";

export interface SurfaceFormat<T extends string = string> {
  id:     T;
  label:  string;
  sub:    string;
  /** Card thumbnail in /public/tiles */
  swatch: string;
  /** Supply + lay for a medium bathroom (scaled by size) */
  cost:   number;
  /** How the AI should lay or apply it; "{tone}" is replaced with the tone phrase */
  prompt: string;
  /** Tone ids that suit this format */
  tones:  string[];
  /** Shown under "View more" rather than in the top four */
  more?:  boolean;
  /** A cheaper alternative, shown as its own card under the popular four */
  budget?: boolean;
}

/** The five tones shared by every floor and wall tile style */
export const SURFACE_TONE_IDS = ["warm-white", "light-grey", "charcoal", "sand", "sage"] as const;
export type SurfaceTone = (typeof SURFACE_TONE_IDS)[number];
const ALL_TONES = [...SURFACE_TONE_IDS];

/** Swatch image for a style in a tone: /public/tiles/<style>--<tone>.webp */
export const surfaceSwatch = (style: string, tone: string) => `${style}--${tone}`;

export const FLOOR_FORMATS: SurfaceFormat<FloorFormat>[] = [
  { id: "marble-stone",       label: "Marble & Natural Stone", sub: "Porcelain / Stone",    swatch: surfaceSwatch("marble-stone", "warm-white"),   cost: 2_600,
    prompt: "{tone} marble and natural-stone-look porcelain tiles in a large format, with soft natural veining and minimal grout lines", tones: ALL_TONES },
  { id: "terrazzo",           label: "Terrazzo Look",          sub: "Porcelain",            swatch: surfaceSwatch("terrazzo", "light-grey"),       cost: 2_400,
    prompt: "{tone} terrazzo-look porcelain tiles with fine scattered stone chips", tones: ALL_TONES },
  { id: "concrete-slate",     label: "Concrete & Slate",       sub: "Matte Porcelain",      swatch: surfaceSwatch("concrete-slate", "light-grey"), cost: 2_000,
    prompt: "{tone} matte concrete- and slate-look porcelain tiles with a subtle natural texture", tones: ALL_TONES },
  { id: "large-format-plain", label: "Large Format Plain",     sub: "Glazed Porcelain",     swatch: surfaceSwatch("large-format-plain", "sand"),   cost: 1_800,
    prompt: "plain {tone} glazed porcelain tiles in a large 600×1200mm format with minimal grout lines", tones: ALL_TONES },
  { id: "timber-plank",       label: "Timber-Look Plank",      sub: "Waterproof Porcelain", swatch: surfaceSwatch("timber-plank", "sand"),         cost: 2_000, more: true,
    prompt: "{tone} timber-look porcelain planks laid lengthways", tones: ALL_TONES },
  { id: "encaustic",          label: "Patterned / Encaustic",  sub: "Printed Porcelain",    swatch: surfaceSwatch("encaustic", "charcoal"),        cost: 2_500, more: true,
    prompt: "patterned encaustic-look porcelain tiles in a {tone} colourway with a repeating geometric motif", tones: ALL_TONES },
  { id: "terracotta",         label: "Terracotta",             sub: "Clay / Glazed",        swatch: surfaceSwatch("terracotta", "sand"),           cost: 2_300, more: true,
    prompt: "{tone} terracotta-style square tiles with warm, handmade variation", tones: ALL_TONES },
  { id: "small-hexagon",      label: "Small Hexagon",          sub: "Mosaic",               swatch: surfaceSwatch("small-hexagon", "warm-white"),  cost: 2_400, more: true,
    prompt: "small {tone} hexagon mosaic tiles", tones: ALL_TONES },
];

export const WALL_FORMATS: SurfaceFormat<WallFormat>[] = [
  { id: "subway",           label: "Subway Tile",             sub: "Ceramic / Porcelain", swatch: surfaceSwatch("subway", "warm-white"),           cost: 1_600,
    prompt: "{tone} glazed subway tiles laid in a brick bond", tones: ALL_TONES },
  { id: "kitkat",           label: "KitKat / Finger Tiles",   sub: "Textured Ceramic",    swatch: surfaceSwatch("kitkat", "sage"),                 cost: 2_600,
    prompt: "{tone} vertical KitKat finger tiles (narrow stacked strips) with a softly textured glaze", tones: ALL_TONES },
  { id: "zellige",          label: "Zellige / Handmade Look", sub: "Gloss Finish",        swatch: surfaceSwatch("zellige", "warm-white"),          cost: 2_800,
    prompt: "{tone} handmade zellige-look tiles with an irregular, glossy glaze", tones: ALL_TONES },
  { id: "large-slab",       label: "Large Format Slab",       sub: "Seamless Porcelain",  swatch: surfaceSwatch("large-slab", "light-grey"),       cost: 2_400,
    prompt: "seamless {tone} large-format porcelain slab panels with almost invisible joins", tones: ALL_TONES },
  // Budget saver: the walls stay as they are, only the painted areas are redone (colour = wallPaintColor).
  // The id predates the rename; prompts and labels treat it specially (see KEEP_WALLS_PAINT).
  { id: "wet-zones",        label: "Keep Walls + Fresh Paint", sub: "Your walls stay as they are, freshly painted in your colour", swatch: "#F1EEE6", cost: 700, budget: true,
    prompt: "", tones: ["natural-white", "lexicon-quarter", "hog-bristle", "slate-grey", "sage-green", "navy-charcoal"] },
  { id: "terrazzo-wall",    label: "Terrazzo Wall",           sub: "Porcelain",           swatch: surfaceSwatch("terrazzo-wall", "sand"),          cost: 2_600, more: true,
    prompt: "{tone} terrazzo-look wall tiles with fine scattered chips", tones: ALL_TONES },
  { id: "fluted",           label: "Fluted / Ribbed Tile",    sub: "Ceramic Panels",      swatch: surfaceSwatch("fluted", "warm-white"),           cost: 2_200, more: true,
    prompt: "{tone} vertical fluted (ribbed) ceramic tiles", tones: ALL_TONES },
  { id: "herringbone-wall", label: "Herringbone Pattern",     sub: "Glazed Ceramic",      swatch: surfaceSwatch("herringbone-wall", "light-grey"), cost: 2_300, more: true,
    prompt: "{tone} glazed rectangular tiles laid in a herringbone pattern", tones: ALL_TONES },
  { id: "geometric",        label: "Geometric Feature",       sub: "Fish-Scale / Shapes", swatch: surfaceSwatch("geometric", "sage"),              cost: 2_500, more: true,
    prompt: "{tone} geometric feature tiles in a fish-scale pattern", tones: ALL_TONES },
];

/** The budget wall option: keep the existing walls, repaint the painted areas */
export const KEEP_WALLS_PAINT: WallFormat = "wet-zones";

/** Tones that suit a format, in the format's order */
export function tonesFor<T extends string>(all: TileOption[], format: SurfaceFormat<T> | null | undefined): TileOption[] {
  if (!format) return [];
  return format.tones.map((id) => all.find((t) => t.id === id)).filter((t): t is TileOption => !!t);
}

/** "Light Grey · Terrazzo Look" — for summaries and briefs */
export function surfaceLabel(format: SurfaceFormat | null | undefined, tone: { name: string } | null | undefined, custom?: string | null): string | null {
  const parts = [tone?.name ?? (custom ? `Custom ${custom}` : null), format?.label].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** A format's prompt with "{tone}" filled in by the tone (or a custom colour) */
export function surfacePrompt(format: SurfaceFormat, tone: TileOption | null | undefined, custom?: string | null): string {
  const phrase = tone ? (tone.prompt ?? tone.name.toLowerCase()) : custom ? `custom-coloured (exact colour ${custom})` : "neutral-toned";
  return format.prompt.replace("{tone}", phrase);
}

// ── Tile tones (shared by floor and wall tiles) ───────────────────

export const SURFACE_TONES: TileOption[] = [
  { id: "warm-white", name: "Warm White / Cream",    bgClass: "bg-marble-blanc",     prompt: "warm white / cream",         description: "Soft warm white with a creamy undertone. Bright, calm and timeless." },
  { id: "light-grey", name: "Light Grey",            bgClass: "bg-smoked-concrete",  prompt: "light grey",                 description: "A gentle, cool light grey. Clean and contemporary." },
  { id: "charcoal",   name: "Dark Charcoal / Black", bgClass: "bg-charcoal-slate",   prompt: "dark charcoal / near-black", textLight: true, description: "Deep charcoal to near-black. Bold and grounding." },
  { id: "sand",       name: "Earthy Beige / Sand",   bgClass: "bg-coastal-terrazzo", prompt: "earthy beige / sand",        description: "Warm sandy beige. Relaxed, natural and easy to live with." },
  { id: "sage",       name: "Soft Sage / Muted",     bgClass: "bg-sage-subway",      prompt: "soft sage / muted green",    textLight: true, description: "A muted, greyed sage green. Fresh but restful." },
];
export const FLOOR_TILES: TileOption[] = SURFACE_TONES;
export const WALL_TILES:  TileOption[] = SURFACE_TONES;

// ── Wall colour / paint: finish first, colour second ──────────────

export type WallPaintFinish =
  | "crisp-neutral" | "venetian-microcement" | "feature-wall" | "soft-earth"
  | "limewash" | "dark-moody" | "vj-panelling";

export interface PaintTone { id: string; name: string; color: string; sub: string }

/** Curated Australian interior paint palette (closest colour match, not an official chip) */
export const PAINT_TONES: PaintTone[] = [
  { id: "natural-white",   name: "Natural White",   color: "#F1EEE6", sub: "Soft, warm everyday white" },
  { id: "lexicon-quarter", name: "Lexicon Quarter", color: "#EDEFEE", sub: "Crisp cool white" },
  { id: "hog-bristle",     name: "Hog Bristle",     color: "#E0D3B8", sub: "Warm beige" },
  { id: "slate-grey",      name: "Slate Grey",      color: "#7E8489", sub: "Mid blue-grey" },
  { id: "sage-green",      name: "Sage Green",      color: "#A3B09A", sub: "Muted green" },
  { id: "navy-charcoal",   name: "Navy / Charcoal", color: "#2F3A4A", sub: "Deep inky navy" },
];
const FEATURE_TONES: PaintTone[] = [
  { id: "sage-green",       name: "Sage Green",       color: "#A3B09A", sub: "Muted green" },
  { id: "slate-blue",       name: "Slate Blue",       color: "#6F8296", sub: "Soft dusty blue" },
  { id: "terracotta-clay",  name: "Terracotta Clay",  color: "#C07A57", sub: "Warm earthy red" },
  { id: "olive",            name: "Olive",            color: "#7F7E57", sub: "Earthy olive green" },
  { id: "ochre",            name: "Ochre",            color: "#C49A4E", sub: "Golden mustard" },
  { id: "navy-charcoal",    name: "Navy / Charcoal",  color: "#2F3A4A", sub: "Deep inky navy" },
];
const EARTH_TONES: PaintTone[] = [
  { id: "hog-bristle",      name: "Hog Bristle",      color: "#E0D3B8", sub: "Warm beige" },
  { id: "sandstone",        name: "Sandstone",        color: "#D6C19D", sub: "Golden sand" },
  { id: "clay",             name: "Soft Clay",        color: "#C8A486", sub: "Pinkish clay" },
  { id: "terracotta-blush", name: "Terracotta Blush", color: "#D4A08A", sub: "Faded terracotta" },
  { id: "olive-stone",      name: "Olive Stone",      color: "#A8A283", sub: "Greyed olive" },
  { id: "mushroom",         name: "Mushroom",         color: "#B5A898", sub: "Warm taupe" },
];
const MOODY_TONES: PaintTone[] = [
  { id: "navy-charcoal",    name: "Navy / Charcoal",  color: "#2F3A4A", sub: "Deep inky navy" },
  { id: "charcoal",         name: "Charcoal",         color: "#3B3C3E", sub: "Soft black" },
  { id: "forest",           name: "Forest Green",     color: "#3E4F43", sub: "Deep green" },
  { id: "deep-teal",        name: "Deep Teal",        color: "#2F4B4F", sub: "Blue-green" },
  { id: "aubergine",        name: "Aubergine",        color: "#4A3842", sub: "Plum brown" },
  { id: "chocolate",        name: "Chocolate",        color: "#4A3B30", sub: "Warm dark brown" },
];

export interface PaintFinish {
  id:          WallPaintFinish;
  label:       string;
  sub:         string;
  /** Bathroom: painted areas above and around the tiles */
  cost:        number;
  /** Kitchen: all painted walls */
  kitchenCost: number;
  prompt:      string;
  tones:       PaintTone[];
  /** Tone shown on the card before one is chosen */
  defaultTone: string;
  more?:       boolean;
}

export const PAINT_FINISHES: PaintFinish[] = [
  { id: "crisp-neutral",        label: "Crisp Neutral",                  sub: "Low Sheen Paint", cost: 0,     kitchenCost: 0,     defaultTone: "natural-white",
    prompt: "a crisp low-sheen painted finish", tones: PAINT_TONES },
  { id: "venetian-microcement", label: "Venetian Plaster / Microcement", sub: "Textured Finish", cost: 1_800, kitchenCost: 3_200, defaultTone: "hog-bristle",
    prompt: "seamless polished Venetian plaster / microcement with a soft burnished sheen", tones: PAINT_TONES },
  { id: "feature-wall",         label: "Feature Wall Tone",              sub: "Accent Colour",   cost: 250,   kitchenCost: 350,   defaultTone: "sage-green",
    prompt: "a painted feature wall in a bold accent colour (one main wall; the other painted walls in a soft complementary neutral)", tones: FEATURE_TONES },
  { id: "soft-earth",           label: "Soft Earth Tones",               sub: "Matte Paint",     cost: 0,     kitchenCost: 0,     defaultTone: "clay",
    prompt: "a soft matte earthy painted finish", tones: EARTH_TONES },
  { id: "limewash",             label: "Limewash Look",                  sub: "Mineral Finish",  cost: 700,   kitchenCost: 1_400, defaultTone: "natural-white", more: true,
    prompt: "a soft, cloudy limewash finish", tones: PAINT_TONES },
  { id: "dark-moody",           label: "Dark / Moody Accent",            sub: "Matte Paint",     cost: 250,   kitchenCost: 350,   defaultTone: "navy-charcoal", more: true,
    prompt: "a dark, moody matte painted finish", tones: MOODY_TONES },
  { id: "vj-panelling",         label: "V-Joint / VJ Panelling",         sub: "Painted Panels",  cost: 1_400, kitchenCost: 2_800, defaultTone: "natural-white", more: true,
    prompt: "vertical VJ (V-joint, tongue-and-groove) panelling, painted", tones: PAINT_TONES },
];

/** Swatch image for a paint finish in a tone: /public/tiles/paint-<finish>--<tone>.webp */
export const paintSwatch = (finish: string, tone: string) => `paint-${finish}--${tone}`;
export const findPaintFinish = (id: string | null | undefined) => PAINT_FINISHES.find((f) => f.id === id);
/** A paint colour is stored as a hex; this finds its name in the finish's palette (or any palette) */
export function paintToneFor(finish: PaintFinish | null | undefined, color: string | null | undefined): PaintTone | undefined {
  if (!color) return undefined;
  const all = [...(finish?.tones ?? []), ...PAINT_FINISHES.flatMap((f) => f.tones)];
  return all.find((t) => t.color.toLowerCase() === color.toLowerCase());
}
/** "Natural White · Venetian Plaster / Microcement" */
export function paintLabel(finishId: string | null | undefined, color: string | null | undefined): string | null {
  const fin = findPaintFinish(finishId);
  const tone = paintToneFor(fin, color);
  const parts = [tone?.name ?? (color ? `Custom ${color}` : null), fin?.label].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
/** Bathroom walls for summaries: "Sage · Subway Tile", or "Hog Bristle · Keep Walls + Fresh Paint" */
export function bathroomWallLabel(wallFormat: string | null | undefined, wallTile: { name: string } | null | undefined, customWallColor: string | null | undefined, wallPaintColor: string | null | undefined): string | null {
  const fmt = WALL_FORMATS.find((f) => f.id === wallFormat);
  if (wallFormat === KEEP_WALLS_PAINT) {
    const colour = paintToneFor(null, wallPaintColor)?.name ?? (wallPaintColor ? `Custom ${wallPaintColor}` : null);
    return [colour, fmt?.label].filter(Boolean).join(" · ");
  }
  return surfaceLabel(fmt, wallTile, customWallColor);
}

/** Prompt phrase for painted walls, e.g. "a crisp low-sheen painted finish in natural white (exact colour #F1EEE6)" */
export function paintPrompt(finishId: string | null | undefined, color: string | null | undefined): string | null {
  const fin = findPaintFinish(finishId);
  if (!fin && !color) return null;
  const tone = paintToneFor(fin, color);
  const colour = color ? ` in ${tone ? `${tone.name.toLowerCase()} (exact colour ${color})` : `the exact colour ${color}`}` : "";
  return `${fin?.prompt ?? "painted walls"}${colour}`;
}

// ── Timber, stone and concrete tones (bedroom flooring) ───────────

export const STONE_TIMBER_TONES: TileOption[] = [
  { id: "honed-limestone",   name: "Honed Limestone",    bgClass: "bg-honed-limestone", adj: 200, description: "Matte cream limestone — slip-resistant and beautifully tactile underfoot." },
  { id: "matte-slate-lg",    name: "Blue-Grey Slate",    bgClass: "bg-matte-slate-lg",  textLight: true, description: "Cool blue-grey matte slate look. Hides water marks effortlessly." },
  { id: "natural-oak",       name: "Natural Oak",        bgClass: "bg-natural-oak",                 description: "Warm mid-tone oak look. All the warmth of timber, fully waterproof." },
  { id: "blonde-oak",        name: "Blonde Oak",         bgClass: "bg-natural-oak",                 description: "Pale Scandinavian oak look — light, airy and calm." },
  { id: "smoked-oak",        name: "Smoked Oak",         bgClass: "bg-natural-oak",    adj: 200, textLight: true, description: "Deep smoked oak look — rich and grounding." },
  { id: "concrete-pale",     name: "Pale Concrete",      bgClass: "bg-smoked-concrete",             description: "Soft pale-grey concrete with a subtle cloudy finish." },
  { id: "smoked-concrete",   name: "Warm Grey Concrete", bgClass: "bg-smoked-concrete", textLight: true, description: "Mid warm-grey concrete with natural pinholes." },
  { id: "concrete-charcoal", name: "Charcoal Concrete",  bgClass: "bg-charcoal-slate",  textLight: true, description: "Dark charcoal concrete — moody and modern." },
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
    id:       "white",
    label:    "Plain White",
    swatchBg: "linear-gradient(135deg,#ffffff,#f1f0ec,#d9d8d3)",
    premium:  "+5%",
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
  "white":        1.05,
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
  inWallCistern:   1_500,
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
export const BATHROOM_TAPWARE_COSTS: Record<string, number> = { chrome: 850, white: 1_250, "matte-black": 1_300, "brushed-gold": 1_700 };
export const BATHROOM_LIGHTING_COSTS: Record<string, number> = { none: 0, standard: 650, premium: 1_600 };
/** Scale tile costs up/down based on bathroom size vs medium baseline */
export const BATHROOM_SIZE_TILE_SCALE: Record<string, number> = {
  small: 0.65, medium: 1.0, large: 1.5, custom: 1.0,
};

// ── Cost engine ───────────────────────────────────────────────────

/** Formats and style that refine the bathroom estimate */
export interface BathroomSurfaces {
  floorFormat?: FloorFormat | null;
  wallFormat?:  WallFormat  | null;
  wallPaintFinish?: WallPaintFinish | string | null;
  wallPaintColor?:  string | null;
  designStyle?: DesignStyleId | string | null;
}

/** Floor supply + lay before size scaling: the format's cost plus the tone's small premium */
function floorCost(tone: TileOption | null, format: FloorFormat | null | undefined): number {
  const f = FLOOR_FORMATS.find((x) => x.id === format);
  if (f) return f.cost + (tone?.adj ?? 0);
  return tone ? (FLOOR_TILE_COSTS[tone.id] ?? 1_800) : 0;   // tone only (designs made before formats)
}
function wallCost(tone: TileOption | null, format: WallFormat | null | undefined): number {
  const f = WALL_FORMATS.find((x) => x.id === format);
  if (f) return f.cost + (tone?.adj ?? 0);
  return tone ? (WALL_TILE_COSTS[tone.id] ?? 1_600) : 0;
}

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
  surfaces:          BathroomSurfaces = {},
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
  const floor = floorCost(floorTile, surfaces.floorFormat), wall = wallCost(wallTile, surfaces.wallFormat);
  const paint = findPaintFinish(surfaces.wallPaintFinish)?.cost ?? 0;
  if (floor) materials += round(floor * scale);
  if (wall)  materials += round(wall  * scale);
  if (paint) materials += round(paint * scale);
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

  // 4. Style premium (only the luxury tier has one)
  const premium = stylePremium(surfaces.designStyle);

  // 5. Early exit when nothing selected
  if (materials === 0 && structural === 0 && premium === 0) return 0;

  // 6. Labour
  const labour = materials > 0 ? round(materials * 0.40) : 0;

  // 7. Round to $500
  return Math.round((materials + structural + labour + premium) / 500) * 500;
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
  surfaces:          BathroomSurfaces = {},
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
  const floorFmt = FLOOR_FORMATS.find((f) => f.id === surfaces.floorFormat);
  const wallFmt  = WALL_FORMATS.find((f)  => f.id === surfaces.wallFormat);
  const floor = floorCost(floorTile, surfaces.floorFormat), wall = wallCost(wallTile, surfaces.wallFormat);
  if (floor) materialItems.push({ label: `Floor — ${surfaceLabel(floorFmt, floorTile) ?? "Tiles"}`, amount: round(floor * scale), detail: floorTile?.description ?? floorFmt?.sub });
  if (wall)  materialItems.push({ label: `Walls — ${bathroomWallLabel(surfaces.wallFormat, wallTile, null, surfaces.wallPaintColor) ?? "Tiles"}`,  amount: round(wall * scale),  detail: wallTile?.description ?? wallFmt?.sub });
  const paintFin = findPaintFinish(surfaces.wallPaintFinish);
  if (paintFin && paintFin.cost > 0) materialItems.push({ label: `Wall Colour — ${paintLabel(paintFin.id, surfaces.wallPaintColor)}`, amount: round(paintFin.cost * scale), detail: paintFin.sub });
  if (vanity) {
    materialItems.push({
      label:  vanity === "floating" ? "Floating Vanity" : "Freestanding Vanity",
      amount: BATHROOM_VANITY_COSTS[vanity] ?? 2_200,
    });
  }
  if (tapware) {
    const tapwareLabel =
      tapware === "white"        ? "Plain White Tapware" :
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

  const styleItem = styleCostItem(surfaces.designStyle);
  if (styleItem) items.push(styleItem);

  return items;
}
