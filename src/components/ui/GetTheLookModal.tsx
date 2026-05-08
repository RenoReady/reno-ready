"use client";

/**
 * GetTheLookModal
 *
 * Displays Australian-sourced product recommendations that match the
 * user's material selections. Opens when "Get the Look" is clicked
 * below a generated room preview.
 *
 * Supports bathroom, kitchen, and bedroom room types.
 * Products are curated to AU standards (WELS ratings, AS compliance).
 */

import { X, ExternalLink, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TileOption, VanityType, TapwareFinish } from "@/lib/types";
import type { KitchenSelections, BedroomSelections } from "@/lib/roomTypes";
import type { RoomType } from "@/lib/roomTypes";

// ── Product catalogue ─────────────────────────────────────────────────────────

interface Product {
  name:     string;
  brand:    string;
  price:    string;     // e.g. "from $349"
  note:     string;     // short descriptor
  url:      string;     // AU retailer link
  tags:     string[];   // which selector values this matches
}

// ── Bathroom products ─────────────────────────────────────────────────────────

const VANITY_PRODUCTS: Product[] = [
  {
    name:  "Cibo Design Enco 600 Wall-Hung Vanity",
    brand: "Reece Bathrooms",
    price: "from $689",
    note:  "Soft-close drawer, gloss white or charcoal — WELS compliant",
    url:   "https://www.reece.com.au/bathrooms/vanities",
    tags:  ["floating"],
  },
  {
    name:  "ABI Interiors Drift 750 Floating Vanity",
    brand: "ABI Interiors",
    price: "from $890",
    note:  "Matt white or dark oak veneer finish, undermount basin",
    url:   "https://www.abiinteriors.com.au/vanities",
    tags:  ["floating"],
  },
  {
    name:  "Timberline Cabinetry 900 Freestanding",
    brand: "Bunnings Warehouse",
    price: "from $549",
    note:  "Floor-mounted, full-height doors, suits small bathrooms",
    url:   "https://www.bunnings.com.au/bathroom/vanities",
    tags:  ["freestanding"],
  },
  {
    name:  "Marquis Salerno 750 Freestanding Vanity",
    brand: "Reece Bathrooms",
    price: "from $1,190",
    note:  "Gloss white with ceramic basin, soft-close hinges",
    url:   "https://www.reece.com.au/bathrooms/vanities",
    tags:  ["freestanding"],
  },
];

const TAPWARE_PRODUCTS: Product[] = [
  {
    name:  "Methven Turoa Wall Basin Mixer — Matte Black",
    brand: "Reece Bathrooms",
    price: "from $389",
    note:  "WELS 4-star, AS 3718 compliant, lifetime warranty",
    url:   "https://www.reece.com.au/tapware/basin-mixers",
    tags:  ["matte-black"],
  },
  {
    name:  "ABI Interiors Voda Basin Mixer — Matte Black",
    brand: "ABI Interiors",
    price: "from $259",
    note:  "Solid brass body, ceramic disc cartridge",
    url:   "https://www.abiinteriors.com.au/tapware",
    tags:  ["matte-black"],
  },
  {
    name:  "Brodware City Stik Basin Set — Brushed Gold",
    brand: "Reece Bathrooms",
    price: "from $875",
    note:  "PVD coating for durability, WELS 4-star rated",
    url:   "https://www.reece.com.au/tapware",
    tags:  ["brushed-gold"],
  },
  {
    name:  "Phoenix Vivid Slimline Basin Mixer — Brushed Gold",
    brand: "Reece Bathrooms",
    price: "from $499",
    note:  "Slimline design, WELS 5-star water efficiency",
    url:   "https://www.reece.com.au/tapware",
    tags:  ["brushed-gold"],
  },
  {
    name:  "Methven Aio Basin Mixer — Chrome",
    brand: "Bunnings Warehouse",
    price: "from $179",
    note:  "WELS 4-star, AS/NZS compliant, easy-clean aerator",
    url:   "https://www.bunnings.com.au/tapware",
    tags:  ["chrome"],
  },
  {
    name:  "Caroma Liano II Basin Mixer — Chrome",
    brand: "Reece Bathrooms",
    price: "from $299",
    note:  "WELS 6-star rated — best-in-class water efficiency",
    url:   "https://www.reece.com.au/tapware",
    tags:  ["chrome"],
  },
];

