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

export const ROOM_ICONS: Record<RoomType, string> = {
  bathroom: "🛁",
  kitchen:  "🏗️",
  bedroom:  "🛏️",
};

// ── Global ceiling ────────────────────────────────────────────────────────────

export type CeilingStyle = "standard-white" | "vj-paneling" | "exposed-beam" | "coffered";

export const CEILING_OPTIONS: { id: CeilingStyle; label: string; sub: string; cost: number }[] = [
  { id: "standard-white", label: "Standard White Paint",     sub: "Clean flat white — the classic, cost-effective choice",   cost: 0       },
  { id: "vj-paneling",    label: "VJ Paneling (Whitewashed)", sub: "Tongue-and-groove boards ceiling-mounted — coastal/hamptons", cost: 3_200 },
  { id: "exposed-beam",   label: "Exposed Beam (AI rendered)", sub: "Rustic or industrial raw beam ceiling — high visual impact", cost: 4_800 },
  { id: "coffered",       label: "Coffered Ceiling",          sub: "Recessed grid panels — formal, grand architectural statement", cost: 5_500 },
];

// ── Kitchen types ─────────────────────────────────────────────────────────────

export type KitchenRoomSize  = "galley" | "standard" | "large" | "custom";
export type CabinetryStyle   = "shaker" | "shaker-sage" | "matte-black" | "flat-panel" | "flat-panel-beige" | "natural-timber";
export type BenchtopMaterial = "engineered-stone" | "porcelain-slab" | "timber";
export type MixerFinish      = "brushed-brass" | "matte-black" | "chrome";
export type SplashbackStyle  = "white-subway" | "grey-subway" | "calacatta-slab" | "mirrored" | "vj-panel" | "slab-match";
export type CooktopType      = "induction" | "gas";
export type DishwasherType   = "integrated" | "freestanding";
export type KitchenFloorFinish = "large-white" | "large-grey" | "large-charcoal" | "timber-oak" | "polished-concrete" | "terrazzo";

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

export interface KitchenSelections {
  roomSize:             KitchenRoomSize;
  customLength:         number;   // metres — used when roomSize === "custom"
  customWidth:          number;
  cabinetry:            CabinetryStyle   | null;  // null = deselected
  benchtop:             BenchtopMaterial | null;
  mixer:                MixerFinish      | null;
  splashback:           SplashbackStyle  | null;
  floorFinish:          KitchenFloorFinish | null; // kitchen floor tile/finish
  floorColor:           string | null;             // custom hex override for floor
  wallColor:            string | null;             // painted wall colour
  cooktop:              CooktopType;
  dishwasher:           DishwasherType;
  ceilingStyle:         CeilingStyle;
  hasIsland:            boolean;  // triggers gas/plumbing advisory
  hasApplianceRoughin:  boolean;  // new gas point / 15-amp circuit
  hasSinkRoughin:       boolean;  // moving the plumbing stack
  hasWallChange:        boolean;  // open-plan wall removal/addition
  hasButlersPantry:     boolean;  // butler's pantry integration
  customNote:           string;
}

// ── Kitchen options ───────────────────────────────────────────────────────────

export const CABINETRY_OPTIONS: { id: CabinetryStyle; label: string; sub: string; palette: string[]; costAdj: number }[] = [
  {
    id:      "shaker",
    label:   "Shaker White",
    sub:     "Classic recessed-panel in white — timeless and universally versatile",
    palette: ["#F5F0E8", "#E8E0D5", "#C8C0B8"],
    costAdj: 0,
  },
  {
    id:      "shaker-sage",
    label:   "Shaker Sage Green",
    sub:     "Recessed-panel in sage — on-trend coastal colour palette",
    palette: ["#8FAF8A", "#7A9E73", "#65885D"],
    costAdj: 500,
  },
  {
    id:      "matte-black",
    label:   "Matte Black",
    sub:     "Bold, flat-panel matte black — dramatic and architectural",
    palette: ["#2C2C2C", "#1A1A1A", "#3A3A3A"],
    costAdj: 2_000,
  },
  {
    id:      "flat-panel",
    label:   "Flat-Panel Minimalist",
    sub:     "Handleless, seamless fronts — clean European aesthetic",
    palette: ["#E8E8E8", "#D0D0D0", "#B0B0B0"],
    costAdj: 1_500,
  },
  {
    id:      "flat-panel-beige",
    label:   "Flat-Panel Beige",
    sub:     "Warm neutral handleless fronts — soft and contemporary",
    palette: ["#D8CEBC", "#C8BCA8", "#B8AC98"],
    costAdj: 1_500,
  },
  {
    id:      "natural-timber",
    label:   "Natural Timber",
    sub:     "Warm grain veneer doors — brings organic texture indoors",
    palette: ["#C4956A", "#A87850", "#8B6040"],
    costAdj: 3_000,
  },
];

