"use client";

import { useSyncExternalStore } from "react";
import { getResolvedTheme, setThemePreference, subscribeResolvedTheme } from "@/lib/theme";

function getServerSnapshot() {
  return "light" as const;
}

export default function ThemeToggle() {
  const resolved = useSyncExternalStore(subscribeResolvedTheme, getResolvedTheme, getServerSnapshot);
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => setThemePreference(isDark ? "light" : "dark")}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-border/40 hover:text-foreground"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
        </svg>
      )}
    </button>
  );
}
