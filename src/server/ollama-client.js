import "server-only";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
export const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:latest";

export class OllamaError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "OllamaError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${OLLAMA_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
      cache: "no-store",
    });
  } catch (cause) {
    if (cause.name === "AbortError") throw cause;
    throw new OllamaError(`Cannot reach Ollama at ${OLLAMA_URL}. Is \`ollama serve\` running?`, 503);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OllamaError(`Ollama responded ${response.status}: ${detail}`, response.status);
  }
  return response;
}

export async function fetchTags() {
  const response = await request("/api/tags");
  return (await response.json()).models ?? [];
}

export async function fetchModelDetails(model) {
  const response = await request("/api/show", { method: "POST", body: { model } });
  return response.json();
}

/** Normalises Ollama's nanosecond timings into milliseconds. */
function toUsage(final) {
  const ns = (v) => (v ?? 0) / 1e6;
  return {
    promptTokens: final.prompt_eval_count ?? 0,
    outputTokens: final.eval_count ?? 0,
    totalMs: ns(final.total_duration),
    loadMs: ns(final.load_duration),
    promptEvalMs: ns(final.prompt_eval_duration),
    evalMs: ns(final.eval_duration),
  };
}

/**
 * Streams a chat completion, yielding `{ type: "token", content }` chunks and a
 * final `{ type: "done", usage }` chunk.
 */
export async function* chatStream({ model, messages, options, signal }) {
  const response = await request("/api/chat", {
    method: "POST",
    body: { model, messages, options, stream: true, keep_alive: "15m" },
    signal,
  });
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;

    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;

      const chunk = JSON.parse(line);
      if (chunk.error) throw new OllamaError(chunk.error);
      if (chunk.message?.content) yield { type: "token", content: chunk.message.content };
      if (chunk.done) yield { type: "done", usage: toUsage(chunk) };
    }
  }
}
