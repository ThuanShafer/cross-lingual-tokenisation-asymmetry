import { translateRequestSchema, parseOrThrow } from "@/lib/validation";
import { translate } from "@/server/translation-service";
import { errorResponse, readJson } from "@/server/http";

export async function POST(request) {
  try {
    const input = parseOrThrow(translateRequestSchema, await readJson(request));
    const result = await translate({ ...input, signal: request.signal });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
