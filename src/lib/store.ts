import { create } from "zustand";
import {
  type BathroomKeepKey,
  BATHROOM_KEEP_FIELDS, KITCHEN_KEEP_FIELDS, BEDROOM_KEEP_FIELDS,
  keepPatch, withKeepReleased,
} from "./keepExisting";
import {
  BuilderSelections,
  BathroomSize,
  StructuralChanges,
  TileOption,
  TileStyle,
  FloorFormat,
  WallFormat,
  WallPaintFinish,
  VanityType,
  TapwareFinish,
  LightingOption,
  BUDGET_MIN,
  BUDGET_MAX,
  FLOOR_FORMATS,
  WALL_FORMATS,
  SURFACE_TONES,
  findPaintFinish,
} from "./types";
import { type ProjectBrief } from "./projectBrief";
import { isDesignStyle, type DesignStyleId } from "./designStyles";
import {
  type RoomType,
  type KitchenSelections,
  type BedroomSelections,
  type SavedRoom,
  KITCHEN_BUDGET_DEFAULT,
  BEDROOM_BUDGET_DEFAULT,
  WALL_TREATMENT_OPTIONS,
  OLD_WALL_TREATMENT,
} from "./roomTypes";

// ── OAuth state persistence ────────────────────────────────────────
// When Google OAuth redirects away from the page, the Zustand store
// is wiped. We snapshot it to sessionStorage before the redirect and
// restore it on the way back so the user doesn't lose their work.

const PERSIST_KEY = "reno_ready_pending_state";

/**
 * Save the current builder state to sessionStorage.
 * Call this immediately before initiating the Google OAuth redirect.
 * @param pendingGenerate — when true, the builder will auto-trigger
 *   generation once the user lands back on /builder?authed=1.
 */
export function saveBuilderStateForAuth(pendingGenerate = true): void {
  if (typeof window === "undefined") return;
  const s = useBuilderStore.getState();
  const snapshot = { ...builderSnapshot(), pendingGenerate };
  try {
    // Try with room photo first; fall back without if sessionStorage is full
    const withPhoto = { ...snapshot, roomPhotoUrl: s.roomPhotoUrl };
    sessionStorage.setItem(PERSIST_KEY, JSON.stringify(withPhoto));
  } catch {
    try {
      sessionStorage.setItem(PERSIST_KEY, JSON.stringify({ ...snapshot, roomPhotoUrl: null }));
    } catch { /* give up gracefully */ }
  }
}

/**
 * Every design choice in the builder as plain JSON, without the photo or the
 * render (those are large and stored separately). Used for the sign-in
 * hand-off and for drafts.
 */
export function builderSnapshot(): Record<string, unknown> {
  const s = useBuilderStore.getState();
  return {
    // ── Room context (must be restored first so the correct room is shown) ──
    roomType:          s.roomType,
    roomConfirmed:     true,          // mark confirmed so RoomRouter doesn't pop up
    kitchenSelections: s.kitchenSelections,
    bedroomSelections: s.bedroomSelections,
    // ── Bathroom fields ─────────────────────────────────────────────────────
    projectBrief:      s.projectBrief,
    lightingOption:    s.lightingOption,
    floorTile:         s.floorTile,
    wallTile:          s.wallTile,
    vanity:            s.vanity,
    tapware:           s.tapware,
    budget:            s.budget,
    customNote:        s.customNote,
    customFloorColor:  s.customFloorColor,
    customWallColor:   s.customWallColor,
    tileStyle:         s.tileStyle,
    floorFormat:       s.floorFormat,
    wallFormat:        s.wallFormat,
    wallPaintFinish:   s.wallPaintFinish,
    wallPaintColor:    s.wallPaintColor,
    designStyle:       s.designStyle,
    structuralChanges:    s.structuralChanges,
    bathroomSize:         s.bathroomSize,
    useCustomDimensions:  s.useCustomDimensions,
    customLength:         s.customLength,
    customWidth:          s.customWidth,
    layoutTemplate:       s.layoutTemplate,
    keepExisting:         s.keepExisting,
  };
}

/**
 * Restore previously saved builder state from sessionStorage.
 * Clears the snapshot after reading so it can't be applied twice.
 * @returns `true` if the snapshot had `pendingGenerate: true`
 */
