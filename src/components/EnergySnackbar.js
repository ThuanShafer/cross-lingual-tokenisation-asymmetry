"use client";

import { useEffect, useState } from "react";

function WaterScene({ bottles }) {
  const shown = 5;
  const fill = Math.min(0.9, 0.35 + Math.log10(Math.max(bottles, 1)) * 0.2);
  return (
    <svg viewBox="0 0 240 118" className="energy-scene" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => {
        const x = 14 + i * 38;
        return (
          <g key={i}>
            <rect x={x + 14} y={18} width="10" height="10" rx="2" fill="none" stroke="#67e8f9" strokeWidth="1.6" />
            <path
              d={`M${x + 8} 28 C${x + 8} 28 ${x + 6} 34 ${x + 6} 38 V86 C${x + 6} 92 ${x + 12} 96 ${x + 19} 96 H${x + 21} C${x + 28} 96 ${x + 34} 92 ${x + 34} 86 V38 C${x + 34} 34 ${x + 32} 28 ${x + 32} 28 Z`}
              fill="none"
              stroke="#67e8f9"
              strokeWidth="1.8"
            />
            <path
              className="energy-fill"
              d={`M${x + 8} ${96 - fill * 56} H${x + 32} V86 C${x + 32} 91 ${x + 27} 94 ${x + 20} 94 H${x + 20} C${x + 13} 94 ${x + 8} 91 ${x + 8} 86 Z`}
              fill="rgb(34 211 238 / 0.55)"
            />
          </g>
        );
      })}
      <text x="228" y="112" textAnchor="end" fill="#67e8f9" fontSize="12" fontFamily="var(--font-sans)">
        ×{bottles >= 10 ? Math.round(bottles).toLocaleString() : bottles.toFixed(1)}
      </text>
    </svg>
  );
}

function GlacierScene() {
  return (
    <svg viewBox="0 0 240 118" className="energy-scene" aria-hidden="true">
      <defs>
        <linearGradient id="ice-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(125 211 252 / 0.2)" />
          <stop offset="100%" stopColor="rgb(8 47 73 / 0.15)" />
        </linearGradient>
        <linearGradient id="ice-face" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#f0fdfa" />
          <stop offset="55%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <rect width="240" height="118" fill="url(#ice-sky)" />
      <path d="M4 86 L48 28 L74 54 L120 10 L164 58 L194 32 L236 86 Z" fill="url(#ice-face)" />
      <path d="M120 10 L138 48 L102 46 Z" fill="rgb(255 255 255 / 0.55)" />
      <path className="energy-melt" d="M4 86 L48 36 L74 60 L120 22 L164 64 L194 40 L236 86 Z" fill="rgb(165 243 252 / 0.28)" />
      <ellipse className="energy-pool" cx="120" cy="100" rx="108" ry="14" fill="#0e7490" />
      <path d="M20 92 q100 18 200 0" fill="none" stroke="rgb(165 243 252 / 0.45)" strokeWidth="2" />
      {[58, 120, 172].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="62" r="2.4" fill="#ecfeff" />
          <circle className="energy-drip" cx={x} cy="68" r="2.6" fill="#67e8f9" style={{ animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}
    </svg>
  );
}

function DriveScene({ km }) {
  const label = km < 1 ? `${Math.max(1, Math.round(km * 1000))} m` : `${km.toFixed(1)} km`;
  return (
    <svg viewBox="0 0 240 110" className="energy-scene" aria-hidden="true">
      <line x1="12" y1="78" x2="228" y2="78" stroke="rgb(251 191 36 / 0.35)" strokeWidth="6" strokeLinecap="round" />
      <line x1="16" y1="78" x2="224" y2="78" stroke="rgb(251 191 36 / 0.7)" strokeWidth="1.5" strokeDasharray="8 10" />
      <g className="energy-car">
        <rect x="28" y="58" width="42" height="16" rx="4" fill="#fbbf24" />
        <path d="M38 58 l8 -10 h16 l8 10 z" fill="#fde68a" />
        <circle cx="38" cy="76" r="5" fill="#1e293b" stroke="#fbbf24" />
        <circle cx="60" cy="76" r="5" fill="#1e293b" stroke="#fbbf24" />
      </g>
      <text x="228" y="28" textAnchor="end" fill="#fbbf24" fontSize="12" fontFamily="var(--font-sans)">
        {label}
      </text>
    </svg>
  );
}

function PhoneScene({ charge }) {
  const pct = Math.min(100, Math.max(4, charge <= 1 ? charge * 100 : 78));
  return (
    <svg viewBox="0 0 240 110" className="energy-scene" aria-hidden="true">
      <rect x="88" y="12" width="64" height="86" rx="10" fill="none" stroke="rgb(103 232 249 / 0.6)" strokeWidth="2" />
      <rect x="110" y="6" width="20" height="8" rx="2" fill="rgb(103 232 249 / 0.5)" />
      <rect x="96" y="24" width="48" height="62" rx="3" fill="rgb(255 255 255 / 0.06)" />
      <rect
        className="energy-fill"
        x="96"
        y={24 + 62 * (1 - pct / 100)}
        width="48"
        height={62 * (pct / 100)}
        rx="3"
        fill="rgb(103 232 249 / 0.45)"
      />
      <text x="228" y="96" textAnchor="end" fill="#67e8f9" fontSize="11" fontFamily="var(--font-sans)">
        {charge >= 1.5 ? `×${Math.round(charge).toLocaleString()}` : `${pct < 8 ? pct.toFixed(1) : Math.round(pct)}%`}
      </text>
    </svg>
  );
}

function Scene({ footprint }) {
  const { scene, figures } = footprint;
  if (scene === "water") return <WaterScene bottles={figures.million.bottles} />;
  if (scene === "ice") return <GlacierScene />;
  if (scene === "drive") return <DriveScene km={figures.million.carKm} />;
  return <PhoneScene charge={figures.million.charge} />;
}

/** Right-hand toast: energy and carbon of the comparison, told as a picture. */
export function EnergySnackbar({ footprint, onDismiss }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!footprint) return;
    const timer = setTimeout(() => setLeaving(true), 16_000);
    return () => clearTimeout(timer);
  }, [footprint]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onDismiss, 280);
    return () => clearTimeout(timer);
  }, [leaving, onDismiss]);

  if (!footprint) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      data-leaving={leaving || undefined}
      className="energy-snack rounded-2xl border border-white/15 bg-slate-950/80 p-3.5 shadow-2xl shadow-cyan-950/40 backdrop-blur-md"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/70">Energy & carbon</p>
        <button
          type="button"
          onClick={() => setLeaving(true)}
          className="rounded-full px-1.5 text-white/40 transition hover:text-white"
          aria-label="Dismiss energy note"
        >
          ×
        </button>
      </div>
      <Scene footprint={footprint} />
      <p className="mt-2 text-sm leading-relaxed text-white/90">{footprint.headline}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-white/55">{footprint.thisRun}</p>
      {footprint.training && <p className="mt-1 text-xs leading-relaxed text-white/55">{footprint.training}</p>}
      <p className="mt-2 text-[10px] leading-relaxed text-white/35">
        {footprint.caption}. Rough picture from answering time on this machine - not a laboratory measurement.
      </p>
    </aside>
  );
}
