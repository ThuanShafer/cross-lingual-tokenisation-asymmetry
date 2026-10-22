import "server-only";
import { pipeline } from "@huggingface/transformers";
import { enqueueInference, singleton } from "./transformers-runtime";

/**
 * Two sentence encoders:
 * - LaBSE (109 languages incl. Māori and Samoan) compares texts across languages directly.
 *   Its raw cosine scores are compressed (unrelated text ≈ 0.6), so they are rescaled against a
 *   chance baseline, as in BERTScore: (s − b) / (1 − b).
 * - all-MiniLM-L6-v2 compares two English texts (used on back-translations).
 */
export const ENCODERS = Object.freeze({
  crossLingual: { id: "Xenova/LaBSE", label: "LaBSE", pooling: "cls" },
  english: { id: "Xenova/all-MiniLM-L6-v2", label: "all-MiniLM-L6-v2", pooling: "mean" },
});

/** Unrelated sentence pairs across the app's languages; their mean similarity is LaBSE's chance level. */
const BASELINE_PAIRS = [
  ["The train leaves the station at seven every morning.", "Ka pai te kai i te wharekai hou."],
  ["My grandmother grows tomatoes in her garden.", "El concierto empieza a las nueve de la noche."],
  ["Please close the window before it rains.", "明日は図書館で本を借ります。"],
  ["The football match was cancelled due to snow.", "我喜欢在周末去爬山。"],
  ["He repaired the bicycle with a new chain.", "मैं हर सुबह चाय पीता हूँ।"],
  ["The museum opens a new exhibition next week.", "Ua ou alu i le maketi ananafi."],
  ["Our cat sleeps on the sofa all afternoon.", "Le restaurant est fermé le lundi."],
  ["The bank raised interest rates again.", "أحب قراءة الشعر في المساء."],
];

const loadEncoder = ({ id }) => singleton(`embedding:${id}`, () => pipeline("feature-extraction", id, { dtype: "q8" }));

async function embed(encoder, texts, signal) {
  const extract = await loadEncoder(encoder);
  const output = await enqueueInference(() => extract(texts, { pooling: encoder.pooling, normalize: true }), signal);
  return output.tolist();
}

const cosine = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);

function getBaseline() {
  return singleton("embedding:labse-baseline", async () => {
    const vectors = await embed(ENCODERS.crossLingual, BASELINE_PAIRS.flat());
    const scores = BASELINE_PAIRS.map((_, i) => cosine(vectors[2 * i], vectors[2 * i + 1]));
    return scores.reduce((sum, v) => sum + v, 0) / scores.length;
  });
}

export async function warmUpEncoders() {
  await Promise.all([loadEncoder(ENCODERS.crossLingual), loadEncoder(ENCODERS.english)]);
  await getBaseline();
}

/** Baseline-rescaled LaBSE similarity for each `[a, b]` pair, plus the baseline used. */
export async function crossLingualSimilarity(pairs, signal) {
  const [baseline, vectors] = await Promise.all([getBaseline(), embed(ENCODERS.crossLingual, pairs.flat(), signal)]);
  const scores = pairs.map((_, i) => (cosine(vectors[2 * i], vectors[2 * i + 1]) - baseline) / (1 - baseline));
  return { scores, baseline };
}

/** Plain cosine similarity of two English texts. */
export async function englishSimilarity(a, b, signal) {
  const [va, vb] = await embed(ENCODERS.english, [a, b], signal);
  return cosine(va, vb);
}
