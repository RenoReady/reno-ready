/**
 * Project Brief — logic engine for the 3-question pre-generation brief.
 *
 * All dollar figures are sourced from real Australian renovation invoices:
 *   • Asbestos Cleanaway INV2652 (QLD, Feb 2026) — $2,271.50 inc. GST
 *   • Millennium Glass #27532 (QLD, Mar 2026)    — $1,925.00 inc. GST
 *   • BDW Quotation #235561 (QLD, Jan 2026)      — $3,484.44 inc. GST
 */

// ── Types ──────────────────────────────────────────────────────────

export type PlumbingLayout  = "keep-layout" | "move-plumbing";
export type RenovationScope = "full-stripout" | "cosmetic-refresh";

export interface ProjectBrief {
  yearBuilt:      number;         // e.g. 1985
  plumbingLayout: PlumbingLayout;
  scope:          RenovationScope;
  bathroomCount:  1 | 2 | 3;     // 1 = sole bathroom → triggers hygiene advisory
}

// ── Asbestos ───────────────────────────────────────────────────────

/** Year cutoff: homes built before this are asbestos-risk in Australia */
export const ASBESTOS_THRESHOLD_YEAR = 1990;

/**
 * Total cost from INV2652 (Asbestos Cleanaway, Feb 2026):
 *   Bathroom stripout: $1,900 + Asbestos testing: $165 + GST 10% = $2,271.50
 */
export const ASBESTOS_COST_INC_GST = 2_272;

/**
 * Asbestos risk is triggered when:
 *  - The home was built before 1990 (high likelihood of ACM in wet-area sheeting)
 *  - AND the job disturbs walls/substrate: full strip-out OR moving plumbing
 *
 * A cosmetic refresh that keeps all existing layout rarely disturbs wall sheeting
 * and therefore carries lower risk. A full strip-out or plumbing move always does.
 */
export function needsAsbestosCheck(brief: ProjectBrief | null): boolean {
  if (!brief || brief.yearBuilt <= 0 || brief.yearBuilt >= ASBESTOS_THRESHOLD_YEAR) return false;
  return brief.scope === "full-stripout" || brief.plumbingLayout === "move-plumbing";
}

// ── Cost constants (conservative mid-range benchmarks) ─────────────

/**
 * Shower screen — standard mid-range semi-frameless (Millennium Glass anchor).
 * Invoice figure was $1,925 for premium; $1,450 is realistic for standard finish.
 */
export const SHOWER_SCREEN_COST_STANDARD = 1_450;

/**
 * Fixtures & hardware — toilet, vanity, tapware, accessories.
 * Calibrated to mid-range specification (e.g. Shelly Slim mixers at ~$232 ea.)
 * rather than the premium BDW quote ($3,484). Targets the $25k–$35k standard range.
 */
export const HARDWARE_COST_STANDARD = 2_000;

/** Plumbing relocation — drain repositioning + rough-in, estimate for standard move */
export const PLUMBING_RELOCATION_COST = 2_500;

/** Strip-out scope adders */
export const STRIPOUT_LABOUR_COST = 1_500;   // demo + skip bin + clean waste
export const WATERPROOFING_COST   =   800;   // membrane for new wet area surfaces
export const COSMETIC_PREP_COST   =   350;   // surface prep for refresh-only

// ── Prompt injections ──────────────────────────────────────────────

export const SCOPE_PROMPT_SUFFIX: Record<RenovationScope, string> = {
  "full-stripout":
    "This is a complete gut renovation from bare walls — no constraints on layout, " +
    "plumbing can be repositioned.",
  "cosmetic-refresh":
    "This is a cosmetic surface refresh only — retain all existing plumbing positions, " +
    "fixture locations, and room layout. Focus changes on surfaces and finishes only.",
};

export const PLUMBING_LAYOUT_PROMPT_SUFFIX: Record<PlumbingLayout, string> = {
  "keep-layout":   "",   // no extra instruction needed — default behaviour
  "move-plumbing": "Plumbing positions and wall layouts may be optimised for the best result.",
};

// ── Itemised cost breakdown ────────────────────────────────────────

export interface BriefCostItem {
  label:    string;
  amount:   number;        // AUD inc. GST
  detail?:  string;
  warning?: boolean;       // renders with amber highlight
  source?:  string;        // invoice reference
}

/**
 * Returns the extra line items driven by the project brief.
 * All figures are conservative mid-range estimates unless sourced from invoices.
 */
export function calcBriefCostItems(brief: ProjectBrief): BriefCostItem[] {
  const items: BriefCostItem[] = [];

  // 1. Asbestos — only when walls will be disturbed in a pre-1990 home
  if (needsAsbestosCheck(brief)) {
    items.push({
      label:   "Asbestos Testing & Removal",
      amount:  ASBESTOS_COST_INC_GST,
      detail:  "Full bathroom stripout + testing. Pre-1990 homes commonly contain asbestos in wet-area sheeting.",
      warning: true,
      source:  "Asbestos Cleanaway INV2652, Feb 2026",
    });
  }

  // 2. Scope — demolition or light prep
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

  // 3. Plumbing relocation (if moving fixtures or walls)
  if (brief.plumbingLayout === "move-plumbing") {
    items.push({
      label:  "Plumbing Relocation",
      amount: PLUMBING_RELOCATION_COST,
      detail: "Repositioning drain points and rough-in plumbing. Final cost depends on slab type and move distance.",
    });
  }

  // 4. Shower screen — standard mid-range (Millennium Glass invoice anchor)
  items.push({
    label:  "Shower Screen (supply + install)",
    amount: SHOWER_SCREEN_COST_STANDARD,
    detail: "Semi-frameless, choice of finish, supply and install",
    source: "Based on Millennium Glass #27532, Mar 2026",
  });

  // 5. Fixtures & hardware — calibrated to Shelly Slim mixer level
  items.push({
    label:  "Fixtures & Hardware",
    amount: HARDWARE_COST_STANDARD,
    detail: "Toilet suite, vanity, mid-range tapware (e.g. Shelly Slim mixers ~$232 ea.), bathroom accessories",
  });

  return items;
}

/** Total of all brief-driven line items */
export function calcBriefTotal(brief: ProjectBrief): number {
  return calcBriefCostItems(brief).reduce((sum, item) => sum + item.amount, 0);
}
