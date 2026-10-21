/**
 * /s/:id — a design shared with a client (Reno Ready Pro).
 * Public but unlisted: no account needed, not indexed by search engines.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { getShare } from "@/lib/shareStore";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const share = await getShare((await params).id).catch(() => null);
  return {
    title: share ? share.title : "Shared design",
    description: share ? `A ${share.roomType} renovation design made with Reno Ready.` : undefined,
    robots: { index: false, follow: false },
    ...(share && { openGraph: { title: share.title, images: [{ url: share.afterUrl }] } }),
  };
}

export default async function SharedDesignPage({ params }: Props) {
  const share = await getShare((await params).id).catch(() => null);
  if (!share) notFound();

  const room = share.roomType[0].toUpperCase() + share.roomType.slice(1);
  const created = new Date(share.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-sand pb-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-terracotta">{room} design · shared {created}</p>
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
                <p className="mt-1 text-xs text-white/40">Indicative, based on Australian market rates. A builder will confirm the final quote.</p>
              </div>
            )}
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
              AI-generated concept for planning. Final materials, layout and pricing depend on site conditions and your builder&apos;s quote.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-3xl border border-terracotta/20 bg-terracotta/5 px-6 py-8 text-center">
          <Sparkles size={22} className="text-terracotta" />
          <p className="text-lg font-bold text-charcoal">Picture your own room renovated</p>
          <p className="max-w-md text-sm text-charcoal/60">Upload a photo and see it transformed in about 30 seconds, with an instant cost estimate. Your first preview is free.</p>
          <Link href="/builder" className="mt-1 flex items-center gap-2 rounded-2xl bg-terracotta px-6 py-3 text-sm font-bold text-white shadow-warm-sm hover:bg-terracotta/90">
            Design my room free <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
