async function toError(response) {
  const body = await response.json().catch(() => null);
  return new Error(body?.error ?? `Request failed with ${response.status}`);
}

export async function requestTranslation({ text, from, to, signal }) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from, to }),
    signal,
  });
  if (!response.ok) throw await toError(response);
  return response.json();
}

/** Back-translation of the target answer plus its semantic agreement with the English side. */
export async function requestAgreement({ englishQuery, targetQuery, englishAnswer, targetAnswer, target, signal }) {
  const response = await fetch("/api/agreement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ englishQuery, targetQuery, englishAnswer, targetAnswer, target }),
    signal,
  });
  if (!response.ok) throw await toError(response);
  return response.json();
}

/** Reads the NDJSON comparison stream, invoking `onEvent` for each event. */
export async function streamComparison({ englishQuery, targetQuery, target, model, signal, onEvent }) {
  const response = await fetch("/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ englishQuery, targetQuery, target, model }),
    signal,
  });
  if (!response.ok) throw await toError(response);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;

    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === "error") throw new Error(event.message);
      onEvent(event);
    }
  }
}