const TILE_PRODUCTS: Product[] = [
  {
    name:  "Terrazzo Look Porcelain 600×600",
    brand: "Beaumont Tiles",
    price: "from $89/m²",
    note:  "Slip-rated R10, suitable for wet areas",
    url:   "https://www.beaumonttiles.com.au",
    tags:  ["terrazzo"],
  },
  {
    name:  "Zellige Effect Hand-Glazed Wall Tile 100×100",
    brand: "TileCloud",
    price: "from $145/m²",
    note:  "Authentic variation, suitable for feature walls",
    url:   "https://www.tilecloud.com.au",
    tags:  ["zellige"],
  },
  {
    name:  "Large Format Stone-Look 600×1200",
    brand: "National Tiles",
    price: "from $79/m²",
    note:  "Rectified edge, minimal grout lines, R9 slip rating",
    url:   "https://www.nationaltiles.com.au",
    tags:  ["large-format", "stone"],
  },
  {
    name:  "Honed Travertine 400×400",
    brand: "Beaumont Tiles",
    price: "from $129/m²",
    note:  "Natural stone, unfilled voids, matte finish — sealing required",
    url:   "https://www.beaumonttiles.com.au",
    tags:  ["honed-travertine"],
  },
  {
    name:  "Penny Round Mosaic 300×300 Sheet",
    brand: "TileCloud",
    price: "from $99/m²",
    note:  "Porcelain, R10 slip rated, ideal for shower floors",
    url:   "https://www.tilecloud.com.au",
    tags:  ["penny-rounds"],
  },
  {
    name:  "Classic Subway Gloss White 75×300",
    brand: "Beaumont Tiles",
    price: "from $39/m²",
    note:  "BCA compliant, suits vertical stack or brick bond",
    url:   "https://www.beaumonttiles.com.au",
    tags:  ["subway", "white"],
  },
  {
    name:  "Herringbone Oak-Look Plank 200×1200",
    brand: "National Tiles",
    price: "from $95/m²",
    note:  "Porcelain wood-look, R10, suitable for wet areas",
    url:   "https://www.nationaltiles.com.au",
    tags:  ["herringbone", "timber", "wood"],
  },
];

// ── Kitchen products ──────────────────────────────────────────────────────────

const CABINETRY_PRODUCTS: Product[] = [
  {
    name:  "Polytec Shaker White Flatpack Doors",
    brand: "Polytec / Bunnings Warehouse",
    price: "from $85/door",
    note:  "MDF core, polyurethane finish, suitable for humid environments",
    url:   "https://www.bunnings.com.au/kitchen",
    tags:  ["shaker"],
  },
  {
    name:  "Kinsman Kitchens Shaker White Series",
    brand: "Kinsman Kitchens",
    price: "from $4,500 fitted",
    note:  "Full supply-and-install, soft-close hinges, AU manufactured",
    url:   "https://www.kinsman.com.au",
    tags:  ["shaker"],
  },
  {
    name:  "Sage Green Shaker Doors — Custom",
    brand: "Kaboodle Kitchen (Bunnings)",
    price: "from $79/door",
    note:  "Flatpack system, coastal sage tone, soft-close compatible",
    url:   "https://www.bunnings.com.au/kitchen",
    tags:  ["shaker-sage"],
  },
  {
    name:  "Matte Black Handleless Doors",
    brand: "Freedom Kitchens",
    price: "from $6,200 fitted",
    note:  "Finger-pull profile, matte polyurethane — bold and dramatic",
    url:   "https://www.freedomkitchens.com.au",
    tags:  ["matte-black", "flat-panel"],
  },
  {
    name:  "Flat-Panel Minimalist — Gloss White",
    brand: "IKEA Australia",
    price: "from $3,800 fitted",
    note:  "AXSTAD / VOXTORP doors, seamless European handleless design",
    url:   "https://www.ikea.com/au/en/cat/kitchens-ka001",
    tags:  ["flat-panel", "flat-panel-beige"],
  },
  {
    name:  "Timber Veneer Oak Doors",
    brand: "Kinsman Kitchens",
    price: "from $7,500 fitted",
    note:  "Real oak veneer with UV-resistant lacquer, warm grain finish",
    url:   "https://www.kinsman.com.au",
    tags:  ["natural-timber"],
  },
];

