import "server-only";

export function errorResponse(error) {
  if (error?.name === "AbortError") return new Response(null, { status: 499 });
  const status = error?.status ?? 500;
  if (status >= 500) console.error(error);
  return Response.json({ error: error?.message ?? "Unexpected error" }, { status });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.status = 400;
    throw error;
  }
}
