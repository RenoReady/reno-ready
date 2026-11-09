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
import { track } from "@/lib/track";
import { PLANS, isPlanKey, type PlanKey } from "@/lib/plans";
import { ROOM_PAGES } from "@/lib/roomPages";
import { useBuilderStore } from "@/lib/store";

const PENDING_KEY = "reno_ready_pending_plan";

/** Saved as "plan" or "plan:PROMO", so a founder checkout keeps its code across sign-in */
function readPending(): { plan: PlanKey; promo?: string } | null {
  try {
    const [plan, promo] = (sessionStorage.getItem(PENDING_KEY) ?? "").split(":");
    return isPlanKey(plan) ? { plan, promo: promo || undefined } : null;
  } catch { return null; }
}

function writePending(plan: PlanKey | null, promo?: string) {
  try {
    if (plan) sessionStorage.setItem(PENDING_KEY, promo ? `${plan}:${promo}` : plan);
    else sessionStorage.removeItem(PENDING_KEY);
  } catch { /* storage blocked — they'll just click again after signing in */ }
}

/**
 * @param resumeFor    plan(s) this caller should resume after a sign-in redirect
 * @param resumePromo  the promo code this caller checks out with, so the founder
 *                     button and the plain Pro button don't both resume
 */
export function useCheckout(resumeFor?: PlanKey | PlanKey[], resumePromo?: string) {
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [authFor,     setAuthFor]     = useState<{ plan: PlanKey; promo?: string } | null>(null);

  /** @param promo  FOUNDER_OFFER.code for the founding member price */
  const start = useCallback(async (plan: PlanKey, promo?: string) => {
    setError(null);
    setPendingPlan(plan);
    try {
      // /preview reads the in-memory design, which checkout wipes, so come back to the room page
      const here = window.location.pathname;
      const back = here === "/preview" ? ROOM_PAGES[useBuilderStore.getState().roomType].path : here;
      const result = await createCheckoutSession(plan, back, promo);
      if ("url" in result) {
        writePending(null);
        track("checkout", { detail: promo ? `${plan}:${promo}` : plan });
        window.location.href = result.url;
        return;   // keep the spinner while the browser navigates
      }
      if (result.needsAuth) {
        writePending(plan, promo);
        setAuthFor({ plan, promo });
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
    if (!wanted?.includes(pending.plan) || pending.promo !== resumePromo) return;
    if (!new URLSearchParams(window.location.search).has("authed")) return;
    writePending(null);
    start(pending.plan, pending.promo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authModal = authFor && (
    <AuthModal
      title="Sign in to continue"
      message={<>Sign in with Google so your <strong>{PLANS[authFor.plan].label}</strong> is saved to your account. You&apos;ll go straight to secure checkout after.</>}
      onSuccess={() => { setAuthFor(null); start(authFor.plan, authFor.promo); }}
      onClose={() => { setAuthFor(null); writePending(null); }}
    />
  );

  return { start, pendingPlan, error, authModal };
}
