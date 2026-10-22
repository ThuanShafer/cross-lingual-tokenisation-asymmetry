export function mean(values) {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : NaN;
}

/** Sample standard deviation (n − 1); 0 for a single observation. */
export function standardDeviation(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1));
}

export function summarize(values) {
  const finite = values.filter(Number.isFinite);
  return { mean: mean(finite), sd: standardDeviation(finite), n: finite.length };
}

export function geometricMean(values) {
  const positive = values.filter((v) => v > 0);
  return positive.length ? Math.exp(mean(positive.map(Math.log))) : NaN;
}
