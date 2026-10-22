const SEGMENTS = [
  { key: "promptTokens", label: "Prompt", opacity: 1 },
  { key: "outputTokens", label: "Answer", opacity: 0.45 },
];

/** Stacked horizontal bars of the model tokens each language spends. */
export function TokenBudget({ rows }) {
  const totals = rows.map((row) => SEGMENTS.reduce((sum, s) => sum + row.metrics[s.key], 0));
  const max = Math.max(...totals) || 1;

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <div key={row.name} data-tone={row.tone}>
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="font-medium text-[color:var(--accent)]">{row.name}</span>
            <span className="font-mono tabular-nums text-white/80">
              {SEGMENTS.map((s) => row.metrics[s.key]).join(" + ")} = <b className="text-white">{totals[i]}</b>
            </span>
          </div>
          <div className="flex h-5 overflow-hidden rounded-md bg-white/5">
            {SEGMENTS.map((s) => (
              <div
                key={s.key}
                className="chart-bar h-full first:rounded-l-md"
                title={`${s.label}: ${row.metrics[s.key]} tokens`}
                style={{
                  width: `${(row.metrics[s.key] / max) * 100}%`,
                  background: `rgb(var(--accent-rgb) / ${s.opacity})`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-4 text-[10px] uppercase tracking-wider text-white/45">
        {SEGMENTS.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-white" style={{ opacity: s.opacity }} /> {s.label} tokens
          </span>
        ))}
      </div>
    </div>
  );
}
