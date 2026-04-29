"use client";

/**
 * useUserStatus
 *
 * Fetches the current user's auth + subscription state from
 * /api/user-status and caches the result for 30 seconds so
 * repeated renders don't spam the API.
 *
 * Usage:
 *   const { isAdmin, isPremium, generationCount, freeLimit, loading } = useUserStatus();
 */

import { useEffect, useState, useCallback } from "react";

export interface UserStatus {
  userId:          string | null;
  isAdmin:         boolean;
  isPremium:       boolean;
  generationCount: number;
  freeLimit:       number;
  loading:         boolean;
}

const DEFAULT: UserStatus = {
  userId:          null,
  isAdmin:         false,
  isPremium:       false,
  generationCount: 0,
  freeLimit:       3,
  loading:         true,
};

// Module-level cache so the value persists across re-renders
let _cache: { data: Omit<UserStatus, "loading">; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

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
      const data = await res.json();
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
