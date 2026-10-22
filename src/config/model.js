/** Generation settings applied identically to every language. */
export const GENERATION = Object.freeze({
  contextWindow: 4096,
  maxOutputTokens: 320,
});

/** Each comparison is repeated so timings can be reported as mean ± SD. */
export const BENCHMARK = Object.freeze({
  repeats: 3,
});

/** Hosted-API reference pricing (USD per 1M tokens), modelled on GPT-4o mini. */
export const PRICING = Object.freeze({
  label: "GPT-4o mini list price",
  inputPerMillion: 0.15,
  outputPerMillion: 0.6,
  scaleQueries: 1_000_000,
});

export const TOKENIZER_LABEL = "o200k_base (GPT-4o)";
