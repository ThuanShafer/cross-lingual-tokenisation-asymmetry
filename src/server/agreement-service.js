import "server-only";
import { SOURCE_LANGUAGE } from "@/config/languages";
import { ENCODERS, crossLingualSimilarity, englishSimilarity } from "./embedding-service";
import { translate } from "./translation-service";

/**
 * How closely the target-language answer matches the English answer in meaning:
 * - `answer`: LaBSE, directly across languages (no translation involved);
 * - `answerBackTranslated`: English encoder on the NLLB back-translation;
 * - `query`: LaBSE on the two queries, checking the live query translation.
 */
export async function analyzeAgreement({ englishQuery, targetQuery, englishAnswer, targetAnswer, target, signal }) {
  const { translation: backTranslation } = await translate({ text: targetAnswer, from: target, to: SOURCE_LANGUAGE.code, signal });

  const [{ scores, baseline }, answerBackTranslated] = await Promise.all([
    crossLingualSimilarity(
      [
        [englishAnswer, targetAnswer],
        [englishQuery, targetQuery],
      ],
      signal,
    ),
    englishSimilarity(englishAnswer, backTranslation, signal),
  ]);

  return {
    backTranslation,
    agreement: {
      answer: scores[0],
      query: scores[1],
      answerBackTranslated,
      baseline,
      encoders: { crossLingual: ENCODERS.crossLingual.label, english: ENCODERS.english.label },
    },
  };
}
