"use client";

/**
 * A user's stored designs in the admin table: a thumbnail strip that opens
 * a gallery modal (full image, room, time, prompt). Shows a "No designs yet"
 * badge when the user has none.
 */

import { useEffect, useState } from "react";
import { ImageOff, X, ExternalLink, Camera } from "lucide-react";

export interface AdminDesign {
  id:        string;
  url:       string | null;   // signed URL; null if signing failed
  roomType:  string;
  prompt:    string | null;
  hadPhoto:  boolean;
  createdAt: string;
}

const ROOM_LABEL: Record<string, string> = { bathroom: "Bathroom", kitchen: "Kitchen", bedroom: "Bedroom" };

export default function UserDesigns({ email, designs }: { email: string; designs: AdminDesign[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  if (designs.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sand-100 text-charcoal/45 text-[11px] font-bold uppercase tracking-wider">
        <ImageOff size={11} strokeWidth={2.5} />
        No designs yet
      </span>
    );
  }

  const shown = designs.slice(0, 3);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-xl p-1 pr-2.5 hover:bg-terracotta/8 transition-colors"
        aria-label={`View ${designs.length} designs by ${email}`}
      >
        <span className="flex -space-x-2">
          {shown.map((d) => (
            <Thumb key={d.id} url={d.url} className="w-9 h-9 rounded-lg ring-2 ring-white" />
          ))}
        </span>
        <span className="text-xs font-bold text-terracotta group-hover:underline">
          {designs.length > shown.length ? `+${designs.length - shown.length} · ` : ""}View
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-charcoal/60 backdrop-blur-sm p-4 md:p-10"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Designs by ${email}`}
        >
          <div className="w-full max-w-5xl rounded-3xl bg-sand p-6 md:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <p className="text-xs font-bold text-terracotta uppercase tracking-[0.2em] mb-1">Stored designs</p>
                <h3 className="text-xl font-bold text-charcoal font-mono truncate">{email}</h3>
                <p className="text-sm text-charcoal/50 mt-0.5">{designs.length} design{designs.length === 1 ? "" : "s"}, newest first</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-charcoal/60 hover:text-charcoal"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map((d) => (
                <figure key={d.id} className="rounded-2xl bg-white border border-sand-200 overflow-hidden">
                  <a
                    href={d.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-[4/3] bg-sand-100"
                  >
                    <Thumb url={d.url} className="absolute inset-0 w-full h-full" />
                    {d.url && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/55 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={10} /> Full size
                      </span>
                    )}
                  </a>
                  <figcaption className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-charcoal">{ROOM_LABEL[d.roomType] ?? d.roomType}</span>
                      <span className="text-[11px] text-charcoal/45 tabular-nums">{formatDateTime(d.createdAt)}</span>
                    </div>
                    {d.hadPhoto && (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-charcoal/45">
                        <Camera size={10} /> From their photo
                      </span>
                    )}
                    {d.prompt && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-semibold text-terracotta">Prompt</summary>
                        <p className="mt-1.5 max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-charcoal/65">{d.prompt}</p>
                      </details>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Thumb({ url, className }: { url: string | null; className: string }) {
  if (!url) {
    return (
      <span className={`flex items-center justify-center bg-sand-100 text-charcoal/30 ${className}`}>
        <ImageOff size={14} />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className={`object-cover bg-sand-100 ${className}`} />;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}
