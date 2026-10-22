"use client";

import { isPaneBusy } from "@/hooks/useComparison";
import { describeAgreement } from "@/lib/plain-language";
import { StandbyOrb } from "./StandbyOrb";
import { MetricsTable } from "./MetricsTable";
import { TokenStrip } from "./TokenStrip";

const BAND_TONE = {
  same: "text-emerald-300",
  close: "text-emerald-300",
  partial: "text-amber-200",
  weak: "text-rose-300",
  none: "text-rose-300",
  unknown: "text-white/60",
};

const BUSY_LABELS = {
  generating: "Processing query",
  waiting: "Waiting for the other pane",
};

function AgreementScore({ row }) {
  const width = Math.max(0, Math.min(1, row.value)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-white/55">{row.label}</span>
        <span className={`text-right text-xs font-medium ${BAND_TONE[row.band] ?? "text-white"}`}>{row.reading}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <span className="metric-bar block h-full rounded-full" style={{ width: `${width}%` }} />
        </span>
        <span className="w-8 text-right font-mono text-[10px] tabular-nums text-white/35">{row.value.toFixed(2)}</span>
      </div>
    </div>
  );
}

/** Everyday reading of how the two answers compare, plus the display-only back-translation. */
function AnswerAnalysis({ analysis, languageName }) {
  if (!analysis) return null;
  const { agreement, backTranslation } = analysis;
  const reading = agreement ? describeAgreement(agreement, languageName) : null;
  return (
    <div className="fade-in flex flex-col gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm" dir="ltr">
      <p className="text-[10px] uppercase tracking-widest text-white/40">In plain words</p>
      {analysis.isLoading && (
        <p className="flex items-center gap-1.5 text-white/50">
          <span className="pulse-dot" /> comparing what the two answers mean
        </p>
      )}
      {reading && (
        <>
          <p className="leading-relaxed text-white/85">{reading.headline}</p>
          <div className="flex flex-col gap-2.5">
            {reading.rows.map((row) => (
              <AgreementScore key={row.key} row={row} />
            ))}
          </div>
        </>
      )}
      {backTranslation && (
        <p className="border-t border-white/10 pt-2 leading-relaxed text-white/70">
          <span className="mr-1 text-[10px] uppercase tracking-widest text-white/40">In English, that answer reads</span>
          {backTranslation}
        </p>
      )}
      {analysis.error && <p role="alert" className="text-rose-300">{analysis.error}</p>}
    </div>
  );
}

function RunBadge({ pane, progress }) {
  if (!progress?.runs || progress.runs < 2 || pane.status === "idle") return null;
  const label = isPaneBusy(pane)
    ? `Run ${progress.run} of ${progress.runs}`
    : `Mean of ${pane.samples.length} run${pane.samples.length === 1 ? "" : "s"}`;
  return <span className="self-start rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/55">{label}</span>;
}

function AnswerBody({ pane, tone, peerMetrics, baseline, dir, analysis, progress, languageName }) {
  if (pane.status === "idle") return <StandbyOrb tone={tone} />;
  if (isPaneBusy(pane) && !pane.answer) {
    return <StandbyOrb tone={tone} mode="thinking" label={BUSY_LABELS[pane.status] ?? "Working"} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <RunBadge pane={pane} progress={progress} />
      <p dir={dir} className="whitespace-pre-wrap text-[15px] italic leading-relaxed text-white/90">
        {pane.answer}
        {isPaneBusy(pane) && <span className="caret" aria-hidden="true" />}
      </p>
      <AnswerAnalysis analysis={analysis} languageName={languageName} />
      {pane.status === "error" && (
        <p role="alert" className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{pane.error}</p>
      )}
      {pane.metrics && (
        <div className="fade-in border-t border-white/15 pt-3">
          <MetricsTable metrics={pane.metrics} peerMetrics={peerMetrics} baseline={baseline} tone={tone} languageName={languageName} />
        </div>
      )}
    </div>
  );
}

/** Language heading plus the answer card (standby animation, answer, metrics table). */
export function AnswerPane({ tone, header, pane, peerMetrics, baseline, dir = "ltr", analysis = null, progress = null, languageName }) {
  return (
    <section className="flex min-w-0 flex-col gap-4" data-tone={tone}>
      <header className="flex h-11 items-center justify-center">{header}</header>
      <div className="pane-card flex min-h-[26rem] flex-1 flex-col justify-center rounded-3xl p-6">
        <AnswerBody pane={pane} tone={tone} peerMetrics={peerMetrics} baseline={baseline} dir={dir} analysis={analysis} progress={progress} languageName={languageName} />
      </div>
    </section>
  );
}

/** Fixed-height query input with live token pieces. */
export function QueryInput({
  tone,
  query,
  onQueryChange,
  onSubmit,
  isTranslating,
  translationError,
  placeholder,
  dir = "ltr",
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className="pane-input resizable flex h-56 max-h-[85vh] min-h-56 min-w-0 resize-y flex-col overflow-hidden rounded-2xl p-4"
      data-tone={tone}
      aria-busy={isTranslating}
    >
      <div className="flex h-5 shrink-0 items-center justify-end text-[11px] uppercase tracking-widest">
        {isTranslating && (
          <span className="flex items-center gap-1.5 text-white/50">
            <span className="pulse-dot" /> translating
          </span>
        )}
        {translationError && (
          <span role="alert" className="truncate normal-case tracking-normal text-rose-300">
            {translationError}
          </span>
        )}
      </div>
      <textarea
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        dir={dir}
        disabled={isTranslating}
        className="min-h-20 w-full flex-1 basis-0 resize-none overflow-y-auto bg-transparent text-lg italic text-white outline-none transition-opacity placeholder:text-white/35 disabled:cursor-wait disabled:opacity-50"
      />
      <div className="mt-3 min-h-12 flex-1 basis-0 overflow-y-auto border-t border-white/10 pt-3">
        <TokenStrip text={query} tone={tone} />
      </div>
    </div>
  );
}
