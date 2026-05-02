/**
 * Shared prompt builder used by:
 *   - /api/generate (sends to Gemini)
 *   - /connect      (displays the raw prompt to the user for transparency)
 *
 * Keep this purely deterministic — no side effects, no env access.
 */

import {
  BuilderSelections,
  TileOption,
  TileStyle,
  VanityType,
  TapwareFinish,
  LightingOption,
  LIGHTING_OPTIONS,
} from "./types";
import {
  type ProjectBrief,
  SCOPE_PROMPT_SUFFIX,
  PLUMBING_LAYOUT_PROMPT_SUFFIX,
} from "./projectBrief";
import {
  type RoomType,
  type KitchenSelections,
  type BedroomSelections,
  buildKitchenPrompt,
  buildBedroomPrompt,
} from "./roomTypes";

interface PromptInput {
  imageBase64?: string | null;       // present if user uploaded a photo
  projectBrief?: ProjectBrief | null;
  roomType?: RoomType;               // defaults to "bathroom"
  kitchenSelections?: KitchenSelections | null;
  bedroomSelections?: BedroomSelections | null;
  selections: {
    floorTile?:         { id: string; name: string } | TileOption | null;
    wallTile?:          { id: string; name: string } | TileOption | null;
    vanity:             VanityType   | string;
    tapware:            TapwareFinish | string;
    customNote?:        string;
    customFloorColor?:  string | null;
    customWallColor?:   string | null;
    tileStyle?:         TileStyle | string | null;
    lightingOption?:    LightingOption | string | null;
    structuralChanges?: BuilderSelections["structuralChanges"];
  };
}

const TILE_STYLE_PHRASES: Record<string, string> = {
  "vertical-stack":   "tiles laid in a vertical stack bond pattern",
  "herringbone":      "tiles laid in a classic herringbone pattern",
  "terrazzo":         "terrazzo-style tiles with scattered chips on a white base",
  "zellige":          "hand-glazed zellige tiles with natural imperfections and irregular facets",
  "large-format":     "large-format 600×1200mm stone-look tiles with minimal grout lines",
  "penny-rounds":     "penny-round mosaic tiles in a honeycomb arrangement",
  "checkerboard":     "classic checkerboard pattern tiles alternating two tones",
  "honed-travertine": "honed travertine with unfilled natural voids and a matte finish",
};

