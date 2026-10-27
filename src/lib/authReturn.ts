/**
 * Where to send someone after Google sign-in.
 *
 * The page they signed in from travels in a short-lived cookie, not on the
 * OAuth return address: Supabase only accepts return addresses on its allow
 * list, and an unlisted one (e.g. /auth/callback?next=/bathroom) silently
 * falls back to the home page without signing the person in.
 */

export const RETURN_COOKIE = "rr_next";

/** Same-site paths only: "//host" or a full URL would be an open redirect */
export function safeReturnPath(raw: string | null | undefined, fallback = "/builder"): string {
  const path = raw ?? "";
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : fallback;
}
