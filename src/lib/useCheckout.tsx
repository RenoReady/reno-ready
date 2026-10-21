"use client";

/**
 * useCheckout — starts Stripe checkout for a plan.
 *
 * Paid access is attached to the signed-in account, so a signed-out buyer
 * gets the Google sign-in modal first. The chosen plan is remembered across
 * the OAuth redirect and checkout resumes on its own when they come back.
 *
 *   const { start, pendingPlan, error, authModal } = useCheckout();
 *   <button onClick={() => start("projectPass")} />
 *   {authModal}
 */

import { useCallback, useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import { createCheckoutSession } from "@/app/actions/stripe";
import { PLANS, isPlanKey, type PlanKey } from "@/lib/plans";
import { ROOM_PAGES } from "@/lib/roomPages";
import { useBuilderStore } from "@/lib/store";

const PENDING_KEY = "reno_ready_pending_plan";

function readPending(): PlanKey | null {
  try {
    const v = sessionStorage.getItem(PENDING_KEY);
    return isPlanKey(v) ? v : null;
  } catch { return null; }
}

function writePending(plan: PlanKey | null) {
  try {
    if (plan) sessionStorage.setItem(PENDING_KEY, plan);
    else sessionStorage.removeItem(PENDING_KEY);
  } catch { /* storage blocked — they'll just click again after signing in */ }
}

/** @param resumeFor  plan(s) this caller should resume after a sign-in redirect */
export function useCheckout(resumeFor?: PlanKey | PlanKey[]) {
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [authFor,     setAuthFor]     = useState<PlanKey | null>(null);

  const start = useCallback(async (plan: PlanKey) => {
    setError(null);
    setPendingPlan(plan);
    try {
      // /preview reads the in-memory design, which checkout wipes, so come back to the room page
      const here = window.location.pathname;
      const back = here === "/preview" ? ROOM_PAGES[useBuilderStore.getState().roomType].path : here;
      const result = await createCheckoutSession(plan, back);
      if ("url" in result) {
        writePending(null);
        window.location.href = result.url;
        return;   // keep the spinner while the browser navigates
      }
      if (result.needsAuth) {
        writePending(plan);
        setAuthFor(plan);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setPendingPlan(null);
  }, []);

  // Back from Google with a plan still waiting: carry on to checkout
  useEffect(() => {
    const pending = readPending();
    if (!pending) return;
    const wanted = resumeFor === undefined ? null : Array.isArray(resumeFor) ? resumeFor : [resumeFor];
    if (!wanted?.includes(pending)) return;
    if (!new URLSearchParams(window.location.search).has("authed")) return;
    writePending(null);
    start(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authModal = authFor && (
    <AuthModal
      title="Sign in to continue"
      message={<>Sign in with Google so your <strong>{PLANS[authFor].label}</strong> is saved to your account. You&apos;ll go straight to secure checkout after.</>}
      onSuccess={() => { setAuthFor(null); start(authFor); }}
      onClose={() => { setAuthFor(null); writePending(null); }}
    />
  );

  return { start, pendingPlan, error, authModal };
}
