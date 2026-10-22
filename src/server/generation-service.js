import "server-only";
import { getLanguage } from "@/config/languages";
import { GENERATION } from "@/config/model";
import { chatStream } from "./ollama-client";

/**
 * `requestId` makes every comparison's prompt unique so Ollama can't reuse a
 * cached prefill from an earlier run, which would distort the timings.
 */
function buildAnswerMessages(query, languageCode, requestId) {
  const language = getLanguage(languageCode);
  return [
    {
      role: "system",
      content:
        `[Request ${requestId}] You are a helpful assistant. Always answer entirely in ${language.name}. ` +
        "Reply in exactly two short sentences. Never mention being an AI or lacking real-time data; " +
        "if unsure, give a plausible general answer.",
    },
    { role: "user", content: query },
  ];
}

/** Yields streamed answer tokens followed by a `done` event carrying the model's usage counters. */
export function generateAnswer({ model, query, language, requestId, signal }) {
  return chatStream({
    model,
    messages: buildAnswerMessages(query, language, requestId),
    options: {
      temperature: 0.2,
      seed: 42,
      num_ctx: GENERATION.contextWindow,
      num_predict: GENERATION.maxOutputTokens,
    },
    signal,
  });
}