export const BENCHTOP_OPTIONS: { id: BenchtopMaterial; label: string; sub: string; palette: string[]; costAdj: number }[] = [
  {
    id:      "engineered-stone",
    label:   "Engineered Stone",
    sub:     "20mm Calacatta-style — durable, stain-resistant, premium look",
    palette: ["#F0EDE8", "#E8E0D8", "#C8C0B8"],
    costAdj: 0,
  },
  {
    id:      "porcelain-slab",
    label:   "Porcelain Slab",
    sub:     "Ultra-thin large-format slab — heatproof and hygienic",
    palette: ["#E8E8E8", "#D8D8D8", "#C8C8C8"],
    costAdj: 1_200,
  },
  {
    id:      "timber",
    label:   "Solid Timber",
    sub:     "Oiled hardwood — warm and unique, needs regular care",
    palette: ["#B8906A", "#9A7050", "#7C5835"],
    costAdj: 2_500,
  },
];

export const MIXER_OPTIONS: { id: MixerFinish; label: string; sub: string }[] = [
  { id: "brushed-brass", label: "Brushed Brass",  sub: "Warm gold — pairs beautifully with timber or white cabinetry" },
  { id: "matte-black",   label: "Matte Black",    sub: "Bold, architectural — works with every cabinet colour"        },
  { id: "chrome",        label: "Chrome",          sub: "Classic, easy-to-clean and universally compatible"           },
];

export const SPLASHBACK_OPTIONS: { id: SplashbackStyle; label: string; sub: string; costAdj: number }[] = [
  { id: "white-subway",   label: "White Subway (Vertical)", sub: "Timeless vertical stack — adds height to any kitchen",       costAdj: 0     },
  { id: "grey-subway",    label: "Grey Subway",              sub: "Cool-toned subway — pairs well with white or black cabinetry", costAdj: 0     },
  { id: "calacatta-slab", label: "Calacatta Stone Slab",    sub: "Full-height stone slab — dramatic, luxurious statement",      costAdj: 2_800 },
  { id: "mirrored",       label: "Mirrored Glass",          sub: "Reflects light and doubles the visual space",                 costAdj: 1_800 },
  { id: "vj-panel",       label: "VJ Paneling",             sub: "Timber-look vertical panels — warm, kitchen-specific coastal", costAdj: 900   },
  { id: "slab-match",     label: "Benchtop Slab Match",     sub: "Seamless stone continuation — the most dramatic look",        costAdj: 2_200 },
];

export const KITCHEN_FLOOR_OPTIONS: { id: KitchenFloorFinish; label: string; sub: string; color: string; costAdj: number }[] = [
  { id: "large-white",       label: "Large Format White",    sub: "600×1200mm white porcelain — bright, clean, timeless",               color: "#F5F0E8", costAdj: 0      },
  { id: "large-grey",        label: "Large Format Grey",     sub: "600×1200mm grey stone-look — contemporary and versatile",            color: "#C0BCBA", costAdj: 0      },
  { id: "large-charcoal",    label: "Large Format Charcoal", sub: "Dark porcelain slab — dramatic, hides everyday dirt and scuffs",     color: "#4A4A4A", costAdj: 500    },
  { id: "timber-oak",        label: "Timber-Look Oak",       sub: "Plank-format oak-look — warmth of timber, durability of porcelain",  color: "#C4956A", costAdj: 800    },
  { id: "polished-concrete", label: "Polished Concrete",     sub: "Grind-and-seal existing slab — industrial-luxe, effortless to clean", color: "#ABABAB", costAdj: 1_200 },
  { id: "terrazzo",          label: "Terrazzo",              sub: "Chip-speckled surface — retro luxe, increasingly popular in kitchens", color: "#D4C8B8", costAdj: 2_500 },
];

