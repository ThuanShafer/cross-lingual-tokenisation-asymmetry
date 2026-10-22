"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useFindings } from "@/hooks/useFindings";
import { requestAgreement } from "@/lib/api-client";
import { findingsStore } from "@/lib/findings-store";
import { analyzeFindings } from "@/lib/report-analysis";
import { Paper } from "./Paper";

const noopSubscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/** Fills in missing back-translations and semantic agreement scores, one finding at a time. */
function useAgreementBackfill(findings) {
  const pending = findings.filter((f) => !f.agreement && f.target.answer?.trim() && f.source.answer?.trim());
  const [failed, setFailed] = useState(() => new Set());
  const next = pending.find((f) => !failed.has(f.id));

  useEffect(() => {
    if (!next) return;
    const controller = new AbortController();
    requestAgreement({
      englishQuery: next.source.query,
      targetQuery: next.target.query,
      englishAnswer: next.source.answer,
      targetAnswer: next.target.answer,
      target: next.target.code,
      signal: controller.signal,
    })
      .then(({ backTranslation, agreement }) => findingsStore.update(next.id, { backTranslation, agreement }))
      .catch((error) => {
        if (error.name !== "AbortError") setFailed((prev) => new Set(prev).add(next.id));
      });
    return () => controller.abort();
  }, [next]);

  return { remaining: pending.filter((f) => !failed.has(f.id)).length };
}

function useSystemInfo() {
  const [system, setSystem] = useState(null);
  useEffect(() => {
    fetch("/api/system")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSystem)
      .catch(() => setSystem(null));
  }, []);
  return system;
}

function Toolbar({ models, modelName, onModelChange, status, canPrint }) {
  return (
    <div className="screen-only sticky top-0 z-10 mb-6 border-b border-stone-300 bg-stone-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-3 px-2 py-3 font-sans text-sm text-stone-700">
        <Link href="/" className="text-stone-500 hover:text-stone-900">
          ← Back to the lab
        </Link>
        {models.length > 1 && (
          <label className="flex items-center gap-2">
            Model
            <select value={modelName} onChange={(e) => onModelChange(e.target.value)} className="rounded border border-stone-300 bg-white px-2 py-1">
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="text-xs text-stone-500">{status}</span>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!canPrint}
          className="ml-auto rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-stone-700 disabled:opacity-40"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

/** Research-paper view of the session findings, rendered for the browser's print-to-PDF. */
export function ResearchReport() {
  const hydrated = useHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const allFindings = useFindings();
  const system = useSystemInfo();

  const models = [...new Set(allFindings.map((f) => f.model.name))];
  const requested = searchParams.get("model");
  const modelName = models.includes(requested) ? requested : models[0];
  const findings = useMemo(() => allFindings.filter((f) => f.model.name === modelName), [allFindings, modelName]);
  const analysis = useMemo(() => (findings.length ? analyzeFindings(findings) : null), [findings]);
  const { remaining } = useAgreementBackfill(findings);
  const [generatedAt] = useState(() => new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }));

  useEffect(() => {
    if (modelName) document.title = `Tokenization asymmetry - ${modelName} - ${new Date().toISOString().slice(0, 10)}`;
  }, [modelName]);

  if (!hydrated) return <p className="paper-status">Loading report…</p>;
  if (!analysis) {
    return (
      <p className="paper-status">
        No findings yet. Run at least one comparison in the <Link href="/" className="underline">lab</Link>, then open the report again.
      </p>
    );
  }

  const status = remaining
    ? `Analysing answer meaning and back-translations (${remaining} left)…`
    : `${analysis.languages.length} language${analysis.languages.length === 1 ? "" : "s"} · ${analysis.totalRuns} paired runs · title and author are editable`;

  return (
    <>
      <Toolbar
        models={models}
        modelName={modelName}
        onModelChange={(name) => router.replace(`/report?model=${encodeURIComponent(name)}`)}
        status={status}
        canPrint={!remaining}
      />
      <Paper analysis={analysis} system={system} generatedAt={generatedAt} />
    </>
  );
}
