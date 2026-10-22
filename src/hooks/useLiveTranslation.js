"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { requestTranslation } from "@/lib/api-client";
import { useDebouncedValue } from "./useDebouncedValue";

const DEBOUNCE_MS = 550;
const toKey = ({ from, to, text }) => JSON.stringify([from, to, text.trim()]);

/**
 * Translates `text` from `from` to `to` as the user types, debouncing
 * keystrokes, cancelling stale requests and discarding out-of-date results.
 */
export function useLiveTranslation({ from, to, text }, onTranslated) {
  const key = toKey({ from, to, text });
  const debouncedKey = useDebouncedValue(key, DEBOUNCE_MS);
  const [settled, setSettled] = useState({ key: null, error: null });

  const deliver = useEffectEvent((forKey, translation) => {
    if (forKey === key) onTranslated(translation);
  });

  useEffect(() => {
    const [jobFrom, jobTo, jobText] = JSON.parse(debouncedKey);
    if (!jobText) return;

    const controller = new AbortController();

    requestTranslation({ from: jobFrom, to: jobTo, text: jobText, signal: controller.signal })
      .then(({ translation }) => {
        deliver(debouncedKey, translation);
        setSettled({ key: debouncedKey, error: null });
      })
      .catch((error) => {
        if (error.name !== "AbortError") setSettled({ key: debouncedKey, error: error.message });
      });

    return () => controller.abort();
  }, [debouncedKey]);

  const hasText = Boolean(text.trim());
  return {
    isTranslating: hasText && settled.key !== key,
    error: hasText && settled.key === key ? settled.error : null,
  };
}