// ── Kitchen cost engine (mid-range QLD 2026) ─────────────────────────────────

export interface RoomCostItem {
  label:   string;
  amount:  number;
  detail?: string;
  warning?: boolean;
}

export const KITCHEN_BASE_COST = 22_000; // Demo, install labour, electrical, plumbing base

export function calcKitchenCost(sel: KitchenSelections): { items: RoomCostItem[]; total: number } {
  const cabinetryOpt  = sel.cabinetry   ? CABINETRY_OPTIONS.find((o)     => o.id === sel.cabinetry)   : null;
  const benchtopOpt   = sel.benchtop    ? BENCHTOP_OPTIONS.find((o)      => o.id === sel.benchtop)    : null;
  const splashbackOpt = sel.splashback  ? SPLASHBACK_OPTIONS.find((o)    => o.id === sel.splashback)  : null;
  const mixerOpt      = sel.mixer       ? MIXER_OPTIONS.find((o)         => o.id === sel.mixer)       : null;
  const floorOpt      = sel.floorFinish ? KITCHEN_FLOOR_OPTIONS.find((o) => o.id === sel.floorFinish) : null;

  const items: RoomCostItem[] = [
    { label: "Demo & Installation Labour",
      amount: 8_500, detail: "Full kitchen stripout, wall prep, install, waterproofing" },
    { label: `Cabinetry — ${cabinetryOpt?.label ?? "Not yet selected"}`,
      amount: 8_000 + (cabinetryOpt?.costAdj ?? 0),
      detail: cabinetryOpt ? cabinetryOpt.label + " doors + carcasses, floor-to-ceiling" : "Select a cabinetry style to refine this estimate" },
    { label: `Benchtop — ${benchtopOpt?.label ?? "Not yet selected"}`,
      amount: 3_200 + (benchtopOpt?.costAdj ?? 0),
      detail: benchtopOpt?.label ?? "Select a benchtop material to refine this estimate" },
    { label: `Splashback — ${splashbackOpt?.label ?? "Not yet selected"}`,
      amount: 1_200 + (splashbackOpt?.costAdj ?? 0),
      detail: splashbackOpt?.label ?? "Select a splashback to refine this estimate" },
    { label: `Kitchen Floor — ${floorOpt?.label ?? "Not yet selected"}`,
      amount: 2_800 + (floorOpt?.costAdj ?? 0),
      detail: floorOpt?.sub ?? "Select a floor finish to refine this estimate" },
    { label: `Mixer & Sink — ${mixerOpt?.label ?? "Not yet selected"}`,
      amount: 1_450, detail: mixerOpt ? `${mixerOpt.label} gooseneck, under-mount sink set` : "Select a mixer finish to refine this estimate" },
    { label: sel.cooktop === "induction" ? "Induction Cooktop" : "Gas Cooktop + Lines",
      amount: sel.cooktop === "induction" ? 1_800 : 2_400,
      detail: sel.cooktop === "induction" ? "60cm zone induction + installation" : "900mm gas cooktop + gas line certification" },
    { label: sel.dishwasher === "integrated" ? "Integrated Dishwasher" : "Freestanding Dishwasher",
      amount: sel.dishwasher === "integrated" ? 2_200 : 1_100,
      detail: sel.dishwasher === "integrated" ? "Panel-match integrated, supply + install" : "Freestanding, supply + connection" },
  ];

  const ceilingOpt = CEILING_OPTIONS.find((o) => o.id === sel.ceilingStyle);
  if (ceilingOpt && ceilingOpt.cost > 0) {
    items.push({ label: `Ceiling — ${ceilingOpt.label}`, amount: ceilingOpt.cost, detail: ceilingOpt.sub });
  }

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
    items.push({ label: "Butler's Pantry Integration", amount: 8_000, detail: "Separate prep space with cabinetry, sink, additional storage", warning: false });
  }

  const total = items.reduce((s, i) => s + i.amount, 0);
  return { items, total };
}

