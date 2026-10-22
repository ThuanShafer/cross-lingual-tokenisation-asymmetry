# Cross-Lingual Tokenization Asymmetry

Side-by-side lab showing what the *same question* costs a language model in English versus
Te Reo Māori (and other languages).

- Type in either pane - the query is translated live into the other pane by **NLLB-200**
  (debounced, cancellable; the receiving input is locked while translating).
- Pick the comparison language (right dropdown) and the **Ollama model** (top dropdown; every
  installed model is listed).
- Submit (Enter or **Compare answers**): each pane's own query is sent to the selected model **in
  parallel**, the model answers in that pane's language, and every metric comes from the model's own
  runtime counters.
- Token chips under each input show how the `o200k_base` (GPT-4o) tokenizer splits the text.
- The collapsible **Metrics visualised** row charts the comparison (penalty radar, token budget,
  time / memory / cost).

Translation is the only step outside the LLM: small models garble Māori queries badly, so a dedicated
MT model guarantees the LLM receives the exact equivalent question in both languages. Answer quality in
Māori reflects the selected model's real ability.

## Run

Requires [Ollama](https://ollama.com) with at least one model pulled (default `llama3.2`).
On first start the NLLB translation model (~880 MB) is downloaded into `.cache/models`.

```bash
ollama pull llama3.2
cp .env.example .env.local   # optional: OLLAMA_URL / OLLAMA_MODEL (default model in the picker)
npm install
npm run dev
```

## Structure

```
src/
  app/                 # lab page, /report (research paper), API routes (translate, compare → NDJSON, system)
  instrumentation.js   # warms up the translation model at server start
  components/          # panes, inputs, model/language pickers, metrics table, charts, standby animation
  hooks/               # useLiveTranslation, useComparison, useFindings, useAnswerGloss, useDebouncedValue
  lib/                 # isomorphic: tokenization, metrics, stats, report analysis, findings store, validation, API client
  server/              # server-only: Ollama client, model catalog, NLLB translator, services
  config/              # languages, generation settings, pricing
```

## Metrics

| Metric | Source |
| --- | --- |
| Query tokens, word pieces, character packing | `gpt-tokenizer` (o200k_base) on the texts |
| Prompt / answer tokens | Ollama `prompt_eval_count` / `eval_count` for the selected model |
| Time to first token, total waiting time | Ollama `prompt_eval_duration` / `eval_duration` (compute only, no queueing) |
| Memory used | fp16 KV cache: tokens × 2 × layers × KV heads × head dim × 2 B, read from the model's architecture |
| Total cost / cost per word | GPT-4o mini list price, scaled to 1M queries / 1M words |

Each comparison's prompt carries a unique request id so Ollama cannot reuse a cached prefill from an
earlier run. Because answers are generated independently, their lengths differ; use **cost per word**
for a length-fair view.

## Research report

Every comparison runs 3 times (`BENCHMARK.repeats` in `src/config/model.js`) and is saved to the browser's
session findings, one entry per model and language (re-running a language replaces it). **Open research
report** renders all findings for the selected model as a white paper: abstract, method, metric definitions,
a metric × language table (mean ± SD and ratio to paired English runs), one figure per metric across all
languages, limitations, references and an appendix of queries, answers and NLLB back-translations.
Use **Print / Save as PDF** (A4, vector text and charts); the title and author line are editable before printing.

## Semantic agreement

After each comparison the two answers are compared for meaning, locally:

- **Answer, direct** - LaBSE cosine similarity between the English and target-language answers.
- **Answer, via back-translation** - the target answer is translated to English with NLLB and compared with
  all-MiniLM-L6-v2, a cross-check for languages LaBSE represents poorly.
- **Query translation fidelity** - LaBSE similarity of the two queries, separating translation drift from how
  the model answered.

LaBSE scores are rescaled against a baseline of unrelated sentence pairs, so 1 ≈ same meaning and 0 ≈ unrelated.
The workbench shows them as a short everyday reading ("talking about something else", "about 15% more than
English") as well as the number. Scores are stored with each finding and reported in the research paper
(section 2.6, section 3.1, Table 3). The encoders (~500 MB) are downloaded to `.cache/models` on first use.
