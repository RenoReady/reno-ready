/**
 * /account/approval/:id — the design approval record for a client link (Pro).
 * Only the link's owner can open it. A one-page sign-off for the job file:
 * the approved option, the estimate and finishes, who approved it and when.
 * Prints cleanly (the site header hides when printing), or saves as a PDF.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShare, latestApproval, shareOwner, shareReplies } from "@/lib/shareStore";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Design approval", robots: { index: false, follow: false } };

const when = (iso: string) => new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Brisbane", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function ApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await createSupabaseServerClient().then((s) => s.auth.getUser()).then((r) => r.data.user).catch(() => null);
  if (!user) redirect("/account");
  const share = await getShare(id).catch(() => null);
  if (!share || share.ownerId !== user.id) notFound();

  const [replies, { brand }] = await Promise.all([shareReplies(id), shareOwner(share.ownerId).catch(() => ({ brand: null }))]);
  const approval = latestApproval(replies);
  const image = (approval?.option && share.optionUrls.find((o) => o.label === approval.option)?.url) || share.afterUrl;
  const accent = brand?.accent ?? "#D27D5E";
  const room = share.roomType[0].toUpperCase() + share.roomType.slice(1);
  const link = `https://www.renoready.com.au/s/${share.id}`;

  return (
    <div className="min-h-screen bg-sand pb-16 print:bg-white print:pb-0">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 print:max-w-none print:p-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/account" className="flex items-center gap-1.5 text-sm font-semibold text-charcoal/55 hover:text-charcoal"><ArrowLeft size={15} /> My Account</Link>
          <div className="flex flex-wrap gap-2">
            {/* the image is on Supabase's domain, where a download attribute is ignored; its own ?download= sets the file name */}
            <a href={`${image}${image.includes("?") ? "&" : "?"}download=${encodeURIComponent(`${share.title.replace(/[^\w -]+/g, "").replace(/\s+/g, " ").trim() || "design"}${approval?.option ? ` option ${approval.option}` : ""}.jpg`)}`}
              className="flex items-center gap-2 rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-sm font-bold text-charcoal hover:border-charcoal/30">
              <Download size={15} /> Approved image
            </a>
            <PrintButton />
          </div>
        </div>

        <article className="rounded-3xl border border-sand-200 bg-white p-6 shadow-warm-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none"
          style={{ borderTop: `5px solid ${accent}` }}>
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {brand?.logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={brand.logoUrl} alt={brand.businessName} className="h-10 w-auto max-w-[200px] object-contain" />
                : brand && <p className="text-lg font-bold text-charcoal">{brand.businessName}</p>}
              {brand && (
                <p className="mt-1 text-xs text-charcoal/50">
                  {[brand.businessName, brand.licence, brand.phone, brand.email].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <p className="text-right text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>Design approval</p>
          </header>

          <h1 className="mt-6 text-2xl font-bold text-charcoal">{share.title}</h1>
          <p className="text-sm text-charcoal/55">{room} design{approval?.option ? ` · option ${approval.option} of ${share.options?.length ?? 1}` : ""} · shared {when(share.createdAt)}</p>

          {approval ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-bold">Approved by {approval.name} on {when(approval.at)}</p>
              <p className="mt-0.5">Contact: {approval.contact}</p>
              {approval.message && <p className="mt-2 whitespace-pre-line italic">&ldquo;{approval.message}&rdquo;</p>}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-charcoal/65">
              Not approved yet. This record fills in when your client clicks Approve on the link.
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={`Approved ${share.roomType} design`} className="mt-5 w-full rounded-2xl object-cover print:break-inside-avoid" />

          <div className="mt-5 grid gap-4 sm:grid-cols-2 print:grid-cols-2 print:break-inside-avoid">
            {share.estimate && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-charcoal/45">Estimated cost</p>
                <p className="text-2xl font-bold text-charcoal tabular-nums">{share.estimate}</p>
                <p className="text-xs text-charcoal/45">Indicative, based on Australian market rates. Final price per the written quote.</p>
              </div>
            )}
            {share.rows.length > 0 && (
              <dl className="flex flex-col divide-y divide-sand-100 text-sm">
                {share.rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-4 py-1.5">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal/45">{r.label}</dt>
                    <dd className="text-right font-semibold text-charcoal">{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {share.message && <p className="mt-5 whitespace-pre-line text-sm text-charcoal/65"><span className="font-semibold text-charcoal">Note to client:</span> {share.message}</p>}

          {replies.some((r) => r.kind === "question") && (
            <div className="mt-5 print:break-inside-avoid">
              <p className="text-[11px] font-bold uppercase tracking-widest text-charcoal/45">Client questions</p>
              <ul className="mt-1.5 flex flex-col gap-1.5 text-sm text-charcoal/70">
                {replies.filter((r) => r.kind === "question").map((r, i) => (
                  <li key={i}><span className="font-semibold text-charcoal">{r.name}</span> ({when(r.at)}{r.option ? `, option ${r.option}` : ""}): {r.message}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 border-t border-sand-100 pt-4 text-xs leading-relaxed text-charcoal/45">
            AI-generated concept approved for planning. Final materials, layout and pricing depend on site conditions and the written quote.
            Shared design: <a href={link} className="inline-flex items-center gap-0.5 underline print:no-underline">{link}<ExternalLink size={10} className="print:hidden" /></a>
          </p>
        </article>
      </div>
    </div>
  );
}
