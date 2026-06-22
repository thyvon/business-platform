import type { CSSProperties } from "react";

export type ColorScheme = "indigo" | "emerald" | "violet";

const palettes: Record<ColorScheme, Record<string, string>> = {
  indigo: {
    "50": "#eef2ff", "100": "#e0e7ff", "200": "#c7d2fe", "300": "#a5b4fc",
    "400": "#818cf8", "500": "#6366f1", "600": "#4f46e5", "700": "#4338ca",
    "800": "#3730a3", "900": "#312e81", "950": "#1e1b4b",
  },
  emerald: {
    "50": "#ecfdf5", "100": "#d1fae5", "200": "#a7f3d0", "300": "#6ee7b7",
    "400": "#34d399", "500": "#10b981", "600": "#059669", "700": "#047857",
    "800": "#065f46", "900": "#064e3b", "950": "#022c22",
  },
  violet: {
    "50": "#f5f3ff", "100": "#ede9fe", "200": "#ddd6fe", "300": "#c4b5fd",
    "400": "#a78bfa", "500": "#8b5cf6", "600": "#7c3aed", "700": "#6d28d9",
    "800": "#5b21b6", "900": "#4c1d95", "950": "#2e1065",
  },
};

const baseRadii: Record<string, string> = {
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
};

export function isColorScheme(value: string | undefined): value is ColorScheme {
  return value === "indigo" || value === "emerald" || value === "violet";
}

export function getColorSchemeStyle(scheme: ColorScheme): CSSProperties {
  return Object.fromEntries(
    Object.entries(palettes[scheme]).map(([shade, value]) => [`--color-indigo-${shade}`, value]),
  ) as CSSProperties;
}

export function parseCornerRadius(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  return parsed >= 0 && parsed <= 20 ? parsed : null;
}

export function getCornerRadiusStyle(value: number): CSSProperties {
  const factor = value / 10;
  return Object.fromEntries(
    Object.entries(baseRadii).map(([key, base]) => [
      `--radius-${key}`,
      `${Number.parseFloat(base) * factor}rem`,
    ]),
  ) as CSSProperties;
}