// ── Bedroom types ─────────────────────────────────────────────────────────────

export type BedroomRoomSize    = "standard" | "master" | "large" | "custom";
export type BedroomFlooring    = "engineered-oak-herringbone" | "herringbone-stone-grey" | "herringbone-stone-white" | "ash-rustic" | "ash" | "beech" | "hybrid-plank" | "polished-concrete" | "wool-carpet";
export type WallTreatment      =
  | "feature-paint"
  | "limewash-paint"
  | "microcement"
  | "venetian-plaster"
  | "vj-paneling"
  | "shiplap-paneling"
  | "timber-battens"
  | "designer-wallpaper"
  | "botanical-wallpaper"
  | "stone-veneer";
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

export interface BedroomSelections {
  roomSize:          BedroomRoomSize;
  customLength:      number;   // metres — used when roomSize === "custom"
  customWidth:       number;
  flooring:          BedroomFlooring  | null;  // null = deselected
  wallTreatment:     WallTreatment    | null;
  lighting:          BedroomLighting  | null;
  storage:           StorageOption    | null;
  windowTreatment:   WindowTreatment  | null;
  ceilingStyle:      CeilingStyle;
  hasElectricalWork: boolean;  // bedside pendants / re-wiring → advisory
  hasVJWall:         boolean;  // VJ feature wall (structural add)
  hasMediaJoinery:   boolean;  // built-in media/TV joinery
  hasPendantRoughin: boolean;  // bedside sconce/pendant rough-ins
  customNote:        string;
}

// ── Bedroom options ───────────────────────────────────────────────────────────

export const BEDROOM_FLOORING_OPTIONS: { id: BedroomFlooring; label: string; sub: string; palette: string[]; cost: number }[] = [
  {
    id:      "engineered-oak-herringbone",
    label:   "Engineered Oak — Herringbone",
    sub:     "190mm boards in herringbone pattern — warm, architecturally striking",
    palette: ["#C4956A", "#A87850", "#8B6040", "#6E4828"],
    cost:    6_500,
  },
  {
    id:      "herringbone-stone-grey",
    label:   "Herringbone Stone Grey",
    sub:     "Grey stone-look tiles in herringbone — cool, contemporary, durable",
    palette: ["#9AA0A6", "#7C8490", "#606870", "#484E58"],
    cost:    7_200,
  },
  {
    id:      "herringbone-stone-white",
    label:   "Herringbone Stone White",
    sub:     "White marble-look herringbone — bright, airy, luxury hotel feel",
    palette: ["#F0EDE8", "#E4E0D8", "#D8D4CC", "#CCC8C0"],
    cost:    7_200,
  },
  {
    id:      "ash-rustic",
    label:   "Ash Rustic Floorboard",
    sub:     "Wide-board rustic ash timber — characterful grain, warm earthy tones",
    palette: ["#D4BC98", "#BCA07C", "#A4845E", "#8C6840"],
    cost:    5_800,
  },
  {
    id:      "ash",
    label:   "Ash Timber",
    sub:     "Clean ash boards — light, Scandinavian-inspired, pairs with any palette",
    palette: ["#E0CCAA", "#CCBC94", "#B8A87E", "#A49468"],
    cost:    5_200,
  },
  {
    id:      "beech",
    label:   "Beech Timber",
    sub:     "Smooth blonde beech — bright and consistent grain for a fresh look",
    palette: ["#D4B88A", "#C0A070", "#AC8858", "#987040"],
    cost:    4_800,
  },
  {
    id:      "hybrid-plank",
    label:   "Hybrid Plank",
    sub:     "100% waterproof click-lock — great value, durable, beige/warm tones",
    palette: ["#D4B898", "#B89878", "#9C7C58", "#806040"],
    cost:    3_800,
  },
  {
    id:      "polished-concrete",
    label:   "Polished Concrete",
    sub:     "Grind-and-seal existing slab — industrial-luxe, effortless to clean",
    palette: ["#C0C0BC", "#B0B0AC", "#A0A09C", "#90908C"],
    cost:    4_500,
  },
  {
    id:      "wool-carpet",
    label:   "Wool Carpet",
    sub:     "Plush 100% NZ wool loop pile — soft underfoot, excellent acoustics",
    palette: ["#E8E0D8", "#D8D0C8", "#C8C0B8", "#B8B0A8"],
    cost:    4_200,
  },
];

