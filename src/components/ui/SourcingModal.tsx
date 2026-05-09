"use client";

/**
 * SourcingModal
 *
 * "Get the Look" product sourcing modal using hardcoded stable category
 * links to Australian retailers — no fragile deep-product URLs.
 *
 * Three sections:
 *  1. Popular Categories  — room-specific category tiles (stable links)
 *  2. Featured Products   — curated picks matched to user's selections
 *  3. Find a Showroom     — retailer showroom-finder links
 */

import { X, ExternalLink, ShoppingBag, MapPin, Star, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomType } from "@/lib/roomTypes";
import type { KitchenSelections, BedroomSelections } from "@/lib/roomTypes";
import type { VanityType, TapwareFinish, TileOption } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryLink {
  label: string;
  sub:   string;
  url:   string;      // hardcoded stable retailer category page
  emoji: string;
}

interface FeaturedProduct {
  name:   string;
  brand:  string;
  price:  string;
  note:   string;
  url:    string;      // stable category/brand page (not fragile product deep-link)
  matchTags: string[];
}

interface Showroom {
  retailer: string;
  note:     string;
  url:      string;
  rooms:    RoomType[];
}

// ── Category data ─────────────────────────────────────────────────────────────

const KITCHEN_CATEGORIES: CategoryLink[] = [
  {
    label: "Cabinet Doors & Panels",
    sub:   "Kaboodle flatpack, full range of colours and profiles",
    url:   "https://www.bunnings.com.au/kaboodle-it/products/doors-and-panels",
    emoji: "🚪",
  },
  {
    label: "Benchtops",
    sub:   "Laminate, stone-look and timber options",
    url:   "https://www.bunnings.com.au/kaboodle-it/products/benchtops",
    emoji: "🔲",
  },
  {
    label: "Kitchen Hardware",
    sub:   "Handles, hinges, runners and soft-close fittings",
    url:   "https://www.bunnings.com.au/products/kitchen/kitchen-storage-organisation/cabinet-hardware",
    emoji: "🔧",
  },
  {
    label: "Sinks & Mixers",
    sub:   "Undermount, drop-in and butler sinks with mixers",
    url:   "https://www.bunnings.com.au/products/kitchen/kitchen-sinks-and-taps",
    emoji: "🚿",
  },
  {
    label: "Splashback Tiles",
    sub:   "Subway, stone-look and glass splashback options",
    url:   "https://www.beaumonttiles.com.au/collections/splashback-tiles",
    emoji: "🟦",
  },
  {
    label: "Kitchen Appliances",
    sub:   "Cooktops, ovens, rangehoods and dishwashers",
    url:   "https://www.appliancesonline.com.au/category/kitchen-appliances",
    emoji: "🍳",
  },
];

const BATHROOM_CATEGORIES: CategoryLink[] = [
  {
    label: "Vanities",
    sub:   "Wall-hung and freestanding vanities, all sizes",
    url:   "https://www.reece.com.au/bathroom/vanities",
    emoji: "🪞",
  },
  {
    label: "Tapware & Mixers",
    sub:   "Matte black, brushed gold, chrome and brushed nickel",
    url:   "https://www.highgrovebathrooms.com.au/tapware",
    emoji: "🚰",
  },
  {
    label: "Showers & Screens",
    sub:   "Frameless, semi-frameless and framed enclosures",
    url:   "https://www.reece.com.au/bathroom/showers",
    emoji: "🚿",
  },
  {
    label: "Toilets & Suites",
    sub:   "Wall-hung, close-coupled and in-wall cistern suites",
    url:   "https://www.reece.com.au/bathroom/toilets",
    emoji: "🪣",
  },
  {
    label: "Floor & Wall Tiles",
    sub:   "Porcelain, travertine, zellige and mosaic options",
    url:   "https://www.beaumonttiles.com.au/collections/bathroom-tiles",
    emoji: "🟫",
  },
  {
    label: "Bathroom Accessories",
    sub:   "Towel rails, hooks, mirrors and soap dispensers",
    url:   "https://www.highgrovebathrooms.com.au/accessories",
    emoji: "🪥",
  },
];

