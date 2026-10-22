import { getMetricRow, penaltyFactor } from "@/lib/metrics";

/** Side-by-side columns per metric, each group scaled to its own maximum. */
export function PairedColumns({ metricKeys, rows }) {
  const [baseline, target] = rows;

  return (
    <div className="grid h-full grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
      {metricKeys.map((key) => {
        const row = getMetricRow(key);
        const max = Math.max(...rows.map((r) => r.metrics[key])) || 1;
        const factor = penaltyFactor(row, target.metrics[key], baseline.metrics[key]);
        return (
          <figure key={key} className="flex flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end justify-center gap-2 border-b border-white/15">
              {rows.map((r) => (
                <div key={r.name} data-tone={r.tone} className="flex h-full w-7 flex-col items-center justify-end">
                  <div
                    className="chart-column w-full rounded-t-md"
                    title={`${r.name}: ${row.format(r.metrics[key])}`}
                    style={{ height: `${(r.metrics[key] / max) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <figcaption className="text-center">
              <span className="block text-xs text-white/80">{row.label}</span>
              <span className="block font-mono text-[10px] text-white/45">
                {row.format(baseline.metrics[key])} → {row.format(target.metrics[key])}
              </span>
              <span className={`font-mono text-[10px] ${factor > 1.05 ? "text-rose-300" : "text-emerald-300"}`}>
                ×{factor.toFixed(2)}
              </span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
