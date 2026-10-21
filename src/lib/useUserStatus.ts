"use client";

/**
 * useUserStatus
 *
 * Fetches the current user's plan and allowance from /api/user-status and
 * caches the result for 30 seconds so repeated renders don't spam the API.
 *
 * Usage:
 *   const { tier, isPremium, rendersUsed, rendersLimit, loading } = useUserStatus();
 */

import { useEffect, useState, useCallback } from "react";
import { FREE_GENERATION_LIMIT, TIER_LIMITS, type Tier } from "@/lib/plans";

export interface UserStatus {
  userId:          string | null;
  isAdmin:         boolean;
  /** A paid plan (pass or Pro) is active */
  isPremium:       boolean;
  tier:            Tier;
  generationCount: number;
  freeLimit:       number;
  rendersUsed:     number;
  /** null = no limit */
  rendersLimit:    number | null;
  editsUsed:       number;
  editsLimit:      number | null;
  loading:         boolean;
}

const DEFAULT: UserStatus = {
  userId:          null,
  isAdmin:         false,
  isPremium:       false,
  tier:            "free",
  generationCount: 0,
  freeLimit:       FREE_GENERATION_LIMIT,
  rendersUsed:     0,
  rendersLimit:    TIER_LIMITS.free.renders,
  editsUsed:       0,
  editsLimit:      TIER_LIMITS.free.edits,
  loading:         true,
};

// Module-level cache so the value persists across re-renders
let _cache: { data: Omit<UserStatus, "loading">; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

/** Paid features (2K, PDF Pro Reports, no watermark) are unlocked */
export function hasProAccess(s: Pick<UserStatus, "isAdmin" | "isPremium">): boolean {
  return s.isAdmin || s.isPremium;
}

/** Pro-only features (4K exports) */
export function hasProTier(s: Pick<UserStatus, "tier">): boolean {
  return s.tier === "pro" || s.tier === "admin";
}

/** How many renders / edits are left (null = no limit) */
export function remaining(s: UserStatus, kind: "render" | "edit", localUsed = 0): number | null {
  const limit = kind === "render" ? s.rendersLimit : s.editsLimit;
  const used  = (kind === "render" ? s.rendersUsed : s.editsUsed) + localUsed;
  return limit === null ? null : Math.max(0, limit - used);
}

export function useUserStatus(refreshKey?: number): UserStatus {
  const [status, setStatus] = useState<UserStatus>(DEFAULT);

  const load = useCallback(async () => {
    // Return cached value if still fresh (unless a refresh was forced)
    if (_cache && Date.now() < _cache.expiresAt && refreshKey === undefined) {
      setStatus({ ..._cache.data, loading: false });
      return;
    }

    try {
      const res  = await fetch("/api/user-status", { cache: "no-store" });
      const data = { ...DEFAULT, ...(await res.json()) };
      _cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      setStatus({ ...data, loading: false });
    } catch {
      setStatus({ ...DEFAULT, loading: false });
    }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  return status;
}

/** Manually bust the module-level cache (call after a successful payment) */
export function bustUserStatusCache(): void {
  _cache = null;
}
