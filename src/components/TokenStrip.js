"use client";

import { useDeferredValue, useMemo } from "react";
import { tokenizeToPieces } from "@/lib/tokenization";

const MAX_PIECES = 160;

/** Renders text as the token pieces a BPE tokenizer splits it into. */
export function TokenStrip({ text, tone }) {
  const deferredText = useDeferredValue(text);
  const pieces = useMemo(() => tokenizeToPieces(deferredText), [deferredText]);

  if (!pieces.length) {
    return <p className="text-xs text-white/40">Token pieces appear here as you type.</p>;
  }

  const visible = pieces.slice(0, MAX_PIECES);
  return (
    <div className="flex flex-wrap gap-y-1 font-mono text-[11px] leading-5" data-tone={tone}>
      {visible.map((piece, i) => (
        <span key={i} className="token-chip" data-alt={i % 2 === 1} title={`${piece.tokens} token(s)`}>
          {piece.text.replaceAll(" ", "·").replaceAll("\n", "↵")}
        </span>
      ))}
      {pieces.length > MAX_PIECES && (
        <span className="px-1 text-white/50">+{pieces.length - MAX_PIECES} more</span>
      )}
    </div>
  );
}
