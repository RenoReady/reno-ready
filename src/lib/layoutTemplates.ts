/**
 * Sample room layouts for Step 3 of the visualiser.
 *
 * When a visitor has no photo of their room, they can pick one of these and
 * the AI builds the render around that layout instead of inventing one.
 * The server looks templates up by id, so only these prompt lines ever reach
 * the model.
 */

import type { RoomType } from "./roomTypes";

/** A shape on the plan thumbnail, in a 100 × 72 viewBox */
export interface PlanShape {
  x: number; y: number; w: number; h: number;
  /** wet = shower/bath/sink, joinery = cabinetry/robes, soft = beds/sofas, glass = screens */
  kind: "wet" | "joinery" | "soft" | "glass";
  round?: boolean;
}

export interface LayoutTemplate {
  id:         string;
  room:       RoomType;
  label:      string;
  sub:        string;
  size:       string;
  promptLine: string;
  plan:       PlanShape[];
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // ── Bathroom ───────────────────────────────────────────────────
  {
    id: "bath-ensuite", room: "bathroom",
    label: "Compact Ensuite", sub: "Shower, vanity and toilet", size: "approx. 2.4 × 1.8 m",
    promptLine: "a compact Australian ensuite of approximately 2.4 × 1.8 m: a corner walk-in shower with a frameless glass panel, a single wall-hung vanity on the opposite wall, and a toilet beside the vanity. No bath. One door on the short wall.",
    plan: [
      { x: 6, y: 6, w: 30, h: 30, kind: "wet" }, { x: 36, y: 6, w: 1.5, h: 30, kind: "glass" },
      { x: 60, y: 6, w: 34, h: 12, kind: "joinery" }, { x: 78, y: 48, w: 14, h: 18, kind: "wet", round: true },
    ],
  },
  {
    id: "bath-family", room: "bathroom",
    label: "Family Bathroom", sub: "Bath, shower, vanity and toilet", size: "approx. 3.0 × 2.4 m",
    promptLine: "a standard Australian family bathroom of approximately 3.0 × 2.4 m: a built-in bath along the back wall, a separate walk-in shower with frameless glass, a single vanity, and a toilet. One door and one window above the bath.",
    plan: [
      { x: 6, y: 6, w: 52, h: 18, kind: "wet", round: true }, { x: 66, y: 6, w: 28, h: 28, kind: "wet" },
      { x: 64.5, y: 6, w: 1.5, h: 28, kind: "glass" }, { x: 6, y: 48, w: 34, h: 18, kind: "joinery" },
      { x: 78, y: 48, w: 14, h: 18, kind: "wet", round: true },
    ],
  },
  {
    id: "bath-master", room: "bathroom",
    label: "Master Ensuite", sub: "Double vanity, freestanding bath", size: "approx. 3.6 × 2.8 m",
    promptLine: "a generous master ensuite of approximately 3.6 × 2.8 m: a double vanity along one wall, a large walk-in shower, a freestanding bath beneath a window, and a toilet in its own zone.",
    plan: [
      { x: 6, y: 6, w: 56, h: 12, kind: "joinery" }, { x: 70, y: 6, w: 24, h: 32, kind: "wet" },
      { x: 68.5, y: 6, w: 1.5, h: 32, kind: "glass" }, { x: 14, y: 42, w: 36, h: 18, kind: "wet", round: true },
      { x: 78, y: 50, w: 14, h: 16, kind: "wet", round: true },
    ],
  },