const BENCHTOP_PRODUCTS: Product[] = [
  {
    name:  "Silestone Calacatta Gold 20mm",
    brand: "Beaumont Tiles / Silestone",
    price: "from $680/lm",
    note:  "Engineered quartz, stain & scratch resistant, 10-yr warranty",
    url:   "https://www.silestone.com/en-au",
    tags:  ["engineered-stone"],
  },
  {
    name:  "Caesarstone Empira White 20mm",
    brand: "Caesarstone",
    price: "from $720/lm",
    note:  "Quartz surface, Calacatta-inspired veining, NSF certified",
    url:   "https://www.caesarstone.com.au",
    tags:  ["engineered-stone"],
  },
  {
    name:  "Dekton Ultra-Compact Porcelain Slab",
    brand: "Cosentino / Reece Bathrooms",
    price: "from $950/lm",
    note:  "12mm ultra-thin slab, 100% heatproof, zero porosity",
    url:   "https://www.cosentino.com/en-au",
    tags:  ["porcelain-slab"],
  },
  {
    name:  "Solid Blackbutt Hardwood Benchtop",
    brand: "Timber Tops Australia",
    price: "from $490/lm",
    note:  "40mm solid Australian hardwood, food-safe oiled finish",
    url:   "https://www.timbertops.com.au",
    tags:  ["timber"],
  },
];

const KITCHEN_MIXER_PRODUCTS: Product[] = [
  {
    name:  "Brodware Yokato Sink Mixer — Brushed Brass",
    brand: "Reece Bathrooms",
    price: "from $620",
    note:  "PVD brushed brass coating, pull-out spray, WELS 4-star",
    url:   "https://www.reece.com.au/tapware",
    tags:  ["brushed-brass"],
  },
  {
    name:  "Phoenix Vivid Slimline Kitchen Mixer — Brushed Brass",
    brand: "Reece Bathrooms",
    price: "from $445",
    note:  "Pull-out spray, WELS 5-star, warm brass finish",
    url:   "https://www.reece.com.au/tapware",
    tags:  ["brushed-brass"],
  },
  {
    name:  "ABI Interiors Pallas Kitchen Mixer — Matte Black",
    brand: "ABI Interiors",
    price: "from $285",
    note:  "Pull-out hose, ceramic disc, matt black powder coat",
    url:   "https://www.abiinteriors.com.au/tapware",
    tags:  ["matte-black"],
  },
  {
    name:  "Methven Turoa Sink Mixer — Matte Black",
    brand: "Reece Bathrooms",
    price: "from $395",
    note:  "WELS 4-star, AS 3718 compliant, lifetime warranty",
    url:   "https://www.reece.com.au/tapware",
    tags:  ["matte-black"],
  },
  {
    name:  "Caroma Liano II Kitchen Mixer — Chrome",
    brand: "Reece Bathrooms",
    price: "from $249",
    note:  "WELS 6-star, pull-out aerator, easy-clean nozzle",
    url:   "https://www.reece.com.au/tapware",
    tags:  ["chrome"],
  },
  {
    name:  "Grohe Concetto Kitchen Mixer — Chrome",
    brand: "Bunnings Warehouse",
    price: "from $299",
    note:  "Pull-out spray, SilkMove cartridge, chrome plated",
    url:   "https://www.bunnings.com.au/tapware",
    tags:  ["chrome"],
  },
];

