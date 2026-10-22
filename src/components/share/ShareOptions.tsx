"use client";

/**
 * ShareOptions — when a share has several options (Pro variations), the client
 * flips between them with tabs over the before/after; the reply panel reads
 * which one they're looking at, so "Approve" approves that option.
 */

import { createContext, useContext, useState } from "react";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { cn } from "@/lib/utils";

type Option = { label: string; url: string };
const Ctx = createContext<{ options: Option[]; chosen: string; choose: (label: string) => void } | null>(null);

/** The option the client is looking at, or null when there's only one design */
export function useShareOption() {
  const c = useContext(Ctx);
  return c && c.options.length > 1 ? c.chosen : null;
}

export function ShareOptionsProvider({ options, children }: { options: Option[]; children: React.ReactNode }) {
  const [chosen, choose] = useState(options[0]?.label ?? "");
  return <Ctx.Provider value={{ options, chosen, choose }}>{children}</Ctx.Provider>;
}

export function ShareDesignView({ beforeUrl, afterUrl, room, accent }: { beforeUrl: string | null; afterUrl: string; room: string; accent: string }) {
  const c = useContext(Ctx);
  const options = c?.options ?? [];
  const current = options.find((o) => o.label === c?.chosen)?.url ?? afterUrl;

  return (
    <div className="flex flex-col gap-3">
      {options.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-charcoal/45">{options.length} options</span>
          {options.map((o) => (
            <button key={o.label} type="button" onClick={() => c!.choose(o.label)} aria-pressed={c!.chosen === o.label}
              className={cn("flex items-center gap-2 rounded-xl border-2 p-1 pr-3 text-sm font-bold transition-colors",
                c!.chosen === o.label ? "border-transparent text-white" : "border-sand-200 bg-white text-charcoal/70 hover:border-charcoal/20")}
              style={c!.chosen === o.label ? { background: accent } : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.url} alt="" className="h-9 w-12 rounded-lg object-cover" />
              Option {o.label}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-3xl shadow-warm-xl">
        {beforeUrl ? (
          <BeforeAfterSlider key={current} beforeSrc={beforeUrl} afterSrc={current} beforeLabel="Before" afterLabel={options.length > 1 ? `Option ${c!.chosen}` : "After"} hideSwatches height={560} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={`${room} design`} className="w-full object-cover" />
        )}
      </div>
    </div>
  );
}