  // ── Kitchen ────────────────────────────────────────────────────
  {
    id: "kitchen-galley", room: "kitchen",
    label: "Galley Kitchen", sub: "Two parallel benches", size: "approx. 4.0 × 2.4 m",
    promptLine: "a galley kitchen of approximately 4.0 × 2.4 m: two parallel runs of base and overhead cabinetry facing each other across a central walkway, the sink beneath a window at the far end, and the cooktop on the opposite run.",
    plan: [
      { x: 6, y: 6, w: 88, h: 16, kind: "joinery" }, { x: 6, y: 50, w: 88, h: 16, kind: "joinery" },
      { x: 76, y: 8, w: 14, h: 10, kind: "wet", round: true },
    ],
  },
  {
    id: "kitchen-l-island", room: "kitchen",
    label: "L-Shape with Island", sub: "Corner run plus island bench", size: "approx. 4.5 × 4.0 m",
    promptLine: "an L-shaped kitchen of approximately 4.5 × 4.0 m: cabinetry along two adjoining walls, a freestanding island bench with overhang seating, the sink on the island, and the cooktop on the long wall with a rangehood above.",
    plan: [
      { x: 6, y: 6, w: 88, h: 14, kind: "joinery" }, { x: 6, y: 20, w: 14, h: 46, kind: "joinery" },
      { x: 38, y: 38, w: 44, h: 16, kind: "joinery" }, { x: 54, y: 41, w: 12, h: 10, kind: "wet", round: true },
    ],
  },
  {
    id: "kitchen-open", room: "kitchen",
    label: "Single Wall + Island", sub: "Open plan, one wall of joinery", size: "approx. 5.0 × 3.5 m",
    promptLine: "an open-plan single-wall kitchen of approximately 5.0 × 3.5 m: one full wall of floor-to-ceiling cabinetry with integrated appliances, and a long island bench parallel to it holding the sink and seating.",
    plan: [
      { x: 6, y: 6, w: 88, h: 16, kind: "joinery" }, { x: 18, y: 40, w: 64, h: 16, kind: "joinery" },
      { x: 44, y: 43, w: 12, h: 10, kind: "wet", round: true },
    ],
  },

  // ── Bedroom / living ───────────────────────────────────────────
  {
    id: "bed-standard", room: "bedroom",
    label: "Standard Bedroom", sub: "Queen bed and built-in robe", size: "approx. 3.2 × 3.0 m",
    promptLine: "a standard Australian bedroom of approximately 3.2 × 3.0 m: a queen bed centred on the back wall with bedside tables, a built-in mirrored robe on the side wall, and one window.",
    plan: [
      { x: 30, y: 6, w: 40, h: 40, kind: "soft", round: true }, { x: 20, y: 6, w: 8, h: 8, kind: "joinery" },
      { x: 72, y: 6, w: 8, h: 8, kind: "joinery" }, { x: 6, y: 24, w: 10, h: 42, kind: "joinery" },
    ],
  },
  {
    id: "bed-master", room: "bedroom",
    label: "Master Suite", sub: "King bed, feature wall, walk-in robe", size: "approx. 4.5 × 4.0 m",
    promptLine: "a master bedroom suite of approximately 4.5 × 4.0 m: a king bed centred against a feature bedhead wall with bedside pendants, an opening through to a walk-in robe, and a large window with sheer curtains.",
    plan: [
      { x: 6, y: 6, w: 88, h: 4, kind: "joinery" }, { x: 26, y: 10, w: 48, h: 42, kind: "soft", round: true },
      { x: 14, y: 10, w: 10, h: 9, kind: "joinery" }, { x: 76, y: 10, w: 10, h: 9, kind: "joinery" },
      { x: 6, y: 56, w: 24, h: 10, kind: "glass" },
    ],
  },
  {
    id: "bed-living", room: "bedroom",
    label: "Living Room", sub: "Sofa, media wall and window", size: "approx. 5.0 × 4.0 m",
    promptLine: "a living room of approximately 5.0 × 4.0 m: a large sofa facing a media wall with built-in joinery, a rug, an armchair, and a wide window letting in natural light.",
    plan: [
      { x: 6, y: 6, w: 88, h: 10, kind: "joinery" }, { x: 26, y: 30, w: 48, h: 12, kind: "soft", round: true },
      { x: 18, y: 50, w: 56, h: 16, kind: "soft", round: true }, { x: 80, y: 44, w: 12, h: 12, kind: "soft", round: true },
    ],
  },
];

export function templatesFor(room: RoomType): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter((t) => t.room === room);
}

/** Only returns a template that belongs to the given room */
export function findTemplate(id: string | null | undefined, room: RoomType): LayoutTemplate | null {
  if (!id) return null;
  return LAYOUT_TEMPLATES.find((t) => t.id === id && t.room === room) ?? null;
}