export function restoreBuilderStateFromAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(PERSIST_KEY);
    if (!raw) return false;
    sessionStorage.removeItem(PERSIST_KEY);
    const saved = JSON.parse(raw) as Record<string, unknown>;
    applyBuilderSnapshot(saved);
    return saved.pendingGenerate === true;
  } catch {
    return false;
  }
}

/**
 * Puts a snapshot (from builderSnapshot, plus an optional roomPhotoUrl) back
 * into the builder. Older choices that no longer exist are dropped.
 */
export function applyBuilderSnapshot(saved: Record<string, unknown>): void {
  {
    const store = useBuilderStore.getState();

    // ── Room context — restore first so everything renders in the right room ──
    if (saved.roomType      !== undefined) store.setRoomType(saved.roomType as RoomType);
    if (saved.roomConfirmed !== undefined) store.setRoomConfirmed(saved.roomConfirmed as boolean);
    if (saved.kitchenSelections !== undefined)
      store.setKitchenSelections(sanitiseRoom(saved.kitchenSelections as Partial<KitchenSelections>));
    if (saved.bedroomSelections !== undefined)
      store.setBedroomSelections(sanitiseRoom(saved.bedroomSelections as Partial<BedroomSelections>));

    // ── Bathroom fields ────────────────────────────────────────────────────────
    if (saved.projectBrief   !== undefined) store.setProjectBrief(saved.projectBrief as ProjectBrief | null);
    if (saved.lightingOption !== undefined) store.setLightingOption(saved.lightingOption as LightingOption | null);
    if (saved.roomPhotoUrl  !== undefined) store.setRoomPhotoUrl(saved.roomPhotoUrl as string | null);
    if (saved.layoutTemplate)             store.setLayoutTemplate(saved.layoutTemplate as string);
    if (Array.isArray(saved.keepExisting)) useBuilderStore.setState({
      keepExisting: (saved.keepExisting as string[]).filter((k): k is BathroomKeepKey => k === "floor" || k === "walls"),
    });
    // Tones and styles are re-read from the current lists, so a design saved before the
    // style-first pickers simply comes back without that surface chosen
    if (saved.floorTile     !== undefined) store.setFloorTile(currentTone(saved.floorTile));
    if (saved.wallTile      !== undefined) store.setWallTile(currentTone(saved.wallTile));
    if (saved.vanity        !== undefined) store.setVanity(saved.vanity as VanityType | null);
    if (saved.tapware       !== undefined) store.setTapware(saved.tapware as TapwareFinish | null);
    if (saved.budget        !== undefined) store.setBudget(saved.budget as number);
    if (saved.customNote    !== undefined) store.setCustomNote(saved.customNote as string);
    if (saved.customFloorColor !== undefined) store.setCustomFloorColor(saved.customFloorColor as string | null);
    if (saved.customWallColor  !== undefined) store.setCustomWallColor(saved.customWallColor as string | null);
    if (saved.tileStyle     !== undefined) store.setTileStyle(saved.tileStyle as TileStyle | null);
    if (saved.floorFormat   !== undefined) store.setFloorFormat(FLOOR_FORMATS.some((f) => f.id === saved.floorFormat) ? saved.floorFormat as FloorFormat : null);
    if (saved.wallFormat    !== undefined) store.setWallFormat(WALL_FORMATS.some((f) => f.id === saved.wallFormat) ? saved.wallFormat as WallFormat : null);
    if (saved.wallPaintFinish !== undefined || saved.wallPaintColor !== undefined)
      store.setWallPaint(findPaintFinish(saved.wallPaintFinish as string)?.id ?? null, (saved.wallPaintColor as string | null) ?? null);
    store.setDesignStyle(isDesignStyle(saved.designStyle) ? saved.designStyle : null);
    if (saved.structuralChanges !== undefined)
      store.setStructuralChanges(saved.structuralChanges as Partial<StructuralChanges>);
    if (saved.bathroomSize        !== undefined) store.setBathroomSize(saved.bathroomSize as BathroomSize | null);
    if (saved.useCustomDimensions !== undefined) store.setUseCustomDimensions(saved.useCustomDimensions as boolean);
    if (saved.customLength        !== undefined) store.setCustomLength(saved.customLength as number);
    if (saved.customWidth         !== undefined) store.setCustomWidth(saved.customWidth as number);
  }
}

