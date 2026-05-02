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

// ── Kitchen types ─────────────────────────────────────────────────────────────

export type CabinetryStyle   = "shaker" | "flat-panel" | "natural-timber";
export type BenchtopMaterial = "engineered-stone" | "porcelain-slab" | "timber";
export type MixerFinish      = "brushed-brass" | "matte-black" | "chrome";
export type SplashbackStyle  = "mirrored" | "subway-vertical" | "slab-match";
export type CooktopType      = "induction" | "gas";
export type DishwasherType   = "integrated" | "freestanding";

export interface KitchenSelections {
  cabinetry:   CabinetryStyle;
  benchtop:    BenchtopMaterial;
  mixer:       MixerFinish;
  splashback:  SplashbackStyle;
  cooktop:     CooktopType;
  dishwasher:  DishwasherType;
  hasIsland:   boolean;  // triggers gas/plumbing advisory
  customNote:  string;
}

// ── Kitchen options ───────────────────────────────────────────────────────────

export const CABINETRY_OPTIONS: { id: CabinetryStyle; label: string; sub: string; palette: string[]; costAdj: number }[] = [
  {
    id:      "shaker",
    label:   "Shaker",
    sub:     "Classic recessed-panel doors — timeless and versatile",
    palette: ["#F5F0E8", "#E8E0D5", "#C8C0B8"],
    costAdj: 0,
  },
  {
    id:      "flat-panel",
    label:   "Flat-Panel (Minimalist)",
    sub:     "Handleless, seamless fronts — clean European aesthetic",
    palette: ["#E8E8E8", "#D0D0D0", "#B0B0B0"],
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
  { id: "mirrored",        label: "Mirrored Glass",         sub: "Reflects light and doubles the visual space",          costAdj: 1_800 },
  { id: "subway-vertical", label: "Subway Tile (Vertical)", sub: "Timeless vertical stack — adds height to any kitchen",  costAdj: 0     },
  { id: "slab-match",      label: "Benchtop Slab Match",    sub: "Seamless stone continuation — the most dramatic look",  costAdj: 2_200 },
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

  if (sel.hasIsland) {
    items.push({
      label:   "Island Bench — Plumbing / Gas Relocation",
      amount:  2_500,
      detail:  "Repositioning drain or gas point to island location",
      warning: true,
    });
  }

  const total = items.reduce((s, i) => s + i.amount, 0);
  return { items, total };
}

// ── Bedroom types ─────────────────────────────────────────────────────────────

export type BedroomFlooring    = "engineered-oak-herringbone" | "hybrid-plank" | "wool-carpet";
export type WallTreatment      = "vj-paneling" | "feature-paint" | "designer-wallpaper";
export type BedroomLighting    = "led-cove" | "architectural-downlights" | "statement-pendant";
export type StorageOption      = "built-in-mirror-sliders" | "custom-wir";
export type WindowTreatment    = "floor-ceiling-sheers" | "blockout-roller";

export interface BedroomSelections {
  flooring:        BedroomFlooring;
  wallTreatment:   WallTreatment;
  lighting:        BedroomLighting;
  storage:         StorageOption;
  windowTreatment: WindowTreatment;
  hasElectricalWork: boolean;  // bedside pendants / re-wiring → advisory
  customNote:      string;
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
    id:      "hybrid-plank",
    label:   "Hybrid Plank",
    sub:     "100% waterproof, click-lock — durable and great value",
    palette: ["#D4B898", "#B89878", "#9C7C58", "#806040"],
    cost:    3_800,
  },
  {
    id:      "wool-carpet",
    label:   "Wool Carpet",
    sub:     "Plush 100% NZ wool loop pile — soft underfoot, excellent acoustics",
    palette: ["#E8E0D8", "#D8D0C8", "#C8C0B8", "#B8B0A8"],
    cost:    4_200,
  },
];

