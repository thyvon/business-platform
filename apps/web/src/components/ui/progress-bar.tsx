"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ProgressBar() {
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [state, setState] = useState({ visible: false, width: 0 });

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ visible: true, width: 0 });

    requestAnimationFrame(() => {
      setState({ visible: true, width: 65 });
    });

    timerRef.current = setTimeout(() => {
      setState({ visible: true, width: 100 });
      setTimeout(() => setState({ visible: false, width: 0 }), 300);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!state.visible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] h-0.5 bg-slate-200 dark:bg-slate-700">
      <div
        className="h-full bg-indigo-600 transition-all duration-500 ease-out"
        style={{ width: `${state.width}%` }}
      />
    </div>
  );
}