/** A saved tone, if it is still one of the current tile tones */
function currentTone(t: unknown): TileOption | null {
  const id = (t as { id?: unknown } | null)?.id;
  return SURFACE_TONES.find((x) => x.id === id) ?? null;
}

/** Kitchen wall finishes that were renamed when walls became style-first */
const OLD_WALL_FINISH: Record<string, WallPaintFinish> = { paint: "crisp-neutral", "venetian-plaster": "venetian-microcement" };

/**
 * Older saved choices that no longer exist are dropped: ceilings fall back to white,
 * kitchen floors/walls must use a current style and tone.
 */
function sanitiseRoom<T extends { ceilingStyle?: unknown; designStyle?: unknown }>(sel: T): T {
  const ceiling = sel.ceilingStyle === "custom-paint" || sel.ceilingStyle === "standard-white" ? sel.ceilingStyle : null;
  const out: Record<string, unknown> = { ...sel, ceilingStyle: ceiling, designStyle: isDesignStyle(sel.designStyle) ? sel.designStyle : null };
  if ("floorFormat" in out) {
    if (!FLOOR_FORMATS.some((f) => f.id === out.floorFormat)) out.floorFormat = null;
    if (!SURFACE_TONES.some((t) => t.id === out.floorTone)) out.floorTone = null;
  }
  // cabinetry used to combine profile + colour; split the old values
  const OLD_CAB: Record<string, [string, string | null]> = {
    "shaker-sage": ["shaker", "#8FAF8A"], "matte-black": ["flat-panel", "#2B2B2B"], "flat-panel-beige": ["flat-panel", "#D8CEBC"],
  };
  if ("cabinetry" in out && typeof out.cabinetry === "string" && OLD_CAB[out.cabinetry]) {
    const [style, colour] = OLD_CAB[out.cabinetry];
    out.cabinetry = style; out.cabinetColor = out.cabinetColor ?? colour;
  }
  if ("cabinetry" in out && !("cabinetColor" in out)) out.cabinetColor = null;
  if ("benchtop" in out && !("benchtopTone" in out)) out.benchtopTone = null;
  // bedroom walls were cut to four finishes
  if ("wallTreatment" in out && typeof out.wallTreatment === "string") {
    const w = OLD_WALL_TREATMENT[out.wallTreatment] ?? out.wallTreatment;
    out.wallTreatment = WALL_TREATMENT_OPTIONS.some((o) => o.id === w) ? w : null;
  }
  if ("wallFinish" in out && typeof out.wallFinish === "string") {
    out.wallFinish = findPaintFinish(OLD_WALL_FINISH[out.wallFinish] ?? out.wallFinish)?.id ?? null;
  }
  return out as T;
}

// ── Default kitchen selections ────────────────────────────────────────────────
const defaultKitchenSelections: KitchenSelections = {
  roomSize:            null,
  customLength:        0,
  customWidth:         0,
  cabinetry:           null,
  benchtop:            null,
  cabinetColor:        null,
  benchtopTone:        null,
  mixer:               null,
  splashback:          null,
  floorFormat:         null,
  floorTone:           null,
  floorColor:          null,
  wallFinish:          null,
  wallColor:           null,
  cooktop:             null,
  dishwasher:          null,
  ceilingStyle:        null,
  ceilingColor:        null,
  designStyle:         null,
  hasIsland:           false,
  hasApplianceRoughin: false,
  hasSinkRoughin:      false,
  hasWallChange:       false,
  hasButlersPantry:    false,
  keepExisting:        [],
  budget:              KITCHEN_BUDGET_DEFAULT,
  customNote:          "",
};

// ── Default bedroom selections ────────────────────────────────────────────────
const defaultBedroomSelections: BedroomSelections = {
  roomSize:          null,
  customLength:      0,
  customWidth:       0,
  flooringFormat:    null,
  flooringTone:      null,
  flooringColor:     null,
  wallTreatment:     null,
  wallColor:         null,
  lighting:          null,
  storage:           null,
  windowTreatment:   null,
  ceilingStyle:      null,
  ceilingColor:      null,
  designStyle:       null,
  hasElectricalWork: false,
  hasVJWall:         false,
  hasMediaJoinery:   false,
  hasPendantRoughin: false,
  keepExisting:      [],
  budget:            BEDROOM_BUDGET_DEFAULT,
  customNote:        "",
};

