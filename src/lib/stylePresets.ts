/**
 * Style cards for "Start from a style". The styles themselves (look, AI
 * wording, pricing) live in designStyles.ts; this file only holds what each
 * card shows in each room. Choosing a style never selects finishes.
 */

import { DESIGN_STYLES, type DesignStyleId } from "./designStyles";

/** What a style card shows: an upper and lower surface plus a fixture swatch */
export interface StyleLook {
  id:          DesignStyleId;
  name:        string;
  description: string;
  /** AUD the style adds (0 for the standard styles) */
  premium:     number;
  /** CSS backgrounds for the card preview */
  top:         string;
  bottom:      string;
  dot?:        string;
}

const tile = (id: string) => `url(/tiles/${id}.webp) center / cover`;
const grad = (a: string, b: string) => `linear-gradient(135deg, ${a}, ${b})`;
const METAL = {
  black:  grad("#3a3a3a", "#111111"),
  white:  grad("#ffffff", "#e4e3df"),
  chrome: grad("#ededed", "#a8a8a8"),
  gold:   grad("#e8c97e", "#b8962c"),
};

const look = (id: DesignStyleId, description: string, top: string, bottom: string, dot?: string): StyleLook =>
  ({ id, name: DESIGN_STYLES[id].name, premium: DESIGN_STYLES[id].premium, description, top, bottom, dot });

export const BATHROOM_STYLES: StyleLook[] = [
  look("modern-contemporary",   "Clean lines, large surfaces, black accents.",        tile("smoked-concrete"), tile("matte-slate-lg"), METAL.black),
  look("warm-minimalist",       "Warm whites, soft stone, calm and pared back.",      tile("fluted-white"),    tile("travertine"),     METAL.white),
  look("coastal-hamptons",      "Crisp whites, sand tones, classic details.",          tile("zellige-white"),   tile("honed-limestone"), METAL.chrome),
  look("luxurious-traditional", "Marble, mouldings and warm brass.",                   tile("marble-blanc"),    tile("checkerboard"),   METAL.gold),
];

export const KITCHEN_STYLES: StyleLook[] = [
  look("modern-contemporary",   "Handleless, sleek and integrated.",                   grad("#E8E8E8", "#B0B0B0"), tile("concrete-pale"), METAL.black),
  look("warm-minimalist",       "Soft tones, stone and natural timber.",               grad("#D8CEBC", "#B8AC98"), tile("blonde-oak"),    METAL.white),
  look("coastal-hamptons",      "White shaker, subway tile, woven pendants.",          grad("#F5F0E8", "#C8C0B8"), tile("white-subway"),  METAL.chrome),
  look("luxurious-traditional", "Panelled cabinetry, marble and brass.",               grad("#8FAF8A", "#65885D"), tile("marble-blanc"),  METAL.gold),
];

export const BEDROOM_STYLES: StyleLook[] = [
  look("modern-contemporary",   "Clean lines, concealed storage, downlights.",         grad("#BDB8B0", "#9A958E"), tile("concrete-pale")),
  look("warm-minimalist",       "Linen, timber and soft layered neutrals.",            tile("limewash"),           tile("blonde-oak")),
  look("coastal-hamptons",      "Panelled bedhead, crisp linen, rattan.",              tile("vj-panel"),           tile("natural-oak")),
  look("luxurious-traditional", "Upholstered bedhead, panelling, paired lamps.",       tile("plaster-sand"),       tile("herringbone")),
];
