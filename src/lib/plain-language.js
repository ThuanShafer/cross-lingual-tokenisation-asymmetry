import { METRIC_ROWS, overallPenalty, penaltyFactor } from "./metrics";

const SAME_BAND = 0.05;

/**
 * Everyday reading of a 0–1 meaning-similarity score
 * (1 = same meaning, 0 = unrelated; slightly negative is still unrelated).
 */
export function describeScore(value) {
  if (!Number.isFinite(value)) return { band: "unknown", phrase: "not available yet" };
  if (value >= 0.85) return { band: "same", phrase: "essentially the same meaning" };
  if (value >= 0.7) return { band: "close", phrase: "mostly the same idea" };
  if (value >= 0.45) return { band: "partial", phrase: "loosely related" };
  if (value >= 0.25) return { band: "weak", phrase: "only a faint connection" };
  return { band: "none", phrase: "talking about something else" };
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/**
 * Turns the three agreement scores into a headline and three plain-language rows.
 */
export function describeAgreement(agreement, languageName) {
  const answer = describeScore(agreement.answer);
  const back = describeScore(agreement.answerBackTranslated);
  const query = describeScore(agreement.query);

  const queryOk = agreement.query >= 0.7;
  const queryWeak = agreement.query < 0.5;
  const answerOk = agreement.answer >= 0.7;
  const answerOff = agreement.answer < 0.5;
  const backOff = agreement.answerBackTranslated < 0.25;

  let headline;
  if (answerOk && queryOk) {
    headline = `The ${languageName} answer is saying much the same thing as the English one.`;
  } else if (answerOff && queryOk) {
    headline = `The question came through clearly, but the ${languageName} answer is about something else.`;
  } else if (answerOff && queryWeak) {
    headline = `The question drifted in translation, and the answers diverged as well.`;
  } else if (answerOk && queryWeak) {
    headline = `The questions differed, yet the answers still lined up.`;
  } else {
    headline = `The ${languageName} answer only partly matches the English one.`;
  }

  if (backOff && agreement.answer >= 0.45) {
    headline += " Put back into English, it no longer matches.";
  } else if (backOff && answerOff) {
    headline += " Putting it back into English confirms they are unrelated.";
  }

  return {
    headline,
    rows: [
      {
        key: "answer",
        label: "Did they give the same kind of answer?",
        reading: capitalize(answer.phrase),
        band: answer.band,
        value: agreement.answer,
      },
      {
        key: "answerBackTranslated",
        label: "After putting the other answer into English",
        reading: capitalize(back.phrase),
        band: back.band,
        value: agreement.answerBackTranslated,
      },
      {
        key: "query",
        label: "Did the question stay the same in translation?",
        reading: capitalize(query.phrase),
        band: query.band,
        value: agreement.query,
      },
    ],
  };
}

/**
 * Relative size of a number versus a baseline, in everyday English
 * ("about 15% more than English", "about twice as much as English").
 */
export function asMuchAs(factor, reference = "English") {
  if (!Number.isFinite(factor) || factor <= 0) return `not comparable to ${reference}`;
  const pct = Math.round(Math.abs(factor - 1) * 100);
  if (pct < SAME_BAND * 100) return `about the same as ${reference}`;
  if (factor >= 2.75) return `about ${Math.round(factor)} times as much as ${reference}`;
  if (factor >= 1.85) return `about twice as much as ${reference}`;
  if (factor > 1) return `about ${pct}% more than ${reference}`;
  if (factor <= 0.4) return `about ${Math.round(1 / factor)} times less than ${reference}`;
  if (factor <= 0.55) return `about half as much as ${reference}`;
  return `about ${pct}% less than ${reference}`;
}

/** How much longer the target question is for the model than the English one. */
export function describeTokenLoad(multiplier, targetName) {
  if (!Number.isFinite(multiplier)) return null;
  const pct = Math.round(Math.abs(multiplier - 1) * 100);
  if (pct < SAME_BAND * 100) return `The ${targetName} question is about as long for the model as the English one.`;
  if (multiplier >= 2.75) return `The ${targetName} question is about ${Math.round(multiplier)} times as long for the model as the English one.`;
  if (multiplier >= 1.85) return `The ${targetName} question is about twice as long for the model as the English one.`;
  if (multiplier > 1) return `The ${targetName} question is about ${pct}% longer for the model than the English one.`;
  if (multiplier <= 0.55) return `The ${targetName} question is about half as long for the model as the English one.`;
  return `The ${targetName} question is about ${pct}% shorter for the model than the English one.`;
}

/**
 * One-sentence reading of the twelve-metric comparison, naming the biggest gaps.
 */
export function describeResourceGap(targetName, targetMetrics, englishMetrics) {
  const overall = overallPenalty(targetMetrics, englishMetrics);
  const relative = asMuchAs(overall);
  const headline =
    relative === "about the same as English"
      ? `${targetName} cost about the same as English overall.`
      : `${targetName} cost ${relative} overall.`;

  const drivers = METRIC_ROWS.map((row) => ({
    row,
    factor: penaltyFactor(row, targetMetrics[row.key], englishMetrics[row.key]),
  }))
    .filter((d) => d.factor >= 1 + SAME_BAND)
    .sort((a, b) => b.factor - a.factor)
    .slice(0, 2);

  if (!drivers.length) return headline;

  const gaps = drivers.map((d) => `${(d.row.plain ?? d.row.label).toLowerCase()} (${asMuchAs(d.factor)})`);
  const list = gaps.length === 1 ? gaps[0] : `${gaps[0]}, and ${gaps[1]}`;
  return `${headline} The biggest gaps were ${list}.`;
}
