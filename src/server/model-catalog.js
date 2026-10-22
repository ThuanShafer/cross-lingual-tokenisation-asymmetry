import "server-only";
import { DEFAULT_MODEL, fetchModelDetails, fetchTags } from "./ollama-client";

const FP16_BYTES = 2;
const profiles = new Map();

/** Installed Ollama models that can generate text (embedding-only models are excluded). */
export async function listModels() {
  const tags = await fetchTags();
  const models = tags
    .filter((m) => !m.details?.family?.includes("bert"))
    .map((m) => ({
      name: m.name,
      family: m.details?.family ?? "unknown",
      parameterSize: m.details?.parameter_size ?? "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const defaultModel = models.find((m) => m.name === DEFAULT_MODEL)?.name ?? models[0]?.name ?? null;
  return { models, defaultModel };
}

function architectureValue(info, suffix) {
  const key = Object.keys(info).find((k) => k.endsWith(`.${suffix}`));
  return key ? info[key] : undefined;
}

/**
 * Architecture facts needed for the memory metric. KV cache per token =
 * 2 (K and V) × layers × KV heads × head dim × bytes per value.
 */
export async function getModelProfile(name) {
  if (!profiles.has(name)) {
    const promise = fetchModelDetails(name).then(({ model_info: info = {}, details = {} }) => {
      const layers = architectureValue(info, "block_count") ?? 0;
      const heads = architectureValue(info, "attention.head_count") ?? 1;
      const kvHeads = architectureValue(info, "attention.head_count_kv") ?? heads;
      const headDim =
        architectureValue(info, "attention.key_length") ?? (architectureValue(info, "embedding_length") ?? 0) / heads;

      return {
        name,
        family: details.family ?? "unknown",
        parameterSize: details.parameter_size ?? "",
        quantization: details.quantization_level ?? "",
        layers,
        kvHeads,
        headDim,
        kvCacheBytesPerToken: 2 * layers * kvHeads * headDim * FP16_BYTES,
      };
    });
    profiles.set(name, promise.catch((error) => {
      profiles.delete(name);
      throw error;
    }));
  }
  return profiles.get(name);
}

export async function assertModelInstalled(name) {
  const { models } = await listModels();
  if (!models.some((m) => m.name === name)) {
    const error = new Error(`Model "${name}" is not installed in Ollama`);
    error.status = 400;
    throw error;
  }
}