interface BuilderStore extends BuilderSelections {
  // ── Session state ──────────────────────────────────────────────────────────
  /** True once the user has confirmed a room in the RoomRouter this session.
   *  Prevents the picker re-appearing when navigating back from preview. */
  roomConfirmed:        boolean;
  setRoomConfirmed:     (v: boolean) => void;
  /** Tracks which rooms have been visited so switching BACK restores state
   *  rather than wiping it, while a first visit always starts deselected. */
  roomsInitialised:     Record<RoomType, boolean>;

  // ── Room type ──────────────────────────────────────────────────────────────
  roomType:              RoomType;
  setRoomType:           (r: RoomType) => void;

  // ── Kitchen selections ─────────────────────────────────────────────────────
  kitchenSelections:    KitchenSelections;
  setKitchenSelections: (s: Partial<KitchenSelections>) => void;

  // ── Bedroom selections ─────────────────────────────────────────────────────
  bedroomSelections:    BedroomSelections;
  setBedroomSelections: (s: Partial<BedroomSelections>) => void;

  // ── Multi-room project ─────────────────────────────────────────────────────
  savedRooms:    SavedRoom[];
  saveCurrentRoom:  (label?: string) => void;
  removeSavedRoom:  (id: string)     => void;
  clearSavedRooms:  ()               => void;

  // ── Step 3: a sample layout, used instead of a photo ────────────────────────
  layoutTemplate:         string | null;
  /** Picking a template clears the photo, and uploading a photo clears the template */
  setLayoutTemplate:      (id: string | null)             => void;

  // ── Existing setters ───────────────────────────────────────────────────────
  setRoomPhotoUrl:        (url: string | null)            => void;
  setFloorTile:           (tile: TileOption | null)        => void;
  setWallTile:            (tile: TileOption | null)        => void;
  setVanity:              (v: VanityType | null)            => void;
  setTapware:             (t: TapwareFinish | null)        => void;
  setBudget:              (n: number)                      => void;
  setCustomNote:          (note: string)                   => void;
  setCustomFloorColor:    (color: string | null)           => void;
  setCustomWallColor:     (color: string | null)           => void;
  setTileStyle:           (style: TileStyle | null)        => void;
  /** Floor Step A — changing format clears a tone that doesn't suit it */
  setFloorFormat:         (f: FloorFormat | null)          => void;
  setWallFormat:          (f: WallFormat | null)           => void;
  /** Wall colour: a paint finish and a colour (hex), set together from the tone drawer */
  setWallPaint:           (finish: WallPaintFinish | null, color: string | null) => void;
  setDesignStyle:         (id: DesignStyleId | null)       => void;
  setStructuralChanges:   (c: Partial<StructuralChanges>)  => void;
  /** Keep a bathroom category as it is (clears its selection, so it costs nothing) */
  setBathroomKeep:        (key: BathroomKeepKey, on: boolean) => void;
  setProjectBrief:        (b: ProjectBrief | null)         => void;
  setLightingOption:      (o: LightingOption | null)       => void;
  setBathroomSize:        (s: BathroomSize | null)         => void;
  setUseCustomDimensions: (v: boolean)                     => void;
  setCustomLength:        (n: number)                      => void;
  setCustomWidth:         (n: number)                      => void;
  setGeneratedImageUrl:   (url: string | null)             => void;
  setGenerateDescription: (desc: string | null)            => void;
  reset:                  ()                               => void;
}

const DEFAULT_BUDGET = Math.round(
  ((BUDGET_MAX + BUDGET_MIN) / 2 / 500),
) * 500; // $25,000