export const WALL_TREATMENT_OPTIONS: { id: WallTreatment; label: string; sub: string; cost: number }[] = [
  {
    id:    "feature-paint",
    label: "Feature Wall Paint",
    sub:   "Bold statement colour on one or all walls — most budget-friendly impact",
    cost:  850,
  },
  {
    id:    "limewash-paint",
    label: "Limewash Paint",
    sub:   "Textured matte wash — organic, aged patina; popular in coastal & Mediterranean styles",
    cost:  1_400,
  },
  {
    id:    "microcement",
    label: "Microcement / Concrete Finish",
    sub:   "Seamless poured look — contemporary, industrial-luxe, no grout lines",
    cost:  4_200,
  },
  {
    id:    "venetian-plaster",
    label: "Venetian Plaster",
    sub:   "Artisanal Italian plaster — luminous marble-like depth, applied in multiple layers",
    cost:  5_500,
  },
  {
    id:    "vj-paneling",
    label: "VJ Paneling (Vertical Joint)",
    sub:   "Tongue-and-groove vertical boards — coastal, hamptons or contemporary",
    cost:  3_500,
  },
  {
    id:    "shiplap-paneling",
    label: "Shiplap / Horizontal Boards",
    sub:   "Overlapping horizontal timber panels — rustic, Hamptons, or industrial depending on finish",
    cost:  3_200,
  },
  {
    id:    "timber-battens",
    label: "Timber Batten Feature Wall",
    sub:   "Vertical raw timber battens on a dark backing — warm, architectural, three-dimensional",
    cost:  2_800,
  },
  {
    id:    "designer-wallpaper",
    label: "Designer Wallpaper — Textured",
    sub:   "Woven, grasscloth or embossed wallpaper — subtle texture for a refined, tactile finish",
    cost:  2_200,
  },
  {
    id:    "botanical-wallpaper",
    label: "Botanical / Mural Wallpaper",
    sub:   "Large-format printed mural or botanical print — bold, artistic focal point",
    cost:  2_800,
  },
  {
    id:    "stone-veneer",
    label: "Stone Feature Wall",
    sub:   "Thin-set travertine, slate or marble tile feature — luxury hotel aesthetic",
    cost:  6_500,
  },
];

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

// ── Bedroom cost engine ────────────────────────────────────────────────────────

export const BEDROOM_BASE_COST = 3_500; // Prep, painting, access, skip bin

