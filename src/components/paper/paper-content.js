import { GENERATION, PRICING, TOKENIZER_LABEL } from "@/config/model";

/** Operational definition and data source of every metric, for the method section's metric table. */
export const METRIC_DEFINITIONS = {
  queryTokens: { definition: `Tokens in the user query under ${TOKENIZER_LABEL}.`, source: "Tokenizer" },
  tokensPerWord: { definition: "Tokens per word (Unicode word segmentation) over query + answer - tokenizer fertility.", source: "Tokenizer" },
  charsPerToken: { definition: "Characters (excluding whitespace) per token over query + answer.", source: "Tokenizer" },
  promptTokens: { definition: "Prompt tokens evaluated by the model, including system prompt and chat template.", source: "Ollama" },
  outputTokens: { definition: "Tokens generated for the answer.", source: "Ollama" },
  prefillMs: { definition: "Prompt evaluation (prefill) time - time to first token.", source: "Ollama" },
  waitMs: { definition: "Prefill + decode time for the full answer.", source: "Ollama" },
  wordsPerSecond: { definition: "Answer words per second of decode time.", source: "Ollama" },
  kvCacheMb: { definition: "fp16 KV-cache size of prompt + answer: 2 × layers × KV heads × head dim × 2 B per token.", source: "Derived" },
  contextUsedPct: { definition: `Share of the ${GENERATION.contextWindow.toLocaleString()}-token context window used.`, source: "Derived" },
  costAtScale: { definition: `Cost of 1M such queries at the ${PRICING.label} ($${PRICING.inputPerMillion}/1M in, $${PRICING.outputPerMillion}/1M out).`, source: "Derived" },
  costPerMillionWords: { definition: "Query cost per 1M words of query + answer; normalises for answer length.", source: "Derived" },
};

export const REFERENCES = [
  {
    id: "petrov2023",
    text: "Petrov, A., La Malfa, E., Torr, P. H. S., & Bibi, A. (2023). Language Model Tokenizers Introduce Unfairness Between Languages. Advances in Neural Information Processing Systems 36 (NeurIPS 2023).",
  },
  {
    id: "ahia2023",
    text: "Ahia, O., Kumar, S., Gonen, H., Kasai, J., Mortensen, D. R., Smith, N. A., & Tsvetkov, Y. (2023). Do All Languages Cost the Same? Tokenization in the Era of Commercial Language Models. Proceedings of EMNLP 2023.",
  },
  {
    id: "nllb2022",
    text: "NLLB Team, Costa-jussà, M. R., et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation. arXiv:2207.04672.",
  },
  {
    id: "labse2022",
    text: "Feng, F., Yang, Y., Cer, D., Arivazhagan, N., & Wang, W. (2022). Language-agnostic BERT Sentence Embedding. Proceedings of ACL 2022.",
  },
  {
    id: "sbert2019",
    text: "Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. Proceedings of EMNLP-IJCNLP 2019.",
  },
  {
    id: "bertscore2020",
    text: "Zhang, T., Kishore, V., Wu, F., Weinberger, K. Q., & Artzi, Y. (2020). BERTScore: Evaluating Text Generation with BERT. International Conference on Learning Representations (ICLR 2020).",
  },
  { id: "ollama", text: "Ollama (2024–2026). Ollama: run large language models locally. https://ollama.com" },
  { id: "tiktoken", text: "OpenAI (2024). o200k_base tokenizer, distributed with tiktoken; JavaScript port gpt-tokenizer. https://github.com/niieani/gpt-tokenizer" },
];

export const cite = (id) => `[${REFERENCES.findIndex((r) => r.id === id) + 1}]`;
