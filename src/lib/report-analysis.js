import { TARGET_LANGUAGES } from "@/config/languages";
import { METRIC_ROWS, penaltyFactor } from "./metrics";
import { geometricMean, mean, summarize } from "./stats";

const ORDER = new Map(TARGET_LANGUAGES.map((l, i) => [l.code, i]));

/** Pairs run i of the target with run i of English (both measured in the same request pair). */
function pairedRuns(finding) {
  const n = Math.min(finding.source.samples.length, finding.target.samples.length);
  return Array.from({ length: n }, (_, i) => ({ source: finding.source.samples[i], target: finding.target.samples[i] }));
}

function extremesOf(list, pick) {
  const ranked = [...list].sort((a, b) => pick(b) - pick(a));
  return { highest: ranked[0], lowest: ranked.at(-1) };
}

function analyzeFinding(finding) {
  const runs = pairedRuns(finding);
  const metrics = Object.fromEntries(
    METRIC_ROWS.map((row) => [
      row.key,
      {
        source: summarize(runs.map((r) => r.source[row.key])),
        target: summarize(runs.map((r) => r.target[row.key])),
        ratio: summarize(runs.map((r) => (r.source[row.key] ? r.target[row.key] / r.source[row.key] : NaN))),
      },
    ]),
  );
  const overall = summarize(
    runs.map((r) => geometricMean(METRIC_ROWS.map((row) => penaltyFactor(row, r.target[row.key], r.source[row.key])))),
  );
  return { finding, runs: runs.length, metrics, overall };
}

/**
 * Aggregates every session finding for one model into the numbers the
 * research report needs: per-language summaries, a pooled English baseline,
 * and headline extremes for the abstract.
 */
export function analyzeFindings(findings) {
  const languages = [...findings]
    .sort((a, b) => (ORDER.get(a.target.code) ?? 99) - (ORDER.get(b.target.code) ?? 99))
    .map(analyzeFinding);

  const englishSamples = findings.flatMap((f) => f.source.samples);
  const english = Object.fromEntries(METRIC_ROWS.map((row) => [row.key, summarize(englishSamples.map((s) => s[row.key]))]));
  const englishQueries = [...new Set(findings.map((f) => f.source.query.trim()))];

  const extremes = (pick) => extremesOf(languages, pick);

  const scored = languages.filter((l) => l.finding.agreement);
  const agreementMean = (key) => mean(scored.map((l) => l.finding.agreement[key]));
  const agreement = scored.length
    ? {
        languages: scored,
        answer: agreementMean("answer"),
        answerBackTranslated: agreementMean("answerBackTranslated"),
        query: agreementMean("query"),
        baseline: scored[0].finding.agreement.baseline,
        encoders: scored[0].finding.agreement.encoders,
        ...extremesOf(scored, (l) => l.finding.agreement.answer),
      }
    : null;

  return {
    model: findings[0]?.model ?? null,
    agreement,
    languages,
    english,
    englishQueries,
    sharedEnglishQuery: englishQueries.length === 1,
    totalRuns: languages.reduce((sum, l) => sum + l.runs, 0),
    overall: { ...extremes((l) => l.overall.mean), mean: geometricMean(languages.map((l) => l.overall.mean)) },
    byMetric: (key) => ({
      ...extremes((l) => l.metrics[key].ratio.mean),
      mean: geometricMean(languages.map((l) => l.metrics[key].ratio.mean)),
    }),
  };
}
