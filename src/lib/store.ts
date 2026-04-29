import { create } from "zustand";
import {
  BuilderSelections,
  BathroomSize,
  StructuralChanges,
  TileOption,
  TileStyle,
  VanityType,
  TapwareFinish,
  BUDGET_MIN,
  BUDGET_MAX,
} from "./types";
import { type ProjectBrief } from "./projectBrief";

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
    if (saved.projectBrief  !== undefined) store.setProjectBrief(saved.projectBrief as ProjectBrief | null);
    if (saved.roomPhotoUrl  !== undefined) store.setRoomPhotoUrl(saved.roomPhotoUrl as string | null);
    if (saved.floorTile     !== undefined) store.setFloorTile(saved.floorTile as TileOption);
    if (saved.wallTile      !== undefined) store.setWallTile(saved.wallTile as TileOption);
    if (saved.vanity        !== undefined) store.setVanity(saved.vanity as VanityType);
    if (saved.tapware       !== undefined) store.setTapware(saved.tapware as TapwareFinish);
    if (saved.budget        !== undefined) store.setBudget(saved.budget as number);
    if (saved.customNote    !== undefined) store.setCustomNote(saved.customNote as string);
    if (saved.customFloorColor !== undefined) store.setCustomFloorColor(saved.customFloorColor as string | null);
    if (saved.customWallColor  !== undefined) store.setCustomWallColor(saved.customWallColor as string | null);
    if (saved.tileStyle     !== undefined) store.setTileStyle(saved.tileStyle as TileStyle | null);
    if (saved.structuralChanges !== undefined)
      store.setStructuralChanges(saved.structuralChanges as Partial<StructuralChanges>);
    if (saved.bathroomSize        !== undefined) store.setBathroomSize(saved.bathroomSize as BathroomSize);
    if (saved.useCustomDimensions !== undefined) store.setUseCustomDimensions(saved.useCustomDimensions as boolean);
    if (saved.customLength        !== undefined) store.setCustomLength(saved.customLength as number);
    if (saved.customWidth         !== undefined) store.setCustomWidth(saved.customWidth as number);
    return saved.pendingGenerate === true;
  } catch {
    return false;
  }
}

interface BuilderStore extends BuilderSelections {
  setRoomPhotoUrl:        (url: string | null)            => void;
  setFloorTile:           (tile: TileOption | null)        => void;
  setWallTile:            (tile: TileOption | null)        => void;
  setVanity:              (v: VanityType)                  => void;
  setTapware:             (t: TapwareFinish)               => void;
  setBudget:              (n: number)                      => void;
  setCustomNote:          (note: string)                   => void;
  setCustomFloorColor:    (color: string | null)           => void;
  setCustomWallColor:     (color: string | null)           => void;
  setTileStyle:           (style: TileStyle | null)        => void;
  setStructuralChanges:   (c: Partial<StructuralChanges>)  => void;
  setProjectBrief:        (b: ProjectBrief | null)         => void;
  setBathroomSize:        (s: BathroomSize)                => void;
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
  roomPhotoUrl:        null,
  bathroomSize:        "medium",
  useCustomDimensions: false,
  customLength:        0,
  customWidth:         0,
  floorTile:           null,
  wallTile:            null,
  vanity:              "floating",
  tapware:             "chrome",
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

export const useBuilderStore = create<BuilderStore>((set) => ({
  ...defaults,

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
  setBathroomSize:        (s)     => set({ bathroomSize: s }),
  setUseCustomDimensions: (v)     => set({ useCustomDimensions: v }),
  setCustomLength:        (n)     => set({ customLength: n }),
  setCustomWidth:         (n)     => set({ customWidth: n }),
  setGeneratedImageUrl:   (url)   => set({ generatedImageUrl: url }),
  setGenerateDescription: (desc)  => set({ generateDescription: desc }),
  reset:                  ()      => set({ ...defaults }),
}));
