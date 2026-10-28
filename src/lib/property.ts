/**
 * About the property, asked on the builder brief (any room): what kind of
 * home it is, and what else they might want done. Shown to the builder on the
 * lead email, the Pro Report and in admin.
 */

import type { RoomType } from "./roomTypes";

export const PROPERTY_TYPES = [
  { id: "house",     label: "House (freestanding)" },
  { id: "townhouse", label: "Townhouse or terrace" },
  { id: "apartment", label: "Apartment or unit" },
  { id: "duplex",    label: "Duplex or semi-detached" },
  { id: "granny",    label: "Granny flat or studio" },
  { id: "other",     label: "Other" },
] as const;
export type PropertyTypeId = (typeof PROPERTY_TYPES)[number]["id"];

/** Usually under a body corporate, so work needs its approval first */
export const isStrata = (id: string | null | undefined) => id === "apartment" || id === "townhouse";

const OTHER_AREAS = [
  { id: "bathroom", label: "Bathroom or ensuite", again: "Another bathroom or ensuite" },
  { id: "kitchen",  label: "Kitchen",             again: null },
  { id: "laundry",  label: "Laundry",             again: null },
  { id: "bedroom",  label: "Bedroom",             again: "Another bedroom" },
  { id: "living",   label: "Living or dining",    again: null },
  { id: "outdoor",  label: "Outdoor, deck or patio", again: null },
  { id: "whole",    label: "Whole home",          again: null },
] as const;

/** Other areas to offer, as labels: the room they've just designed only comes up as "another" one */
export const otherAreasFor = (room: RoomType): string[] =>
  OTHER_AREAS.flatMap((a) => (a.id !== room ? [a.label] : a.again ? [a.again] : []));

export const propertyTypeLabel = (id: string | null | undefined) => PROPERTY_TYPES.find((p) => p.id === id)?.label ?? null;

/** Server side: only a label from the list is kept */
export const cleanPropertyType = (label: unknown): string | null =>
  PROPERTY_TYPES.find((p) => p.label === label)?.label ?? null;
export const cleanOtherAreas = (areas: unknown): string[] =>
  Array.isArray(areas) ? areas.filter((a): a is string => typeof a === "string").map((a) => a.trim().slice(0, 40)).filter(Boolean).slice(0, 8) : [];
/** The builder note for a strata property, from its label */
export const strataNote = (label: string | null | undefined) =>
  isStrata(PROPERTY_TYPES.find((p) => p.label === label)?.id) ? "Likely strata: body corporate approval may be needed before work starts" : null;
