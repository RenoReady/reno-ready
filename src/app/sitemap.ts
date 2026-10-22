import type { MetadataRoute } from "next";

const SITE = "https://www.renoready.com.au";

/** Public marketing pages only; the app, account and share pages stay out */
const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/",             priority: 1.0, changeFrequency: "weekly" },
  { path: "/bathroom",     priority: 0.9, changeFrequency: "weekly" },
  { path: "/kitchen",      priority: 0.9, changeFrequency: "weekly" },
  { path: "/bedroom",      priority: 0.9, changeFrequency: "weekly" },
  { path: "/for-builders", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pricing",      priority: 0.8, changeFrequency: "monthly" },
  { path: "/guide",        priority: 0.7, changeFrequency: "monthly" },
  { path: "/gallery",      priority: 0.7, changeFrequency: "monthly" },
  { path: "/hidden-costs", priority: 0.7, changeFrequency: "monthly" },
  { path: "/terms",        priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy",      priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map(({ path, priority, changeFrequency }) => ({ url: `${SITE}${path === "/" ? "" : path}`, lastModified, changeFrequency, priority }));
}
