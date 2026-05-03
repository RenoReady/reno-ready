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

  // ── No-photo mode: simpler prompt, no spatial constraints needed ──
  const isPhotoMode = !!req.imageBase64;

  const systemInstruction = isPhotoMode ? [
    // ── Hard spatial lock — placed FIRST ────────────────────────────────────
    "SURFACE RETEXTURING TASK — NOT a redesign or reimagining.",
    "You are given a reference photo of a real bathroom. Your ONLY job is to re-texture and",
    "re-colour the existing visible surfaces (tiles, vanity, tapware, floor) in-place.",
    "",
    "HARD CONSTRAINTS — these are immutable and override everything else:",
    "1. ROOM SIZE IS FIXED. The bathroom footprint, wall positions, and ceiling height shown",
    "   in the reference photo must not change by even one centimetre. Do not make it look larger.",
    "2. CAMERA IS LOCKED. Reproduce the exact camera angle, distance, field of view, and",
    "   perspective from the reference photo. Do not zoom out, pan, or change the viewpoint.",
    "3. NO NEW SPACE. Every surface you modify must already exist in the reference photo.",
    "   Do not add walls, fixtures, or fittings outside the existing frame.",
    "4. STRUCTURAL LAYOUT IS FROZEN. Sink, toilet, shower/bath, and window positions stay",
    "   identical to the reference photo unless a structural change is explicitly listed below.",
    "5. ONLY SURFACES CHANGE. Textures, colours, and material finishes may change. Geometry may not.",
    "",
    // ── Materials ────────────────────────────────────────────────────────────
    "─── MATERIAL CHANGES TO APPLY (within the existing spatial layout) ───",
    `Floor tiles: Re-texture the existing floor with ${floorDesc}.`,
    `Wall tiles: Re-texture the existing wall surfaces with ${wallDesc}.`,
    `Tapware: Replace visible tapware with ${tapwareFmt} finish fittings.`,
    `Vanity: ${selections.vanity === "floating" ? "Replace with a floating / wall-mounted vanity." : "Replace with a freestanding / floor-mounted vanity."}`,
    "",
    "Remove all personal clutter, towels, and toiletries. The result should look like a",
    "professional real-estate staging photo.",
    "Style: High-end architectural photography, natural Australian lighting, realistic textures.",
    "Output: high-fidelity 2K image.",
  ].join("\n") : [
    // ── No-photo: generate from scratch ─────────────────────────────────────
    "You are a professional interior design visualizer. Generate a photorealistic bathroom from scratch.",
    "Compose the scene as an interior architect would: slightly elevated angle centred on the vanity,",
    "showing both the floor and at least two walls. Render at 2K resolution.",
    "",
    `Floor: ${floorDesc}. Wall: ${wallDesc}. Tapware: ${tapwareFmt}.`,
    `Vanity: ${selections.vanity === "floating" ? "floating / wall-mounted" : "freestanding / floor-mounted"}.`,
    "Style: High-end architectural photography, natural Australian lighting, realistic textures.",
  ].join("\n");

  // ── Tile style / layout ──────────────────────────────────────────────────
  const tileStyleId = typeof selections.tileStyle === "string" ? selections.tileStyle : selections.tileStyle ?? "";

  // ── Tile style / layout (only meaningful when tiles are being changed) ──
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
  if (sc?.removeBathtub)   structuralLines.push("PERMITTED structural change: remove the existing bathtub and replace the space with clean wall tiles.");
  if (sc?.addWalkinShower) structuralLines.push("PERMITTED structural change: add a frameless walk-in shower with a fixed glass panel in the available space.");
  if (sc?.replaceToilet)   structuralLines.push("PERMITTED structural change: replace the existing toilet with a modern wall-hung rimless toilet suite.");
  if (sc?.inWallCistern)   structuralLines.push("PERMITTED structural change: install an in-wall concealed cistern — wall-hung pan with no visible cistern.");
  if (sc?.showerNiche === "single")
    structuralLines.push("PERMITTED structural change: incorporate a recessed single tiled shower niche (approx 300×300mm) into the shower wall.");
  if (sc?.showerNiche === "double")
    structuralLines.push("PERMITTED structural change: incorporate a recessed double tiled shower niche (two shelves approx 300×200mm) into the shower wall.");
  if (sc?.showerFixtures === "dual")
    structuralLines.push("PERMITTED structural change: install dual shower fixtures — ceiling rain head plus a handheld on a slide rail.");
  const structuralSection = structuralLines.length > 0
    ? "\n\nPermitted structural changes (only these — no others):\n" + structuralLines.map(l => `- ${l}`).join("\n")
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
  const scopeSuffix    = req.projectBrief ? SCOPE_PROMPT_SUFFIX[req.projectBrief.scope]                    : "";
  const plumbingSuffix = req.projectBrief ? PLUMBING_LAYOUT_PROMPT_SUFFIX[req.projectBrief.plumbingLayout] : "";
  const briefSection   =
    (scopeSuffix || plumbingSuffix)
      ? `\n\nProject brief context: ${[scopeSuffix, plumbingSuffix].filter(Boolean).join(" ")}`
      : "";

  // ── Final spatial reminder (photo mode only — placed LAST for maximum weight) ──
  const spatialReminder = isPhotoMode
    ? [
        "",
        "FINAL SPATIAL CHECK (read before generating): The output must show the same room size,",
        "camera angle, and structural layout as the reference photo. Only materials and textures",
        "should have changed. The bathroom must not look bigger or different in shape than the reference.",
      ].join("\n")
    : "";

  return systemInstruction + tileStyleSection + customFloorColorSection + customWallColorSection + structuralSection + lightingSection + customNoteSection + briefSection + spatialReminder;
}