const BEDROOM_CATEGORIES: CategoryLink[] = [
  {
    label: "Carpet",
    sub:   "Wool, nylon and solution-dyed nylon loop pile",
    url:   "https://www.carpetcourt.com.au/carpets",
    emoji: "🟤",
  },
  {
    label: "Timber & Hybrid Flooring",
    sub:   "Engineered oak, solid timber and hybrid planks",
    url:   "https://www.flooringxtra.com.au/timber-flooring",
    emoji: "🪵",
  },
  {
    label: "Built-in Wardrobes",
    sub:   "Sliding, hinged and walk-in robe systems",
    url:   "https://www.kinsman.com.au/wardrobes",
    emoji: "👔",
  },
  {
    label: "Bedroom Lighting",
    sub:   "Pendants, downlights, LED cove and bedside sconces",
    url:   "https://www.beacon.com.au/bedroom-lighting",
    emoji: "💡",
  },
  {
    label: "Wall Treatments",
    sub:   "Paint, limewash, VJ panels and wallpaper",
    url:   "https://www.dulux.com.au/colour/bedroom",
    emoji: "🎨",
  },
  {
    label: "Window Furnishings",
    sub:   "Sheers, blockout rollers and plantation shutters",
    url:   "https://www.blinds.com.au",
    emoji: "🪟",
  },
];

// ── Featured products data ────────────────────────────────────────────────────
// Links point to stable brand/category pages — not individual product PDPs.

const BATHROOM_FEATURED: FeaturedProduct[] = [
  // Vanities — floating
  {
    name:      "Wall-Hung Vanity Range",
    brand:     "Reece Bathrooms",
    price:     "from $689",
    note:      "Soft-close, WELS compliant — white, charcoal and timber finishes",
    url:       "https://www.reece.com.au/bathroom/vanities/wall-mounted-vanities",
    matchTags: ["floating"],
  },
  {
    name:      "Floating Vanity Collection",
    brand:     "Highgrove Bathrooms",
    price:     "from $549",
    note:      "Matte and gloss finishes, undermount basins available",
    url:       "https://www.highgrovebathrooms.com.au/vanities",
    matchTags: ["floating"],
  },
  // Vanities — freestanding
  {
    name:      "Freestanding Vanity Range",
    brand:     "Reece Bathrooms",
    price:     "from $899",
    note:      "Floor-mounted with full-height doors, ceramic basin included",
    url:       "https://www.reece.com.au/bathroom/vanities/freestanding-vanities",
    matchTags: ["freestanding"],
  },
  {
    name:      "Freestanding Vanity Collection",
    brand:     "Highgrove Bathrooms",
    price:     "from $479",
    note:      "600–1500mm widths, white and grey tones",
    url:       "https://www.highgrovebathrooms.com.au/vanities",
    matchTags: ["freestanding"],
  },
  // Tapware — matte black
  {
    name:      "Matte Black Basin Mixers",
    brand:     "Highgrove Bathrooms",
    price:     "from $199",
    note:      "WELS 4-star rated, AS 3718 compliant, solid brass body",
    url:       "https://www.highgrovebathrooms.com.au/tapware/basin-mixers",
    matchTags: ["matte-black"],
  },
  // Tapware — brushed gold
  {
    name:      "Brushed Gold Tapware Range",
    brand:     "Reece Bathrooms",
    price:     "from $395",
    note:      "PVD coating for lasting durability, WELS 4-star",
    url:       "https://www.reece.com.au/tapware/basin-mixers",
    matchTags: ["brushed-gold"],
  },
  // Tapware — chrome
  {
    name:      "Chrome Basin Mixer Range",
    brand:     "Highgrove Bathrooms",
    price:     "from $99",
    note:      "WELS 4–6 star options, AS/NZS compliant",
    url:       "https://www.highgrovebathrooms.com.au/tapware/basin-mixers",
    matchTags: ["chrome"],
  },
  // Tiles
  {
    name:      "Bathroom Tile Collection",
    brand:     "Beaumont Tiles",
    price:     "from $39/m²",
    note:      "R10 slip-rated floor tiles, full wall tile range, expert in-store advice",
    url:       "https://www.beaumonttiles.com.au/collections/bathroom-tiles",
    matchTags: ["subway", "terrazzo", "zellige", "large-format", "honed-travertine", "penny-rounds"],
  },
];

