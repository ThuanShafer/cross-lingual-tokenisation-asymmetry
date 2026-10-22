import "server-only";
import { pipeline } from "@huggingface/transformers";
import { enqueueInference, singleton } from "./transformers-runtime";

const MODEL_ID = process.env.TRANSLATION_MODEL ?? "Xenova/nllb-200-distilled-600M";

const loadTranslator = () =>
  singleton(`translation:${MODEL_ID}`, () => pipeline("translation", MODEL_ID, { dtype: "q8" }));

export const warmUpTranslator = loadTranslator;

/** Translates a single sentence between NLLB language codes (e.g. eng_Latn → mri_Latn). */
export async function translateSentence(text, srcLang, tgtLang, signal) {
  const translator = await loadTranslator();
  const [result] = await enqueueInference(
    () => translator(text, { src_lang: srcLang, tgt_lang: tgtLang, max_new_tokens: 256 }),
    signal,
  );
  return result.translation_text.trim();
}
