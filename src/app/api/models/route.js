import { connection } from "next/server";
import { errorResponse } from "@/server/http";
import { listModels } from "@/server/model-catalog";

/** Installed Ollama models. Read per request so the lab page itself can stay a complete static shell. */
export async function GET() {
  await connection();
  try {
    return Response.json(await listModels());
  } catch (error) {
    return errorResponse(error);
  }
}
