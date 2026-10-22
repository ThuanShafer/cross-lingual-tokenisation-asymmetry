import "server-only";
import { randomUUID } from "node:crypto";
import { SOURCE_LANGUAGE } from "@/config/languages";
import { generateAnswer } from "./generation-service";
import { getModelProfile } from "./model-catalog";
import { mergeAsync } from "./streams";

async function* answerSide({ side, model, query, language, requestId, signal }) {
  yield { side, type: "phase", phase: "generating" };
  let answer = "";
  for await (const event of generateAnswer({ model, query, language, requestId, signal })) {
    if (event.type === "token") {
      answer += event.content;
      yield { side, type: "token", content: event.content };
    } else if (event.type === "done") {
      yield { side, type: "usage", query, answer, usage: event.usage };
    }
  }
}

/**
 * Sends each pane's own query to the same LLM in parallel; each is answered in
 * its own language and measured from the model's real runtime counters.
 *
 * Yields `{ type: "model" }` once, then `{ side, type: "phase" | "token" | "usage" }` events.
 */
export async function* runComparison({ englishQuery, targetQuery, target, model, signal }) {
  yield { type: "model", model: await getModelProfile(model) };

  const requestId = randomUUID().slice(0, 8);
  yield* mergeAsync([
    answerSide({ side: "left", model, query: englishQuery, language: SOURCE_LANGUAGE.code, requestId, signal }),
    answerSide({ side: "right", model, query: targetQuery, language: target, requestId, signal }),
  ]);
}