const defaults: BuilderSelections = {
  projectBrief:        null,
  lightingOption:      null,
  roomPhotoUrl:        null,
  bathroomSize:        null,
  useCustomDimensions: false,
  customLength:        0,
  customWidth:         0,
  floorTile:           null,
  wallTile:            null,
  vanity:              null,
  tapware:             null,
  keepExisting:        [],
  budget:              DEFAULT_BUDGET,
  customNote:          "",
  customFloorColor:    null,
  customWallColor:     null,
  tileStyle:           null,
  floorFormat:         null,
  wallFormat:          null,
  wallPaintFinish:     null,
  wallPaintColor:      null,
  designStyle:         null,
  structuralChanges:   {
    removeBathtub:   false,
    addWalkinShower: false,
    replaceToilet:   false,
    inWallCistern:   false,
    showerNiche:     "none",
    showerFixtures:  "single",
  },
  generatedImageUrl:   null,
  generateDescription: null,
};

/** Picking a bathroom finish switches off "keep existing" for that category */
function releaseKeep(st: { keepExisting: BathroomKeepKey[] }, key: BathroomKeepKey, value: unknown) {
  return value ? { keepExisting: st.keepExisting.filter((k) => k !== key) } : {};
}

const BLANK_ROOMS: Record<RoomType, boolean> = { bathroom: false, kitchen: false, bedroom: false };

