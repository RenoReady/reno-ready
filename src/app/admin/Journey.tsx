/**
 * Admin "Visitor journey": the step-by-step funnel (overall and by room), where
 * people are, and what they use. Server component; numbers from src/lib/journeyReport.ts.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROOMS, furthestStep, STEP_LABEL, type JourneyReport } from "@/lib/journeyReport";
import type { Person } from "@/lib/funnel";

const PERIODS = [7, 30, 90];
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "—");

export default function Journey({ report }: { report: JourneyReport }) {
  const { funnel, people, days } = report;
  const visitors = funnel[0]?.all || people;
  const roomTotals = Object.fromEntries(ROOMS.map((r) => [r, funnel.find((f) => f.step === "room")?.byRoom[r] ?? 0])) as Record<(typeof ROOMS)[number], number>;

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Visitor journey</h2>
          <p className="text-sm text-charcoal/45 mt-1">
            How far people get, counted once per person (your own account left out). Tracking started 27 Oct 2026.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white border border-sand-200 p-1 text-xs font-bold">
          {PERIODS.map((d) => (
            <Link key={d} href={`/admin?days=${d}`} scroll={false}
              className={cn("rounded-lg px-3 py-1.5", d === days ? "bg-charcoal text-white" : "text-charcoal/55 hover:text-charcoal")}>
              {d} days
            </Link>
          ))}
        </div>
      </div>

      {people === 0 ? (
        <div className="rounded-2xl bg-white border border-sand-200 p-10 text-center">
          <p className="text-sm text-charcoal/55">No visits recorded in the last {days} days yet. They&apos;ll appear here as people use the site.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "People", value: people, hint: `${report.returning} came back more than once` },
              ...ROOMS.map((r) => ({ label: `${r[0].toUpperCase()}${r.slice(1)}`, value: roomTotals[r], hint: `${pct(roomTotals[r], funnel[1]?.all ?? 0)} of people who opened the tool` })),
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white border border-sand-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-charcoal/45">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-charcoal tabular-nums">{s.value}</p>
                <p className="mt-1 text-xs text-charcoal/45">{s.hint}</p>
              </div>
            ))}
          </div>

          {/* The funnel */}
          <div className="rounded-2xl bg-white border border-sand-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand-50 text-left text-xs uppercase tracking-wider text-charcoal/45">
                <tr>
                  <th className="px-4 py-3">Step</th>
                  <th className="px-4 py-3 w-[34%]">People</th>
                  <th className="px-4 py-3 text-right">From the step before</th>
                  {ROOMS.map((r) => <th key={r} className="px-4 py-3 text-right capitalize">{r}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {funnel.map((row, i) => {
                  const prev = i > 0 ? funnel[i - 1].all : 0;
                  // a big drop from the step before is worth a look
                  const drop = i > 0 && prev >= 5 && row.all / prev < 0.3;
                  return (
                    <tr key={row.step}>
                      <td className="px-4 py-3 font-semibold text-charcoal whitespace-nowrap">{row.label}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2.5 flex-1 rounded-full bg-sand-100 overflow-hidden min-w-[60px]">
                            <div className="h-full rounded-full bg-terracotta" style={{ width: `${visitors ? Math.max(2, (row.all / visitors) * 100) : 0}%` }} />
                          </div>
                          <span className="w-10 text-right font-bold tabular-nums text-charcoal">{row.all}</span>
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 text-right tabular-nums", drop ? "font-bold text-red-600" : "text-charcoal/55")}>
                        {i === 0 ? "—" : pct(row.all, prev)}
                      </td>
                      {ROOMS.map((r) => (
                        <td key={r} className="px-4 py-3 text-right tabular-nums text-charcoal/70">{i === 0 ? "—" : row.byRoom[r]}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-sand-100 px-4 py-3 text-xs leading-relaxed text-charcoal/45">
              {report.previewsMade} previews made · {report.previewsFailed} failed{report.previewsFailed ? " (see the daily email for the errors)" : ""}.
              Room columns use the last room each person worked on. Red means fewer than 30% made it past the step before.
            </p>
          </div>

          {/* Where and on what */}
          <div className="grid gap-4 lg:grid-cols-3">
            <CountList title="Top areas" note="Approximate, from their internet connection" rows={report.cities} total={people} />
            <CountList title="Top postcodes" note="Only people who typed one in Step 1" rows={report.postcodes} total={people} />
            <CountList title="Devices" note="What they first visited on" rows={report.devices.map((d) => ({ ...d, name: d.name[0].toUpperCase() + d.name.slice(1) }))} total={people} />
          </div>
        </div>
      )}
    </section>
  );
}

function CountList({ title, note, rows, total }: { title: string; note: string; rows: { name: string; people: number }[]; total: number }) {
  return (
    <div className="rounded-2xl bg-white border border-sand-200 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-charcoal/45">{title}</p>
      <p className="text-xs text-charcoal/40 mb-3">{note}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-charcoal/45">Nothing yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-charcoal">{r.name}</span>
              <span className="tabular-nums text-charcoal/55">{r.people} <span className="text-charcoal/35">· {pct(r.people, total)}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Users table cell: how far this account got, with its timeline on click */
export function UserJourney({ person }: { person: Person | undefined }) {
  if (!person) return <span className="text-xs text-charcoal/35">Before tracking</span>;
  const furthest = furthestStep(person);
  const when = (iso: string) => new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Brisbane", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return (
    <details className="group text-xs">
      <summary className="cursor-pointer list-none">
        <span className="font-semibold text-charcoal">{furthest ? STEP_LABEL[furthest] : "—"}</span>
        {person.room && <span className="text-charcoal/45"> · {person.room}</span>}
        <span className="block text-charcoal/40">last seen {when(person.last)} <span className="text-terracotta group-open:hidden">· timeline</span></span>
      </summary>
      <ol className="mt-2 flex flex-col gap-1 border-l-2 border-sand-200 pl-3">
        {person.events.slice(-40).map((e, i) => (
          <li key={i} className={e.step === "preview_failed" ? "text-red-600" : "text-charcoal/70"}>
            <span className="text-charcoal/40 tabular-nums">{when(e.created_at)}</span>{" "}
            {STEP_LABEL[e.step] ?? e.step}
            {e.room && e.step !== "room" ? ` · ${e.room}` : e.step === "room" && e.room ? `: ${e.room}` : ""}
            {e.detail ? <span className="text-charcoal/45"> ({e.detail})</span> : null}
          </li>
        ))}
      </ol>
    </details>
  );
}