const KITCHEN_FEATURED: FeaturedProduct[] = [
  // Cabinetry
  {
    name:      "Kaboodle Kitchen Doors & Panels",
    brand:     "Bunnings Warehouse",
    price:     "from $69/door",
    note:      "Flatpack system, 20+ colours, soft-close compatible, in-store cut service",
    url:       "https://www.bunnings.com.au/kaboodle-it/products/doors-and-panels",
    matchTags: ["shaker", "flat-panel", "matte-black", "shaker-sage", "flat-panel-beige"],
  },
  {
    name:      "Timber Veneer Kitchen Doors",
    brand:     "Kinsman Kitchens",
    price:     "from $7,500 fitted",
    note:      "Real oak veneer, UV-resistant lacquer, supply and install available",
    url:       "https://www.kinsman.com.au/kitchens",
    matchTags: ["natural-timber"],
  },
  // Benchtops
  {
    name:      "Kaboodle Laminate Benchtops",
    brand:     "Bunnings Warehouse",
    price:     "from $129/lm",
    note:      "Stone-look, timber-look and solid colours, pre-cut or custom lengths",
    url:       "https://www.bunnings.com.au/kaboodle-it/products/benchtops",
    matchTags: ["engineered-stone"],
  },
  {
    name:      "Stone Benchtop Collection",
    brand:     "Caesarstone Australia",
    price:     "from $580/lm",
    note:      "Engineered quartz, 10-yr warranty, 40+ colourways, dealer locator available",
    url:       "https://www.caesarstone.com.au/kitchen/benchtops",
    matchTags: ["engineered-stone", "porcelain-slab"],
  },
  {
    name:      "Solid Timber Benchtops",
    brand:     "Timber Tops Australia",
    price:     "from $390/lm",
    note:      "Australian hardwoods, food-safe oiled finish, custom sizing",
    url:       "https://www.timbertops.com.au",
    matchTags: ["timber"],
  },
  // Splashbacks
  {
    name:      "Kitchen Splashback Tiles",
    brand:     "Beaumont Tiles",
    price:     "from $39/m²",
    note:      "Subway, stone-look, and glass options — in-store design consultations",
    url:       "https://www.beaumonttiles.com.au/collections/splashback-tiles",
    matchTags: ["white-subway", "grey-subway", "calacatta-slab"],
  },
  // Mixers
  {
    name:      "Kitchen Sink Mixers",
    brand:     "Highgrove Bathrooms",
    price:     "from $149",
    note:      "Pull-out spray, WELS 4-star, all finishes including brushed brass",
    url:       "https://www.highgrovebathrooms.com.au/tapware/kitchen-mixers",
    matchTags: ["brushed-brass", "matte-black", "chrome"],
  },
];