export const useBuilderStore = create<BuilderStore>((set) => ({
  ...defaults,

  // ── Session state ──────────────────────────────────────────────────────────
  roomConfirmed:    false,
  setRoomConfirmed: (v) => set({ roomConfirmed: v }),
  roomsInitialised: { ...BLANK_ROOMS },

  // ── Room type ──────────────────────────────────────────────────────────────
  roomType: "bathroom",

  /**
   * Switch room type with smart state management:
   * - First visit to a room → reset its selections to blank (fully deselected)
   * - Returning to a previously-visited room → restore its saved selections
   * - The room you're leaving is always preserved in the store
   */
  setRoomType: (r) => set((st) => {
    const alreadyVisited = st.roomsInitialised[r];

    const base: Partial<BuilderStore> = {
      roomType:          r,
      generatedImageUrl: null,
      generateDescription: null,
      roomPhotoUrl:      null,                 // clear photo when switching rooms
      layoutTemplate:    null,                 // templates are room-specific
      roomsInitialised:  { ...st.roomsInitialised, [r]: true },
    };

    if (alreadyVisited) return base;           // returning — keep saved selections

    // First visit — reset that room to blank/deselected
    if (r === "kitchen") {
      return { ...base, kitchenSelections: { ...defaultKitchenSelections } };
    }
    if (r === "bedroom") {
      return { ...base, bedroomSelections: { ...defaultBedroomSelections } };
    }
    // bathroom
    return {
      ...base,
      floorTile:         null,
      wallTile:          null,
      floorFormat:       null,
      wallFormat:        null,
      wallPaintFinish:   null,
      wallPaintColor:    null,
      designStyle:       null,
      customFloorColor:  null,
      customWallColor:   null,
      vanity:            null,
      tapware:           null,
      keepExisting:      [],
      lightingOption:    null,
      bathroomSize:      null,
      projectBrief:      null,
      customNote:        "",
      structuralChanges: {
        removeBathtub:   false,
        addWalkinShower: false,
        replaceToilet:   false,
        inWallCistern:   false,
        showerNiche:     "none",
        showerFixtures:  "single",
      },
    };
  }),

  // ── Kitchen ───────────────────────────────────────────────────────────────
  kitchenSelections:     defaultKitchenSelections,
  // choosing a finish in a kept category switches that keep off
  setKitchenSelections:  (s) => set((st) => ({ kitchenSelections: { ...st.kitchenSelections, ...withKeepReleased(KITCHEN_KEEP_FIELDS, st.kitchenSelections.keepExisting, s) } })),

  // ── Bedroom ───────────────────────────────────────────────────────────────
  bedroomSelections:     defaultBedroomSelections,
  setBedroomSelections:  (s) => set((st) => ({ bedroomSelections: { ...st.bedroomSelections, ...withKeepReleased(BEDROOM_KEEP_FIELDS, st.bedroomSelections.keepExisting, s) } })),

  // ── Multi-room ────────────────────────────────────────────────────────────
  savedRooms: [],
  saveCurrentRoom: (label) => set((st) => {
    const id = `room-${Date.now()}`;
    const roomLabel = label ?? (
      st.roomType === "bathroom" ? "Bathroom"
      : st.roomType === "kitchen" ? "Kitchen"
      : "Bedroom"
    );
    const newRoom: SavedRoom = {
      id,
      roomType:          st.roomType,
      roomLabel,
      roomPhotoUrl:      st.roomPhotoUrl,
      generatedImageUrl: st.generatedImageUrl,
      estimatedCost:     0, // caller sets this after calculating
      kitchenSelections: st.roomType === "kitchen"  ? { ...st.kitchenSelections } : undefined,
      bedroomSelections: st.roomType === "bedroom"  ? { ...st.bedroomSelections } : undefined,
      projectBrief:      st.roomType === "bathroom" ? st.projectBrief : undefined,
    };
    return { savedRooms: [...st.savedRooms, newRoom] };
  }),
  removeSavedRoom: (id)  => set((st) => ({ savedRooms: st.savedRooms.filter((r) => r.id !== id) })),
  clearSavedRooms: ()    => set({ savedRooms: [] }),

  // ── Step 3 ────────────────────────────────────────────────────────────────
  layoutTemplate:         null,
  setLayoutTemplate:      (id)    => set(id ? { layoutTemplate: id, roomPhotoUrl: null } : { layoutTemplate: null }),

  // ── Existing setters ───────────────────────────────────────────────────────
  setRoomPhotoUrl:        (url)   => set(url ? { roomPhotoUrl: url, layoutTemplate: null } : { roomPhotoUrl: null }),
  setFloorTile:           (tile)  => set((st) => ({ floorTile: tile, ...releaseKeep(st, "floor", tile) })),
  setWallTile:            (tile)  => set((st) => ({ wallTile: tile, ...releaseKeep(st, "walls", tile) })),
  setVanity:              (v)     => set({ vanity: v }),
  setTapware:             (t)     => set({ tapware: t }),
  setBathroomKeep:        (key, on) => set((st) => keepPatch(BATHROOM_KEEP_FIELDS, st.keepExisting, key, on) as Partial<BuilderStore>),
  setBudget:              (n)     => set({ budget: n }),
  setCustomNote:          (note)  => set({ customNote: note }),
  setCustomFloorColor:    (color) => set((st) => ({ customFloorColor: color, ...releaseKeep(st, "floor", color) })),
  setCustomWallColor:     (color) => set((st) => ({ customWallColor: color, ...releaseKeep(st, "walls", color) })),
  setTileStyle:           (style) => set({ tileStyle: style }),
  setFloorFormat:         (f)     => set((st) => ({
    floorFormat: f,
    floorTile:   f && st.floorTile && !FLOOR_FORMATS.find((x) => x.id === f)?.tones.includes(st.floorTile.id) ? null : st.floorTile,
    ...releaseKeep(st, "floor", f),
  })),
  setWallFormat:          (f)     => set((st) => ({
    wallFormat: f,
    wallTile:   f && st.wallTile && !WALL_FORMATS.find((x) => x.id === f)?.tones.includes(st.wallTile.id) ? null : st.wallTile,
    ...releaseKeep(st, "walls", f),
  })),
  setWallPaint:           (finish, color) => set({ wallPaintFinish: finish, wallPaintColor: finish || color ? color : null }),
  setDesignStyle:         (id)    => set({ designStyle: id }),
  setStructuralChanges:   (c)     => set((s) => ({
    structuralChanges: { ...s.structuralChanges, ...c },
  })),
  setProjectBrief:        (b)     => set({ projectBrief: b }),
  setLightingOption:      (o)     => set({ lightingOption: o }),
  setBathroomSize:        (s)     => set({ bathroomSize: s }),
  setUseCustomDimensions: (v)     => set({ useCustomDimensions: v }),
  setCustomLength:        (n)     => set({ customLength: n }),
  setCustomWidth:         (n)     => set({ customWidth: n }),
  setGeneratedImageUrl:   (url)   => set({ generatedImageUrl: url }),
  setGenerateDescription: (desc)  => set({ generateDescription: desc }),
  reset: () => set({
    ...defaults,
    roomType:          "bathroom",
    roomConfirmed:     false,
    roomsInitialised:  { ...BLANK_ROOMS },
    kitchenSelections: { ...defaultKitchenSelections },
    bedroomSelections: { ...defaultBedroomSelections },
    savedRooms:        [],
  }),
}));
