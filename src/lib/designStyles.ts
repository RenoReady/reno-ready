/**
 * Design styles — the overall look of a design, shared by every tool.
 *
 * A style is a visual direction for the AI, not a bundle of finishes: it
 * never selects tiles or fixtures, and the standard styles cost nothing.
 * Only the explicitly high-end tier adds a modest premium for the extra
 * detailing (mouldings, panelling, trims) it implies.
 */

import type { RoomType } from "./roomTypes";

export type DesignStyleId = "modern-contemporary" | "warm-minimalist" | "coastal-hamptons" | "luxurious-traditional";

interface DesignStyle {
  name:     string;
  /** AUD added to the estimate; 0 for the standard styles */
  premium:  number;
  /** The look, in words the image model responds to */
  look:     string;
  /** Room-specific touches */
  rooms:    Record<RoomType, string>;
}

export const DESIGN_STYLES: Record<DesignStyleId, DesignStyle> = {
  "modern-contemporary": {
    name: "Modern Contemporary", premium: 0,
    look: "clean lines, large uninterrupted surfaces, slim profiles and a restrained palette of soft greys, black and white, with crisp architectural lighting",
    rooms: {
      bathroom: "a wall-hung vanity, frameless glass and minimal visible grout",
      kitchen:  "handleless cabinetry, a waterfall-edge benchtop and integrated appliances",
      bedroom:  "a low upholstered bed, concealed storage and architectural downlights",
    },
  },
  "warm-minimalist": {
    name: "Warm Minimalist", premium: 0,
    look: "a calm, pared-back space in warm whites, soft stone and natural timber, with hidden storage, minimal visible hardware and soft diffused daylight",
    rooms: {
      bathroom: "a timber-toned floating vanity, a simple round mirror and soft natural textures",
      kitchen:  "soft-toned cabinetry, a seamless stone benchtop and open timber shelving",
      bedroom:  "linen bedding, a timber bedside table and soft layered neutrals",
    },
  },
  "coastal-hamptons": {
    name: "Coastal Hamptons", premium: 0,
    look: "a relaxed, airy coastal look with crisp whites, sand tones and soft blue-greens, classic panelled details and natural linen and rattan textures in bright daylight",
    rooms: {
      bathroom: "a classic shaker-style vanity, polished chrome or nickel fittings and a framed mirror",
      kitchen:  "white shaker cabinetry, a classic subway splashback and woven pendant lights",
      bedroom:  "a panelled bedhead, crisp white linen and woven rattan accents",
    },
  },
  "luxurious-traditional": {
    name: "Luxurious Traditional", premium: 4_000,
    look: "rich, classic luxury with decorative mouldings, panelled detailing, marble and warm brass accents, symmetrical composition and warm layered lighting",
    rooms: {
      bathroom: "a furniture-style vanity, a brass-framed mirror and wall sconces either side",
      kitchen:  "panelled cabinetry with brass hardware, a statement range hood and a marble-look benchtop",
      bedroom:  "an upholstered bedhead, paired bedside lamps and decorative wall panelling",
    },
  },
};

export const DESIGN_STYLE_IDS = Object.keys(DESIGN_STYLES) as DesignStyleId[];

export function isDesignStyle(id: unknown): id is DesignStyleId {
  return typeof id === "string" && id in DESIGN_STYLES;
}

/** Premium added to the estimate for a style (0 for the standard styles) */
export function stylePremium(id: string | null | undefined): number {
  return isDesignStyle(id) ? DESIGN_STYLES[id].premium : 0;
}

/** Estimate line for the style's premium, or null when it costs nothing */
export function styleCostItem(id: string | null | undefined): { label: string; amount: number; detail: string } | null {
  if (!isDesignStyle(id) || DESIGN_STYLES[id].premium === 0) return null;
  return {
    label:  `Luxury detailing — ${DESIGN_STYLES[id].name}`,
    amount: DESIGN_STYLES[id].premium,
    detail: "Decorative mouldings, panelling and premium trims",
  };
}

/** Prompt section describing the overall look. It guides, never overrides, the client's choices. */
export function styleSection(id: string | null | undefined, room: RoomType, hasPhoto: boolean): string {
  if (!isDesignStyle(id)) return "";
  const s = DESIGN_STYLES[id];
  return `\n\nOVERALL STYLE — ${s.name}: ${s.look}, with ${s.rooms[room]}. ` +
    "Use this style to guide the styling, decor and any finish the client has not chosen. " +
    "Never override a finish the client has chosen." +
    (hasPhoto ? " Apply the style within the existing room structure only." : "");
}
