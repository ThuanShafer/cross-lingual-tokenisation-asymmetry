import { ComparisonWorkbench } from "@/components/ComparisonWorkbench";
import { PRICING } from "@/config/model";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/70">Tokenizer fairness lab</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Cross-Lingual Tokenization Asymmetry
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60">
          Type in either pane - it is translated live into the other. Submit to send each query to the same
          language model, answered in its own language, and compare what each language costs the model.
        </p>
      </header>

      <ComparisonWorkbench />

      <footer className="mt-auto text-center text-[11px] leading-relaxed text-white/35">
        Live query translation by NLLB-200 (600M); answers, token counts and timings come from the selected
        Ollama model&apos;s own runtime counters. Cost uses {PRICING.label} (${PRICING.inputPerMillion}/1M input,
        ${PRICING.outputPerMillion}/1M output). Memory is the model&apos;s fp16 KV-cache footprint of prompt + answer.
      </footer>
    </main>
  );
}
