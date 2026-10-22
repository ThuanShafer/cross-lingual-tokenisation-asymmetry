import "server-only";
import { getLanguage } from "@/config/languages";
import { translateSentence } from "./nllb-translator";

function splitSentences(text, locale) {
  const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
  return [...segmenter.segment(text)].map((s) => s.segment.trim()).filter(Boolean);
}

/**
 * Yields the translation sentence by sentence (NLLB is trained on
 * sentence-level pairs, so this is both more accurate and streamable).
 */
export async function* translateSentences({ text, from, to, signal }) {
  const source = getLanguage(from);
  const target = getLanguage(to);
  const separator = target.unspaced ? "" : " ";

  let first = true;
  for (const sentence of splitSentences(text, from)) {
    const translated = await translateSentence(sentence, source.nllb, target.nllb, signal);
    yield first ? translated : separator + translated;
    first = false;
  }
}

export async function translate({ text, from, to, signal }) {
  let translation = "";
  for await (const piece of translateSentences({ text, from, to, signal })) translation += piece;
  return { translation };
}
