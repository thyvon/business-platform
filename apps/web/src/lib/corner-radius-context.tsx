"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import { getCornerRadiusStyle } from "./dynamic-ui";

function applyRadius(value: number) {
  const root = document.documentElement;
  for (const [property, radius] of Object.entries(getCornerRadiusStyle(value))) {
    root.style.setProperty(property, String(radius));
  }
}

type CornerRadiusContextValue = {
  value: number;
  setValue: (v: number) => void;
};

const CornerRadiusContext = createContext<CornerRadiusContextValue | null>(null);

export function CornerRadiusProvider({ children, initialValue }: { children: React.ReactNode; initialValue: number }) {
  const [value, setValueState] = useState(initialValue);
  const hydrated = useRef(false);

  useLayoutEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    applyRadius(value);
    localStorage.setItem("corner-radius", String(value));
    document.cookie = `corner-radius=${value};path=/;max-age=31536000;SameSite=Lax`;
  }, [value]);

  const setValue = (v: number) => setValueState(Math.min(20, Math.max(0, Math.round(v))));

  return (
    <CornerRadiusContext.Provider value={{ value, setValue }}>
      {children}
    </CornerRadiusContext.Provider>
  );
}

export function useCornerRadius() {
  const ctx = useContext(CornerRadiusContext);
  if (!ctx) throw new Error("useCornerRadius must be used within CornerRadiusProvider");
  return ctx;
}
