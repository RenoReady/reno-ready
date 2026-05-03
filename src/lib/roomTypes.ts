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

export type CabinetryStyle   = "shaker" | "shaker-sage" | "matte-black" | "flat-panel" | "flat-panel-beige" | "natural-timber";
export type BenchtopMaterial = "engineered-stone" | "porcelain-slab" | "timber";
export type MixerFinish      = "brushed-brass" | "matte-black" | "chrome";
export type SplashbackStyle  = "white-subway" | "grey-subway" | "calacatta-slab" | "mirrored" | "vj-panel" | "slab-match";
export type CooktopType      = "induction" | "gas";
export type DishwasherType   = "integrated" | "freestanding";

export interface KitchenSelections {
  cabinetry:            CabinetryStyle;
  benchtop:             BenchtopMaterial;
  mixer:                MixerFinish;
  splashback:           SplashbackStyle;
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

// ── Kitchen cost engine (mid-range QLD 2026) ─────────────────────────────────

export interface RoomCostItem {
  label:   string;
  amount:  number;
  detail?: string;
  warning?: boolean;
}

export const KITCHEN_BASE_COST = 22_000; // Demo, install labour, electrical, plumbing base

export function calcKitchenCost(sel: KitchenSelections): { items: RoomCostItem[]; total: number } {
  const items: RoomCostItem[] = [
    { label: "Demo & Installation Labour",   amount: 8_500,  detail: "Full kitchen stripout, wall prep, install, waterproofing" },
    { label: "Cabinetry Supply & Install",   amount: 8_000 + (CABINETRY_OPTIONS.find((o) => o.id === sel.cabinetry)?.costAdj ?? 0),
      detail: CABINETRY_OPTIONS.find((o) => o.id === sel.cabinetry)?.label + " doors + carcasses, floor-to-ceiling" },
    { label: "Benchtop Supply & Fabricate",  amount: 3_200 + (BENCHTOP_OPTIONS.find((o) => o.id === sel.benchtop)?.costAdj ?? 0),
      detail: BENCHTOP_OPTIONS.find((o) => o.id === sel.benchtop)?.label },
    { label: "Splashback Supply & Install",  amount: 1_200 + (SPLASHBACK_OPTIONS.find((o) => o.id === sel.splashback)?.costAdj ?? 0),
      detail: SPLASHBACK_OPTIONS.find((o) => o.id === sel.splashback)?.label },
    { label: "Gooseneck Mixer & Sink",       amount: 1_450, detail: `${MIXER_OPTIONS.find((o) => o.id === sel.mixer)?.label ?? ""} under-mount sink set` },
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

export type BedroomFlooring    = "engineered-oak-herringbone" | "herringbone-stone-grey" | "herringbone-stone-white" | "ash-rustic" | "ash" | "beech" | "hybrid-plank" | "polished-concrete" | "wool-carpet";
export type WallTreatment      = "vj-paneling" | "feature-paint" | "designer-wallpaper";
export type BedroomLighting    = "led-cove" | "architectural-downlights" | "statement-pendant";
export type StorageOption      = "built-in-mirror-sliders" | "custom-wir";
export type WindowTreatment    = "floor-ceiling-sheers" | "blockout-roller";

export interface BedroomSelections {
  flooring:          BedroomFlooring;
  wallTreatment:     WallTreatment;
  lighting:          BedroomLighting;
  storage:           StorageOption;
  windowTreatment:   WindowTreatment;
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
    id:    "vj-paneling",
    label: "VJ Paneling (Vertical Joint)",
    sub:   "Tongue-and-groove vertical boards — coastal, hamptons or contemporary",
    cost:  3_500,
  },
  {
    id:    "feature-paint",
    label: "Feature Wall Paint",
    sub:   "Bold statement colour — most budget-friendly impact",
    cost:  850,
  },
  {
    id:    "designer-wallpaper",
    label: "Designer Wallpaper",
    sub:   "Textured or printed wallpaper — adds personality and depth",
    cost:  2_200,
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
  const flooringOpt = BEDROOM_FLOORING_OPTIONS.find((o) => o.id === sel.flooring);
  const wallOpt     = WALL_TREATMENT_OPTIONS.find((o)   => o.id === sel.wallTreatment);
  const lightOpt    = BEDROOM_LIGHTING_OPTIONS.find((o) => o.id === sel.lighting);
  const storageOpt  = STORAGE_OPTIONS.find((o)          => o.id === sel.storage);
  const windowOpt   = WINDOW_TREATMENT_OPTIONS.find((o) => o.id === sel.windowTreatment);

  const items: RoomCostItem[] = [
    { label: "Preparation & Plastering",              amount: BEDROOM_BASE_COST,       detail: "Wall prep, skirting removal, painting base coats" },
    { label: `Flooring — ${flooringOpt?.label ?? ""}`, amount: flooringOpt?.cost ?? 0, detail: "Supply + lay, approx 4m × 4m room (16m²)" },
    { label: `Wall — ${wallOpt?.label ?? ""}`,         amount: wallOpt?.cost ?? 0,     detail: wallOpt?.sub },
    { label: `Lighting — ${lightOpt?.label ?? ""}`,    amount: lightOpt?.cost ?? 0,    detail: lightOpt?.sub },
    { label: `Storage — ${storageOpt?.label ?? ""}`,   amount: storageOpt?.cost ?? 0,  detail: storageOpt?.sub },
    { label: `Window — ${windowOpt?.label ?? ""}`,     amount: windowOpt?.cost ?? 0,   detail: windowOpt?.sub },
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

export function buildKitchenPrompt(sel: KitchenSelections, hasPhoto: boolean): string {
  const cabinet  = CABINETRY_OPTIONS.find((o)  => o.id === sel.cabinetry)?.label  ?? sel.cabinetry;
  const benchtop = BENCHTOP_OPTIONS.find((o)   => o.id === sel.benchtop)?.label   ?? sel.benchtop;
  const mixer    = MIXER_OPTIONS.find((o)       => o.id === sel.mixer)?.label      ?? sel.mixer;
  const splash   = SPLASHBACK_OPTIONS.find((o) => o.id === sel.splashback)?.label ?? sel.splashback;
  const cooktop  = sel.cooktop === "induction" ? "induction cooktop" : "gas cooktop";
  const dw       = sel.dishwasher === "integrated" ? "integrated panel-match dishwasher" : "freestanding dishwasher";
  const ceiling  = CEILING_OPTIONS.find((o) => o.id === sel.ceilingStyle)?.label ?? "standard white ceiling";

  const base = [
    "You are a professional interior design visualizer. Receive a kitchen photo and material selections.",
    "Modify the photo to show the new kitchen design while maintaining the structural layout unless requested.",
    "Remove all personal items from benchtops. Produce a high-end architectural photography result.",
    "",
    `Cabinetry: ${cabinet} style cabinet doors, floor-to-ceiling where possible.`,
    `Benchtop: ${benchtop} — 20mm thick, waterfall edge on island if present.`,
    `Sink & Mixer: Under-mount sink with ${mixer} gooseneck mixer.`,
    `Splashback: ${splash}.`,
    `Appliances: ${cooktop}, ${dw}.`,
    `Ceiling: ${ceiling}.`,
    // Phase 4 implied logic — always render fridge + dishwasher so the kitchen looks complete
    "IMPORTANT: Always render a realistic integrated counter-depth refrigerator and a built-in dishwasher on a functional kitchen wall — these are essential for a complete kitchen render.",
    "Style: warm Australian natural light, realistic textures, high-fidelity 2K render.",
  ].join("\n");

  const islandNote = sel.hasIsland
    ? "\nIsland bench: Include a freestanding kitchen island with matching benchtop and waterfall edges."
    : "";

  const structuralNotes: string[] = [];
  if (sel.hasWallChange)    structuralNotes.push("Open-plan wall has been removed — show an open-plan kitchen-living connection.");
  if (sel.hasButlersPantry) structuralNotes.push("Show a butler's pantry scullery adjacent to the main kitchen with matching cabinetry.");
  const structuralSection = structuralNotes.length > 0
    ? "\n\nStructural changes: " + structuralNotes.join(" ")
    : "";

  const noteSection = sel.customNote?.trim()
    ? `\n\nAdditional request: "${sel.customNote.trim()}"`
    : "";

  const noPhoto = !hasPhoto
    ? [
        "",
        "No room photo provided. Generate a complete photorealistic kitchen from scratch.",
        "Compose from a slightly elevated angle showing cabinetry, benchtop, splashback and appliances. 2K resolution.",
      ].join("\n")
    : "";

  return base + islandNote + structuralSection + noteSection + noPhoto;
}

export function buildBedroomPrompt(sel: BedroomSelections, hasPhoto: boolean): string {
  const flooring = BEDROOM_FLOORING_OPTIONS.find((o) => o.id === sel.flooring)?.label ?? sel.flooring;
  const wall     = WALL_TREATMENT_OPTIONS.find((o)   => o.id === sel.wallTreatment)?.label ?? sel.wallTreatment;
  const light    = BEDROOM_LIGHTING_OPTIONS.find((o) => o.id === sel.lighting)?.label ?? sel.lighting;
  const storage  = STORAGE_OPTIONS.find((o)          => o.id === sel.storage)?.label ?? sel.storage;
  const window_  = WINDOW_TREATMENT_OPTIONS.find((o) => o.id === sel.windowTreatment)?.label ?? sel.windowTreatment;
  const ceiling  = CEILING_OPTIONS.find((o)          => o.id === sel.ceilingStyle)?.label ?? "standard white ceiling";

  const lightDesc =
    sel.lighting === "led-cove"
      ? "Concealed LED strip cove lighting in ceiling recesses casting a warm ambient glow"
      : sel.lighting === "architectural-downlights"
      ? "Recessed architectural dimmable downlights throughout"
      : "Designer statement pendant lights flanking the bedhead";

  const base = [
    "You are a professional interior design visualizer for a luxury bedroom renovation.",
    "Modify the bedroom photo to reflect the selected materials. Maintain structural layout.",
    "Remove all personal items. Produce a high-end architectural photography result.",
    "",
    `Flooring: ${flooring} — lay full room width.`,
    `Wall treatment: ${wall} — apply to feature wall behind bedhead.`,
    `Lighting: ${lightDesc}.`,
    `Storage: ${storage} — full-height, floor-to-ceiling.`,
    `Window treatment: ${window_} — floor-length, ceiling-mounted track.`,
    `Ceiling: ${ceiling}.`,
    "Style: warm natural Australian light, editorial photography, high-fidelity 2K render.",
  ].join("\n");

  const structuralNotes: string[] = [];
  if (sel.hasVJWall)       structuralNotes.push("Add a floor-to-ceiling VJ paneled feature wall behind the bedhead.");
  if (sel.hasMediaJoinery) structuralNotes.push("Include a custom built-in media unit with TV recess, flanking shelves and integrated storage.");
  if (sel.hasPendantRoughin) structuralNotes.push("Show bedside wall-hung pendant sconces on each side of the bedhead.");
  const structuralSection = structuralNotes.length > 0
    ? "\n\nStructural/feature additions: " + structuralNotes.join(" ")
    : "";

  const noteSection = sel.customNote?.trim()
    ? `\n\nAdditional request: "${sel.customNote.trim()}"`
    : "";

  const noPhoto = !hasPhoto
    ? [
        "",
        "No room photo provided. Generate a complete photorealistic master bedroom from scratch.",
        "Compose showing the bedhead feature wall, flooring, storage and window treatments. 2K resolution.",
      ].join("\n")
    : "";

  return base + structuralSection + noteSection + noPhoto;
}
