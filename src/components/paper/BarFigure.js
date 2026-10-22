const WIDTH = 300;
const LABEL_WIDTH = 88;
const VALUE_WIDTH = 82;
const ROW = 18;
const BAR = 10;
const TOP = 6;
const AXIS = 20;

const INK = { english: "#0e7490", target: "#d97706", secondary: "#a8a29e", grid: "#e5e7eb", axis: "#9ca3af", text: "#1f2937", muted: "#6b7280" };

/** Round tick step (1, 2, 2.5 or 5 × 10ⁿ) giving about four intervals up to `value`. */
function niceStep(value) {
  if (!(value > 0)) return 0.25;
  const raw = value / 4;
  const exponent = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 2.5, 5, 10].find((s) => s * exponent >= raw) ?? 10) * exponent;
}

/**
 * Horizontal bar chart with ±SD whiskers. `rows` are
 * `{ label, mean, sd, tone: "english" | "target" | "secondary", note }`; `reference` draws a
 * dashed vertical line (e.g. 1× in ratio charts).
 */
export function BarFigure({ rows, format, reference = null, domainMax = null, ariaLabel }) {
  const dataMax = domainMax ?? Math.max(...rows.map((r) => (r.mean || 0) + (r.sd || 0)), reference ?? 0);
  const step = niceStep(dataMax);
  const max = Math.max(step, Math.ceil(dataMax / step - 1e-9) * step);
  const plotWidth = WIDTH - LABEL_WIDTH - VALUE_WIDTH;
  const x = (v) => LABEL_WIDTH + (Math.min(Math.max(0, v), max) / max) * plotWidth;
  const height = TOP + rows.length * ROW + AXIS;
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="img" aria-label={ariaLabel}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={TOP - 2} y2={TOP + rows.length * ROW} stroke={INK.grid} strokeWidth="0.6" />
          <text x={x(t)} y={height - 6} fontSize="7.5" textAnchor="middle" fill={INK.muted}>
            {format(t)}
          </text>
        </g>
      ))}
      <line x1={LABEL_WIDTH} x2={LABEL_WIDTH} y1={TOP - 2} y2={TOP + rows.length * ROW} stroke={INK.axis} strokeWidth="0.8" />

      {rows.map((row, i) => {
        const y = TOP + i * ROW + (ROW - BAR) / 2;
        const color = INK[row.tone];
        const hasSpread = row.sd > 0;
        return (
          <g key={`${row.label}-${i}`}>
            <text x={LABEL_WIDTH - 5} y={y + BAR / 2} dy="2.8" fontSize="8.5" textAnchor="end" fill={INK.text} fontWeight={row.tone === "english" ? 600 : 400}>
              {row.label}
            </text>
            <rect x={LABEL_WIDTH} y={y} width={Math.max(0.5, x(row.mean) - LABEL_WIDTH)} height={BAR} fill={color} fillOpacity={row.tone === "english" ? 0.85 : 0.75} />
            {hasSpread && (
              <g stroke={INK.text} strokeWidth="0.7">
                <line x1={x(row.mean - row.sd)} x2={x(row.mean + row.sd)} y1={y + BAR / 2} y2={y + BAR / 2} />
                <line x1={x(row.mean - row.sd)} x2={x(row.mean - row.sd)} y1={y + 2} y2={y + BAR - 2} />
                <line x1={x(row.mean + row.sd)} x2={x(row.mean + row.sd)} y1={y + 2} y2={y + BAR - 2} />
              </g>
            )}
            <text x={WIDTH - VALUE_WIDTH + 4} y={y + BAR / 2} dy="2.8" fontSize="8" fill={INK.text}>
              {format(row.mean)}
              {row.note && <tspan fill={INK.muted}>{`  ${row.note}`}</tspan>}
            </text>
          </g>
        );
      })}

      {reference !== null && (
        <line x1={x(reference)} x2={x(reference)} y1={TOP - 3} y2={TOP + rows.length * ROW + 1} stroke={INK.english} strokeWidth="0.9" strokeDasharray="2.5 2" />
      )}
    </svg>
  );
}
