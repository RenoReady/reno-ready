/**
 * /s/:id — a design shared with a client (Reno Ready Pro).
 * Public but unlisted: no account needed, not indexed by search engines.
 *
 * Branded as the business that shared it (their report branding), with a
 * reply panel so the client can approve it or ask a question.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Mail, Phone } from "lucide-react";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import ShareReplyPanel from "@/components/share/ShareReplyPanel";
import { getShare, markShareViewed, shareOwner } from "@/lib/shareStore";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const share = await getShare((await params).id).catch(() => null);
  const brand = share ? (await shareOwner(share.ownerId).catch(() => null))?.brand : null;
  return {
    // branded links carry the business's name, not "| Reno Ready"
    title: share && brand ? { absolute: `${share.title} · ${brand.businessName}` } : share ? share.title : "Shared design",
    description: share ? `A ${share.roomType} renovation design${brand ? ` from ${brand.businessName}` : ""}.` : undefined,
    robots: { index: false, follow: false },
    ...(share && { openGraph: { title: share.title, images: [{ url: share.afterUrl }] } }),
  };
}

export default async function SharedDesignPage({ params }: Props) {
  const share = await getShare((await params).id).catch(() => null);
  if (!share) notFound();

  const [{ brand }, viewer] = await Promise.all([
    shareOwner(share.ownerId).catch(() => ({ brand: null })),
    createSupabaseServerClient().then((s) => s.auth.getUser()).then((r) => r.data.user).catch(() => null),
  ]);
  // the owner checking their own link doesn't count as the client opening it
  // (inline rather than after(): it only happens once per link, on the first visit)
  if (viewer?.id !== share.ownerId && !share.firstViewedAt) await markShareViewed(share.id).catch((e) => console.error("[share] mark viewed:", e));

  const accent = brand?.accent ?? "#D27D5E";
  const room = share.roomType[0].toUpperCase() + share.roomType.slice(1);
  const created = new Date(share.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const website = brand?.website ? (/^https?:\/\//i.test(brand.website) ? brand.website : `https://${brand.website}`) : null;

  return (
    <div className="min-h-screen bg-sand pb-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        {brand && (
          <header className="flex flex-col gap-3 rounded-3xl border border-sand-200 bg-white/80 p-4 shadow-warm-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"
            style={{ borderTop: `4px solid ${accent}` }}>
            <div className="flex min-w-0 items-center gap-3">
              {brand.logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={brand.logoUrl} alt={brand.businessName} className="h-10 w-auto max-w-[180px] object-contain" />
                : <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: accent }}>{brand.businessName[0]}</span>}
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-charcoal">{brand.businessName}</p>
                {brand.licence && <p className="text-xs text-charcoal/45">{brand.licence}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {brand.phone && <a href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 rounded-xl border border-sand-200 px-3 py-2 text-sm font-semibold text-charcoal/75 hover:text-charcoal"><Phone size={14} /> {brand.phone}</a>}
              {brand.email && <a href={`mailto:${brand.email}`} className="flex items-center gap-1.5 rounded-xl border border-sand-200 px-3 py-2 text-sm font-semibold text-charcoal/75 hover:text-charcoal"><Mail size={14} /> {brand.email}</a>}
              {website && <a href={website} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-xl border border-sand-200 px-3 py-2 text-sm font-semibold text-charcoal/75 hover:text-charcoal"><Globe size={14} /> {brand.website!.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</a>}
            </div>
          </header>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{room} design · shared {created}</p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal sm:text-4xl">{share.title}</h1>
          {share.message && <p className="mt-3 max-w-2xl whitespace-pre-line text-base text-charcoal/70">{share.message}</p>}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-3xl shadow-warm-xl">
            {share.beforeUrl ? (
              <BeforeAfterSlider beforeSrc={share.beforeUrl} afterSrc={share.afterUrl} beforeLabel="Before" afterLabel="After" hideSwatches height={560} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={share.afterUrl} alt={`${room} design`} className="w-full object-cover" />
            )}
          </div>

          <div className="flex flex-col gap-4">
            {share.estimate && (
              <div className="rounded-3xl bg-charcoal p-6 text-white shadow-warm-lg">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">Estimated cost</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{share.estimate}</p>
                <p className="mt-1 text-xs text-white/40">Indicative, based on Australian market rates. {brand ? `${brand.businessName} will` : "Your builder will"} confirm the final quote.</p>
              </div>
            )}
            <ShareReplyPanel shareId={share.id} sharedBy={brand?.businessName ?? null} accent={accent} />
            {share.rows.length > 0 && (
              <div className="rounded-3xl border border-sand-200 bg-white/80 p-5 shadow-warm-sm">
                <p className="mb-3 text-sm font-bold text-charcoal">The finishes</p>
                <dl className="flex flex-col divide-y divide-sand-100">
                  {share.rows.map((r) => (
                    <div key={r.label} className="flex items-start justify-between gap-4 py-2.5">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal/45">{r.label}</dt>
                      <dd className="text-right text-sm font-semibold text-charcoal">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <p className="text-xs text-charcoal/45">
              AI-generated concept for planning. Final materials, layout and pricing depend on site conditions and {brand ? `${brand.businessName}'s` : "your builder's"} quote.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-charcoal/40">
          Visualised with <Link href="/" className="font-semibold text-charcoal/55 hover:text-charcoal">Reno Ready</Link>
        </p>
      </div>
    </div>
  );
}
