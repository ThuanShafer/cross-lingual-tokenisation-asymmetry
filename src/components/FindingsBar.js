"use client";

import Link from "next/link";
import { TARGET_LANGUAGES } from "@/config/languages";
import { useFindings } from "@/hooks/useFindings";
import { findingsStore } from "@/lib/findings-store";

/** Session findings for the selected model, plus the entry point to the research report. */
export function FindingsBar({ modelName, activeTarget, onReplay }) {
  const findings = useFindings().filter((f) => f.model.name === modelName);
  const collected = new Map(findings.map((f) => [f.target.code, f]));

  return (
    <section className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5">
      <div className="flex flex-col">
        <span className="text-sm font-semibold tracking-wide text-white/90">Session findings</span>
        <span className="text-[11px] text-white/45">
          {findings.length
            ? `${findings.length} of ${TARGET_LANGUAGES.length} languages collected for ${modelName}`
            : "Each completed comparison is added here for the research report"}
        </span>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {TARGET_LANGUAGES.map((language) => {
          const finding = collected.get(language.code);
          const state = finding ? "collected" : "missing";
          return (
            <li
              key={language.code}
              data-state={state}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] ${
                finding ? "border-amber-300/50 bg-amber-300/10 text-amber-100" : "border-white/10 text-white/35"
              } ${language.code === activeTarget ? "ring-1 ring-white/30" : ""}`}
            >
              {finding && <span aria-hidden="true">✓</span>}
              {finding && onReplay ? (
                <button type="button" onClick={() => onReplay(finding)} className="hover:text-white">
                  {language.name}
                </button>
              ) : (
                language.name
              )}
              {finding && (
                <button
                  type="button"
                  onClick={() => findingsStore.remove(finding.id)}
                  className="ml-0.5 text-amber-100/50 hover:text-white"
                  aria-label={`Remove ${language.name} finding`}
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="ml-auto flex items-center gap-2">
        {findings.length > 0 && (
          <button
            type="button"
            onClick={() => findingsStore.clear()}
            className="rounded-full px-3 py-1 text-xs text-white/50 transition hover:text-white"
          >
            Clear
          </button>
        )}
        <Link
          href={`/report?model=${encodeURIComponent(modelName ?? "")}`}
          target="_blank"
          aria-disabled={!findings.length}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
            findings.length
              ? "border-white/25 text-white hover:border-white/60"
              : "pointer-events-none border-white/10 text-white/30"
          }`}
        >
          Open research report ↗
        </Link>
      </div>
    </section>
  );
}