const BEDROOM_FEATURED: FeaturedProduct[] = [
  // Flooring
  {
    name:      "Engineered Timber Flooring",
    brand:     "Flooring Xtra",
    price:     "from $55/m²",
    note:      "Oak, ash and hybrid options, in-store measure and quote service",
    url:       "https://www.flooringxtra.com.au/timber-flooring",
    matchTags: ["engineered-oak-herringbone", "ash", "ash-rustic", "beech"],
  },
  {
    name:      "Carpet Range",
    brand:     "Carpet Court",
    price:     "from $35/m²",
    note:      "Wool and synthetic options, free measure and quote, expert fitting",
    url:       "https://www.carpetcourt.com.au/carpets",
    matchTags: ["wool-carpet"],
  },
  {
    name:      "Hybrid Plank Flooring",
    brand:     "Flooring Xtra",
    price:     "from $40/m²",
    note:      "100% waterproof, lifetime structural warranty, click-lock install",
    url:       "https://www.flooringxtra.com.au/hybrid-flooring",
    matchTags: ["hybrid-plank"],
  },
  {
    name:      "Herringbone Tile Collection",
    brand:     "Beaumont Tiles",
    price:     "from $89/m²",
    note:      "Stone-look porcelain, R10 rated, 75×300mm and 100×400mm formats",
    url:       "https://www.beaumonttiles.com.au/collections/herringbone-tiles",
    matchTags: ["herringbone-stone-grey", "herringbone-stone-white"],
  },
  // Wall treatments
  {
    name:      "Interior Paint Range",
    brand:     "Dulux Australia",
    price:     "from $59 / 4L",
    note:      "Limewash, feature wall and full-room options, colour consultant tool online",
    url:       "https://www.dulux.com.au/colour/bedroom",
    matchTags: ["feature-paint", "limewash-paint"],
  },
  {
    name:      "VJ & Shiplap Panel Kits",
    brand:     "Laminex / Bunnings",
    price:     "from $55/sheet",
    note:      "Primed MDF VJ and shiplap, paint-ready, suits any style direction",
    url:       "https://www.bunnings.com.au/products/building-hardware/wall-panelling",
    matchTags: ["vj-paneling", "shiplap-paneling", "timber-battens"],
  },
  // Lighting
  {
    name:      "Bedroom Lighting Collection",
    brand:     "Beacon Lighting",
    price:     "from $79",
    note:      "Pendants, downlights and LED cove strips — in-store lighting design service",
    url:       "https://www.beacon.com.au/bedroom-lighting",
    matchTags: ["led-cove", "architectural-downlights", "statement-pendant"],
  },
  // Storage
  {
    name:      "Built-in Wardrobe Systems",
    brand:     "Kinsman Kitchens & Wardrobes",
    price:     "from $1,800 fitted",
    note:      "Mirror sliders, custom WIR configurations, measure and install service",
    url:       "https://www.kinsman.com.au/wardrobes",
    matchTags: ["built-in-mirror-sliders", "custom-wir"],
  },
];

// ── Showrooms ─────────────────────────────────────────────────────────────────

