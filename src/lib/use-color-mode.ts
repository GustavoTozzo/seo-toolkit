"use client";

import { useSyncExternalStore } from "react";
import type { ChartMode } from "./chart-colors";
import { getResolvedTheme, subscribeResolvedTheme } from "./theme";

function getServerSnapshot(): ChartMode {
  return "light";
}

export function useColorMode(): ChartMode {
  return useSyncExternalStore(subscribeResolvedTheme, getResolvedTheme, getServerSnapshot);
}
