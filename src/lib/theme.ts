// Loja de preferência de tema (light/dark/system) com um pub-sub próprio — a mesma ideia
// de bibliotecas como next-themes, feita à mão para não trazer uma dependência só para
// isso. A escolha explícita persiste em localStorage; sem escolha, segue o sistema.

const STORAGE_KEY = "seo-toolkit-theme";
const listeners = new Set<() => void>();

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function getResolvedTheme(): ResolvedTheme {
  const pref = getThemePreference();
  if (pref !== "system") return pref;
  if (typeof window === "undefined") return "light";
  return systemPrefersDark() ? "dark" : "light";
}

function applyToDocument(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function setThemePreference(pref: ThemePreference): void {
  try {
    if (pref === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // localStorage indisponível (modo privado etc.) — a escolha só não persiste entre visitas
  }
  applyToDocument(getResolvedTheme());
  listeners.forEach((listener) => listener());
}

export function subscribeResolvedTheme(callback: () => void): () => void {
  listeners.add(callback);

  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    // Só re-aplica no <html> se a escolha ainda for "system" — uma preferência explícita
    // não deve ser sobrescrita por uma mudança no tema do SO.
    if (getThemePreference() === "system") applyToDocument(getResolvedTheme());
    callback();
  };
  mql.addEventListener("change", onSystemChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    applyToDocument(getResolvedTheme());
    callback();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(callback);
    mql.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
  };
}
