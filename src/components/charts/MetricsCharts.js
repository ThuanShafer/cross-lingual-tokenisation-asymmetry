"use client";

import { overallPenalty } from "@/lib/metrics";
import { asMuchAs } from "@/lib/plain-language";
import { PairedColumns } from "./PairedColumns";
import { PenaltyRadar } from "./PenaltyRadar";
import { TokenBudget } from "./TokenBudget";

const RESOURCE_KEYS = ["waitMs", "kvCacheMb", "costAtScale", "costPerMillionWords"];

function Legend({ items }) {
  return (
    <span className="flex items-center gap-3 text-[11px] text-white/60">
      {items.map((item) => (
        <span key={item.name} data-tone={item.tone} className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-[color:var(--accent)]" /> {item.name}
        </span>
      ))}
    </span>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      <header>
        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
        <p className="text-[11px] text-white/45">{subtitle}</p>
      </header>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </section>
  );
}

/** Collapsible full-width row visualising the comparison metrics. */
export function MetricsCharts({ englishMetrics, targetMetrics, englishName, targetName, modelName }) {
  const ready = Boolean(englishMetrics && targetMetrics);
  const rows = ready
    ? [
        { name: englishName, tone: "cyan", metrics: englishMetrics },
        { name: targetName, tone: "amber", metrics: targetMetrics },
      ]
    : [];

  return (
    <details className="metrics-accordion group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 select-none [&::-webkit-details-marker]:hidden">
        <svg className="size-3.5 text-white/60 transition-transform group-open:rotate-90" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-semibold tracking-wide text-white/90">Metrics visualised</span>
        {ready ? (
          <>
            <Legend items={rows} />
            <span className="ml-auto rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-200">
              {targetName} cost {asMuchAs(overallPenalty(targetMetrics, englishMetrics))} overall
            </span>
          </>
        ) : (
          <span className="ml-auto text-xs text-white/40">Run a comparison to populate the charts</span>
        )}
      </summary>

      <div className="border-t border-white/10 p-5">
        {ready ? (
          <div className="fade-in grid gap-4 lg:grid-cols-5">
            <ChartCard title="Penalty profile" subtitle="Worse language on each axis touches the outer ring; outward = worse" className="lg:col-span-2">
              <PenaltyRadar metrics={targetMetrics} baseline={englishMetrics} targetName={targetName} />
            </ChartCard>
            <div className="flex flex-col gap-4 lg:col-span-3">
              <ChartCard title="Token budget" subtitle={`Tokens ${modelName ?? "the model"} processed for each language`}>
                <TokenBudget rows={rows} />
              </ChartCard>
              <ChartCard title="Time, memory & cost" subtitle="Each pair scaled to its own maximum">
                <PairedColumns metricKeys={RESOURCE_KEYS} rows={rows} />
              </ChartCard>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-white/40">
            Submit a query to compare {englishName} and {targetName} visually.
          </p>
        )}
      </div>
    </details>
  );
}