export const WALL_TREATMENT_OPTIONS: { id: WallTreatment; label: string; sub: string; cost: number; hasElectricalAdvisory?: boolean }[] = [
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
    id:              "led-cove",
    label:           "LED Strip Cove Lighting",
    sub:             "Concealed LED strip in ceiling recess — ambient, architectural glow",
    cost:            2_400,
    triggerElectrical: true,
  },
  {
    id:    "architectural-downlights",
    label: "Architectural Downlights",
    sub:   "Recessed dimmable LEDs — clean, versatile, high CRI for makeup/reading",
    cost:  1_600,
  },
  {
    id:              "statement-pendant",
    label:           "Statement Pendant",
    sub:             "Designer pendant over bedside tables — sculptural and atmospheric",
    cost:            1_800,
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
  const flooringOpt = BEDROOM_FLOORING_OPTIONS.find((o)  => o.id === sel.flooring);
  const wallOpt     = WALL_TREATMENT_OPTIONS.find((o)    => o.id === sel.wallTreatment);
  const lightOpt    = BEDROOM_LIGHTING_OPTIONS.find((o)  => o.id === sel.lighting);
  const storageOpt  = STORAGE_OPTIONS.find((o)           => o.id === sel.storage);
  const windowOpt   = WINDOW_TREATMENT_OPTIONS.find((o)  => o.id === sel.windowTreatment);

  const items: RoomCostItem[] = [
    { label: "Preparation & Plastering",   amount: BEDROOM_BASE_COST, detail: "Wall prep, skirting removal, painting base coats" },
    { label: `Flooring — ${flooringOpt?.label ?? ""}`, amount: flooringOpt?.cost ?? 0, detail: "Supply + lay, approx 4m × 4m room (16m²)" },
    { label: `Wall Treatment — ${wallOpt?.label ?? ""}`, amount: wallOpt?.cost ?? 0, detail: wallOpt?.sub },
    { label: `Lighting — ${lightOpt?.label ?? ""}`, amount: lightOpt?.cost ?? 0, detail: lightOpt?.sub },
    { label: `Storage — ${storageOpt?.label ?? ""}`, amount: storageOpt?.cost ?? 0, detail: storageOpt?.sub },
    { label: `Window — ${windowOpt?.label ?? ""}`, amount: windowOpt?.cost ?? 0, detail: windowOpt?.sub },
  ];

  // Electrical advisory trigger — bedside pendants or cove lighting need re-wiring
  if (sel.hasElectricalWork) {
    items.push({
      label:   "Electrical Re-wiring & Fit-off",
      amount:  2_200,
      detail:  "New circuits for pendant or cove lighting, safety switch upgrades",
      warning: true,
    });
  }

  const total = items.reduce((s, i) => s + i.amount, 0);
  return { items, total };
}

// ── Saved Room (multi-room project) ──────────────────────────────────────────

export interface SavedRoom {
  id:                string;      // uuid
  roomType:          RoomType;
  roomLabel:         string;      // e.g. "Kitchen", "Main Bathroom"
  roomPhotoUrl:      string | null;
  generatedImageUrl: string | null;
  estimatedCost:     number;
  // Serialised selections for PDF and re-display
  kitchenSelections?: KitchenSelections;
  bedroomSelections?: BedroomSelections;
  // Brief snapshot for the bathroom
  projectBrief?:     import("./projectBrief").ProjectBrief | null;
}

// ── Hidden cost advisories ─────────────────────────────────────────────────────

export const HIDDEN_COST_ADVISORIES: Record<RoomType, { condition: string; message: string; cost: string } | null> = {
  bathroom: null, // bathroom has its own asbestos/plumbing advisory via projectBrief
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
    "Style: warm Australian natural light, realistic textures, high-fidelity 2K render.",
  ].join("\n");

  const islandNote = sel.hasIsland
    ? "\nIsland bench: Include a freestanding kitchen island with matching benchtop and waterfall edges."
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

  return base + islandNote + noteSection + noPhoto;
}

export function buildBedroomPrompt(sel: BedroomSelections, hasPhoto: boolean): string {
  const flooring = BEDROOM_FLOORING_OPTIONS.find((o) => o.id === sel.flooring)?.label ?? sel.flooring;
  const wall     = WALL_TREATMENT_OPTIONS.find((o)   => o.id === sel.wallTreatment)?.label ?? sel.wallTreatment;
  const light    = BEDROOM_LIGHTING_OPTIONS.find((o) => o.id === sel.lighting)?.label ?? sel.lighting;
  const storage  = STORAGE_OPTIONS.find((o)          => o.id === sel.storage)?.label ?? sel.storage;
  const window_  = WINDOW_TREATMENT_OPTIONS.find((o) => o.id === sel.windowTreatment)?.label ?? sel.windowTreatment;

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
    "Style: warm natural Australian light, editorial photography, high-fidelity 2K render.",
  ].join("\n");

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

  return base + noteSection + noPhoto;
}
