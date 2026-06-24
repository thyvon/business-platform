import type { CSSProperties } from "react";

export type ColorScheme = "indigo" | "emerald" | "orange" | "gray";

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
  orange: {
    "50": "#fff7ed", "100": "#ffedd5", "200": "#fed7aa", "300": "#fdba74",
    "400": "#fb923c", "500": "#f97316", "600": "#ea580c", "700": "#c2410c",
    "800": "#9a3412", "900": "#7c2d12", "950": "#431407",
  },
  gray: {
    "50": "#f9fafb", "100": "#f3f4f6", "200": "#e5e7eb", "300": "#d1d5db",
    "400": "#9ca3af", "500": "#6b7280", "600": "#4b5563", "700": "#374151",
    "800": "#1f2937", "900": "#111827", "950": "#030712",
  },
};

const BASE_RADIUS = 0.625; // rem = 10px — matches shadcn default --radius

export function isColorScheme(value: string | undefined): value is ColorScheme {
  return value === "indigo" || value === "emerald" || value === "orange" || value === "gray";
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
  const r = BASE_RADIUS * factor;
  return {
    "--radius": `${r}rem`,
    "--radius-sm": `${r * 0.6}rem`,
    "--radius-md": `${r * 0.8}rem`,
    "--radius-lg": `${r}rem`,
    "--radius-xl": `${r * 1.4}rem`,
    "--radius-2xl": `${r * 1.8}rem`,
    "--radius-3xl": `${r * 2.2}rem`,
    "--radius-4xl": `${r * 2.6}rem`,
  } as unknown as CSSProperties;
}