export function buildGeminiPrompt(req: PromptInput): string {
  // ── Route to room-specific prompt builders ─────────────────────
  if (req.roomType === "kitchen" && req.kitchenSelections) {
    return buildKitchenPrompt(req.kitchenSelections, !!req.imageBase64);
  }
  if (req.roomType === "bedroom" && req.bedroomSelections) {
    return buildBedroomPrompt(req.bedroomSelections, !!req.imageBase64);
  }

  // ── Bathroom (default) ─────────────────────────────────────────
  const { selections } = req;

  const floorName  = selections.floorTile?.name  ?? "neutral stone tile";
  const wallName   = selections.wallTile?.name   ?? "white subway tile";
  const tapwareFmt =
    selections.tapware === "matte-black"  ? "matte black" :
    selections.tapware === "brushed-gold" ? "brushed gold" :
    "chrome";

  const floorDesc = selections.customFloorColor
    ? `${floorName} in ${selections.customFloorColor}`
    : floorName;
  const wallDesc = selections.customWallColor
    ? `${wallName} in ${selections.customWallColor}`
    : wallName;

  const systemInstruction = [
    "You are a professional interior design visualizer. You will receive a photo of a bathroom",
    "and a set of material selections. Your task is to modify the photo to reflect these",
    "selections while maintaining the exact structural layout (sink, toilet, and window positions)",
    "unless specific structural changes are requested below.",
    "",
    "Before applying the new materials, digitally remove all personal clutter, towels, and",
    "toiletries from the surfaces. Ensure the final image looks like a professional staging",
    "for a real estate listing.",
    "",
    "Style: High-end architectural photography, natural Australian lighting, realistic textures.",
    `Materials to apply: Floor: ${floorDesc}, Wall: ${wallDesc}, Tapware: ${tapwareFmt}.`,
    `Vanity: ${selections.vanity === "floating" ? "floating / wall-mounted" : "freestanding / floor-mounted"}.`,
    "",
    "Output the result as a high-fidelity 2K image.",
  ].join("\n");

  // ── Tile style / layout ──────────────────────────────────────
  const tileStyleId = typeof selections.tileStyle === "string" ? selections.tileStyle : selections.tileStyle ?? "";
  const tileStyleSection = tileStyleId && TILE_STYLE_PHRASES[tileStyleId]
    ? `\n\nTile layout: Apply the tiles using ${TILE_STYLE_PHRASES[tileStyleId]}.`
    : "";

  // ── Custom surface colours ────────────────────────────────────
  const customFloorColorSection = selections.customFloorColor
    ? `\n\nCustom floor colour: Render the floor tiles in the exact colour ${selections.customFloorColor}.`
    : "";
  const customWallColorSection = selections.customWallColor
    ? `\n\nCustom wall colour: Render the wall tiles in the exact colour ${selections.customWallColor}.`
    : "";

  // ── Structural change instructions ───────────────────────────
  const sc = selections.structuralChanges;
  const structuralLines: string[] = [];
  if (sc?.removeBathtub)   structuralLines.push("Remove the existing bathtub entirely and replace the space with clean wall tiles.");
  if (sc?.addWalkinShower) structuralLines.push("Add a frameless walk-in shower with a fixed glass panel in the space where possible.");
  if (sc?.replaceToilet)   structuralLines.push("Replace the existing toilet with a modern wall-hung rimless toilet suite.");
  if (sc?.inWallCistern)   structuralLines.push("Install an in-wall concealed cistern system — the toilet suite should have a wall-hung pan with no visible cistern.");
  if (sc?.showerNiche === "single")
    structuralLines.push("Incorporate a recessed single tiled shower niche into the shower wall — sized approximately 300×300mm, tiled to match the wall tiles.");
  if (sc?.showerNiche === "double")
    structuralLines.push("Incorporate a recessed double tiled shower niche into the shower wall — two shelves approximately 300×200mm each, tiled to match the wall tiles.");
  if (sc?.showerFixtures === "dual")
    structuralLines.push("Install dual shower fixtures — a ceiling-mounted rain shower head plus a separate handheld shower on a slide rail, both fed by a diverter on the same shower wall.");
  const structuralSection = structuralLines.length > 0
    ? "\n\nStructural changes to apply:\n" + structuralLines.map(l => `- ${l}`).join("\n")
    : "";

  // ── Custom design note ────────────────────────────────────────
  const customNoteSection = selections.customNote?.trim()
    ? `\n\nAdditional client request: "${selections.customNote.trim()}"`
    : "";

  // ── Lighting & Electrical ─────────────────────────────────────
  const lightingId   = selections.lightingOption ?? "none";
  const lightingLine = LIGHTING_OPTIONS.find((o) => o.id === lightingId)?.promptLine ?? "";
  const lightingSection = lightingLine
    ? `\n\nLighting & electrical: ${lightingLine}`
    : "";

  // ── Project brief injections ──────────────────────────────────
  const scopeSuffix    = req.projectBrief ? SCOPE_PROMPT_SUFFIX[req.projectBrief.scope]                         : "";
  const plumbingSuffix = req.projectBrief ? PLUMBING_LAYOUT_PROMPT_SUFFIX[req.projectBrief.plumbingLayout]      : "";
  const briefSection   =
    (scopeSuffix || plumbingSuffix)
      ? `\n\nProject brief context: ${[scopeSuffix, plumbingSuffix].filter(Boolean).join(" ")}`
      : "";

  // No-photo fallback
  const noPhotoContext = !req.imageBase64
    ? [
        "",
        "",
        "No existing room photo has been provided.",
        "Generate a complete photorealistic bathroom from scratch using the materials above.",
        "Compose the scene as an interior architect would: slightly elevated angle, centred on the vanity,",
        "showing both the floor and at least two walls. Render at 2K resolution.",
      ].join("\n")
    : "";

  return systemInstruction + tileStyleSection + customFloorColorSection + customWallColorSection + structuralSection + lightingSection + customNoteSection + briefSection + noPhotoContext;
}
