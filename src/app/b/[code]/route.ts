/**
 * /b/:code — short tracking link for builder outreach emails, e.g.
 * www.renoready.com.au/b/tpk-bathrooms
 *
 * Written into emails as plain text (mail apps turn it into a link), so it
 * never gets wrapped in a redirect. Records where the visitor came from
 * (source "outreach-<code>") the same way a UTM-tagged link would, then
 * sends them to /for-builders. Shows up in the admin journey and
 * attribution report, and on any sign-up or purchase that follows.
 *
 * First touch is never overwritten, matching src/proxy.ts.
 */
import { NextResponse, type NextRequest } from "next/server";
import { ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, encodeAttribution, type Attribution } from "@/lib/attribution";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const business = code.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50);
  const response = NextResponse.redirect(new URL("/for-builders", request.url), 302);

  if (!request.cookies.has(ATTRIBUTION_COOKIE)) {
    // The business goes in `source` (not just `content`): visit events and the
    // sign-up report only keep the source, and this is what tells them apart.
    const src: Attribution = {
      source: business ? `outreach-${business}` : "outreach", medium: "email", campaign: "builders", content: business || null,
      landing: "/for-builders", at: new Date().toISOString(),
    };
    response.cookies.set(ATTRIBUTION_COOKIE, encodeAttribution(src), {
      maxAge: ATTRIBUTION_MAX_AGE, path: "/", sameSite: "lax", httpOnly: true, secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}
