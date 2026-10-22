import { agreementRequestSchema, parseOrThrow } from "@/lib/validation";
import { analyzeAgreement } from "@/server/agreement-service";
import { errorResponse, readJson } from "@/server/http";

export async function POST(request) {
  try {
    const input = parseOrThrow(agreementRequestSchema, await readJson(request));
    return Response.json(await analyzeAgreement({ ...input, signal: request.signal }));
  } catch (error) {
    return errorResponse(error);
  }
}
