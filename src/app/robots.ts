import type { MetadataRoute } from "next";

/**
 * Keeps crawlers out of the app and private pages. Share links (/s/…) are left
 * crawlable on purpose: they carry noindex themselves, and some link-preview
 * bots obey robots.txt, so blocking them would break the preview when a
 * builder texts a link to a client.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/account", "/account-deleted", "/payment/", "/preview", "/connect", "/auth/", "/unsubscribed"],
    },
    sitemap: "https://www.renoready.com.au/sitemap.xml",
    host: "https://www.renoready.com.au",
  };
}
