"use client";

/**
 * GetTheLookModal
 *
 * Displays Australian-sourced product recommendations that match the
 * user's material selections. Opens when "Get the Look" is clicked
 * below a generated bathroom preview.
 *
 * Products are curated to AU standards (WELS ratings, AS compliance).
 */

import { X, ExternalLink, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TileOption, VanityType, TapwareFinish } from "@/lib/types";

// ── Product catalogue ─────────────────────────────────────────────────────────

interface Product {
  name:     string;
  brand:    string;
  price:    string;     // e.g. "from $349"
  note:     string;     // short descriptor
  url:      string;     // AU retailer link
  tags:     string[];   // which selector values this matches
}

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

// ── Main component ────────────────────────────────────────────────────────────

interface GetTheLookModalProps {
  onClose:   () => void;
  floorTile: TileOption | null | undefined;
  wallTile:  TileOption | null | undefined;
  vanity:    VanityType | string | null | undefined;
  tapware:   TapwareFinish | string | null | undefined;
}

export default function GetTheLookModal({
  onClose, floorTile, wallTile, vanity, tapware,
}: GetTheLookModalProps) {
  const vanityProducts  = filterProducts(VANITY_PRODUCTS,  vanity  ? [vanity as string]  : []);
  const tapwareProducts = filterProducts(TAPWARE_PRODUCTS, tapware ? [tapware as string] : []);
  const floorProducts   = filterProducts(TILE_PRODUCTS, tileTagsFromOption(floorTile));
  const wallProducts    = filterProducts(TILE_PRODUCTS, tileTagsFromOption(wallTile));

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
              <p className="text-[10px] text-charcoal/45">AU Standards · Sourced from Australian retailers</p>
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
            Products matched to your selections. All items meet Australian plumbing standards
            (WELS ratings, AS 3718 / AS 3662 compliance). Prices are indicative — confirm
            with retailer.
          </p>

          <Section title="Vanity"           products={vanityProducts} />
          <Section title="Tapware & Mixers" products={tapwareProducts} />
          <Section title="Floor Tiles"      products={floorProducts} />
          <Section title="Wall Tiles"       products={wallProducts} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sand-200 bg-white/50 flex-shrink-0">
          <p className="text-[10px] text-charcoal/35 text-center leading-snug">
            Reno Ready is not affiliated with these retailers. Links open external sites.
            Always verify product specifications with a licensed plumber before purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