const SPLASHBACK_PRODUCTS: Product[] = [
  {
    name:  "White Subway Vertical Stack 75×300",
    brand: "Beaumont Tiles",
    price: "from $39/m²",
    note:  "Gloss finish, BCA compliant, suits vertical or brick bond",
    url:   "https://www.beaumonttiles.com.au",
    tags:  ["white-subway"],
  },
  {
    name:  "Grey Subway Wall Tile 75×300",
    brand: "TileCloud",
    price: "from $45/m²",
    note:  "Cool charcoal-grey glaze, suits white or black cabinetry",
    url:   "https://www.tilecloud.com.au",
    tags:  ["grey-subway"],
  },
  {
    name:  "Calacatta Porcelain Slab 3000×1500",
    brand: "National Tiles",
    price: "from $290/m²",
    note:  "Full-height bookmatched slab, minimal grout lines",
    url:   "https://www.nationaltiles.com.au",
    tags:  ["calacatta-slab", "slab-match"],
  },
  {
    name:  "VJ Timber-Look PVC Panel",
    brand: "Laminex Australia",
    price: "from $85/sheet",
    note:  "Waterproof PVC VJ panel, easy cut-and-install, no grout",
    url:   "https://www.laminex.com.au",
    tags:  ["vj-panel"],
  },
  {
    name:  "Mirrored Glass Splashback — Custom Cut",
    brand: "Viridian / Local glazier",
    price: "from $180/m²",
    note:  "Toughened safety glass, back-painted or clear mirror",
    url:   "https://www.viridian.com.au",
    tags:  ["mirrored"],
  },
];

// ── Bedroom products ──────────────────────────────────────────────────────────

const BEDROOM_FLOORING_PRODUCTS: Product[] = [
  {
    name:  "Havwoods Engineered Oak Herringbone 90mm",
    brand: "Havwoods Australia",
    price: "from $135/m²",
    note:  "190mm × 620mm engineered boards, UV oil finish, click system",
    url:   "https://www.havwoods.com.au",
    tags:  ["engineered-oak-herringbone"],
  },
  {
    name:  "Quick-Step Intenso Oak Herringbone",
    brand: "Quick-Step / Carpet Call",
    price: "from $89/m²",
    note:  "HDF core, scratch-resistant, suitable for underfloor heating",
    url:   "https://www.carpetcall.com.au",
    tags:  ["engineered-oak-herringbone", "ash", "ash-rustic"],
  },
  {
    name:  "Herringbone Stone-Look Porcelain 75×300",
    brand: "Beaumont Tiles",
    price: "from $95/m²",
    note:  "Matt porcelain, R10 slip rated, cool stone-grey tone",
    url:   "https://www.beaumonttiles.com.au",
    tags:  ["herringbone-stone-grey", "herringbone-stone-white"],
  },
  {
    name:  "Hybrid Plank Flooring — Warm Oak",
    brand: "Carpet One / Godfrey Hirst",
    price: "from $45/m²",
    note:  "100% waterproof, click-lock, 6mm wear layer, beginner-friendly",
    url:   "https://www.carpetone.com.au",
    tags:  ["hybrid-plank"],
  },
  {
    name:  "SmartStrand Silk NZ Wool Carpet",
    brand: "Carpet Court",
    price: "from $65/m²",
    note:  "100% NZ wool loop pile, 4-star acoustic rating, warm underfoot",
    url:   "https://www.carpetcourt.com.au",
    tags:  ["wool-carpet"],
  },
  {
    name:  "Grind-and-Seal Polished Concrete",
    brand: "Boral / Local applicator",
    price: "from $80/m²",
    note:  "Existing slab preparation, 3-coat polyurethane topcoat, NATA tested",
    url:   "https://www.boral.com.au",
    tags:  ["polished-concrete"],
  },
  {
    name:  "Havwoods Ash Blonde Engineered Boards",
    brand: "Havwoods Australia",
    price: "from $110/m²",
    note:  "Light ash tone, European oak, micro-bevel edge, click system",
    url:   "https://www.havwoods.com.au",
    tags:  ["ash", "beech"],
  },
];

