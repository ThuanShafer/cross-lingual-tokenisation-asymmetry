import "server-only";
import path from "node:path";
import { env } from "@huggingface/transformers";

env.cacheDir = process.env.MODEL_CACHE_DIR ?? path.join(process.cwd(), ".cache", "models");

/**
 * Lazily creates a model once per process. Stored on `globalThis` so dev
 * hot-reloads don't load a second copy of a multi-hundred-MB model.
 */
export function singleton(key, factory) {
  const store = (globalThis.__transformersModels ??= new Map());
  if (!store.has(key)) {
    const promise = factory().catch((error) => {
      store.delete(key);
      throw error;
    });
    store.set(key, promise);
  }
  return store.get(key);
}

/**
 * Runs jobs one at a time (ONNX inference is CPU-bound) and skips jobs whose
 * caller already gave up.
 */
export function createSerialQueue() {
  let tail = Promise.resolve();
  return function enqueue(job, signal) {
    const run = tail.then(() => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      return job();
    });
    tail = run.catch(() => {});
    return run;
  };
}

/** One queue for every local model, so translation and embeddings never compete for the CPU. */
export const enqueueInference = (globalThis.__inferenceQueue ??= createSerialQueue());
