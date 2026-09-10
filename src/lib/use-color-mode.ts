"use client";

import { useSyncExternalStore } from "react";
import type { ChartMode } from "./chart-colors";

const QUERY = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): ChartMode {
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function getServerSnapshot(): ChartMode {
  return "light";
}

export function useColorMode(): ChartMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