const WALL_TREATMENT_PRODUCTS: Product[] = [
  {
    name:  "Dulux Limewash Interior Paint",
    brand: "Dulux / Bunnings",
    price: "from $79 / 4L",
    note:  "Authentic textured limewash, apply with brush for organic depth",
    url:   "https://www.dulux.com.au",
    tags:  ["limewash-paint", "feature-paint"],
  },
  {
    name:  "Taubmans Endure Interior — Feature Wall",
    brand: "Taubmans / Bunnings",
    price: "from $59 / 4L",
    note:  "Low-sheen, washable, 10-yr guarantee, full Australian colour range",
    url:   "https://www.taubmans.com.au",
    tags:  ["feature-paint"],
  },
  {
    name:  "Microcement Wall System — Poured Look",
    brand: "Altex Coatings (AU)",
    price: "from $95/m² installed",
    note:  "2-part cement polymer, seamless finish, applicator-supplied warranty",
    url:   "https://www.altexcoatings.com",
    tags:  ["microcement"],
  },
  {
    name:  "Venetian Plaster — Marmorino Classic",
    brand: "Rockcote / Haymes Paints",
    price: "from $120/m² installed",
    note:  "Italian marble-dust plaster, multi-layer burnished finish",
    url:   "https://www.rockcote.com.au",
    tags:  ["venetian-plaster"],
  },
  {
    name:  "VJ Panel Kit 2400×1200 — Primed",
    brand: "Laminex / Bunnings",
    price: "from $65/sheet",
    note:  "Primed MDF VJ panel, paint-ready, suits coastal or Hamptons style",
    url:   "https://www.bunnings.com.au/building",
    tags:  ["vj-paneling"],
  },
  {
    name:  "Scyon Oblique Shiplap Cladding",
    brand: "James Hardie",
    price: "from $48/m²",
    note:  "Fibre-cement horizontal shiplap, pre-primed, low-maintenance",
    url:   "https://www.jameshardie.com.au",
    tags:  ["shiplap-paneling"],
  },
  {
    name:  "Raw Timber Batten Kit — Black Steel",
    brand: "Jason Industries / Bunnings",
    price: "from $95/m²",
    note:  "Vertical 42mm battens on powdercoat backing track, DIY-friendly",
    url:   "https://www.bunnings.com.au",
    tags:  ["timber-battens"],
  },
  {
    name:  "Milton & King Botanical Wallpaper",
    brand: "Milton & King (AU Made)",
    price: "from $89/roll",
    note:  "Printed in Brisbane, paste-the-wall, repositionable",
    url:   "https://www.miltonandking.com/au",
    tags:  ["botanical-wallpaper", "designer-wallpaper"],
  },
  {
    name:  "Designer Grasscloth Wallpaper",
    brand: "Porter's Paints / Haymes",
    price: "from $120/roll",
    note:  "Woven natural fibre on paper backing, tactile organic texture",
    url:   "https://www.porterspaints.com",
    tags:  ["designer-wallpaper"],
  },
  {
    name:  "Travertine Feature Wall Tile 400×400",
    brand: "Beaumont Tiles",
    price: "from $129/m²",
    note:  "Honed travertine, unfilled voids, matte finish — sealing required",
    url:   "https://www.beaumonttiles.com.au",
    tags:  ["stone-veneer"],
  },
];

const BEDROOM_LIGHTING_PRODUCTS: Product[] = [
  {
    name:  "Philips Hue Gradient Lightstrip — Cove",
    brand: "Philips Hue / JB Hi-Fi",
    price: "from $199",
    note:  "Dimmable RGBW LED strip, app-controlled, fits 2–5m coves",
    url:   "https://www.jbhifi.com.au",
    tags:  ["led-cove"],
  },
  {
    name:  "Osram LED Cove Strip 2700K",
    brand: "Bunnings Warehouse",
    price: "from $49 / 5m",
    note:  "Warm white 2700K, IP20 indoor rated, dimmable driver required",
    url:   "https://www.bunnings.com.au/lighting",
    tags:  ["led-cove"],
  },
  {
    name:  "Pierlite Atom 10W LED Downlight",
    brand: "Pierlite / Clipsal",
    price: "from $45 each",
    note:  "Dimmable, high CRI 90+, IC-4 rated, suits sloped ceilings",
    url:   "https://www.pierlite.com.au",
    tags:  ["architectural-downlights"],
  },
  {
    name:  "Muuto E27 Unfold Bedside Pendant",
    brand: "Living Edge (AU)",
    price: "from $495",
    note:  "Danish-designed, opal glass diffuser, suits 2.4m+ ceiling height",
    url:   "https://www.livingedge.com.au",
    tags:  ["statement-pendant"],
  },
  {
    name:  "Flos IC S1 Pendant",
    brand: "Space Furniture (AU)",
    price: "from $890",
    note:  "Italian-made, borosilicate glass sphere, E27 base",
    url:   "https://www.spacefurniture.com.au",
    tags:  ["statement-pendant"],
  },
];

