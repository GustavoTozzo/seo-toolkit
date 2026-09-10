// Paleta validada do skill de data-viz (ver references/palette.md) — hexes exatos, sem
// alteração, já aprovados nos checks de CVD/contraste. Não gerar novas cores por conta
// própria: uma 9ª cor "inventada" quebra as garantias de distinguibilidade.

export const CATEGORICAL_LIGHT = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
] as const;

export const CATEGORICAL_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
] as const;

export const STATUS = {
  light: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
  dark: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
};

export const CHART_THEME = {
  light: {
    surface: "#fcfcfb",
    textPrimary: "#0b0b0b",
    textSecondary: "#52514e",
    muted: "#898781",
    gridline: "#e1e0d9",
    baseline: "#c3c2b7",
    successText: "#006300",
  },
  dark: {
    surface: "#1a1a19",
    textPrimary: "#ffffff",
    textSecondary: "#c3c2b7",
    muted: "#898781",
    gridline: "#2c2c2a",
    baseline: "#383835",
    successText: "#0ca30c",
  },
};

export type ChartMode = "light" | "dark";

export function categorical(mode: ChartMode) {
  return mode === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}
