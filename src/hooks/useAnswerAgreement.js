"use client";

import { useEffect, useState } from "react";
import { requestAgreement } from "@/lib/api-client";

const TIMEOUT_MS = 120_000;

/**
 * Once both answers are final, fetches the target answer's English
 * back-translation (display only) and its semantic agreement with the
 * English side. Nothing here is ever sent back to the model.
 */
export function useAnswerAgreement({ englishQuery, targetQuery, englishAnswer, targetAnswer, target, enabled }) {
  const request = enabled && englishAnswer.trim() && targetAnswer.trim() ? { englishQuery, targetQuery, englishAnswer, targetAnswer, target } : null;
  const key = request ? JSON.stringify(request) : null;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(TIMEOUT_MS)]);

    requestAgreement({ ...JSON.parse(key), signal })
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (error.name === "TimeoutError") {
          setResult({ key, data: null, error: "Meaning analysis timed out - the local models are busy." });
        } else if (error.name !== "AbortError") {
          setResult({ key, data: null, error: error.message });
        }
      });

    return () => controller.abort();
  }, [key]);

  if (!key) return null;
  if (result.key !== key) return { isLoading: true, backTranslation: null, agreement: null, error: null };
  return { isLoading: false, backTranslation: result.data?.backTranslation ?? null, agreement: result.data?.agreement ?? null, error: result.error };
}
