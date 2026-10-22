import { compareRequestSchema, parseOrThrow } from "@/lib/validation";
import { runComparison } from "@/server/comparison-service";
import { errorResponse, readJson } from "@/server/http";
import { assertModelInstalled } from "@/server/model-catalog";

const encoder = new TextEncoder();
const toLine = (event) => encoder.encode(`${JSON.stringify(event)}\n`);

export async function POST(request) {
  let input;
  try {
    input = parseOrThrow(compareRequestSchema, await readJson(request));
    await assertModelInstalled(input.model);
  } catch (error) {
    return errorResponse(error);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runComparison({ ...input, signal: request.signal })) {
          controller.enqueue(toLine(event));
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error(error);
          controller.enqueue(toLine({ type: "error", message: error.message }));
        }
      } finally {
        if (!request.signal.aborted) controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