export function calcBedroomCost(sel: BedroomSelections): { items: RoomCostItem[]; total: number } {
  const flooringOpt = sel.flooring       ? BEDROOM_FLOORING_OPTIONS.find((o)  => o.id === sel.flooring)       : null;
  const wallOpt     = sel.wallTreatment  ? WALL_TREATMENT_OPTIONS.find((o)    => o.id === sel.wallTreatment)  : null;
  const lightOpt    = sel.lighting       ? BEDROOM_LIGHTING_OPTIONS.find((o)  => o.id === sel.lighting)       : null;
  const storageOpt  = sel.storage        ? STORAGE_OPTIONS.find((o)           => o.id === sel.storage)        : null;
  const windowOpt   = sel.windowTreatment ? WINDOW_TREATMENT_OPTIONS.find((o) => o.id === sel.windowTreatment) : null;

  // Resolve floor area for cost and labels
  const sizeOpt  = BEDROOM_SIZE_OPTIONS.find((o) => o.id === sel.roomSize);
  const sqm = sel.roomSize === "custom" && sel.customLength > 0 && sel.customWidth > 0
    ? sel.customLength * sel.customWidth
    : (sizeOpt?.baseSqm ?? 16);
  const sqmLabel = `approx ${sqm.toFixed(0)}m²`;

  // Scale flooring cost by area (base cost is per 16m²)
  const flooringCost = flooringOpt ? Math.round((flooringOpt.cost * sqm) / 16 / 100) * 100 : 0;

  const items: RoomCostItem[] = [
    { label: "Preparation & Plastering",
      amount: BEDROOM_BASE_COST, detail: "Wall prep, skirting removal, painting base coats" },
    { label: `Flooring — ${flooringOpt?.label ?? "Not yet selected"}`,
      amount: flooringCost,
      detail: flooringOpt ? `Supply + lay, ${sqmLabel}` : "Select a flooring option to include in your estimate" },
    { label: `Wall — ${wallOpt?.label ?? "Not yet selected"}`,
      amount: wallOpt?.cost ?? 0,
      detail: wallOpt?.sub ?? "Select a wall treatment to include in your estimate" },
    { label: `Lighting — ${lightOpt?.label ?? "Not yet selected"}`,
      amount: lightOpt?.cost ?? 0,
      detail: lightOpt?.sub ?? "Select a lighting option to include in your estimate" },
    { label: `Storage — ${storageOpt?.label ?? "Not yet selected"}`,
      amount: storageOpt?.cost ?? 0,
      detail: storageOpt?.sub ?? "Select a storage option to include in your estimate" },
    { label: `Window — ${windowOpt?.label ?? "Not yet selected"}`,
      amount: windowOpt?.cost ?? 0,
      detail: windowOpt?.sub ?? "Select a window treatment to include in your estimate" },
  ];

  const ceilingOpt = CEILING_OPTIONS.find((o) => o.id === sel.ceilingStyle);
  if (ceilingOpt && ceilingOpt.cost > 0) {
    items.push({ label: `Ceiling — ${ceilingOpt.label}`, amount: ceilingOpt.cost, detail: ceilingOpt.sub });
  }

  if (sel.hasVJWall) {
    items.push({ label: "VJ Feature Wall Installation", amount: 2_800, detail: "Floor-to-ceiling tongue-and-groove boards, painted", warning: false });
  }
  if (sel.hasMediaJoinery) {
    items.push({ label: "Built-in Media Joinery",        amount: 4_500, detail: "Custom TV unit + integrated shelving/storage", warning: false });
  }
  if (sel.hasPendantRoughin || sel.hasElectricalWork) {
    items.push({ label: "Electrical Re-wiring & Fit-off", amount: 2_200, detail: "New circuits for pendant/sconce/cove lighting, safety switch upgrades", warning: true });
  }

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
  const cabinet  = sel.cabinetry  ? (CABINETRY_OPTIONS.find((o)      => o.id === sel.cabinetry)?.label   ?? sel.cabinetry)  : null;
  const benchtop = sel.benchtop   ? (BENCHTOP_OPTIONS.find((o)       => o.id === sel.benchtop)?.label    ?? sel.benchtop)   : null;
  const mixer    = sel.mixer      ? (MIXER_OPTIONS.find((o)          => o.id === sel.mixer)?.label       ?? sel.mixer)      : null;
  const splash   = sel.splashback ? (SPLASHBACK_OPTIONS.find((o)     => o.id === sel.splashback)?.label  ?? sel.splashback) : null;
  const floor    = sel.floorFinish ? (KITCHEN_FLOOR_OPTIONS.find((o) => o.id === sel.floorFinish)?.label ?? sel.floorFinish): null;
  const floorColorNote = sel.floorColor ? ` in the exact colour ${sel.floorColor}` : "";
  const wallColorNote  = sel.wallColor  ? `Kitchen walls: Paint all visible walls in the exact colour ${sel.wallColor}.` : null;
  const cooktop  = sel.cooktop === "induction" ? "induction cooktop" : "gas cooktop";
  const dw       = sel.dishwasher === "integrated" ? "integrated panel-match dishwasher" : "freestanding dishwasher";
  const ceiling  = CEILING_OPTIONS.find((o) => o.id === sel.ceilingStyle)?.label ?? "standard white ceiling";

  // ── No-photo mode: generate from scratch ─────────────────────────────────
  if (!hasPhoto) {
    const sizeDesc = sel.roomSize === "galley" ? "a compact galley kitchen"
      : sel.roomSize === "large" ? "a large open-plan kitchen"
      : sel.roomSize === "custom" && sel.customLength > 0 && sel.customWidth > 0
        ? `a kitchen approximately ${sel.customLength}m × ${sel.customWidth}m`
      : "a standard residential kitchen";

    const lines = [
      "You are a professional interior design visualizer. Generate a photorealistic kitchen render from scratch.",
      `Compose ${sizeDesc} from a slightly elevated angle showing cabinetry, benchtop, splashback and appliances.`,
      "Remove all clutter. Produce a high-end architectural photography result at 2K resolution.",
      "",
      cabinet  ? `Cabinetry: ${cabinet} style cabinet doors, floor-to-ceiling where possible.` : "Cabinetry: choose a style that suits the space — designer's choice.",
      benchtop ? `Benchtop: ${benchtop} — 20mm thick, waterfall edge on island if present.`   : "Benchtop: select a premium material appropriate to the style.",
      mixer    ? `Sink & Mixer: Under-mount sink with ${mixer} gooseneck mixer.`                    : "Sink & Mixer: under-mount sink with a quality gooseneck mixer.",
      splash   ? `Splashback: ${splash}.`                                                            : "Splashback: select a material that complements the cabinetry.",
      floor    ? `Kitchen Floor: ${floor}${floorColorNote}.`                                         : "Kitchen Floor: large format neutral porcelain or timber-look planks.",
      wallColorNote ?? "Kitchen Walls: clean white or warm neutral paint.",
      `Appliances: ${cooktop}, ${dw}. Include a counter-depth integrated refrigerator.`,
      `Ceiling: ${ceiling}.`,
      "Style: warm Australian natural light, realistic textures, high-fidelity 2K render.",
    ];

    if (sel.hasIsland)       lines.push("\nIsland bench: Include a freestanding kitchen island with matching benchtop and waterfall edges.");
    if (sel.hasWallChange)   lines.push("Open-plan connection: Show an open-plan kitchen-living space.");
    if (sel.hasButlersPantry) lines.push("Include a butler's pantry scullery adjacent to the main kitchen with matching cabinetry.");
    if (sel.customNote?.trim()) lines.push(`\nAdditional request: "${sel.customNote.trim()}"`);

    return lines.join("\n");
  }

  // ── Photo mode: surface retexturing only ─────────────────────────────────
  const spatialLock = photoSpatialLock("kitchen", kitchenDimNote(sel));

  const materials = [
    "",
    "─── MATERIAL CHANGES TO APPLY (within the existing spatial layout) ───",
    cabinet  ? `Cabinetry: Replace all cabinet door faces with ${cabinet} style doors.`                : "Cabinetry: retain existing layout — apply a designer finish of your choice.",
    benchtop ? `Benchtop: Re-texture existing benchtop surfaces to ${benchtop}, 20mm thick.`          : "Benchtop: apply a premium material that complements the cabinetry.",
    mixer    ? `Sink & Mixer: Replace visible mixer tap with a ${mixer} gooseneck model.`              : "Sink & Mixer: replace with a quality gooseneck mixer.",
    splash   ? `Splashback: Re-surface the splashback with ${splash}.`                                 : "Splashback: choose a finish that suits the cabinetry.",
    floor    ? `Kitchen Floor: Re-texture the floor with ${floor}${floorColorNote}.`                   : "Kitchen Floor: retain the existing floor or choose a clean, neutral finish.",
    wallColorNote ?? "Kitchen Walls: Retain existing wall colour unless specified.",
    `Appliances: ${cooktop}, ${dw}. Fit into the existing appliance spaces — do not add new ones outside the existing footprint.`,
    `Ceiling: ${ceiling}.`,
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

  const noteSection = sel.customNote?.trim()
    ? `\n\nAdditional client request: "${sel.customNote.trim()}"`
    : "";

  return spatialLock + materials + islandNote + structuralSection + noteSection + SPATIAL_REMINDER;
}

export function buildBedroomPrompt(sel: BedroomSelections, hasPhoto: boolean): string {
  const flooring = sel.flooring        ? (BEDROOM_FLOORING_OPTIONS.find((o)  => o.id === sel.flooring)?.label        ?? sel.flooring)        : null;
  const wall     = sel.wallTreatment   ? (WALL_TREATMENT_OPTIONS.find((o)    => o.id === sel.wallTreatment)?.label   ?? sel.wallTreatment)   : null;
  const light    = sel.lighting        ? (BEDROOM_LIGHTING_OPTIONS.find((o)  => o.id === sel.lighting)?.label        ?? sel.lighting)        : null;
  const storage  = sel.storage         ? (STORAGE_OPTIONS.find((o)           => o.id === sel.storage)?.label         ?? sel.storage)         : null;
  const window_  = sel.windowTreatment ? (WINDOW_TREATMENT_OPTIONS.find((o)  => o.id === sel.windowTreatment)?.label ?? sel.windowTreatment) : null;
  const ceiling  = CEILING_OPTIONS.find((o) => o.id === sel.ceilingStyle)?.label ?? "standard white ceiling";

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
      "You are a professional interior design visualizer. Generate a photorealistic bedroom render from scratch.",
      `Compose ${sizeDesc} showing the bedhead feature wall, flooring, storage and window treatments at 2K resolution.`,
      "Remove all clutter and personal items. Produce a high-end editorial photography result.",
      "",
      flooring ? `Flooring: ${flooring} — lay full room width.`                             : "Flooring: choose a premium flooring appropriate to the style.",
      wall     ? `Wall treatment: ${wall} — apply to feature wall behind bedhead.`          : "Wall treatment: designer's choice appropriate to the room palette.",
      `Lighting: ${lightDesc}.`,
      storage  ? `Storage: ${storage} — full-height, floor-to-ceiling.`                    : "Storage: appropriate built-in wardrobe solution for the space.",
      window_  ? `Window treatment: ${window_} — floor-length, ceiling-mounted track.`     : "Window treatment: quality window covering appropriate to the style.",
      `Ceiling: ${ceiling}.`,
      "Style: warm natural Australian light, editorial photography, high-fidelity 2K render.",
    ];

    if (sel.hasVJWall)       lines.push("Add a floor-to-ceiling VJ paneled feature wall behind the bedhead.");
    if (sel.hasMediaJoinery) lines.push("Include a custom built-in media unit with TV recess, flanking shelves and integrated storage.");
    if (sel.hasPendantRoughin) lines.push("Show bedside wall-hung pendant sconces on each side of the bedhead.");
    if (sel.customNote?.trim()) lines.push(`\nAdditional request: "${sel.customNote.trim()}"`);

    return lines.join("\n");
  }

  // ── Photo mode: surface retexturing only ─────────────────────────────────
  const spatialLock = photoSpatialLock("bedroom", bedroomDimNote(sel));

  const materials = [
    "",
    "─── MATERIAL CHANGES TO APPLY (within the existing spatial layout) ───",
    flooring ? `Flooring: Replace the existing floor surface with ${flooring} — cover the full visible floor area.`  : "Flooring: apply a premium flooring material appropriate to the style.",
    wall     ? `Wall treatment: Apply ${wall} to the feature wall behind where the bedhead would be.`               : "Wall treatment: designer's choice appropriate to the room palette.",
    `Lighting: ${lightDesc} — fit within the existing ceiling structure.`,
    storage  ? `Storage: Replace or re-face existing wardrobe/storage with ${storage}.`                             : "Storage: retain existing storage and apply a quality finish.",
    window_  ? `Window treatment: Replace window coverings with ${window_} — floor-length, ceiling-mounted track.`  : "Window treatment: apply quality window covering appropriate to the style.",
    `Ceiling: ${ceiling}.`,
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

  const noteSection = sel.customNote?.trim()
    ? `\n\nAdditional client request: "${sel.customNote.trim()}"`
    : "";

  return spatialLock + materials + structuralSection + noteSection + SPATIAL_REMINDER;
}
