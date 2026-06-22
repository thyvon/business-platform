"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import { getColorSchemeStyle, type ColorScheme } from "./dynamic-ui";

export type { ColorScheme } from "./dynamic-ui";

type ColorSchemeContextValue = {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function applyPalette(scheme: ColorScheme) {
  const root = document.documentElement;
  for (const [property, value] of Object.entries(getColorSchemeStyle(scheme))) {
    root.style.setProperty(property, String(value));
  }
}

export function ColorSchemeProvider({ children, initialScheme }: { children: React.ReactNode; initialScheme: ColorScheme }) {
  const [scheme, setSchemeState] = useState<ColorScheme>(initialScheme);
  const hydrated = useRef(false);

  useLayoutEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    applyPalette(scheme);
    localStorage.setItem("color-scheme", scheme);
    document.cookie = `color-scheme=${scheme};path=/;max-age=31536000;SameSite=Lax`;
  }, [scheme]);

  const setScheme = (s: ColorScheme) => setSchemeState(s);

  return (
    <ColorSchemeContext.Provider value={{ scheme, setScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) throw new Error("useColorScheme must be used within ColorSchemeProvider");
  return ctx;
}
