import { METRIC_ROWS, penaltyFactor } from "@/lib/metrics";

const RADIUS = 105;
const LABEL_OFFSET = 20;
const RINGS = [0.25, 0.5, 0.75, 1];

const polar = (index, count, r) => {
  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
};

const toPath = (points) => `${points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("")}Z`;

/**
 * Per-axis radar: on every metric the worse language touches the outer ring
 * and the other is drawn at its relative share, so outward always means worse.
 */
export function PenaltyRadar({ metrics, baseline, targetName }) {
  const count = METRIC_ROWS.length;
  const axes = METRIC_ROWS.map((row) => {
    const factor = penaltyFactor(row, metrics[row.key], baseline[row.key]);
    return {
      row,
      factor,
      english: factor >= 1 ? 1 / factor : 1,
      target: factor >= 1 ? 1 : factor,
    };
  });

  const series = [
    { id: "english", name: "English", color: "var(--cyan)", fill: "rgb(103 232 249 / 0.14)", values: baseline },
    { id: "target", name: targetName, color: "var(--amber)", fill: "rgb(251 191 36 / 0.16)", values: metrics },
  ].map((s) => ({ ...s, points: axes.map((axis, i) => polar(i, count, axis[s.id] * RADIUS)) }));

  return (
    <svg viewBox="-170 -145 340 290" className="w-full" role="img" aria-label={`English vs ${targetName} on every metric`}>
      {RINGS.map((value) => (
        <g key={value}>
          <circle r={value * RADIUS} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeDasharray={value === 1 ? "0" : "2 3"} />
          <text x="3" y={-value * RADIUS - 2} fontSize="7" fill="rgb(255 255 255 / 0.35)">{value * 100}%</text>
        </g>
      ))}

      {axes.map(({ row }, i) => {
        const [x, y] = polar(i, count, RADIUS);
        const [lx, ly] = polar(i, count, RADIUS + LABEL_OFFSET);
        const anchor = Math.abs(lx) < 8 ? "middle" : lx > 0 ? "start" : "end";
        return (
          <g key={row.key}>
            <line x1="0" y1="0" x2={x} y2={y} stroke="rgb(255 255 255 / 0.07)" />
            <text x={lx} y={ly} dy="3" fontSize="8.5" textAnchor={anchor} fill="rgb(255 255 255 / 0.6)">
              {row.short}
            </text>
          </g>
        );
      })}

      {series.map((s) => (
        <g key={s.id}>
          <path
            d={toPath(s.points)}
            className="radar-shape"
            style={{ fill: s.fill, stroke: s.color }}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {s.points.map(([x, y], i) => {
            const { row, factor } = axes[i];
            return (
              <circle key={row.key} cx={x} cy={y} r="2.6" style={{ fill: s.color }}>
                <title>{`${s.name} · ${row.label}: ${row.format(s.values[row.key] ?? 0)} (${targetName} ×${factor.toFixed(2)} vs English)`}</title>
              </circle>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