const SHOWROOMS: Showroom[] = [
  {
    retailer: "Reece Bathrooms",
    note:     "200+ showrooms nationally — vanities, tapware, showers and toilets",
    url:      "https://www.reece.com.au/find-a-showroom",
    rooms:    ["bathroom"],
  },
  {
    retailer: "Highgrove Bathrooms",
    note:     "Budget-friendly bathroom fixtures — 30+ locations across Australia",
    url:      "https://www.highgrovebathrooms.com.au/find-a-store",
    rooms:    ["bathroom"],
  },
  {
    retailer: "Beaumont Tiles",
    note:     "Tiles for all rooms — 145+ showrooms, free design consultations",
    url:      "https://www.beaumonttiles.com.au/find-a-store",
    rooms:    ["bathroom", "kitchen"],
  },
  {
    retailer: "Bunnings Warehouse",
    note:     "360+ stores — full kitchen, bathroom and building materials range",
    url:      "https://www.bunnings.com.au/store-finder",
    rooms:    ["kitchen", "bathroom", "bedroom"],
  },
  {
    retailer: "Kinsman Kitchens & Wardrobes",
    note:     "Free in-home design service — kitchens, wardrobes and storage",
    url:      "https://www.kinsman.com.au/find-a-showroom",
    rooms:    ["kitchen", "bedroom"],
  },
  {
    retailer: "Flooring Xtra",
    note:     "200+ stores — timber, hybrid, carpet and vinyl plank flooring",
    url:      "https://www.flooringxtra.com.au/store-finder",
    rooms:    ["bedroom"],
  },
  {
    retailer: "Carpet Court",
    note:     "280+ stores — carpets, timber and hybrid flooring with free measure",
    url:      "https://www.carpetcourt.com.au/find-a-store",
    rooms:    ["bedroom"],
  },
  {
    retailer: "Beacon Lighting",
    note:     "130+ stores — full lighting range with free design consultations",
    url:      "https://www.beacon.com.au/find-a-store",
    rooms:    ["bedroom", "kitchen"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveFeaturedProducts(
  room: RoomType,
  vanity?: VanityType | string | null,
  tapware?: TapwareFinish | string | null,
  kitchenSel?: KitchenSelections | null,
  bedroomSel?: BedroomSelections | null,
): FeaturedProduct[] {
  const pool =
    room === "kitchen" ? KITCHEN_FEATURED :
    room === "bedroom" ? BEDROOM_FEATURED :
    BATHROOM_FEATURED;

  // Build a list of active tags from the user's selections
  const activeTags: string[] = [];

  if (room === "bathroom") {
    if (vanity)  activeTags.push(vanity as string);
    if (tapware) activeTags.push(tapware as string);
    // Always include tile catch-all
    activeTags.push("subway", "terrazzo", "zellige", "large-format", "honed-travertine", "penny-rounds");
  }

  if (room === "kitchen" && kitchenSel) {
    if (kitchenSel.cabinetry)  activeTags.push(kitchenSel.cabinetry);
    if (kitchenSel.benchtop)   activeTags.push(kitchenSel.benchtop);
    if (kitchenSel.splashback) activeTags.push(kitchenSel.splashback);
    if (kitchenSel.mixer)      activeTags.push(kitchenSel.mixer);
  }

  if (room === "bedroom" && bedroomSel) {
    if (bedroomSel.flooring)       activeTags.push(bedroomSel.flooring);
    if (bedroomSel.wallTreatment)  activeTags.push(bedroomSel.wallTreatment);
    if (bedroomSel.lighting)       activeTags.push(bedroomSel.lighting);
    if (bedroomSel.storage)        activeTags.push(bedroomSel.storage);
  }

  if (!activeTags.length) return pool.slice(0, 4);

  // Score each product by how many of its matchTags are in activeTags
  const scored = pool.map((p) => ({
    product: p,
    score:   p.matchTags.filter((t) => activeTags.includes(t)).length,
  }));

  // Sort by score descending, take top 4 (at most one per matchTag group)
  const seen = new Set<string>();
  const result: FeaturedProduct[] = [];
  for (const { product } of scored.sort((a, b) => b.score - a.score)) {
    const key = product.matchTags[0]; // deduplicate by primary tag group
    if (!seen.has(key)) {
      seen.add(key);
      result.push(product);
      if (result.length === 4) break;
    }
  }
  return result.length ? result : pool.slice(0, 4);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryCard({ cat }: { cat: CategoryLink }) {
  return (
    <a
      href={cat.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col gap-1.5 p-3.5 rounded-2xl border border-sand-200 bg-white/70",
        "hover:border-blue-400/50 hover:bg-blue-50/40 transition-all duration-200 group",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xl leading-none">{cat.emoji}</span>
        <ExternalLink size={11} className="text-charcoal/25 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
      </div>
      <p className="text-xs font-bold text-charcoal/80 leading-snug group-hover:text-blue-600 transition-colors">
        {cat.label}
      </p>
      <p className="text-[10px] text-charcoal/45 leading-snug">{cat.sub}</p>
    </a>
  );
}

function FeaturedCard({ product }: { product: FeaturedProduct }) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col gap-2 p-4 rounded-2xl border-2 border-sand-200 bg-white/70",
        "hover:border-blue-400/50 hover:bg-blue-50/40 transition-all duration-200 group",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-charcoal/80 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </p>
          <p className="text-[10px] text-charcoal/40 mt-0.5">{product.brand}</p>
        </div>
        <ExternalLink size={12} className="text-charcoal/25 group-hover:text-blue-500 flex-shrink-0 mt-0.5 transition-colors" />
      </div>
      <p className="text-[10px] text-charcoal/55 leading-snug">{product.note}</p>
      <p className="text-xs font-bold text-blue-600">{product.price}</p>
    </a>
  );
}

function ShowroomCard({ showroom }: { showroom: Showroom }) {
  return (
    <a
      href={showroom.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl border border-sand-200 bg-white/70",
        "hover:border-blue-400/50 hover:bg-blue-50/40 transition-all duration-200 group",
      )}
    >
      <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
        <MapPin size={13} className="text-blue-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-charcoal/80 group-hover:text-blue-600 transition-colors">
          {showroom.retailer}
        </p>
        <p className="text-[10px] text-charcoal/45 leading-snug">{showroom.note}</p>
      </div>
      <ExternalLink size={11} className="text-charcoal/25 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
    </a>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <p className="text-xs font-bold text-charcoal/60 uppercase tracking-widest">{title}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SourcingModalProps {
  onClose:           () => void;
  roomType?:         RoomType;
  vanity?:           VanityType | string | null;
  tapware?:          TapwareFinish | string | null;
  floorTile?:        TileOption | null;
  wallTile?:         TileOption | null;
  kitchenSelections?: KitchenSelections | null;
  bedroomSelections?: BedroomSelections | null;
}

const ROOM_LABEL: Record<string, string> = {
  bathroom: "Bathroom",
  kitchen:  "Kitchen",
  bedroom:  "Bedroom",
};

export default function SourcingModal({
  onClose,
  roomType = "bathroom",
  vanity, tapware,
  kitchenSelections,
  bedroomSelections,
}: SourcingModalProps) {
  const categories =
    roomType === "kitchen" ? KITCHEN_CATEGORIES :
    roomType === "bedroom" ? BEDROOM_CATEGORIES :
    BATHROOM_CATEGORIES;

  const featured = resolveFeaturedProducts(
    roomType, vanity, tapware, kitchenSelections, bedroomSelections,
  );

  const showrooms = SHOWROOMS.filter((s) => s.rooms.includes(roomType));

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-2xl max-h-[90vh] flex flex-col",
        "bg-sand-50 rounded-3xl shadow-warm-xl overflow-hidden",
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <ShoppingBag size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-charcoal">
                {ROOM_LABEL[roomType] ?? "Room"} Sourcing Guide
              </p>
              <p className="text-[10px] text-charcoal/45">
                Australian retailers · Stable links · Curated for your selections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-charcoal/40 hover:text-charcoal hover:bg-sand-200 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-7">

          {/* ── 1. Popular Categories ── */}
          <div className="flex flex-col gap-3">
            <SectionHeader
              icon={<Grid3X3 size={13} className="text-blue-600" />}
              title="Popular Categories"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <CategoryCard key={cat.label} cat={cat} />
              ))}
            </div>
          </div>

          {/* ── 2. Featured Products ── */}
          <div className="flex flex-col gap-3">
            <SectionHeader
              icon={<Star size={13} className="text-blue-600" />}
              title="Featured Products"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {featured.map((p) => (
                <FeaturedCard key={p.name} product={p} />
              ))}
            </div>
          </div>

          {/* ── 3. Find a Showroom ── */}
          <div className="flex flex-col gap-3">
            <SectionHeader
              icon={<MapPin size={13} className="text-blue-600" />}
              title="Find a Showroom"
            />
            <div className="flex flex-col gap-1.5">
              {showrooms.map((s) => (
                <ShowroomCard key={s.retailer} showroom={s} />
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sand-200 bg-white/50 flex-shrink-0">
          <p className="text-[10px] text-charcoal/35 text-center leading-snug">
            Products shown are curated for style compatibility with Australian suppliers. Reno Ready is
            not affiliated with any retailer listed. Always verify specifications and pricing directly
            with the supplier or a licensed tradesperson before purchasing.
          </p>
        </div>

      </div>
    </div>
  );
}
