import { create } from "zustand";
import {
  BuilderSelections,
  BathroomSize,
  StructuralChanges,
  TileOption,
  TileStyle,
  VanityType,
  TapwareFinish,
  LightingOption,
  BUDGET_MIN,
  BUDGET_MAX,
} from "./types";
import { type ProjectBrief } from "./projectBrief";
import {
  type RoomType,
  type KitchenSelections,
  type BedroomSelections,
  type SavedRoom,
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
  const snapshot = {
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
    structuralChanges:    s.structuralChanges,
    bathroomSize:         s.bathroomSize,
    useCustomDimensions:  s.useCustomDimensions,
    customLength:         s.customLength,
    customWidth:          s.customWidth,
    pendingGenerate,
  };
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
    const store = useBuilderStore.getState();
    if (saved.projectBrief   !== undefined) store.setProjectBrief(saved.projectBrief as ProjectBrief | null);
    if (saved.lightingOption !== undefined) store.setLightingOption(saved.lightingOption as LightingOption | null);
    if (saved.roomPhotoUrl  !== undefined) store.setRoomPhotoUrl(saved.roomPhotoUrl as string | null);
    if (saved.floorTile     !== undefined) store.setFloorTile(saved.floorTile as TileOption);
    if (saved.wallTile      !== undefined) store.setWallTile(saved.wallTile as TileOption);
    if (saved.vanity        !== undefined) store.setVanity(saved.vanity as VanityType | null);
    if (saved.tapware       !== undefined) store.setTapware(saved.tapware as TapwareFinish | null);
    if (saved.budget        !== undefined) store.setBudget(saved.budget as number);
    if (saved.customNote    !== undefined) store.setCustomNote(saved.customNote as string);
    if (saved.customFloorColor !== undefined) store.setCustomFloorColor(saved.customFloorColor as string | null);
    if (saved.customWallColor  !== undefined) store.setCustomWallColor(saved.customWallColor as string | null);
    if (saved.tileStyle     !== undefined) store.setTileStyle(saved.tileStyle as TileStyle | null);
    if (saved.structuralChanges !== undefined)
      store.setStructuralChanges(saved.structuralChanges as Partial<StructuralChanges>);
    if (saved.bathroomSize        !== undefined) store.setBathroomSize(saved.bathroomSize as BathroomSize | null);
    if (saved.useCustomDimensions !== undefined) store.setUseCustomDimensions(saved.useCustomDimensions as boolean);
    if (saved.customLength        !== undefined) store.setCustomLength(saved.customLength as number);
    if (saved.customWidth         !== undefined) store.setCustomWidth(saved.customWidth as number);
    return saved.pendingGenerate === true;
  } catch {
    return false;
  }
}

// ── Default kitchen selections ────────────────────────────────────────────────
const defaultKitchenSelections: KitchenSelections = {
  roomSize:            null,
  customLength:        0,
  customWidth:         0,
  cabinetry:           null,
  benchtop:            null,
  mixer:               null,
  splashback:          null,
  floorFinish:         null,
  floorColor:          null,
  wallColor:           null,
  cooktop:             null,
  dishwasher:          null,
  ceilingStyle:        null,
  hasIsland:           false,
  hasApplianceRoughin: false,
  hasSinkRoughin:      false,
  hasWallChange:       false,
  hasButlersPantry:    false,
  customNote:          "",
};

// ── Default bedroom selections ────────────────────────────────────────────────
const defaultBedroomSelections: BedroomSelections = {
  roomSize:          null,
  customLength:      0,
  customWidth:       0,
  flooring:          null,
  flooringColor:     null,
  wallTreatment:     null,
  wallColor:         null,
  lighting:          null,
  storage:           null,
  windowTreatment:   null,
  ceilingStyle:      null,
  ceilingColor:      null,
  hasElectricalWork: false,
  hasVJWall:         false,
  hasMediaJoinery:   false,
  hasPendantRoughin: false,
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
  setStructuralChanges:   (c: Partial<StructuralChanges>)  => void;
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
  budget:              DEFAULT_BUDGET,
  customNote:          "",
  customFloorColor:    null,
  customWallColor:     null,
  tileStyle:           null,
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

const BLANK_ROOMS: Record<RoomType, boolean> = { bathroom: false, kitchen: false, bedroom: false };

export const useBuilderStore = create<BuilderStore>((set, get) => ({
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
      vanity:            null,
      tapware:           null,
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
  setKitchenSelections:  (s) => set((st) => ({ kitchenSelections: { ...st.kitchenSelections, ...s } })),

  // ── Bedroom ───────────────────────────────────────────────────────────────
  bedroomSelections:     defaultBedroomSelections,
  setBedroomSelections:  (s) => set((st) => ({ bedroomSelections: { ...st.bedroomSelections, ...s } })),

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

  // ── Existing setters ───────────────────────────────────────────────────────
  setRoomPhotoUrl:        (url)   => set({ roomPhotoUrl: url }),
  setFloorTile:           (tile)  => set({ floorTile: tile }),
  setWallTile:            (tile)  => set({ wallTile: tile }),
  setVanity:              (v)     => set({ vanity: v }),
  setTapware:             (t)     => set({ tapware: t }),
  setBudget:              (n)     => set({ budget: n }),
  setCustomNote:          (note)  => set({ customNote: note }),
  setCustomFloorColor:    (color) => set({ customFloorColor: color }),
  setCustomWallColor:     (color) => set({ customWallColor: color }),
  setTileStyle:           (style) => set({ tileStyle: style }),
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
