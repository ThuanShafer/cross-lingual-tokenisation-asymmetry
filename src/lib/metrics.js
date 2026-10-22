import { GENERATION, PRICING } from "@/config/model";
import { mean } from "./stats";
import { analyzeText, countWords } from "./tokenization";

/** Derives every comparison metric for one pane from its query, answer and the model's usage counters. */
export function buildMetrics({ query, answer, usage, model }) {
  const queryStats = analyzeText(query);
  const combined = analyzeText(`${query}\n${answer}`);
  const answerWords = countWords(answer);

  const contextTokens = usage.promptTokens + usage.outputTokens;
  const kvCacheBytes = contextTokens * model.kvCacheBytesPerToken;
  const costPerQuery =
    (usage.promptTokens * PRICING.inputPerMillion + usage.outputTokens * PRICING.outputPerMillion) / 1e6;

  return {
    queryTokens: queryStats.tokens,
    tokensPerWord: combined.tokensPerWord,
    charsPerToken: combined.charsPerToken,
    promptTokens: usage.promptTokens,
    outputTokens: usage.outputTokens,
    prefillMs: usage.promptEvalMs,
    waitMs: usage.promptEvalMs + usage.evalMs,
    wordsPerSecond: usage.evalMs ? answerWords / (usage.evalMs / 1000) : 0,
    kvCacheMb: kvCacheBytes / 1024 ** 2,
    contextUsedPct: (contextTokens / GENERATION.contextWindow) * 100,
    costAtScale: costPerQuery * PRICING.scaleQueries,
    costPerMillionWords: combined.words ? (costPerQuery / combined.words) * 1e6 : 0,
  };
}

const fmt = (digits) => (v) => v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
const ms = (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`);

/**
 * Row definitions for the metrics table. `higherIsWorse` tells the UI which
 * direction represents a penalty for the language.
 */
export const METRIC_ROWS = Object.freeze([
  { key: "queryTokens", label: "Query tokens", short: "Query tok.", hint: "o200k_base", plain: "Question length", plainHint: "how many pieces the question was split into", format: fmt(0), higherIsWorse: true },
  { key: "tokensPerWord", label: "Word pieces", short: "Tok/word", hint: "tokens / word", plain: "How finely words are chopped", plainHint: "more pieces per word means more work for the model", format: fmt(2), higherIsWorse: true },
  { key: "charsPerToken", label: "Character packing", short: "Packing", hint: "letters / token", plain: "How much text fits in each piece", plainHint: "higher means the model is more efficient", format: fmt(2), higherIsWorse: false },
  { key: "promptTokens", label: "Prompt tokens", short: "Prompt", hint: "model, incl. template", plain: "What the model had to read", plainHint: "the question plus its instructions", format: fmt(0), higherIsWorse: true },
  { key: "outputTokens", label: "Answer tokens", short: "Answer", hint: "model generated", plain: "What the model wrote", plainHint: "length of the generated answer", format: fmt(0), higherIsWorse: true },
  { key: "prefillMs", label: "Time to first token", short: "TTFT", hint: "model prefill", plain: "Time to start answering", plainHint: "wait before the first word appeared", format: ms, higherIsWorse: true },
  { key: "waitMs", label: "Total waiting time", short: "Wait", hint: "prefill + decode", plain: "Time to finish answering", plainHint: "from send to the last word", format: ms, higherIsWorse: true },
  { key: "wordsPerSecond", label: "Effective speed", short: "Speed", hint: "words / s", plain: "How quickly words arrived", plainHint: "words per second while writing", format: fmt(1), higherIsWorse: false },
  { key: "kvCacheMb", label: "Memory used", short: "Memory", hint: "KV cache", plain: "Working memory", plainHint: "scratch space the model used", format: (v) => `${fmt(1)(v)} MB`, higherIsWorse: true },
  { key: "contextUsedPct", label: "Context used", short: "Context", hint: `of ${GENERATION.contextWindow} tokens`, plain: "Attention used", plainHint: "share of the model's memory window", format: (v) => `${fmt(1)(v)}%`, higherIsWorse: true },
  { key: "costAtScale", label: "Total cost", short: "Cost", hint: "per 1M queries", plain: "Cost of a million questions", plainHint: "list-price estimate", format: (v) => `$${fmt(2)(v)}`, higherIsWorse: true },
  { key: "costPerMillionWords", label: "Cost per word", short: "Cost/word", hint: "per 1M words, length-fair", plain: "Cost per million words", plainHint: "fairer when the answers differ in length", format: (v) => `$${fmt(2)(v)}`, higherIsWorse: true },
]);

export const getMetricRow = (key) => METRIC_ROWS.find((row) => row.key === key);

/** Ratio of a language's metric against the English baseline (e.g. 2.4 → "2.4× English"). */
export function ratio(value, baseline) {
  if (!baseline || !Number.isFinite(value)) return null;
  return value / baseline;
}

/**
 * How much worse the target language is on a metric, oriented so that values
 * above 1 are always a penalty (inverts "higher is better" metrics).
 */
export function penaltyFactor(row, value, baseline) {
  if (!value || !baseline) return 1;
  return row.higherIsWorse ? value / baseline : baseline / value;
}

/** Per-metric mean over repeated runs of the same comparison. */
export function averageMetrics(samples) {
  return Object.fromEntries(METRIC_ROWS.map(({ key }) => [key, mean(samples.map((s) => s[key]))]));
}

/** Geometric mean of all penalty factors - a single "how much harder" number. */
export function overallPenalty(metrics, baseline) {
  const logs = METRIC_ROWS.map((row) => Math.log(penaltyFactor(row, metrics[row.key], baseline[row.key])));
  return Math.exp(logs.reduce((sum, v) => sum + v, 0) / logs.length);
}
