"use client";

import { useSyncExternalStore } from "react";
import { findingsStore } from "@/lib/findings-store";

export function useFindings() {
  return useSyncExternalStore(findingsStore.subscribe, findingsStore.getSnapshot, findingsStore.getServerSnapshot);
}
