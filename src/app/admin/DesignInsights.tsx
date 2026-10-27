/**
 * Admin "What people design": popular choices per room, from generated designs.
 * Server component; numbers from src/lib/designInsights.ts.
 */

import { formatAUD } from "@/lib/utils";
import type { RoomInsights } from "@/lib/designInsights";

const ROOM_NAME = { bathroom: "Bathroom", kitchen: "Kitchen", bedroom: "Bedroom" } as const;

export default function DesignInsights({ rooms }: { rooms: RoomInsights[] }) {
  const total = rooms.reduce((n, r) => n + r.designs, 0);
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">What people design</h2>
          <p className="text-sm text-charcoal/45 mt-1">
            The most popular choices in designs people generated (each design&apos;s latest version; your own account left out).
          </p>
        </div>
        <p className="text-sm text-charcoal/45">{total} design{total === 1 ? "" : "s"}</p>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl bg-white border border-sand-200 p-10 text-center">
          <p className="text-sm text-charcoal/55">No generated designs from customers yet. Their most popular choices will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {rooms.map((r) => (
            <div key={r.room} className="rounded-2xl bg-white border border-sand-200 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-lg font-bold text-charcoal">{ROOM_NAME[r.room]}</p>
                <p className="text-xs text-charcoal/45">{r.designs} design{r.designs === 1 ? "" : "s"} · {r.people} {r.people === 1 ? "person" : "people"}</p>
              </div>
              {r.designs === 0 ? (
                <p className="mt-3 text-sm text-charcoal/45">None yet.</p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Figure label="Typical estimate" value={r.medianEstimate ? formatAUD(r.medianEstimate) : "—"} />
                    <Figure label="Typical budget" value={r.medianBudget ? formatAUD(r.medianBudget) : "—"} />
                  </div>
                  {r.estimateBands.length > 0 && (
                    <Group label="Estimates" rows={r.estimateBands} of={r.designs} />
                  )}
                  {r.categories.filter((c) => c.top.length).map((c) => (
                    <Group key={c.label} label={c.label} rows={c.top} of={r.designs} />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal/40">{label}</p>
      <p className="text-base font-bold text-charcoal tabular-nums">{value}</p>
    </div>
  );
}

/** One category: its top choices as bars, each a share of all designs for the room */
function Group({ label, rows, of }: { label: string; rows: { name: string; count: number }[]; of: number }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-charcoal/45 mb-1.5">{label}</p>
      <ul className="flex flex-col gap-1.5">
        {rows.map((x) => (
          <li key={x.name} className="text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-charcoal">{x.name}</span>
              <span className="tabular-nums text-charcoal/55">{x.count} <span className="text-charcoal/35">· {Math.round((x.count / of) * 100)}%</span></span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-full bg-sand-100 overflow-hidden">
              <div className="h-full rounded-full bg-terracotta/70" style={{ width: `${Math.max(3, (x.count / of) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