const STORAGE_PRODUCTS: Product[] = [
  {
    name:  "Hettich Mirror Sliding Robe System",
    brand: "Hettich / Bunnings",
    price: "from $380/m",
    note:  "Full-height mirror glass sliders, soft-close track, DIY flatpack",
    url:   "https://www.bunnings.com.au/wardrobes",
    tags:  ["built-in-mirror-sliders"],
  },
  {
    name:  "Custom Walk-in Robe — Kinsman",
    brand: "Kinsman",
    price: "from $4,500 fitted",
    note:  "Fully fitted WIR with shelving, drawers & hanging, lifetime structural warranty",
    url:   "https://www.kinsman.com.au",
    tags:  ["custom-wir"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function filterProducts(products: Product[], tags: string[]): Product[] {
  if (!tags.length) return products.slice(0, 2);
  const matched = products.filter((p) => p.tags.some((t) => tags.includes(t)));
  return matched.length ? matched.slice(0, 2) : products.slice(0, 2);
}

function tileTagsFromOption(tile: TileOption | null | undefined): string[] {
  if (!tile) return [];
  const name = tile.name.toLowerCase();
  const tags: string[] = [];
  if (name.includes("terrazzo"))   tags.push("terrazzo");
  if (name.includes("zellige"))    tags.push("zellige");
  if (name.includes("herringbone")) tags.push("herringbone");
  if (name.includes("subway"))     tags.push("subway");
  if (name.includes("travertine")) tags.push("honed-travertine");
  if (name.includes("penny"))      tags.push("penny-rounds");
  if (name.includes("large"))      tags.push("large-format");
  if (name.includes("stone"))      tags.push("stone");
  if (name.includes("timber") || name.includes("oak") || name.includes("wood")) tags.push("timber", "wood");
  if (name.includes("white") || name.includes("subway")) tags.push("white");
  return tags;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col gap-2 p-4 rounded-2xl border-2 border-sand-200 bg-white/70",
        "hover:border-terracotta/40 hover:bg-terracotta/5 transition-all duration-200 group",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-charcoal/80 leading-snug group-hover:text-terracotta transition-colors">
            {product.name}
          </p>
          <p className="text-[10px] text-charcoal/45 mt-0.5">{product.brand}</p>
        </div>
        <ExternalLink size={12} className="text-charcoal/30 group-hover:text-terracotta flex-shrink-0 mt-0.5 transition-colors" />
      </div>
      <p className="text-[10px] text-charcoal/55 leading-snug">{product.note}</p>
      <p className="text-xs font-bold text-terracotta">{product.price}</p>
    </a>
  );
}

function Section({ title, products }: { title: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mb-2">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {products.map((p) => <ProductCard key={p.name} product={p} />)}
      </div>
    </div>
  );
}

// ── Room-specific section renderers ───────────────────────────────────────────

function BathroomSections({
  floorTile, wallTile, vanity, tapware,
}: {
  floorTile: TileOption | null | undefined;
  wallTile:  TileOption | null | undefined;
  vanity:    VanityType | string | null | undefined;
  tapware:   TapwareFinish | string | null | undefined;
}) {
  const vanityProducts  = filterProducts(VANITY_PRODUCTS,  vanity  ? [vanity as string]  : []);
  const tapwareProducts = filterProducts(TAPWARE_PRODUCTS, tapware ? [tapware as string] : []);
  const floorProducts   = filterProducts(TILE_PRODUCTS, tileTagsFromOption(floorTile));
  const wallProducts    = filterProducts(TILE_PRODUCTS, tileTagsFromOption(wallTile));
  return (
    <>
      <Section title="Vanity"           products={vanityProducts} />
      <Section title="Tapware & Mixers" products={tapwareProducts} />
      <Section title="Floor Tiles"      products={floorProducts} />
      <Section title="Wall Tiles"       products={wallProducts} />
    </>
  );
}

function KitchenSections({ sel }: { sel: KitchenSelections }) {
  const cabinetryProducts  = filterProducts(CABINETRY_PRODUCTS,       sel.cabinetry  ? [sel.cabinetry]  : []);
  const benchtopProducts   = filterProducts(BENCHTOP_PRODUCTS,         sel.benchtop   ? [sel.benchtop]   : []);
  const mixerProducts      = filterProducts(KITCHEN_MIXER_PRODUCTS,    sel.mixer      ? [sel.mixer]      : []);
  const splashbackProducts = filterProducts(SPLASHBACK_PRODUCTS,       sel.splashback ? [sel.splashback] : []);
  return (
    <>
      <Section title="Cabinetry"  products={cabinetryProducts} />
      <Section title="Benchtops"  products={benchtopProducts} />
      <Section title="Sink Mixer" products={mixerProducts} />
      <Section title="Splashback" products={splashbackProducts} />
    </>
  );
}

function BedroomSections({ sel }: { sel: BedroomSelections }) {
  const flooringProducts = filterProducts(BEDROOM_FLOORING_PRODUCTS,  sel.flooring      ? [sel.flooring]      : []);
  const wallProducts     = filterProducts(WALL_TREATMENT_PRODUCTS,     sel.wallTreatment ? [sel.wallTreatment] : []);
  const lightingProducts = filterProducts(BEDROOM_LIGHTING_PRODUCTS,   sel.lighting      ? [sel.lighting]      : []);
  const storageProducts  = filterProducts(STORAGE_PRODUCTS,            sel.storage       ? [sel.storage]       : []);
  return (
    <>
      <Section title="Flooring"        products={flooringProducts} />
      <Section title="Wall Treatment"  products={wallProducts} />
      <Section title="Lighting"        products={lightingProducts} />
      <Section title="Storage / Robes" products={storageProducts} />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface GetTheLookModalProps {
  onClose:           () => void;
  roomType?:         RoomType;
  // Bathroom props
  floorTile?:        TileOption | null | undefined;
  wallTile?:         TileOption | null | undefined;
  vanity?:           VanityType | string | null | undefined;
  tapware?:          TapwareFinish | string | null | undefined;
  // Kitchen / bedroom props
  kitchenSelections?: KitchenSelections | null;
  bedroomSelections?: BedroomSelections | null;
}

const ROOM_COMPLIANCE: Record<string, string> = {
  bathroom: "AU Standards · WELS ratings · AS 3718 / AS 3662 compliance",
  kitchen:  "AU Standards · WELS ratings · AS 3718 compliance",
  bedroom:  "Australian Made & AU retailers · QLD 2026 market rates",
};

export default function GetTheLookModal({
  onClose,
  roomType = "bathroom",
  floorTile, wallTile, vanity, tapware,
  kitchenSelections,
  bedroomSelections,
}: GetTheLookModalProps) {
  const complianceLine = ROOM_COMPLIANCE[roomType] ?? ROOM_COMPLIANCE.bathroom;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-2xl max-h-[85vh] flex flex-col",
        "bg-sand-50 rounded-3xl shadow-warm-xl overflow-hidden",
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-terracotta/10 flex items-center justify-center">
              <ShoppingBag size={15} className="text-terracotta" />
            </div>
            <div>
              <p className="text-sm font-bold text-charcoal">Get the Look</p>
              <p className="text-[10px] text-charcoal/45">{complianceLine}</p>
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
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          <p className="text-xs text-charcoal/50 leading-relaxed">
            Products matched to your selections — sourced from Australian retailers.
            {roomType === "bathroom" && " All tapware meets WELS ratings and AS 3718 / AS 3662 compliance."}
            {roomType === "kitchen"  && " All tapware meets WELS ratings and AS 3718 compliance."}
            {" "}Prices are indicative — confirm with retailer.
          </p>

          {roomType === "kitchen" && kitchenSelections && (
            <KitchenSections sel={kitchenSelections} />
          )}

          {roomType === "bedroom" && bedroomSelections && (
            <BedroomSections sel={bedroomSelections} />
          )}

          {roomType === "bathroom" && (
            <BathroomSections
              floorTile={floorTile}
              wallTile={wallTile}
              vanity={vanity}
              tapware={tapware}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sand-200 bg-white/50 flex-shrink-0">
          <p className="text-[10px] text-charcoal/35 text-center leading-snug">
            Reno Ready is not affiliated with these retailers. Links open external sites.
            Always verify product specifications with a licensed tradesperson before purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
