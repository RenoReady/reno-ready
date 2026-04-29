/**
 * Project Brief — logic engine for the 3-question pre-generation brief.
 *
 * All dollar figures are sourced from real Australian renovation invoices:
 *   • Asbestos Cleanaway INV2652 (QLD, Feb 2026) — $2,271.50 inc. GST
 *   • Millennium Glass #27532 (QLD, Mar 2026)    — $1,925.00 inc. GST
 *   • BDW Quotation #235561 (QLD, Jan 2026)      — $3,484.44 inc. GST
 */

// ── Types ──────────────────────────────────────────────────────────

export type BudgetTier       = "value" | "standard" | "premium";
export type RenovationScope  = "full-stripout" | "cosmetic-refresh";

export interface ProjectBrief {
  yearBuilt:  number;           // e.g. 1985
  budgetTier: BudgetTier;
  scope:      RenovationScope;
}

// ── Asbestos ───────────────────────────────────────────────────────

/** Year cutoff: homes built before this are asbestos-risk in Australia */
export const ASBESTOS_THRESHOLD_YEAR = 1990;

/**
 * Total cost from INV2652 (Asbestos Cleanaway, Feb 2026):
 *   Bathroom stripout: $1,900 + Asbestos testing: $165 + GST 10% = $2,271.50
 */
export const ASBESTOS_COST_INC_GST = 2_272;

export function needsAsbestosCheck(brief: ProjectBrief | null): boolean {
  return !!brief && brief.yearBuilt > 0 && brief.yearBuilt < ASBESTOS_THRESHOLD_YEAR;
}

// ── Real invoice benchmarks by budget tier ─────────────────────────

/**
 * Shower screen supply + install.
 * Premium figure from Millennium Glass #27532:
 *   $1,550 (screen) + $200 (Enduro-shield) + GST = $1,925
 */
export const SHOWER_SCREEN_COST: Record<BudgetTier, number> = {
  value:    1_100,   // basic semi-frameless, chrome fittings
  standard: 1_450,   // mid-range, choice of finish
  premium:  1_925,   // semi-frameless, brushed brass + Enduro-shield (exact invoice)
};

/**
 * Hardware & fixtures — toilet, vanity, tapware, accessories.
 * Premium figure from BDW #235561:
 *   $3,167.69 ex GST → $3,484.44 inc. GST (Urban Brass / Brushed Gold package)
 */
export const HARDWARE_COST: Record<BudgetTier, number> = {
  value:    1_600,   // economy toilet + vanity + chrome tapware
  standard: 2_400,   // mid-range suite
  premium:  3_484,   // BDW invoice figure — brushed gold/urban brass package
};

/** Strip-out scope adders */
export const STRIPOUT_LABOUR_COST = 1_500;   // demo + skip bin + clean waste
export const WATERPROOFING_COST   =   800;   // membrane for new wet area surfaces
export const COSMETIC_PREP_COST   =   350;   // surface prep for refresh-only

// ── Tier multipliers (applied to base build estimate) ──────────────

export const TIER_MULTIPLIER: Record<BudgetTier, number> = {
  value:    0.78,
  standard: 1.00,
  premium:  1.28,
};

// ── Prompt injections ──────────────────────────────────────────────

export const TIER_PROMPT_SUFFIX: Record<BudgetTier, string> = {
  value:
    "This is a budget-conscious renovation. Use clean, simple finishes — white subway tiles, " +
    "chrome tapware, and a streamlined vanity. Neat and functional, like a well-maintained property.",
  standard: "",   // use normal prompt — no override
  premium:
    "This is a luxury premium renovation. Render with brushed brass or matte black tapware, " +
    "high-end natural stone (marble, travertine, or honed limestone), a hotel-grade frameless " +
    "or semi-frameless shower screen, and spa-quality staging. Ultra-premium photorealistic finish.",
};

export const SCOPE_PROMPT_SUFFIX: Record<RenovationScope, string> = {
  "full-stripout":
    "This is a complete gut renovation from bare walls — no constraints on layout, " +
    "plumbing can be repositioned.",
  "cosmetic-refresh":
    "This is a cosmetic surface refresh only — retain all existing plumbing positions, " +
    "fixture locations, and room layout. Focus changes on surfaces and finishes only.",
};

// ── Itemised cost breakdown ────────────────────────────────────────

export interface BriefCostItem {
  label:    string;
  amount:   number;        // AUD inc. GST
  detail?:  string;
  warning?: boolean;       // renders with amber highlight
  source?:  string;        // e.g. "Asbestos Cleanaway INV2652"
}

/**
 * Returns the extra line items driven by the project brief.
 * These are displayed BELOW the existing estimate breakdown.
 */
export function calcBriefCostItems(brief: ProjectBrief): BriefCostItem[] {
  const items: BriefCostItem[] = [];

  // 1. Asbestos — triggered by pre-1990 build year
  if (needsAsbestosCheck(brief)) {
    items.push({
      label:   "Asbestos Testing & Removal",
      amount:  ASBESTOS_COST_INC_GST,
      detail:  "Full bathroom stripout + testing. Pre-1990 homes in QLD commonly contain asbestos in wet-area sheeting.",
      warning: true,
      source:  "Asbestos Cleanaway INV2652, Feb 2026",
    });
  }

  // 2. Scope — demolition or prep
  if (brief.scope === "full-stripout") {
    items.push({
      label:  "Strip-out & Demolition",
      amount: STRIPOUT_LABOUR_COST + WATERPROOFING_COST,
      detail: "Labour, skip bin, clean waste disposal + new waterproofing membrane",
    });
  } else {
    items.push({
      label:  "Surface Prep & Waterproofing",
      amount: COSMETIC_PREP_COST,
      detail: "Light prep and waterproofing touch-up for cosmetic refresh",
    });
  }

  // 3. Shower screen — tier-based, real invoice anchor for premium
  items.push({
    label:  "Shower Screen (supply + install)",
    amount: SHOWER_SCREEN_COST[brief.budgetTier],
    detail:
      brief.budgetTier === "premium"
        ? "Semi-frameless, 6mm toughened glass, brushed brass hardware, Enduro-shield coating"
        : "Semi-frameless shower screen, supplied and installed",
    source: brief.budgetTier === "premium" ? "Millennium Glass #27532, Mar 2026" : undefined,
  });

  // 4. Fixtures & hardware — tier-based, real invoice anchor for premium
  items.push({
    label:  "Fixtures & Hardware",
    amount: HARDWARE_COST[brief.budgetTier],
    detail:
      brief.budgetTier === "premium"
        ? "Rimless toilet, floating vanity + ceramic top, brushed gold tapware, heated towel rail, accessories"
        : "Toilet suite, vanity, tapware, bathroom accessories",
    source: brief.budgetTier === "premium" ? "BDW Quote #235561, Jan 2026" : undefined,
  });

  return items;
}

/** Total of all brief-driven line items */
export function calcBriefTotal(brief: ProjectBrief): number {
  return calcBriefCostItems(brief).reduce((sum, item) => sum + item.amount, 0);
}
