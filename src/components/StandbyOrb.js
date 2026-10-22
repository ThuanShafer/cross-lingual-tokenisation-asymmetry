"use client";

import { useEffect, useRef } from "react";

const PALETTES = {
  cyan: { from: "#67e8f9", to: "#a78bfa", core: "103, 232, 249" },
  amber: { from: "#fbbf24", to: "#f472b6", core: "251, 191, 36" },
};

const MODES = {
  idle: { speed: 1, energy: 1 },
  thinking: { speed: 3.2, energy: 1.6 },
};

const CURVE_COUNT = 30;
const POINTS_PER_CURVE = 160;
const TAU = Math.PI * 2;

function seededRandom(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Each curve shares a slow low-frequency "blob" (so the set reads as contour
 * lines) plus its own high-frequency ripples (so the lines tangle).
 */
function createCurves(seed) {
  const rand = seededRandom(seed);
  const blob = [3, 5, 2].map((k, i) => ({
    k,
    amp: [0.2, 0.1, 0.08][i],
    phase: rand() * TAU,
    drift: (rand() - 0.5) * 0.5,
  }));

  return Array.from({ length: CURVE_COUNT }, (_, i) => ({
    radius: 0.3 + (i / CURVE_COUNT) * 0.6 + rand() * 0.05,
    rotation: rand() * TAU,
    spin: (rand() - 0.5) * 0.14,
    lag: i * 0.09,
    blob,
    ripples: Array.from({ length: 2 }, () => ({
      k: 4 + Math.floor(rand() * 6),
      amp: 0.05 + rand() * 0.07,
      phase: rand() * TAU,
      drift: (rand() - 0.5) * 1.1,
    })),
  }));
}

function radiusAt(curve, theta, t, energy) {
  let r = 1;
  for (const h of curve.blob) r += h.amp * energy * Math.sin(h.k * theta + h.phase + h.drift * t - curve.lag);
  for (const h of curve.ripples) r += h.amp * energy * Math.sin(h.k * theta + h.phase + h.drift * t);
  return curve.radius * r;
}

function drawFrame(ctx, size, curves, palette, t, energy) {
  const center = size / 2;
  const scale = size * 0.36;
  ctx.clearRect(0, 0, size, size);

  const pulse = 0.9 + Math.sin(t * 1.6) * 0.1;
  const core = ctx.createRadialGradient(center, center, 0, center, center, scale * 0.38 * pulse);
  core.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
  core.addColorStop(0.12, `rgba(${palette.core}, 1)`);
  core.addColorStop(0.45, `rgba(${palette.core}, 0.75)`);
  core.addColorStop(1, `rgba(${palette.core}, 0)`);
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  const stroke = ctx.createLinearGradient(0, 0, size, size);
  stroke.addColorStop(0, palette.from);
  stroke.addColorStop(1, palette.to);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, size / 220);
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";

  curves.forEach((curve, i) => {
    ctx.globalAlpha = 0.2 + (i / CURVE_COUNT) * 0.25;
    ctx.beginPath();
    for (let p = 0; p <= POINTS_PER_CURVE; p += 1) {
      const theta = (p / POINTS_PER_CURVE) * TAU;
      const r = radiusAt(curve, theta, t, energy) * scale;
      const angle = theta + curve.rotation + curve.spin * t;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/** Flowing-lines standby animation. `mode="thinking"` speeds up and intensifies it. */
export function StandbyOrb({ tone = "cyan", mode = "idle", label = "Standing by" }) {
  const canvasRef = useRef(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const palette = PALETTES[tone] ?? PALETTES.cyan;
    const curves = createCurves(tone === "amber" ? 7 : 3);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let size = 0;
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let t = 0;
    const current = { ...MODES.idle };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth * dpr;
      canvas.width = size;
      canvas.height = size;
      drawFrame(ctx, size, curves, palette, t, current.energy);
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const target = MODES[modeRef.current] ?? MODES.idle;
      const ease = 1 - Math.exp(-dt * 3);
      current.speed += (target.speed - current.speed) * ease;
      current.energy += (target.energy - current.energy) * ease;
      t += dt * current.speed;
      drawFrame(ctx, size, curves, palette, t, current.energy);
      frame = visible ? requestAnimationFrame(tick) : 0;
    };

    const start = () => {
      if (reducedMotion || frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    visibilityObserver.observe(canvas);

    resize();
    start();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [tone]);

  return (
    <div className="orb" data-tone={tone} data-mode={mode} role="status" aria-label={label}>
      <canvas ref={canvasRef} className="orb-canvas" aria-hidden="true" />
      <p className="orb-label">{label}</p>
    </div>
  );
}
