import { METRIC_ROWS, ratio } from "@/lib/metrics";
import { describeResourceGap } from "@/lib/plain-language";

function RatioBadge({ value, higherIsWorse }) {
  if (value === null) return null;
  const worse = higherIsWorse ? value > 1.05 : value < 0.95;
  const better = higherIsWorse ? value < 0.95 : value > 1.05;
  const tone = worse ? "bg-rose-500/20 text-rose-300" : better ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60";
  const pct = Math.round(Math.abs(value - 1) * 100);
  const label = pct < 5 ? "same" : value > 1 ? `${pct}% more` : `${pct}% less`;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] ${tone}`}>{label}</span>;
}

/**
 * Key metrics for one pane. Bars are scaled against the larger of the two
 * panes; `baseline` (the English metrics) enables the ×-ratio column.
 */
export function MetricsTable({ metrics, peerMetrics, baseline, tone, languageName }) {
  const reading = baseline && languageName ? describeResourceGap(languageName, metrics, baseline) : null;
  return (
    <div className="flex flex-col gap-3">
      {reading && <p className="text-sm leading-relaxed text-white/80">{reading}</p>}
      <table className="w-full border-separate border-spacing-0 text-sm">
      {baseline && (
        <caption className="caption-bottom pt-2 text-left text-[11px] text-white/40">
          Coloured badges compare this language with English. <span className="text-rose-300">Red</span> means this language paid more.
        </caption>
      )}
      <thead className="sr-only">
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {METRIC_ROWS.map((row) => {
          const value = metrics[row.key];
          const max = Math.max(value, peerMetrics?.[row.key] ?? 0) || 1;
          return (
            <tr key={row.key} className="group">
              <th scope="row" className="border-b border-white/10 py-1.5 pr-3 text-left font-medium">
                <span className="block text-white/90">{row.plain ?? row.label}</span>
                <span className="block text-[10px] font-normal text-white/40">{row.plainHint ?? row.hint}</span>
              </th>
              <td className="w-[55%] border-b border-white/10 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="metric-bar h-full rounded-full" data-tone={tone} style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                  <span className="min-w-[4.75rem] text-right font-mono tabular-nums text-white">{row.format(value)}</span>
                  {baseline && <RatioBadge value={ratio(value, baseline[row.key])} higherIsWorse={row.higherIsWorse} />}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
      </table>
    </div>
  );
}
