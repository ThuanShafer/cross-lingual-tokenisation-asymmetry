"use client";

import { useDeferredValue, useMemo } from "react";
import { analyzeText } from "@/lib/tokenization";
import { describeTokenLoad } from "@/lib/plain-language";

/** Live headline comparing how long the two questions are for the model. */
export function AsymmetryBanner({ englishText, targetText, targetName }) {
  const en = useDeferredValue(englishText);
  const target = useDeferredValue(targetText);
  const [enStats, targetStats] = useMemo(() => [analyzeText(en), analyzeText(target)], [en, target]);

  const ready = enStats.tokens > 0 && targetStats.tokens > 0;
  const multiplier = ready ? targetStats.tokens / enStats.tokens : null;
  const reading = describeTokenLoad(multiplier, targetName);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm text-white/70 backdrop-blur">
      <p className="text-center leading-snug text-white/85" aria-live="polite">
        {reading ?? "Type in either pane - we will say how much longer the other language is for the model."}
      </p>
      {ready && (
        <p className="text-[11px] text-white/40">
          <span className="font-mono text-cyan-300">{enStats.tokens}</span> pieces in English ·{" "}
          <span className="font-mono text-amber-300">{targetStats.tokens}</span> in {targetName}
        </p>
      )}
    </div>
  );
}
