/**
 * Reno Ready — central configuration
 *
 * Single source of truth for admin email + lead-notification destination.
 * Used by:
 *   - middleware.ts        (gates /admin)
 *   - app/admin/page.tsx   (verifies session email)
 *   - app/actions/contact.ts (Resend destination fallback)
 *
 * The runtime ALWAYS prefers the env var if set; the literal fallback below
 * is only used during local dev / first deploy before env config is in place.
 *
 * ⚠️  REPLACE the hardcoded fallback with your real Gmail before going live.
 */

const ADMIN_EMAIL_FALLBACK = "braidenboone77@gmail.com";

/** Email of the single user permitted to view /admin */
export const ADMIN_EMAIL: string =
  process.env.ADMIN_EMAIL?.trim() || ADMIN_EMAIL_FALLBACK;

/** Where Resend lead-notification emails are delivered (defaults to ADMIN_EMAIL) */
export const LEAD_NOTIFICATION_DESTINATION: string =
  process.env.CONTACT_EMAIL_DESTINATION?.trim() || ADMIN_EMAIL;

/** Verified Resend sender. Defaults to Resend's onboarding domain if unset. */
export const RESEND_FROM: string =
  process.env.RESEND_FROM_EMAIL?.trim() || "Reno Ready <onboarding@resend.dev>";

/** Day pass price in cents — used for Total Revenue calc on the admin dashboard */
export const PAID_USER_PRICE_CENTS = 1_900;  // $19.00 AUD
