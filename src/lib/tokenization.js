import { encode, decode } from "gpt-tokenizer/encoding/o200k_base";

const REPLACEMENT_CHAR = "\uFFFD";
const segmenter =
  typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "word" })
    : null;

/**
 * Splits text into the visible pieces the tokenizer produces. Tokens that cut
 * through a multi-byte character are merged until they decode cleanly.
 */
export function tokenizeToPieces(text) {
  if (!text) return [];
  const ids = encode(text);
  const pieces = [];
  let pending = [];

  for (const id of ids) {
    pending.push(id);
    const piece = decode(pending);
    if (!piece.includes(REPLACEMENT_CHAR)) {
      pieces.push({ text: piece, tokens: pending.length });
      pending = [];
    }
  }
  if (pending.length) pieces.push({ text: decode(pending), tokens: pending.length });

  return pieces;
}

export function countTokens(text) {
  return text ? encode(text).length : 0;
}

export function countWords(text) {
  if (!text?.trim()) return 0;
  if (segmenter) {
    let count = 0;
    for (const s of segmenter.segment(text)) if (s.isWordLike) count += 1;
    return count;
  }
  return text.trim().split(/\s+/).length;
}

export function countCharacters(text) {
  return text ? [...text.replace(/\s/g, "")].length : 0;
}

export function analyzeText(text) {
  const tokens = countTokens(text);
  const words = countWords(text);
  const characters = countCharacters(text);
  return {
    tokens,
    words,
    characters,
    tokensPerWord: words ? tokens / words : 0,
    charsPerToken: tokens ? characters / tokens : 0,
  };
}
